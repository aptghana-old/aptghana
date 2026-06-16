import { NextRequest, NextResponse } from "next/server";
import { connectDB, CategoryModel, recordAudit } from "@apt/db";
import { requirePermission } from "@/lib/auth/require";
import { auth } from "@/lib/auth";
import { resolveHierarchyFields, HierarchyError } from "@/lib/categoryHierarchy";
import { slugify, categoryCreateSchema, parseBody } from "@apt/types";

export async function POST(req: NextRequest) {
  const deny = await requirePermission("categories:create");
  if (deny) return deny;
  try {
    await connectDB();
    const session = await auth();
    const parsed = parseBody(categoryCreateSchema, await req.json());
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 422 });
    const body = parsed.data;

    const slug = (body.slug?.trim() || slugify(body.name)).toLowerCase();
    const existing = await CategoryModel.findOne({ slug });
    if (existing) {
      return NextResponse.json({ error: `Slug "${slug}" already exists` }, { status: 409 });
    }

    let hierarchy;
    try {
      hierarchy = await resolveHierarchyFields(body.parentId || null, slug);
    } catch (e) {
      if (e instanceof HierarchyError) return NextResponse.json({ error: e.message }, { status: 422 });
      throw e;
    }

    const doc: Record<string, unknown> = {
      slug,
      name: body.name.trim(),
      shortDescription: body.shortDescription ?? "",
      description: body.description ?? "",
      level: hierarchy.level,
      parentId: hierarchy.parentId,
      ancestors: hierarchy.ancestors,
      path: hierarchy.path,
      status: body.status ?? "active",
      isFeatured: body.isFeatured ?? false,
      displayOrder: body.displayOrder ?? 0,
    };

    if (body.imageUrl) doc.image = { url: body.imageUrl, alt: body.name.trim() };
    if (body.icon) doc.icon = body.icon;
    if (body.documents?.length) doc.documents = body.documents;
    if (body.benefits?.length) doc.benefits = body.benefits;
    if (body.bulletPoints?.length) doc.bulletPoints = body.bulletPoints;
    if (body.products?.length) doc.products = body.products;
    if (body.brands?.length) doc.brands = body.brands;
    if (body.applications?.length) doc.applications = body.applications;
    if (body.seoTitle || body.seoDescription) {
      doc.seo = { title: body.seoTitle ?? "", description: body.seoDescription ?? "" };
    }

    const cat = await CategoryModel.create(doc);

    await recordAudit({
      entityType: "category",
      entityId: cat._id,
      action: "category_created",
      actor: { type: "sales", id: session?.user?.id, name: session?.user?.name ?? "Admin" },
      message: `Created ${hierarchy.level} "${cat.name}"`,
    });

    return NextResponse.json({ id: String(cat._id) }, { status: 201 });
  } catch (err) {
    console.error("POST /api/categories", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
