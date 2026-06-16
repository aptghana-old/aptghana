import { NextRequest, NextResponse } from "next/server";
import { connectDB, ServiceModel } from "@apt/db";
import { requirePermission } from "@/lib/auth/require";
import { slugify } from "@apt/types";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const deny = await requirePermission('content:edit');
  if (deny) return deny;
  try {
    await connectDB();
    const { id } = await params;
    const body = await req.json();

    const doc = await ServiceModel.findById(id);
    if (!doc) return NextResponse.json({ error: "Service not found" }, { status: 404 });

    const updates: Record<string, unknown> = {};

    if (body.title !== undefined)        updates.title        = body.title.trim();
    if (body.slug !== undefined)         updates.slug         = (body.slug.trim() || slugify(body.title ?? doc.title)).toLowerCase();
    if (body.description !== undefined)  updates.description  = body.description;
    if (body.section !== undefined)      updates.section      = body.section;
    if (body.iconName !== undefined)     updates.iconName     = body.iconName;
    if (body.displayOrder !== undefined) updates.displayOrder = body.displayOrder;
    if (body.status !== undefined)       updates.status       = body.status;

    await ServiceModel.updateOne({ _id: id }, { $set: updates });
    return NextResponse.json({ id });
  } catch (err) {
    console.error("PATCH /api/services/[id]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const deny = await requirePermission('content:edit');
  if (deny) return deny;
  try {
    await connectDB();
    const { id } = await params;
    const result = await ServiceModel.deleteOne({ _id: id });
    if (result.deletedCount === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/services/[id]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
