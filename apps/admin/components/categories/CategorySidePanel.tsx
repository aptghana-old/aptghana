"use client";

import { useEffect, useState } from "react";
import { X, FolderTree, Loader2 } from "lucide-react";
import CategoryForm, { type ParentContext, type CategoryFormData } from "./CategoryForm";

const LEVEL_LABEL: Record<string, string> = { group: "Group", category: "Category", subcategory: "Subcategory", range: "Range" };
const CHILD_LEVEL: Record<string, string> = { group: "category", category: "subcategory", subcategory: "range" };

interface Props {
  mode: "create" | "edit";
  parentContext?: ParentContext;
  categoryId?: string;
  initial?: Partial<CategoryFormData>;
  title?: string;
  onClose(): void;
  onSaved(id: string): void;
}

export default function CategorySidePanel({ mode, parentContext, categoryId, initial, title, onClose, onSaved }: Props) {
  const childLevel = parentContext ? CHILD_LEVEL[parentContext.level] : "group";
  const heading = title ?? (mode === "create" ? `Add ${LEVEL_LABEL[childLevel] ?? "Category"}` : "Edit Category");

  const [loadedInitial, setLoadedInitial] = useState<Partial<CategoryFormData> | undefined>(initial);
  const [loading, setLoading] = useState(mode === "edit" && !initial && Boolean(categoryId));

  useEffect(() => {
    if (mode !== "edit" || initial || !categoryId) return;
    let active = true;
    (async () => {
      const res = await fetch(`/api/categories/${categoryId}`);
      if (!active) return;
      if (res.ok) setLoadedInitial(await res.json());
      setLoading(false);
    })();
    return () => { active = false; };
  }, [mode, initial, categoryId]);

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      style={{ background: "var(--apt-bg-overlay)" }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-xl h-full overflow-y-auto" style={{ background: "var(--apt-bg)", borderLeft: "1px solid var(--apt-border-strong)" }}>
        <div className="flex items-center justify-between px-5 py-4 sticky top-0 z-10" style={{ borderBottom: "1px solid var(--apt-border)", background: "var(--apt-bg)" }}>
          <div className="flex items-center gap-2.5">
            <FolderTree size={15} style={{ color: "var(--apt-text-brand)" }} />
            <h2 className="text-[15px] font-semibold" style={{ color: "var(--apt-text-primary)" }}>{heading}</h2>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded flex items-center justify-center hover:bg-[var(--apt-bg-raised)]" style={{ color: "var(--apt-text-muted)" }}>
            <X size={14} />
          </button>
        </div>
        <div className="p-5">
          {loading ? (
            <div className="flex items-center justify-center py-16"><Loader2 size={20} className="animate-spin" style={{ color: "var(--apt-text-muted)" }} /></div>
          ) : (
            <CategoryForm initial={loadedInitial} categoryId={categoryId} parentContext={parentContext} onSaved={onSaved} onCancel={onClose} />
          )}
        </div>
      </div>
    </div>
  );
}
