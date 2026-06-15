import { NextRequest, NextResponse } from "next/server";
import { connectDB, BrandModel } from "@apt/db";
import { requireAdmin } from "@/lib/auth/require";

function slugify(text: string) {
  return text.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").trim();
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const deny = await requireAdmin();
  if (deny) return deny;
  try {
    await connectDB();
    const { id } = await params;
    const body = await req.json();
    const { name, slug, description, country, website, logoUrl, status, isFeatured } = body;

    const brand = await BrandModel.findById(id);
    if (!brand) return NextResponse.json({ error: "Brand not found" }, { status: 404 });

    if (slug && slug !== brand.slug) {
      const conflict = await BrandModel.findOne({ slug: slug.toLowerCase(), _id: { $ne: id } });
      if (conflict) return NextResponse.json({ error: `Slug "${slug}" is already in use` }, { status: 409 });
    }

    const updates: Record<string, unknown> = {};
    if (name !== undefined)        updates.name = name.trim();
    if (slug !== undefined)        updates.slug = (slug.trim() || slugify(name ?? brand.name)).toLowerCase();
    if (description !== undefined) updates.description = description.trim();
    if (country !== undefined)     updates.country = country || undefined;
    if (website !== undefined)     updates.website = website?.trim() || undefined;
    if (logoUrl !== undefined)     updates.logo = { url: logoUrl.trim(), alt: (name ?? brand.name).trim() };
    if (status !== undefined)      updates.status = status;
    if (isFeatured !== undefined)  updates.isFeatured = isFeatured;

    await BrandModel.updateOne({ _id: id }, { $set: updates });
    return NextResponse.json({ id });
  } catch (err) {
    console.error("PATCH /api/brands/[id]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const deny = await requireAdmin();
  if (deny) return deny;
  try {
    await connectDB();
    const { id } = await params;
    const result = await BrandModel.deleteOne({ _id: id });
    if (result.deletedCount === 0) return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/brands/[id]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
