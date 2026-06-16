import { NextRequest, NextResponse } from "next/server";
import { connectDB, CategoryModel, recordAudit } from "@apt/db";
import { requirePermission } from "@/lib/auth/require";
import { auth } from "@/lib/auth";
import { resolveHierarchyFields, reparentDescendants, assertDeletable, HierarchyError } from "@/lib/categoryHierarchy";
import { slugify } from "@apt/types";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const deny = await requirePermission("categories:view");
  if (deny) return deny;
  try {
    await connectDB();
    const { id } = await params;
    const cat = await CategoryModel.findById(id).lean<{
      name: string; slug: string; shortDescription?: string; description?: string; level: string; status: string;
      isFeatured?: boolean; displayOrder?: number; image?: { url?: string }; icon?: string;
      documents?: { type: string; title: string; url: string; language: string }[];
      benefits?: { title: string; value: string }[]; bulletPoints?: string[];
      products?: string[]; brands?: string[]; applications?: string[]; seo?: { title?: string; description?: string };
    }>();
    if (!cat) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({
      name: cat.name, slug: cat.slug, shortDescription: cat.shortDescription ?? "", description: cat.description ?? "",
      level: cat.level, status: cat.status, isFeatured: cat.isFeatured ?? false, displayOrder: cat.displayOrder ?? 0,
      imageUrl: cat.image?.url ?? "", icon: cat.icon ?? "", documents: cat.documents ?? [], benefits: cat.benefits ?? [],
      bulletPoints: cat.bulletPoints ?? [], products: cat.products ?? [], brands: cat.brands ?? [], applications: cat.applications ?? [],
      seoTitle: cat.seo?.title ?? "", seoDescription: cat.seo?.description ?? "",
    });
  } catch (err) {
    console.error("GET /api/categories/[id]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const deny = await requirePermission("categories:edit");
  if (deny) return deny;
  try {
    await connectDB();
    const session = await auth();
    const { id } = await params;
    const body = await req.json();

    const cat = await CategoryModel.findById(id);
    if (!cat) return NextResponse.json({ error: "Category not found" }, { status: 404 });

    const updates: Record<string, unknown> = {};

    if (body.name !== undefined) updates.name = body.name.trim();
    if (body.shortDescription !== undefined) updates.shortDescription = body.shortDescription;
    if (body.description !== undefined) updates.description = body.description;
    if (body.status !== undefined) updates.status = body.status;
    if (body.isFeatured !== undefined) updates.isFeatured = body.isFeatured;
    if (body.displayOrder !== undefined) updates.displayOrder = body.displayOrder;
    if (body.imageUrl !== undefined) updates.image = { url: body.imageUrl, alt: (body.name ?? cat.name).trim() };
    if (body.icon !== undefined) updates.icon = body.icon;
    if (body.documents !== undefined) updates.documents = body.documents;
    if (body.benefits !== undefined) updates.benefits = body.benefits;
    if (body.bulletPoints !== undefined) updates.bulletPoints = body.bulletPoints;
    if (body.products !== undefined) updates.products = body.products;
    if (body.brands !== undefined) updates.brands = body.brands;
    if (body.applications !== undefined) updates.applications = body.applications;
    if (body.seoTitle !== undefined || body.seoDescription !== undefined) {
      updates.seo = { title: body.seoTitle ?? cat.seo?.title ?? "", description: body.seoDescription ?? cat.seo?.description ?? "" };
    }

    // Slug/parent changes both ripple into ancestors/path — recompute together.
    let slugChanged = false;
    let nextSlug = cat.slug;
    if (body.slug !== undefined) {
      nextSlug = (body.slug.trim() || slugify(body.name ?? cat.name)).toLowerCase();
      if (nextSlug !== cat.slug) {
        const clash = await CategoryModel.findOne({ slug: nextSlug, _id: { $ne: id } });
        if (clash) return NextResponse.json({ error: `Slug "${nextSlug}" already exists` }, { status: 409 });
        updates.slug = nextSlug;
        slugChanged = true;
      }
    }

    const parentChanged = body.parentId !== undefined && String(body.parentId || "") !== String(cat.parentId ?? "");
    if (parentChanged && body.parentId) {
      if (String(body.parentId) === id) {
        return NextResponse.json({ error: "A category cannot be its own parent" }, { status: 422 });
      }
      const cycle = await CategoryModel.exists({ _id: body.parentId, ancestors: id });
      if (cycle) {
        return NextResponse.json({ error: "Cannot move a category under one of its own descendants" }, { status: 422 });
      }
    }
    if (parentChanged || slugChanged) {
      try {
        const hierarchy = await resolveHierarchyFields(parentChanged ? (body.parentId || null) : (cat.parentId ? String(cat.parentId) : null), nextSlug);
        updates.level = hierarchy.level;
        updates.parentId = hierarchy.parentId;
        updates.ancestors = hierarchy.ancestors;
        updates.path = hierarchy.path;
      } catch (e) {
        if (e instanceof HierarchyError) return NextResponse.json({ error: e.message }, { status: 422 });
        throw e;
      }
    }

    await CategoryModel.updateOne({ _id: id }, { $set: updates });

    if (parentChanged || slugChanged) {
      await reparentDescendants(id);
    }

    await recordAudit({
      entityType: "category",
      entityId: cat._id,
      action: parentChanged ? "category_moved" : "category_updated",
      actor: { type: "sales", id: session?.user?.id, name: session?.user?.name ?? "Admin" },
      message: parentChanged ? `Moved "${cat.name}"` : `Updated "${cat.name}"`,
      meta: { fields: Object.keys(updates) },
    });

    return NextResponse.json({ id });
  } catch (err) {
    console.error("PATCH /api/categories/[id]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const deny = await requirePermission("categories:delete");
  if (deny) return deny;
  try {
    await connectDB();
    const session = await auth();
    const { id } = await params;

    const cat = await CategoryModel.findById(id).select("name");
    if (!cat) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const check = await assertDeletable(id);
    if (!check.deletable) {
      return NextResponse.json({ error: check.reason }, { status: 409 });
    }

    await CategoryModel.deleteOne({ _id: id });

    await recordAudit({
      entityType: "category",
      entityId: id,
      action: "category_deleted",
      actor: { type: "sales", id: session?.user?.id, name: session?.user?.name ?? "Admin" },
      message: `Deleted "${cat.name}"`,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/categories/[id]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
