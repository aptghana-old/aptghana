import type { Metadata } from "next";
import { connectDB, AssetModel } from "@apt/db";
import { getMediaType } from "@apt/search";
import { MediaLibrary } from "@/components/media/MediaLibrary";
import type { Asset, MediaStats } from "@/components/media/types";

export const metadata: Metadata = { title: "Media Library" };
export const dynamic = "force-dynamic";

async function getInitialData(): Promise<{ assets: Asset[]; total: number; stats: MediaStats }> {
  try {
    await connectDB();

    const [assetsRaw, statsAgg] = await Promise.all([
      AssetModel.find({ status: "active" })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean(),

      AssetModel.aggregate([
        { $match: { status: "active" } },
        {
          $facet: {
            totals:      [{ $group: { _id: null, count: { $sum: 1 }, totalBytes: { $sum: "$size" } } }],
            byMediaType: [
              {
                $addFields: {
                  mt: {
                    $switch: {
                      branches: [
                        { case: { $regexMatch: { input: "$mimetype", regex: "^image/" } }, then: "image" },
                        { case: { $regexMatch: { input: "$mimetype", regex: "^video/" } }, then: "video" },
                        { case: { $eq:          ["$mimetype", "application/pdf"] },         then: "pdf"   },
                        { case: { $regexMatch: { input: "$mimetype", regex: "wordprocessingml|msword" } }, then: "document" },
                        { case: { $regexMatch: { input: "$mimetype", regex: "spreadsheetml|vnd.ms-excel|text/csv" } }, then: "spreadsheet" },
                      ],
                      default: "other",
                    },
                  },
                },
              },
              { $group: { _id: "$mt", count: { $sum: 1 }, bytes: { $sum: "$size" } } },
            ],
            byFolder: [{ $group: { _id: "$folder", count: { $sum: 1 }, bytes: { $sum: "$size" } } }, { $sort: { count: -1 } }, { $limit: 10 }],
            byDay:    [{ $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 }, bytes: { $sum: "$size" } } }, { $sort: { _id: -1 } }, { $limit: 14 }],
            recent:   [{ $sort: { createdAt: -1 } }, { $limit: 8 }, { $project: { _id: 1, key: 1, url: 1, filename: 1, mimetype: 1, size: 1, folder: 1, createdAt: 1 } }],
            mostUsed: [{ $match: { viewCount: { $gt: 0 } } }, { $sort: { viewCount: -1 } }, { $limit: 6 }, { $project: { _id: 1, key: 1, url: 1, filename: 1, mimetype: 1, viewCount: 1, usedIn: 1 } }],
          },
        },
      ]),
    ]);

    const agg     = statsAgg[0];
    const totals  = agg?.totals?.[0] ?? { count: 0, totalBytes: 0 };
    const typeMap = Object.fromEntries(
      (agg?.byMediaType ?? []).map((m: { _id: string; count: number; bytes: number }) => [m._id, { count: m.count, bytes: m.bytes }]),
    );

    const stats: MediaStats = {
      total:      totals.count,
      totalBytes: totals.totalBytes,
      byType:     typeMap,
      byFolder:   (agg?.byFolder ?? []).map((f: { _id: string; count: number; bytes: number }) => ({ folder: f._id, count: f.count, bytes: f.bytes })),
      byDay:      (agg?.byDay    ?? []).reverse().map((d: { _id: string; count: number; bytes: number }) => ({ date: d._id, count: d.count, bytes: d.bytes })),
      recent:     JSON.parse(JSON.stringify(agg?.recent   ?? [])),
      mostUsed:   JSON.parse(JSON.stringify(agg?.mostUsed ?? [])),
    };

    const assets: Asset[] = assetsRaw.map((a) => {
      const doc = a as unknown as { _id: { toString(): string }; mimetype: string };
      return { ...JSON.parse(JSON.stringify(a)), _id: doc._id.toString(), mediaType: getMediaType(doc.mimetype) };
    });

    return { assets, total: totals.count, stats };
  } catch {
    return { assets: [], total: 0, stats: { total: 0, totalBytes: 0, byType: {}, byFolder: [], byDay: [], recent: [], mostUsed: [] } };
  }
}

export default async function MediaPage() {
  const { assets, total, stats } = await getInitialData();
  return <MediaLibrary initialAssets={assets} initialTotal={total} initialStats={stats} />;
}
