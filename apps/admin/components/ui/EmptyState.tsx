interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      {icon && (
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
          style={{ background: "var(--apt-bg-raised)", color: "var(--apt-text-muted)" }}
        >
          {icon}
        </div>
      )}
      <h3 className="text-[15px] font-semibold mb-1" style={{ color: "var(--apt-text-primary)" }}>
        {title}
      </h3>
      {description && (
        <p className="text-[13px] max-w-xs" style={{ color: "var(--apt-text-muted)" }}>
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
