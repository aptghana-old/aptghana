"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, LayoutDashboard } from "lucide-react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset(): void }) {
  useEffect(() => {
    console.error("[APT Admin Error]", error);
  }, [error]);

  return (
    <div
      className="flex flex-col items-center justify-center min-h-[60vh] px-6 py-16 text-center"
    >
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
        style={{ background: "#fef2f2" }}
      >
        <AlertTriangle size={24} style={{ color: "#dc2626" }} />
      </div>

      <h1 className="text-[20px] font-semibold mb-2" style={{ color: "var(--apt-text-primary)" }}>
        Something went wrong
      </h1>
      <p className="text-[13px] max-w-sm mb-1" style={{ color: "var(--apt-text-muted)" }}>
        An unexpected error occurred. The team has been notified.
      </p>
      {error.digest && (
        <p className="text-[11px] font-mono mb-6" style={{ color: "var(--apt-text-disabled)" }}>
          Error ID: {error.digest}
        </p>
      )}

      <div className="flex gap-3">
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium transition-colors"
          style={{ background: "#0057b8", color: "#fff" }}
        >
          <RefreshCw size={13} />
          Try again
        </button>
        <a
          href="/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium transition-colors"
          style={{ background: "var(--apt-bg)", border: "1px solid var(--apt-border)", color: "var(--apt-text-secondary)" }}
        >
          <LayoutDashboard size={13} />
          Dashboard
        </a>
      </div>
    </div>
  );
}
