import { NextRequest, NextResponse } from "next/server";
import { connectDB, CategoryModel } from "@apt/db";
import { requirePermission } from "@/lib/auth/require";

function slugify(text: string) {
  return text.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").trim();
}

export async function POST(req: NextRequest) {
  const deny = await requirePermission('categories:create');
  if (deny) return deny;
  try {
    await connectDB();
    const body = await req.json();

    if (!body.name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const slug = (body.slug?.trim() || slugify(body.name)).toLowerCase();
    const existing = await CategoryModel.findOne({ slug });
    if (existing) {
      return NextResponse.json({ error: `Slug "${slug}" already exists` }, { status: 409 });
    }

    const doc: Record<string, unknown> = {
      slug,
      name: body.name.trim(),
      shortDescription: body.shortDescription ?? "",
      description: body.description ?? "",
      level: body.level ?? "category",
      status: body.status ?? "active",
      isFeatured: body.isFeatured ?? false,
      displayOrder: body.displayOrder ?? 0,
    };

    if (body.imageUrl) doc.image = { url: body.imageUrl, alt: body.name.trim() };
    if (body.benefits?.length)      doc.benefits      = body.benefits;
    if (body.bulletPoints?.length)  doc.bulletPoints  = body.bulletPoints;
    if (body.products?.length)      doc.products      = body.products;
    if (body.brands?.length)        doc.brands        = body.brands;
    if (body.applications?.length)  doc.applications  = body.applications;

    const cat = await CategoryModel.create(doc);
    return NextResponse.json({ id: String(cat._id) }, { status: 201 });
  } catch (err) {
    console.error("POST /api/categories", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
