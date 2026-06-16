import { connectDB, ArticleModel, AdminModel } from "@apt/db";

export type ArticleDateField = "createdAt" | "updatedAt" | "publishDate";
export type ArticleDatePreset = "7d" | "30d" | "90d" | "custom" | "all";

export interface ArticleFilterParams {
  q?: string;
  status?: string;
  author?: string;
  category?: string;
  tag?: string;
  featured?: string; // "1" | "0"
  dateField?: ArticleDateField;
  preset?: ArticleDatePreset;
  from?: string;
  to?: string;
  sort?: string;
  dir?: "asc" | "desc";
}

const FILTER_KEYS: (keyof ArticleFilterParams)[] = ["q", "status", "author", "category", "tag", "featured", "dateField", "preset", "from", "to", "sort", "dir"];

export function parseArticleParams(sp: Record<string, string | undefined>): ArticleFilterParams {
  const out: ArticleFilterParams = {};
  for (const k of FILTER_KEYS) {
    const v = sp[k as string];
    if (v) (out as Record<string, string>)[k as string] = v;
  }
  return out;
}

export function activeArticleFilterCount(p: ArticleFilterParams): number {
  return ["q", "status", "author", "category", "tag", "featured", "preset"].filter((k) => p[k as keyof ArticleFilterParams]).length;
}

function resolveDateMatch(p: ArticleFilterParams): Record<string, unknown> {
  const field = p.dateField ?? "createdAt";
  if (!p.preset || p.preset === "all") return {};

  const now = new Date();
  const days = (n: number) => new Date(now.getTime() - n * 24 * 60 * 60 * 1000);

  if (p.preset === "custom") {
    const from = p.from ? new Date(`${p.from}T00:00:00`) : undefined;
    const to = p.to ? new Date(`${p.to}T23:59:59.999`) : undefined;
    if (!from && !to) return {};
    return { [field]: { ...(from ? { $gte: from } : {}), ...(to ? { $lte: to } : {}) } };
  }

  const presetDays: Record<string, number> = { "7d": 7, "30d": 30, "90d": 90 };
  const n = presetDays[p.preset];
  if (!n) return {};
  return { [field]: { $gte: days(n), $lte: now } };
}

function buildMatch(p: ArticleFilterParams): Record<string, unknown> {
  const match: Record<string, unknown> = { ...resolveDateMatch(p) };
  if (p.status) match.status = p.status;
  if (p.author) match.authorId = p.author;
  if (p.category) match.category = p.category;
  if (p.tag) match.tags = p.tag;
  if (p.featured === "1") match.featured = true;
  if (p.featured === "0") match.featured = false;
  if (p.q) match.$text = { $search: p.q };
  return match;
}

export interface ArticleRow {
  _id: { toString(): string };
  title: string;
  slug: string;
  status: string;
  category?: string;
  authorName?: string;
  featured?: boolean;
  viewCount: number;
  publishDate?: Date;
  updatedAt: Date;
  readingTimeMinutes?: number;
}

export async function getArticleList(p: ArticleFilterParams, page = 1, pageSize = 40): Promise<{ rows: ArticleRow[]; total: number }> {
  await connectDB();
  const match = buildMatch(p);

  const sortableFields = ["title", "status", "viewCount", "publishDate", "updatedAt", "createdAt"];
  const sortField = p.sort && sortableFields.includes(p.sort) ? p.sort : "updatedAt";
  const sortDir = p.dir === "asc" ? 1 : -1;

  const projection = p.q ? { score: { $meta: "textScore" } } : {};
  const sortStage = p.q && !p.sort ? { score: { $meta: "textScore" } } : { [sortField]: sortDir };

  const [rows, total] = await Promise.all([
    ArticleModel.find(match, projection)
      // Mongoose's sort() overloads don't unify with the text-score meta shape — cast is intentional.
      .sort(sortStage as any)
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean<ArticleRow[]>(),
    ArticleModel.countDocuments(match),
  ]);

  return { rows, total };
}

export interface ArticleKpis {
  total: number;
  published: number;
  drafts: number;
  scheduled: number;
  totalViews: number;
  avgReadTime: number;
}

export async function getArticleKpis(p: ArticleFilterParams): Promise<ArticleKpis> {
  await connectDB();
  const match = buildMatch(p);

  const [agg] = await ArticleModel.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        published: { $sum: { $cond: [{ $eq: ["$status", "published"] }, 1, 0] } },
        drafts: { $sum: { $cond: [{ $eq: ["$status", "draft"] }, 1, 0] } },
        scheduled: { $sum: { $cond: [{ $eq: ["$status", "scheduled"] }, 1, 0] } },
        totalViews: { $sum: "$viewCount" },
        avgReadTime: { $avg: "$readingTimeMinutes" },
      },
    },
  ]);

  return {
    total: agg?.total ?? 0,
    published: agg?.published ?? 0,
    drafts: agg?.drafts ?? 0,
    scheduled: agg?.scheduled ?? 0,
    totalViews: agg?.totalViews ?? 0,
    avgReadTime: agg?.avgReadTime ? Math.round(agg.avgReadTime * 10) / 10 : 0,
  };
}

export interface ArticleFilterOptions {
  statuses: string[];
  authors: { value: string; label: string }[];
  categories: { value: string; label: string }[];
  tags: { value: string; label: string }[];
}

export async function getArticleFilterOptions(): Promise<ArticleFilterOptions> {
  await connectDB();
  const [authorIds, categories, tags] = await Promise.all([
    ArticleModel.distinct("authorId", { authorId: { $ne: null } }),
    ArticleModel.distinct("category", { category: { $nin: [null, ""] } }),
    ArticleModel.distinct("tags", { tags: { $ne: null } }),
  ]);

  const authors = authorIds.length
    ? await AdminModel.find({ _id: { $in: authorIds } }).select("_id name").lean<{ _id: { toString(): string }; name: string }[]>()
    : [];

  return {
    statuses: ["draft", "review", "scheduled", "published", "archived"],
    authors: authors.map((a) => ({ value: a._id.toString(), label: a.name })),
    categories: (categories as string[]).filter(Boolean).sort().map((c) => ({ value: c, label: c })),
    tags: (tags as string[]).filter(Boolean).sort().map((t) => ({ value: t, label: t })),
  };
}
