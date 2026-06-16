import { NextRequest, NextResponse } from "next/server";
import { connectDB, IndustryModel } from "@apt/db";
import { requirePermission } from "@/lib/auth/require";
import { slugify } from "@apt/types";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const deny = await requirePermission('content:edit');
  if (deny) return deny;
  try {
    await connectDB();
    const { id } = await params;
    const body = await req.json();

    const doc = await IndustryModel.findById(id);
    if (!doc) return NextResponse.json({ error: "Industry not found" }, { status: 404 });

    const updates: Record<string, unknown> = {};

    if (body.name !== undefined)             updates.name = body.name.trim();
    if (body.slug !== undefined)             updates.slug = (body.slug.trim() || slugify(body.name ?? doc.name)).toLowerCase();
    if (body.tagline !== undefined)          updates.tagline = body.tagline;
    if (body.shortDescription !== undefined) updates.shortDescription = body.shortDescription;
    if (body.challenge !== undefined)        updates.challenge = body.challenge;
    if (body.solutions !== undefined)        updates.solutions = Array.isArray(body.solutions) ? body.solutions.filter(Boolean) : [];
    if (body.brands !== undefined)           updates.brands = Array.isArray(body.brands) ? body.brands.filter(Boolean) : [];
    if (body.clients !== undefined)          updates.clients = body.clients;
    if (body.icon !== undefined)             updates.icon = body.icon;
    if (body.accentColor !== undefined)      updates.accentColor = body.accentColor;
    if (body.displayOrder !== undefined)     updates.displayOrder = body.displayOrder;
    if (body.isFeatured !== undefined)       updates.isFeatured = body.isFeatured;
    if (body.status !== undefined)           updates.status = body.status;
    if (body.imageUrl !== undefined)         updates.image = { url: body.imageUrl, alt: (body.name ?? doc.name).trim() };

    await IndustryModel.updateOne({ _id: id }, { $set: updates });
    return NextResponse.json({ id });
  } catch (err) {
    console.error("PATCH /api/industries/[id]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const deny = await requirePermission('content:edit');
  if (deny) return deny;
  try {
    await connectDB();
    const { id } = await params;
    await IndustryModel.updateOne({ _id: id }, { $set: { status: "inactive" } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/industries/[id]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
