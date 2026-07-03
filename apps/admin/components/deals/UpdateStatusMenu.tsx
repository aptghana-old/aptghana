"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface Props {
  /** Bulk endpoint accepting { ids, action: "set_status", status }. */
  endpoint: string;
  ids: string[];
  options: { value: string; label: string }[];
  current?: string;
}

export default function UpdateStatusMenu({ endpoint, ids, options, current }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function apply(status: string) {
    setOpen(false);
    setPending(true);
    setError(null);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, action: "set_status", status }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Update failed");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="relative">
      <Button
        variant="primary"
        size="sm"
        loading={pending}
        iconRight={<ChevronDown size={13} />}
        onClick={() => setOpen((v) => !v)}
      >
        Update Status
      </Button>
      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div
            className="absolute right-0 top-full mt-1 z-30 w-44 rounded-lg p-1.5 space-y-0.5"
            style={{ background: "var(--apt-bg)", border: "1px solid var(--apt-border-strong)", boxShadow: "0 12px 32px rgba(0,0,0,0.18)" }}
          >
            {options.map((o) => (
              <button
                key={o.value}
                onClick={() => apply(o.value)}
                disabled={o.value === current}
                className="flex items-center justify-between gap-2 w-full px-2.5 py-1.5 rounded-md text-[12.5px] text-left transition-colors hover:bg-[var(--apt-bg-raised)] disabled:cursor-default"
                style={{ color: o.value === current ? "var(--apt-text-muted)" : "var(--apt-text-primary)" }}
              >
                {o.label}
                {o.value === current && <Check size={12} />}
              </button>
            ))}
          </div>
        </>
      )}
      {error && (
        <p className="absolute right-0 top-full mt-1.5 text-[11px] whitespace-nowrap" style={{ color: "#dc2626" }} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
