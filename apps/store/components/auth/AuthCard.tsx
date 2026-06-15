import type { ReactNode } from "react";

interface AuthCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: "sm" | "md";
}

export function AuthCard({ title, subtitle, children, footer, maxWidth = "sm" }: AuthCardProps) {
  const w = maxWidth === "md" ? "max-w-lg" : "max-w-md";
  return (
    <div className={`w-full ${w}`}>
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-(--text-1) tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-(--text-3) mt-1.5 leading-relaxed">{subtitle}</p>}
      </div>
      <div className="bg-(--bg-surface) rounded-2xl border border-(--border) shadow-[0_4px_24px_-4px_rgba(0,0,0,0.08)] dark:shadow-[0_4px_24px_-4px_rgba(0,0,0,0.3)] p-7">
        {children}
      </div>
      {footer && (
        <div className="mt-5 text-center text-sm text-(--text-3)">{footer}</div>
      )}
    </div>
  );
}
