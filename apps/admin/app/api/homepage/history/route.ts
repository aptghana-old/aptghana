import { NextRequest, NextResponse } from "next/server";
import { connectDB, HomepageConfigModel, HomepageHistoryModel } from "@apt/db";
import { requireAdmin } from "@/lib/auth/require";

/* ─── GET — list version history ─────────────────────────────────────────── */
export async function GET() {
  const deny = await requireAdmin();
  if (deny) return deny;
  try {
    await connectDB();
    const entries = await HomepageHistoryModel.find({})
      .sort({ version: -1 })
      .select("version publishedAt publishedBy")
      .lean();
    return NextResponse.json({ history: JSON.parse(JSON.stringify(entries)) });
  } catch (err) {
    console.error("GET /api/homepage/history", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/* ─── POST — restore a history version to draft ──────────────────────────── */
export async function POST(req: NextRequest) {
  const deny = await requireAdmin();
  if (deny) return deny;
  try {
    await connectDB();
    const { version } = await req.json();
    if (!version) return NextResponse.json({ error: "version required" }, { status: 400 });

    const entry = await HomepageHistoryModel.findOne({ version }).lean();
    if (!entry) return NextResponse.json({ error: "Version not found" }, { status: 404 });

    const snap = (entry as any).snapshot;
    await HomepageConfigModel.findOneAndUpdate(
      { status: "draft" },
      { $set: { carousel: snap.carousel, sections: snap.sections } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("POST /api/homepage/history", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
