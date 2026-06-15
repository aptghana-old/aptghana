import { NextRequest, NextResponse } from "next/server";
import { connectDB, SearchConfigModel } from "@apt/db";
import { requireAdmin } from "@/lib/auth/require";
import { auth } from "@/lib/auth";

type Params = { params: Promise<{ index: string; id: string }> };

/**
 * POST /api/search/settings/[index]/versions/[id]/duplicate
 * Creates a new draft version from an existing one.
 * Body: { note?: string }
 */
export async function POST(req: NextRequest, { params }: Params) {
  const deny = await requireAdmin();
  if (deny) return deny;

  const { index, id } = await params;

  let body: { note?: string } = {};
  try {
    body = await req.json();
  } catch { /* optional body */ }

  try {
    await connectDB();
    const session = await auth();
    const adminName = session?.user?.email ?? "unknown";

    const source = await SearchConfigModel.findOne({ _id: id, index }).lean();
    if (!source) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const last = await SearchConfigModel.findOne({ index })
      .sort({ version: -1 })
      .select("version")
      .lean();
    const version = (last?.version ?? 0) + 1;

    const copy = await SearchConfigModel.create({
      index,
      version,
      note: body.note ?? `Copy of v${source.version}: ${source.note}`.trim(),
      isActive:  false,
      appliedAt: null,
      appliedBy: null,
      settings:  source.settings,
      createdBy: adminName,
    });

    return NextResponse.json({ config: copy }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: "Operation failed" }, { status: 500 });
  }
}
