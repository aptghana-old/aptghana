import { connectDB, AnalyticsModel } from "@apt/db";

export interface ArticleAnalytics {
  views: number;
  uniqueVisitors: number;
  topSources: { source: string; count: number }[];
  searchKeywords: { keyword: string; count: number }[];
}

/**
 * Reads real pageview telemetry for the public `/articles/<slug>` route —
 * the same `AnalyticsModel` site-wide tracker already in use, just scoped
 * by path. There is no separate "article view" event; a pageview at this
 * path IS the article view.
 */
export async function getArticleAnalytics(slug: string): Promise<ArticleAnalytics> {
  await connectDB();
  const path = `/articles/${slug}`;
  const match = { eventType: "pageview" as const, path };

  const [views, sessionIds, sourceRows] = await Promise.all([
    AnalyticsModel.countDocuments(match),
    AnalyticsModel.distinct("sessionId", match),
    AnalyticsModel.aggregate<{ _id: string; count: number }>([
      { $match: match },
      {
        $group: {
          _id: {
            $cond: [
              { $gt: ["$utm.source", null] },
              "$utm.source",
              { $cond: [{ $and: [{ $gt: ["$referrer", null] }, { $ne: ["$referrer", ""] }] }, "referral", "direct"] },
            ],
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 8 },
    ]),
  ]);

  // Search keywords: only extractable from a real referrer query string (e.g. ?q= on a search engine
  // referrer). No keyword-tracking event exists, so this stays empty rather than inventing data.
  const referrers = await AnalyticsModel.find({ ...match, referrer: { $regex: /[?&]q=/, $ne: "" } })
    .select("referrer")
    .limit(200)
    .lean<{ referrer: string }[]>();

  const keywordCounts = new Map<string, number>();
  for (const r of referrers) {
    try {
      const q = new URL(r.referrer).searchParams.get("q");
      if (q) keywordCounts.set(q, (keywordCounts.get(q) ?? 0) + 1);
    } catch { /* malformed referrer */ }
  }

  return {
    views,
    uniqueVisitors: sessionIds.length,
    topSources: sourceRows.map((s) => ({ source: s._id || "direct", count: s.count })),
    searchKeywords: [...keywordCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([keyword, count]) => ({ keyword, count })),
  };
}
