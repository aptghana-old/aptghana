/**
 * Dependency-free SVG charts for the analytics dashboard.
 * Server-rendered, responsive via viewBox. Adapted from the (dash) template.
 */
import { formatNumber, formatPercent } from "@/lib/analytics/range";
import { EmptyState } from "./primitives";

/* ─── AreaChart ───────────────────────────────────────────────────────────── */
export interface Series {
  name: string;
  color: string;
  values: number[];
}

export function AreaChart({
  labels,
  series,
  height = 220,
}: {
  labels: string[];
  series: Series[];
  height?: number;
}) {
  const n = series[0]?.values.length ?? 0;
  if (n === 0 || series.every((s) => s.values.every((v) => v === 0))) return <EmptyState />;

  const W = 1000;
  const H = 280;
  const pad = 12;
  const max = Math.max(1, ...series.flatMap((s) => s.values));

  const toPoints = (vals: number[]) =>
    vals.map((v, i) => {
      const x = n > 1 ? (i / (n - 1)) * W : W / 2;
      const y = H - pad - (v / max) * (H - 2 * pad);
      return [x, y] as const;
    });

  const gridYs = [0.25, 0.5, 0.75].map((f) => pad + f * (H - 2 * pad));
  const labelIdxs = [0, Math.floor((n - 1) / 2), n - 1].filter((v, i, a) => a.indexOf(v) === i && v < labels.length);

  return (
    <div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="w-full"
        style={{ height }}
        aria-label="Trend chart"
      >
        {gridYs.map((y, i) => (
          <line
            key={i}
            x1={0} y1={y} x2={W} y2={y}
            stroke="var(--apt-border)"
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />
        ))}
        {series.map((s, si) => {
          const pts = toPoints(s.values);
          const lineStr = pts.map((p) => `${p[0]},${p[1]}`).join(" ");
          const areaStr = `${pts[0][0]},${H} ${lineStr} ${pts[pts.length - 1][0]},${H}`;
          const gid = `ag-${si}-${s.name.replace(/\W/g, "")}`;
          return (
            <g key={s.name}>
              <defs>
                <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={s.color} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={s.color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <polygon points={areaStr} fill={`url(#${gid})`} />
              <polyline
                points={lineStr}
                fill="none"
                stroke={s.color}
                strokeWidth={2}
                vectorEffect="non-scaling-stroke"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            </g>
          );
        })}
      </svg>

      <div className="flex justify-between mt-2 px-0.5" style={{ fontSize: 10, color: "var(--apt-text-muted)" }}>
        {labelIdxs.map((idx) => <span key={idx}>{labels[idx]}</span>)}
      </div>

      <div className="flex items-center gap-4 mt-3">
        {series.map((s) => (
          <span key={s.name} className="inline-flex items-center gap-1.5 text-xs" style={{ color: "var(--apt-text-secondary)" }}>
            <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: s.color }} />
            {s.name}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ─── MiniBarChart ────────────────────────────────────────────────────────── */
export interface MiniBar {
  label: string;
  value: number;
}

export function MiniBarChart({ bars, accent = "#12B76A", height = 110 }: { bars: MiniBar[]; accent?: string; height?: number }) {
  if (bars.length === 0 || bars.every((b) => b.value === 0)) return <EmptyState />;
  const max = Math.max(1, ...bars.map((b) => b.value));
  const peakIdx = bars.reduce((best, b, i) => (b.value > bars[best].value ? i : best), 0);

  return (
    <div>
      <div className="flex items-end gap-2" style={{ height }}>
        {bars.map((b, i) => (
          <div key={`${b.label}-${i}`} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
            <div
              className="w-full rounded-t"
              style={{
                height: `${Math.max(4, (b.value / max) * 100)}%`,
                background: i === peakIdx ? `linear-gradient(180deg, ${accent}, ${accent}CC)` : "var(--apt-bg-raised)",
              }}
              title={`${b.label}: ${formatNumber(b.value)}`}
            />
            <span
              className="text-[9.5px] font-mono"
              style={{ color: i === peakIdx ? "var(--apt-text-primary)" : "var(--apt-text-muted)", fontWeight: i === peakIdx ? 700 : 400 }}
            >
              {b.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Donut ───────────────────────────────────────────────────────────────── */
export interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

export function Donut({
  segments,
  centerLabel,
  centerValue,
}: {
  segments: DonutSegment[];
  centerLabel?: string;
  centerValue?: string;
}) {
  const total = segments.reduce((a, s) => a + s.value, 0);
  if (total === 0) return <EmptyState />;

  const r = 54;
  const circ = 2 * Math.PI * r;
  const dashes = segments.map((s) => (s.value / total) * circ);
  const arcs = segments.map((s, i) => ({
    ...s,
    dash: dashes[i],
    offset: dashes.slice(0, i).reduce((a, d) => a + d, 0),
  }));

  return (
    <div className="flex items-center gap-6">
      <svg viewBox="0 0 140 140" className="w-28 h-28 shrink-0 -rotate-90">
        <circle cx={70} cy={70} r={r} fill="none" stroke="var(--apt-border)" strokeWidth={16} />
        {arcs.map((s) => (
          <circle
            key={s.label}
            cx={70} cy={70} r={r}
            fill="none"
            stroke={s.color}
            strokeWidth={16}
            strokeDasharray={`${s.dash} ${circ - s.dash}`}
            strokeDashoffset={-s.offset}
          />
        ))}
      </svg>

      <div className="flex-1 min-w-0">
        {centerValue && (
          <div className="mb-3">
            <p className="text-2xl font-bold tabular-nums" style={{ color: "var(--apt-text-primary)" }}>{centerValue}</p>
            {centerLabel && <p className="text-xs" style={{ color: "var(--apt-text-secondary)" }}>{centerLabel}</p>}
          </div>
        )}
        <ul className="space-y-1.5">
          {segments.map((s) => (
            <li key={s.label} className="flex items-center justify-between gap-3 text-xs">
              <span className="inline-flex items-center gap-2" style={{ color: "var(--apt-text-primary)" }}>
                <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: s.color }} />
                {s.label}
              </span>
              <span className="tabular-nums" style={{ color: "var(--apt-text-secondary)" }}>
                {formatNumber(s.value)} · {formatPercent(s.value / total, 0)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* ─── ActivityHeatmap ─────────────────────────────────────────────────────── */
const HEATMAP_HOUR_LABELS = ["00", "04", "08", "12", "16", "20", "23"];

export function ActivityHeatmap({
  days,
  matrix,
  accent = "#00B37E",
}: {
  /** Row labels, e.g. ["Mon", "Tue", …] */
  days: string[];
  /** matrix[dayIndex][hour 0-23] = session count */
  matrix: number[][];
  accent?: string;
}) {
  const max = Math.max(0, ...matrix.flat());
  if (max === 0) return <EmptyState />;

  return (
    <div>
      <div className="flex flex-col gap-1">
        {matrix.map((row, ri) => (
          <div key={days[ri] ?? ri} className="flex items-center gap-2">
            <span
              className="w-8 shrink-0 text-right font-mono"
              style={{ fontSize: 10, color: "var(--apt-text-muted)" }}
            >
              {days[ri]}
            </span>
            <div className="flex gap-[3px] flex-1">
              {row.map((v, ci) => {
                const opacity = v === 0 ? 0 : 0.12 + (v / max) * 0.88;
                return (
                  <div
                    key={ci}
                    className="flex-1 rounded-sm aspect-square"
                    style={{
                      background: v === 0 ? "var(--apt-bg-raised)" : accent,
                      opacity: v === 0 ? 1 : opacity,
                    }}
                    title={`${days[ri]} ${String(ci).padStart(2, "0")}:00 · ${formatNumber(v)} session${v === 1 ? "" : "s"}`}
                  />
                );
              })}
            </div>
          </div>
        ))}
        <div className="flex items-center gap-2">
          <span className="w-8 shrink-0" />
          <div className="flex justify-between flex-1" style={{ fontSize: 9.5, color: "var(--apt-text-muted)" }}>
            {HEATMAP_HOUR_LABELS.map((h) => (
              <span key={h}>{h}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Funnel ──────────────────────────────────────────────────────────────── */
export interface FunnelStage {
  stage: string;
  count: number;
}

export function Funnel({ stages }: { stages: FunnelStage[] }) {
  if (stages.length === 0) return <EmptyState />;
  const top = Math.max(1, stages[0]?.count ?? 1);
  return (
    <div className="space-y-2">
      {stages.map((s, i) => {
        const width = Math.max(4, (s.count / top) * 100);
        const stepConv = i === 0 ? 1 : s.count / Math.max(1, stages[i - 1].count);
        return (
          <div key={s.stage}>
            <div className="flex items-center justify-between text-xs mb-1">
              <span style={{ color: "var(--apt-text-primary)" }}>{s.stage}</span>
              <span>
                <span className="font-semibold tabular-nums" style={{ color: "var(--apt-text-primary)" }}>{formatNumber(s.count)}</span>
                {i > 0 && (
                  <span className="ml-2" style={{ color: "var(--apt-text-muted)" }}>
                    {(stepConv * 100).toFixed(0)}% of prev
                  </span>
                )}
              </span>
            </div>
            <div className="h-6 rounded overflow-hidden" style={{ background: "var(--apt-bg-raised)" }}>
              <div
                className="h-full rounded flex items-center px-2"
                style={{
                  width: `${width}%`,
                  background: "linear-gradient(90deg, rgba(0,179,126,0.4), rgba(14,165,233,0.25))",
                  borderRight: "2px solid rgba(0,179,126,0.6)",
                }}
              >
                <span className="text-[10px] font-medium" style={{ color: "rgba(255,255,255,0.7)" }}>
                  {(s.count / top * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
