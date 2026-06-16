"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Save, CheckCircle2, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Select } from "@/components/ui/Input";
import { CDN_DOMAIN } from "@apt/config";
import { slugify } from "@apt/types";

interface IndustryFormData {
  name: string;
  slug: string;
  tagline: string;
  shortDescription: string;
  challenge: string;
  solutions: string[];
  brands: string[];
  clients: string;
  icon: string;
  accentColor: string;
  imageUrl: string;
  displayOrder: number;
  isFeatured: boolean;
  status: string;
}

interface Props {
  initial?: Partial<IndustryFormData>;
  industryId?: string;
}

export default function IndustryForm({ initial, industryId }: Props) {
  const router = useRouter();
  const [ , startTransition ] = useTransition();
  const [ isPending, setPending ] = useState(false);
  const [ saved, setSaved ] = useState(false);
  const [ error, setError ] = useState<string | null>(null);

  const [ form, setForm ] = useState<IndustryFormData>({
    name: initial?.name ?? "",
    slug: initial?.slug ?? "",
    tagline: initial?.tagline ?? "",
    shortDescription: initial?.shortDescription ?? "",
    challenge: initial?.challenge ?? "",
    solutions: initial?.solutions ?? [ "" ],
    brands: initial?.brands ?? [ "" ],
    clients: initial?.clients ?? "",
    icon: initial?.icon ?? "",
    accentColor: initial?.accentColor ?? "#84CC16",
    imageUrl: initial?.imageUrl ?? "",
    displayOrder: initial?.displayOrder ?? 0,
    isFeatured: initial?.isFeatured ?? false,
    status: initial?.status ?? "active",
  });

  const set = <K extends keyof IndustryFormData>(k: K, v: IndustryFormData[ K ]) =>
    setForm((f) => ({ ...f, [ k ]: v }));

  const updateListItem = (key: "solutions" | "brands", idx: number, val: string) => {
    setForm((f) => {
      const arr = [ ...f[ key ] ];
      arr[ idx ] = val;
      return { ...f, [ key ]: arr };
    });
  };

  const addListItem = (key: "solutions" | "brands") =>
    setForm((f) => ({ ...f, [ key ]: [ ...f[ key ], "" ] }));

  const removeListItem = (key: "solutions" | "brands", idx: number) =>
    setForm((f) => ({ ...f, [ key ]: f[ key ].filter((_, i) => i !== idx) }));

  const handleSubmit = async () => {
    if (!form.name.trim()) { setError("Industry name is required."); return; }
    setError(null);
    setPending(true);
    try {
      const payload = {
        ...form,
        solutions: form.solutions.filter(Boolean),
        brands: form.brands.filter(Boolean),
      };
      const res = await fetch(industryId ? `/api/industries/${industryId}` : "/api/industries", {
        method: industryId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Save failed");
      setSaved(true);
      startTransition(() => { if (!industryId) router.push("/dashboard/industries"); });
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
        <h2 className="text-[14px] font-semibold" style={{ color: "var(--apt-text-primary)" }}>Industry Details</h2>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Name" required value={form.name} wrapperClass="col-span-2"
            onChange={(e) => { set("name", e.target.value); if (!initial?.slug) set("slug", slugify(e.target.value)); }}
            placeholder="e.g. Mining & Minerals"
          />
          <Input
            label="Slug" value={form.slug} hint="auto-generated from name"
            onChange={(e) => set("slug", e.target.value)}
          />
          <Input
            label="Icon (emoji)" value={form.icon}
            onChange={(e) => set("icon", e.target.value)}
            placeholder="⛏"
          />
          <Input
            label="Tagline" value={form.tagline} wrapperClass="col-span-2"
            onChange={(e) => set("tagline", e.target.value)}
            placeholder="e.g. Powering Ghana's Mining Industry"
          />
          <Select
            label="Status" value={form.status}
            onChange={(e) => set("status", e.target.value)}
            options={[ { value: "active", label: "Active" }, { value: "inactive", label: "Inactive" } ]}
          />
          <Input
            label="Display Order" type="number" value={String(form.displayOrder)} hint="Lower = earlier"
            onChange={(e) => set("displayOrder", parseInt(e.target.value, 10) || 0)}
          />
        </div>
        <Input
          label="Short Description" value={form.shortDescription}
          onChange={(e) => set("shortDescription", e.target.value)}
          placeholder="Brief description shown on the industries index page"
        />
        <Textarea
          label="Challenge" value={form.challenge} rows={4}
          onChange={(e) => set("challenge", e.target.value)}
          placeholder="Describe the key challenge this industry faces and how APT Ghana addresses it…"
        />
        <Input
          label="Clients / Coverage" value={form.clients}
          onChange={(e) => set("clients", e.target.value)}
          placeholder="e.g. Active in Ghana's gold, bauxite, and manganese sectors"
        />
      </div>

      {/* Solutions list */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[14px] font-semibold" style={{ color: "var(--apt-text-primary)" }}>Solutions Provided</h2>
          <Button variant="ghost" size="sm" icon={<Plus size={12} />} onClick={() => addListItem("solutions")}>Add</Button>
        </div>
        <div className="space-y-2">
          {form.solutions.map((sol, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input
                value={sol}
                onChange={(e) => updateListItem("solutions", i, e.target.value)}
                placeholder={`Solution ${i + 1}`}
                wrapperClass="flex-1"
              />
              <button
                onClick={() => removeListItem("solutions", i)}
                className="p-1.5 rounded-md hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Brands list */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[14px] font-semibold" style={{ color: "var(--apt-text-primary)" }}>Key Brands</h2>
          <Button variant="ghost" size="sm" icon={<Plus size={12} />} onClick={() => addListItem("brands")}>Add</Button>
        </div>
        <div className="space-y-2">
          {form.brands.map((brand, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input
                value={brand}
                onChange={(e) => updateListItem("brands", i, e.target.value)}
                placeholder={`Brand ${i + 1}`}
                wrapperClass="flex-1"
              />
              <button
                onClick={() => removeListItem("brands", i)}
                className="p-1.5 rounded-md hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Visual */}
      <div className="card p-5">
        <h2 className="text-[14px] font-semibold mb-4" style={{ color: "var(--apt-text-primary)" }}>Visual</h2>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Accent Colour" value={form.accentColor} type="color"
            onChange={(e) => set("accentColor", e.target.value)}
          />
          <Input
            label="Image URL" value={form.imageUrl} wrapperClass="col-span-2"
            onChange={(e) => set("imageUrl", e.target.value)}
            placeholder={`https://${CDN_DOMAIN}/industries/…`}
          />
        </div>
        {form.imageUrl && (
          <div className="mt-3 w-40 h-24 rounded-lg border overflow-hidden" style={{ borderColor: "var(--apt-border)" }}>
            <img src={form.imageUrl} alt={form.name} className="w-full h-full object-cover" />
          </div>
        )}
      </div>

      {/* Options */}
      <div className="card p-5">
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={form.isFeatured} onChange={(e) => set("isFeatured", e.target.checked)} className="w-4 h-4 rounded" />
          <div>
            <div className="text-[13px] font-medium" style={{ color: "var(--apt-text-primary)" }}>Featured Industry</div>
            <div className="text-[11px]" style={{ color: "var(--apt-text-muted)" }}>Highlight this industry on listing pages</div>
          </div>
        </label>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Button variant="primary" size="md" loading={isPending} icon={saved ? <CheckCircle2 size={14} /> : <Save size={14} />} onClick={handleSubmit}>
          {saved ? "Saved" : industryId ? "Save Changes" : "Create Industry"}
        </Button>
        <Button variant="secondary" size="md" onClick={() => router.back()}>Cancel</Button>
      </div>
    </div>
  );
}
