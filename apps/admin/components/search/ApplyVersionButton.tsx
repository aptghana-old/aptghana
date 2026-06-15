"use client";

import { useState } from "react";
import { Zap, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface Props {
  index: string;
  versionId: string;
}

export function ApplyVersionButton({ index, versionId }: Props) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const apply = async () => {
    if (!confirm("Apply this version to Meilisearch? The current active config will be replaced.")) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/search/settings/${index}/versions/${versionId}/apply`,
        { method: "POST" },
      );
      if (res.ok) router.refresh();
      else alert("Failed to apply version. Check logs.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={apply}
      disabled={loading}
      className="flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[11px] font-medium transition-colors disabled:opacity-50"
      style={{ background: "#0057b8", color: "#fff" }}
    >
      {loading ? <Loader2 size={11} className="animate-spin" /> : <Zap size={11} />}
      Apply
    </button>
  );
}
