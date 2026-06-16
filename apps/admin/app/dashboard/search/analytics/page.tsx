import type { Metadata } from "next";
import Link from "next/link";
import { hasPermission, type AdminRole } from "@apt/auth";
import { ArrowDownRight } from "lucide-react";
import { resolveRange, formatNumber, formatPercent } from "@/lib/analytics/range";
import { Panel, StatCard, EmptyState } from "@/components/analytics/primitives";
import { AreaChart, Funnel } from "@/components/analytics/charts";
import { auth } from "@/lib/auth";
import ExportMenu from "@/components/exports/ExportMenu";
import {
  getKpis, getVolumeTrend, getPerformanceTrend, getCtrAndConversionTrend,
  getTopSearches, getTopPerforming, getFunnel, getCountryOptions,
  type AnalyticsFilters, type TopSearchSort,
} from "@/lib/searchAnalyticsService";

export const metadata: Metadata = { title: "Search Analytics" };
export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ range?: string; source?: string; country?: string; sort?: string; page?: string }>;
}

const RANGES = [{ label: "7d", value: "7d" }, { label: "30d", value: "30d" }, { label: "90d", value: "90d" }];
const SOURCES = [{ label: "All sources", value: "" }, { label: "Web", value: "web" }, { label: "Store", value: "store" }];

function fmtMs(ms: number | null): string {
  if (ms == null) return "—";
  return ms < 1000 ? `${Math.round(ms)}ms` : `${(ms / 1000).toFixed(2)}s`;
}

function fmtPct(n: number | null): string {
  return n == null ? "—" : formatPercent(n);
}

export default async function SearchAnalyticsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const r = resolveRange(sp.range);
  const sort = (sp.sort as TopSearchSort) ?? "searches";
  const page = Math.max(1, parseInt(sp.page ?? "1", 10));

  const session = await auth();
  const role = (session?.user as { role?: AdminRole } | undefined)?.role ?? "sales";
  const overrides = (session?.user as { permissions?: string[] } | undefined)?.permissions ?? [];
  const canExport = hasPermission(role, overrides, "exports:run");

  const filters: AnalyticsFilters = { from: r.from, to: r.to, source: sp.source, country: sp.country };
  const prevFilters: AnalyticsFilters = { from: r.prevFrom, to: r.prevTo, source: sp.source, country: sp.country };

  const [kpis, prevKpis, volumeTrend, perfTrend, ctrTrend, topSearches, topPerforming, funnel, countries] = await Promise.all([
    getKpis(filters),
    getKpis(prevFilters),
    getVolumeTrend(filters),
    getPerformanceTrend(filters),
    getCtrAndConversionTrend(filters),
    getTopSearches(filters, { sort, page, pageSize: 25 }),
    getTopPerforming(filters, 10),
    getFunnel(filters),
    getCountryOptions(),
  ]);

  const baseQS = new URLSearchParams();
  if (sp.range) baseQS.set("range", sp.range);
  if (sp.source) baseQS.set("source", sp.source);
  if (sp.country) baseQS.set("country", sp.country);

  function sortLink(key: TopSearchSort) {
    const qs = new URLSearchParams(baseQS);
    qs.set("sort", key);
    return `?${qs.toString()}`;
  }

  const trendLabels = volumeTrend.map((d) => new Date(d._id + "T12:00:00Z").toLocaleDateString("en-GH", { day: "numeric", month: "short" }));
  const perfMap = new Map(perfTrend.map((p) => [p._id, p.avgMs]));

  const totalPages = Math.max(1, Math.ceil(topSearches.total / 25));

  return (
    <div>
      <div
        className="flex items-center justify-between gap-4 px-6 py-5 flex-wrap"
        style={{ borderBottom: "1px solid var(--apt-border)", background: "var(--apt-bg)" }}
      >
        <div>
          <h1 className="text-[20px] font-semibold tracking-tight" style={{ color: "var(--apt-text-primary)" }}>Search Analytics</h1>
          <p className="text-[13px] mt-0.5" style={{ color: "var(--apt-text-muted)" }}>
            {formatNumber(kpis.totalSearches)} searches · last {r.label}
          </p>
        </div>
        {canExport && <ExportMenu datasets={[{ key: "search_queries", label: "Top Searches" }]} inheritParams={["range", "source", "country"]} />}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 px-6 py-3 flex-wrap" style={{ borderBottom: "1px solid var(--apt-border)" }}>
        <div className="flex items-center rounded-lg overflow-hidden" style={{ background: "var(--apt-bg-raised)", border: "1px solid var(--apt-border)" }}>
          {RANGES.map((rg) => {
            const qs = new URLSearchParams(baseQS); qs.set("range", rg.value);
            return <Link key={rg.value} href={`?${qs.toString()}`} className="px-2.5 py-1 text-xs font-medium" style={{ color: r.key === rg.value ? "var(--apt-text-primary)" : "var(--apt-text-muted)" }}>{rg.label}</Link>;
          })}
        </div>
        <div className="flex items-center rounded-lg overflow-hidden" style={{ background: "var(--apt-bg-raised)", border: "1px solid var(--apt-border)" }}>
          {SOURCES.map((s) => {
            const qs = new URLSearchParams(baseQS); if (s.value) qs.set("source", s.value); else qs.delete("source");
            return <Link key={s.value} href={`?${qs.toString()}`} className="px-2.5 py-1 text-xs font-medium" style={{ color: (sp.source ?? "") === s.value ? "var(--apt-text-primary)" : "var(--apt-text-muted)" }}>{s.label}</Link>;
          })}
        </div>
        {countries.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap">
            <Link href={`?${(() => { const qs = new URLSearchParams(baseQS); qs.delete("country"); return qs.toString(); })()}`}
              className="px-2.5 py-1 text-xs font-medium rounded-md" style={{ background: !sp.country ? "var(--apt-bg-raised)" : "transparent", color: "var(--apt-text-muted)" }}>
              All countries
            </Link>
            {countries.slice(0, 8).map((c) => {
              const qs = new URLSearchParams(baseQS); qs.set("country", c);
              return <Link key={c} href={`?${qs.toString()}`} className="px-2.5 py-1 text-xs font-medium rounded-md" style={{ background: sp.country === c ? "var(--apt-bg-raised)" : "transparent", color: "var(--apt-text-muted)" }}>{c}</Link>;
            })}
          </div>
        )}
      </div>

      <div className="p-4 sm:p-6 space-y-4 max-w-[1600px]">
        {/* KPI grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          <StatCard label="Total Searches" value={formatNumber(kpis.totalSearches)} current={kpis.totalSearches} previous={prevKpis.totalSearches} hint={`vs prev ${r.label}`} accent="#0EA5E9" />
          <StatCard label="Unique Queries" value={formatNumber(kpis.uniqueQueries)} current={kpis.uniqueQueries} previous={prevKpis.uniqueQueries} accent="#00B37E" />
          <StatCard label="Searches Today" value={formatNumber(kpis.searchesToday)} accent="#A78BFA" />
          <StatCard label="Searches This Week" value={formatNumber(kpis.searchesThisWeek)} accent="#A78BFA" />
          <StatCard label="Searches This Month" value={formatNumber(kpis.searchesThisMonth)} accent="#A78BFA" />
          <StatCard label="Avg. Results Returned" value={kpis.avgResults != null ? kpis.avgResults.toFixed(1) : "—"} accent="#F59E0B" />
          <StatCard label="Avg. Search Time" value={fmtMs(kpis.avgSearchTimeMs)} accent="#F59E0B" />
          <StatCard label="Zero Result Searches" value={formatNumber(kpis.zeroResultSearches)} hint={kpis.zeroResultRate != null ? `${formatPercent(kpis.zeroResultRate)} of searches` : undefined} accent="#dc2626" />
          <StatCard label="Search CTR" value={fmtPct(kpis.ctr)} hint="clicks ÷ searches" accent="#F472B6" />
          <StatCard label="Search Conversion Rate" value={fmtPct(kpis.conversionRate)} hint="quote/order ÷ search sessions" accent="#00D68F" />
        </div>

        {/* Trends */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="xl:col-span-2">
            <Panel title="Search volume" subtitle={`Daily searches · ${r.label}`}>
              <AreaChart labels={trendLabels} series={[{ name: "Searches", color: "#0EA5E9", values: volumeTrend.map((d) => d.count) }]} />
            </Panel>
          </div>
          <Panel title="Conversion funnel" subtitle="Search → click → quote → order">
            <Funnel stages={funnel} />
          </Panel>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Panel title="Search performance" subtitle="Average response time">
            {perfTrend.length === 0 ? <EmptyState message="No search-duration telemetry yet." /> : (
              <AreaChart labels={trendLabels} series={[{ name: "Avg. response (ms)", color: "#F59E0B", values: trendLabels.map((_, i) => perfMap.get(volumeTrend[i]?._id) ?? 0) }]} />
            )}
          </Panel>
          <Panel title="CTR trend" subtitle="Clicks ÷ searches, per day">
            {ctrTrend.length === 0 ? <EmptyState /> : (
              <AreaChart
                labels={ctrTrend.map((d) => new Date(d.date + "T12:00:00Z").toLocaleDateString("en-GH", { day: "numeric", month: "short" }))}
                series={[{ name: "CTR %", color: "#F472B6", values: ctrTrend.map((d) => Math.round(d.ctr * 1000) / 10) }]}
              />
            )}
          </Panel>
        </div>

        {/* Top performing */}
        <Panel title="Top performing searches" subtitle="High volume · high CTR (min. 3 searches)">
          {topPerforming.length === 0 ? <EmptyState message="No qualifying searches yet." /> : (
            <div className="overflow-x-auto -mx-5 px-5">
              <table className="w-full text-sm min-w-[480px]">
                <thead>
                  <tr className="text-left text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--apt-text-muted)" }}>
                    <th className="pb-2 pr-3">Query</th><th className="pb-2 text-right">Searches</th><th className="pb-2 text-right">Clicks</th><th className="pb-2 text-right">CTR</th>
                  </tr>
                </thead>
                <tbody>
                  {topPerforming.map((q) => (
                    <tr key={q.query} style={{ borderTop: "1px solid var(--apt-border)" }}>
                      <td className="py-2 pr-3 font-mono text-[12px]" style={{ color: "var(--apt-text-secondary)" }}>{q.query}</td>
                      <td className="py-2 text-right tabular-nums" style={{ color: "var(--apt-text-primary)" }}>{q.searches}</td>
                      <td className="py-2 text-right tabular-nums" style={{ color: "var(--apt-text-primary)" }}>{q.clicks}</td>
                      <td className="py-2 text-right tabular-nums font-semibold" style={{ color: "#00D68F" }}>{fmtPct(q.ctr)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        {/* Top searches table */}
        <Panel title="Top searches" subtitle={`${formatNumber(topSearches.total)} unique queries`}>
          {topSearches.rows.length === 0 ? <EmptyState message="No searches recorded in this period." /> : (
            <>
              <div className="overflow-x-auto -mx-5 px-5">
                <table className="w-full text-sm min-w-[600px]">
                  <thead>
                    <tr className="text-left text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--apt-text-muted)" }}>
                      <th className="pb-2 pr-3">Query</th>
                      <th className="pb-2 text-right"><Link href={sortLink("searches")}>Searches {sort === "searches" && <ArrowDownRight className="inline w-3 h-3" />}</Link></th>
                      <th className="pb-2 text-right"><Link href={sortLink("results")}>Results {sort === "results" && <ArrowDownRight className="inline w-3 h-3" />}</Link></th>
                      <th className="pb-2 text-right"><Link href={sortLink("ctr")}>CTR {sort === "ctr" && <ArrowDownRight className="inline w-3 h-3" />}</Link></th>
                      <th className="pb-2 text-right"><Link href={sortLink("lastSearched")}>Last searched {sort === "lastSearched" && <ArrowDownRight className="inline w-3 h-3" />}</Link></th>
                    </tr>
                  </thead>
                  <tbody>
                    {topSearches.rows.map((q) => (
                      <tr key={q.query} style={{ borderTop: "1px solid var(--apt-border)" }}>
                        <td className="py-2.5 pr-3 font-mono text-[12px]" style={{ color: "var(--apt-text-secondary)" }}>{q.query}</td>
                        <td className="py-2.5 text-right tabular-nums" style={{ color: "var(--apt-text-primary)" }}>{q.searches}</td>
                        <td className="py-2.5 text-right tabular-nums" style={{ color: "var(--apt-text-primary)" }}>{q.avgResults != null ? q.avgResults.toFixed(1) : "—"}</td>
                        <td className="py-2.5 text-right tabular-nums" style={{ color: "var(--apt-text-primary)" }}>{fmtPct(q.ctr)}</td>
                        <td className="py-2.5 text-right text-[12px]" style={{ color: "var(--apt-text-muted)" }}>{new Date(q.lastSearched).toLocaleDateString("en-GH", { day: "numeric", month: "short" })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-3 text-xs" style={{ color: "var(--apt-text-muted)" }}>
                  <span>Page {page} of {totalPages}</span>
                  <div className="flex items-center gap-2">
                    {page > 1 && <Link href={`?${(() => { const qs = new URLSearchParams(baseQS); qs.set("sort", sort); qs.set("page", String(page - 1)); return qs.toString(); })()}`}>← Prev</Link>}
                    {page < totalPages && <Link href={`?${(() => { const qs = new URLSearchParams(baseQS); qs.set("sort", sort); qs.set("page", String(page + 1)); return qs.toString(); })()}`}>Next →</Link>}
                  </div>
                </div>
              )}
            </>
          )}
        </Panel>
      </div>
    </div>
  );
}
