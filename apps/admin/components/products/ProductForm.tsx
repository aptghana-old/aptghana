"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Info, Plus, Save, CheckCircle2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Select } from "@/components/ui/Input";
import { STORE_DOMAIN } from "@apt/config";
import { slugify } from "@apt/types";
import CategoryPicker from "./CategoryPicker";

export interface SpecEntry { key: string; value: string; unit: string }
export interface SpecGroup { name: string; specs: SpecEntry[] }

export interface ProductFormData {
  name: string; sku: string; mpn: string; supplierRef: string; slug: string;
  brandId: string; categoryId: string;
  shortDescription: string; description: string;
  features: string;        // one per line
  applications: string;    // comma-separated
  certifications: string;  // comma-separated
  tags: string;            // comma-separated
  status: string;
  specGroups: SpecGroup[];
  listPrice: string; tradePrice: string; currency: string;
  minimumOrderQty: string; leadTime: string; incoterms: string;
  quantity: string;
  isNew: boolean; isFeatured: boolean; isClearance: boolean; discount: string;
  metaTitle: string; metaDescription: string;
}

interface Props {
  brands: { value: string; label: string; slug: string }[];
  initial?: Partial<ProductFormData>;
  productId?: string;
}

const STATUS_OPTIONS = [
  { value: "active",       label: "Active — visible on store" },
  { value: "draft",        label: "Draft — hidden from store" },
  { value: "inactive",     label: "Inactive" },
  { value: "discontinued", label: "Discontinued" },
  { value: "archived",     label: "Archived" },
];

const CURRENCY_OPTIONS = [
  { value: "GHS", label: "GHS — Ghanaian Cedi" },
  { value: "USD", label: "USD — US Dollar" },
  { value: "EUR", label: "EUR — Euro" },
  { value: "GBP", label: "GBP — British Pound" },
];

const splitLines = (s: string) => s.split("\n").map((x) => x.trim()).filter(Boolean);
const splitComma = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);

/* ── Presentational helpers (mirrors the product-detail panel language) ────── */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--apt-text-muted)" }}>
      {children}
    </p>
  );
}

function FormCard({ title, meta, children }: { title: string; meta?: string; children: React.ReactNode }) {
  return (
    <section className="card overflow-hidden">
      <div className="px-5 py-3 flex items-center justify-between gap-3" style={{ borderBottom: "1px solid var(--apt-border)" }}>
        <SectionLabel>{title}</SectionLabel>
        {meta && <span className="font-mono text-[10.5px]" style={{ color: "var(--apt-text-muted)" }}>{meta}</span>}
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </section>
  );
}

function FlagRow({ label, hint, checked, onChange }: { label: string; hint: string; checked: boolean; onChange(v: boolean): void }) {
  return (
    <label className="flex items-start gap-3 cursor-pointer select-none">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 w-4 h-4 shrink-0 accent-[#0057b8] cursor-pointer"
      />
      <span className="min-w-0">
        <span className="block text-[13px] font-medium" style={{ color: "var(--apt-text-primary)" }}>{label}</span>
        <span className="block text-[11.5px] leading-snug" style={{ color: "var(--apt-text-muted)" }}>{hint}</span>
      </span>
    </label>
  );
}

const specInputClass =
  "w-full h-8 px-2.5 rounded-md text-[12px] border border-[var(--apt-border)] bg-[var(--apt-bg)] " +
  "focus:outline-none focus:ring-2 focus:ring-[var(--apt-border-focus)] placeholder:text-[var(--apt-text-muted)]";

/* ── Form ──────────────────────────────────────────────────────────────────── */
export default function ProductForm({ brands, initial, productId }: Props) {
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setPending] = useState(false);

  const [form, setForm] = useState<ProductFormData>({
    name: initial?.name ?? "",
    sku: initial?.sku ?? "",
    mpn: initial?.mpn ?? "",
    supplierRef: initial?.supplierRef ?? "",
    slug: initial?.slug ?? "",
    brandId: initial?.brandId ?? "",
    categoryId: initial?.categoryId ?? "",
    shortDescription: initial?.shortDescription ?? "",
    description: initial?.description ?? "",
    features: initial?.features ?? "",
    applications: initial?.applications ?? "",
    certifications: initial?.certifications ?? "",
    tags: initial?.tags ?? "",
    status: initial?.status ?? "draft",
    specGroups: initial?.specGroups ?? [],
    listPrice: initial?.listPrice ?? "",
    tradePrice: initial?.tradePrice ?? "",
    currency: initial?.currency ?? "GHS",
    minimumOrderQty: initial?.minimumOrderQty ?? "",
    leadTime: initial?.leadTime ?? "",
    incoterms: initial?.incoterms ?? "",
    quantity: initial?.quantity ?? "",
    isNew: initial?.isNew ?? false,
    isFeatured: initial?.isFeatured ?? false,
    isClearance: initial?.isClearance ?? false,
    discount: initial?.discount ?? "",
    metaTitle: initial?.metaTitle ?? "",
    metaDescription: initial?.metaDescription ?? "",
  });

  const set = (field: keyof ProductFormData, value: unknown) => {
    setSaved(false);
    setForm((f) => ({ ...f, [field]: value }));
  };

  const handleNameChange = (name: string) => {
    set("name", name);
    if (!initial?.slug && !productId) set("slug", slugify(name));
  };

  /* Spec editing */
  const addSpecGroup = () =>
    set("specGroups", [...form.specGroups, { name: "", specs: [{ key: "", value: "", unit: "" }] }]);

  const removeSpecGroup = (gi: number) =>
    set("specGroups", form.specGroups.filter((_, i) => i !== gi));

  const renameSpecGroup = (gi: number, name: string) =>
    set("specGroups", form.specGroups.map((g, i) => (i === gi ? { ...g, name } : g)));

  const addSpec = (gi: number) =>
    set("specGroups", form.specGroups.map((g, i) =>
      i === gi ? { ...g, specs: [...g.specs, { key: "", value: "", unit: "" }] } : g
    ));

  const updateSpec = (gi: number, si: number, field: keyof SpecEntry, val: string) =>
    set("specGroups", form.specGroups.map((g, i) =>
      i === gi ? { ...g, specs: g.specs.map((s, j) => (j === si ? { ...s, [field]: val } : s)) } : g
    ));

  const removeSpec = (gi: number, si: number) =>
    set("specGroups", form.specGroups.map((g, i) =>
      i === gi ? { ...g, specs: g.specs.filter((_, j) => j !== si) } : g
    ));

  const specCount = form.specGroups.reduce((n, g) => n + g.specs.filter((s) => s.key && s.value).length, 0);

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.sku.trim()) {
      setError("Product name and SKU are required.");
      return;
    }
    setError(null);
    setPending(true);

    try {
      const res = await fetch(productId ? `/api/products/${productId}` : "/api/products", {
        method: productId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          features: splitLines(form.features),
          applications: splitComma(form.applications),
          certifications: splitComma(form.certifications),
          tags: splitComma(form.tags),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      setSaved(true);
      if (productId) {
        router.refresh();
      } else {
        router.push(`/dashboard/products/${data.id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setPending(false);
    }
  };

  const cancelHref = productId ? `/dashboard/products/${productId}` : "/dashboard/products";

  return (
    <div className="px-4 sm:px-6 py-5 max-w-[1400px] space-y-8 pb-12">
      {error && (
        <div
          className="flex items-center gap-2.5 px-4 py-3 rounded-lg text-[13px]"
          style={{ background: "#fef2f2", border: "1px solid #fca5a5", color: "#b91c1c" }}
          role="alert"
        >
          <Info size={14} className="shrink-0" />
          {error}
        </div>
      )}

      {/* ── Main band: form cards + commerce sidebar ── */}
      <div className="flex flex-wrap items-start gap-5">
        <div className="flex-[2_1_420px] min-w-0 space-y-4">
          <FormCard title="Identity">
            <Input
              label="Product Name"
              required
              value={form.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. Schneider LC1D09 Contactor — 9 A 3P, 4 kW, 230 V AC coil"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="SKU"
                required
                value={form.sku}
                onChange={(e) => set("sku", e.target.value.toUpperCase())}
                placeholder="SE-LC1D09M7"
                hint="Internal stock-keeping unit"
                className="font-mono"
              />
              <Input
                label="Manufacturer Part Number (MPN)"
                value={form.mpn}
                onChange={(e) => set("mpn", e.target.value)}
                placeholder="LC1D09M7"
                className="font-mono"
              />
              <Input
                label="Supplier Reference"
                value={form.supplierRef}
                onChange={(e) => set("supplierRef", e.target.value)}
                placeholder="DIS-40221-FR"
                className="font-mono"
              />
              <Input
                label="URL Slug"
                value={form.slug}
                onChange={(e) => set("slug", e.target.value)}
                hint="Auto-generated from name"
                className="font-mono"
              />
            </div>
          </FormCard>

          <FormCard title="Classification">
            <Select
              label="Brand"
              value={form.brandId}
              onChange={(e) => set("brandId", e.target.value)}
              options={brands}
              placeholder="Select brand…"
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium" style={{ color: "var(--apt-text-primary)" }}>
                Catalogue Assignment
              </label>
              <CategoryPicker
                value={form.categoryId || null}
                onChange={(leafId) => set("categoryId", leafId ?? "")}
              />
            </div>
            <Input
              label="Tags"
              value={form.tags}
              onChange={(e) => set("tags", e.target.value)}
              placeholder="3-pole, DC coil, DIN rail"
              hint="Comma-separated — shown as chips on the product header"
            />
          </FormCard>

          <FormCard title="Description">
            <Textarea
              label="Short Description"
              value={form.shortDescription}
              onChange={(e) => set("shortDescription", e.target.value)}
              placeholder="1–2 sentences for product cards and search snippets."
              hint="Displayed in product listings and search results"
            />
            <Textarea
              label="Full Description"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Detailed product description…"
              style={{ minHeight: 140 }}
            />
          </FormCard>

          <FormCard title="Key Features" meta={form.features.trim() ? `${splitLines(form.features).length}` : undefined}>
            <Textarea
              label="Features"
              value={form.features}
              onChange={(e) => set("features", e.target.value)}
              placeholder={"One feature per line, e.g.\nRated 18 A (AC-3, ≤ 440 V) — controls motors up to 7.5 kW\nLow-consumption 24 V DC coil drivable directly from PLC outputs"}
              hint="One per line — rendered as the bulleted list on the product page"
              style={{ minHeight: 120 }}
            />
          </FormCard>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormCard title="Applications">
              <Textarea
                label="Applications"
                value={form.applications}
                onChange={(e) => set("applications", e.target.value)}
                placeholder="Motor starters, Pump control, HVAC fans"
                hint="Comma-separated"
              />
            </FormCard>
            <FormCard title="Certifications">
              <Textarea
                label="Certifications"
                value={form.certifications}
                onChange={(e) => set("certifications", e.target.value)}
                placeholder="CE, UKCA, UL Listed, RoHS"
                hint="Comma-separated"
              />
            </FormCard>
          </div>

          <FormCard title="SEO">
            <Input
              label="Meta Title"
              value={form.metaTitle}
              onChange={(e) => set("metaTitle", e.target.value)}
              placeholder={form.name || "Product name"}
              hint={`${form.metaTitle.length}/60 characters`}
            />
            <Textarea
              label="Meta Description"
              value={form.metaDescription}
              onChange={(e) => set("metaDescription", e.target.value)}
              placeholder="Describe the product for search engines…"
              hint={`${form.metaDescription.length}/160 characters`}
            />
            {(form.metaTitle || form.name) && (
              <div className="rounded-lg p-4" style={{ background: "var(--apt-bg-subtle)", border: "1px solid var(--apt-border)" }}>
                <SectionLabel>Search Preview</SectionLabel>
                <div className="text-[#1a0dab] text-[16px] leading-snug mt-2">
                  {form.metaTitle || form.name}
                </div>
                <div className="font-mono text-[#006621] text-[11.5px] mt-0.5 break-all">
                  {STORE_DOMAIN}/products/{form.slug || "product-slug"}
                </div>
                {form.metaDescription && (
                  <div className="text-[13px] mt-1 text-[#545454] leading-snug">
                    {form.metaDescription.slice(0, 160)}
                  </div>
                )}
              </div>
            )}
          </FormCard>
        </div>

        {/* ── Commerce sidebar ── */}
        <div className="flex-[1_1_280px] min-w-[280px] max-w-full lg:max-w-[380px] space-y-4 xl:sticky xl:top-4">
          {/* Save panel */}
          <div className="card p-5 space-y-2.5" style={{ borderColor: "var(--apt-border-strong)" }}>
            <Button
              variant="primary"
              size="md"
              loading={isPending}
              icon={saved ? <CheckCircle2 size={14} /> : <Save size={14} />}
              className="w-full"
              onClick={handleSubmit}
            >
              {saved ? "Saved" : productId ? "Save Changes" : "Create Product"}
            </Button>
            <Link href={cancelHref} className="block">
              <Button variant="secondary" size="md" className="w-full">Cancel</Button>
            </Link>
          </div>

          {/* Status & visibility */}
          <div className="card p-5 space-y-4">
            <SectionLabel>Status &amp; Visibility</SectionLabel>
            <Select
              label="Status"
              value={form.status}
              onChange={(e) => set("status", e.target.value)}
              options={STATUS_OPTIONS}
            />
            <div className="space-y-3 pt-1">
              <FlagRow label="New" hint="Shows the NEW badge on store and admin" checked={form.isNew} onChange={(v) => set("isNew", v)} />
              <FlagRow label="Featured" hint="Eligible for featured placements" checked={form.isFeatured} onChange={(v) => set("isFeatured", v)} />
              <FlagRow label="Clearance" hint="Marks the product as clearance stock" checked={form.isClearance} onChange={(v) => set("isClearance", v)} />
            </div>
            <Input
              label="Discount %"
              type="number"
              min={0}
              max={100}
              value={form.discount}
              onChange={(e) => set("discount", e.target.value)}
              placeholder="0"
            />
          </div>

          {/* Pricing */}
          <div className="card p-5 space-y-4">
            <SectionLabel>Pricing</SectionLabel>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="List Price"
                type="number"
                min={0}
                step="0.01"
                value={form.listPrice}
                onChange={(e) => set("listPrice", e.target.value)}
                placeholder="0.00"
              />
              <Select
                label="Currency"
                value={form.currency}
                onChange={(e) => set("currency", e.target.value)}
                options={CURRENCY_OPTIONS}
              />
              <Input
                label="Trade Price"
                type="number"
                min={0}
                step="0.01"
                value={form.tradePrice}
                onChange={(e) => set("tradePrice", e.target.value)}
                placeholder="0.00"
              />
              <Input
                label="Min. Order Qty"
                type="number"
                min={1}
                value={form.minimumOrderQty}
                onChange={(e) => set("minimumOrderQty", e.target.value)}
                placeholder="1"
              />
              <Input
                label="Lead Time"
                value={form.leadTime}
                onChange={(e) => set("leadTime", e.target.value)}
                placeholder="2–3 days"
              />
              <Input
                label="Incoterms"
                value={form.incoterms}
                onChange={(e) => set("incoterms", e.target.value)}
                placeholder="DAP Accra"
                className="font-mono"
              />
            </div>
          </div>

          {/* Inventory */}
          <div className="card p-5 space-y-4">
            <SectionLabel>Inventory</SectionLabel>
            <Input
              label="Stock Quantity"
              type="number"
              min={0}
              value={form.quantity}
              onChange={(e) => set("quantity", e.target.value)}
              placeholder="0"
              hint="Current on-hand stock"
            />
            <p
              className="text-[11.5px] leading-relaxed px-3 py-2.5 rounded-md"
              style={{ background: "var(--apt-bg-subtle)", border: "1px solid var(--apt-border)", color: "var(--apt-text-muted)" }}
            >
              Pricing and live stock levels are synchronised from Odoo ERP. Values entered here
              serve as fallback when Odoo is unreachable.
            </p>
          </div>
        </div>
      </div>

      {/* ── Specifications band ── */}
      <section>
        <div className="flex items-baseline gap-3 flex-wrap mb-4">
          <h2 className="text-[18px] font-bold tracking-tight" style={{ color: "var(--apt-text-primary)" }}>Specifications</h2>
          <span className="font-mono text-[11px]" style={{ color: "var(--apt-text-muted)" }}>
            {specCount} attribute{specCount === 1 ? "" : "s"} · {form.specGroups.length} group{form.specGroups.length === 1 ? "" : "s"}
          </span>
          <div className="flex-1" />
          <Button variant="outline" size="sm" icon={<Plus size={13} />} onClick={addSpecGroup}>
            Add group
          </Button>
        </div>

        {form.specGroups.length === 0 ? (
          <div className="card px-5 py-8 text-center">
            <p className="text-[13px] font-medium" style={{ color: "var(--apt-text-secondary)" }}>No specification groups yet</p>
            <p className="text-[12px] mt-0.5" style={{ color: "var(--apt-text-muted)" }}>
              Group technical attributes by category — e.g. Electrical ratings, Physical, Environmental.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
            {form.specGroups.map((group, gi) => (
              <div key={gi} className="card overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-3" style={{ borderBottom: "1px solid var(--apt-border-strong)" }}>
                  <input
                    value={group.name}
                    onChange={(e) => renameSpecGroup(gi, e.target.value)}
                    className="flex-1 min-w-0 bg-transparent text-[13px] font-bold outline-none"
                    style={{ color: "var(--apt-text-primary)" }}
                    placeholder="Group name — e.g. Electrical ratings"
                  />
                  <span className="font-mono text-[10.5px] shrink-0" style={{ color: "var(--apt-text-muted)" }}>
                    {group.specs.filter((s) => s.key && s.value).length}
                  </span>
                  <button
                    onClick={() => removeSpecGroup(gi)}
                    className="w-7 h-7 flex items-center justify-center rounded-md shrink-0 transition-colors hover:bg-[var(--apt-bg-raised)]"
                    style={{ color: "var(--apt-text-muted)" }}
                    aria-label="Remove group"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>

                <div className="p-4 space-y-2">
                  {group.specs.map((spec, si) => (
                    <div key={si} className="grid grid-cols-[1fr_1fr_64px_28px] gap-2 items-center">
                      <input
                        value={spec.key}
                        onChange={(e) => updateSpec(gi, si, "key", e.target.value)}
                        placeholder="Attribute"
                        className={specInputClass}
                        style={{ color: "var(--apt-text-primary)" }}
                      />
                      <input
                        value={spec.value}
                        onChange={(e) => updateSpec(gi, si, "value", e.target.value)}
                        placeholder="Value"
                        className={specInputClass}
                        style={{ color: "var(--apt-text-primary)" }}
                      />
                      <input
                        value={spec.unit}
                        onChange={(e) => updateSpec(gi, si, "unit", e.target.value)}
                        placeholder="Unit"
                        className={specInputClass}
                        style={{ color: "var(--apt-text-primary)" }}
                      />
                      <button
                        onClick={() => removeSpec(gi, si)}
                        className="w-7 h-7 flex items-center justify-center rounded-md transition-colors hover:bg-[var(--apt-bg-raised)]"
                        style={{ color: "var(--apt-text-muted)" }}
                        aria-label="Remove row"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                  <Button variant="ghost" size="xs" icon={<Plus size={11} />} onClick={() => addSpec(gi)}>
                    Add row
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
