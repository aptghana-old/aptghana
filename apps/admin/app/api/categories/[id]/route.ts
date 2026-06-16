import { NextRequest, NextResponse } from "next/server";
import { connectDB, CategoryModel } from "@apt/db";
import { requirePermission } from "@/lib/auth/require";

function slugify(text: string) {
  return text.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").trim();
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const deny = await requirePermission("categories:edit");
  if (deny) return deny;
  try {
    await connectDB();
    const { id } = await params;
    const body = await req.json();

    const cat = await CategoryModel.findById(id);
    if (!cat) return NextResponse.json({ error: "Category not found" }, { status: 404 });

    const updates: Record<string, unknown> = {};

    if (body.name !== undefined)             updates.name             = body.name.trim();
    if (body.slug !== undefined)             updates.slug             = (body.slug.trim() || slugify(body.name ?? cat.name)).toLowerCase();
    if (body.shortDescription !== undefined) updates.shortDescription = body.shortDescription;
    if (body.description !== undefined)      updates.description      = body.description;
    if (body.level !== undefined)            updates.level            = body.level;
    if (body.status !== undefined)           updates.status           = body.status;
    if (body.isFeatured !== undefined)       updates.isFeatured       = body.isFeatured;
    if (body.displayOrder !== undefined)     updates.displayOrder     = body.displayOrder;
    if (body.imageUrl !== undefined)         updates.image            = { url: body.imageUrl, alt: (body.name ?? cat.name).trim() };
    if (body.benefits !== undefined)         updates.benefits         = body.benefits;
    if (body.bulletPoints !== undefined)     updates.bulletPoints     = body.bulletPoints;
    if (body.products !== undefined)         updates.products         = body.products;
    if (body.brands !== undefined)           updates.brands           = body.brands;
    if (body.applications !== undefined)     updates.applications     = body.applications;

    await CategoryModel.updateOne({ _id: id }, { $set: updates });
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
    const { id } = await params;
    const result = await CategoryModel.deleteOne({ _id: id });
    if (result.deletedCount === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/categories/[id]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
