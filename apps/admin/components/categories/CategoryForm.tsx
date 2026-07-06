"use client";

import { CDN_DOMAIN } from "@apt/config";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Save, CheckCircle2, Plus, X, FolderTree } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Select } from "@/components/ui/Input";
import { slugify } from "@apt/types";

export interface Benefit { title: string; value: string }
export interface CategoryDocument { type: string; title: string; url: string; language: string }

export interface CategoryFormData {
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  level: string;
  status: string;
  isFeatured: boolean;
  displayOrder: number;
  imageUrl: string;
  icon: string;
  documents: CategoryDocument[];
  benefits: Benefit[];
  bulletPoints: string[];
  products: string[];
  brands: string[];
  applications: string[];
  seoTitle: string;
  seoDescription: string;
}

/** Where a new category will be created — locks `level` and shows the resulting path. */
export interface ParentContext {
  id: string;
  name: string;
  level: string;
  path: string;
}

interface Props {
  initial?: Partial<CategoryFormData>;
  categoryId?: string;
  /** Present only when creating a child from the tree — locks the level and parent. */
  parentContext?: ParentContext;
  onSaved?: (id: string) => void;
  onCancel?: () => void;
}

const CHILD_LEVEL: Record<string, string> = { group: "category", category: "subcategory", subcategory: "range", range: "" };
const LEVEL_LABEL: Record<string, string> = { group: "Group", category: "Category", subcategory: "Subcategory", range: "Range" };

export function emptyCategoryForm(): CategoryFormData {
  return {
    name: "", slug: "", shortDescription: "", description: "",
    level: "group", status: "active", isFeatured: false, displayOrder: 0,
    imageUrl: "", icon: "", documents: [], benefits: [], bulletPoints: [],
    products: [], brands: [], applications: [], seoTitle: "", seoDescription: "",
  };
}

function StringListEditor({
  label, items, placeholder, onChange,
}: { label: string; items: string[]; placeholder: string; onChange: (items: string[]) => void }) {
  const update = (idx: number, val: string) => { const next = [ ...items ]; next[ idx ] = val; onChange(next); };
  const remove = (idx: number) => onChange(items.filter((_, i) => i !== idx));
  const add = () => onChange([ ...items, "" ]);

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[14px] font-semibold" style={{ color: "var(--apt-text-primary)" }}>{label}</h2>
        <Button variant="ghost" size="sm" icon={<Plus size={12} />} onClick={add}>Add</Button>
      </div>
      {items.length === 0 && <p className="text-[12px]" style={{ color: "var(--apt-text-muted)" }}>No items yet. Click Add to get started.</p>}
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <Input value={item} onChange={(e) => update(i, e.target.value)} placeholder={`${placeholder} ${i + 1}`} wrapperClass="flex-1" />
            <button onClick={() => remove(i)} className="p-1.5 rounded-md hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors shrink-0"><X size={14} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}

function BenefitsEditor({ benefits, onChange }: { benefits: Benefit[]; onChange: (b: Benefit[]) => void }) {
  const update = (idx: number, key: keyof Benefit, val: string) => onChange(benefits.map((b, i) => i === idx ? { ...b, [ key ]: val } : b));
  const remove = (idx: number) => onChange(benefits.filter((_, i) => i !== idx));
  const add = () => onChange([ ...benefits, { title: "", value: "" } ]);

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[14px] font-semibold" style={{ color: "var(--apt-text-primary)" }}>Benefits</h2>
        <Button variant="ghost" size="sm" icon={<Plus size={12} />} onClick={add}>Add Benefit</Button>
      </div>
      {benefits.length === 0 && <p className="text-[12px]" style={{ color: "var(--apt-text-muted)" }}>No benefits yet. Click Add Benefit to get started.</p>}
      <div className="space-y-4">
        {benefits.map((b, i) => (
          <div key={i} className="rounded-lg p-4 space-y-3" style={{ background: "var(--apt-bg-raised)", border: "1px solid var(--apt-border)" }}>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--apt-text-muted)" }}>Benefit {i + 1}</span>
              <button onClick={() => remove(i)} className="p-1 rounded hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors"><X size={13} /></button>
            </div>
            <Input label="Title" value={b.title} onChange={(e) => update(i, "title", e.target.value)} placeholder="e.g. Reduced Downtime" />
            <Textarea label="Description" value={b.value} onChange={(e) => update(i, "value", e.target.value)} placeholder="Explain this benefit in 1-2 sentences…" rows={2} />
          </div>
        ))}
      </div>
    </div>
  );
}

const DOC_TYPE_OPTIONS = [
  { value: "datasheet", label: "Datasheet" },
  { value: "manual", label: "Manual" },
  { value: "drawing", label: "Drawing" },
  { value: "certificate", label: "Certificate" },
  { value: "compliance", label: "Compliance" },
  { value: "other", label: "Other" },
];

function DocumentsEditor({ documents, onChange }: { documents: CategoryDocument[]; onChange: (d: CategoryDocument[]) => void }) {
  const update = (idx: number, key: keyof CategoryDocument, val: string) => onChange(documents.map((d, i) => i === idx ? { ...d, [ key ]: val } : d));
  const remove = (idx: number) => onChange(documents.filter((_, i) => i !== idx));
  const add = () => onChange([ ...documents, { type: "other", title: "", url: "", language: "en" } ]);

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[14px] font-semibold" style={{ color: "var(--apt-text-primary)" }}>Documents</h2>
        <Button variant="ghost" size="sm" icon={<Plus size={12} />} onClick={add}>Add Document</Button>
      </div>
      {documents.length === 0 && <p className="text-[12px]" style={{ color: "var(--apt-text-muted)" }}>No documents yet.</p>}
      <div className="space-y-3">
        {documents.map((doc, i) => (
          <div key={i} className="rounded-lg p-4 space-y-2.5" style={{ background: "var(--apt-bg-raised)", border: "1px solid var(--apt-border)" }}>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--apt-text-muted)" }}>Document {i + 1}</span>
              <button onClick={() => remove(i)} className="p-1 rounded hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors"><X size={13} /></button>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <Input label="Title" value={doc.title} onChange={(e) => update(i, "title", e.target.value)} />
              <Select label="Type" value={doc.type} onChange={(e) => update(i, "type", e.target.value)} options={DOC_TYPE_OPTIONS} />
            </div>
            <Input label="URL" value={doc.url} onChange={(e) => update(i, "url", e.target.value)} placeholder="https://…" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Pure, controlled field set — shared by the full-page form and the tree side panel. */
export function CategoryFormFields({
  form, set, parentContext, autoSlug = true,
}: {
  form: CategoryFormData;
  set: <K extends keyof CategoryFormData>(k: K, v: CategoryFormData[ K ]) => void;
  parentContext?: ParentContext;
  /** Re-derive the slug from the name as the user types (only meaningful while creating). */
  autoSlug?: boolean;
}) {
  const isGroup = form.level === "group";

  return (
    <div className="space-y-5">
      {parentContext && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-[12px]" style={{ background: "var(--apt-bg-subtle)", color: "var(--apt-text-secondary)" }}>
          <FolderTree size={13} style={{ color: "var(--apt-text-muted)" }} />
          New <strong style={{ color: "var(--apt-text-primary)" }}>{LEVEL_LABEL[ form.level ] ?? form.level}</strong> under {parentContext.path}
        </div>
      )}

      <div className="card p-5 space-y-4">
        <h2 className="text-[14px] font-semibold" style={{ color: "var(--apt-text-primary)" }}>Category Details</h2>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Name" required value={form.name} wrapperClass="col-span-2"
            onChange={(e) => { set("name", e.target.value); if (autoSlug) set("slug", slugify(e.target.value)); }}
            placeholder="e.g. Electrical Solutions"
          />
          <Input label="Slug" value={form.slug} hint="auto-generated from name" onChange={(e) => set("slug", e.target.value)} />
          <Input
            label="Level"
            value={LEVEL_LABEL[ form.level ] ?? form.level}
            disabled
            hint={parentContext ? "Derived from parent — move in the tree to change" : autoSlug ? "New top-level entries are always Groups" : "Move this category in the tree to change its level"}
          />
          <Select label="Status" value={form.status} onChange={(e) => set("status", e.target.value)} options={[ { value: "active", label: "Active" }, { value: "inactive", label: "Inactive" } ]} />
          <Input label="Display Order" type="number" value={String(form.displayOrder)} onChange={(e) => set("displayOrder", parseInt(e.target.value, 10) || 0)} hint="Lower = earlier in lists" />
        </div>
        <Input
          label={isGroup ? "Tagline" : "Short Description"}
          value={form.shortDescription}
          onChange={(e) => set("shortDescription", e.target.value)}
          placeholder={isGroup ? "e.g. LV/MV Distribution & Protection" : "Brief description shown in navigation"}
        />
        <Textarea label="Full Description" value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Longer description for SEO and landing pages…" rows={4} />
      </div>

      <div className="card p-5 space-y-4">
        <h2 className="text-[14px] font-semibold" style={{ color: "var(--apt-text-primary)" }}>Image &amp; Icon</h2>
        <Input label="Image URL" value={form.imageUrl} onChange={(e) => set("imageUrl", e.target.value)} placeholder={`https://${CDN_DOMAIN}/categories/…`} />
        {form.imageUrl && (
          <div className="w-32 h-20 rounded-lg border overflow-hidden" style={{ borderColor: "var(--apt-border)" }}>
            <img src={form.imageUrl} alt={form.name} className="w-full h-full object-cover" />
          </div>
        )}
        <Input label="Icon" value={form.icon} onChange={(e) => set("icon", e.target.value)} placeholder="lucide icon name or URL" />
      </div>

      <DocumentsEditor documents={form.documents} onChange={(d) => set("documents", d)} />

      {isGroup && (
        <>
          <BenefitsEditor benefits={form.benefits} onChange={(b) => set("benefits", b)} />
          <StringListEditor label="Products & Components" items={form.products} placeholder="Product" onChange={(items) => set("products", items)} />
          <StringListEditor label="Brand Partners" items={form.brands} placeholder="Brand" onChange={(items) => set("brands", items)} />
          <StringListEditor label="Applications" items={form.applications} placeholder="Application" onChange={(items) => set("applications", items)} />
        </>
      )}

      <StringListEditor label="Why APT Ghana (Bullet Points)" items={form.bulletPoints} placeholder="Point" onChange={(items) => set("bulletPoints", items)} />

      <div className="card p-5 space-y-4">
        <h2 className="text-[14px] font-semibold" style={{ color: "var(--apt-text-primary)" }}>SEO</h2>
        <Input label="Meta Title" value={form.seoTitle} onChange={(e) => set("seoTitle", e.target.value)} placeholder={form.name || "Category name"} />
        <Textarea label="Meta Description" value={form.seoDescription} onChange={(e) => set("seoDescription", e.target.value)} rows={2} />
      </div>

      <div className="card p-5">
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={form.isFeatured} onChange={(e) => set("isFeatured", e.target.checked)} className="w-4 h-4 rounded" />
          <div>
            <div className="text-[13px] font-medium" style={{ color: "var(--apt-text-primary)" }}>Featured</div>
            <div className="text-[11px]" style={{ color: "var(--apt-text-muted)" }}>Highlight this category on listing pages</div>
          </div>
        </label>
      </div>
    </div>
  );
}

/** Full-page wrapper used by /dashboard/categories/new and /[id]/edit. */
export default function CategoryForm({ initial, categoryId, parentContext, onSaved, onCancel }: Props) {
  const router = useRouter();
  const [ , startTransition ] = useTransition();
  const [ isPending, setPending ] = useState(false);
  const [ saved, setSaved ] = useState(false);
  const [ error, setError ] = useState<string | null>(null);

  const [ form, setForm ] = useState<CategoryFormData>({
    ...emptyCategoryForm(),
    ...initial,
    level: parentContext ? CHILD_LEVEL[ parentContext.level ] : (initial?.level ?? "group"),
  });

  const set = <K extends keyof CategoryFormData>(k: K, v: CategoryFormData[ K ]) => setForm((f) => ({ ...f, [ k ]: v }));

  const handleSubmit = async () => {
    if (!form.name.trim()) { setError("Category name is required."); return; }
    setError(null);
    setPending(true);
    try {
      const payload = {
        ...form,
        parentId: parentContext?.id,
        bulletPoints: form.bulletPoints.filter(Boolean),
        products: form.products.filter(Boolean),
        brands: form.brands.filter(Boolean),
        applications: form.applications.filter(Boolean),
        benefits: form.benefits.filter((b) => b.title.trim()),
        documents: form.documents.filter((d) => d.title.trim() && d.url.trim()),
      };
      const res = await fetch(categoryId ? `/api/categories/${categoryId}` : "/api/categories", {
        method: categoryId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Save failed");
      setSaved(true);
      if (onSaved) onSaved(json.id ?? categoryId ?? "");
      else startTransition(() => { if (!categoryId) router.push("/dashboard/categories"); });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="space-y-5">
      {error && (
        <div className="px-4 py-3 rounded-lg text-[13px]" style={{ background: "#fef2f2", border: "1px solid #fca5a5", color: "#b91c1c" }}>{error}</div>
      )}

      <CategoryFormFields form={form} set={set} parentContext={parentContext} autoSlug={!categoryId} />

      <div className="flex items-center gap-3 pt-2">
        <Button variant="primary" size="md" loading={isPending} icon={saved ? <CheckCircle2 size={14} /> : <Save size={14} />} onClick={handleSubmit}>
          {saved ? "Saved" : categoryId ? "Save Changes" : "Create Category"}
        </Button>
        <Button variant="secondary" size="md" onClick={() => (onCancel ? onCancel() : router.back())}>Cancel</Button>
      </div>
    </div>
  );
}
