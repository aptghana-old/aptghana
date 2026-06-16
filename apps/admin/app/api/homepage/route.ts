import { NextRequest, NextResponse } from "next/server";
import { connectDB, HomepageConfigModel, DEFAULT_HOMEPAGE_CONFIG } from "@apt/db";
import type { HomepageConfigData } from "@apt/db";
import { requirePermission } from "@/lib/auth/require";

/* ─── GET — load both draft and published configs ─────────────────────────── */
export async function GET() {
  const deny = await requirePermission("content:view");
  if (deny) return deny;
  try {
    await connectDB();
    const [draft, published] = await Promise.all([
      HomepageConfigModel.findOne({ status: "draft" }).lean(),
      HomepageConfigModel.findOne({ status: "published" }).lean(),
    ]);

    const defaultPayload = {
      ...DEFAULT_HOMEPAGE_CONFIG,
      status: "draft" as const,
      version: 0,
      publishedAt: null,
      publishedBy: null,
    };

    return NextResponse.json({
      draft: draft ? JSON.parse(JSON.stringify(draft)) : defaultPayload,
      published: published ? JSON.parse(JSON.stringify(published)) : null,
    });
  } catch (err) {
    console.error("GET /api/homepage", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/* ─── PUT — upsert the draft config ──────────────────────────────────────── */
export async function PUT(req: NextRequest) {
  const deny = await requirePermission("content:edit");
  if (deny) return deny;
  try {
    await connectDB();
    const body: Partial<HomepageConfigData> = await req.json();

    const update: Partial<HomepageConfigData> = {};
    if (body.carousel !== undefined) update.carousel = body.carousel;
    if (body.sections !== undefined) update.sections = body.sections;

    await HomepageConfigModel.findOneAndUpdate(
      { status: "draft" },
      { $set: update },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("PUT /api/homepage", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
