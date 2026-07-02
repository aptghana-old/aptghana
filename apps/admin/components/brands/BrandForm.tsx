"use client";

import { SITE_DOMAIN, CDN_DOMAIN } from "@apt/config";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Save, CheckCircle2, Globe, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Select } from "@/components/ui/Input";
import { slugify } from "@apt/types";
import { brandTint, brandInitials } from "@/lib/brandTints";

interface BrandFormData {
  name: string; slug: string; description: string; shortDescription: string;
  country: string; website: string; logoUrl: string; status: string;
  isFeatured: boolean; isPartner: boolean;
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

function Toggle({ checked, onChange, title, hint }: { checked: boolean; onChange: (v: boolean) => void; title: string; hint: string }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer select-none">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className="relative w-[38px] h-[22px] rounded-full shrink-0 transition-colors"
        style={{ background: checked ? "#12B76A" : "var(--apt-bg-raised)" }}
      >
        <span
          className="absolute top-[2px] w-[18px] h-[18px] rounded-full bg-white shadow-sm transition-all"
          style={{ left: checked ? 18 : 2 }}
        />
      </button>
      <div>
        <div className="text-[13px] font-medium" style={{ color: "var(--apt-text-primary)" }}>{title}</div>
        <div className="text-[11px]" style={{ color: "var(--apt-text-muted)" }}>{hint}</div>
      </div>
    </label>
  );
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
    shortDescription: initial?.shortDescription ?? "",
    country: initial?.country ?? "",
    website: initial?.website ?? "",
    logoUrl: initial?.logoUrl ?? "",
    status: initial?.status ?? "active",
    isFeatured: initial?.isFeatured ?? false,
    isPartner: initial?.isPartner ?? false,
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

  const tint = brandTint(form.name || "Brand");

  return (
    <div className="space-y-4">
      {error && (
        <div className="px-4 py-3 rounded-lg text-[13px]" style={{ background: "#fef2f2", border: "1px solid #fca5a5", color: "#b91c1c" }}>
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 items-start">
        {/* Main column */}
        <div className="xl:col-span-2 space-y-4">
          <div className="card overflow-hidden">
            <div className="card-header">
              <h2 className="text-[14px] font-semibold" style={{ color: "var(--apt-text-primary)" }}>Brand Details</h2>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Brand Name" required value={form.name}
                  onChange={(e) => { set("name", e.target.value); if (!initial?.slug) set("slug", slugify(e.target.value)); }}
                  placeholder="e.g. Schneider Electric"
                  wrapperClass="sm:col-span-2"
                />
                <Input label="Slug" value={form.slug} onChange={(e) => set("slug", e.target.value)} hint={`${SITE_DOMAIN}/brands/${form.slug || "…"}`} />
                <Select label="Country" value={form.country} onChange={(e) => set("country", e.target.value)} options={COUNTRY_OPTIONS} placeholder="Select country…" />
                <Input label="Website" value={form.website} onChange={(e) => set("website", e.target.value)} placeholder="https://www.brand.com" icon={<Globe size={13} />} />
                <Select
                  label="Status" value={form.status} onChange={(e) => set("status", e.target.value)}
                  options={[ { value: "active", label: "Active" }, { value: "inactive", label: "Inactive" } ]}
                />
              </div>
              <Input
                label="Short Description" value={form.shortDescription}
                onChange={(e) => set("shortDescription", e.target.value)}
                placeholder="One-line summary shown on the brand page hero"
              />
              <Textarea label="Description" value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Brief brand description…" />
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="card-header">
              <h2 className="text-[14px] font-semibold" style={{ color: "var(--apt-text-primary)" }}>Logo</h2>
            </div>
            <div className="p-5">
              <Input label="Logo URL" value={form.logoUrl} onChange={(e) => set("logoUrl", e.target.value)} placeholder={`https://${CDN_DOMAIN}/brands/…`} icon={<ImageIcon size={13} />} />
            </div>
          </div>
        </div>

        {/* Side column */}
        <div className="space-y-4">
          <div className="card overflow-hidden">
            <div className="card-header">
              <h2 className="text-[14px] font-semibold" style={{ color: "var(--apt-text-primary)" }}>Preview</h2>
            </div>
            <div className="p-5 flex items-center gap-4">
              <div
                className="w-[58px] h-[58px] rounded-2xl flex items-center justify-center shrink-0 overflow-hidden text-[21px] font-extrabold tracking-tight"
                style={{ background: tint.bg, color: tint.fg }}
              >
                {form.logoUrl ? (
                  <img src={form.logoUrl} alt={form.name} className="w-full h-full object-contain p-1.5" />
                ) : (
                  brandInitials(form.name || "?")
                )}
              </div>
              <div className="min-w-0">
                <div className="text-[15px] font-bold tracking-tight truncate" style={{ color: "var(--apt-text-primary)" }}>
                  {form.name || "Brand name"}
                </div>
                <div className="font-mono text-[11px] mt-0.5 truncate" style={{ color: "var(--apt-text-muted)" }}>
                  {form.slug || "slug"}
                </div>
              </div>
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="card-header">
              <h2 className="text-[14px] font-semibold" style={{ color: "var(--apt-text-primary)" }}>Visibility</h2>
            </div>
            <div className="p-5 space-y-4">
              <Toggle
                checked={form.isFeatured}
                onChange={(v) => set("isFeatured", v)}
                title="Featured Brand"
                hint={`Highlight this brand on ${SITE_DOMAIN} and in the store`}
              />
              <Toggle
                checked={form.isPartner}
                onChange={(v) => set("isPartner", v)}
                title="Manufacturer Partner"
                hint="Official APT distribution partner"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-1">
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
