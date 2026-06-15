"use client";

import { SITE_DOMAIN, CDN_DOMAIN } from "@apt/config";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Save, CheckCircle2, Globe, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Select } from "@/components/ui/Input";

interface BrandFormData {
  name: string; slug: string; description: string;
  country: string; website: string; logoUrl: string; status: string; isFeatured: boolean;
}

interface Props { initial?: Partial<BrandFormData>; brandId?: string }

const COUNTRY_OPTIONS = [
  { value: "Ghana", label: "Ghana" },
  { value: "Germany", label: "Germany" },
  { value: "France", label: "France" },
  { value: "USA", label: "United States" },
  { value: "Japan", label: "Japan" },
  { value: "China", label: "China" },
  { value: "Italy", label: "Italy" },
  { value: "Switzerland", label: "Switzerland" },
  { value: "Sweden", label: "Sweden" },
  { value: "Other", label: "Other" },
];

function slugify(t: string) {
  return t.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").trim();
}

export default function BrandForm({ initial, brandId }: Props) {
  const router = useRouter();
  const [ , startTransition ] = useTransition();
  const [ isPending, setPending ] = useState(false);
  const [ saved, setSaved ] = useState(false);
  const [ error, setError ] = useState<string | null>(null);

  const [ form, setForm ] = useState<BrandFormData>({
    name: initial?.name ?? "",
    slug: initial?.slug ?? "",
    description: initial?.description ?? "",
    country: initial?.country ?? "",
    website: initial?.website ?? "",
    logoUrl: initial?.logoUrl ?? "",
    status: initial?.status ?? "active",
    isFeatured: initial?.isFeatured ?? false,
  });

  const set = (k: keyof BrandFormData, v: unknown) => setForm((f) => ({ ...f, [ k ]: v }));

  const handleSubmit = async () => {
    if (!form.name.trim()) { setError("Brand name is required."); return; }
    setError(null); setPending(true);
    try {
      const res = await fetch(brandId ? `/api/brands/${brandId}` : "/api/brands", {
        method: brandId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Save failed");
      setSaved(true);
      startTransition(() => { if (!brandId) router.push("/dashboard/brands"); });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally { setPending(false); }
  };

  return (
    <div className="space-y-5">
      {error && (
        <div className="px-4 py-3 rounded-lg text-[13px]" style={{ background: "#fef2f2", border: "1px solid #fca5a5", color: "#b91c1c" }}>
          {error}
        </div>
      )}

      <div className="card p-5 space-y-4">
        <h2 className="text-[14px] font-semibold" style={{ color: "var(--apt-text-primary)" }}>Brand Details</h2>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Brand Name" required value={form.name}
            onChange={(e) => { set("name", e.target.value); if (!initial?.slug) set("slug", slugify(e.target.value)); }}
            placeholder="e.g. Schneider Electric"
            wrapperClass="col-span-2"
          />
          <Input label="Slug" value={form.slug} onChange={(e) => set("slug", e.target.value)} hint="auto-generated from name" />
          <Select label="Country" value={form.country} onChange={(e) => set("country", e.target.value)} options={COUNTRY_OPTIONS} placeholder="Select country…" />
          <Input label="Website" value={form.website} onChange={(e) => set("website", e.target.value)} placeholder="https://www.brand.com" icon={<Globe size={13} />} />
          <Select
            label="Status" value={form.status} onChange={(e) => set("status", e.target.value)}
            options={[ { value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }, { value: "archived", label: "Archived" } ]}
          />
        </div>
        <Textarea label="Description" value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Brief brand description…" />
      </div>

      <div className="card p-5">
        <h2 className="text-[14px] font-semibold mb-4" style={{ color: "var(--apt-text-primary)" }}>Logo</h2>
        <Input label="Logo URL" value={form.logoUrl} onChange={(e) => set("logoUrl", e.target.value)} placeholder={`https://${CDN_DOMAIN}/brands/…`} icon={<ImageIcon size={13} />} />
        {form.logoUrl && (
          <div className="mt-3 w-20 h-20 rounded-lg border flex items-center justify-center" style={{ borderColor: "var(--apt-border)" }}>
            <img src={form.logoUrl} alt={form.name} className="w-full h-full object-contain p-2" />
          </div>
        )}
      </div>

      <div className="card p-5">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={form.isFeatured}
            onChange={(e) => set("isFeatured", e.target.checked)}
            className="w-4 h-4 rounded"
          />
          <div>
            <div className="text-[13px] font-medium" style={{ color: "var(--apt-text-primary)" }}>Featured Brand</div>
            <div className="text-[11px]" style={{ color: "var(--apt-text-muted)" }}>Highlight this brand on {SITE_DOMAIN} and in the store</div>
          </div>
        </label>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Button
          variant="primary" size="md" loading={isPending}
          icon={saved ? <CheckCircle2 size={14} /> : <Save size={14} />}
          onClick={handleSubmit}
        >
          {saved ? "Saved" : brandId ? "Save Changes" : "Create Brand"}
        </Button>
        <Button variant="secondary" size="md" onClick={() => router.back()}>Cancel</Button>
      </div>
    </div>
  );
}
