import { NextResponse } from "next/server";
import { connectDB, HomepageConfigModel, HomepageHistoryModel } from "@apt/db";
import type { HomepageConfigData } from "@apt/db";
import { requirePermission } from "@/lib/auth/require";

/* ─── POST — publish draft → live ────────────────────────────────────────── */
export async function POST() {
  const deny = await requirePermission('content:edit');
  if (deny) return deny;
  try {
    await connectDB();

    const draft = await HomepageConfigModel.findOne({ status: "draft" }).lean() as HomepageConfigData | null;
    if (!draft) {
      return NextResponse.json({ error: "No draft config found" }, { status: 404 });
    }

    const currentPublished = await HomepageConfigModel.findOne({ status: "published" }).lean() as HomepageConfigData | null;
    const nextVersion = (currentPublished?.version ?? 0) + 1;

    // Archive current published version to history
    if (currentPublished) {
      await HomepageHistoryModel.create({
        version: currentPublished.version,
        publishedAt: currentPublished.publishedAt ?? (currentPublished as any).updatedAt,
        publishedBy: currentPublished.publishedBy ?? "",
        snapshot: JSON.parse(JSON.stringify(currentPublished)),
      });

      // Keep only the last 10 history entries
      const historyDocs = await HomepageHistoryModel.find({})
        .sort({ version: -1 })
        .skip(10)
        .select("_id")
        .lean();
      if (historyDocs.length > 0) {
        await HomepageHistoryModel.deleteMany({ _id: { $in: historyDocs.map((d) => d._id) } });
      }
    }

    const now = new Date();

    // Upsert published version from draft content
    await HomepageConfigModel.findOneAndUpdate(
      { status: "published" },
      {
        $set: {
          carousel: draft.carousel,
          sections: draft.sections,
          version: nextVersion,
          publishedAt: now,
          publishedBy: "admin",
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    return NextResponse.json({ ok: true, version: nextVersion });
  } catch (err) {
    console.error("POST /api/homepage/publish", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
