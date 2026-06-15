"use client";

import { useState } from "react";
import { Copy, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface Props {
  index: string;
  versionId: string;
  versionNumber: number;
}

export function DuplicateVersionButton({ index, versionId, versionNumber }: Props) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const duplicate = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/search/settings/${index}/versions/${versionId}/duplicate`,
        { method: "POST" },
      );
      if (res.ok) router.refresh();
      else alert("Failed to duplicate version. Check logs.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={duplicate}
      disabled={loading}
      title={`Duplicate v${versionNumber} as new draft`}
      className="flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[11px] font-medium border transition-colors hover:bg-[var(--apt-bg-raised)] disabled:opacity-50"
      style={{ borderColor: "var(--apt-border)", color: "var(--apt-text-secondary)" }}
    >
      {loading ? <Loader2 size={11} className="animate-spin" /> : <Copy size={11} />}
      Copy
    </button>
  );
}
