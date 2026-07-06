import { TrendingUp, TrendingDown } from "lucide-react";
import type { DealAnalytics, DealKind, DealKpis } from "@/lib/dealFilters";

/* Chart accents — fixed hues shared by both themes, matching Badge tones. */
const STATUS_COLORS: Record<string, string> = {
  // shared / order lifecycle
  delivered: "#12B76A",
  shipped: "#0BA5A5",
  processing: "#5B6CFF",
  confirmed: "#0284C7",
  pending: "#D97706",
  cancelled: "#E4573D",
  refunded: "#94A3B8",
  // quote lifecycle
  draft: "#94A3B8",
  reviewing: "#5B6CFF",
  waiting_customer: "#D97706",
  approved: "#0284C7",
  paid: "#12B76A",
  ready_for_delivery: "#0BA5A5",
  completed: "#12B76A",
  expired: "#E4573D",
};
const CHANNEL_COLORS: Record<string, string> = {
  web: "#12B76A",
  store: "#F5820A",
  admin: "#5B6CFF",
  api: "#0BA5A5",
  unknown: "#94A3B8",
};
const FALLBACK_COLOR = "#94A3B8";

const CURRENCY_SYMBOL: Record<string, string> = { GHS: "GH₵", USD: "$", EUR: "€", GBP: "£" };

function sym(currency: string) {
  return CURRENCY_SYMBOL[ currency ] ?? `${currency} `;
}

export function compactMoney(n: number, currency: string) {
  const s = sym(currency);
  if (n >= 1_000_000) return `${s} ${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 10_000) return `${s} ${(n / 1_000).toFixed(1)}k`;
  return `${s} ${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function compactCount(n: number) {
  return n >= 1_000 ? `${(n / 1_000).toFixed(1)}k` : n.toLocaleString();
}

function DeltaBadge({ value }: { value: number | null }) {
  if (value == null) return null;
  const up = value >= 0;
  return (
    <span className="text-[11px] font-bold tabular-nums" style={{ color: up ? "#0B8A4E" : "#dc2626" }}>
      {up ? "+" : ""}{value.toFixed(1)}%
    </span>
  );
}

function MonoLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-mono text-[11px] font-semibold uppercase" style={{ color: "var(--apt-text-muted)", letterSpacing: "1px" }}>
      {children}
    </div>
  );
}

interface Props {
  kind: DealKind;
  kpis: DealKpis;
  analytics: DealAnalytics;
  currency: string;
  rangeLabel: string;
  /** Optional pretty names for status keys (e.g. QUOTE_STATUS_LABELS). */
  statusLabels?: Record<string, string>;
}

export default function DealOverview({ kind, kpis, analytics, currency, rangeLabel, statusLabels }: Props) {
  const isOrder = kind === "order";
  const noun = isOrder ? "Orders" : "Quotes";
  const nounLower = isOrder ? "orders" : "quotes";
  const valueLabel = isOrder ? "Revenue" : "Quote Value";
  const chartTitle = isOrder ? "Order Revenue" : "Quote Value";
  const chartSub = isOrder ? "Daily GMV" : "Daily quoted value";

  const statusLabel = (s: string) =>
    statusLabels?.[ s ] ?? s.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());

  const statusTotal = analytics.byStatus.reduce((n, s) => n + s.count, 0);
  const delivered = analytics.byStatus.find((s) => s.status === "delivered")?.count ?? 0;
  const fulfillmentRate = statusTotal > 0 ? (delivered / statusTotal) * 100 : null;
  const conversionRate = kpis.conversionRate != null ? kpis.conversionRate * 100 : null;
  const fourthCard = isOrder
    ? { label: "Fulfillment Rate", value: fulfillmentRate }
    : { label: "Conversion Rate", value: conversionRate };

  /* ── Value trend geometry (620×180 viewBox) ── */
  const trend = analytics.revenueTrend;
  const W = 620, H = 180, TOP = 14, BOTTOM = 170;
  const maxRevenue = Math.max(1, ...trend.map((t) => t.revenue));
  const pts = trend.map((t, i) => ({
    x: trend.length === 1 ? W / 2 : (i / (trend.length - 1)) * W,
    y: TOP + (1 - t.revenue / maxRevenue) * (BOTTOM - TOP - 10),
  }));
  const linePath = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const areaPath = pts.length > 0
    ? `${linePath} L${pts[ pts.length - 1 ].x.toFixed(1)},${BOTTOM} L${pts[ 0 ].x.toFixed(1)},${BOTTOM} Z`
    : "";
  const fmtDay = (iso: string) =>
    new Date(`${iso}T00:00:00`).toLocaleDateString("en-GH", { month: "short", day: "numeric" });
  const xLabels = trend.length >= 2
    ? [ trend[ 0 ].date, trend[ Math.floor((trend.length - 1) / 2) ].date, trend[ trend.length - 1 ].date ].map(fmtDay)
    : trend.map((t) => fmtDay(t.date));
  const gradientId = `dealrev-${kind}`;

  /* ── Status bars ── */
  const maxStatus = Math.max(1, ...analytics.byStatus.map((s) => s.count));

  /* ── Channel donut ── */
  const channelTotal = analytics.byChannel.reduce((n, c) => n + c.count, 0);
  const donutStops = analytics.byChannel.map((c, i) => {
    const before = analytics.byChannel.slice(0, i).reduce((n, x) => n + x.count, 0);
    const from = (before / Math.max(1, channelTotal)) * 100;
    const to = ((before + c.count) / Math.max(1, channelTotal)) * 100;
    return `${CHANNEL_COLORS[ c.channel ] ?? FALLBACK_COLOR} ${from.toFixed(2)}% ${to.toFixed(2)}%`;
  });

  return (
    <div className="space-y-4">
      {/* ── KPI cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
        <div className="card px-4.5 py-4">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11.5px] font-medium" style={{ color: "var(--apt-text-muted)" }}>Total {noun} · {rangeLabel}</span>
            <DeltaBadge value={kpis.countGrowth} />
          </div>
          <div className="text-[26px] font-extrabold tracking-tight leading-none mt-2" style={{ color: "var(--apt-text-primary)" }}>
            {kpis.totalCount.toLocaleString()}
          </div>
        </div>

        <div className="card px-4.5 py-4 relative overflow-hidden">
          <div className="absolute top-0 left-4 right-4 h-0.5 rounded-b" style={{ background: "#12B76A" }} />
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11.5px] font-medium" style={{ color: "var(--apt-text-muted)" }}>{valueLabel} · {rangeLabel}</span>
            <DeltaBadge value={kpis.monthlyGrowth} />
          </div>
          <div className="font-mono text-[26px] font-extrabold tracking-tight leading-none mt-2" style={{ color: "var(--apt-text-primary)" }}>
            {compactMoney(kpis.totalRevenue, currency)}
          </div>
        </div>

        <div className="card px-4.5 py-4">
          <div className="text-[11.5px] font-medium" style={{ color: "var(--apt-text-muted)" }}>Avg. {isOrder ? "Order" : "Quote"} Value</div>
          <div className="font-mono text-[26px] font-extrabold tracking-tight leading-none mt-2" style={{ color: "var(--apt-text-primary)" }}>
            {compactMoney(kpis.avgValue, currency)}
          </div>
        </div>

        <div className="card px-4.5 py-4">
          <div className="text-[11.5px] font-medium" style={{ color: "var(--apt-text-muted)" }}>{fourthCard.label}</div>
          <div className="text-[26px] font-extrabold tracking-tight leading-none mt-2" style={{ color: fourthCard.value != null ? "#0B8A4E" : "var(--apt-text-disabled)" }}>
            {fourthCard.value != null ? `${fourthCard.value.toFixed(1)}%` : "—"}
          </div>
        </div>
      </div>

      {/* ── Analytics band ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr_1fr] gap-4">
        {/* Value chart */}
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between gap-3 px-5 pt-4 pb-2">
            <div>
              <MonoLabel>{chartTitle}</MonoLabel>
              <div className="text-[13px] mt-1" style={{ color: "var(--apt-text-muted)" }}>{chartSub} · {rangeLabel}</div>
            </div>
            {kpis.monthlyGrowth != null && (
              <span
                className="inline-flex items-center gap-1 text-[12px] font-bold px-2 py-0.5 rounded-md tabular-nums"
                style={kpis.monthlyGrowth >= 0
                  ? { background: "rgba(18, 183, 106, 0.12)", color: "#0B8A4E" }
                  : { background: "rgba(220, 38, 38, 0.1)", color: "#dc2626" }}
              >
                {kpis.monthlyGrowth >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {Math.abs(kpis.monthlyGrowth).toFixed(1)}%
              </span>
            )}
          </div>
          {trend.length === 0 ? (
            <p className="px-5 pb-6 pt-4 text-[12.5px]" style={{ color: "var(--apt-text-muted)" }}>
              No {nounLower} in this period yet.
            </p>
          ) : (
            <div className="px-2 pb-1.5">
              <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="block w-full" style={{ height: 180 }} role="img" aria-label={`Daily ${nounLower} value trend`}>
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#12B76A" stopOpacity="0.22" />
                    <stop offset="100%" stopColor="#12B76A" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {[ 40, 90, 140 ].map((y) => (
                  <line key={y} x1="0" y1={y} x2={W} y2={y} stroke="var(--apt-border)" strokeWidth="1" />
                ))}
                {pts.length > 1 && <path d={areaPath} fill={`url(#${gradientId})`} />}
                <path d={linePath} fill="none" stroke="#12B76A" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
                {pts.length === 1 && <circle cx={pts[ 0 ].x} cy={pts[ 0 ].y} r="3.5" fill="#12B76A" />}
              </svg>
              <div className="flex justify-between px-3 pb-3 pt-0.5 font-mono text-[10px]" style={{ color: "var(--apt-text-disabled)" }}>
                {xLabels.map((l, i) => <span key={`${l}-${i}`}>{l}</span>)}
              </div>
            </div>
          )}
        </div>

        {/* By status */}
        <div className="card px-5 py-4">
          <MonoLabel>By Status</MonoLabel>
          {analytics.byStatus.length === 0 ? (
            <p className="text-[12.5px] mt-4" style={{ color: "var(--apt-text-muted)" }}>No {nounLower} in this period yet.</p>
          ) : (
            <div className="flex flex-col gap-2.5 mt-4">
              {analytics.byStatus.map((s) => (
                <div key={s.status}>
                  <div className="flex justify-between mb-1.5">
                    <span className="text-[12px] font-semibold" style={{ color: "var(--apt-text-secondary)" }}>{statusLabel(s.status)}</span>
                    <span className="font-mono text-[11.5px] font-semibold tabular-nums" style={{ color: "var(--apt-text-primary)" }}>{s.count.toLocaleString()}</span>
                  </div>
                  <div className="h-[7px] rounded-full overflow-hidden" style={{ background: "var(--apt-bg-raised)" }}>
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${Math.max(2, (s.count / maxStatus) * 100)}%`, background: STATUS_COLORS[ s.status ] ?? FALLBACK_COLOR }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Channel mix */}
        <div className="card px-5 py-4">
          <MonoLabel>Channel Mix</MonoLabel>
          {channelTotal === 0 ? (
            <p className="text-[12.5px] mt-4" style={{ color: "var(--apt-text-muted)" }}>No channel data for this period.</p>
          ) : (
            <div className="flex items-center gap-4 mt-3.5 flex-wrap sm:flex-nowrap">
              <div
                className="relative w-24 h-24 shrink-0 rounded-full"
                role="img"
                aria-label={`${noun} by channel`}
                style={{ background: `conic-gradient(${donutStops.join(", ")})` }}
              >
                <div
                  className="absolute rounded-full flex flex-col items-center justify-center leading-none"
                  style={{ inset: 14, background: "var(--apt-bg)" }}
                >
                  <span className="font-mono text-[15px] font-extrabold" style={{ color: "var(--apt-text-primary)" }}>{compactCount(channelTotal)}</span>
                  <span className="text-[8.5px] mt-0.5" style={{ color: "var(--apt-text-muted)" }}>{nounLower}</span>
                </div>
              </div>
              <div className="flex flex-col gap-2 flex-1 min-w-[120px]">
                {analytics.byChannel.map((c) => (
                  <div key={c.channel} className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-[3px] shrink-0" style={{ background: CHANNEL_COLORS[ c.channel ] ?? FALLBACK_COLOR }} />
                    <span className="text-[11.5px] flex-1 capitalize" style={{ color: "var(--apt-text-secondary)" }}>{c.channel}</span>
                    <span className="font-mono text-[11px] font-semibold tabular-nums" style={{ color: "var(--apt-text-primary)" }}>
                      {((c.count / channelTotal) * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
