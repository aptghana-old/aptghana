"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Download, FileSpreadsheet, FileText, Table2, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface DatasetOption {
  key: string;
  label: string;
}

interface ExportMenuProps {
  /** Datasets offered by this page; first is the default. */
  datasets: DatasetOption[];
  /** Search-param keys to carry over from the current page (e.g. status, q). */
  inheritParams?: string[];
}

const FORMATS = [
  { key: "xlsx", label: "Excel (XLSX)", icon: FileSpreadsheet, desc: "Styled workbook for accounting" },
  { key: "csv", label: "CSV", icon: Table2, desc: "Raw data for any tool" },
  { key: "pdf", label: "PDF Report", icon: FileText, desc: "Branded, shareable document" },
] as const;

/** Reusable bulk-export popover: dataset + format + date range, inheriting page filters. */
export default function ExportMenu({ datasets, inheritParams = ["status", "q"] }: ExportMenuProps) {
  const params = useSearchParams();
  const [open, setOpen] = useState(false);
  const [dataset, setDataset] = useState(datasets[0].key);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  function exportAs(format: string) {
    const qs = new URLSearchParams({ dataset, format });
    if (from) qs.set("from", from);
    if (to) qs.set("to", to);
    for (const key of inheritParams) {
      const value = params.get(key);
      if (value) qs.set(key, value);
    }
    window.location.assign(`/api/exports?${qs.toString()}`);
    setOpen(false);
  }

  const inherited = inheritParams
    .map((k) => (params.get(k) ? `${k}: ${params.get(k)}` : null))
    .filter(Boolean);

  return (
    <div ref={rootRef} className="relative">
      <Button variant="secondary" size="sm" icon={<Download size={13} />} onClick={() => setOpen((v) => !v)}>
        Export
      </Button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 z-50 w-80 rounded-lg p-4 space-y-4"
          style={{
            background: "var(--apt-bg)",
            border: "1px solid var(--apt-border-strong)",
            boxShadow: "0 12px 32px rgba(0,0,0,0.18)",
          }}
          role="dialog"
          aria-label="Export data"
        >
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-semibold" style={{ color: "var(--apt-text-primary)" }}>Export data</p>
            <button onClick={() => setOpen(false)} aria-label="Close export menu"
              className="w-6 h-6 rounded flex items-center justify-center hover:bg-[var(--apt-bg-raised)]"
              style={{ color: "var(--apt-text-muted)" }}>
              <X size={13} />
            </button>
          </div>

          {datasets.length > 1 && (
            <div className="flex gap-1.5 flex-wrap">
              {datasets.map((d) => (
                <button
                  key={d.key}
                  onClick={() => setDataset(d.key)}
                  aria-pressed={dataset === d.key}
                  className="px-2.5 py-1 rounded-md text-[12px] font-medium transition-colors"
                  style={{
                    background: dataset === d.key ? "var(--apt-bg-raised)" : "transparent",
                    color: dataset === d.key ? "var(--apt-text-primary)" : "var(--apt-text-muted)",
                    border: "1px solid var(--apt-border)",
                  }}
                >
                  {d.label}
                </button>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <Input label="From" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            <Input label="To" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>

          {inherited.length > 0 && (
            <p className="text-[11px]" style={{ color: "var(--apt-text-muted)" }}>
              Includes current filters — {inherited.join(" · ")}
            </p>
          )}

          <div className="space-y-1.5">
            {FORMATS.map((f) => (
              <button
                key={f.key}
                onClick={() => exportAs(f.key)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left transition-colors hover:bg-[var(--apt-bg-raised)]"
                style={{ border: "1px solid var(--apt-border)" }}
              >
                <f.icon size={16} style={{ color: "var(--apt-text-brand)" }} />
                <span className="flex-1">
                  <span className="block text-[13px] font-semibold" style={{ color: "var(--apt-text-primary)" }}>{f.label}</span>
                  <span className="block text-[11px]" style={{ color: "var(--apt-text-muted)" }}>{f.desc}</span>
                </span>
                <Download size={12} style={{ color: "var(--apt-text-muted)" }} />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
