import type { Metadata } from "next";
import Link from "next/link";
import { hasPermission, type AdminRole } from "@apt/auth";
import { Badge, statusVariant } from "@/components/ui/Badge";
import ExportMenu from "@/components/exports/ExportMenu";
import { auth } from "@/lib/auth";
import { getDealList, getDealKpis, getDealAnalytics, getDealFilterOptions, parseDealParams, resolveDatePreset } from "@/lib/dealFilters";
import DealListShell from "@/components/deals/DealListShell";
import type { DealColumn, DealTableRow } from "@/components/deals/DealTable";
import OrdersOverview, { compactMoney } from "@/components/orders/OrdersOverview";
import OrdersQuickFilters from "@/components/orders/OrdersQuickFilters";

export const metadata: Metadata = { title: "Orders" };
export const dynamic = "force-dynamic";

const PAGE_SIZE = 40;

const COLUMNS: DealColumn[] = [
  { key: "ref", label: "Order" },
  { key: "customer", label: "Customer" },
  { key: "rep", label: "Rep" },
  { key: "items", label: "Items", align: "center" },
  { key: "total", label: "Total", align: "right", sortable: true },
  { key: "status", label: "Status" },
  { key: "paymentStatus", label: "Payment" },
  { key: "channel", label: "Channel", defaultVisible: false },
  { key: "createdAt", label: "Date", align: "right", sortable: true },
];

interface OrderRow {
  _id: { toString(): string };
  ref: string;
  customerName?: string;
  customerEmail?: string;
  items?: unknown[];
  total?: number;
  currency?: string;
  status: string;
  paymentStatus?: string;
  originChannel?: string;
  salesRepName?: string;
  createdAt: string;
}

interface Props {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function OrdersPage({ searchParams }: Props) {
  const sp = await searchParams;
  const params = parseDealParams(sp);
  const page = Math.max(1, parseInt(sp.page ?? "1", 10));

  const session = await auth();
  const role = (session?.user as { role?: AdminRole } | undefined)?.role ?? "sales";
  const overrides = (session?.user as { permissions?: string[] } | undefined)?.permissions ?? [];
  const canEdit = hasPermission(role, overrides, "orders:edit");
  const canExport = hasPermission(role, overrides, "exports:run");

  const [{ rows, total }, kpis, analytics, options] = await Promise.all([
    getDealList("order", params, page, PAGE_SIZE),
    getDealKpis("order", params),
    getDealAnalytics("order", params),
    getDealFilterOptions("order"),
  ]);

  const typedRows = rows as unknown as OrderRow[];

  function renderCell(o: OrderRow, key: string): React.ReactNode {
    switch (key) {
      case "ref":
        return (
          <Link href={`/dashboard/orders/${o._id.toString()}`} className="font-mono text-[12px] hover:underline" style={{ color: "var(--apt-text-brand)" }}>
            {o.ref}
          </Link>
        );
      case "customer":
        return (
          <div>
            <div className="text-[13px] font-medium" style={{ color: "var(--apt-text-primary)" }}>{o.customerName ?? "Guest"}</div>
            {o.customerEmail && <div className="text-[11px]" style={{ color: "var(--apt-text-muted)" }}>{o.customerEmail}</div>}
          </div>
        );
      case "rep":
        return <span className="text-[12px]" style={{ color: "var(--apt-text-secondary)" }}>{o.salesRepName ?? "—"}</span>;
      case "items":
        return <span className="font-mono text-[12px]" style={{ color: "var(--apt-text-secondary)" }}>{o.items?.length ?? 0}</span>;
      case "total":
        return o.total ? (
          <span className="text-[13px] font-semibold tabular-nums" style={{ color: "var(--apt-text-primary)" }}>{o.currency ?? "GHS"} {o.total.toLocaleString()}</span>
        ) : <span style={{ color: "var(--apt-text-disabled)" }}>—</span>;
      case "status":
        return <Badge variant={statusVariant(o.status)} dot>{o.status.replace(/_/g, " ")}</Badge>;
      case "paymentStatus":
        return o.paymentStatus ? <Badge variant={statusVariant(o.paymentStatus)}>{o.paymentStatus}</Badge> : <span style={{ color: "var(--apt-text-disabled)" }}>—</span>;
      case "channel":
        return <span className="text-[12px] capitalize" style={{ color: "var(--apt-text-muted)" }}>{o.originChannel ?? "—"}</span>;
      case "createdAt":
        return <span className="font-mono text-[11.5px]" style={{ color: "var(--apt-text-muted)" }}>{new Date(o.createdAt).toLocaleDateString("en-GH", { day: "numeric", month: "short", year: "2-digit" })}</span>;
      default:
        return null;
    }
  }

  const tableRows: DealTableRow[] = typedRows.map((o) => ({
    id: o._id.toString(),
    cells: Object.fromEntries(COLUMNS.map((c) => [c.key, renderCell(o, c.key)])),
  }));

  const currency = options.currencies[0] ?? "GHS";
  const rangeLabel = resolveDatePreset(params).label;

  return (
    <div>
      {/* ── Header ── */}
      <div
        className="flex items-end justify-between gap-4 px-4 sm:px-6 py-5 flex-wrap"
        style={{ borderBottom: "1px solid var(--apt-border)", background: "var(--apt-bg)" }}
      >
        <div className="min-w-0">
          <h1 className="text-[24px] font-extrabold tracking-tight leading-none" style={{ color: "var(--apt-text-primary)" }}>
            Orders
          </h1>
          <p className="text-[13px] mt-1.5" style={{ color: "var(--apt-text-muted)" }}>
            {total.toLocaleString()} order{total !== 1 ? "s" : ""} · {compactMoney(kpis.totalRevenue, currency)} gross merchandise value · {rangeLabel.toLowerCase()}
          </p>
        </div>
        {canExport && (
          <div className="flex items-center gap-2 shrink-0">
            <ExportMenu datasets={[{ key: "orders", label: "Orders" }, { key: "sales", label: "Sales" }, { key: "payments", label: "Payments" }]} inheritParams={["status", "preset", "salesRep", "currency"]} />
          </div>
        )}
      </div>

      <DealListShell
        kind="order"
        options={options}
        current={sp}
        storageNamespace="orders"
        kpis={kpis}
        currency={currency}
        analytics={analytics}
        columns={COLUMNS}
        rows={tableRows}
        total={total}
        page={page}
        pageSize={PAGE_SIZE}
        overview={<OrdersOverview kpis={kpis} analytics={analytics} currency={currency} rangeLabel={rangeLabel} />}
        quickFilters={<OrdersQuickFilters statusCounts={analytics.byStatus} />}
        bulkEndpoint={canEdit ? "/api/orders/bulk" : undefined}
        bulkStatusOptions={canEdit ? [
          { value: "confirmed", label: "Confirmed" }, { value: "processing", label: "Processing" },
          { value: "shipped", label: "Shipped" }, { value: "delivered", label: "Delivered" }, { value: "cancelled", label: "Cancelled" },
        ] : undefined}
      />
    </div>
  );
}
