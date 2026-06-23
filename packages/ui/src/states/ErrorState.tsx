import type { ReactNode } from "react";

interface ErrorStateProps {
  title?: string;
  description?: string;
  action?: ReactNode;
  fill?: boolean;
}

const ErrorIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

export function ErrorState({
  title = "Something went wrong",
  description = "We were unable to load this content. Please try refreshing the page or contact support if the problem persists.",
  action,
  fill,
}: ErrorStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center px-6 ${fill ? "min-h-[360px]" : "py-16"}`}
    >
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
        style={{ background: "#FEF2F2", color: "#DC2626" }}
      >
        <ErrorIcon />
      </div>
      <h3
        className="text-[15px] font-semibold mb-2"
        style={{ color: "#0F172A" }}
      >
        {title}
      </h3>
      <p
        className="text-[13px] max-w-sm leading-relaxed"
        style={{ color: "#64748B" }}
      >
        {description}
      </p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
