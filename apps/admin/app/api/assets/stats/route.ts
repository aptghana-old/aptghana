import { NextResponse } from "next/server";
import { connectDB, AssetModel } from "@apt/db";
import { requireAdmin } from "@/lib/auth/require";

export async function GET() {
  const deny = await requireAdmin();
  if (deny) return deny;
  try {
    await connectDB();

    const [
      aggregateResult,
      recentRaw,
      mostUsedRaw,
    ] = await Promise.all([
      AssetModel.aggregate([
        { $match: { status: "active" } },
        {
          $facet: {
            totals: [
              {
                $group: {
                  _id:        null,
                  count:      { $sum: 1 },
                  totalBytes: { $sum: "$size" },
                },
              },
            ],
            byMimePrefix: [
              {
                $bucket: {
                  groupBy: "$mimetype",
                  boundaries: [],
                  default: "other",
                  output: { count: { $sum: 1 } },
                },
              },
            ],
            byMediaType: [
              {
                $addFields: {
                  mt: {
                    $switch: {
                      branches: [
                        { case: { $regexMatch: { input: "$mimetype", regex: "^image/" } }, then: "image" },
                        { case: { $regexMatch: { input: "$mimetype", regex: "^video/" } }, then: "video" },
                        { case: { $regexMatch: { input: "$mimetype", regex: "^audio/" } }, then: "audio" },
                        { case: { $eq: ["$mimetype", "application/pdf"] }, then: "pdf" },
                        { case: { $regexMatch: { input: "$mimetype", regex: "spreadsheetml|vnd\\.ms-excel|text/csv" } }, then: "spreadsheet" },
                        { case: { $regexMatch: { input: "$mimetype", regex: "wordprocessingml|msword" } }, then: "document" },
                      ],
                      default: "other",
                    },
                  },
                },
              },
              { $group: { _id: "$mt", count: { $sum: 1 }, bytes: { $sum: "$size" } } },
            ],
            byFolder: [
              { $group: { _id: "$folder", count: { $sum: 1 }, bytes: { $sum: "$size" } } },
              { $sort: { count: -1 } },
              { $limit: 10 },
            ],
            byDay: [
              {
                $group: {
                  _id: {
                    $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
                  },
                  count: { $sum: 1 },
                  bytes: { $sum: "$size" },
                },
              },
              { $sort: { _id: -1 } },
              { $limit: 30 },
            ],
          },
        },
      ]),

      AssetModel.find({ status: "active" })
        .sort({ createdAt: -1 })
        .limit(12)
        .select("_id key url filename mimetype size folder createdAt thumbnails")
        .lean(),

      AssetModel.find({ status: "active", viewCount: { $gt: 0 } })
        .sort({ viewCount: -1 })
        .limit(6)
        .select("_id key url filename mimetype viewCount usedIn thumbnails")
        .lean(),
    ]);

    const agg         = aggregateResult[0];
    const totals      = agg?.totals?.[0]    ?? { count: 0, totalBytes: 0 };
    const byMediaType = agg?.byMediaType    ?? [];
    const byFolder    = agg?.byFolder       ?? [];
    const byDay       = (agg?.byDay ?? []).reverse();

    const typeMap = Object.fromEntries(
      byMediaType.map((m: { _id: string; count: number; bytes: number }) => [
        m._id,
        { count: m.count, bytes: m.bytes },
      ]),
    );

    return NextResponse.json({
      ok:    true,
      stats: {
        total:      totals.count,
        totalBytes: totals.totalBytes,
        byType:     typeMap,
        byFolder:   byFolder.map((f: { _id: string; count: number; bytes: number }) => ({
          folder: f._id,
          count:  f.count,
          bytes:  f.bytes,
        })),
        byDay: byDay.map((d: { _id: string; count: number; bytes: number }) => ({
          date:  d._id,
          count: d.count,
          bytes: d.bytes,
        })),
        recent:   JSON.parse(JSON.stringify(recentRaw)),
        mostUsed: JSON.parse(JSON.stringify(mostUsedRaw)),
      },
    });
  } catch (err) {
    console.error("[GET /api/assets/stats]", err);
    return NextResponse.json({ error: "Failed to load stats" }, { status: 500 });
  }
}
