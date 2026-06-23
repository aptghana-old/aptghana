import type { ReactNode } from "react";

interface NotFoundStateProps {
  resourceType?: string;
  title?: string;
  description?: string;
  primaryAction?: ReactNode;
  secondaryAction?: ReactNode;
}

const NotFoundIcon = () => (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
    <path d="M11 8v4M11 15h.01" />
  </svg>
);

export function NotFoundState({
  resourceType = "Page",
  title,
  description,
  primaryAction,
  secondaryAction,
}: NotFoundStateProps) {
  const heading = title ?? `${resourceType} Not Found`;
  const body =
    description ??
    `The ${resourceType.toLowerCase()} you're looking for doesn't exist or may have been moved. Check the URL or browse using the navigation above.`;

  return (
    <div className="flex flex-col items-center justify-center min-h-[480px] px-6 text-center">
      {/* Decorative ring */}
      <div className="relative mb-8">
        <div
          className="w-24 h-24 rounded-full flex items-center justify-center"
          style={{ background: "var(--apt-bg-info)", color: "var(--apt-color-info)" }}
        >
          <NotFoundIcon />
        </div>
        <div
          className="absolute inset-0 rounded-full border-2 opacity-20 scale-110"
          style={{ borderColor: "var(--apt-color-info)" }}
        />
      </div>

      {/* Status badge */}
      <div
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest mb-5"
        style={{ background: "var(--apt-bg-raised)", color: "var(--apt-text-3)" }}
      >
        <span>404</span>
        <span style={{ color: "var(--apt-border-hi)" }}>·</span>
        <span>Not Found</span>
      </div>

      <h1
        className="text-2xl font-bold tracking-tight mb-3"
        style={{ color: "var(--apt-text)" }}
      >
        {heading}
      </h1>
      <p
        className="text-sm leading-relaxed max-w-md mb-8"
        style={{ color: "var(--apt-text-3)" }}
      >
        {body}
      </p>

      {(primaryAction || secondaryAction) && (
        <div className="flex flex-wrap items-center justify-center gap-3">
          {primaryAction}
          {secondaryAction}
        </div>
      )}
    </div>
  );
}
