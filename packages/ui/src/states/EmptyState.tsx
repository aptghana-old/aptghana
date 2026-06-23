import type { ReactNode } from "react";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  /** Make the container fill its parent height */
  fill?: boolean;
}

const DefaultIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="M8 10h8M8 14h4" />
  </svg>
);

export function EmptyState({ icon, title, description, action, fill }: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center px-6 ${fill ? "min-h-[360px]" : "py-16"}`}
    >
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
        style={{ background: "#F1F5F9", color: "#94A3B8" }}
      >
        {icon ?? <DefaultIcon />}
      </div>
      <h3
        className="text-[15px] font-semibold mb-2"
        style={{ color: "#0F172A" }}
      >
        {title}
      </h3>
      {description && (
        <p
          className="text-[13px] max-w-xs leading-relaxed"
          style={{ color: "#64748B" }}
        >
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
