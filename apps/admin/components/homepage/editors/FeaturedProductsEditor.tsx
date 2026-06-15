"use client";

import type { HpSection, FeaturedProductsConfig } from "@apt/db";
import { Input, Textarea } from "@/components/ui/Input";
import { Select } from "@/components/ui/Input";

interface Props { section: HpSection; onChange: (s: HpSection) => void }

export default function FeaturedProductsEditor({ section, onChange }: Props) {
  const cfg = section.config as unknown as FeaturedProductsConfig;
  function set(patch: Partial<FeaturedProductsConfig>) {
    onChange({ ...section, config: { ...cfg, ...patch } });
  }

  return (
    <div className="space-y-4">
      <p className="text-[12px]" style={{ color: "var(--apt-text-muted)" }}>
        Products are fetched live from the database. Configure what to display and how many.
      </p>
      <div className="grid grid-cols-2 gap-4">
        <Input label="Section label (eyebrow)" value={cfg.label} onChange={(e) => set({ label: e.target.value })} wrapperClass="col-span-2" placeholder="Popular This Week" />
        <Input label="Title" value={cfg.title} onChange={(e) => set({ title: e.target.value })} wrapperClass="col-span-2" />
        <Textarea label="Subtitle" value={cfg.subtitle} onChange={(e) => set({ subtitle: e.target.value })} wrapperClass="col-span-2" className="text-[13px]" rows={2} />
        <Select
          label="Sort order"
          value={cfg.sort}
          onChange={(e) => set({ sort: e.target.value as FeaturedProductsConfig["sort"] })}
          options={[
            { value: "newest", label: "Newest first" },
            { value: "featured", label: "Featured products" },
            { value: "clearance", label: "Clearance items" },
          ]}
        />
        <div>
          <label className="text-[12px] font-medium" style={{ color: "var(--apt-text-primary)" }}>Max products</label>
          <input
            type="number" value={cfg.limit} min={2} max={24} step={2}
            onChange={(e) => set({ limit: Number(e.target.value) })}
            className="mt-1.5 w-full h-9 rounded-md border text-[13px] px-3 focus:outline-none focus:ring-2 focus:ring-[var(--apt-border-focus)]"
            style={{ borderColor: "var(--apt-border)", background: "var(--apt-bg)", color: "var(--apt-text-primary)" }}
          />
        </div>
        <Input label="Filter by brand slug" value={cfg.brandSlug} onChange={(e) => set({ brandSlug: e.target.value })} hint="Leave blank for all brands" placeholder="e.g. schneider-electric" />
        <Input label="Filter by category slug" value={cfg.categorySlug} onChange={(e) => set({ categorySlug: e.target.value })} hint="Leave blank for all categories" placeholder="e.g. electrical-solutions" />
      </div>
    </div>
  );
}
