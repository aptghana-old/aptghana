"use client";

import Link from "next/link";
import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";

/* ─── Inline SVG icon ─────────────────────────────────────────────────────── */
export function Icon({
  d, size = 20, strokeWidth = 1.75, className = "",
}: {
  d: string; size?: number; strokeWidth?: number; className?: string;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden className={className}>
      <path d={d} />
    </svg>
  );
}

/* ─── Page heading ────────────────────────────────────────────────────────── */
export function PageHeader({ title, subtitle, action }: {
  title: string; subtitle?: string; action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold text-(--text-1) tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-(--text-3) mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

/* ─── Section card ────────────────────────────────────────────────────────── */
export function SectionCard({ id, title, description, badge, children, action }: {
  id?: string; title: string; description?: string;
  badge?: ReactNode; children: ReactNode; action?: ReactNode;
}) {
  return (
    <div id={id} className="bg-(--bg-surface) border border-(--border) rounded-2xl overflow-hidden">
      <div className="px-6 py-5 border-b border-(--border) flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-(--text-1)">{title}</h2>
            {badge}
          </div>
          {description && <p className="text-sm text-(--text-3) mt-0.5">{description}</p>}
        </div>
        {action}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

/* ─── Empty state ─────────────────────────────────────────────────────────── */
export function EmptyState({ icon, title, description, action }: {
  icon: string; title: string; description?: string; action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-14 h-14 rounded-2xl bg-(--bg-raised) border border-(--border) flex items-center justify-center mb-4">
        <Icon d={icon} size={24} strokeWidth={1.5} className="text-(--text-4)" />
      </div>
      <h3 className="text-base font-bold text-(--text-1) mb-1">{title}</h3>
      {description && <p className="text-sm text-(--text-3) mb-5 max-w-xs">{description}</p>}
      {action}
    </div>
  );
}

/* ─── Status badge ────────────────────────────────────────────────────────── */
const STATUS_MAP: Record<string, { bg: string; text: string; dot: string }> = {
  pending:    { bg: "bg-amber-50 dark:bg-amber-900/20",   text: "text-amber-700 dark:text-amber-400",  dot: "bg-amber-500" },
  confirmed:  { bg: "bg-navy-50 dark:bg-navy-900/30",     text: "text-navy-600 dark:text-navy-300",    dot: "bg-navy-500" },
  processing: { bg: "bg-blue-50 dark:bg-blue-900/20",     text: "text-blue-600 dark:text-blue-400",    dot: "bg-blue-500" },
  shipped:    { bg: "bg-purple-50 dark:bg-purple-900/20", text: "text-purple-600 dark:text-purple-400",dot: "bg-purple-500" },
  delivered:  { bg: "bg-green-50 dark:bg-green-900/20",   text: "text-green-700 dark:text-green-400",  dot: "bg-green-500" },
  cancelled:  { bg: "bg-red-50 dark:bg-red-900/20",       text: "text-red-600 dark:text-red-400",      dot: "bg-red-500" },
  active:     { bg: "bg-green-50 dark:bg-green-900/20",   text: "text-green-700 dark:text-green-400",  dot: "bg-green-500" },
  draft:      { bg: "bg-(--bg-raised)",                   text: "text-(--text-3)",                     dot: "bg-(--text-4)" },
  quoted:     { bg: "bg-navy-50 dark:bg-navy-900/30",     text: "text-navy-600 dark:text-navy-300",    dot: "bg-navy-500" },
  reviewing:  { bg: "bg-blue-50 dark:bg-blue-900/20",     text: "text-blue-600 dark:text-blue-400",    dot: "bg-blue-500" },
  waiting_customer: { bg: "bg-amber-50 dark:bg-amber-900/20", text: "text-amber-700 dark:text-amber-400", dot: "bg-amber-500" },
  approved:   { bg: "bg-navy-50 dark:bg-navy-900/30",     text: "text-navy-600 dark:text-navy-300",    dot: "bg-navy-500" },
  paid:       { bg: "bg-green-50 dark:bg-green-900/20",   text: "text-green-700 dark:text-green-400",  dot: "bg-green-500" },
  ready_for_delivery: { bg: "bg-purple-50 dark:bg-purple-900/20", text: "text-purple-600 dark:text-purple-400", dot: "bg-purple-500" },
  completed:  { bg: "bg-green-50 dark:bg-green-900/20",   text: "text-green-700 dark:text-green-400",  dot: "bg-green-500" },
  expired:    { bg: "bg-(--bg-raised)",                   text: "text-(--text-3)",                     dot: "bg-(--text-4)" },
};

export function StatusBadge({ status, label }: { status: string; label?: string }) {
  const s = STATUS_MAP[status] ?? STATUS_MAP.draft;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold capitalize ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.dot}`} />
      {label ?? status}
    </span>
  );
}

/* ─── Form input ──────────────────────────────────────────────────────────── */
export function FormField({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <div>
      <label className="block text-sm font-medium text-(--text-2) mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-xs text-(--text-4) mt-1">{hint}</p>}
    </div>
  );
}

const inputBase = "w-full h-11 px-4 rounded-xl border border-(--border) bg-(--bg-surface) text-(--text-1) text-sm placeholder:text-(--text-4) focus:outline-none focus:border-navy-500 focus:ring-2 focus:ring-navy-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed";
export { inputBase };

/* ─── Alert ───────────────────────────────────────────────────────────────── */
export function Alert({ type, message }: { type: "success" | "error" | "warning" | "info"; message: string }) {
  const styles = {
    success: "bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800 text-green-800 dark:text-green-300",
    error:   "bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400",
    warning: "bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-700 text-amber-800 dark:text-amber-300",
    info:    "bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400",
  };
  const icons = {
    success: "M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    error:   "M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z",
    warning: "M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z",
    info:    "M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z",
  };
  return (
    <div className={`flex items-start gap-2.5 px-4 py-3 rounded-xl text-sm border ${styles[type]}`}>
      <Icon d={icons[type]} size={16} strokeWidth={2} className="shrink-0 mt-0.5" />
      <span>{message}</span>
    </div>
  );
}

/* ─── Primary button ──────────────────────────────────────────────────────── */
export function PrimaryBtn({ children, loading, disabled, type = "submit", onClick, variant = "navy", className = "" }: {
  children: ReactNode; loading?: boolean; disabled?: boolean;
  type?: "submit" | "button"; onClick?: () => void;
  variant?: "navy" | "green" | "danger"; className?: string;
}) {
  const colors = {
    navy:   "bg-navy-500 hover:bg-navy-400",
    green:  "bg-se-green hover:bg-se-green-hover",
    danger: "bg-red-500 hover:bg-red-600",
  };
  return (
    <button
      type={type}
      disabled={loading || disabled}
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 h-10 px-5 ${colors[variant]} disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-colors ${className}`}
    >
      {loading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
      {children}
    </button>
  );
}

/* ─── Ghost button ────────────────────────────────────────────────────────── */
export function GhostBtn({ children, onClick, type = "button", className = "" }: {
  children: ReactNode; onClick?: () => void; type?: "submit" | "button"; className?: string;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 h-10 px-4 border border-(--border) text-(--text-2) text-sm font-semibold rounded-xl hover:border-navy-400 hover:text-navy-500 transition-colors ${className}`}
    >
      {children}
    </button>
  );
}

/* ─── Toggle switch ───────────────────────────────────────────────────────── */
export function Toggle({ checked, onChange, label }: {
  checked: boolean; onChange: (v: boolean) => void; label?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-navy-500/40 ${checked ? "bg-navy-500" : "bg-(--border)"}`}
    >
      <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm transform transition-transform ${checked ? "translate-x-5" : "translate-x-0"}`} />
    </button>
  );
}

/* ─── Modal dialog ────────────────────────────────────────────────────────── */
export function Modal({ open, onClose, title, description, children, footer }: {
  open: boolean; onClose: () => void;
  title: string; description?: string;
  children: ReactNode; footer?: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", esc);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", esc);
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center sm:p-4" role="dialog" aria-modal aria-label={title}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-lg max-h-[92vh] overflow-y-auto bg-(--bg-surface) rounded-t-2xl sm:rounded-2xl shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
        <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-4 border-b border-(--border) sticky top-0 bg-(--bg-surface) z-10">
          <div>
            <h2 className="text-base font-bold text-(--text-1)">{title}</h2>
            {description && <p className="text-xs text-(--text-3) mt-0.5">{description}</p>}
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="w-8 h-8 rounded-full bg-(--bg-raised) flex items-center justify-center text-(--text-3) hover:text-(--text-1) transition-colors shrink-0"
          >
            <Icon d="M6 18L18 6M6 6l12 12" size={14} strokeWidth={2.5} />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-(--border)">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

/* ─── Confirm dialog ──────────────────────────────────────────────────────── */
export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = "Confirm", danger = false, loading = false }: {
  open: boolean; onClose: () => void; onConfirm: () => void;
  title: string; message: string; confirmLabel?: string;
  danger?: boolean; loading?: boolean;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <>
          <GhostBtn onClick={onClose}>Cancel</GhostBtn>
          <PrimaryBtn type="button" onClick={onConfirm} loading={loading} variant={danger ? "danger" : "navy"}>
            {confirmLabel}
          </PrimaryBtn>
        </>
      }
    >
      <p className="text-sm text-(--text-2)">{message}</p>
    </Modal>
  );
}

/* ─── Stat card ───────────────────────────────────────────────────────────── */
export function StatCard({ label, value, sub, href, icon }: {
  label: string; value: string | number; sub?: string; href?: string; icon?: string;
}) {
  const inner = (
    <div className={`bg-(--bg-surface) border border-(--border) rounded-2xl p-5 h-full ${href ? "hover:border-navy-500/30 hover:shadow-[0_2px_12px_rgba(0,0,0,0.06)] transition-all" : ""}`}>
      {icon && (
        <div className="w-8 h-8 rounded-xl bg-(--bg-raised) flex items-center justify-center mb-3">
          <Icon d={icon} size={16} strokeWidth={2} className="text-(--text-3)" />
        </div>
      )}
      <p className="text-xs font-semibold text-(--text-4) uppercase tracking-wide mb-1">{label}</p>
      <p className="text-2xl font-bold text-(--text-1) leading-none">{value}</p>
      {sub && <p className="text-xs text-(--text-4) mt-1.5">{sub}</p>}
    </div>
  );
  return href ? <Link href={href} className="block">{inner}</Link> : inner;
}
