"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function SynonymApproveButton({ term, synonym }: { term: string; synonym: string }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function approve() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/search/synonyms/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ term, synonym }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setError(json.error ?? "Failed to apply synonym");
        return;
      }
      setDone(true);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  if (done) {
    return <span className="inline-flex items-center gap-1 text-[12px]" style={{ color: "#15803d" }}><Check size={13} /> Applied</span>;
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="secondary" size="xs" onClick={approve} disabled={saving} icon={saving ? <Loader2 size={12} className="animate-spin" /> : undefined}>
        {saving ? "Applying…" : "Approve"}
      </Button>
      {error && <span className="text-[11px] text-[#dc2626]">{error}</span>}
    </div>
  );
}
