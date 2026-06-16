"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Input";

interface Props {
  selectedIds: string[];
  statusOptions: { value: string; label: string }[];
  bulkEndpoint: string;
  onClear(): void;
}

export default function DealBulkBar({ selectedIds, statusOptions, bulkEndpoint, onClear }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  async function applyStatus(value: string) {
    setStatus(value);
    setBusy(true);
    try {
      await fetch(bulkEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds, action: "set_status", status: value }),
      });
      onClear();
      router.refresh();
    } finally {
      setBusy(false);
      setStatus("");
    }
  }

  if (selectedIds.length === 0) {
    return <span className="text-[12px]" style={{ color: "var(--apt-text-muted)" }}>Select rows for bulk actions</span>;
  }

  return (
    <div className="flex items-center gap-2.5">
      <span className="text-[12.5px] font-semibold" style={{ color: "var(--apt-text-primary)" }}>{selectedIds.length} selected</span>
      <Select placeholder="Set status…" options={statusOptions} value={status} onChange={(e) => applyStatus(e.target.value)} className="!h-8 w-40" disabled={busy} />
      {busy && <Loader2 size={13} className="animate-spin" style={{ color: "var(--apt-text-muted)" }} />}
      <Button variant="ghost" size="sm" onClick={onClear}>Clear</Button>
    </div>
  );
}
