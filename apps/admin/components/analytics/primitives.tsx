/**
 * Dashboard primitives — theme-aware via CSS custom properties.
 * Used exclusively within the analytics section of the admin.
 */
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { deltaPercent, formatNumber } from "@/lib/analytics/range";

/* ─── Panel ───────────────────────────────────────────────────────────────── */
export function Panel({
  title,
  subtitle,
  action,
  children,
  className = "",
}: {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-xl overflow-hidden ${className}`}
      style={{ background: "var(--apt-bg)", border: "1px solid var(--apt-border)" }}
    >
      {(title || action) && (
        <header
          className="flex items-center justify-between gap-3 px-5 py-4"
          style={{ borderBottom: "1px solid var(--apt-border)" }}
        >
          <div>
            {title && <h2 className="text-sm font-semibold tracking-tight" style={{ color: "var(--apt-text-primary)" }}>{title}</h2>}
            {subtitle && <p className="text-xs mt-0.5" style={{ color: "var(--apt-text-secondary)" }}>{subtitle}</p>}
          </div>
          {action}
        </header>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

/* ─── StatCard ────────────────────────────────────────────────────────────── */
export function StatCard({
  label,
  value,
  current,
  previous,
  hint,
  accent = "#00B37E",
  spark,
  href,
}: {
  label: string;
  value: string;
  current?: number;
  previous?: number;
  hint?: string;
  accent?: string;
  spark?: number[];
  href?: string;
}) {
  const delta = current != null && previous != null ? deltaPercent(current, previous) : null;
  const up = (delta ?? 0) >= 0;
  const content = (
    <div className="rounded-xl p-5 h-full" style={{ background: "var(--apt-bg)", border: "1px solid var(--apt-border)" }}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--apt-text-muted)" }}>{label}</p>
        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: accent }} />
      </div>
      <p className="text-3xl font-bold tracking-tight tabular-nums" style={{ color: "var(--apt-text-primary)" }}>{value}</p>
      <div className="mt-2 flex items-center gap-2 text-xs">
        {delta != null && (
          <span
            className="inline-flex items-center gap-0.5 font-medium"
            style={{ color: up ? "#00D68F" : "#f87171" }}
          >
            {up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {Math.abs(delta).toFixed(0)}%
          </span>
        )}
        {hint && <span style={{ color: "var(--apt-text-muted)" }}>{hint}</span>}
      </div>
      {spark && spark.length > 1 && <div className="mt-3"><Sparkbar values={spark} accent={accent} /></div>}
    </div>
  );
  if (href) return <a href={href} className="block h-full">{content}</a>;
  return content;
}

/* ─── BarList ─────────────────────────────────────────────────────────────── */
export interface BarItem {
  label: string;
  value: number;
  secondary?: string;
  leading?: React.ReactNode;
}

export function BarList({
  items,
  accent = "#00B37E",
  valueFormatter = formatNumber,
}: {
  items: BarItem[];
  accent?: string;
  valueFormatter?: (n: number) => string;
}) {
  const max = Math.max(1, ...items.map((i) => i.value));
  if (items.length === 0) return <EmptyState />;
  return (
    <ul className="space-y-1">
      {items.map((item, i) => {
        const pct = Math.max(3, (item.value / max) * 100);
        return (
          <li key={`${item.label}-${i}`}>
            <div className="relative flex items-center justify-between gap-3 px-3 py-2 rounded-md overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 rounded-md"
                style={{ width: `${pct}%`, backgroundColor: accent, opacity: 0.1 }}
              />
              <div className="relative flex items-center gap-2 min-w-0">
                {item.leading}
                <span className="text-sm truncate" style={{ color: "var(--apt-text-primary)" }}>{item.label}</span>
              </div>
              <div className="relative flex items-center gap-2 shrink-0">
                {item.secondary && <span className="text-xs" style={{ color: "var(--apt-text-muted)" }}>{item.secondary}</span>}
                <span className="text-sm font-semibold tabular-nums" style={{ color: "var(--apt-text-primary)" }}>{valueFormatter(item.value)}</span>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/* ─── EmptyState ──────────────────────────────────────────────────────────── */
export function EmptyState({ message = "No data in this period yet." }: { message?: string }) {
  return (
    <div className="py-10 text-center">
      <p className="text-sm" style={{ color: "var(--apt-text-muted)" }}>{message}</p>
      <p className="text-xs mt-1" style={{ color: "var(--apt-text-muted)" }}>Data appears as visitors browse the site.</p>
    </div>
  );
}

/* ─── Sparkbar ────────────────────────────────────────────────────────────── */
export function Sparkbar({ values, accent = "#00B37E" }: { values: number[]; accent?: string }) {
  const max = Math.max(1, ...values);
  return (
    <div className="flex items-end gap-0.5 h-8">
      {values.map((v, i) => (
        <div
          key={i}
          className="flex-1 rounded-sm min-w-[2px]"
          style={{
            height: `${Math.max(6, (v / max) * 100)}%`,
            backgroundColor: accent,
            opacity: 0.3 + (v / max) * 0.7,
          }}
        />
      ))}
    </div>
  );
}

/* ─── AppBadge ────────────────────────────────────────────────────────────── */
export function AppBadge({ hostname }: { hostname: string }) {
  const isStore = hostname.includes("store") || hostname.includes("3001");
  return (
    <span
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold"
      style={{
        background: isStore ? "rgba(0,87,184,0.15)" : "rgba(0,179,126,0.12)",
        color: isStore ? "#38bdf8" : "#00D68F",
        border: `1px solid ${isStore ? "rgba(56,189,248,0.2)" : "rgba(0,212,111,0.2)"}`,
      }}
    >
      {isStore ? "Store" : "Web"}
    </span>
  );
}
