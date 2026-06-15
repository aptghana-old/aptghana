import { NextRequest, NextResponse } from "next/server";
import { connectDB, SearchConfigModel } from "@apt/db";
import { requireAdmin } from "@/lib/auth/require";

type Params = { params: Promise<{ index: string }> };

/** GET /api/search/settings/[index]/versions — full version history */
export async function GET(req: NextRequest, { params }: Params) {
  const deny = await requireAdmin();
  if (deny) return deny;

  const { index } = await params;
  const url   = new URL(req.url);
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "50"), 100);
  const page  = Math.max(1, parseInt(url.searchParams.get("page") ?? "1"));

  try {
    await connectDB();
    const [versions, total] = await Promise.all([
      SearchConfigModel.find({ index })
        .sort({ version: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .select("-settings") // omit heavy settings from list view
        .lean(),
      SearchConfigModel.countDocuments({ index }),
    ]);

    return NextResponse.json({ versions, total, page, limit });
  } catch (err) {
    return NextResponse.json({ error: "Operation failed" }, { status: 500 });
  }
}
