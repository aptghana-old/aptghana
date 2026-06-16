import type { Metadata } from "next";
import Link from "next/link";
import {
  Package, Tag, FolderTree, FileText,
  ShoppingCart, Users, TrendingUp, TrendingDown,
  ArrowRight, Clock, AlertTriangle, CheckCircle2,
  BarChart3, Zap, ShieldAlert,
} from "lucide-react";
import { connectDB, ProductModel, BrandModel, CategoryModel, QuoteModel, OrderModel, UserModel } from "@apt/db";
import { Badge, statusVariant } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata: Metadata = { title: "Dashboard" };
export const revalidate = 60;

/* ─── Data fetching ───────────────────────────────────────────────────────── */
async function getMetrics() {
  try {
    await connectDB();
    const [products, brands, categories, pendingQuotes, totalOrders, customers] =
      await Promise.all([
        ProductModel.countDocuments({ status: "active" }),
        BrandModel.countDocuments({ status: "active" }),
        CategoryModel.countDocuments({ status: "active" }),
        QuoteModel.countDocuments({ status: "pending" }),
        OrderModel.countDocuments({}),
        UserModel.countDocuments({ status: "active" }),
      ]);
    return { products, brands, categories, pendingQuotes, totalOrders, customers };
  } catch {
    return { products: 0, brands: 0, categories: 0, pendingQuotes: 0, totalOrders: 0, customers: 0 };
  }
}

async function getRecentQuotes() {
  try {
    await connectDB();
    return QuoteModel.find({})
      .select("ref client status createdAt items")
      .sort({ createdAt: -1 })
      .limit(8)
      .lean();
  } catch {
    return [];
  }
}

async function getTopProducts() {
  try {
    await connectDB();
    return ProductModel.find({ status: "active" })
      .select("name sku brandId pricing.listPrice inventory.quantity")
      .sort({ "inventory.salesCount": -1, createdAt: -1 })
      .limit(5)
      .lean();
  } catch {
    return [];
  }
}

/* ─── Metric card ─────────────────────────────────────────────────────────── */
function MetricCard({
  label, value, sub, icon, trend, href,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  trend?: { direction: "up" | "down" | "neutral"; label: string };
  href?: string;
}) {
  const card = (
    <div
      className="card p-5 hover:shadow-md transition-shadow group"
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center"
          style={{ background: "var(--apt-bg-raised)" }}
        >
          <span style={{ color: "var(--apt-text-brand)" }}>{icon}</span>
        </div>
        {trend && (
          <div
            className={`flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${
              trend.direction === "up"
                ? "bg-[#dcfce7] text-[#15803d]"
                : trend.direction === "down"
                ? "bg-[#fee2e2] text-[#b91c1c]"
                : "bg-[var(--apt-bg-raised)] text-[var(--apt-text-muted)]"
            }`}
          >
            {trend.direction === "up" && <TrendingUp size={10} />}
            {trend.direction === "down" && <TrendingDown size={10} />}
            {trend.label}
          </div>
        )}
      </div>
      <div className="text-[26px] font-bold tracking-tight leading-none mb-1" style={{ color: "var(--apt-text-primary)" }}>
        {typeof value === "number" ? value.toLocaleString() : value}
      </div>
      <div className="text-[13px] font-medium" style={{ color: "var(--apt-text-secondary)" }}>{label}</div>
      {sub && <div className="text-[11px] mt-0.5" style={{ color: "var(--apt-text-muted)" }}>{sub}</div>}
    </div>
  );

  if (href) return <Link href={href} className="block">{card}</Link>;
  return card;
}

/* ─── Quick actions ───────────────────────────────────────────────────────── */
const QUICK_ACTIONS = [
  { label: "Add Product",         href: "/dashboard/products/new",        icon: <Package size={14} />, variant: "primary" as const },
  { label: "Add Brand",           href: "/dashboard/brands/new",          icon: <Tag size={14} /> },
  { label: "Pending RFQs",        href: "/dashboard/quotes?status=pending",icon: <FileText size={14} /> },
  { label: "Import Products",     href: "/dashboard/products/import",     icon: <BarChart3 size={14} /> },
  { label: "Search Config",       href: "/dashboard/search",              icon: <Zap size={14} /> },
  { label: "Odoo Sync",           href: "/dashboard/integrations",        icon: <TrendingUp size={14} /> },
];

/* ─── Page ────────────────────────────────────────────────────────────────── */
export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const [metrics, quotes, topProducts, params] = await Promise.all([
    getMetrics(),
    getRecentQuotes(),
    getTopProducts(),
    searchParams,
  ]);

  const now = new Date();
  const greeting = now.getHours() < 12 ? "Good morning" : now.getHours() < 17 ? "Good afternoon" : "Good evening";

  return (
    <div>
      {params.error === "forbidden" && (
        <div
          className="flex items-center gap-2.5 px-4 sm:px-6 py-3 text-[13px]"
          style={{ background: "rgba(220,38,38,0.08)", color: "#dc2626", borderBottom: "1px solid var(--apt-border)" }}
        >
          <ShieldAlert size={15} />
          You don&apos;t have permission to access that page. Contact a super admin if you believe this is a mistake.
        </div>
      )}
      <PageHeader
        title={`${greeting}, Admin`}
        description={now.toLocaleDateString("en-GH", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        actions={
          <Link href="/dashboard/products/new">
            <Button variant="primary" size="sm" icon={<Package size={13} />}>
              Add Product
            </Button>
          </Link>
        }
      />

      <div className="p-4 sm:p-6 space-y-6">
        {/* Metric cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <MetricCard
            label="Active Products"
            value={metrics.products}
            icon={<Package size={17} />}
            trend={{ direction: "up", label: "+12" }}
            href="/dashboard/products"
          />
          <MetricCard
            label="Pending RFQs"
            value={metrics.pendingQuotes}
            sub="Needs review"
            icon={<FileText size={17} />}
            trend={metrics.pendingQuotes > 0 ? { direction: "neutral", label: "action needed" } : { direction: "neutral", label: "all clear" }}
            href="/dashboard/quotes?status=pending"
          />
          <MetricCard
            label="Total Orders"
            value={metrics.totalOrders}
            icon={<ShoppingCart size={17} />}
            href="/dashboard/orders"
          />
          <MetricCard
            label="Customers"
            value={metrics.customers}
            icon={<Users size={17} />}
            trend={{ direction: "up", label: "+3" }}
            href="/dashboard/customers"
          />
          <MetricCard
            label="Brands"
            value={metrics.brands}
            icon={<Tag size={17} />}
            href="/dashboard/brands"
          />
          <MetricCard
            label="Categories"
            value={metrics.categories}
            icon={<FolderTree size={17} />}
            href="/dashboard/categories"
          />
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Recent Quotes table */}
          <div className="xl:col-span-2 card overflow-hidden">
            <div className="card-header">
              <div>
                <h2 className="text-[14px] font-semibold" style={{ color: "var(--apt-text-primary)" }}>
                  Recent Quotes &amp; RFQs
                </h2>
                <p className="text-[12px] mt-0.5" style={{ color: "var(--apt-text-muted)" }}>
                  Latest customer enquiries
                </p>
              </div>
              <Link href="/dashboard/quotes">
                <Button variant="ghost" size="xs" iconRight={<ArrowRight size={11} />}>
                  View all
                </Button>
              </Link>
            </div>

            {quotes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <CheckCircle2 size={28} style={{ color: "var(--apt-text-muted)" }} />
                <p className="text-[13px] mt-3" style={{ color: "var(--apt-text-muted)" }}>No quotes yet</p>
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Ref</th>
                    <th>Customer</th>
                    <th>Items</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {quotes.map((q) => {
                    const quote = q as unknown as {
                      _id: { toString(): string };
                      ref: string;
                      client: { name: string; company?: string };
                      status: string;
                      createdAt: Date;
                      items: unknown[];
                    };
                    return (
                      <tr key={quote._id.toString()}>
                        <td>
                          <Link
                            href={`/dashboard/quotes/${quote._id.toString()}`}
                            className="font-mono text-[12px] hover:underline"
                            style={{ color: "var(--apt-text-brand)" }}
                          >
                            {quote.ref}
                          </Link>
                        </td>
                        <td>
                          <div className="text-[13px] font-medium" style={{ color: "var(--apt-text-primary)" }}>
                            {quote.client.name}
                          </div>
                          {quote.client.company && (
                            <div className="text-[11px]" style={{ color: "var(--apt-text-muted)" }}>
                              {quote.client.company}
                            </div>
                          )}
                        </td>
                        <td>
                          <span className="text-[12px]" style={{ color: "var(--apt-text-muted)" }}>
                            {(quote.items as unknown[]).length} item{(quote.items as unknown[]).length !== 1 ? "s" : ""}
                          </span>
                        </td>
                        <td>
                          <Badge variant={statusVariant(quote.status)} dot>
                            {quote.status}
                          </Badge>
                        </td>
                        <td>
                          <span className="flex items-center gap-1 text-[12px]" style={{ color: "var(--apt-text-muted)" }}>
                            <Clock size={11} />
                            {new Date(quote.createdAt).toLocaleDateString("en-GH", { day: "numeric", month: "short" })}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Right column */}
          <div className="space-y-6">
            {/* Quick actions */}
            <div className="card">
              <div className="card-header">
                <h2 className="text-[14px] font-semibold" style={{ color: "var(--apt-text-primary)" }}>
                  Quick Actions
                </h2>
              </div>
              <div className="p-2">
                {QUICK_ACTIONS.map((action) => (
                  <Link
                    key={action.href}
                    href={action.href}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors hover:bg-[var(--apt-bg-raised)]"
                  >
                    <span
                      className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
                      style={{
                        background: action.variant === "primary" ? "#eff6ff" : "var(--apt-bg-raised)",
                        color: action.variant === "primary" ? "#0057b8" : "var(--apt-text-muted)",
                      }}
                    >
                      {action.icon}
                    </span>
                    <span className="text-[13px] font-medium" style={{ color: "var(--apt-text-secondary)" }}>
                      {action.label}
                    </span>
                    <ArrowRight size={12} className="ml-auto" style={{ color: "var(--apt-text-muted)" }} />
                  </Link>
                ))}
              </div>
            </div>

            {/* Top products */}
            {topProducts.length > 0 && (
              <div className="card">
                <div className="card-header">
                  <h2 className="text-[14px] font-semibold" style={{ color: "var(--apt-text-primary)" }}>
                    Top Products
                  </h2>
                  <Link href="/dashboard/products">
                    <Button variant="ghost" size="xs" iconRight={<ArrowRight size={11} />}>All</Button>
                  </Link>
                </div>
                <div className="divide-y" style={{ borderColor: "var(--apt-border)" }}>
                  {topProducts.map((p) => {
                    const product = p as unknown as {
                      _id: { toString(): string };
                      name: string;
                      sku: string;
                      pricing?: { listPrice?: number };
                      inventory?: { quantity?: number };
                    };
                    const qty = product.inventory?.quantity ?? 0;
                    return (
                      <Link
                        key={product._id.toString()}
                        href={`/dashboard/products/${product._id.toString()}`}
                        className="flex items-center gap-3 px-5 py-3 hover:bg-[var(--apt-bg-subtle)] transition-colors"
                      >
                        <div
                          className="w-8 h-8 rounded-md shrink-0 flex items-center justify-center"
                          style={{ background: "var(--apt-bg-raised)" }}
                        >
                          <Package size={14} style={{ color: "var(--apt-text-muted)" }} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[12px] font-medium truncate" style={{ color: "var(--apt-text-primary)" }}>
                            {product.name}
                          </div>
                          <div className="text-[11px]" style={{ color: "var(--apt-text-muted)" }}>
                            {product.sku}
                          </div>
                        </div>
                        {qty < 5 && (
                          <AlertTriangle size={13} className="shrink-0 text-amber-500" />
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
