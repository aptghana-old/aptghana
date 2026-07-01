import type { Metadata } from "next";
import { connectDB, AnalyticsModel } from "@apt/db";
import { resolveRange, formatNumber, formatPercent } from "@/lib/analytics/range";
import { Panel, StatCard, BarList, EmptyState } from "@/components/analytics/primitives";
import { AreaChart, Donut, Funnel, ActivityHeatmap } from "@/components/analytics/charts";

export const metadata: Metadata = { title: "Overview" };
export const dynamic = "force-dynamic";

const HEATMAP_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/* ─── hostname filter ─────────────────────────────────────────────────────── */
function hostFilter(app?: string | null): Record<string, unknown> {
  if (app === "store") return { hostname: { $regex: /store|3001/ } };
  if (app === "web")   return { hostname: { $not: /store|3001/ } };
  return {};
}

/** Inclusive list of "YYYY-MM-DD" (UTC) day keys spanning [from, to], for zero-filling daily series. */
function dayKeys(from: Date, to: Date): string[] {
  const days: string[] = [];
  const cursor = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()));
  const end = new Date(Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate()));
  while (cursor <= end) {
    days.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return days;
}

/** Mongo $dayOfWeek is 1=Sun…7=Sat; map to a Mon…Sun row index. */
function heatmapRowIndex(dow: number): number {
  return (dow + 5) % 7;
}

/* ─── Data ────────────────────────────────────────────────────────────────── */
async function getData(from: Date, to: Date, prevFrom: Date, prevTo: Date, app?: string | null) {
  const hf = hostFilter(app);

  const cur  = { createdAt: { $gte: from,     $lte: to     }, ...hf };
  const prev = { createdAt: { $gte: prevFrom,  $lte: prevTo }, ...hf };

  try {
    await connectDB();

    const [
      // current period
      pageviewsCur, sessionsCur, convCur, searchCur,
      // previous period
      pageviewsPrev, sessionsPrev, convPrev,
      // charts & breakdowns
      dailyTrend, dailyConversions, heatmapAgg, topPages, trafficSources, deviceStats, eventStats, topSearches,
    ] = await Promise.all([
      AnalyticsModel.countDocuments({ ...cur,  eventType: "pageview" }),
      AnalyticsModel.distinct("sessionId", cur),
      AnalyticsModel.countDocuments({ ...cur,  eventType: "rfq_submit" }),
      AnalyticsModel.countDocuments({ ...cur,  eventType: "search" }),

      AnalyticsModel.countDocuments({ ...prev, eventType: "pageview" }),
      AnalyticsModel.distinct("sessionId", prev),
      AnalyticsModel.countDocuments({ ...prev, eventType: "rfq_submit" }),

      // daily pageview trend
      AnalyticsModel.aggregate<{ _id: string; views: number; sessions: number }>([
        { $match: { ...cur, eventType: "pageview" } },
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, views: { $sum: 1 }, sessions: { $addToSet: "$sessionId" } } },
        { $project: { views: 1, sessions: { $size: "$sessions" } } },
        { $sort: { _id: 1 } },
      ]),

      // daily RFQ + search counts, for KPI sparklines
      AnalyticsModel.aggregate<{ _id: { day: string; type: string }; count: number }>([
        { $match: { ...cur, eventType: { $in: ["rfq_submit", "search"] } } },
        { $group: { _id: { day: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, type: "$eventType" }, count: { $sum: 1 } } },
      ]),

      // sessions by weekday × hour of day (GMT), for the activity heatmap
      AnalyticsModel.aggregate<{ _id: { dow: number; hour: number }; sessions: number }>([
        { $match: { ...cur, eventType: "pageview" } },
        { $group: { _id: { dow: { $dayOfWeek: "$createdAt" }, hour: { $hour: "$createdAt" } }, sessions: { $addToSet: "$sessionId" } } },
        { $project: { sessions: { $size: "$sessions" } } },
      ]),

      AnalyticsModel.aggregate<{ _id: string; views: number }>([
        { $match: { ...cur, eventType: "pageview" } },
        { $group: { _id: "$path", views: { $sum: 1 } } },
        { $sort: { views: -1 } },
        { $limit: 10 },
      ]),

      AnalyticsModel.aggregate<{ _id: string; views: number; sessions: number }>([
        { $match: { ...cur, eventType: "pageview" } },
        {
          $group: {
            _id: {
              $cond: [
                { $gt: ["$utm.source", null] },
                "$utm.source",
                { $cond: [{ $and: [{ $gt: ["$referrer", null] }, { $ne: ["$referrer", ""] }] }, "referral", "direct"] },
              ],
            },
            views: { $sum: 1 },
            sessions: { $addToSet: "$sessionId" },
          },
        },
        { $project: { views: 1, sessions: { $size: "$sessions" } } },
        { $sort: { views: -1 } },
        { $limit: 8 },
      ]),

      AnalyticsModel.aggregate<{ _id: string; count: number }>([
        { $match: { ...cur, eventType: "pageview" } },
        { $group: { _id: "$device", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),

      AnalyticsModel.aggregate<{ _id: string; count: number }>([
        { $match: cur },
        { $group: { _id: "$eventType", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),

      AnalyticsModel.aggregate<{ _id: unknown; count: number }>([
        { $match: { ...cur, eventType: "search", "properties.query": { $exists: true, $ne: "" } } },
        { $group: { _id: "$properties.query", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
    ]);

    const sessionsCurN  = sessionsCur.length;
    const sessionsPrevN = sessionsPrev.length;
    const totalDevices  = deviceStats.reduce((s, d) => s + d.count, 0);
    const totalEvents   = eventStats.reduce((s, e) => s + e.count, 0);

    // Funnel approximation
    const funnelSearches  = eventStats.find((e) => e._id === "search")?.count ?? 0;
    const funnelProducts  = eventStats.find((e) => e._id === "product_view")?.count ?? 0;
    const funnelConv      = convCur;

    // Zero-filled, day-aligned series for the KPI sparklines — dailyTrend/dailyConversions
    // only contain days that actually had events, so build the full day range explicitly.
    const days = dayKeys(from, to);
    const viewsByDay    = new Map(dailyTrend.map((d) => [d._id, d.views]));
    const sessionsByDay = new Map(dailyTrend.map((d) => [d._id, d.sessions]));
    const rfqByDay    = new Map(dailyConversions.filter((d) => d._id.type === "rfq_submit").map((d) => [d._id.day, d.count]));
    const searchByDay = new Map(dailyConversions.filter((d) => d._id.type === "search").map((d) => [d._id.day, d.count]));

    const trendLabels    = days.map((d) => new Date(d + "T12:00:00Z").toLocaleDateString("en-GH", { day: "numeric", month: "short" }));
    const trendViews     = days.map((d) => viewsByDay.get(d) ?? 0);
    const trendSessions  = days.map((d) => sessionsByDay.get(d) ?? 0);
    const trendRfq       = days.map((d) => rfqByDay.get(d) ?? 0);
    const trendSearches  = days.map((d) => searchByDay.get(d) ?? 0);
    const trendConvRate  = days.map((d) => {
      const s = sessionsByDay.get(d) ?? 0;
      return s > 0 ? (rfqByDay.get(d) ?? 0) / s : 0;
    });

    // 7 (Mon…Sun) × 24 (hour) session-count matrix for the activity heatmap
    const heatmapMatrix = Array.from({ length: 7 }, () => Array(24).fill(0) as number[]);
    for (const cell of heatmapAgg) {
      const row = heatmapRowIndex(cell._id.dow);
      const hour = cell._id.hour;
      if (row >= 0 && row < 7 && hour >= 0 && hour < 24) heatmapMatrix[row][hour] = cell.sessions;
    }

    return {
      stats: {
        pageviewsCur, pageviewsPrev,
        sessionsCurN, sessionsPrevN,
        convCur, convPrev,
        searchCur,
        convRate: sessionsCurN > 0 ? convCur / sessionsCurN : 0,
        prevConvRate: sessionsPrevN > 0 ? convPrev / sessionsPrevN : 0,
      },
      trendLabels,
      trendViews, trendSessions, trendRfq, trendSearches, trendConvRate,
      heatmapMatrix,
      topPages,
      trafficSources,
      deviceStats, totalDevices,
      eventStats, totalEvents,
      topSearches,
      funnelStages: [
        { stage: "Page views",    count: pageviewsCur      },
        { stage: "Searches",      count: funnelSearches    },
        { stage: "Product views", count: funnelProducts    },
        { stage: "RFQ submitted", count: funnelConv        },
      ].filter((s) => s.count > 0),
      hasData: pageviewsCur > 0,
    };
  } catch {
    return null;
  }
}

/* ─── Event label ─────────────────────────────────────────────────────────── */
function evLabel(t: string): string {
  const m: Record<string, string> = {
    pageview: "Page Views", product_view: "Product Views", search: "Searches",
    rfq_submit: "RFQ Submissions", add_to_cart: "Add to Cart",
    brand_view: "Brand Views", category_view: "Category Views",
    document_download: "Downloads", click: "Clicks",
  };
  return m[t] ?? t;
}

/* ─── Page ────────────────────────────────────────────────────────────────── */
export default async function OverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; app?: string }>;
}) {
  const { range, app } = await searchParams;
  const r = resolveRange(range);
  const data = await getData(r.from, r.to, r.prevFrom, r.prevTo, app);

  if (!data) {
    return (
      <div className="py-20 text-center">
        <p className="text-sm" style={{ color: "var(--apt-text-muted)" }}>Could not load analytics data.</p>
      </div>
    );
  }

  const {
    stats, trendLabels, trendViews, trendSessions, trendRfq, trendSearches, trendConvRate,
    heatmapMatrix, topPages, trafficSources, deviceStats, totalDevices, eventStats, totalEvents,
    topSearches, funnelStages,
  } = data;

  const deviceColors: Record<string, string> = { desktop: "#0EA5E9", mobile: "#00B37E", tablet: "#F59E0B" };

  return (
    <div className="space-y-4">

      {/* ── Section label ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold tracking-tight" style={{ color: "var(--apt-text-primary)" }}>Executive Overview</h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--apt-text-secondary)" }}>
            Visitor intelligence across all APT Ghana properties · last {r.label}
          </p>
        </div>
      </div>

      {/* ── KPI row ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
        <StatCard
          label="Page Views"
          value={formatNumber(stats.pageviewsCur)}
          current={stats.pageviewsCur}
          previous={stats.pageviewsPrev}
          hint={`vs prev ${r.label}`}
          accent="#0EA5E9"
          spark={trendViews}
        />
        <StatCard
          label="Sessions"
          value={formatNumber(stats.sessionsCurN)}
          current={stats.sessionsCurN}
          previous={stats.sessionsPrevN}
          accent="#00B37E"
          spark={trendSessions}
        />
        <StatCard
          label="RFQ Conversions"
          value={formatNumber(stats.convCur)}
          current={stats.convCur}
          previous={stats.convPrev}
          accent="#F59E0B"
          spark={trendRfq}
        />
        <StatCard
          label="Searches"
          value={formatNumber(stats.searchCur)}
          hint="product & category"
          accent="#A78BFA"
          spark={trendSearches}
        />
        <StatCard
          label="Conversion Rate"
          value={stats.sessionsCurN > 0 ? `${(stats.convRate * 100).toFixed(2)}%` : "—"}
          current={Math.round(stats.convRate * 10000)}
          previous={Math.round(stats.prevConvRate * 10000)}
          hint="RFQs per session"
          accent="#F472B6"
          spark={trendConvRate}
        />
      </div>

      {/* ── Traffic trend + Device donut ───────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2">
          <Panel title="Traffic trend" subtitle={`Page views & sessions · ${r.label}`}>
            <AreaChart
              labels={trendLabels}
              series={[
                { name: "Page views", color: "#0EA5E9", values: trendViews },
                { name: "Sessions",   color: "#00B37E", values: trendSessions },
              ]}
            />
          </Panel>
        </div>
        <Panel title="Device split" subtitle="By page views">
          <Donut
            centerValue={formatNumber(totalDevices)}
            centerLabel="Total page views"
            segments={deviceStats.map((d) => ({
              label: d._id ? d._id.charAt(0).toUpperCase() + d._id.slice(1) : "Unknown",
              value: d.count,
              color: deviceColors[d._id] ?? "#475569",
            }))}
          />
        </Panel>
      </div>

      {/* ── Conversion funnel + Traffic sources + Event breakdown ─────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Panel title="Conversion funnel" subtitle="Session progression to RFQ">
          <Funnel stages={funnelStages} />
        </Panel>

        <Panel title="Traffic sources" subtitle="Where visitors come from">
          <BarList
            accent="#0EA5E9"
            items={trafficSources.map((s) => ({
              label: s._id || "direct",
              value: s.sessions,
              secondary: `${s.views.toLocaleString()} views`,
            }))}
          />
        </Panel>

        <Panel title="Event breakdown" subtitle="All interactions this period">
          <BarList
            accent="#A78BFA"
            items={eventStats.slice(0, 7).map((e) => ({
              label: evLabel(e._id),
              value: e.count,
              secondary: totalEvents > 0 ? formatPercent(e.count / totalEvents) : "—",
            }))}
          />
        </Panel>
      </div>

      {/* ── Activity heatmap ─────────────────────────────────────────────────── */}
      <Panel
        title="Activity heatmap"
        subtitle="Sessions by hour of day & weekday · GMT"
        action={
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-medium" style={{ color: "var(--apt-text-muted)" }}>Less</span>
            {[0.15, 0.4, 0.65, 0.9].map((o) => (
              <span key={o} className="w-2.5 h-2.5 rounded-sm" style={{ background: "#00B37E", opacity: o }} />
            ))}
            <span className="text-[10px] font-medium" style={{ color: "var(--apt-text-muted)" }}>More</span>
          </div>
        }
      >
        <ActivityHeatmap days={HEATMAP_DAYS} matrix={heatmapMatrix} accent="#00B37E" />
      </Panel>

      {/* ── Top pages + Top searches ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel title="Most viewed pages" subtitle={`Top paths · ${r.label}`}>
          {topPages.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="overflow-x-auto -mx-5 px-5">
              <table className="w-full text-sm min-w-[400px]">
                <thead>
                  <tr className="text-left text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--apt-text-muted)" }}>
                    <th className="pb-2 pr-3">Page</th>
                    <th className="pb-2 text-right">Views</th>
                    <th className="pb-2 w-28">Share</th>
                  </tr>
                </thead>
                <tbody>
                  {topPages.map((p) => {
                    const maxV = topPages[0]?.views ?? 1;
                    const pct = Math.round((p.views / maxV) * 100);
                    return (
                      <tr key={p._id} style={{ borderTop: "1px solid var(--apt-border)" }}>
                        <td className="py-2.5 pr-3">
                          <span className="text-sm font-mono truncate block max-w-[200px]" style={{ color: "var(--apt-text-secondary)" }} title={p._id}>
                            {p._id}
                          </span>
                        </td>
                        <td className="py-2.5 text-right font-semibold tabular-nums" style={{ color: "var(--apt-text-primary)" }}>{p.views.toLocaleString()}</td>
                        <td className="py-2.5">
                          <div className="flex items-center gap-1.5">
                            <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--apt-bg-raised)" }}>
                              <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "#0EA5E9" }} />
                            </div>
                            <span className="text-[10px] shrink-0 tabular-nums" style={{ color: "var(--apt-text-muted)" }}>{pct}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        <Panel title="Top search queries" subtitle="What customers are searching for">
          {topSearches.length === 0 ? (
            <EmptyState message="No search data yet." />
          ) : (
            <BarList
              accent="#F59E0B"
              items={topSearches.map((q) => ({
                label: String(q._id),
                value: q.count,
              }))}
            />
          )}
        </Panel>
      </div>

    </div>
  );
}
