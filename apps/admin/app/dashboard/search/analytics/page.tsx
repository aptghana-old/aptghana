import type { Metadata } from "next";
import { TrendingUp, Search, BarChart2 } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { ComingSoon } from "@/components/ui/ComingSoon";

export const metadata: Metadata = { title: "Search Analytics" };

const TOP_QUERIES = [
  { query: "vfd", count: "—", clicks: "—", ctr: "—" },
  { query: "circuit breaker", count: "—", clicks: "—", ctr: "—" },
  { query: "contactor", count: "—", clicks: "—", ctr: "—" },
  { query: "schneider", count: "—", clicks: "—", ctr: "—" },
  { query: "pressure sensor", count: "—", clicks: "—", ctr: "—" },
];

export default function SearchAnalyticsPage() {
  return (
    <div>
      <PageHeader title="Search Analytics" description="What customers are searching for on the store." />
      <div className="p-6 space-y-5">
        <div className="grid grid-cols-3 gap-4">
          {[["Total Searches", "—"], ["Click-Through Rate", "—"], ["Avg. Results/Query", "—"]].map(([label, val]) => (
            <div key={label} className="card p-5">
              <div className="text-[24px] font-bold mb-1" style={{ color: "var(--apt-text-primary)" }}>{val}</div>
              <div className="text-[12px]" style={{ color: "var(--apt-text-muted)" }}>{label}</div>
            </div>
          ))}
        </div>

        <div className="card overflow-hidden">
          <div className="card-header">
            <h2 className="text-[14px] font-semibold" style={{ color: "var(--apt-text-primary)" }}>Top Queries</h2>
          </div>
          <table className="data-table">
            <thead><tr><th>Query</th><th className="text-right">Searches</th><th className="text-right">Clicks</th><th className="text-right">CTR</th></tr></thead>
            <tbody>
              {TOP_QUERIES.map((r) => (
                <tr key={r.query}>
                  <td><span className="font-mono text-[12px] px-2 py-0.5 rounded" style={{ background: "#eff6ff", color: "#0057b8" }}>{r.query}</span></td>
                  <td className="text-right text-[13px]" style={{ color: "var(--apt-text-muted)" }}>{r.count}</td>
                  <td className="text-right text-[13px]" style={{ color: "var(--apt-text-muted)" }}>{r.clicks}</td>
                  <td className="text-right text-[13px]" style={{ color: "var(--apt-text-muted)" }}>{r.ctr}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <ComingSoon
            icon={<TrendingUp size={24} />}
            title="Search Analytics Integration"
            description="Meilisearch analytics will be connected to show real-time search volume, click-through rates, and zero-result detection."
            milestones={[
              { label: "Meilisearch analytics API", done: false },
              { label: "Query volume trending", done: false },
              { label: "CTR & bounce tracking", done: false },
              { label: "Personalisation signals", done: false },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
