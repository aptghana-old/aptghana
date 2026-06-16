import { StatCard } from "@/components/analytics/primitives";
import { formatNumber, formatPercent } from "@/lib/analytics/range";
import type { DealKind, DealKpis } from "@/lib/dealFilters";

function fmtMoney(n: number, currency = "GHS") {
  return `${currency} ${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

export default function DealKpiRow({ kind, kpis, currency }: { kind: DealKind; kpis: DealKpis; currency: string }) {
  const noun = kind === "quote" ? "Quotes" : "Orders";
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-3">
      <StatCard label={`Total ${noun}`} value={formatNumber(kpis.totalCount)} accent="#0EA5E9" />
      <StatCard label="Total Revenue" value={fmtMoney(kpis.totalRevenue, currency)} accent="#00B37E" />
      <StatCard label="Average Value" value={fmtMoney(kpis.avgValue, currency)} accent="#A78BFA" />
      <StatCard label="Open / Pending" value={formatNumber(kpis.openCount)} accent="#F59E0B" />
      <StatCard label="Conversion Rate" value={kpis.conversionRate != null ? formatPercent(kpis.conversionRate) : "—"} hint={kind === "quote" ? "became orders" : "paid"} accent="#F472B6" />
      <StatCard label="Monthly Growth" value={kpis.monthlyGrowth != null ? `${kpis.monthlyGrowth >= 0 ? "+" : ""}${kpis.monthlyGrowth.toFixed(1)}%` : "—"} hint="revenue vs prior period" accent={kpis.monthlyGrowth != null && kpis.monthlyGrowth < 0 ? "#dc2626" : "#00D68F"} />
      <StatCard label="Expiring Quotes" value={kind === "quote" ? formatNumber(kpis.expiringQuotes) : "—"} hint={kind === "quote" ? "within 7 days" : "orders don't expire"} accent="#dc2626" />
      <StatCard label="Outstanding Payments" value={fmtMoney(kpis.outstandingAmount, currency)} hint={kind === "quote" ? "awaiting payment" : "unpaid orders"} accent="#dc2626" />
    </div>
  );
}
