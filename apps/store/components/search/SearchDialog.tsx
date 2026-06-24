"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useInstantSearch } from "@/hooks/useInstantSearch";
import { AutocompleteProductCard } from "./AutocompleteProductCard";
import type { AutocompleteSuggestion } from "@apt/search";

/* ─── Icon helper ─────────────────────────────────────────────────────────── */
function Ico({ d, size = 16, sw = 1.75, cls = "" }: { d: string; size?: number; sw?: number; cls?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" className={cls} aria-hidden>
      <path d={d} />
    </svg>
  );
}

const ICONS = {
  search:   "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
  close:    "M6 18L18 6M6 6l12 12",
  arrow:    "M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3",
  tag:      "M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L9.568 3z M6 6h.008v.008H6V6z",
  folder:   "M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z",
  clock:    "M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z",
  trending: "M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 015.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941",
};

const TRENDING = ["Schneider Electric ACB", "Variable Speed Drive", "MCCB 100A", "PLC Modicon M340", "Servo Drive"];
const RECENT_KEY = "apt_recent_searches";

function getRecentSearches(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]").slice(0, 5);
  } catch { return []; }
}

function addRecentSearch(q: string) {
  if (!q.trim()) return;
  try {
    const prev = getRecentSearches().filter((r) => r !== q.trim());
    localStorage.setItem(RECENT_KEY, JSON.stringify([q.trim(), ...prev].slice(0, 8)));
  } catch { /* noop */ }
}

/* ─── Types ───────────────────────────────────────────────────────────────── */
type FlatItem = { key: string; label: string; meta?: string; href?: string; imageUrl?: string; isSearch?: boolean; type?: string };

/* ─── Main component ──────────────────────────────────────────────────────── */
export default function SearchDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router   = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef  = useRef<HTMLDivElement>(null);

  const { query, results, loading, setQuery, clear } = useInstantSearch(180);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [recents,   setRecents]   = useState<string[]>([]);

  // Reset and focus when opened
  useEffect(() => {
    if (open) {
      clear();
      setActiveIdx(-1);
      setRecents(getRecentSearches());
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [open, clear]);

  // Lock body scroll
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // Build flat list of navigable items
  const flatItems = useCallback((): FlatItem[] => {
    if (!query.trim()) {
      return [
        ...recents.map((r, i) => ({ key: `recent_${i}`, label: r, isSearch: true, type: "recent" })),
        ...TRENDING.map((t, i) => ({ key: `trending_${i}`, label: t, isSearch: true, type: "trending" })),
      ];
    }
    if (!results) return [];
    const items: FlatItem[] = [
      { key: "search_all", label: `Search "${query}"`, isSearch: true, type: "search" },
    ];
    // results.products is now ProductSearchHit[]
    for (const h of results.products) {
      items.push({ key: `p_${h.id}`, label: h.name, meta: h.brandName, href: `/products/${h.sku.toLowerCase()}`, imageUrl: h.imageUrl, type: "product" });
    }
    for (const s of results.brands)     items.push({ key: `b_${s.id}`, label: s.label, meta: s.meta, href: s.href, type: "brand" });
    for (const s of results.categories) items.push({ key: `c_${s.id}`, label: s.label, meta: s.meta, href: s.href, type: "category" });
    return items;
  }, [query, results, recents]);

  const items = flatItems();

  function navigate(item: FlatItem) {
    if (item.isSearch) {
      const q = item.label === `Search "${query}"` ? query : item.label;
      addRecentSearch(q);
      onClose();
      router.push(`/search?q=${encodeURIComponent(q.trim())}`);
    } else if (item.href) {
      onClose();
      router.push(item.href);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx((i) => Math.min(i + 1, items.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActiveIdx((i) => Math.max(i - 1, -1)); }
    else if (e.key === "Enter") {
      if (activeIdx >= 0 && items[activeIdx]) { navigate(items[activeIdx]); }
      else if (query.trim()) {
        addRecentSearch(query.trim());
        onClose();
        router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      }
    } else if (e.key === "Escape") { onClose(); }
  }

  if (!open) return null;

  const hasResults = query.trim() && results && (results.products.length + results.brands.length + results.categories.length > 0);
  const isEmpty = query.trim() === "";

  return (
    <div
      className="fixed inset-0 z-[500] flex items-start justify-center pt-[10vh] px-4"
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal
      aria-label="Search"
    >
      <div
        className="w-full max-w-2xl rounded-2xl overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,0.45)] flex flex-col"
        style={{ background: "var(--bg-surface)", maxHeight: "min(80vh, 640px)" }}
      >
        {/* Input row */}
        <div className="flex items-center gap-3 px-5 py-4 shrink-0" style={{ borderBottom: "1px solid var(--border)" }}>
          <Ico d={ICONS.search} size={20} sw={2} cls="text-(--text-3) shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setActiveIdx(-1); }}
            onKeyDown={handleKeyDown}
            placeholder="Search products, part numbers, brands…"
            className="flex-1 bg-transparent text-base text-(--text-1) placeholder:text-(--text-4) focus:outline-none"
            autoComplete="off"
            aria-label="Search"
            aria-autocomplete="list"
            aria-controls="search-listbox"
            aria-activedescendant={activeIdx >= 0 ? `search-item-${activeIdx}` : undefined}
          />
          {query && (
            <button onClick={() => clear()} className="text-(--text-4) hover:text-(--text-2) transition-colors" aria-label="Clear">
              <Ico d={ICONS.close} size={16} sw={2.5} />
            </button>
          )}
          <button
            onClick={onClose}
            className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-md text-[11px] text-(--text-3) hover:text-(--text-1) border transition-colors"
            style={{ borderColor: "var(--border)", background: "var(--bg-raised)" }}
          >
            Esc
          </button>
        </div>

        {/* Suggestions */}
        <div ref={listRef} id="search-listbox" role="listbox" className="flex-1 overflow-y-auto py-2">

          {/* Loading indicator */}
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="w-5 h-5 rounded-full border-2 border-navy-500 border-t-transparent animate-spin" />
            </div>
          )}

          {/* Empty state: recent + trending */}
          {!loading && isEmpty && (
            <>
              {recents.length > 0 && (
                <section className="mb-1">
                  <div className="px-5 py-1.5 text-[10px] font-bold uppercase tracking-widest text-(--text-4)">Recent</div>
                  {recents.map((r, i) => {
                    const idx = i;
                    return (
                      <button
                        key={`recent_${i}`}
                        id={`search-item-${idx}`}
                        role="option"
                        aria-selected={activeIdx === idx}
                        onClick={() => navigate({ key: `recent_${i}`, label: r, isSearch: true })}
                        className={`w-full flex items-center gap-3 px-5 py-2.5 text-sm text-left transition-colors ${activeIdx === idx ? "bg-(--bg-raised)" : "hover:bg-(--bg-raised)"}`}
                      >
                        <Ico d={ICONS.clock} size={15} cls="text-(--text-4) shrink-0" />
                        <span className="text-(--text-2)">{r}</span>
                        <Ico d={ICONS.arrow} size={13} cls="text-(--text-4) ml-auto shrink-0" />
                      </button>
                    );
                  })}
                </section>
              )}
              <section>
                <div className="px-5 py-1.5 text-[10px] font-bold uppercase tracking-widest text-(--text-4)">Trending</div>
                {TRENDING.map((t, i) => {
                  const idx = recents.length + i;
                  return (
                    <button
                      key={`trending_${i}`}
                      id={`search-item-${idx}`}
                      role="option"
                      aria-selected={activeIdx === idx}
                      onClick={() => navigate({ key: `trending_${i}`, label: t, isSearch: true })}
                      className={`w-full flex items-center gap-3 px-5 py-2.5 text-sm text-left transition-colors ${activeIdx === idx ? "bg-(--bg-raised)" : "hover:bg-(--bg-raised)"}`}
                    >
                      <Ico d={ICONS.trending} size={15} cls="text-(--text-4) shrink-0" />
                      <span className="text-(--text-2)">{t}</span>
                      <Ico d={ICONS.arrow} size={13} cls="text-(--text-4) ml-auto shrink-0" />
                    </button>
                  );
                })}
              </section>
            </>
          )}

          {/* Search-all item */}
          {!loading && query.trim() && (
            <button
              id="search-item-0"
              role="option"
              aria-selected={activeIdx === 0}
              onClick={() => navigate({ key: "search_all", label: `Search "${query}"`, isSearch: true })}
              className={`w-full flex items-center gap-3 px-5 py-3 text-sm text-left font-semibold transition-colors ${activeIdx === 0 ? "bg-(--bg-raised)" : "hover:bg-(--bg-raised)"}`}
            >
              <Ico d={ICONS.search} size={16} sw={2.5} cls="text-navy-500 shrink-0" />
              <span className="text-(--text-1)">Search <span className="text-navy-500">&ldquo;{query}&rdquo;</span></span>
              <Ico d={ICONS.arrow} size={13} cls="text-(--text-4) ml-auto shrink-0" />
            </button>
          )}

          {/* Product results */}
          {!loading && hasResults && results!.products.length > 0 && (
            <section className="mt-1">
              <div className="px-5 py-1.5 text-[10px] font-bold uppercase tracking-widest text-(--text-4)">Products</div>
              {results!.products.map((hit, i) => {
                const idx = 1 + i;
                return (
                  <AutocompleteProductCard
                    key={hit.id}
                    hit={hit}
                    query={query}
                    onSelect={() => {
                      navigate({ key: `p_${hit.id}`, label: hit.name, href: `/products/${hit.sku.toLowerCase()}` });
                    }}
                    isActive={activeIdx === idx}
                    id={`search-item-${idx}`}
                  />
                );
              })}
            </section>
          )}

          {/* Brand results */}
          {!loading && hasResults && results!.brands.length > 0 && (
            <section className="mt-1">
              <div className="px-5 py-1.5 text-[10px] font-bold uppercase tracking-widest text-(--text-4)">Brands</div>
              {results!.brands.map((s: AutocompleteSuggestion, i: number) => {
                const offset = 1 + (results?.products.length ?? 0);
                const idx = offset + i;
                return (
                  <button
                    key={s.id}
                    id={`search-item-${idx}`}
                    role="option"
                    aria-selected={activeIdx === idx}
                    onClick={() => navigate({ key: `b_${s.id}`, label: s.label, href: s.href })}
                    className={`w-full flex items-center gap-3 px-5 py-2.5 text-left transition-colors ${activeIdx === idx ? "bg-(--bg-raised)" : "hover:bg-(--bg-raised)"}`}
                  >
                    <div className="w-8 h-8 rounded flex items-center justify-center shrink-0" style={{ background: "var(--bg-raised)" }}>
                      <Ico d={ICONS.tag} size={14} sw={1.5} cls="text-navy-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-(--text-1) truncate">{s.label}</div>
                      {s.meta && <div className="text-[11px] text-(--text-4)">{s.meta}</div>}
                    </div>
                    <Ico d={ICONS.arrow} size={13} cls="text-(--text-4) shrink-0" />
                  </button>
                );
              })}
            </section>
          )}

          {/* Category results */}
          {!loading && hasResults && results!.categories.length > 0 && (
            <section className="mt-1 pb-2">
              <div className="px-5 py-1.5 text-[10px] font-bold uppercase tracking-widest text-(--text-4)">Categories</div>
              {results!.categories.map((s: AutocompleteSuggestion, i: number) => {
                const offset = 1 + (results?.products.length ?? 0) + (results?.brands.length ?? 0);
                const idx = offset + i;
                return (
                  <button
                    key={s.id}
                    id={`search-item-${idx}`}
                    role="option"
                    aria-selected={activeIdx === idx}
                    onClick={() => navigate({ key: `c_${s.id}`, label: s.label, href: s.href })}
                    className={`w-full flex items-center gap-3 px-5 py-2.5 text-left transition-colors ${activeIdx === idx ? "bg-(--bg-raised)" : "hover:bg-(--bg-raised)"}`}
                  >
                    <div className="w-8 h-8 rounded flex items-center justify-center shrink-0" style={{ background: "var(--bg-raised)" }}>
                      <Ico d={ICONS.folder} size={14} sw={1.5} cls="text-(--text-3)" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-(--text-1) truncate">{s.label}</div>
                      {s.meta && <div className="text-[11px] text-(--text-4)">{s.meta}</div>}
                    </div>
                    <Ico d={ICONS.arrow} size={13} cls="text-(--text-4) shrink-0" />
                  </button>
                );
              })}
            </section>
          )}

          {/* No results */}
          {!loading && query.trim().length >= 2 && results && !hasResults && (
            <div className="py-8 text-center text-sm text-(--text-3)">
              No suggestions for <span className="font-semibold text-(--text-2)">&ldquo;{query}&rdquo;</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="px-5 py-2.5 flex items-center gap-4 text-[11px] text-(--text-4) shrink-0"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <span className="flex items-center gap-1.5"><kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono border" style={{ borderColor: "var(--border)", background: "var(--bg-raised)" }}>↑↓</kbd> navigate</span>
          <span className="flex items-center gap-1.5"><kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono border" style={{ borderColor: "var(--border)", background: "var(--bg-raised)" }}>↵</kbd> select</span>
          <span className="flex items-center gap-1.5"><kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono border" style={{ borderColor: "var(--border)", background: "var(--bg-raised)" }}>esc</kbd> close</span>
        </div>
      </div>
    </div>
  );
}
