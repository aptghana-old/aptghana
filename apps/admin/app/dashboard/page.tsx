import type { Metadata } from "next";
import Link from "next/link";
import {
  Package, FileText, ArrowRight, Clock,
  Download, Plus, ShieldAlert, RefreshCw,
} from "lucide-react";
import { connectDB, ProductModel, BrandModel, CategoryModel, QuoteModel, OrderModel, UserModel } from "@apt/db";
import { Badge, statusVariant } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { StatCard, Panel, BarList } from "@/components/analytics/primitives";
import { Donut, MiniBarChart } from "@/components/analytics/charts";
import {
  resolveDatePreset, getDealKpis, getDealAnalytics, getDealList,
  type DatePreset, type DealFilterParams,
} from "@/lib/dealFilters";
import { formatNumber } from "@/lib/analytics/range";
import { timeAgo } from "@/lib/timeAgo";
import {
  TimeRangeTabs, RevenueHero, PipelineCard, LowStockPanel, QuickActionsGrid,
} from "@/components/dashboard/DashboardWidgets";

export const metadata: Metadata = { title: "Dashboard" };
export const revalidate = 60;

const VALID_RANGES: DatePreset[] = ["7d", "30d", "this_quarter", "this_year"];
const CATEGORY_COLORS = ["#12B76A", "#0BA5A5", "#F5820A", "#5B6CFF", "#94A3B8"];
const CURRENCY = "GHS";

function fmtMoneyCompact(n: number) {
  return `${CURRENCY} ${formatNumber(n)}`;
}

/* ─── Data ────────────────────────────────────────────────────────────────── */
async function getDashboardData(range: DatePreset) {
  await connectDB();
  const params: DealFilterParams = { preset: range };
  const dateRange = resolveDatePreset(params);
  const week = resolveDatePreset({ preset: "7d" });
  const lowStockFilter = {
    status: "active",
    "inventory.tracked": true,
    "inventory.reorderPoint": { $exists: true, $ne: null },
    $expr: { $lte: ["$inventory.quantity", "$inventory.reorderPoint"] },
  };

  const [
    orderKpis, orderAnalytics, quoteKpis, quoteAnalytics,
    quoteList,
    productsNow, productsNew, productsPrevNew,
    brandsNow, brandsNew, brandsPrevNew,
    categoriesNow, categoriesNew, categoriesPrevNew,
    customersNow, customersNew, customersPrevNew,
    quotesPendingNow,
    ordersNow, ordersNew, ordersPrevNew,
    lowStockItems, lowStockTotal,
    catalogMixRaw,
    ordersByDayRaw,
  ] = await Promise.all([
    getDealKpis("order", params),
    getDealAnalytics("order", params),
    getDealKpis("quote", params),
    getDealAnalytics("quote", params),
    getDealList("quote", { preset: "all", sort: "createdAt", dir: "desc" }, 1, 6),
    ProductModel.countDocuments({ status: "active" }),
    ProductModel.countDocuments({ status: "active", createdAt: { $gte: dateRange.from, $lte: dateRange.to } }),
    ProductModel.countDocuments({ status: "active", createdAt: { $gte: dateRange.prevFrom, $lte: dateRange.prevTo } }),
    BrandModel.countDocuments({ status: "active" }),
    BrandModel.countDocuments({ status: "active", createdAt: { $gte: dateRange.from, $lte: dateRange.to } }),
    BrandModel.countDocuments({ status: "active", createdAt: { $gte: dateRange.prevFrom, $lte: dateRange.prevTo } }),
    CategoryModel.countDocuments({ status: "active" }),
    CategoryModel.countDocuments({ status: "active", createdAt: { $gte: dateRange.from, $lte: dateRange.to } }),
    CategoryModel.countDocuments({ status: "active", createdAt: { $gte: dateRange.prevFrom, $lte: dateRange.prevTo } }),
    UserModel.countDocuments({ status: "active" }),
    UserModel.countDocuments({ status: "active", createdAt: { $gte: dateRange.from, $lte: dateRange.to } }),
    UserModel.countDocuments({ status: "active", createdAt: { $gte: dateRange.prevFrom, $lte: dateRange.prevTo } }),
    QuoteModel.countDocuments({ status: "pending" }),
    OrderModel.countDocuments({}),
    OrderModel.countDocuments({ createdAt: { $gte: dateRange.from, $lte: dateRange.to } }),
    OrderModel.countDocuments({ createdAt: { $gte: dateRange.prevFrom, $lte: dateRange.prevTo } }),
    ProductModel.find(lowStockFilter)
      .select("name sku inventory.quantity inventory.reorderPoint")
      .sort({ "inventory.quantity": 1 })
      .limit(6)
      .lean(),
    ProductModel.countDocuments(lowStockFilter),
    ProductModel.aggregate([
      { $match: { status: "active" } },
      { $unwind: "$categories" },
      { $match: { "categories.level": "group" } },
      { $group: { _id: "$categories.name", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    OrderModel.aggregate([
      { $match: { createdAt: { $gte: week.from, $lte: week.to } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
    ]),
  ]).catch((err) => {
    console.error("[dashboard] getDashboardData", err);
    throw err;
  });

  return {
    dateRange, orderKpis, orderAnalytics, quoteKpis, quoteAnalytics, quoteList,
    metrics: {
      products: { now: productsNow, new: productsNew, prevNew: productsPrevNew },
      brands: { now: brandsNow, new: brandsNew, prevNew: brandsPrevNew },
      categories: { now: categoriesNow, new: categoriesNew, prevNew: categoriesPrevNew },
      customers: { now: customersNow, new: customersNew, prevNew: customersPrevNew },
      quotesPending: quotesPendingNow,
      orders: { now: ordersNow, new: ordersNew, prevNew: ordersPrevNew },
    },
    lowStock: { items: lowStockItems, total: lowStockTotal },
    catalogMixRaw: catalogMixRaw as { _id: string; count: number }[],
    ordersByDayRaw: ordersByDayRaw as { _id: string; count: number }[],
  };
}

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
const QUICK_ACTIONS = [
  { label: "Add Product", href: "/dashboard/products/new", icon: <Plus size={14} />, accent: "var(--color-success-700)", accentBg: "var(--color-success-50)" },
  { label: "Review RFQs", href: "/dashboard/quotes?status=pending", icon: <FileText size={14} />, accent: "var(--color-warning-700)", accentBg: "var(--color-warning-50)" },
  { label: "Import Catalog", href: "/dashboard/products/import", icon: <Package size={14} />, accent: "var(--apt-text-secondary)", accentBg: "var(--apt-bg-raised)" },
  { label: "Odoo Sync", href: "/dashboard/integrations", icon: <RefreshCw size={14} />, accent: "var(--apt-text-secondary)", accentBg: "var(--apt-bg-raised)" },
];

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface QuoteRow {
  _id: { toString(): string };
  ref: string;
  client: { name: string; company?: string };
  totals?: { grandTotal?: number; currency?: string };
  status: string;
  createdAt: Date;
  salesRepName?: string;
  items: unknown[];
}

/* ─── Page ────────────────────────────────────────────────────────────────── */
export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; range?: string }>;
}) {
  const params = await searchParams;
  const range: DatePreset = VALID_RANGES.includes(params.range as DatePreset) ? (params.range as DatePreset) : "30d";

  const data = await getDashboardData(range);
  const now = new Date();

  const rangeLabel = data.dateRange.label;

  // Orders-by-day: fill Mon–Sun buckets ending today
  const dayBuckets: { label: string; value: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86_400_000);
    const key = d.toISOString().slice(0, 10);
    const found = data.ordersByDayRaw.find((r) => r._id === key);
    const utcDay = d.getUTCDay();
    dayBuckets.push({ label: WEEKDAY_LABELS[utcDay === 0 ? 6 : utcDay - 1], value: found?.count ?? 0 });
  }

  // Catalog mix: top 4 groups + Other
  const totalCatalog = data.catalogMixRaw.reduce((a, c) => a + c.count, 0);
  const topGroups = data.catalogMixRaw.slice(0, 4);
  const otherCount = totalCatalog - topGroups.reduce((a, c) => a + c.count, 0);
  const catalogSegments = [
    ...topGroups.map((g, i) => ({ label: g._id, value: g.count, color: CATEGORY_COLORS[i] })),
    ...(otherCount > 0 ? [{ label: "Other", value: otherCount, color: CATEGORY_COLORS[4] }] : []),
  ];

  // RFQ pipeline stages
  const bucket = (statuses: string[]) =>
    data.quoteAnalytics.byStatus.filter((s) => statuses.includes(s.status)).reduce((a, s) => a + s.count, 0);
  const pipelineStages = [
    { label: "Pending review", count: bucket(["draft", "pending"]), color: "linear-gradient(90deg, #F5820A, #FFA23E)" },
    { label: "In review", count: bucket(["reviewing", "waiting_customer"]), color: "#38BDF8" },
    { label: "Quoted", count: bucket(["approved", "paid", "processing", "ready_for_delivery", "shipped"]), color: "#5B6CFF" },
    { label: "Won", count: bucket(["delivered", "completed"]), color: "#12B76A" },
  ];

  const revenueTrendLabels = data.orderAnalytics.revenueTrend.map((d) =>
    new Date(d.date + "T12:00:00Z").toLocaleDateString("en-GH", { day: "numeric", month: "short" })
  );

  const greeting = now.getHours() < 12 ? "Good morning" : now.getHours() < 17 ? "Good afternoon" : "Good evening";

  return (
    <div>
      {params.error === "forbidden" && (
        <div
          className="flex items-center gap-2.5 px-4 sm:px-6 py-3 text-[13px]"
          style={{ background: "var(--color-error-50)", color: "var(--color-error-700)", borderBottom: "1px solid var(--apt-border)" }}
        >
          <ShieldAlert size={15} />
          You don&apos;t have permission to access that page. Contact a super admin if you believe this is a mistake.
        </div>
      )}

      <div className="p-4 sm:p-6 space-y-5">
        {/* Page header */}
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-[24px] font-extrabold tracking-tight" style={{ color: "var(--apt-text-primary)" }}>
                Command Center
              </h1>
              <span
                className="text-[10.5px] font-bold font-mono px-2 py-0.5 rounded-md"
                style={{ background: "var(--color-success-50)", color: "var(--color-success-700)", border: "1px solid var(--color-success-100)" }}
              >
                GHANA · GH₵
              </span>
            </div>
            <p className="mt-1 text-[13px]" style={{ color: "var(--apt-text-secondary)" }}>
              {greeting}, {now.toLocaleDateString("en-GH", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <TimeRangeTabs current={range} basePath="/dashboard" />
            <a
              href={`/api/exports?dataset=sales&format=csv&from=${data.dateRange.from.toISOString().slice(0, 10)}&to=${data.dateRange.to.toISOString().slice(0, 10)}`}
            >
              <Button variant="secondary" size="md" icon={<Download size={13} />}>Export</Button>
            </a>
            <Link href="/dashboard/products/new">
              <Button variant="primary" size="md" icon={<Plus size={13} />}>New Product</Button>
            </Link>
          </div>
        </div>

        {/* Row 1: revenue hero + pipeline */}
        <div className="grid grid-cols-1 xl:grid-cols-[1.6fr_1fr] gap-4">
          <RevenueHero
            value={fmtMoneyCompact(data.orderKpis.totalRevenue)}
            deltaPct={data.orderKpis.monthlyGrowth}
            hint={`${rangeLabel} · vs previous period`}
            labels={revenueTrendLabels}
            series={[{ name: "Revenue", color: "#12B76A", values: data.orderAnalytics.revenueTrend.map((d) => d.revenue) }]}
          />
          <PipelineCard
            weightedValue={fmtMoneyCompact(data.quoteKpis.totalRevenue)}
            openCount={data.quoteKpis.openCount}
            stages={pipelineStages}
            conversionRate={data.quoteKpis.conversionRate}
          />
        </div>

        {/* Row 2: KPI strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          <StatCard
            label="Active Products" value={formatNumber(data.metrics.products.now)}
            current={data.metrics.products.new} previous={data.metrics.products.prevNew}
            hint={rangeLabel.toLowerCase()} accent="#12B76A" href="/dashboard/products"
          />
          <StatCard
            label="Pending RFQs" value={formatNumber(data.metrics.quotesPending)}
            hint="needs review" accent="#F5820A" href="/dashboard/quotes?status=pending"
          />
          <StatCard
            label="Total Orders" value={formatNumber(data.metrics.orders.now)}
            current={data.metrics.orders.new} previous={data.metrics.orders.prevNew}
            hint={rangeLabel.toLowerCase()} accent="#12B76A" href="/dashboard/orders"
          />
          <StatCard
            label="Customers" value={formatNumber(data.metrics.customers.now)}
            current={data.metrics.customers.new} previous={data.metrics.customers.prevNew}
            hint={rangeLabel.toLowerCase()} accent="#12B76A" href="/dashboard/customers"
          />
          <StatCard
            label="Brands" value={formatNumber(data.metrics.brands.now)}
            current={data.metrics.brands.new} previous={data.metrics.brands.prevNew}
            hint={rangeLabel.toLowerCase()} accent="#94A3B8" href="/dashboard/brands"
          />
          <StatCard
            label="Categories" value={formatNumber(data.metrics.categories.now)}
            current={data.metrics.categories.new} previous={data.metrics.categories.prevNew}
            hint={rangeLabel.toLowerCase()} accent="#12B76A" href="/dashboard/categories"
          />
        </div>

        {/* Row 3: quotes table + right rail */}
        <div className="grid grid-cols-1 xl:grid-cols-[1.7fr_1fr] gap-4">
          <div className="rounded-2xl overflow-hidden" style={{ background: "var(--apt-bg)", border: "1px solid var(--apt-border)" }}>
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--apt-border)" }}>
              <div>
                <h2 className="text-[14.5px] font-bold" style={{ color: "var(--apt-text-primary)" }}>Recent Quotes &amp; RFQs</h2>
                <p className="text-[12px] mt-0.5" style={{ color: "var(--apt-text-muted)" }}>Latest customer enquiries across all reps</p>
              </div>
              <Link href="/dashboard/quotes">
                <Button variant="ghost" size="xs" iconRight={<ArrowRight size={11} />}>View all</Button>
              </Link>
            </div>
            {data.quoteList.rows.length === 0 ? (
              <div className="py-12 text-center text-[13px]" style={{ color: "var(--apt-text-muted)" }}>No quotes yet</div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Ref</th><th>Customer</th><th className="text-right">Value ({CURRENCY})</th><th>Owner</th><th>Stage</th><th className="text-right">Age</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.quoteList.rows as unknown as QuoteRow[]).map((q) => (
                    <tr key={q._id.toString()}>
                      <td>
                        <Link href={`/dashboard/quotes/${q._id.toString()}`} className="font-mono text-[12px] font-semibold hover:underline" style={{ color: "var(--color-success-700)" }}>
                          {q.ref}
                        </Link>
                      </td>
                      <td>
                        <div className="text-[12.5px] font-semibold" style={{ color: "var(--apt-text-primary)" }}>{q.client.name}</div>
                        <div className="text-[11px]" style={{ color: "var(--apt-text-muted)" }}>{q.items.length} line item{q.items.length !== 1 ? "s" : ""}</div>
                      </td>
                      <td className="text-right font-mono text-[12.5px] font-semibold" style={{ color: "var(--apt-text-primary)" }}>
                        {(q.totals?.grandTotal ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        {q.totals?.currency && q.totals.currency !== CURRENCY && (
                          <span className="ml-1 text-[10px] font-normal" style={{ color: "var(--apt-text-muted)" }}>{q.totals.currency}</span>
                        )}
                      </td>
                      <td className="text-[12px]" style={{ color: "var(--apt-text-secondary)" }}>{q.salesRepName ?? "Unassigned"}</td>
                      <td><Badge variant={statusVariant(q.status)} dot>{q.status.replace(/_/g, " ")}</Badge></td>
                      <td className="text-right text-[11.5px] font-mono" style={{ color: "var(--apt-text-muted)" }}>
                        <span className="inline-flex items-center gap-1"><Clock size={11} />{timeAgo(new Date(q.createdAt))}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="flex flex-col gap-4">
            <QuickActionsGrid actions={QUICK_ACTIONS} />
            <LowStockPanel
              items={(data.lowStock.items as unknown as { _id: { toString(): string }; name: string; sku: string; inventory?: { quantity?: number; reorderPoint?: number } }[]).map((p) => ({
                id: p._id.toString(), name: p.name, sku: p.sku,
                quantity: p.inventory?.quantity ?? 0, reorderPoint: p.inventory?.reorderPoint ?? 0,
              }))}
              total={data.lowStock.total}
            />
          </div>
        </div>

        {/* Row 4: analytics band */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Panel title={`Orders · Last 7 Days`} subtitle="Daily order volume">
            <MiniBarChart bars={dayBuckets} accent="#12B76A" />
          </Panel>
          <Panel title="Catalog Mix" subtitle="Active products by group">
            <Donut segments={catalogSegments} centerLabel="SKUs" centerValue={formatNumber(totalCatalog)} />
          </Panel>
          <Panel title="Sales by Rep" subtitle={rangeLabel}>
            <BarList
              accent="#12B76A"
              valueFormatter={fmtMoneyCompact}
              items={data.orderAnalytics.salesRepPerformance.map((r) => ({ label: r.name, value: Math.round(r.revenue), secondary: `${r.count} order${r.count !== 1 ? "s" : ""}` }))}
            />
          </Panel>
        </div>
      </div>
    </div>
  );
}
