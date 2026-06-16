"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function NewArticleForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create() {
    if (!title.trim()) { setError("Title is required"); return; }
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? "Failed to create article"); return; }
      router.push(`/dashboard/articles/${json.id}`);
    } catch {
      setError("Failed to create article");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="card p-6 max-w-lg space-y-4">
      <Input label="Title" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. How to Select the Right VFD for Your Application" />
      {error && <p className="text-[12px] text-[#dc2626]">{error}</p>}
      <Button variant="primary" size="md" icon={creating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} onClick={create} disabled={creating}>
        {creating ? "Creating…" : "Create Draft"}
      </Button>
      <p className="text-[11px]" style={{ color: "var(--apt-text-muted)" }}>You&apos;ll continue writing on the full article editor — content, media, SEO, and publishing all live there.</p>
    </div>
  );
}
