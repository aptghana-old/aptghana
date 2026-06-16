"use client";

import { useState } from "react";
import { X, Loader2, FolderTree } from "lucide-react";
import { Button } from "@/components/ui/Button";
import CategoryPicker, { type CategoryNode } from "./CategoryPicker";

interface Props {
  /** Single-product move. */
  productId?: string;
  /** Bulk move across multiple products. */
  productIds?: string[];
  currentCategoryId?: string | null;
  onClose(): void;
  onMoved(): void;
}

export default function CategoryMoveModal({ productId, productIds, currentCategoryId, onClose, onMoved }: Props) {
  const [leafId, setLeafId] = useState<string | null>(currentCategoryId ?? null);
  const [chain, setChain] = useState<CategoryNode[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isBulk = Boolean(productIds?.length);
  const count = productIds?.length ?? 0;

  async function confirm() {
    if (!leafId) {
      setError("Select at least a Group before moving.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const url = isBulk ? "/api/products/bulk/category" : `/api/products/${productId}/category`;
      const body = isBulk ? { ids: productIds, categoryId: leafId } : { categoryId: leafId };
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Move failed");
        return;
      }
      onMoved();
      onClose();
    } catch {
      setError("Move failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "var(--apt-bg-overlay)" }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-lg rounded-xl overflow-hidden"
        style={{ background: "var(--apt-bg)", border: "1px solid var(--apt-border-strong)", boxShadow: "0 20px 50px rgba(0,0,0,0.25)" }}
        role="dialog"
        aria-label="Move to catalogue location"
      >
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--apt-border)" }}>
          <div className="flex items-center gap-2.5">
            <FolderTree size={15} style={{ color: "var(--apt-text-brand)" }} />
            <div>
              <p className="text-[14px] font-semibold" style={{ color: "var(--apt-text-primary)" }}>
                {isBulk ? `Move ${count} product${count !== 1 ? "s" : ""}` : "Move product"}
              </p>
              <p className="text-[11px]" style={{ color: "var(--apt-text-muted)" }}>Choose the new catalogue location</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded flex items-center justify-center hover:bg-[var(--apt-bg-raised)]" style={{ color: "var(--apt-text-muted)" }}>
            <X size={14} />
          </button>
        </div>

        <div className="p-5">
          <CategoryPicker value={isBulk ? null : currentCategoryId} onChange={(id, c) => { setLeafId(id); setChain(c); }} />
          {error && <p className="text-[12px] text-[#dc2626] mt-3">{error}</p>}
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-4" style={{ borderTop: "1px solid var(--apt-border)" }}>
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button
            variant="primary" size="sm" onClick={confirm} disabled={saving || !leafId}
            icon={saving ? <Loader2 size={13} className="animate-spin" /> : undefined}
          >
            {saving ? "Moving…" : `Move to ${chain[chain.length - 1]?.name ?? "…"}`}
          </Button>
        </div>
      </div>
    </div>
  );
}
