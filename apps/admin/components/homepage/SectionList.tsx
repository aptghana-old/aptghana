"use client";

import type { HpSection } from "@apt/db";

const SECTION_LABELS: Record<string, string> = {
  services_bar: "Services Bar",
  quick_access: "Quick Access",
  promo_banners: "Promo Banners",
  categories: "Categories",
  featured_products: "Featured Products",
  full_width_banner: "Full-Width Banner",
  brands_ticker: "Brands",
  industries: "Industries",
  why_choose: "Why Choose APT",
  stats: "Stats",
  resources: "Resources",
  cta: "CTA Banner",
};

const SECTION_ICONS: Record<string, string> = {
  services_bar: "⬛",
  quick_access: "⚡",
  promo_banners: "🖼",
  categories: "📂",
  featured_products: "⭐",
  full_width_banner: "📸",
  brands_ticker: "🏷",
  industries: "🏭",
  why_choose: "✅",
  stats: "📊",
  resources: "📚",
  cta: "📣",
};

const ADDABLE_TYPES: Array<{ type: HpSection[ "type" ]; label: string }> = [
  { type: "services_bar", label: "Services Bar" },
  { type: "quick_access", label: "Quick Access Bar" },
  { type: "promo_banners", label: "Promotional Banners" },
  { type: "categories", label: "Shop by Category" },
  { type: "featured_products", label: "Product Grid" },
  { type: "full_width_banner", label: "Full-Width Banner" },
  { type: "brands_ticker", label: "Brands Ticker" },
  { type: "industries", label: "Industry Solutions" },
  { type: "why_choose", label: "Why Choose APT" },
  { type: "stats", label: "Stats / Numbers" },
  { type: "resources", label: "Resource Cards" },
  { type: "cta", label: "CTA Banner" },
];

interface Props {
  selectedId: string | null;
  sections: HpSection[];
  onSelect: (id: string) => void;
  onToggle: (id: string, enabled: boolean) => void;
  onMove: (id: string, dir: -1 | 1) => void;
  onAdd: (type: HpSection[ "type" ]) => void;
  onRemove: (id: string) => void;
}

export default function SectionList({ selectedId, sections, onSelect, onToggle, onMove, onAdd, onRemove }: Props) {
  const sorted = [ ...sections ].sort((a, b) => a.order - b.order);

  return (
    <div className="flex flex-col h-full">
      {/* Carousel (always first, special) */}
      <button
        onClick={() => onSelect("carousel")}
        className={[
          "w-full flex items-center gap-2.5 px-3 py-2.5 text-left rounded-lg border mb-1 transition-all",
          selectedId === "carousel"
            ? "border-[var(--apt-border-focus)] bg-[#0057b808]"
            : "border-transparent hover:border-[var(--apt-border)]",
        ].join(" ")}
      >
        <span className="text-base">🎠</span>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold truncate" style={{ color: "var(--apt-text-primary)" }}>Hero Carousel</p>
          <p className="text-[11px]" style={{ color: "var(--apt-text-muted)" }}>Slides + side panels</p>
        </div>
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: "#16a34a1a", color: "#16a34a" }}>ON</span>
      </button>

      <div className="border-b my-2" style={{ borderColor: "var(--apt-border)" }} />

      {/* Section list */}
      <div className="flex-1 overflow-y-auto space-y-1 pr-0.5">
        {sorted.map((section, i) => (
          <div
            key={section.id}
            className={[
              "group rounded-lg border transition-all",
              selectedId === section.id
                ? "border-[var(--apt-border-focus)] bg-[#0057b808]"
                : "border-transparent hover:border-[var(--apt-border)]",
            ].join(" ")}
          >
            <div className="flex items-center gap-2 px-2 py-2">
              {/* Enable toggle */}
              <label className="relative flex items-center cursor-pointer shrink-0" title={section.enabled ? "Enabled" : "Disabled"} onClick={(e) => e.stopPropagation()}>
                <input
                  type="checkbox"
                  checked={section.enabled}
                  onChange={(e) => onToggle(section.id, e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-7 h-4 rounded-full transition-colors peer-checked:bg-navy-500 bg-gray-300 dark:bg-gray-600 peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--apt-border-focus)]" />
                <div className="absolute left-0.5 top-0.5 w-3 h-3 rounded-full bg-white transition-transform peer-checked:translate-x-3" />
              </label>

              {/* Label */}
              <button className="flex-1 flex items-center gap-2 min-w-0 text-left" onClick={() => onSelect(section.id)}>
                <span className="text-sm shrink-0">{SECTION_ICONS[ section.type ] ?? "📄"}</span>
                <span className={`text-[13px] truncate ${section.enabled ? "" : "opacity-50"}`} style={{ color: "var(--apt-text-primary)" }}>
                  {section.label || SECTION_LABELS[ section.type ] || section.type}
                </span>
              </button>

              {/* Reorder + remove */}
              <div className="flex items-center gap-0 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => onMove(section.id, -1)} disabled={i === 0} title="Move up" className="w-5 h-5 flex items-center justify-center rounded disabled:opacity-30 text-[11px]" style={{ color: "var(--apt-text-muted)" }}>↑</button>
                <button onClick={() => onMove(section.id, 1)} disabled={i === sorted.length - 1} title="Move down" className="w-5 h-5 flex items-center justify-center rounded disabled:opacity-30 text-[11px]" style={{ color: "var(--apt-text-muted)" }}>↓</button>
                <button onClick={() => onRemove(section.id)} title="Remove" className="w-5 h-5 flex items-center justify-center rounded text-red-400 hover:text-red-600 text-[11px]">×</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add section */}
      <div className="border-t pt-3 mt-3" style={{ borderColor: "var(--apt-border)" }}>
        <p className="text-[11px] font-semibold mb-1.5 uppercase tracking-wider" style={{ color: "var(--apt-text-muted)" }}>Add section</p>
        <div className="grid grid-cols-2 gap-1">
          {ADDABLE_TYPES.map((t) => (
            <button
              key={t.type}
              onClick={() => onAdd(t.type)}
              className="text-[11px] px-2 py-1.5 rounded border text-left transition-colors hover:border-[var(--apt-border-strong)] truncate"
              style={{ borderColor: "var(--apt-border)", color: "var(--apt-text-secondary)", background: "var(--apt-bg)" }}
            >
              {SECTION_ICONS[ t.type ]} {t.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
