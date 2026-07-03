import { connectDB, QuoteModel, OrderModel, UserModel, AdminModel, BrandModel, CategoryModel } from "@apt/db";

export type DealKind = "quote" | "order";

export type DatePreset =
  | "today" | "yesterday" | "7d" | "30d" | "this_month" | "last_month"
  | "this_quarter" | "this_year" | "custom" | "all";

export interface DealFilterParams {
  preset?: DatePreset;
  from?: string;
  to?: string;
  status?: string;
  customer?: string;
  company?: string;
  country?: string;
  currency?: string;
  salesRep?: string;
  assignedUser?: string;
  brand?: string;
  categoryId?: string;
  minValue?: string;
  maxValue?: string;
  channel?: string;
  paymentStatus?: string;   // orders only
  expiring?: "expired" | "soon"; // quotes only
  sort?: string;
  dir?: "asc" | "desc";
  page?: string;
}

const FILTER_KEYS: (keyof DealFilterParams)[] = [
  "preset", "from", "to", "status", "customer", "company", "country", "currency",
  "salesRep", "assignedUser", "brand", "categoryId", "minValue", "maxValue",
  "channel", "paymentStatus", "expiring", "sort", "dir",
];

export function parseDealParams(sp: Record<string, string | undefined>): DealFilterParams {
  const out: DealFilterParams = {};
  for (const k of FILTER_KEYS) {
    const v = sp[k as string];
    if (v) (out as Record<string, string>)[k as string] = v;
  }
  return out;
}

export function activeFilterCount(p: DealFilterParams): number {
  return FILTER_KEYS.filter((k) => k !== "sort" && k !== "dir" && k !== "preset" && p[k]).length
    + (p.preset && p.preset !== "all" ? 1 : 0);
}

/* ─── Date range resolution ──────────────────────────────────────────────── */

export interface DateRange { from: Date; to: Date; prevFrom: Date; prevTo: Date; label: string }

export function resolveDatePreset(p: DealFilterParams): DateRange {
  const now = new Date();
  const startOfDay = (d: Date) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
  const endOfDay = (d: Date) => { const x = new Date(d); x.setHours(23, 59, 59, 999); return x; };
  const days = (n: number) => n * 24 * 60 * 60 * 1000;

  let from: Date, to: Date, label: string;

  switch (p.preset) {
    case "today":
      from = startOfDay(now); to = endOfDay(now); label = "Today"; break;
    case "yesterday": {
      const y = new Date(now.getTime() - days(1));
      from = startOfDay(y); to = endOfDay(y); label = "Yesterday"; break;
    }
    case "7d":
      from = startOfDay(new Date(now.getTime() - days(6))); to = endOfDay(now); label = "Last 7 days"; break;
    case "30d":
      from = startOfDay(new Date(now.getTime() - days(29))); to = endOfDay(now); label = "Last 30 days"; break;
    case "this_month":
      from = new Date(now.getFullYear(), now.getMonth(), 1); to = endOfDay(now); label = "This month"; break;
    case "last_month": {
      from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      to = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      label = "Last month"; break;
    }
    case "this_quarter": {
      const q = Math.floor(now.getMonth() / 3);
      from = new Date(now.getFullYear(), q * 3, 1); to = endOfDay(now); label = "This quarter"; break;
    }
    case "this_year":
      from = new Date(now.getFullYear(), 0, 1); to = endOfDay(now); label = "This year"; break;
    case "custom":
      from = p.from ? startOfDay(new Date(p.from)) : new Date(0);
      to = p.to ? endOfDay(new Date(p.to)) : endOfDay(now);
      label = "Custom range"; break;
    case "all":
      from = new Date(0); to = endOfDay(now); label = "All time"; break;
    default:
      from = startOfDay(new Date(now.getTime() - days(29))); to = endOfDay(now); label = "Last 30 days";
  }

  const span = to.getTime() - from.getTime();
  return { from, to, prevFrom: new Date(from.getTime() - span), prevTo: new Date(from.getTime() - 1), label };
}

/* ─── Field maps (the one place quote/order schema differences are named) ── */

const VALUE_FIELD: Record<DealKind, string> = { quote: "totals.grandTotal", order: "total" };
const CURRENCY_FIELD: Record<DealKind, string> = { quote: "totals.currency", order: "currency" };
const COUNTRY_FIELD: Record<DealKind, string> = { quote: "client.country", order: "shippingAddress.country" };
const BRAND_FIELD: Record<DealKind, string> = { quote: "items.brand", order: "items.brandSlug" };
const NAME_FIELD: Record<DealKind, string> = { quote: "client.name", order: "customerName" };
// Returns `any` deliberately — QuoteModel/OrderModel have incompatible Mongoose
// overloads that TS can't unify when selected dynamically by `kind`.
function modelFor(kind: DealKind): any { // eslint-disable-line @typescript-eslint/no-explicit-any
  return kind === "quote" ? QuoteModel : OrderModel;
}

/** Direct (pre-lookup) $match — every field that lives straight on the Quote/Order doc. */
function buildBaseMatch(kind: DealKind, p: DealFilterParams, range: DateRange): Record<string, unknown> {
  const match: Record<string, unknown> = { createdAt: { $gte: range.from, $lte: range.to } };

  if (p.status) match.status = p.status;
  if (p.currency) match[CURRENCY_FIELD[kind]] = p.currency;
  if (p.country) match[COUNTRY_FIELD[kind]] = p.country;
  if (p.brand) match[BRAND_FIELD[kind]] = kind === "quote" ? { $regex: p.brand, $options: "i" } : p.brand;
  if (p.channel) match.originChannel = p.channel;
  if (kind === "order" && p.paymentStatus) match.paymentStatus = p.paymentStatus;
  if (kind === "quote" && p.expiring === "expired") match.expiresAt = { $lt: new Date() };
  if (kind === "quote" && p.expiring === "soon") {
    match.expiresAt = { $gte: new Date(), $lte: new Date(Date.now() + 7 * 86_400_000) };
    match.status = match.status ?? "approved";
  }
  if (p.minValue || p.maxValue) {
    match[VALUE_FIELD[kind]] = {
      ...(p.minValue ? { $gte: parseFloat(p.minValue) } : {}),
      ...(p.maxValue ? { $lte: parseFloat(p.maxValue) } : {}),
    };
  }
  if (kind === "quote" && p.assignedUser) match.respondedBy = p.assignedUser;
  if (kind === "quote" && p.company) match["client.company"] = { $regex: p.company, $options: "i" };
  if (kind === "quote" && p.customer) {
    const safe = p.customer.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    match.$or = [
      { "client.name": { $regex: safe, $options: "i" } },
      { "client.email": { $regex: safe, $options: "i" } },
    ];
  }
  if (kind === "order" && p.customer) {
    const safe = p.customer.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    match.$or = [
      { "guest.name": { $regex: safe, $options: "i" } },
      { "guest.email": { $regex: safe, $options: "i" } },
      { ref: { $regex: safe, $options: "i" } },
    ];
  }
  return match;
}

/** Pipeline stages joining User (for orders: name/email/company/salesRep; for quotes: salesRep only). */
function userLookupStages(kind: DealKind): Record<string, unknown>[] {
  return [
    { $lookup: { from: "users_v2", localField: "userId", foreignField: "_id", as: "_user" } },
    { $unwind: { path: "$_user", preserveNullAndEmptyArrays: true } },
    ...(kind === "order"
      ? [{
          $addFields: {
            customerName: { $ifNull: ["$guest.name", "$_user.name"] },
            customerEmail: { $ifNull: ["$guest.email", "$_user.email"] },
            company: "$_user.company",
          },
        }]
      : []),
    { $addFields: { salesRepId: "$_user.assignedSalesRep", salesRepName: "$_user.assignedSalesRepName" } },
  ];
}

function categoryLookupStages(categoryId: string): Record<string, unknown>[] {
  return [
    { $lookup: { from: "products_v2", localField: "items.productId", foreignField: "_id", as: "_products" } },
    { $match: { "_products.categories.id": categoryId } },
  ];
}

/** For Orders only — resolve "assigned user" via the originating Quote's respondedBy. */
function orderAssignedUserStages(): Record<string, unknown>[] {
  return [
    { $lookup: { from: "quotes_v2", localField: "quoteId", foreignField: "_id", as: "_quote" } },
    { $unwind: { path: "$_quote", preserveNullAndEmptyArrays: true } },
    { $addFields: { assignedUserId: "$_quote.respondedBy" } },
  ];
}

/**
 * Full filtered pipeline (base match + lookups + every post-lookup filter) —
 * the one place getDealList and getDealKpis share so a filter can never
 * apply to the table but silently not affect the KPI cards above it.
 */
function buildFilteredPipeline(kind: DealKind, p: DealFilterParams, range: DateRange): Record<string, unknown>[] {
  const pipeline: Record<string, unknown>[] = [{ $match: buildBaseMatch(kind, p, range) }];
  pipeline.push(...userLookupStages(kind));

  if (p.salesRep) pipeline.push({ $match: { salesRepId: p.salesRep } });
  if (kind === "order" && p.company) pipeline.push({ $match: { company: { $regex: p.company, $options: "i" } } });
  if (kind === "order" && p.assignedUser) pipeline.push(...orderAssignedUserStages(), { $match: { assignedUserId: p.assignedUser } });
  if (p.categoryId) pipeline.push(...categoryLookupStages(p.categoryId));

  return pipeline;
}

export interface DealListResult<T> { rows: T[]; total: number }

export async function getDealList(kind: DealKind, p: DealFilterParams, page = 1, pageSize = 40): Promise<DealListResult<Record<string, unknown>>> {
  await connectDB();
  const range = resolveDatePreset(p);
  const Model = modelFor(kind);

  const pipeline = buildFilteredPipeline(kind, p, range);
  pipeline.push({ $project: { _products: 0, _quote: 0 } });

  const sortField = p.sort && ["createdAt", "total", "totals.grandTotal", "status"].includes(p.sort) ? p.sort : "createdAt";
  const sortDir = p.dir === "asc" ? 1 : -1;
  pipeline.push({ $sort: { [sortField]: sortDir, _id: -1 } });
  pipeline.push({ $facet: { data: [{ $skip: (page - 1) * pageSize }, { $limit: pageSize }], totalCount: [{ $count: "count" }] } });

  try {
    const [result] = await Model.aggregate(pipeline as Parameters<typeof Model.aggregate>[0]);
    return { rows: result?.data ?? [], total: result?.totalCount?.[0]?.count ?? 0 };
  } catch (err) {
    console.error(`[dealFilters] getDealList(${kind})`, err);
    return { rows: [], total: 0 };
  }
}

export interface DealKpis {
  totalCount: number;
  totalRevenue: number;
  avgValue: number;
  openCount: number;
  conversionRate: number | null;
  monthlyGrowth: number | null;
  /** Deal-count growth vs the prior period (%, null when prior period had none). */
  countGrowth: number | null;
  expiringQuotes: number;
  outstandingAmount: number;
}

const OPEN_STATUSES: Record<DealKind, string[]> = {
  quote: ["draft", "pending", "reviewing", "waiting_customer"],
  order: ["pending", "confirmed", "processing"],
};

export async function getDealKpis(kind: DealKind, p: DealFilterParams): Promise<DealKpis> {
  await connectDB();
  const range = resolveDatePreset(p);
  const Model = modelFor(kind);
  const valueField = VALUE_FIELD[kind];

  const [summary] = await Model.aggregate([
    ...buildFilteredPipeline(kind, p, range),
    {
      $group: {
        _id: null,
        totalCount: { $sum: 1 },
        totalRevenue: { $sum: `$${valueField}` },
        openCount: { $sum: { $cond: [{ $in: ["$status", OPEN_STATUSES[kind]] }, 1, 0] } },
        converted: { $sum: { $cond: kind === "quote" ? [{ $ne: ["$orderId", null] }, 1, 0] : [{ $eq: ["$paymentStatus", "paid"] }, 1, 0] } },
        outstandingAmount: {
          $sum: {
            $cond: kind === "quote"
              ? [{ $eq: ["$paymentStatus", "awaiting"] }, `$${valueField}`, 0]
              : [{ $ne: ["$paymentStatus", "paid"] }, `$${valueField}`, 0],
          },
        },
      },
    },
  ]);

  const prevRange: DateRange = { from: range.prevFrom, to: range.prevTo, prevFrom: range.prevFrom, prevTo: range.prevTo, label: "" };
  const [prevSummary] = await Model.aggregate([
    ...buildFilteredPipeline(kind, p, prevRange),
    { $group: { _id: null, totalRevenue: { $sum: `$${valueField}` }, totalCount: { $sum: 1 } } },
  ]);

  let expiringQuotes = 0;
  if (kind === "quote") {
    expiringQuotes = await QuoteModel.countDocuments({
      status: "approved",
      expiresAt: { $gte: new Date(), $lte: new Date(Date.now() + 7 * 86_400_000) },
    });
  }

  const totalCount = summary?.totalCount ?? 0;
  const totalRevenue = summary?.totalRevenue ?? 0;
  const prevRevenue = prevSummary?.totalRevenue ?? 0;
  const prevCount = prevSummary?.totalCount ?? 0;

  return {
    totalCount,
    totalRevenue,
    avgValue: totalCount > 0 ? totalRevenue / totalCount : 0,
    openCount: summary?.openCount ?? 0,
    conversionRate: totalCount > 0 ? (summary?.converted ?? 0) / totalCount : null,
    monthlyGrowth: prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : null,
    countGrowth: prevCount > 0 ? ((totalCount - prevCount) / prevCount) * 100 : null,
    expiringQuotes,
    outstandingAmount: summary?.outstandingAmount ?? 0,
  };
}

export interface DealAnalytics {
  revenueTrend: { date: string; revenue: number; count: number }[];
  /** Counts per status; ignores the active status filter so breakdowns/pills stay complete. */
  byStatus: { status: string; count: number }[];
  /** Counts per origin channel; ignores the active channel filter. */
  byChannel: { channel: string; count: number }[];
  topCustomers: { name: string; value: number; count: number }[];
  topBrands: { brand: string; count: number }[];
  salesRepPerformance: { name: string; count: number; revenue: number }[];
  funnel: { stage: string; count: number }[];
}

export async function getDealAnalytics(kind: DealKind, p: DealFilterParams): Promise<DealAnalytics> {
  await connectDB();
  const range = resolveDatePreset(p);
  const Model = modelFor(kind);
  const valueField = VALUE_FIELD[kind];
  const match = buildBaseMatch(kind, p, range);
  // Breakdown panels exclude their own dimension's filter, otherwise filtering
  // by a status/channel collapses the breakdown to a single bar/slice.
  const statusFreeMatch = buildBaseMatch(kind, { ...p, status: undefined }, range);
  const channelFreeMatch = buildBaseMatch(kind, { ...p, channel: undefined }, range);

  const [revenueTrend, byStatus, byChannel, topCustomers, topBrands, salesRepRows]: [
    { _id: string; revenue: number; count: number }[],
    { _id: string; count: number }[],
    { _id: string; count: number }[],
    { _id: string; value: number; count: number }[],
    { _id: string; count: number }[],
    { _id: string; name: string; count: number; revenue: number }[],
  ] = await Promise.all([
    Model.aggregate([
      { $match: match },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, revenue: { $sum: `$${valueField}` }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    Model.aggregate([
      { $match: statusFreeMatch },
      { $group: { _id: "$status", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    Model.aggregate([
      { $match: channelFreeMatch },
      { $group: { _id: { $ifNull: ["$originChannel", "unknown"] }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    Model.aggregate([
      { $match: match },
      ...userLookupStages(kind),
      { $group: { _id: `$${NAME_FIELD[kind]}`, value: { $sum: `$${valueField}` }, count: { $sum: 1 } } },
      { $match: { _id: { $nin: [null, ""] } } },
      { $sort: { value: -1 } },
      { $limit: 10 },
    ]),
    Model.aggregate([
      { $match: match },
      { $unwind: "$items" },
      { $group: { _id: `$${BRAND_FIELD[kind]}`, count: { $sum: 1 } } },
      { $match: { _id: { $nin: [null, ""] } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]),
    Model.aggregate([
      { $match: match },
      ...userLookupStages(kind),
      { $match: { salesRepId: { $ne: null } } },
      { $group: { _id: "$salesRepId", name: { $first: "$salesRepName" }, count: { $sum: 1 }, revenue: { $sum: `$${valueField}` } } },
      { $sort: { revenue: -1 } },
      { $limit: 10 },
    ]),
  ]);

  const funnel = kind === "quote"
    ? [
        { stage: "Submitted", count: await QuoteModel.countDocuments(match) },
        { stage: "Approved", count: await QuoteModel.countDocuments({ ...match, approvedAt: { $exists: true } }) },
        { stage: "Paid", count: await QuoteModel.countDocuments({ ...match, paymentStatus: "paid" }) },
        { stage: "Converted to Order", count: await QuoteModel.countDocuments({ ...match, orderId: { $exists: true } }) },
      ]
    : [
        { stage: "Created", count: await OrderModel.countDocuments(match) },
        { stage: "Confirmed", count: await OrderModel.countDocuments({ ...match, status: { $in: ["confirmed", "processing", "shipped", "delivered"] } }) },
        { stage: "Shipped", count: await OrderModel.countDocuments({ ...match, status: { $in: ["shipped", "delivered"] } }) },
        { stage: "Delivered", count: await OrderModel.countDocuments({ ...match, status: "delivered" }) },
      ];

  return {
    revenueTrend: revenueTrend.map((r) => ({ date: r._id, revenue: r.revenue, count: r.count })),
    byStatus: byStatus.map((s) => ({ status: s._id, count: s.count })),
    byChannel: byChannel.map((c) => ({ channel: c._id, count: c.count })),
    topCustomers: topCustomers.map((c) => ({ name: c._id, value: c.value, count: c.count })),
    topBrands: topBrands.map((b) => ({ brand: b._id, count: b.count })),
    salesRepPerformance: salesRepRows.map((r) => ({ name: r.name ?? "Unassigned", count: r.count, revenue: r.revenue })),
    funnel,
  };
}

export interface DealFilterOptions {
  statuses: string[];
  currencies: string[];
  countries: string[];
  channels: { value: string; label: string }[];
  salesReps: { value: string; label: string }[];
  brands: { value: string; label: string }[];
  categoryGroups: { value: string; label: string }[];
}

export async function getDealFilterOptions(kind: DealKind): Promise<DealFilterOptions> {
  await connectDB();
  const Model = modelFor(kind);

  const [currencies, countries, salesReps, brands, categoryGroups] = await Promise.all([
    Model.distinct(CURRENCY_FIELD[kind]),
    Model.distinct(COUNTRY_FIELD[kind]),
    AdminModel.find({ role: { $in: ["sales", "manager"] }, status: "active" }).select("_id name").sort({ name: 1 }).lean(),
    BrandModel.find({ status: "active" }).select("name slug").sort({ name: 1 }).limit(100).lean(),
    CategoryModel.find({ status: "active", level: "group" }).select("name").sort({ name: 1 }).lean(),
  ]);

  const statuses = kind === "quote"
    ? ["draft", "pending", "reviewing", "waiting_customer", "approved", "paid", "processing", "ready_for_delivery", "shipped", "delivered", "completed", "cancelled", "expired"]
    : ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "refunded"];

  return {
    statuses,
    currencies: (currencies as string[]).filter(Boolean).sort(),
    countries: (countries as string[]).filter(Boolean).sort(),
    channels: [
      { value: "web", label: "Web" }, { value: "store", label: "Store" },
      { value: "admin", label: "Admin" }, { value: "api", label: "API" },
    ],
    salesReps: (salesReps as unknown as { _id: { toString(): string }; name: string }[]).map((r) => ({ value: r._id.toString(), label: r.name })),
    brands: (brands as unknown as { name: string; slug: string }[]).map((b) => (kind === "quote" ? { value: b.name, label: b.name } : { value: b.slug, label: b.name })),
    categoryGroups: (categoryGroups as unknown as { _id: { toString(): string }; name: string }[]).map((c) => ({ value: c._id.toString(), label: c.name })),
  };
}

export { UserModel };
