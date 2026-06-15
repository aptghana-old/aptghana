type Variant = "default" | "active" | "inactive" | "pending" | "draft" | "success" | "warning" | "error" | "info" | "blue";

interface BadgeProps {
  variant?: Variant;
  children: React.ReactNode;
  dot?: boolean;
  className?: string;
}

const STYLES: Record<Variant, { bg: string; text: string; dot?: string }> = {
  default:  { bg: "var(--apt-bg-raised)", text: "var(--apt-text-secondary)" },
  active:   { bg: "#dcfce7", text: "#15803d", dot: "#16a34a" },
  inactive: { bg: "var(--apt-bg-raised)", text: "var(--apt-text-muted)" },
  pending:  { bg: "#fef3c7", text: "#b45309", dot: "#d97706" },
  draft:    { bg: "#f1f5f9", text: "#475569" },
  success:  { bg: "#dcfce7", text: "#15803d", dot: "#16a34a" },
  warning:  { bg: "#fef3c7", text: "#b45309", dot: "#d97706" },
  error:    { bg: "#fee2e2", text: "#b91c1c", dot: "#dc2626" },
  info:     { bg: "#e0f2fe", text: "#0369a1", dot: "#0284c7" },
  blue:     { bg: "#dbeafe", text: "#1d4ed8", dot: "#3b82f6" },
};

export function Badge({ variant = "default", children, dot = false, className = "" }: BadgeProps) {
  const style = STYLES[variant];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold leading-none whitespace-nowrap ${className}`}
      style={{ background: style.bg, color: style.text }}
    >
      {dot && style.dot && (
        <span
          className="w-1.5 h-1.5 rounded-full shrink-0"
          style={{ background: style.dot }}
        />
      )}
      {children}
    </span>
  );
}

/* Status → Badge variant mapping for products/orders/etc. */
export function statusVariant(status: string): Variant {
  const map: Record<string, Variant> = {
    active: "active", published: "active", confirmed: "active", accepted: "success",
    inactive: "inactive", archived: "inactive", cancelled: "error", rejected: "error",
    pending: "pending", draft: "draft", processing: "info",
    quoted: "blue", fulfilled: "success", shipped: "info",
    // Quote workflow statuses
    reviewing: "info", waiting_customer: "warning", approved: "blue",
    paid: "success", ready_for_delivery: "info", delivered: "success",
    completed: "success", expired: "inactive", declined: "error",
  };
  return map[status.toLowerCase()] ?? "default";
}
