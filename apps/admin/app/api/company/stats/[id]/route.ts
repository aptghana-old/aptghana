import { NextRequest, NextResponse } from "next/server";
import { connectDB, CompanyStatModel } from "@apt/db";
import { requirePermission } from "@/lib/auth/require";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const deny = await requirePermission('content:edit');
  if (deny) return deny;
  try {
    await connectDB();
    const { id } = await params;
    const body = await req.json();

    const doc = await CompanyStatModel.findById(id);
    if (!doc) return NextResponse.json({ error: "Stat not found" }, { status: 404 });

    const updates: Record<string, unknown> = {};
    if (body.value !== undefined)        updates.value        = body.value;
    if (body.label !== undefined)        updates.label        = body.label;
    if (body.displayOrder !== undefined) updates.displayOrder = body.displayOrder;
    if (body.status !== undefined)       updates.status       = body.status;

    await CompanyStatModel.updateOne({ _id: id }, { $set: updates });
    return NextResponse.json({ id });
  } catch (err) {
    console.error("PATCH /api/company/stats/[id]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const deny = await requirePermission('content:edit');
  if (deny) return deny;
  try {
    await connectDB();
    const { id } = await params;
    const result = await CompanyStatModel.deleteOne({ _id: id });
    if (result.deletedCount === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/company/stats/[id]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
