"use client";

import { useState, useRef } from "react";
import { RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface ProgressEvent {
  stage:   string;
  message: string;
  done?:   number;
  total?:  number;
  indexed?: number;
  errors?:  number;
}

export function ReindexButton() {
  const [status,   setStatus]   = useState<"idle" | "running" | "done" | "error">("idle");
  const [log,      setLog]      = useState<ProgressEvent[]>([]);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);

  async function handleReindex() {
    setStatus("running");
    setLog([]);
    setProgress(null);

    try {
      const res = await fetch("/api/search/reindex", { method: "POST" });
      if (!res.body) throw new Error("No response body");

      const reader  = res.body.getReader();
      readerRef.current = reader;
      const decoder = new TextDecoder();
      let   buffer  = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const event: ProgressEvent = JSON.parse(line.slice(6));
            setLog((prev) => [...prev, event]);
            if (event.done !== undefined && event.total !== undefined) {
              setProgress({ done: event.done, total: event.total });
            }
            if (event.stage === "complete") setStatus("done");
            if (event.stage === "error")    setStatus("error");
          } catch { /* malformed line */ }
        }
      }

      if (status !== "done" && status !== "error") setStatus("done");
    } catch (err) {
      setLog((prev) => [...prev, { stage: "error", message: String(err) }]);
      setStatus("error");
    }
  }

  const pct = progress ? Math.round((progress.done / progress.total) * 100) : 0;
  const last = log[log.length - 1];

  return (
    <div className="space-y-3">
      <Button
        variant="primary"
        size="sm"
        icon={<RefreshCw size={13} className={status === "running" ? "animate-spin" : ""} />}
        onClick={handleReindex}
        disabled={status === "running"}
      >
        {status === "running" ? "Indexing…" : "Sync to Meilisearch"}
      </Button>

      {/* Progress bar */}
      {status === "running" && progress && (
        <div className="space-y-1">
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--apt-bg-raised)" }}>
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{ width: `${pct}%`, background: "#0057b8" }}
            />
          </div>
          <p className="text-[11px] tabular-nums" style={{ color: "var(--apt-text-muted)" }}>
            {progress.done.toLocaleString()} / {progress.total.toLocaleString()} products ({pct}%)
          </p>
        </div>
      )}

      {/* Status message */}
      {last && status !== "running" && (
        <div
          className="flex items-start gap-2 p-3 rounded-lg text-[12px]"
          style={{
            background: status === "done" ? "#f0fdf4" : "#fef2f2",
            color:      status === "done" ? "#166534" : "#991b1b",
          }}
        >
          {status === "done"
            ? <CheckCircle2 size={14} className="mt-0.5 shrink-0" />
            : <AlertCircle  size={14} className="mt-0.5 shrink-0" />}
          {last.message}
        </div>
      )}

      {/* Running status */}
      {status === "running" && last && (
        <p className="text-[12px]" style={{ color: "var(--apt-text-muted)" }}>
          {last.message}
        </p>
      )}
    </div>
  );
}
