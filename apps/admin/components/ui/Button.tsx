import { Loader2 } from "lucide-react";

type Variant = "primary" | "secondary" | "ghost" | "destructive" | "outline";
type Size = "xs" | "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  asChild?: boolean;
}

const VARIANT_STYLES: Record<Variant, string> = {
  primary:     "bg-[#0057b8] text-white hover:bg-[#0049a0] active:bg-[#003d87] shadow-sm",
  secondary:   "bg-[var(--apt-bg)] text-[var(--apt-text-primary)] border border-[var(--apt-border)] hover:bg-[var(--apt-bg-raised)] shadow-xs",
  ghost:       "text-[var(--apt-text-secondary)] hover:bg-[var(--apt-bg-raised)] hover:text-[var(--apt-text-primary)]",
  destructive: "bg-[#dc2626] text-white hover:bg-[#b91c1c] active:bg-[#991b1b] shadow-sm",
  outline:     "border border-[var(--apt-border-strong)] text-[var(--apt-text-primary)] hover:bg-[var(--apt-bg-raised)]",
};

const SIZE_STYLES: Record<Size, string> = {
  xs: "h-6  px-2   text-[11px] gap-1   rounded",
  sm: "h-8  px-3   text-[12px] gap-1.5 rounded-md",
  md: "h-9  px-3.5 text-[13px] gap-2   rounded-md",
  lg: "h-10 px-4   text-[14px] gap-2   rounded-lg",
};

export function Button({
  variant = "secondary",
  size = "md",
  loading = false,
  icon,
  iconRight,
  children,
  disabled,
  className = "",
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      disabled={isDisabled}
      className={[
        "inline-flex items-center justify-center font-medium transition-colors select-none",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--apt-border-focus)] focus-visible:ring-offset-1",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        VARIANT_STYLES[variant],
        SIZE_STYLES[size],
        className,
      ].join(" ")}
      {...props}
    >
      {loading ? (
        <Loader2 size={size === "xs" ? 11 : size === "sm" ? 12 : 14} className="animate-spin shrink-0" />
      ) : icon ? (
        <span className="shrink-0">{icon}</span>
      ) : null}
      {children}
      {iconRight && !loading && <span className="shrink-0">{iconRight}</span>}
    </button>
  );
}
