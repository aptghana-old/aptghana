"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter }    from "next/navigation";
import Link             from "next/link";
import { useInstantSearch } from "@/hooks/useInstantSearch";
import { AutocompleteProductCard } from "./AutocompleteProductCard";
import type { AutocompleteSuggestion, ProductSearchHit } from "@apt/search";

/* ─── Constants ──────────────────────────────────────────────────────────────── */

const RECENT_KEY = "apt_recent_searches";
const MAX_RECENTS = 5;

const TRENDING_SEARCHES = [
  "Schneider Electric ACB",
  "Variable Speed Drive",
  "MCCB 100A",
  "PLC Modicon M340",
  "Circuit Breaker",
];

const POPULAR_BRANDS = [
  { label: "Schneider Electric", slug: "schneider-electric" },
  { label: "ABB",                slug: "abb" },
  { label: "Siemens",            slug: "siemens" },
  { label: "Eaton",              slug: "eaton" },
  { label: "Legrand",            slug: "legrand" },
];

const POPULAR_CATEGORIES = [
  { label: "Circuit Protection",     href: "/catalog/circuit-protection" },
  { label: "Variable Speed Drives",  href: "/catalog/variable-speed-drives" },
  { label: "PLCs & Controllers",     href: "/catalog/plcs-and-controllers" },
  { label: "Contactors & Starters",  href: "/catalog/contactors-and-starters" },
  { label: "Power Supplies",         href: "/catalog/power-supplies" },
];

/* ─── LocalStorage helpers ───────────────────────────────────────────────────── */

function getRecentSearches(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return (JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]") as string[]).slice(0, MAX_RECENTS);
  } catch { return []; }
}

function addRecentSearch(q: string) {
  if (!q.trim()) return;
  try {
    const prev = getRecentSearches().filter((r) => r !== q.trim());
    localStorage.setItem(RECENT_KEY, JSON.stringify([q.trim(), ...prev].slice(0, 8)));
  } catch { /* noop */ }
}

function clearRecentSearches() {
  try { localStorage.removeItem(RECENT_KEY); } catch { /* noop */ }
}

/* ─── Flat navigation item ───────────────────────────────────────────────────── */

type NavItemType = "search" | "recent" | "trending" | "product" | "brand" | "category";

interface NavItem {
  type:   NavItemType;
  id:     string;
  href:   string;
  label?: string;
  hit?:   ProductSearchHit;
  suggestion?: AutocompleteSuggestion;
}

/* ─── Small icon helpers ─────────────────────────────────────────────────────── */

function Ico({ d, size = 16, sw = 1.75 }: { d: string; size?: number; sw?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={sw}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d={d} />
    </svg>
  );
}

const ICONS = {
  search:    "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
  close:     "M6 18L18 6M6 6l12 12",
  clock:     "M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z",
  trending:  "M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 015.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941",
  tag:       "M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L9.568 3z M6 6h.008v.008H6V6z",
  folder:    "M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z",
  arrowSm:   "M8.25 4.5l7.5 7.5-7.5 7.5",
  arrowRight:"M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3",
};

/* ─── Loading spinner ────────────────────────────────────────────────────────── */

function Spinner() {
  return (
    <div className="flex items-center justify-center py-10">
      <div className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "var(--text-4)", borderTopColor: "transparent" }} />
    </div>
  );
}

/* ─── Section label ──────────────────────────────────────────────────────────── */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-4 pt-3 pb-1.5">
      <span
        className="text-[10px] font-bold uppercase tracking-widest"
        style={{ color: "var(--text-4)" }}
      >
        {children}
      </span>
    </div>
  );
}

/* ─── No-results empty state ─────────────────────────────────────────────────── */

function NoResultsState({ query, onClose }: { query: string; onClose: () => void }) {
  return (
    <div className="px-4 py-5 space-y-4">
      <p className="text-sm text-center" style={{ color: "var(--text-3)" }}>
        No products found for{" "}
        <span className="font-semibold" style={{ color: "var(--text-1)" }}>
          &ldquo;{query}&rdquo;
        </span>
      </p>

      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "var(--text-4)" }}>
          Popular Searches
        </p>
        <div className="flex flex-wrap gap-1.5">
          {TRENDING_SEARCHES.map((t) => (
            <Link
              key={t}
              href={`/search?q=${encodeURIComponent(t)}`}
              onClick={onClose}
              className="px-3 py-1.5 rounded-full text-xs font-medium border transition-colors hover:text-navy-500"
              style={{ background: "var(--bg-raised)", color: "var(--text-2)", borderColor: "var(--border)" }}
            >
              {t}
            </Link>
          ))}
        </div>
      </div>

      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "var(--text-4)" }}>
          Popular Brands
        </p>
        <div className="flex flex-wrap gap-1.5">
          {POPULAR_BRANDS.map((b) => (
            <Link
              key={b.slug}
              href={`/brands/${b.slug}`}
              onClick={onClose}
              className="px-3 py-1.5 rounded-full text-xs font-medium border transition-colors hover:text-navy-500"
              style={{ background: "var(--bg-raised)", color: "var(--text-2)", borderColor: "var(--border)" }}
            >
              {b.label}
            </Link>
          ))}
        </div>
      </div>

      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "var(--text-4)" }}>
          Browse by Category
        </p>
        <div className="flex flex-wrap gap-1.5">
          {POPULAR_CATEGORIES.map((c) => (
            <Link
              key={c.href}
              href={c.href}
              onClick={onClose}
              className="px-3 py-1.5 rounded-full text-xs font-medium border transition-colors hover:text-navy-500"
              style={{ background: "var(--bg-raised)", color: "var(--text-2)", borderColor: "var(--border)" }}
            >
              {c.label}
            </Link>
          ))}
        </div>
      </div>

      <Link
        href="/catalog"
        onClick={onClose}
        className="flex items-center justify-center gap-2 w-full h-10 rounded-xl text-sm font-bold text-white bg-navy-500 hover:bg-navy-400 transition-colors"
      >
        Browse Full Catalogue
        <Ico d={ICONS.arrowRight} size={14} sw={2.5} />
      </Link>
    </div>
  );
}

/* ─── Main component ─────────────────────────────────────────────────────────── */

interface SearchAutocompleteProps {
  /** Extra classes on the outermost wrapper (controls width/positioning) */
  className?: string;
  /** Whether this is in the mobile header row */
  variant?: "desktop" | "mobile";
}

export function SearchAutocomplete({ className, variant = "desktop" }: SearchAutocompleteProps) {
  const router = useRouter();

  const [open,      setOpen]      = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [recents,   setRecents]   = useState<string[]>([]);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef     = useRef<HTMLInputElement>(null);
  const dropdownRef  = useRef<HTMLDivElement>(null);

  const { query, results, loading, setQuery, clear } = useInstantSearch(200);

  // Sync recent searches when opening
  useEffect(() => {
    if (open) setRecents(getRecentSearches());
  }, [open]);

  // Close on outside click/touch
  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent | TouchEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler, { passive: true });
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [open]);

  // Build flat list of keyboard-navigable items
  const buildNavItems = useCallback((): NavItem[] => {
    if (!query.trim()) {
      return [
        ...recents.map((r, i) => ({
          type:  "recent" as const,
          id:    `recent_${i}`,
          href:  `/search?q=${encodeURIComponent(r)}`,
          label: r,
        })),
        ...TRENDING_SEARCHES.map((t, i) => ({
          type:  "trending" as const,
          id:    `trending_${i}`,
          href:  `/search?q=${encodeURIComponent(t)}`,
          label: t,
        })),
      ];
    }

    const items: NavItem[] = [
      { type: "search", id: "search_all", href: `/search?q=${encodeURIComponent(query.trim())}` },
    ];

    if (results) {
      for (const hit of results.products) {
        items.push({
          type: "product",
          id:   `p_${hit.id}`,
          href: `/products/${hit.sku.toLowerCase()}`,
          hit,
        });
      }
      for (const b of results.brands) {
        items.push({ type: "brand", id: `b_${b.id}`, href: b.href, label: b.label, suggestion: b });
      }
      for (const c of results.categories) {
        items.push({ type: "category", id: `c_${c.id}`, href: c.href, label: c.label, suggestion: c });
      }
    }

    return items;
  }, [query, results, recents]);

  const navItems = buildNavItems();

  function close() {
    setOpen(false);
    setActiveIdx(-1);
  }

  function navigate(item: NavItem) {
    const label = item.label ?? item.hit?.name ?? "";
    if (item.type !== "search") addRecentSearch(label);
    if (item.type === "search") addRecentSearch(query.trim());
    close();
    router.push(item.href);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      addRecentSearch(query.trim());
      close();
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        setOpen(true);
        return;
      }
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIdx((i) => Math.min(i + 1, navItems.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIdx((i) => Math.max(i - 1, -1));
        break;
      case "Enter":
        e.preventDefault();
        if (activeIdx >= 0 && navItems[activeIdx]) {
          navigate(navItems[activeIdx]);
        } else if (query.trim()) {
          addRecentSearch(query.trim());
          close();
          router.push(`/search?q=${encodeURIComponent(query.trim())}`);
        }
        break;
      case "Escape":
        e.preventDefault();
        if (open) {
          close();
          inputRef.current?.blur();
        }
        break;
    }
  }

  // Derived state
  const hasQuery   = query.trim().length > 0;
  const hasResults = hasQuery && results && (results.products.length + results.brands.length + results.categories.length) > 0;
  const noResults  = hasQuery && query.trim().length >= 2 && !loading && results && !hasResults;
  const showEmpty  = !hasQuery && (recents.length > 0 || TRENDING_SEARCHES.length > 0);

  // Product item index offset (after the "search all" item at index 0)
  const productOffset   = 1;
  const brandOffset     = productOffset + (results?.products.length ?? 0);
  const categoryOffset  = brandOffset   + (results?.brands.length ?? 0);

  return (
    <div ref={containerRef} className={`relative w-full${className ? ` ${className}` : ""}`}>
      {/* ── Search input form ───────────────────────────────────────────────── */}
      <form onSubmit={handleSubmit} role="search" aria-label="Search products">
        <div
          className="flex w-full rounded-xl overflow-hidden shadow-lg shadow-black/20 ring-1 ring-white/10 focus-within:ring-navy-400/60 transition-shadow"
        >
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIdx(-1);
              if (!open) setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={
              variant === "mobile"
                ? "Search products, brands, part numbers..."
                : "Search products, brands, part numbers, SKUs..."
            }
            className="flex-1 min-w-0 h-11 px-4 bg-white/[0.07] text-sm text-white placeholder-white/30 focus:outline-none focus:bg-white/[0.10] transition-colors"
            autoComplete="off"
            spellCheck={false}
            role="combobox"
            aria-expanded={open}
            aria-controls="search-autocomplete-listbox"
            aria-activedescendant={activeIdx >= 0 ? `sa-item-${activeIdx}` : undefined}
            aria-label="Search products"
            aria-haspopup="listbox"
          />

          {/* Clear button */}
          {query && (
            <button
              type="button"
              onClick={() => {
                clear();
                setActiveIdx(-1);
                inputRef.current?.focus();
              }}
              className="px-2.5 flex items-center justify-center bg-white/[0.07] text-white/30 hover:text-white/60 transition-colors shrink-0"
              aria-label="Clear search"
              tabIndex={-1}
            >
              <Ico d={ICONS.close} size={14} sw={2.5} />
            </button>
          )}

          {/* Search button */}
          <button
            type="submit"
            className={`h-11 shrink-0 bg-navy-500 hover:bg-navy-400 text-white flex items-center gap-2 font-semibold transition-colors ${
              variant === "mobile" ? "px-4" : "px-5 text-sm"
            }`}
            aria-label={variant === "mobile" ? "Search" : undefined}
          >
            <Ico d={ICONS.search} size={17} sw={2.5} />
            {variant === "desktop" && <span>Search</span>}
          </button>
        </div>
      </form>

      {/* ── Autocomplete dropdown ────────────────────────────────────────────── */}
      {open && (
        <div
          ref={dropdownRef}
          id="search-autocomplete-listbox"
          role="listbox"
          aria-label="Search suggestions"
          className="absolute top-full mt-2 left-0 right-0 z-[200] rounded-2xl overflow-hidden"
          style={{
            background:   "var(--bg-surface)",
            border:       "1px solid var(--border)",
            boxShadow:    "0 24px 64px rgba(0,0,0,0.35), 0 4px 16px rgba(0,0,0,0.2)",
            maxHeight:    "min(80dvh, 640px)",
            overflowY:    "auto",
            overscrollBehavior: "contain",
            WebkitOverflowScrolling: "touch",
          } as React.CSSProperties}
        >

          {/* Loading */}
          {loading && <Spinner />}

          {/* ── Empty state: recents + trending ───────────────────────────── */}
          {!loading && showEmpty && (
            <div className="py-1">
              {recents.length > 0 && (
                <div>
                  <div className="px-4 pt-3 pb-1 flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--text-4)" }}>
                      Recent Searches
                    </span>
                    <button
                      type="button"
                      onClick={() => { clearRecentSearches(); setRecents([]); }}
                      className="text-[10px] transition-colors hover:opacity-70"
                      style={{ color: "var(--text-4)" }}
                    >
                      Clear
                    </button>
                  </div>
                  {recents.map((r, i) => (
                    <button
                      key={`recent_${i}`}
                      id={`sa-item-${i}`}
                      role="option"
                      aria-selected={activeIdx === i}
                      type="button"
                      onClick={() => navigate({ type: "recent", id: `recent_${i}`, href: `/search?q=${encodeURIComponent(r)}`, label: r })}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors"
                      style={activeIdx === i ? { background: "var(--bg-raised)" } : undefined}
                    >
                      <span style={{ color: "var(--text-4)" }} className="shrink-0">
                        <Ico d={ICONS.clock} size={15} sw={1.75} />
                      </span>
                      <span className="flex-1 truncate" style={{ color: "var(--text-2)" }}>{r}</span>
                      <span style={{ color: "var(--text-4)" }} className="shrink-0">
                        <Ico d={ICONS.arrowSm} size={13} sw={2.5} />
                      </span>
                    </button>
                  ))}
                </div>
              )}

              <div style={recents.length > 0 ? { borderTop: "1px solid var(--border)" } : undefined}>
                <SectionLabel>Trending Searches</SectionLabel>
                {TRENDING_SEARCHES.map((t, i) => {
                  const idx = recents.length + i;
                  return (
                    <button
                      key={`trending_${i}`}
                      id={`sa-item-${idx}`}
                      role="option"
                      aria-selected={activeIdx === idx}
                      type="button"
                      onClick={() => navigate({ type: "trending", id: `trending_${i}`, href: `/search?q=${encodeURIComponent(t)}`, label: t })}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors"
                      style={activeIdx === idx ? { background: "var(--bg-raised)" } : undefined}
                    >
                      <span style={{ color: "var(--text-4)" }} className="shrink-0">
                        <Ico d={ICONS.trending} size={15} sw={1.75} />
                      </span>
                      <span className="flex-1 truncate" style={{ color: "var(--text-2)" }}>{t}</span>
                      <span style={{ color: "var(--text-4)" }} className="shrink-0">
                        <Ico d={ICONS.arrowSm} size={13} sw={2.5} />
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Query results ─────────────────────────────────────────────── */}
          {!loading && hasQuery && (
            <div>
              {/* Search-all item */}
              <button
                id="sa-item-0"
                role="option"
                aria-selected={activeIdx === 0}
                type="button"
                onClick={() => navigate({ type: "search", id: "search_all", href: `/search?q=${encodeURIComponent(query.trim())}` })}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-left font-semibold transition-colors"
                style={{
                  borderBottom: "1px solid var(--border)",
                  background: activeIdx === 0 ? "var(--bg-raised)" : undefined,
                }}
              >
                <span className="text-navy-500 shrink-0">
                  <Ico d={ICONS.search} size={16} sw={2.5} />
                </span>
                <span className="flex-1 min-w-0" style={{ color: "var(--text-1)" }}>
                  Search&nbsp;<span className="text-navy-500">&ldquo;{query}&rdquo;</span>
                </span>
                {results && results.totalHits > 0 && (
                  <span className="text-[11px] font-normal shrink-0" style={{ color: "var(--text-4)" }}>
                    {results.totalHits.toLocaleString()} results
                  </span>
                )}
                <span style={{ color: "var(--text-4)" }} className="shrink-0">
                  <Ico d={ICONS.arrowSm} size={13} sw={2.5} />
                </span>
              </button>

              {/* Products section */}
              {results && results.products.length > 0 && (
                <div>
                  <SectionLabel>Products</SectionLabel>
                  <div style={{ borderTop: "1px solid var(--border)" }}>
                    {results.products.map((hit, i) => (
                      <AutocompleteProductCard
                        key={hit.id}
                        hit={hit}
                        query={query}
                        onSelect={() => {
                          addRecentSearch(hit.name);
                          close();
                        }}
                        isActive={activeIdx === productOffset + i}
                        id={`sa-item-${productOffset + i}`}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Brands section */}
              {results && results.brands.length > 0 && (
                <div style={{ borderTop: "1px solid var(--border)" }}>
                  <SectionLabel>Brands</SectionLabel>
                  {results.brands.map((brand, i) => {
                    const idx = brandOffset + i;
                    return (
                      <button
                        key={brand.id}
                        id={`sa-item-${idx}`}
                        role="option"
                        aria-selected={activeIdx === idx}
                        type="button"
                        onClick={() => navigate({ type: "brand", id: `b_${brand.id}`, href: brand.href, label: brand.label, suggestion: brand })}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
                        style={activeIdx === idx ? { background: "var(--bg-raised)" } : undefined}
                      >
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                          style={{ background: "var(--bg-raised)" }}
                        >
                          <span className="text-navy-500">
                            <Ico d={ICONS.tag} size={13} sw={1.5} />
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium" style={{ color: "var(--text-1)" }}>{brand.label}</span>
                          {brand.meta && (
                            <span className="text-[11px] ml-2" style={{ color: "var(--text-4)" }}>{brand.meta}</span>
                          )}
                        </div>
                        <span style={{ color: "var(--text-4)" }} className="shrink-0">
                          <Ico d={ICONS.arrowSm} size={13} sw={2.5} />
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Categories section */}
              {results && results.categories.length > 0 && (
                <div style={{ borderTop: "1px solid var(--border)" }}>
                  <SectionLabel>Categories</SectionLabel>
                  {results.categories.map((cat, i) => {
                    const idx = categoryOffset + i;
                    return (
                      <button
                        key={cat.id}
                        id={`sa-item-${idx}`}
                        role="option"
                        aria-selected={activeIdx === idx}
                        type="button"
                        onClick={() => navigate({ type: "category", id: `c_${cat.id}`, href: cat.href, label: cat.label, suggestion: cat })}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
                        style={activeIdx === idx ? { background: "var(--bg-raised)" } : undefined}
                      >
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                          style={{ background: "var(--bg-raised)" }}
                        >
                          <span style={{ color: "var(--text-3)" }}>
                            <Ico d={ICONS.folder} size={13} sw={1.5} />
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium" style={{ color: "var(--text-1)" }}>{cat.label}</span>
                          {cat.meta && (
                            <span className="text-[11px] ml-2" style={{ color: "var(--text-4)" }}>{cat.meta}</span>
                          )}
                        </div>
                        <span style={{ color: "var(--text-4)" }} className="shrink-0">
                          <Ico d={ICONS.arrowSm} size={13} sw={2.5} />
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* No results empty state */}
              {noResults && (
                <NoResultsState query={query} onClose={close} />
              )}

              {/* View all footer */}
              {hasResults && (
                <div
                  className="px-4 py-3"
                  style={{ borderTop: "1px solid var(--border)" }}
                >
                  <Link
                    href={`/search?q=${encodeURIComponent(query.trim())}`}
                    onClick={close}
                    className="flex items-center justify-center gap-2 w-full h-9 rounded-xl text-sm font-semibold text-navy-500 hover:text-navy-400 transition-colors hover:bg-[var(--bg-raised)]"
                  >
                    View all {results?.totalHits.toLocaleString() ?? ""} results for &ldquo;{query}&rdquo;
                    <Ico d={ICONS.arrowRight} size={13} sw={2.5} />
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* ── Keyboard hint bar (hidden on touch devices) ───────────────── */}
          {open && (
            <div
              className="hidden sm:flex items-center gap-4 px-4 py-2 text-[10px]"
              style={{ borderTop: "1px solid var(--border)", color: "var(--text-4)" }}
            >
              {[
                { keys: "↑↓", label: "navigate" },
                { keys: "↵",  label: "select"   },
                { keys: "esc", label: "close"   },
              ].map(({ keys, label }) => (
                <span key={keys} className="flex items-center gap-1">
                  <kbd
                    className="px-1.5 py-0.5 rounded text-[9px] font-mono border"
                    style={{ borderColor: "var(--border)", background: "var(--bg-raised)" }}
                  >
                    {keys}
                  </kbd>
                  {label}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
