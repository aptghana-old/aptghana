import Link from "next/link";
import { AlertTriangle, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { AreaChart, type Series } from "@/components/analytics/charts";
import { EmptyState } from "@/components/analytics/primitives";

/* ─── Time range tabs ─────────────────────────────────────────────────────── */
const RANGES: { key: string; label: string }[] = [
  { key: "7d", label: "7D" },
  { key: "30d", label: "30D" },
  { key: "this_quarter", label: "QTD" },
  { key: "this_year", label: "YTD" },
];

export function TimeRangeTabs({ current, basePath }: { current: string; basePath: string }) {
  return (
    <div className="flex bg-white rounded-lg p-0.5 gap-0.5" style={{ border: "1px solid var(--apt-border)" }}>
      {RANGES.map((r) => (
        <Link
          key={r.key}
          href={`${basePath}?range=${r.key}`}
          className="px-2.5 py-1 rounded-md text-[12px] font-semibold font-mono transition-colors"
          style={{
            background: current === r.key ? "var(--apt-text-primary)" : "transparent",
            color: current === r.key ? "#fff" : "var(--apt-text-muted)",
          }}
        >
          {r.label}
        </Link>
      ))}
    </div>
  );
}

/* ─── Revenue hero (GMV) ──────────────────────────────────────────────────── */
export function RevenueHero({
  value,
  deltaPct,
  hint,
  labels,
  series,
}: {
  value: string;
  deltaPct: number | null;
  hint: string;
  labels: string[];
  series: Series[];
}) {
  const up = (deltaPct ?? 0) >= 0;
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "var(--apt-bg)", border: "1px solid var(--apt-border)" }}>
      <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-2">
        <div>
          <div className="text-[11px] font-semibold tracking-wider uppercase font-mono" style={{ color: "var(--apt-text-muted)" }}>
            Gross Merchandise Value
          </div>
          <div className="flex items-baseline gap-3 mt-2">
            <span className="text-[34px] font-bold tracking-tight leading-none" style={{ color: "var(--apt-text-primary)" }}>{value}</span>
            {deltaPct != null && (
              <span
                className="inline-flex items-center gap-0.5 text-[13px] font-bold px-2 py-0.5 rounded-md"
                style={{ background: up ? "var(--color-success-50)" : "var(--color-error-50)", color: up ? "var(--color-success-700)" : "var(--color-error-700)" }}
              >
                {up ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                {Math.abs(deltaPct).toFixed(1)}%
              </span>
            )}
          </div>
          <div className="mt-1.5 text-[12.5px]" style={{ color: "var(--apt-text-secondary)" }}>{hint}</div>
        </div>
      </div>
      <div className="px-3 pb-3">
        <AreaChart labels={labels} series={series} height={190} />
      </div>
    </div>
  );
}

/* ─── RFQ pipeline card ───────────────────────────────────────────────────── */
export interface PipelineStage {
  label: string;
  count: number;
  color: string;
}

export function PipelineCard({
  weightedValue,
  openCount,
  stages,
  conversionRate,
}: {
  weightedValue: string;
  openCount: number;
  stages: PipelineStage[];
  conversionRate: number | null;
}) {
  const max = Math.max(1, ...stages.map((s) => s.count));
  return (
    <div className="rounded-2xl p-6 flex flex-col h-full" style={{ background: "var(--apt-bg)", border: "1px solid var(--apt-border)" }}>
      <div className="flex items-center justify-between">
        <div className="text-[11px] font-semibold tracking-wider uppercase font-mono" style={{ color: "var(--apt-text-muted)" }}>
          RFQ Pipeline
        </div>
        <span className="text-[11.5px]" style={{ color: "var(--apt-text-secondary)" }}>{openCount} open</span>
      </div>
      <div className="flex items-baseline gap-2 mt-3">
        <span className="text-[27px] font-bold tracking-tight leading-none" style={{ color: "var(--apt-text-primary)" }}>{weightedValue}</span>
        <span className="text-[12px]" style={{ color: "var(--apt-text-secondary)" }}>weighted value</span>
      </div>
      <div className="flex flex-col gap-3.5 mt-5 flex-1 justify-center">
        {stages.map((s) => (
          <div key={s.label}>
            <div className="flex justify-between mb-1">
              <span className="text-[12.5px] font-semibold" style={{ color: "var(--apt-text-secondary)" }}>{s.label}</span>
              <span className="text-[12px] font-mono font-semibold" style={{ color: "var(--apt-text-primary)" }}>{s.count}</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--apt-bg-raised)" }}>
              <div className="h-full rounded-full" style={{ width: `${Math.max(2, (s.count / max) * 100)}%`, background: s.color }} />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 pt-3.5 flex justify-between items-center" style={{ borderTop: "1px solid var(--apt-border)" }}>
        <span className="text-[12px]" style={{ color: "var(--apt-text-secondary)" }}>Conversion rate</span>
        <span className="text-[15px] font-bold font-mono" style={{ color: "var(--color-success-700)" }}>
          {conversionRate != null ? `${(conversionRate * 100).toFixed(1)}%` : "—"}
        </span>
      </div>
    </div>
  );
}

/* ─── Low stock panel ─────────────────────────────────────────────────────── */
export interface LowStockItem {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  reorderPoint: number;
}

export function LowStockPanel({ items, total }: { items: LowStockItem[]; total: number }) {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "var(--apt-bg)", border: "1px solid var(--apt-border)" }}>
      <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--apt-border)" }}>
        <div className="flex items-center gap-2">
          <AlertTriangle size={15} style={{ color: "var(--color-warning-600)" }} />
          <h2 className="text-[14px] font-bold" style={{ color: "var(--apt-text-primary)" }}>Low Stock Alerts</h2>
        </div>
        {total > 0 && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "var(--color-warning-100)", color: "var(--color-warning-700)" }}>
            {total}
          </span>
        )}
      </div>
      {items.length === 0 ? (
        <div className="py-8"><EmptyState message="No products below reorder point." /></div>
      ) : (
        <div className="flex flex-col">
          {items.map((p) => (
            <Link
              key={p.id}
              href={`/dashboard/products/${p.id}`}
              className="flex items-center gap-3 px-5 py-2.5 transition-colors hover:bg-[var(--apt-bg-subtle)]"
              style={{ borderBottom: "1px solid var(--apt-bg-raised)" }}
            >
              <div className="w-8 h-8 rounded-md shrink-0" style={{ background: "var(--apt-bg-raised)" }} />
              <div className="min-w-0 flex-1">
                <div className="text-[12px] font-semibold truncate" style={{ color: "var(--apt-text-primary)" }}>{p.name}</div>
                <div className="text-[10.5px] font-mono" style={{ color: "var(--apt-text-muted)" }}>{p.sku}</div>
              </div>
              <span
                className="text-[12px] font-bold font-mono shrink-0"
                style={{ color: p.quantity <= 0 ? "var(--color-error-600)" : "var(--color-warning-700)" }}
              >
                {p.quantity} left
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Quick actions grid ──────────────────────────────────────────────────── */
export interface QuickAction {
  label: string;
  href: string;
  icon: React.ReactNode;
  accent: string;
  accentBg: string;
}

export function QuickActionsGrid({ actions }: { actions: QuickAction[] }) {
  return (
    <div className="rounded-2xl p-4" style={{ background: "var(--apt-bg)", border: "1px solid var(--apt-border)" }}>
      <h2 className="text-[14px] font-bold mb-3 px-1" style={{ color: "var(--apt-text-primary)" }}>Quick Actions</h2>
      <div className="grid grid-cols-2 gap-2">
        {actions.map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className="flex flex-col gap-2 p-3 rounded-xl transition-colors"
            style={{ border: "1px solid var(--apt-border)" }}
          >
            <span className="w-7 h-7 rounded-md flex items-center justify-center" style={{ background: a.accentBg, color: a.accent }}>
              {a.icon}
            </span>
            <span className="text-[12px] font-semibold" style={{ color: "var(--apt-text-secondary)" }}>{a.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
