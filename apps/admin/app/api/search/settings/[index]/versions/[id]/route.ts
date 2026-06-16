import { NextRequest, NextResponse } from "next/server";
import { connectDB, SearchConfigModel } from "@apt/db";
import { requirePermission } from "@/lib/auth/require";

type Params = { params: Promise<{ index: string; id: string }> };

/** GET /api/search/settings/[index]/versions/[id] — full version including settings */
export async function GET(_req: NextRequest, { params }: Params) {
  const deny = await requirePermission("search:view");
  if (deny) return deny;

  const { index, id } = await params;

  try {
    await connectDB();
    const doc = await SearchConfigModel.findOne({ _id: id, index }).lean();
    if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ config: doc });
  } catch (err) {
    return NextResponse.json({ error: "Operation failed" }, { status: 500 });
  }
}

/** PUT /api/search/settings/[index]/versions/[id] — update note only */
export async function PUT(req: NextRequest, { params }: Params) {
  const deny = await requirePermission("search:edit");
  if (deny) return deny;

  const { index, id } = await params;

  let body: { note?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    await connectDB();
    const doc = await SearchConfigModel.findOneAndUpdate(
      { _id: id, index },
      { $set: { note: body.note ?? "" } },
      { new: true },
    ).lean();
    if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ config: doc });
  } catch (err) {
    return NextResponse.json({ error: "Operation failed" }, { status: 500 });
  }
}

/** DELETE /api/search/settings/[index]/versions/[id] — cannot delete active version */
export async function DELETE(_req: NextRequest, { params }: Params) {
  const deny = await requirePermission("search:edit");
  if (deny) return deny;

  const { index, id } = await params;

  try {
    await connectDB();
    const doc = await SearchConfigModel.findOne({ _id: id, index }).select("isActive").lean();
    if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (doc.isActive) {
      return NextResponse.json(
        { error: "Cannot delete the active configuration. Apply another version first." },
        { status: 409 },
      );
    }
    await SearchConfigModel.deleteOne({ _id: id, index });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: "Operation failed" }, { status: 500 });
  }
}
