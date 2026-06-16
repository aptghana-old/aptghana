import { Panel, BarList } from "@/components/analytics/primitives";
import { AreaChart, Funnel } from "@/components/analytics/charts";
import type { DealAnalytics } from "@/lib/dealFilters";

export default function DealAnalyticsPanels({ analytics }: { analytics: DealAnalytics }) {
  const trendLabels = analytics.revenueTrend.map((d) => new Date(d.date + "T12:00:00Z").toLocaleDateString("en-GH", { day: "numeric", month: "short" }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2">
          <Panel title="Revenue trend" subtitle="Daily revenue for the filtered period">
            <AreaChart labels={trendLabels} series={[{ name: "Revenue", color: "#00B37E", values: analytics.revenueTrend.map((d) => d.revenue) }]} />
          </Panel>
        </div>
        <Panel title="Conversion funnel" subtitle="Stage progression">
          <Funnel stages={analytics.funnel} />
        </Panel>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Panel title="By status" subtitle="Volume per status">
          <BarList accent="#0EA5E9" items={analytics.byStatus.map((s) => ({ label: s.status.replace(/_/g, " "), value: s.count }))} />
        </Panel>
        <Panel title="Top customers" subtitle="By value">
          <BarList accent="#A78BFA" items={analytics.topCustomers.map((c) => ({ label: c.name, value: Math.round(c.value), secondary: `${c.count} deal${c.count !== 1 ? "s" : ""}` }))} />
        </Panel>
        <Panel title="Top brands" subtitle="By line items">
          <BarList accent="#F59E0B" items={analytics.topBrands.map((b) => ({ label: b.brand, value: b.count }))} />
        </Panel>
      </div>

      <Panel title="Sales rep performance" subtitle="Revenue attributed via assigned customer">
        <BarList accent="#00D68F" items={analytics.salesRepPerformance.map((r) => ({ label: r.name, value: Math.round(r.revenue), secondary: `${r.count} deal${r.count !== 1 ? "s" : ""}` }))} />
      </Panel>
    </div>
  );
}
