import type { Metadata } from "next";
import { connectDB, AnalyticsModel } from "@apt/db";
import { resolveRange, formatNumber } from "@/lib/analytics/range";
import { Panel, EmptyState, AppBadge } from "@/components/analytics/primitives";

export const metadata: Metadata = { title: "Content" };
export const dynamic = "force-dynamic";

function hostFilter(app?: string | null) {
  if (app === "store") return { hostname: { $regex: /store|3001/ } };
  if (app === "web")   return { hostname: { $not: /store|3001/ } };
  return {};
}

async function getData(from: Date, to: Date, app?: string | null) {
  const hf = hostFilter(app);
  const match = { createdAt: { $gte: from, $lte: to }, ...hf };

  try {
    await connectDB();

    const [topPages, topProducts, topSearches, topEvents, entryPaths, exitPaths] = await Promise.all([

      // Top pages with unique session count
      AnalyticsModel.aggregate<{ _id: string; views: number; sessions: number; hostname: string }>([
        { $match: { ...match, eventType: "pageview" } },
        {
          $group: {
            _id: "$path",
            views: { $sum: 1 },
            sessions: { $addToSet: "$sessionId" },
            hostname: { $first: "$hostname" },
          },
        },
        { $project: { views: 1, sessions: { $size: "$sessions" }, hostname: 1 } },
        { $sort: { views: -1 } },
        { $limit: 25 },
      ]),

      // Top product views
      AnalyticsModel.aggregate<{ _id: string; count: number; hostname: string }>([
        { $match: { ...match, eventType: "product_view", "properties.slug": { $exists: true } } },
        {
          $group: {
            _id: "$properties.slug",
            count: { $sum: 1 },
            hostname: { $first: "$hostname" },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),

      // Top search queries
      AnalyticsModel.aggregate<{ _id: unknown; count: number }>([
        { $match: { ...match, eventType: "search", "properties.query": { $exists: true, $ne: "" } } },
        { $group: { _id: "$properties.query", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 15 },
      ]),

      // Top event types (non-pageview)
      AnalyticsModel.aggregate<{ _id: string; count: number }>([
        { $match: { ...match, eventType: { $ne: "pageview" } } },
        { $group: { _id: "$eventType", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),

      // Entry paths (first pageview of each session)
      AnalyticsModel.aggregate<{ _id: string; sessions: number }>([
        { $match: { ...match, eventType: "pageview" } },
        { $sort: { sessionId: 1, createdAt: 1 } },
        { $group: { _id: "$sessionId", entryPath: { $first: "$path" } } },
        { $group: { _id: "$entryPath", sessions: { $sum: 1 } } },
        { $sort: { sessions: -1 } },
        { $limit: 10 },
      ]),

      // Exit paths (last pageview of each session)
      AnalyticsModel.aggregate<{ _id: string; sessions: number }>([
        { $match: { ...match, eventType: "pageview" } },
        { $sort: { sessionId: 1, createdAt: -1 } },
        { $group: { _id: "$sessionId", exitPath: { $first: "$path" } } },
        { $group: { _id: "$exitPath", sessions: { $sum: 1 } } },
        { $sort: { sessions: -1 } },
        { $limit: 10 },
      ]),
    ]);

    return { topPages, topProducts, topSearches, topEvents, entryPaths, exitPaths };
  } catch {
    return null;
  }
}

function evLabel(t: string): string {
  const m: Record<string, string> = {
    product_view: "Product View", search: "Search", rfq_submit: "RFQ Submission",
    add_to_cart: "Add to Cart", brand_view: "Brand View", category_view: "Category View",
    document_download: "Download", click: "Click",
  };
  return m[t] ?? t;
}

export default async function ContentPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; app?: string }>;
}) {
  const { range, app } = await searchParams;
  const r = resolveRange(range);
  const data = await getData(r.from, r.to, app);

  if (!data) {
    return (
      <div className="py-20 text-center">
        <p className="text-sm" style={{ color: "var(--apt-text-muted)" }}>Could not load content data.</p>
      </div>
    );
  }

  const { topPages, topProducts, topSearches, topEvents, entryPaths, exitPaths } = data;
  const maxViews = topPages[0]?.views ?? 1;

  return (
    <div className="space-y-4">

      <div>
        <h1 className="text-lg font-bold tracking-tight" style={{ color: "var(--apt-text-primary)" }}>Content</h1>
        <p className="text-xs mt-0.5" style={{ color: "var(--apt-text-secondary)" }}>
          Page performance, navigation paths & search behaviour · last {r.label}
        </p>
      </div>

      {/* Page performance table */}
      <Panel title="Page performance" subtitle="Views, unique sessions and share by path">
        {topPages.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="overflow-x-auto -mx-5 px-5">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="text-left text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--apt-text-muted)" }}>
                  <th className="pb-2 pr-3">Page</th>
                  <th className="pb-2 pr-3">App</th>
                  <th className="pb-2 text-right pr-3">Views</th>
                  <th className="pb-2 text-right pr-3">Sessions</th>
                  <th className="pb-2 w-32">Share</th>
                </tr>
              </thead>
              <tbody>
                {topPages.map((p) => {
                  const pct = Math.round((p.views / maxViews) * 100);
                  return (
                    <tr key={p._id} style={{ borderTop: "1px solid var(--apt-border)" }}>
                      <td className="py-2.5 pr-3 max-w-[240px]">
                        <span className="text-sm font-mono truncate block" style={{ color: "var(--apt-text-secondary)" }} title={p._id}>
                          {p._id}
                        </span>
                      </td>
                      <td className="py-2.5 pr-3"><AppBadge hostname={p.hostname} /></td>
                      <td className="py-2.5 pr-3 text-right font-semibold tabular-nums" style={{ color: "var(--apt-text-primary)" }}>{formatNumber(p.views)}</td>
                      <td className="py-2.5 pr-3 text-right tabular-nums" style={{ color: "var(--apt-text-secondary)" }}>{formatNumber(p.sessions)}</td>
                      <td className="py-2.5">
                        <div className="flex items-center gap-1.5">
                          <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--apt-bg-raised)" }}>
                            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "#0EA5E9" }} />
                          </div>
                          <span className="text-[10px] shrink-0" style={{ color: "var(--apt-text-muted)" }}>{pct}%</span>
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

      {/* Entry + Exit paths */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel title="Entry pages" subtitle="Where sessions begin">
          {entryPaths.length === 0 ? <EmptyState /> : (
            <ul className="space-y-1">
              {entryPaths.map((p) => (
                <li key={p._id} className="flex items-center justify-between gap-3 px-3 py-2 rounded-md"
                  style={{ background: "rgba(0,179,126,0.06)" }}>
                  <span className="text-sm font-mono truncate" style={{ color: "var(--apt-text-secondary)" }}>{p._id}</span>
                  <span className="text-sm font-semibold tabular-nums shrink-0" style={{ color: "var(--apt-text-primary)" }}>{p.sessions.toLocaleString()}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Exit pages" subtitle="Where sessions end">
          {exitPaths.length === 0 ? <EmptyState /> : (
            <ul className="space-y-1">
              {exitPaths.map((p) => (
                <li key={p._id} className="flex items-center justify-between gap-3 px-3 py-2 rounded-md"
                  style={{ background: "rgba(239,68,68,0.06)" }}>
                  <span className="text-sm font-mono truncate" style={{ color: "var(--apt-text-secondary)" }}>{p._id}</span>
                  <span className="text-sm font-semibold tabular-nums shrink-0" style={{ color: "var(--apt-text-primary)" }}>{p.sessions.toLocaleString()}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      {/* Top searches + Top products + Event actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Panel title="Top searches" subtitle="Most searched terms">
          {topSearches.length === 0 ? (
            <EmptyState message="No search data yet." />
          ) : (
            <ul className="space-y-1">
              {topSearches.map((q, i) => (
                <li key={i} className="flex items-center justify-between gap-3 px-3 py-2 rounded-md hover:bg-[var(--apt-bg-raised)]">
                  <span
                    className="text-sm px-2 py-0.5 rounded font-mono"
                    style={{ background: "rgba(245,158,11,0.1)", color: "#F59E0B" }}
                  >
                    {String(q._id)}
                  </span>
                  <span className="text-sm font-semibold tabular-nums shrink-0" style={{ color: "var(--apt-text-primary)" }}>{q.count}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Top products viewed" subtitle="Most visited product pages">
          {topProducts.length === 0 ? (
            <EmptyState message="No product view data yet." />
          ) : (
            <ul className="space-y-1">
              {topProducts.map((p) => (
                <li key={String(p._id)} className="flex items-center justify-between gap-3 px-3 py-2 rounded-md hover:bg-[var(--apt-bg-raised)]">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-mono truncate" style={{ color: "var(--apt-text-secondary)" }}>{String(p._id)}</p>
                    <AppBadge hostname={p.hostname} />
                  </div>
                  <span className="text-sm font-semibold tabular-nums shrink-0" style={{ color: "var(--apt-text-primary)" }}>{p.count}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Interaction events" subtitle="Non-pageview actions">
          {topEvents.length === 0 ? (
            <EmptyState />
          ) : (
            <ul className="space-y-2">
              {topEvents.map((e) => (
                <li key={e._id} className="flex items-center justify-between gap-3 px-3 py-2 rounded-md hover:bg-[var(--apt-bg-raised)]">
                  <span className="text-sm" style={{ color: "var(--apt-text-primary)" }}>{evLabel(e._id)}</span>
                  <span className="text-sm font-semibold tabular-nums" style={{ color: "var(--apt-text-primary)" }}>{formatNumber(e.count)}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
