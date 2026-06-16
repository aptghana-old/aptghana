import { connectDB, AnalyticsModel } from "@apt/db";

export interface AnalyticsFilters {
  from: Date;
  to: Date;
  source?: string;   // "web" | "store"
  country?: string;
}

function hostFilter(source?: string): Record<string, unknown> {
  if (source === "store") return { hostname: { $regex: /store|3001/ } };
  if (source === "web") return { hostname: { $not: /store|3001/ } };
  return {};
}

function normalizeQuery(q: string): string {
  return q.trim().toLowerCase().replace(/\s+/g, " ");
}

function searchMatch(f: AnalyticsFilters): Record<string, unknown> {
  return {
    eventType: "search",
    "properties.query": { $exists: true, $ne: "" },
    createdAt: { $gte: f.from, $lte: f.to },
    ...hostFilter(f.source),
    ...(f.country ? { country: f.country } : {}),
  };
}

/** Distinct sessions that issued at least one search in the window. */
async function searchSessionIds(f: AnalyticsFilters): Promise<string[]> {
  return AnalyticsModel.distinct("sessionId", searchMatch(f)) as unknown as Promise<string[]>;
}

/** Sessions (from `sessionIds`) that later converted via RFQ/order, within the window (+ a 24h grace tail). */
async function convertedSessionCount(sessionIds: string[], to: Date): Promise<number> {
  if (sessionIds.length === 0) return 0;
  const grace = new Date(to.getTime() + 24 * 60 * 60 * 1000);
  const sessions = await AnalyticsModel.distinct("sessionId", {
    sessionId: { $in: sessionIds },
    eventType: { $in: ["rfq_submit", "order_complete"] },
    createdAt: { $lte: grace },
  });
  return sessions.length;
}

/** Clicks = product views attributed back to a search query via the referrer-derived `fromQuery`. */
function clickMatch(f: AnalyticsFilters): Record<string, unknown> {
  return {
    eventType: "product_view",
    "properties.fromQuery": { $exists: true, $ne: null, $nin: ["", null] },
    createdAt: { $gte: f.from, $lte: f.to },
    ...hostFilter(f.source),
    ...(f.country ? { country: f.country } : {}),
  };
}

export async function getKpis(f: AnalyticsFilters) {
  await connectDB();

  const now = new Date();
  const startOfToday = new Date(now); startOfToday.setHours(0, 0, 0, 0);
  const startOfWeek = new Date(startOfToday); startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalSearches,
    uniqueQueries,
    searchesToday,
    searchesThisWeek,
    searchesThisMonth,
    resultStats,
    durationStats,
    zeroResultCount,
    clicks,
    sessionIds,
  ] = await Promise.all([
    AnalyticsModel.countDocuments(searchMatch(f)),
    AnalyticsModel.distinct("properties.query", searchMatch(f)).then((qs) => new Set(qs.map((q) => normalizeQuery(String(q)))).size),
    AnalyticsModel.countDocuments({ eventType: "search", "properties.query": { $exists: true, $ne: "" }, createdAt: { $gte: startOfToday } }),
    AnalyticsModel.countDocuments({ eventType: "search", "properties.query": { $exists: true, $ne: "" }, createdAt: { $gte: startOfWeek } }),
    AnalyticsModel.countDocuments({ eventType: "search", "properties.query": { $exists: true, $ne: "" }, createdAt: { $gte: startOfMonth } }),
    AnalyticsModel.aggregate<{ _id: null; avg: number; n: number }>([
      { $match: { ...searchMatch(f), "properties.resultsCount": { $exists: true, $type: "number" } } },
      { $group: { _id: null, avg: { $avg: "$properties.resultsCount" }, n: { $sum: 1 } } },
    ]),
    AnalyticsModel.aggregate<{ _id: null; avg: number; n: number }>([
      { $match: { ...searchMatch(f), "properties.durationMs": { $exists: true, $type: "number" } } },
      { $group: { _id: null, avg: { $avg: "$properties.durationMs" }, n: { $sum: 1 } } },
    ]),
    AnalyticsModel.countDocuments({ ...searchMatch(f), "properties.resultsCount": 0 }),
    AnalyticsModel.countDocuments(clickMatch(f)),
    searchSessionIds(f),
  ]);

  const convertedSessions = await convertedSessionCount(sessionIds, f.to);

  return {
    totalSearches,
    uniqueQueries,
    searchesToday,
    searchesThisWeek,
    searchesThisMonth,
    avgResults: resultStats[0]?.n ? resultStats[0].avg : null,
    avgSearchTimeMs: durationStats[0]?.n ? durationStats[0].avg : null,
    zeroResultSearches: zeroResultCount,
    zeroResultRate: totalSearches > 0 ? zeroResultCount / totalSearches : null,
    ctr: totalSearches > 0 ? clicks / totalSearches : null,
    conversionRate: sessionIds.length > 0 ? convertedSessions / sessionIds.length : null,
    searchSessions: sessionIds.length,
  };
}

export async function getVolumeTrend(f: AnalyticsFilters) {
  await connectDB();
  const rows = await AnalyticsModel.aggregate<{ _id: string; count: number }>([
    { $match: searchMatch(f) },
    { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);
  return rows;
}

export async function getPerformanceTrend(f: AnalyticsFilters) {
  await connectDB();
  const rows = await AnalyticsModel.aggregate<{ _id: string; avgMs: number }>([
    { $match: { ...searchMatch(f), "properties.durationMs": { $exists: true, $type: "number" } } },
    { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, avgMs: { $avg: "$properties.durationMs" } } },
    { $sort: { _id: 1 } },
  ]);
  return rows;
}

export async function getCtrAndConversionTrend(f: AnalyticsFilters) {
  await connectDB();
  const [searches, clicks] = await Promise.all([
    AnalyticsModel.aggregate<{ _id: string; count: number }>([
      { $match: searchMatch(f) },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    AnalyticsModel.aggregate<{ _id: string; count: number }>([
      { $match: clickMatch(f) },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
  ]);
  const clickMap = new Map(clicks.map((c) => [c._id, c.count]));
  return searches.map((s) => ({
    date: s._id,
    searches: s.count,
    clicks: clickMap.get(s._id) ?? 0,
    ctr: s.count > 0 ? (clickMap.get(s._id) ?? 0) / s.count : 0,
  }));
}

export type TopSearchSort = "searches" | "results" | "ctr" | "lastSearched";

export interface TopSearchRow {
  query: string;
  searches: number;
  avgResults: number | null;
  clicks: number;
  ctr: number | null;
  lastSearched: string;
}

export async function getTopSearches(
  f: AnalyticsFilters,
  opts: { sort?: TopSearchSort; page?: number; pageSize?: number } = {}
): Promise<{ rows: TopSearchRow[]; total: number }> {
  await connectDB();
  const page = Math.max(1, opts.page ?? 1);
  const pageSize = opts.pageSize ?? 25;

  const grouped = await AnalyticsModel.aggregate<{
    _id: string; searches: number; avgResults: number | null; lastSearched: Date;
  }>([
    { $match: searchMatch(f) },
    {
      $group: {
        _id: { $toLower: { $trim: { input: "$properties.query" } } },
        searches: { $sum: 1 },
        avgResults: { $avg: "$properties.resultsCount" },
        lastSearched: { $max: "$createdAt" },
      },
    },
  ]);

  const clickRows = await AnalyticsModel.aggregate<{ _id: string; clicks: number }>([
    { $match: clickMatch(f) },
    { $group: { _id: { $toLower: { $trim: { input: "$properties.fromQuery" } } }, clicks: { $sum: 1 } } },
  ]);
  const clickMap = new Map(clickRows.map((c) => [c._id, c.clicks]));

  let rows: TopSearchRow[] = grouped.map((g) => {
    const clicks = clickMap.get(g._id) ?? 0;
    return {
      query: g._id,
      searches: g.searches,
      avgResults: g.avgResults ?? null,
      clicks,
      ctr: g.searches > 0 ? clicks / g.searches : null,
      lastSearched: g.lastSearched.toISOString(),
    };
  });

  const sortKey = opts.sort ?? "searches";
  rows = rows.sort((a, b) => {
    if (sortKey === "results") return (b.avgResults ?? -1) - (a.avgResults ?? -1);
    if (sortKey === "ctr") return (b.ctr ?? -1) - (a.ctr ?? -1);
    if (sortKey === "lastSearched") return new Date(b.lastSearched).getTime() - new Date(a.lastSearched).getTime();
    return b.searches - a.searches;
  });

  const total = rows.length;
  const start = (page - 1) * pageSize;
  return { rows: rows.slice(start, start + pageSize), total };
}

export async function getTopPerforming(f: AnalyticsFilters, limit = 10): Promise<TopSearchRow[]> {
  const { rows } = await getTopSearches(f, { sort: "searches", pageSize: 1000 });
  return rows
    .filter((r) => r.searches >= 3) // "high volume" floor
    .sort((a, b) => (b.ctr ?? 0) * b.searches - (a.ctr ?? 0) * a.searches)
    .slice(0, limit);
}

export interface FunnelStage { stage: string; count: number }

export async function getFunnel(f: AnalyticsFilters): Promise<FunnelStage[]> {
  await connectDB();
  const [searches, clicks, quotes, orders] = await Promise.all([
    AnalyticsModel.countDocuments(searchMatch(f)),
    AnalyticsModel.countDocuments(clickMatch(f)),
    AnalyticsModel.countDocuments({ eventType: "rfq_submit", createdAt: { $gte: f.from, $lte: f.to } }),
    AnalyticsModel.countDocuments({ eventType: "order_complete", createdAt: { $gte: f.from, $lte: f.to } }),
  ]);
  return [
    { stage: "Search", count: searches },
    // A product view immediately after a search IS the "result click" signal —
    // there is no separate click event, so these two brief-defined stages
    // collapse into one real measurement rather than reporting a duplicate.
    { stage: "Result Click / Product View", count: clicks },
    { stage: "Quote Request", count: quotes },
    { stage: "Order", count: orders },
  ];
}

export async function getCountryOptions(): Promise<string[]> {
  await connectDB();
  const countries = await AnalyticsModel.distinct("country", { eventType: "search", country: { $nin: [null, ""] } });
  return (countries as string[]).sort();
}
