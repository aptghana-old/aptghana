"use client";

import { useRef, useState } from "react";
import { Download, Upload, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { MeiliSettings } from "@apt/types";

interface ImportExportBarProps {
  index: string;
  versionId?: string;
  onImported: (settings: MeiliSettings, note: string) => void;
}

export function ImportExportBar({ index, versionId, onImported }: ImportExportBarProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [msg, setMsg]       = useState("");

  const handleExport = async () => {
    const url = versionId
      ? `/api/search/settings/${index}/export?versionId=${versionId}`
      : `/api/search/settings/${index}/export`;
    const res = await fetch(url);
    if (!res.ok) { setStatus("error"); setMsg("Export failed"); return; }
    const blob     = await res.blob();
    const anchor   = document.createElement("a");
    anchor.href    = URL.createObjectURL(blob);
    anchor.download = `search-config-${index}.json`;
    anchor.click();
    URL.revokeObjectURL(anchor.href);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatus("loading"); setMsg("");

    try {
      const text = await file.text();
      const json = JSON.parse(text);

      // Accept both bare settings and full export blobs
      const settings: MeiliSettings = json.settings ?? json;
      const note = json.note
        ? `Imported: ${json.note}`
        : `Imported from ${file.name}`;

      // Validate minimal structure
      if (!settings.searchableAttributes || !settings.filterableAttributes) {
        throw new Error("File does not look like a valid search config export");
      }

      onImported(settings, note);
      setStatus("ok");
      setMsg("Configuration loaded into editor — review and apply when ready.");
    } catch (err) {
      setStatus("error");
      setMsg(String(err));
    } finally {
      e.target.value = "";
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          icon={<Download size={12} />}
          onClick={handleExport}
        >
          Export JSON
        </Button>

        <input
          ref={fileRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={handleFileChange}
        />
        <Button
          variant="secondary"
          size="sm"
          icon={status === "loading" ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
          onClick={() => fileRef.current?.click()}
          disabled={status === "loading"}
        >
          Import JSON
        </Button>
      </div>

      {status !== "idle" && status !== "loading" && (
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-[12px]"
          style={{
            background: status === "ok" ? "#f0fdf4" : "#fef2f2",
            color:      status === "ok" ? "#166534" : "#991b1b",
          }}
        >
          {status === "ok"
            ? <CheckCircle2 size={13} className="shrink-0" />
            : <AlertCircle  size={13} className="shrink-0" />}
          {msg}
        </div>
      )}
    </div>
  );
}
