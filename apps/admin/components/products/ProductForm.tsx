"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Package, Image as ImageIcon, Sliders, DollarSign,
  Search, Globe, Save, CheckCircle2, Plus, Trash2, Info,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Select } from "@/components/ui/Input";
import { STORE_DOMAIN } from "@apt/config";
import CategoryPicker from "./CategoryPicker";

type Section = "general" | "media" | "specs" | "pricing" | "seo";

interface Props {
  brands: { value: string; label: string; slug: string }[];
  initial?: Partial<ProductFormData>;
  productId?: string;
}

interface SpecEntry { key: string; value: string }
interface SpecGroup { name: string; specs: SpecEntry[] }

interface ProductFormData {
  name: string;
  sku: string;
  mpn: string;
  slug: string;
  brandId: string;
  categoryId: string;
  shortDescription: string;
  description: string;
  status: string;
  specGroups: SpecGroup[];
  listPrice: string;
  currency: string;
  stockQty: string;
  metaTitle: string;
  metaDescription: string;
}

const SECTIONS: { id: Section; label: string; icon: React.ReactNode }[] = [
  { id: "general", label: "General",   icon: <Package size={14} /> },
  { id: "media",   label: "Media",     icon: <ImageIcon size={14} /> },
  { id: "specs",   label: "Specs",     icon: <Sliders size={14} /> },
  { id: "pricing", label: "Pricing",   icon: <DollarSign size={14} /> },
  { id: "seo",     label: "SEO",       icon: <Search size={14} /> },
];

const STATUS_OPTIONS = [
  { value: "active", label: "Active — visible on store" },
  { value: "draft",  label: "Draft — hidden from store" },
  { value: "inactive", label: "Inactive" },
  { value: "archived", label: "Archived" },
];

const CURRENCY_OPTIONS = [
  { value: "GHS", label: "GHS — Ghanaian Cedi" },
  { value: "USD", label: "USD — US Dollar" },
  { value: "EUR", label: "EUR — Euro" },
];

function slugify(text: string) {
  return text.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").trim();
}

function SectionNav({ active, onSelect }: { active: Section; onSelect(s: Section): void }) {
  return (
    <nav className="flex flex-col gap-0.5 py-3 px-2">
      {SECTIONS.map((s) => (
        <button
          key={s.id}
          onClick={() => onSelect(s.id)}
          className="flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] text-left transition-colors w-full"
          style={{
            background: active === s.id ? "var(--apt-bg-raised)" : "transparent",
            color: active === s.id ? "var(--apt-text-primary)" : "var(--apt-text-muted)",
            fontWeight: active === s.id ? 500 : 400,
          }}
        >
          <span style={{ color: active === s.id ? "var(--apt-text-brand)" : "var(--apt-text-muted)" }}>
            {s.icon}
          </span>
          {s.label}
        </button>
      ))}
    </nav>
  );
}

function SectionTitle({ label, description }: { label: string; description?: string }) {
  return (
    <div className="mb-5">
      <h2 className="text-[15px] font-semibold" style={{ color: "var(--apt-text-primary)" }}>{label}</h2>
      {description && (
        <p className="text-[12px] mt-0.5" style={{ color: "var(--apt-text-muted)" }}>{description}</p>
      )}
    </div>
  );
}

export default function ProductForm({ brands, initial, productId }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [activeSection, setActiveSection] = useState<Section>("general");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setPending] = useState(false);

  const [form, setForm] = useState<ProductFormData>({
    name: initial?.name ?? "",
    sku: initial?.sku ?? "",
    mpn: initial?.mpn ?? "",
    slug: initial?.slug ?? "",
    brandId: initial?.brandId ?? "",
    categoryId: initial?.categoryId ?? "",
    shortDescription: initial?.shortDescription ?? "",
    description: initial?.description ?? "",
    status: initial?.status ?? "draft",
    specGroups: initial?.specGroups ?? [{ name: "General", specs: [{ key: "", value: "" }] }],
    listPrice: initial?.listPrice ?? "",
    currency: initial?.currency ?? "GHS",
    stockQty: initial?.stockQty ?? "",
    metaTitle: initial?.metaTitle ?? "",
    metaDescription: initial?.metaDescription ?? "",
  });

  const set = (field: keyof ProductFormData, value: unknown) =>
    setForm((f) => ({ ...f, [field]: value }));

  const handleNameChange = (name: string) => {
    set("name", name);
    if (!initial?.slug) set("slug", slugify(name));
    if (!initial?.metaTitle) set("metaTitle", name);
  };

  const addSpecGroup = () =>
    set("specGroups", [...form.specGroups, { name: "Group", specs: [{ key: "", value: "" }] }]);

  const addSpec = (groupIdx: number) => {
    const groups = [...form.specGroups];
    groups[groupIdx] = { ...groups[groupIdx], specs: [...groups[groupIdx].specs, { key: "", value: "" }] };
    set("specGroups", groups);
  };

  const updateSpec = (groupIdx: number, specIdx: number, field: "key" | "value", val: string) => {
    const groups = form.specGroups.map((g, gi) =>
      gi === groupIdx
        ? { ...g, specs: g.specs.map((s, si) => si === specIdx ? { ...s, [field]: val } : s) }
        : g
    );
    set("specGroups", groups);
  };

  const removeSpec = (groupIdx: number, specIdx: number) => {
    const groups = form.specGroups.map((g, gi) =>
      gi === groupIdx ? { ...g, specs: g.specs.filter((_, si) => si !== specIdx) } : g
    );
    set("specGroups", groups);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.sku) {
      setError("Product name and SKU are required.");
      setActiveSection("general");
      return;
    }
    setError(null);
    setPending(true);

    try {
      const res = await fetch(productId ? `/api/products/${productId}` : "/api/products", {
        method: productId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Save failed");
      setSaved(true);
      startTransition(() => {
        if (!productId) router.push("/dashboard/products");
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-112px)]">
      {/* Left nav */}
      <div
        className="w-44 shrink-0 border-r"
        style={{ background: "var(--apt-bg)", borderColor: "var(--apt-border)" }}
      >
        <SectionNav active={activeSection} onSelect={setActiveSection} />
      </div>

      {/* Form body */}
      <div className="flex-1 min-w-0 overflow-y-auto p-8 max-w-3xl">
        {error && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-lg mb-6 text-[13px]" style={{ background: "#fef2f2", border: "1px solid #fca5a5", color: "#b91c1c" }}>
            <Info size={14} />
            {error}
          </div>
        )}

        {/* ── General ── */}
        {activeSection === "general" && (
          <div className="space-y-5 animate-slide-up">
            <SectionTitle label="General Information" description="Core product identity and classification." />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Product Name"
                required
                value={form.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Schneider LC1D09 Contactor"
                wrapperClass="col-span-2"
              />
              <Input
                label="SKU"
                required
                value={form.sku}
                onChange={(e) => set("sku", e.target.value.toUpperCase())}
                placeholder="SE-LC1D09M7"
                hint="Your internal stock-keeping unit"
              />
              <Input
                label="Manufacturer Part Number (MPN)"
                value={form.mpn}
                onChange={(e) => set("mpn", e.target.value)}
                placeholder="LC1D09M7"
              />
              <Input
                label="URL Slug"
                value={form.slug}
                onChange={(e) => set("slug", e.target.value)}
                hint="auto-generated from name"
              />
              <Select
                label="Status"
                value={form.status}
                onChange={(e) => set("status", e.target.value)}
                options={STATUS_OPTIONS}
              />
            </div>

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

            <Textarea
              label="Short Description"
              value={form.shortDescription}
              onChange={(e) => set("shortDescription", e.target.value)}
              placeholder="1–2 sentences for product cards and search snippets."
              hint="Displayed in product listings and search results (max 200 chars)"
            />

            <Textarea
              label="Full Description"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Detailed product description…"
              style={{ minHeight: 120 }}
            />
          </div>
        )}

        {/* ── Media ── */}
        {activeSection === "media" && (
          <div className="animate-slide-up">
            <SectionTitle label="Media" description="Product images, documents, and datasheets." />
            <div
              className="rounded-xl border-2 border-dashed flex flex-col items-center justify-center py-14 px-6 text-center"
              style={{ borderColor: "var(--apt-border)", background: "var(--apt-bg-subtle)" }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
                style={{ background: "var(--apt-bg-raised)" }}
              >
                <ImageIcon size={20} style={{ color: "var(--apt-text-muted)" }} />
              </div>
              <p className="text-[14px] font-medium" style={{ color: "var(--apt-text-primary)" }}>
                Drag & drop images here
              </p>
              <p className="text-[12px] mt-1 mb-4" style={{ color: "var(--apt-text-muted)" }}>
                PNG, JPG, WebP up to 8 MB each
              </p>
              <Button variant="secondary" size="sm">
                Browse files
              </Button>
            </div>

            <div className="mt-6">
              <p className="text-[13px] font-medium mb-3" style={{ color: "var(--apt-text-primary)" }}>
                Documents & Datasheets
              </p>
              <div
                className="rounded-xl border-2 border-dashed flex flex-col items-center justify-center py-8 px-6 text-center"
                style={{ borderColor: "var(--apt-border)", background: "var(--apt-bg-subtle)" }}
              >
                <p className="text-[13px]" style={{ color: "var(--apt-text-muted)" }}>
                  Upload PDF datasheets, manuals, compliance docs
                </p>
                <Button variant="secondary" size="sm" className="mt-3">
                  Upload PDFs
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ── Specs ── */}
        {activeSection === "specs" && (
          <div className="animate-slide-up">
            <SectionTitle label="Technical Specifications" description="Group specifications by category (e.g. Electrical, Mechanical)." />

            {form.specGroups.map((group, gi) => (
              <div
                key={gi}
                className="mb-5 rounded-lg border overflow-hidden"
                style={{ borderColor: "var(--apt-border)" }}
              >
                <div
                  className="flex items-center gap-3 px-4 py-3"
                  style={{ background: "var(--apt-bg-raised)", borderBottom: "1px solid var(--apt-border)" }}
                >
                  <input
                    value={group.name}
                    onChange={(e) => {
                      const groups = [...form.specGroups];
                      groups[gi] = { ...groups[gi], name: e.target.value };
                      set("specGroups", groups);
                    }}
                    className="flex-1 bg-transparent text-[13px] font-semibold outline-none"
                    style={{ color: "var(--apt-text-primary)" }}
                    placeholder="Group name"
                  />
                </div>

                <div className="p-3 space-y-2">
                  {group.specs.map((spec, si) => (
                    <div key={si} className="flex items-center gap-2">
                      <input
                        value={spec.key}
                        onChange={(e) => updateSpec(gi, si, "key", e.target.value)}
                        placeholder="Property (e.g. Voltage)"
                        className="flex-1 h-8 px-3 rounded-md text-[12px] border focus:outline-none focus:ring-2 focus:ring-[var(--apt-border-focus)]"
                        style={{
                          background: "var(--apt-bg)",
                          border: "1px solid var(--apt-border)",
                          color: "var(--apt-text-primary)",
                        }}
                      />
                      <input
                        value={spec.value}
                        onChange={(e) => updateSpec(gi, si, "value", e.target.value)}
                        placeholder="Value (e.g. 230V AC)"
                        className="flex-1 h-8 px-3 rounded-md text-[12px] border focus:outline-none focus:ring-2 focus:ring-[var(--apt-border-focus)]"
                        style={{
                          background: "var(--apt-bg)",
                          border: "1px solid var(--apt-border)",
                          color: "var(--apt-text-primary)",
                        }}
                      />
                      <button
                        onClick={() => removeSpec(gi, si)}
                        className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-[#fef2f2] transition-colors"
                        style={{ color: "var(--apt-text-muted)" }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="px-3 pb-3">
                  <Button
                    variant="ghost"
                    size="xs"
                    icon={<Plus size={11} />}
                    onClick={() => addSpec(gi)}
                  >
                    Add row
                  </Button>
                </div>
              </div>
            ))}

            <Button
              variant="outline"
              size="sm"
              icon={<Plus size={13} />}
              onClick={addSpecGroup}
            >
              Add specification group
            </Button>
          </div>
        )}

        {/* ── Pricing ── */}
        {activeSection === "pricing" && (
          <div className="animate-slide-up">
            <SectionTitle label="Pricing & Inventory" description="List price, currency, and stock levels." />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="List Price"
                type="number"
                value={form.listPrice}
                onChange={(e) => set("listPrice", e.target.value)}
                placeholder="0.00"
                hint="Base retail price (before discounts)"
              />
              <Select
                label="Currency"
                value={form.currency}
                onChange={(e) => set("currency", e.target.value)}
                options={CURRENCY_OPTIONS}
              />
              <Input
                label="Stock Quantity"
                type="number"
                value={form.stockQty}
                onChange={(e) => set("stockQty", e.target.value)}
                placeholder="0"
                hint="Current on-hand stock"
              />
            </div>

            <div
              className="mt-5 flex items-start gap-3 p-4 rounded-lg"
              style={{ background: "#eff6ff", border: "1px solid #bfdbfe" }}
            >
              <Info size={14} className="shrink-0 mt-0.5" style={{ color: "#3b82f6" }} />
              <p className="text-[12px]" style={{ color: "#1d4ed8" }}>
                Pricing and live stock levels are synchronised from Odoo ERP.
                Values entered here serve as fallback when Odoo is unreachable.
              </p>
            </div>
          </div>
        )}

        {/* ── SEO ── */}
        {activeSection === "seo" && (
          <div className="animate-slide-up">
            <SectionTitle label="SEO" description="Control how this product appears in search engines." />

            <div className="space-y-4">
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
                style={{ minHeight: 80 }}
              />

              {/* Preview */}
              {(form.metaTitle || form.name) && (
                <div
                  className="rounded-lg p-4 mt-2"
                  style={{ background: "var(--apt-bg-subtle)", border: "1px solid var(--apt-border)" }}
                >
                  <p className="text-[11px] font-semibold mb-2 uppercase tracking-wider" style={{ color: "var(--apt-text-muted)" }}>
                    Google Preview
                  </p>
                  <div className="text-[#1a0dab] text-[16px] leading-snug hover:underline cursor-pointer">
                    {form.metaTitle || form.name}
                  </div>
                  <div className="text-[#006621] text-[12px] mt-0.5">
                    {STORE_DOMAIN}/products/{form.slug || "product-slug"}
                  </div>
                  {form.metaDescription && (
                    <div className="text-[13px] mt-1 text-[#545454] leading-snug">
                      {form.metaDescription.slice(0, 160)}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Right sidebar: save panel */}
      <div
        className="w-56 shrink-0 border-l p-4 space-y-3"
        style={{ background: "var(--apt-bg)", borderColor: "var(--apt-border)" }}
      >
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

        <Button variant="secondary" size="md" className="w-full">
          Save as Draft
        </Button>

        <div style={{ borderTop: "1px solid var(--apt-border)", paddingTop: 12 }}>
          <p className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--apt-text-muted)" }}>
            Status
          </p>
          <select
            value={form.status}
            onChange={(e) => set("status", e.target.value)}
            className="w-full h-8 px-2 rounded-md text-[12px] border"
            style={{
              background: "var(--apt-bg-subtle)",
              border: "1px solid var(--apt-border)",
              color: "var(--apt-text-primary)",
            }}
          >
            {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.value.charAt(0).toUpperCase() + o.value.slice(1)}</option>)}
          </select>
        </div>

        <div style={{ borderTop: "1px solid var(--apt-border)", paddingTop: 12 }}>
          <p className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--apt-text-muted)" }}>
            Sections
          </p>
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className="flex items-center gap-2 w-full py-1.5 text-[12px] text-left rounded-md px-2 hover:bg-[var(--apt-bg-raised)] transition-colors"
              style={{
                color: activeSection === s.id ? "var(--apt-text-brand)" : "var(--apt-text-muted)",
                fontWeight: activeSection === s.id ? 500 : 400,
              }}
            >
              <span>{s.icon}</span>
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
