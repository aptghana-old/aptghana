"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { X, Filter as FilterIcon, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import type { ArticleFilterOptions } from "@/lib/articleFilters";

interface FormState {
  status: string; author: string; category: string; tag: string; featured: string;
  dateField: string; preset: string; from: string; to: string;
}

function emptyState(sp: Record<string, string | undefined>): FormState {
  return {
    status: sp.status ?? "", author: sp.author ?? "", category: sp.category ?? "", tag: sp.tag ?? "",
    featured: sp.featured ?? "", dateField: sp.dateField ?? "createdAt", preset: sp.preset ?? "",
    from: sp.from ?? "", to: sp.to ?? "",
  };
}

const PRESETS = [
  { value: "", label: "Any time" },
  { value: "7d", label: "Last 7 Days" },
  { value: "30d", label: "Last 30 Days" },
  { value: "90d", label: "Last 90 Days" },
  { value: "custom", label: "Custom Range" },
];

const DATE_FIELDS = [
  { value: "createdAt", label: "Date Created" },
  { value: "updatedAt", label: "Date Updated" },
  { value: "publishDate", label: "Publish Date" },
];

interface Props {
  options: ArticleFilterOptions;
  current: Record<string, string | undefined>;
  open: boolean;
  onClose(): void;
}

export default function ArticleFilterDrawer({ options, current, open, onClose }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [form, setForm] = useState<FormState>(() => emptyState(current));

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => ({ ...f, [k]: v }));

  function apply() {
    const qs = new URLSearchParams();
    if (current.q) qs.set("q", current.q);
    for (const [k, v] of Object.entries(form)) if (v) qs.set(k, v);
    router.push(`${pathname}?${qs.toString()}`);
    onClose();
  }

  function reset() {
    setForm(emptyState({}));
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" style={{ background: "var(--apt-bg-overlay)" }} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-md h-full overflow-y-auto" style={{ background: "var(--apt-bg)", borderLeft: "1px solid var(--apt-border-strong)" }}>
        <div className="flex items-center justify-between px-5 py-4 sticky top-0 z-10" style={{ borderBottom: "1px solid var(--apt-border)", background: "var(--apt-bg)" }}>
          <div className="flex items-center gap-2.5">
            <FilterIcon size={15} style={{ color: "var(--apt-text-brand)" }} />
            <h2 className="text-[15px] font-semibold" style={{ color: "var(--apt-text-primary)" }}>Filters</h2>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded flex items-center justify-center hover:bg-[var(--apt-bg-raised)]" style={{ color: "var(--apt-text-muted)" }}><X size={14} /></button>
        </div>

        <div className="p-5 space-y-5">
          <Select label="Status" placeholder="Any status" options={options.statuses.map((s) => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))} value={form.status} onChange={(e) => set("status", e.target.value)} />
          <Select label="Author" placeholder="Any author" options={options.authors} value={form.author} onChange={(e) => set("author", e.target.value)} />
          <Select label="Category" placeholder="Any category" options={options.categories} value={form.category} onChange={(e) => set("category", e.target.value)} />
          <Select label="Tag" placeholder="Any tag" options={options.tags} value={form.tag} onChange={(e) => set("tag", e.target.value)} />
          <Select label="Featured" placeholder="Any" options={[{ value: "1", label: "Featured only" }, { value: "0", label: "Not featured" }]} value={form.featured} onChange={(e) => set("featured", e.target.value)} />

          <div>
            <label className="text-[12px] font-medium block mb-1.5" style={{ color: "var(--apt-text-primary)" }}>Date Filter</label>
            <div className="grid grid-cols-2 gap-2">
              <Select options={DATE_FIELDS} value={form.dateField} onChange={(e) => set("dateField", e.target.value)} />
              <Select options={PRESETS} value={form.preset} onChange={(e) => set("preset", e.target.value)} />
            </div>
            {form.preset === "custom" && (
              <div className="grid grid-cols-2 gap-2 mt-2">
                <Input type="date" label="From" value={form.from} onChange={(e) => set("from", e.target.value)} />
                <Input type="date" label="To" value={form.to} onChange={(e) => set("to", e.target.value)} />
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 px-5 py-4 sticky bottom-0" style={{ borderTop: "1px solid var(--apt-border)", background: "var(--apt-bg)" }}>
          <Button variant="primary" size="md" onClick={apply} className="flex-1">Apply Filters</Button>
          <Button variant="secondary" size="md" icon={<RotateCcw size={13} />} onClick={reset}>Reset</Button>
        </div>
      </div>
    </div>
  );
}
