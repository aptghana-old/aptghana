import type { Metadata } from "next";
import { Radio } from "lucide-react";
import { connectDB, AnalyticsModel } from "@apt/db";
import { formatNumber } from "@/lib/analytics/range";
import { getActiveSessionIds } from "@/lib/analytics/liveVisitors";
import { Panel, EmptyState, AppBadge } from "@/components/analytics/primitives";

export const metadata: Metadata = { title: "Visitors" };
export const dynamic = "force-dynamic";

function timeAgo(date: Date): string {
  const s = Math.floor((Date.now() - date.getTime()) / 1000);
  if (s < 60)   return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return date.toLocaleDateString("en-GH", { day: "numeric", month: "short" });
}

function deviceIcon(device: string): string {
  if (device === "mobile") return "📱";
  if (device === "tablet") return "⬜";
  return "🖥";
}

async function getVisitors() {
  const since24h  = new Date(Date.now() - 24 * 60 * 60 * 1000);

  try {
    await connectDB();

    const [activeSessions, recentEvents, sessionSummaries] = await Promise.all([
      // Active now — distinct sessions with events in last 5 min
      getActiveSessionIds(),

      // Recent raw events (last 24h) for the live stream
      AnalyticsModel.find({ createdAt: { $gte: since24h } })
        .sort({ createdAt: -1 })
        .limit(200)
        .select("sessionId eventType path country device browser hostname createdAt properties")
        .lean(),

      // Per-session summary (last 24h)
      AnalyticsModel.aggregate<{
        _id: string;
        pageviews: number;
        events: number;
        country: string;
        device: string;
        browser: string;
        hostname: string;
        lastSeen: Date;
        paths: string[];
        converted: boolean;
      }>([
        { $match: { createdAt: { $gte: since24h } } },
        {
          $group: {
            _id: "$sessionId",
            pageviews:  { $sum: { $cond: [{ $eq: ["$eventType", "pageview"] }, 1, 0] } },
            events:     { $sum: 1 },
            country:    { $first: "$country" },
            device:     { $first: "$device" },
            browser:    { $first: "$browser" },
            hostname:   { $first: "$hostname" },
            lastSeen:   { $max: "$createdAt" },
            paths:      { $push: { $cond: [{ $eq: ["$eventType", "pageview"] }, "$path", "$$REMOVE"] } },
            converted:  { $max: { $cond: [{ $eq: ["$eventType", "rfq_submit"] }, true, false] } },
          },
        },
        { $sort: { lastSeen: -1 } },
        { $limit: 80 },
      ]),
    ]);

    return { activeSessions, recentEvents, sessionSummaries };
  } catch {
    return { activeSessions: [], recentEvents: [], sessionSummaries: [] };
  }
}

export default async function VisitorsPage() {
  const { activeSessions, sessionSummaries } = await getVisitors();
  const activeSet = new Set(activeSessions);

  return (
    <div className="space-y-4">

      <div>
        <h1 className="text-lg font-bold tracking-tight" style={{ color: "var(--apt-text-primary)" }}>Visitors</h1>
        <p className="text-xs mt-0.5" style={{ color: "var(--apt-text-secondary)" }}>
          Who is on the site — live and recent sessions
        </p>
      </div>

      {/* Active now */}
      <Panel
        title="Active now"
        subtitle={`${activeSessions.length} session${activeSessions.length === 1 ? "" : "s"} in the last 5 minutes`}
        action={<Radio className="w-4 h-4 text-[#00D68F]" />}
      >
        {activeSessions.length === 0 ? (
          <p className="py-6 text-center text-sm" style={{ color: "var(--apt-text-muted)" }}>No active visitors right now.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {activeSessions.slice(0, 12).map((sid) => {
              const s = sessionSummaries.find((x) => x._id === sid);
              return (
                <div key={sid} className="rounded-lg p-3" style={{ background: "rgba(0,212,111,0.05)", border: "1px solid rgba(0,212,111,0.12)" }}>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[10px] font-mono" style={{ color: "var(--apt-text-muted)" }}>{sid.slice(0, 12)}…</span>
                    {s && <AppBadge hostname={s.hostname} />}
                  </div>
                  <p className="text-xs font-medium" style={{ color: "var(--apt-text-primary)" }}>
                    {deviceIcon(s?.device ?? "")} {s?.country ?? "Unknown"} · {s?.browser ?? "—"}
                  </p>
                  <p className="text-[10px] mt-0.5" style={{ color: "var(--apt-text-muted)" }}>
                    {s?.pageviews ?? 0} pages · {s?.paths?.[s.paths.length - 1] ?? "—"}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </Panel>

      {/* Session table */}
      <Panel title="Recent sessions" subtitle="Last 24 hours">
        {sessionSummaries.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="overflow-x-auto -mx-5 px-5">
            <table className="w-full text-sm min-w-[720px]">
              <thead>
                <tr className="text-left text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--apt-text-muted)" }}>
                  <th className="pb-2 pr-3">Session</th>
                  <th className="pb-2 pr-3">App</th>
                  <th className="pb-2 pr-3">Location</th>
                  <th className="pb-2 pr-3">Device</th>
                  <th className="pb-2 text-right pr-3">Pages</th>
                  <th className="pb-2 text-right pr-3">Events</th>
                  <th className="pb-2 pr-3">RFQ</th>
                  <th className="pb-2 text-right">Last seen</th>
                </tr>
              </thead>
              <tbody>
                {sessionSummaries.map((s) => (
                  <tr key={s._id} style={{ borderTop: "1px solid var(--apt-border)" }}>
                    <td className="py-2.5 pr-3">
                      <div className="flex items-center gap-2">
                        {activeSet.has(s._id) && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#00D68F] shrink-0" />
                        )}
                        <span className="font-mono text-[11px]" style={{ color: "var(--apt-text-secondary)" }}>
                          {s._id.slice(0, 14)}…
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 pr-3"><AppBadge hostname={s.hostname} /></td>
                    <td className="py-2.5 pr-3 text-xs" style={{ color: "var(--apt-text-secondary)" }}>{s.country ?? "—"}</td>
                    <td className="py-2.5 pr-3 text-xs capitalize" style={{ color: "var(--apt-text-secondary)" }}>
                      {deviceIcon(s.device)} {s.device} · {s.browser ?? "—"}
                    </td>
                    <td className="py-2.5 pr-3 text-right font-semibold tabular-nums" style={{ color: "var(--apt-text-primary)" }}>{formatNumber(s.pageviews)}</td>
                    <td className="py-2.5 pr-3 text-right tabular-nums" style={{ color: "var(--apt-text-secondary)" }}>{formatNumber(s.events)}</td>
                    <td className="py-2.5 pr-3">
                      {s.converted && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ background: "rgba(0,212,111,0.12)", color: "#00D68F" }}>
                          RFQ ✓
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 text-right text-xs" style={{ color: "var(--apt-text-muted)" }}>
                      {timeAgo(new Date(s.lastSeen))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
