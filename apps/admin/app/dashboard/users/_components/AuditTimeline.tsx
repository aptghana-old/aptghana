"use client";

import { useEffect, useState } from "react";
import { Clock, Loader2 } from "lucide-react";
import type { AuditEntry } from "./types";
import { AUDIT_ACTION_LABELS, formatDate } from "./types";

interface Props {
  userId: string;
}

export default function AuditTimeline({ userId }: Props) {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/users/${userId}/audit`)
      .then((r) => r.json())
      .then((data) => {
        setLogs(data.logs ?? []);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load audit history");
        setLoading(false);
      });
  }, [userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 gap-2" style={{ color: "var(--apt-text-muted)" }}>
        <Loader2 size={16} className="animate-spin" />
        <span className="text-[13px]">Loading history…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8 text-center text-[13px]" style={{ color: "var(--apt-danger)" }}>{error}</div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="py-12 text-center" style={{ color: "var(--apt-text-muted)" }}>
        <Clock size={22} className="mx-auto mb-2 opacity-40" />
        <p className="text-[13px]">No activity recorded yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {logs.map((log, i) => {
        const meta = AUDIT_ACTION_LABELS[log.action];
        return (
          <div key={log._id} className="flex gap-3 relative">
            {i < logs.length - 1 && (
              <div
                className="absolute left-[13px] top-7 bottom-0 w-px"
                style={{ background: "var(--apt-border)" }}
              />
            )}
            <div
              className="w-6.5 h-6.5 rounded-full shrink-0 mt-1 flex items-center justify-center"
              style={{
                width: 26,
                height: 26,
                background: `${meta?.color ?? "#6b7280"}20`,
                border: `2px solid ${meta?.color ?? "#6b7280"}40`,
              }}
            >
              <div
                className="w-2 h-2 rounded-full"
                style={{ background: meta?.color ?? "#6b7280" }}
              />
            </div>
            <div className="pb-4 flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <span
                  className="text-[12px] font-semibold leading-tight"
                  style={{ color: "var(--apt-text-primary)" }}
                >
                  {meta?.label ?? log.action.replace(/_/g, " ")}
                </span>
                <span className="text-[10px] shrink-0 mt-0.5" style={{ color: "var(--apt-text-muted)" }}>
                  {formatDate(log.createdAt)}
                </span>
              </div>
              {log.message && (
                <p className="text-[11px] mt-0.5" style={{ color: "var(--apt-text-secondary)" }}>
                  {log.message}
                </p>
              )}
              {log.meta && Object.keys(log.meta).length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {typeof log.meta.roleChange === "object" && log.meta.roleChange !== null && (
                    <span className="text-[10px] px-1.5 py-px rounded" style={{ background: "var(--apt-bg-raised)", color: "var(--apt-text-muted)" }}>
                      {String((log.meta.roleChange as Record<string, string>).from)} → {String((log.meta.roleChange as Record<string, string>).to)}
                    </span>
                  )}
                  {typeof log.meta.statusChange === "object" && log.meta.statusChange !== null && (
                    <span className="text-[10px] px-1.5 py-px rounded" style={{ background: "var(--apt-bg-raised)", color: "var(--apt-text-muted)" }}>
                      Status: {String((log.meta.statusChange as Record<string, string>).to)}
                    </span>
                  )}
                </div>
              )}
              {log.actor?.name && (
                <p className="text-[10px] mt-1" style={{ color: "var(--apt-text-muted)" }}>
                  by {log.actor.name}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
