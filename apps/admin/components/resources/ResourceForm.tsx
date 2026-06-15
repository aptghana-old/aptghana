"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Save, CheckCircle2, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Select } from "@/components/ui/Input";

interface ResourceItem {
  title: string;
  description: string;
  meta: string;
  downloadUrl: string;
  externalUrl: string;
  tags: string;
}

interface ResourceFormData {
  title: string;
  slug: string;
  type: string;
  tagline: string;
  intro: string;
  badge: string;
  items: ResourceItem[];
  ctaLabel: string;
  ctaHref: string;
  displayOrder: number;
  isFeatured: boolean;
  status: string;
}

interface Props {
  initial?: Partial<ResourceFormData & { items: ResourceItem[] }>;
  resourceId?: string;
}

function slugify(t: string) {
  return t.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").trim();
}

const TYPE_OPTIONS = [
  { value: "library",        label: "Technical Library" },
  { value: "case-studies",   label: "Case Studies" },
  { value: "news",           label: "News & Insights" },
  { value: "training",       label: "Product Training" },
  { value: "cad",            label: "CAD Downloads" },
  { value: "projects",       label: "Project Gallery" },
  { value: "certifications", label: "Certifications" },
  { value: "other",          label: "Other" },
];

const emptyItem = (): ResourceItem => ({ title: "", description: "", meta: "", downloadUrl: "", externalUrl: "", tags: "" });

export default function ResourceForm({ initial, resourceId }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [isPending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedItem, setExpandedItem] = useState<number | null>(null);

  const [form, setForm] = useState<ResourceFormData>({
    title: initial?.title ?? "",
    slug: initial?.slug ?? "",
    type: initial?.type ?? "other",
    tagline: initial?.tagline ?? "",
    intro: initial?.intro ?? "",
    badge: initial?.badge ?? "",
    items: initial?.items ?? [emptyItem()],
    ctaLabel: initial?.ctaLabel ?? "Get in Touch",
    ctaHref: initial?.ctaHref ?? "/contact",
    displayOrder: initial?.displayOrder ?? 0,
    isFeatured: initial?.isFeatured ?? false,
    status: initial?.status ?? "active",
  });

  const set = <K extends keyof ResourceFormData>(k: K, v: ResourceFormData[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const updateItem = (idx: number, field: keyof ResourceItem, val: string) =>
    setForm((f) => {
      const items = [...f.items];
      items[idx] = { ...items[idx], [field]: val };
      return { ...f, items };
    });

  const addItem = () =>
    setForm((f) => ({ ...f, items: [...f.items, emptyItem()] }));

  const removeItem = (idx: number) =>
    setForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));

  const handleSubmit = async () => {
    if (!form.title.trim()) { setError("Title is required."); return; }
    setError(null);
    setPending(true);
    try {
      const payload = {
        ...form,
        items: form.items
          .filter((item) => item.title.trim())
          .map((item) => ({
            ...item,
            tags: item.tags ? item.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
          })),
      };
      const res = await fetch(resourceId ? `/api/resources/${resourceId}` : "/api/resources", {
        method: resourceId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Save failed");
      setSaved(true);
      startTransition(() => { if (!resourceId) router.push("/dashboard/resources"); });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="space-y-5">
      {error && (
        <div className="px-4 py-3 rounded-lg text-[13px]" style={{ background: "#fef2f2", border: "1px solid #fca5a5", color: "#b91c1c" }}>
          {error}
        </div>
      )}

      {/* Core info */}
      <div className="card p-5 space-y-4">
        <h2 className="text-[14px] font-semibold" style={{ color: "var(--apt-text-primary)" }}>Resource Page Details</h2>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Title" required value={form.title} wrapperClass="col-span-2"
            onChange={(e) => { set("title", e.target.value); if (!initial?.slug) set("slug", slugify(e.target.value)); }}
            placeholder="e.g. Technical Library"
          />
          <Input
            label="Slug" value={form.slug} hint="auto-generated from title"
            onChange={(e) => set("slug", e.target.value)}
          />
          <Select
            label="Type" value={form.type}
            onChange={(e) => set("type", e.target.value)}
            options={TYPE_OPTIONS}
          />
          <Input
            label="Tagline" value={form.tagline} wrapperClass="col-span-2"
            onChange={(e) => set("tagline", e.target.value)}
            placeholder="e.g. Datasheets, Manuals & Engineering Drawings"
          />
          <Input
            label="Badge Label" value={form.badge}
            onChange={(e) => set("badge", e.target.value)}
            placeholder="e.g. Datasheets & Manuals"
          />
          <Select
            label="Status" value={form.status}
            onChange={(e) => set("status", e.target.value)}
            options={[{ value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }]}
          />
          <Input
            label="Display Order" type="number" value={String(form.displayOrder)} hint="Lower = earlier"
            onChange={(e) => set("displayOrder", parseInt(e.target.value, 10) || 0)}
          />
        </div>
        <Textarea
          label="Introduction" value={form.intro} rows={4}
          onChange={(e) => set("intro", e.target.value)}
          placeholder="Introductory paragraph shown at the top of the resource page…"
        />
      </div>

      {/* CTA */}
      <div className="card p-5">
        <h2 className="text-[14px] font-semibold mb-4" style={{ color: "var(--apt-text-primary)" }}>Call to Action</h2>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Button Label" value={form.ctaLabel} onChange={(e) => set("ctaLabel", e.target.value)} />
          <Input label="Button URL" value={form.ctaHref} onChange={(e) => set("ctaHref", e.target.value)} placeholder="/contact" />
        </div>
      </div>

      {/* Items */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[14px] font-semibold" style={{ color: "var(--apt-text-primary)" }}>Items ({form.items.length})</h2>
          <Button variant="ghost" size="sm" icon={<Plus size={12} />} onClick={addItem}>Add Item</Button>
        </div>
        <div className="space-y-3">
          {form.items.map((item, i) => (
            <div key={i} className="border rounded-lg overflow-hidden" style={{ borderColor: "var(--apt-border)" }}>
              <button
                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-[var(--apt-bg-raised)] transition-colors"
                onClick={() => setExpandedItem(expandedItem === i ? null : i)}
              >
                <span className="text-[13px] font-medium truncate" style={{ color: "var(--apt-text-primary)" }}>
                  {item.title || `Item ${i + 1}`}
                </span>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); removeItem(i); }}
                    className="p-1 rounded hover:bg-red-50 text-red-400 hover:text-red-600"
                  >
                    <X size={13} />
                  </button>
                </div>
              </button>
              {expandedItem === i && (
                <div className="px-4 pb-4 pt-2 space-y-3 border-t" style={{ borderColor: "var(--apt-border)" }}>
                  <Input label="Title" value={item.title} onChange={(e) => updateItem(i, "title", e.target.value)} placeholder="Item title" />
                  <Textarea label="Description" value={item.description} rows={3} onChange={(e) => updateItem(i, "description", e.target.value)} placeholder="Item description…" />
                  <Input label="Meta" value={item.meta} onChange={(e) => updateItem(i, "meta", e.target.value)} placeholder="e.g. PDF · 4.2 MB · Updated Q1 2024" />
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="Download URL" value={item.downloadUrl} onChange={(e) => updateItem(i, "downloadUrl", e.target.value)} placeholder="https://cdn…/file.pdf" />
                    <Input label="External URL" value={item.externalUrl} onChange={(e) => updateItem(i, "externalUrl", e.target.value)} placeholder="https://…" />
                  </div>
                  <Input label="Tags (comma-separated)" value={item.tags} onChange={(e) => updateItem(i, "tags", e.target.value)} placeholder="WEG, Motors, IE3" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Options */}
      <div className="card p-5">
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={form.isFeatured} onChange={(e) => set("isFeatured", e.target.checked)} className="w-4 h-4 rounded" />
          <div>
            <div className="text-[13px] font-medium" style={{ color: "var(--apt-text-primary)" }}>Featured Resource</div>
            <div className="text-[11px]" style={{ color: "var(--apt-text-muted)" }}>Highlight this resource on listing pages</div>
          </div>
        </label>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Button variant="primary" size="md" loading={isPending} icon={saved ? <CheckCircle2 size={14} /> : <Save size={14} />} onClick={handleSubmit}>
          {saved ? "Saved" : resourceId ? "Save Changes" : "Create Resource"}
        </Button>
        <Button variant="secondary" size="md" onClick={() => router.back()}>Cancel</Button>
      </div>
    </div>
  );
}
