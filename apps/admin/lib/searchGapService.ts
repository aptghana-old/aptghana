import { connectDB, AnalyticsModel, BrandModel, CategoryModel, SearchConfigModel } from "@apt/db";
import type { AnalyticsFilters } from "./searchAnalyticsService";

function searchMatch(f: AnalyticsFilters) {
  return {
    eventType: "search" as const,
    "properties.query": { $exists: true, $ne: "" },
    createdAt: { $gte: f.from, $lte: f.to },
  };
}

export interface QueryGapRow {
  query: string;
  searchCount: number;
  avgResults: number | null;
  lastSearched: string;
}

/** Queries whose every search in the window returned zero results. */
export async function getZeroResultSearches(f: AnalyticsFilters, opts: { page?: number; pageSize?: number } = {}) {
  await connectDB();
  const page = Math.max(1, opts.page ?? 1);
  const pageSize = opts.pageSize ?? 25;

  const rows = await AnalyticsModel.aggregate<{ _id: string; searchCount: number; lastSearched: Date; zeroCount: number }>([
    { $match: searchMatch(f) },
    {
      $group: {
        _id: { $toLower: { $trim: { input: "$properties.query" } } },
        searchCount: { $sum: 1 },
        zeroCount: { $sum: { $cond: [{ $eq: ["$properties.resultsCount", 0] }, 1, 0] } },
        lastSearched: { $max: "$createdAt" },
      },
    },
    { $match: { $expr: { $and: [{ $gt: ["$zeroCount", 0] }, { $eq: ["$zeroCount", "$searchCount"] }] } } },
    { $sort: { searchCount: -1 } },
  ]);

  const total = rows.length;
  const start = (page - 1) * pageSize;
  const slice = rows.slice(start, start + pageSize).map((r) => ({
    query: r._id, searchCount: r.searchCount, avgResults: 0, lastSearched: r.lastSearched.toISOString(),
  }));
  return { rows: slice, total };
}

/** Queries averaging 1–3 results across the window. */
export async function getLowResultSearches(f: AnalyticsFilters, opts: { page?: number; pageSize?: number } = {}) {
  await connectDB();
  const page = Math.max(1, opts.page ?? 1);
  const pageSize = opts.pageSize ?? 25;

  const rows = await AnalyticsModel.aggregate<{ _id: string; searchCount: number; avgResults: number; lastSearched: Date }>([
    { $match: { ...searchMatch(f), "properties.resultsCount": { $exists: true, $type: "number" } } },
    {
      $group: {
        _id: { $toLower: { $trim: { input: "$properties.query" } } },
        searchCount: { $sum: 1 },
        avgResults: { $avg: "$properties.resultsCount" },
        lastSearched: { $max: "$createdAt" },
      },
    },
    { $match: { avgResults: { $gte: 1, $lte: 3 } } },
    { $sort: { searchCount: -1 } },
  ]);

  const total = rows.length;
  const start = (page - 1) * pageSize;
  const slice = rows.slice(start, start + pageSize).map((r) => ({
    query: r._id, searchCount: r.searchCount, avgResults: Math.round(r.avgResults * 10) / 10, lastSearched: r.lastSearched.toISOString(),
  }));
  return { rows: slice, total };
}

export interface OpportunityRow extends QueryGapRow {
  zeroResultRate: number;
  opportunityScore: number;
}

/** High-volume queries with a high zero-result rate — Opportunity Score = volume × zero-result rate. */
export async function getHighDemandMissingProducts(f: AnalyticsFilters, limit = 20): Promise<OpportunityRow[]> {
  await connectDB();
  const rows = await AnalyticsModel.aggregate<{ _id: string; searchCount: number; zeroCount: number; avgResults: number; lastSearched: Date }>([
    { $match: { ...searchMatch(f), "properties.resultsCount": { $exists: true, $type: "number" } } },
    {
      $group: {
        _id: { $toLower: { $trim: { input: "$properties.query" } } },
        searchCount: { $sum: 1 },
        zeroCount: { $sum: { $cond: [{ $eq: ["$properties.resultsCount", 0] }, 1, 0] } },
        avgResults: { $avg: "$properties.resultsCount" },
        lastSearched: { $max: "$createdAt" },
      },
    },
  ]);

  return rows
    .map((r) => {
      const zeroResultRate = r.zeroCount / r.searchCount;
      return {
        query: r._id,
        searchCount: r.searchCount,
        avgResults: Math.round(r.avgResults * 10) / 10,
        lastSearched: r.lastSearched.toISOString(),
        zeroResultRate,
        opportunityScore: Math.round(r.searchCount * zeroResultRate * 10) / 10,
      };
    })
    .filter((r) => r.zeroResultRate > 0)
    .sort((a, b) => b.opportunityScore - a.opportunityScore)
    .slice(0, limit);
}

/* ─── Synonym opportunities ──────────────────────────────────────────────── */

// Domain-relevant term pairs for an industrial automation / electrical distributor.
// Detection only surfaces a pair when the *term* actually appears in real logged
// queries — this list bounds the search space, it does not fabricate volume.
const SYNONYM_CANDIDATES: [string, string][] = [
  ["breaker", "circuit breaker"],
  ["mcb", "miniature circuit breaker"],
  ["mccb", "moulded case circuit breaker"],
  ["vfd", "variable frequency drive"],
  ["vsd", "variable speed drive"],
  ["plc", "programmable logic controller"],
  ["contactor", "magnetic contactor"],
  ["rcd", "residual current device"],
  ["rcbo", "residual current breaker with overcurrent"],
  ["ups", "uninterruptible power supply"],
  ["dol", "direct on line starter"],
  ["hmi", "human machine interface"],
  ["smps", "switch mode power supply"],
  ["acb", "air circuit breaker"],
];

export interface SynonymOpportunity {
  term: string;
  suggestedSynonym: string;
  searchVolume: number;
  alreadyApplied: boolean;
}

export async function getSynonymOpportunities(f: AnalyticsFilters): Promise<SynonymOpportunity[]> {
  await connectDB();

  const [volumeRows, activeConfig] = await Promise.all([
    AnalyticsModel.aggregate<{ _id: string; count: number }>([
      { $match: searchMatch(f) },
      { $group: { _id: { $toLower: { $trim: { input: "$properties.query" } } }, count: { $sum: 1 } } },
    ]),
    SearchConfigModel.findOne({ index: "products", isActive: true }).select("settings.synonyms").lean<{ settings?: { synonyms?: Record<string, string[]> } }>(),
  ]);

  const volumeMap = new Map(volumeRows.map((v) => [v._id, v.count]));
  const synonyms = activeConfig?.settings?.synonyms ?? {};

  const out: SynonymOpportunity[] = [];
  for (const [term, expansion] of SYNONYM_CANDIDATES) {
    let searchVolume = 0;
    for (const [query, count] of volumeMap) {
      if (query.includes(term)) searchVolume += count;
    }
    if (searchVolume === 0) continue;

    const applied = (synonyms[term] ?? []).some((s) => s.toLowerCase() === expansion)
      || (synonyms[expansion] ?? []).some((s) => s.toLowerCase() === term);

    out.push({ term, suggestedSynonym: expansion, searchVolume, alreadyApplied: applied });
  }

  return out.sort((a, b) => b.searchVolume - a.searchVolume);
}

/* ─── Misspellings ───────────────────────────────────────────────────────── */

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

export interface MisspellingRow {
  query: string;
  suggestedQuery: string;
  searchVolume: number;
}

/** Zero/low-result queries that are a near-miss (edit distance ≤2) of a real brand or product term. */
export async function getMisspellings(f: AnalyticsFilters, limit = 20): Promise<MisspellingRow[]> {
  await connectDB();

  const [gapRows, brands] = await Promise.all([
    AnalyticsModel.aggregate<{ _id: string; count: number; avgResults: number }>([
      { $match: { ...searchMatch(f), "properties.resultsCount": { $exists: true, $type: "number" } } },
      { $group: { _id: { $toLower: { $trim: { input: "$properties.query" } } }, count: { $sum: 1 }, avgResults: { $avg: "$properties.resultsCount" } } },
      { $match: { avgResults: { $lte: 3 } } },
    ]),
    BrandModel.find({ status: "active" }).select("name").lean<{ name: string }[]>(),
  ]);

  const dictionary = brands.map((b) => b.name.toLowerCase());

  const out: MisspellingRow[] = [];
  for (const row of gapRows) {
    const words = row._id.split(" ").filter(Boolean);
    for (const word of words) {
      if (word.length < 4) continue;
      let best: { term: string; dist: number } | null = null;
      for (const term of dictionary) {
        if (Math.abs(term.length - word.length) > 2) continue;
        if (term === word) { best = null; break; } // exact match — not a misspelling
        const dist = levenshtein(word, term);
        if (dist > 0 && dist <= 2 && (!best || dist < best.dist)) best = { term, dist };
      }
      if (best) {
        out.push({ query: row._id, suggestedQuery: row._id.replace(word, best.term), searchVolume: row.count });
        break;
      }
    }
  }

  return out.sort((a, b) => b.searchVolume - a.searchVolume).slice(0, limit);
}

/* ─── Catalogue coverage ─────────────────────────────────────────────────── */

export interface CoverageMetric { label: string; value: number | null }

export async function getCatalogueCoverage(f: AnalyticsFilters): Promise<CoverageMetric[]> {
  await connectDB();

  const totalWithCounts = await AnalyticsModel.countDocuments({
    ...searchMatch(f), "properties.resultsCount": { $exists: true, $type: "number" },
  });

  if (totalWithCounts === 0) {
    return [
      { label: "% Searches Returning Results", value: null },
      { label: "% Searches Returning >5 Results", value: null },
      { label: "% Searches Leading to Clicks", value: null },
      { label: "% Searches Leading to Conversions", value: null },
    ];
  }

  const [withResults, over5, totalSearches, clicks, sessionIds] = await Promise.all([
    AnalyticsModel.countDocuments({ ...searchMatch(f), "properties.resultsCount": { $gt: 0 } }),
    AnalyticsModel.countDocuments({ ...searchMatch(f), "properties.resultsCount": { $gt: 5 } }),
    AnalyticsModel.countDocuments(searchMatch(f)),
    AnalyticsModel.countDocuments({
      eventType: "product_view", "properties.fromQuery": { $exists: true, $nin: ["", null] },
      createdAt: { $gte: f.from, $lte: f.to },
    }),
    AnalyticsModel.distinct("sessionId", searchMatch(f)),
  ]);

  let converted = 0;
  if (sessionIds.length > 0) {
    const grace = new Date(f.to.getTime() + 24 * 60 * 60 * 1000);
    converted = (await AnalyticsModel.distinct("sessionId", {
      sessionId: { $in: sessionIds },
      eventType: { $in: ["rfq_submit", "order_complete"] },
      createdAt: { $lte: grace },
    })).length;
  }

  return [
    { label: "% Searches Returning Results", value: withResults / totalWithCounts },
    { label: "% Searches Returning >5 Results", value: over5 / totalWithCounts },
    { label: "% Searches Leading to Clicks", value: totalSearches > 0 ? clicks / totalSearches : null },
    { label: "% Searches Leading to Conversions", value: sessionIds.length > 0 ? converted / sessionIds.length : null },
  ];
}

/* ─── Content opportunities ──────────────────────────────────────────────── */

export interface ContentOpportunityRow {
  group?: string;
  category?: string;
  subcategory?: string;
  searches: number;
  productCount: number;
  opportunityScore: number;
}

/** Categories that real searches are hitting (by name match) but that carry few products. */
export async function getContentOpportunities(f: AnalyticsFilters, limit = 20): Promise<ContentOpportunityRow[]> {
  await connectDB();

  const [queryVolume, categories] = await Promise.all([
    AnalyticsModel.aggregate<{ _id: string; count: number }>([
      { $match: searchMatch(f) },
      { $group: { _id: { $toLower: { $trim: { input: "$properties.query" } } }, count: { $sum: 1 } } },
    ]),
    CategoryModel.find({ status: "active" })
      .select("name level productCount parentId")
      .populate({ path: "parentId", select: "name level parentId", populate: { path: "parentId", select: "name level" } })
      .lean<{ _id: unknown; name: string; level: string; productCount: number; parentId?: { name: string; level: string; parentId?: { name: string; level: string } } }[]>(),
  ]);

  const out: ContentOpportunityRow[] = [];
  for (const cat of categories) {
    const term = cat.name.toLowerCase();
    let searches = 0;
    for (const { _id: query, count } of queryVolume) {
      if (query.includes(term)) searches += count;
    }
    if (searches === 0) continue;

    const opportunityScore = Math.round((searches / (cat.productCount + 1)) * 10) / 10;
    if (opportunityScore < 1) continue;

    const row: ContentOpportunityRow = { searches, productCount: cat.productCount, opportunityScore };
    const parent = cat.parentId;
    const grandparent = parent?.parentId;
    if (cat.level === "group") row.group = cat.name;
    if (cat.level === "category") { row.group = parent?.name; row.category = cat.name; }
    if (cat.level === "subcategory") { row.group = grandparent?.name; row.category = parent?.name; row.subcategory = cat.name; }
    if (cat.level === "range") { row.category = grandparent?.name; row.subcategory = parent?.name; }

    out.push(row);
  }

  return out.sort((a, b) => b.opportunityScore - a.opportunityScore).slice(0, limit);
}

/** Resolve a query into a candidate new-product/category name (for quick-action prefills). */
export function suggestTitle(query: string): string {
  return query
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
