import type { Metadata } from "next";
import { connectDB, AnalyticsModel } from "@apt/db";
import { resolveRange, formatNumber, formatPercent, sourceLabel } from "@/lib/analytics/range";
import { Panel, BarList, EmptyState } from "@/components/analytics/primitives";

export const metadata: Metadata = { title: "Acquisition" };
export const dynamic = "force-dynamic";

function hostFilter(app?: string | null) {
  if (app === "store") return { hostname: { $regex: /store|3001/ } };
  if (app === "web")   return { hostname: { $not: /store|3001/ } };
  return {};
}

async function getData(from: Date, to: Date, app?: string | null) {
  const hf = hostFilter(app);
  const match = { createdAt: { $gte: from, $lte: to }, eventType: "pageview", ...hf };
  const matchAll = { createdAt: { $gte: from, $lte: to }, ...hf };

  try {
    await connectDB();

    const [channels, topSources, campaigns, countries, browsers, convBySource] = await Promise.all([

      // Channel breakdown (utm or referral/direct)
      AnalyticsModel.aggregate<{ _id: string; sessions: number; views: number; conversions: number }>([
        { $match: match },
        {
          $group: {
            _id: {
              $cond: [
                { $gt: ["$utm.source", null] },
                { $cond: [{ $gt: ["$utm.medium", null] }, "$utm.medium", "campaign"] },
                { $cond: [{ $and: [{ $gt: ["$referrer", null] }, { $ne: ["$referrer", ""] }] }, "referral", "direct"] },
              ],
            },
            sessions: { $addToSet: "$sessionId" },
            views: { $sum: 1 },
          },
        },
        { $project: { sessions: { $size: "$sessions" }, views: 1 } },
        { $sort: { sessions: -1 } },
      ]),

      // Top UTM sources / referrers
      AnalyticsModel.aggregate<{ _id: string; sessions: number }>([
        { $match: match },
        {
          $group: {
            _id: {
              $ifNull: [
                "$utm.source",
                { $cond: [{ $and: [{ $gt: ["$referrer", null] }, { $ne: ["$referrer", ""] }] }, "referral", "direct"] },
              ],
            },
            sessions: { $addToSet: "$sessionId" },
          },
        },
        { $project: { sessions: { $size: "$sessions" } } },
        { $sort: { sessions: -1 } },
        { $limit: 12 },
      ]),

      // UTM campaigns
      AnalyticsModel.aggregate<{ _id: string; sessions: number; views: number }>([
        { $match: { ...match, "utm.campaign": { $exists: true, $ne: null } } },
        {
          $group: {
            _id: "$utm.campaign",
            sessions: { $addToSet: "$sessionId" },
            views: { $sum: 1 },
          },
        },
        { $project: { sessions: { $size: "$sessions" }, views: 1 } },
        { $sort: { sessions: -1 } },
        { $limit: 12 },
      ]),

      // Top countries
      AnalyticsModel.aggregate<{ _id: string; visitors: number }>([
        { $match: match },
        { $group: { _id: "$country", visitors: { $addToSet: "$sessionId" } } },
        { $project: { visitors: { $size: "$visitors" } } },
        { $sort: { visitors: -1 } },
        { $limit: 12 },
      ]),

      // Browser breakdown
      AnalyticsModel.aggregate<{ _id: string; count: number }>([
        { $match: match },
        { $group: { _id: "$browser", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 8 },
      ]),

      // Conversions by source
      AnalyticsModel.aggregate<{ _id: string; conversions: number }>([
        { $match: { ...matchAll, eventType: "rfq_submit" } },
        {
          $group: {
            _id: "$utm.source",
            conversions: { $sum: 1 },
          },
        },
        { $sort: { conversions: -1 } },
      ]),
    ]);

    const convMap = Object.fromEntries(convBySource.map((c) => [c._id ?? "direct", c.conversions]));
    const totalSessions = channels.reduce((s, c) => s + c.sessions, 0);

    return { channels, topSources, campaigns, countries, browsers, convMap, totalSessions };
  } catch {
    return null;
  }
}

export default async function AcquisitionPage({
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
        <p className="text-sm" style={{ color: "var(--apt-text-muted)" }}>Could not load acquisition data.</p>
      </div>
    );
  }

  const { channels, topSources, campaigns, countries, browsers, convMap, totalSessions } = data;

  return (
    <div className="space-y-4">

      <div>
        <h1 className="text-lg font-bold tracking-tight" style={{ color: "var(--apt-text-primary)" }}>Acquisition</h1>
        <p className="text-xs mt-0.5" style={{ color: "var(--apt-text-secondary)" }}>
          Traffic sources, campaigns & geography · last {r.label}
        </p>
      </div>

      {/* Channels table */}
      <Panel title="Channels" subtitle="Session volume and conversions by acquisition channel">
        {channels.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="overflow-x-auto -mx-5 px-5">
            <table className="w-full text-sm min-w-[520px]">
              <thead>
                <tr className="text-left text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--apt-text-muted)" }}>
                  <th className="pb-2 pr-3">Channel</th>
                  <th className="pb-2 text-right pr-3">Sessions</th>
                  <th className="pb-2 text-right pr-3">Share</th>
                  <th className="pb-2 text-right pr-3">Page Views</th>
                  <th className="pb-2 text-right">Conversions</th>
                </tr>
              </thead>
              <tbody>
                {channels.map((c) => (
                  <tr key={c._id} style={{ borderTop: "1px solid var(--apt-border)" }}>
                    <td className="py-2.5 pr-3 capitalize" style={{ color: "var(--apt-text-primary)" }}>{sourceLabel(c._id)}</td>
                    <td className="py-2.5 pr-3 text-right font-semibold tabular-nums" style={{ color: "var(--apt-text-primary)" }}>{formatNumber(c.sessions)}</td>
                    <td className="py-2.5 pr-3 text-right tabular-nums" style={{ color: "#00D68F" }}>
                      {formatPercent(totalSessions > 0 ? c.sessions / totalSessions : 0, 0)}
                    </td>
                    <td className="py-2.5 pr-3 text-right tabular-nums" style={{ color: "var(--apt-text-secondary)" }}>{formatNumber(c.views)}</td>
                    <td className="py-2.5 text-right tabular-nums font-semibold" style={{ color: "#F59E0B" }}>
                      {convMap[c._id] ?? 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {/* Sources + Campaigns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel title="Top sources" subtitle="UTM source or referrer">
          <BarList
            accent="#0EA5E9"
            items={topSources.map((s) => ({
              label: sourceLabel(s._id),
              value: s.sessions,
              secondary: `${(convMap[s._id] ?? 0)} conv`,
            }))}
          />
        </Panel>

        <Panel title="Campaign performance" subtitle="UTM campaigns">
          {campaigns.length === 0 ? (
            <EmptyState message="No tagged campaigns yet. Add ?utm_campaign= to track." />
          ) : (
            <BarList
              accent="#A78BFA"
              items={campaigns.map((c) => ({
                label: c._id ?? "—",
                value: c.sessions,
                secondary: `${c.views.toLocaleString()} views`,
              }))}
            />
          )}
        </Panel>
      </div>

      {/* Countries + Browsers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel title="Top countries" subtitle="By unique sessions">
          <BarList
            accent="#F59E0B"
            items={countries.map((c) => ({
              label: c._id ?? "Unknown",
              value: c.visitors,
            }))}
          />
        </Panel>

        <Panel title="Browsers" subtitle="By page views">
          <BarList
            accent="#00B37E"
            items={browsers.map((b) => ({
              label: b._id ?? "Unknown",
              value: b.count,
            }))}
          />
        </Panel>
      </div>
    </div>
  );
}
