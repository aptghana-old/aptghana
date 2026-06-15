interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  meta?: React.ReactNode;
}

export function PageHeader({ title, description, actions, meta }: PageHeaderProps) {
  return (
    <div
      className="flex items-start justify-between gap-4 px-6 py-5"
      style={{ borderBottom: "1px solid var(--apt-border)", background: "var(--apt-bg)" }}
    >
      <div className="min-w-0">
        <h1 className="text-[20px] font-semibold tracking-tight" style={{ color: "var(--apt-text-primary)" }}>
          {title}
        </h1>
        {description && (
          <p className="text-[13px] mt-0.5" style={{ color: "var(--apt-text-muted)" }}>
            {description}
          </p>
        )}
        {meta && <div className="flex items-center gap-2 mt-2">{meta}</div>}
      </div>
      {actions && (
        <div className="flex items-center gap-2 shrink-0">{actions}</div>
      )}
    </div>
  );
}
