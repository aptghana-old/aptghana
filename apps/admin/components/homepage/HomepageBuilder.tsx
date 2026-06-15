"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { STORE_URL as STORE_URL_DEFAULT } from "@apt/config";
import type {
  HomepageConfigData, HpSection, HpSectionType,
  CategoriesConfig, BrandsTickerConfig, IndustriesConfig,
  FeaturedProductsConfig, FullWidthBannerConfig,
  WhyChooseConfig, StatsConfig, ResourcesConfig, CTAConfig,
  ServicesBarConfig, PromoBannersConfig,
} from "@apt/db";
import { DEFAULT_HOMEPAGE_CONFIG } from "@apt/db";
import SectionList from "./SectionList";
import CarouselEditor from "./editors/CarouselEditor";
import PromoBannersEditor from "./editors/PromoBannersEditor";
import FeaturedProductsEditor from "./editors/FeaturedProductsEditor";
import FullWidthBannerEditor from "./editors/FullWidthBannerEditor";
import SectionTextEditor from "./editors/SectionTextEditor";
import WhyChooseEditor from "./editors/WhyChooseEditor";
import StatsEditor from "./editors/StatsEditor";
import CTAEditor from "./editors/CTAEditor";
import ResourcesEditor from "./editors/ResourcesEditor";
import ServicesBarEditor from "./editors/ServicesBarEditor";

/* ─── Defaults for new sections ───────────────────────────────────────────── */
const NEW_SECTION_DEFAULTS: Record<HpSectionType, () => Record<string, unknown>> = {
  services_bar: () => ({ items: [] }),
  quick_access: () => ({ links: [] }),
  promo_banners: () => ({ banners: [] }),
  categories: () => ({ title: "Shop by Category", subtitle: "", label: "Product Categories", showViewAll: true, limit: 8 }),
  featured_products: () => ({ title: "Featured Products", subtitle: "", label: "Popular This Week", sort: "newest", limit: 8, brandSlug: "", categorySlug: "" }),
  full_width_banner: () => ({ desktopImage: "", mobileImage: "", href: "/", altText: "", aspectDesktop: "1920/448", aspectMobile: "375/245" }),
  brands_ticker: () => ({ title: "Global Brand Partners", subtitle: "", showViewAll: true }),
  industries: () => ({ title: "We Serve Every Sector", subtitle: "", label: "Industry Solutions" }),
  why_choose: () => ({ title: "Why Choose APT Ghana", subtitle: "", items: [] }),
  stats: () => ({ items: [], footnotes: [] }),
  resources: () => ({ title: "Technical Resources", subtitle: "", label: "Technical Library", items: [] }),
  cta: () => ({ badge: "", title: "", subtitle: "", primaryLabel: "Request Quote", primaryHref: "/rfq", secondaryLabel: "Browse Products", secondaryHref: "/products", phone: "", footnotes: [] }),
};

const SECTION_LABELS: Record<HpSectionType, string> = {
  services_bar: "Services Bar", quick_access: "Quick Access", promo_banners: "Promo Banners",
  categories: "Categories", featured_products: "Featured Products", full_width_banner: "Full-Width Banner",
  brands_ticker: "Brands", industries: "Industries", why_choose: "Why Choose APT",
  stats: "Stats", resources: "Resources", cta: "CTA Banner",
};

/* ─── History modal ───────────────────────────────────────────────────────── */
interface HistoryEntry { _id: string; version: number; publishedAt: string; publishedBy: string }

function HistoryModal({ onClose, onRestore }: { onClose: () => void; onRestore: (v: number) => void }) {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/homepage/history")
      .then((r) => r.json())
      .then((d) => { setEntries(d.history ?? []); setLoading(false); });
  }, []);

  async function restore(version: number) {
    setRestoring(version);
    await fetch("/api/homepage/history", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ version }) });
    setRestoring(null);
    onRestore(version);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "var(--apt-bg-overlay)" }}>
      <div className="w-full max-w-md rounded-xl shadow-2xl border" style={{ background: "var(--apt-bg)", borderColor: "var(--apt-border)" }}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--apt-border)" }}>
          <h2 className="text-[15px] font-semibold" style={{ color: "var(--apt-text-primary)" }}>Version History</h2>
          <button onClick={onClose} className="w-7 h-7 rounded-md flex items-center justify-center text-[18px]" style={{ color: "var(--apt-text-muted)" }}>×</button>
        </div>
        <div className="p-4 max-h-80 overflow-y-auto">
          {loading ? (
            <p className="text-[13px] text-center py-4" style={{ color: "var(--apt-text-muted)" }}>Loading...</p>
          ) : entries.length === 0 ? (
            <p className="text-[13px] text-center py-4" style={{ color: "var(--apt-text-muted)" }}>No published versions yet.</p>
          ) : (
            <div className="space-y-2">
              {entries.map((e) => (
                <div key={e._id} className="flex items-center justify-between p-3 rounded-lg border" style={{ borderColor: "var(--apt-border)", background: "var(--apt-bg-raised)" }}>
                  <div>
                    <p className="text-[13px] font-semibold" style={{ color: "var(--apt-text-primary)" }}>Version {e.version}</p>
                    <p className="text-[11px]" style={{ color: "var(--apt-text-muted)" }}>
                      {new Date(e.publishedAt).toLocaleString("en-GB")} · {e.publishedBy || "admin"}
                    </p>
                  </div>
                  <button
                    onClick={() => restore(e.version)}
                    disabled={restoring === e.version}
                    className="text-[12px] font-medium px-3 py-1.5 rounded-md border transition-colors hover:border-[var(--apt-border-strong)] disabled:opacity-50"
                    style={{ borderColor: "var(--apt-border)", color: "var(--apt-text-brand)", background: "var(--apt-bg)" }}
                  >
                    {restoring === e.version ? "Restoring…" : "Restore"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Main builder ────────────────────────────────────────────────────────── */
interface Props {
  initialDraft: HomepageConfigData;
  publishedVersion: number | null;
}

export default function HomepageBuilder({ initialDraft, publishedVersion }: Props) {
  const [draft, setDraft] = useState<HomepageConfigData>(initialDraft);
  const [selectedId, setSelectedId] = useState<string | null>("carousel");
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [pubVersion, setPubVersion] = useState(publishedVersion);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  /* ── Auto-save on change ── */
  const scheduleSave = useCallback((data: HomepageConfigData) => {
    setIsDirty(true);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      setSaving(true);
      try {
        await fetch("/api/homepage", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ carousel: data.carousel, sections: data.sections }),
        });
        setIsDirty(false);
      } finally {
        setSaving(false);
      }
    }, 2000);
  }, []);

  function updateDraft(data: HomepageConfigData) {
    setDraft(data);
    scheduleSave(data);
  }

  /* ── Publish ── */
  async function publish() {
    // Force-save first
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }
    setPublishing(true);
    try {
      await fetch("/api/homepage", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ carousel: draft.carousel, sections: draft.sections }),
      });
      const res = await fetch("/api/homepage/publish", { method: "POST" });
      const json = await res.json();
      if (res.ok) {
        setIsDirty(false);
        setPubVersion(json.version);
        showToast(`Published as version ${json.version}`);
      } else {
        showToast("Publish failed: " + (json.error ?? "unknown error"));
      }
    } finally {
      setPublishing(false);
    }
  }

  /* ── Section mutations ── */
  function toggleSection(id: string, enabled: boolean) {
    updateDraft({ ...draft, sections: draft.sections.map((s) => s.id === id ? { ...s, enabled } : s) });
  }

  function moveSection(id: string, dir: -1 | 1) {
    const arr = [...draft.sections].sort((a, b) => a.order - b.order);
    const idx = arr.findIndex((s) => s.id === id);
    const nxt = idx + dir;
    if (nxt < 0 || nxt >= arr.length) return;
    [arr[idx].order, arr[nxt].order] = [arr[nxt].order, arr[idx].order];
    updateDraft({ ...draft, sections: arr });
  }

  function addSection(type: HpSectionType) {
    const id = `sec-${Date.now()}`;
    const order = draft.sections.length;
    const section: HpSection = {
      id, type, label: SECTION_LABELS[type], enabled: true, order,
      config: NEW_SECTION_DEFAULTS[type](),
    };
    updateDraft({ ...draft, sections: [...draft.sections, section] });
    setSelectedId(id);
  }

  function removeSection(id: string) {
    updateDraft({ ...draft, sections: draft.sections.filter((s) => s.id !== id) });
    if (selectedId === id) setSelectedId(null);
  }

  function updateSection(updated: HpSection) {
    updateDraft({ ...draft, sections: draft.sections.map((s) => s.id === updated.id ? updated : s) });
  }

  /* ── Selected section ── */
  const selectedSection = selectedId && selectedId !== "carousel"
    ? draft.sections.find((s) => s.id === selectedId)
    : null;

  return (
    <div className="flex h-[calc(100vh-56px)] overflow-hidden">
      {/* ── Left panel: section list ── */}
      <aside className="w-64 xl:w-72 shrink-0 flex flex-col border-r overflow-hidden" style={{ borderColor: "var(--apt-border)", background: "var(--apt-bg)" }}>
        <div className="px-3 py-3 border-b" style={{ borderColor: "var(--apt-border)" }}>
          <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "var(--apt-text-muted)" }}>Sections</p>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-3">
          <SectionList
            selectedId={selectedId}
            sections={draft.sections}
            onSelect={setSelectedId}
            onToggle={toggleSection}
            onMove={moveSection}
            onAdd={addSection}
            onRemove={removeSection}
          />
        </div>
      </aside>

      {/* ── Right panel: editor ── */}
      <main className="flex-1 flex flex-col overflow-hidden" style={{ background: "var(--apt-bg-subtle)" }}>
        {/* Top bar */}
        <div className="flex items-center justify-between gap-4 px-5 py-3 border-b shrink-0" style={{ borderColor: "var(--apt-border)", background: "var(--apt-bg)" }}>
          <div className="flex items-center gap-3">
            <h1 className="text-[15px] font-semibold" style={{ color: "var(--apt-text-primary)" }}>Homepage Builder</h1>
            {pubVersion !== null && (
              <span className="text-[11px] px-2 py-0.5 rounded-full font-medium" style={{ background: "#16a34a1a", color: "#16a34a" }}>
                v{pubVersion} published
              </span>
            )}
            {isDirty && !saving && (
              <span className="text-[11px]" style={{ color: "var(--apt-text-muted)" }}>Unsaved changes</span>
            )}
            {saving && (
              <span className="text-[11px]" style={{ color: "var(--apt-text-muted)" }}>Saving…</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHistory(true)}
              className="text-[12px] font-medium px-3 py-1.5 rounded-md border transition-colors"
              style={{ borderColor: "var(--apt-border)", color: "var(--apt-text-secondary)", background: "var(--apt-bg)" }}
            >
              History
            </button>
            <a
              href={process.env.NEXT_PUBLIC_STORE_URL ?? STORE_URL_DEFAULT}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[12px] font-medium px-3 py-1.5 rounded-md border transition-colors"
              style={{ borderColor: "var(--apt-border)", color: "var(--apt-text-secondary)", background: "var(--apt-bg)" }}
            >
              View Live ↗
            </a>
            <button
              onClick={publish}
              disabled={publishing}
              className="text-[13px] font-semibold px-4 py-1.5 rounded-md text-white transition-colors disabled:opacity-60"
              style={{ background: publishing ? "#888" : "#0057b8" }}
            >
              {publishing ? "Publishing…" : "Publish"}
            </button>
          </div>
        </div>

        {/* Editor body */}
        <div className="flex-1 overflow-y-auto p-6">
          {selectedId === "carousel" ? (
            <div className="max-w-2xl mx-auto">
              <EditorCard title="Hero Carousel" desc="Configure slides and side panels shown at the top of the homepage.">
                <CarouselEditor
                  carousel={draft.carousel}
                  onChange={(carousel) => updateDraft({ ...draft, carousel })}
                />
              </EditorCard>
            </div>
          ) : selectedSection ? (
            <div className="max-w-2xl mx-auto">
              <EditorCard
                title={selectedSection.label || SECTION_LABELS[selectedSection.type] || selectedSection.type}
                desc={`Type: ${selectedSection.type}`}
                onToggle={() => toggleSection(selectedSection.id, !selectedSection.enabled)}
                enabled={selectedSection.enabled}
                onLabelChange={(label) => updateSection({ ...selectedSection, label })}
                label={selectedSection.label}
              >
                <SectionEditor section={selectedSection} onChange={updateSection} />
              </EditorCard>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-4xl mb-3">👈</p>
                <p className="text-[14px] font-medium" style={{ color: "var(--apt-text-primary)" }}>Select a section to edit</p>
                <p className="text-[13px] mt-1" style={{ color: "var(--apt-text-muted)" }}>Click any section in the left panel</p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 px-4 py-2.5 rounded-xl shadow-lg text-[13px] font-medium text-white" style={{ background: "#0057b8" }}>
          {toast}
        </div>
      )}

      {/* History modal */}
      {showHistory && (
        <HistoryModal
          onClose={() => setShowHistory(false)}
          onRestore={() => window.location.reload()}
        />
      )}
    </div>
  );
}

/* ─── Editor card wrapper ─────────────────────────────────────────────────── */
function EditorCard({
  title, desc, children, enabled, onToggle, onLabelChange, label,
}: {
  title: string; desc?: string; children: React.ReactNode;
  enabled?: boolean; onToggle?: () => void;
  onLabelChange?: (l: string) => void; label?: string;
}) {
  const [editingLabel, setEditingLabel] = useState(false);

  return (
    <div className="rounded-xl border shadow-sm overflow-hidden" style={{ borderColor: "var(--apt-border)", background: "var(--apt-bg)" }}>
      <div className="flex items-start justify-between gap-3 px-5 py-4 border-b" style={{ borderColor: "var(--apt-border)" }}>
        <div className="flex-1 min-w-0">
          {editingLabel && onLabelChange ? (
            <input
              autoFocus
              value={label ?? title}
              onChange={(e) => onLabelChange(e.target.value)}
              onBlur={() => setEditingLabel(false)}
              onKeyDown={(e) => e.key === "Enter" && setEditingLabel(false)}
              className="text-[15px] font-semibold w-full rounded px-1 focus:outline-none focus:ring-2 focus:ring-[var(--apt-border-focus)]"
              style={{ color: "var(--apt-text-primary)", background: "var(--apt-bg-raised)" }}
            />
          ) : (
            <h2
              className="text-[15px] font-semibold cursor-text"
              style={{ color: "var(--apt-text-primary)" }}
              onDoubleClick={() => onLabelChange && setEditingLabel(true)}
              title={onLabelChange ? "Double-click to rename" : undefined}
            >
              {label || title}
            </h2>
          )}
          {desc && <p className="text-[12px] mt-0.5" style={{ color: "var(--apt-text-muted)" }}>{desc}</p>}
        </div>
        {enabled !== undefined && onToggle && (
          <label className="relative flex items-center gap-2 cursor-pointer shrink-0" title={enabled ? "Section enabled" : "Section disabled"}>
            <span className="text-[12px]" style={{ color: "var(--apt-text-muted)" }}>{enabled ? "Enabled" : "Disabled"}</span>
            <input type="checkbox" checked={enabled} onChange={onToggle} className="sr-only peer" />
            <div className="w-9 h-5 rounded-full transition-colors peer-checked:bg-[#0057b8] bg-gray-300 dark:bg-gray-600" />
            <div className="absolute right-0.5 top-0.5 w-4 h-4 rounded-full bg-white transition-transform peer-checked:-translate-x-4" />
          </label>
        )}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

/* ─── Section editor router ───────────────────────────────────────────────── */
function SectionEditor({ section, onChange }: { section: HpSection; onChange: (s: HpSection) => void }) {
  switch (section.type) {
    case "promo_banners":   return <PromoBannersEditor section={section} onChange={onChange} />;
    case "featured_products": return <FeaturedProductsEditor section={section} onChange={onChange} />;
    case "full_width_banner": return <FullWidthBannerEditor section={section} onChange={onChange} />;
    case "why_choose":     return <WhyChooseEditor section={section} onChange={onChange} />;
    case "stats":          return <StatsEditor section={section} onChange={onChange} />;
    case "cta":            return <CTAEditor section={section} onChange={onChange} />;
    case "resources":      return <ResourcesEditor section={section} onChange={onChange} />;
    case "services_bar":   return <ServicesBarEditor section={section} onChange={onChange} />;
    case "categories":
      return <SectionTextEditor section={section} onChange={onChange} fields={["label", "title", "subtitle", "showViewAll", "limit"]} hint="Categories are pulled live from the database. Configure display options here." />;
    case "brands_ticker":
      return <SectionTextEditor section={section} onChange={onChange} fields={["title", "subtitle", "showViewAll"]} hint="Brand logos are pulled live from the database." />;
    case "industries":
      return <SectionTextEditor section={section} onChange={onChange} fields={["label", "title", "subtitle"]} hint="Industries are pulled live from the database." />;
    case "quick_access":
      return (
        <div className="text-[13px] p-3 rounded-lg border" style={{ borderColor: "var(--apt-border)", color: "var(--apt-text-muted)", background: "var(--apt-bg-raised)" }}>
          Quick access links are configured in the Services Bar editor. The 5 links (Orders, Favourites, Status, Quotes, Support) are shown as icon tiles.
        </div>
      );
    default:
      return <SectionTextEditor section={section} onChange={onChange} />;
  }
}
