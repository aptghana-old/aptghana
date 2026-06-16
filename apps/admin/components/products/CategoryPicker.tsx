"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronRight, Search, X, Loader2, FolderTree, Check } from "lucide-react";

export type CategoryLevel = "group" | "category" | "subcategory" | "range";

export interface CategoryNode {
  id: string;
  name: string;
  slug: string;
  level: CategoryLevel;
  hasChildren?: boolean;
}

interface SearchResult extends CategoryNode {
  breadcrumb: { name: string; slug: string }[];
}

const LEVELS: { key: CategoryLevel; label: string }[] = [
  { key: "group", label: "Group" },
  { key: "category", label: "Category" },
  { key: "subcategory", label: "Subcategory" },
  { key: "range", label: "Range" },
];

interface Props {
  /** Currently assigned leaf category id, if any. */
  value?: string | null;
  onChange(leafId: string | null, chain: CategoryNode[]): void;
  disabled?: boolean;
}

/** Cascading Group → Category → Subcategory → Range picker with typeahead search. */
export default function CategoryPicker({ value, onChange, disabled }: Props) {
  const [selection, setSelection] = useState<Partial<Record<CategoryLevel, CategoryNode>>>({});
  const [options, setOptions] = useState<Partial<Record<CategoryLevel, CategoryNode[]>>>({});
  const [loadingLevel, setLoadingLevel] = useState<CategoryLevel | null>(null);
  const [initializing, setInitializing] = useState(Boolean(value));
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const loadChildren = useCallback(async (level: CategoryLevel, parentId?: string) => {
    setLoadingLevel(level);
    try {
      const qs = parentId ? `?parentId=${parentId}` : "";
      const res = await fetch(`/api/categories/children${qs}`);
      const json = await res.json();
      setOptions((prev) => ({ ...prev, [level]: json.children ?? [] }));
    } finally {
      setLoadingLevel(null);
    }
  }, []);

  // Load root groups on mount
  useEffect(() => { loadChildren("group"); }, [loadChildren]);

  // Initialize from an existing assignment
  useEffect(() => {
    if (!value) { setInitializing(false); return; }
    (async () => {
      try {
        const res = await fetch(`/api/categories/${value}/chain`);
        if (!res.ok) return;
        const data = await res.json();
        const next: Partial<Record<CategoryLevel, CategoryNode>> = {};
        if (data.group) next.group = data.group;
        if (data.category) next.category = data.category;
        if (data.subcategory) next.subcategory = data.subcategory;
        if (data.range) next.range = data.range;
        setSelection(next);
        if (next.group) loadChildren("category", next.group.id);
        if (next.category) loadChildren("subcategory", next.category.id);
        if (next.subcategory) loadChildren("range", next.subcategory.id);
      } finally {
        setInitializing(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  useEffect(() => {
    if (!searchOpen) return;
    const onDown = (e: PointerEvent) => { if (!rootRef.current?.contains(e.target as Node)) setSearchOpen(false); };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [searchOpen]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) { setSearchResults([]); return; }
    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/categories/search?q=${encodeURIComponent(query)}`);
        const json = await res.json();
        setSearchResults(json.results ?? []);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  function emit(next: Partial<Record<CategoryLevel, CategoryNode>>) {
    const chain = LEVELS.map((l) => next[l.key]).filter(Boolean) as CategoryNode[];
    const leaf = chain[chain.length - 1] ?? null;
    onChange(leaf?.id ?? null, chain);
  }

  function selectAt(level: CategoryLevel, node: CategoryNode | null) {
    const idx = LEVELS.findIndex((l) => l.key === level);
    const next: Partial<Record<CategoryLevel, CategoryNode>> = {};
    for (let i = 0; i < idx; i++) next[LEVELS[i].key] = selection[LEVELS[i].key];
    if (node) next[level] = node;
    setSelection(next);
    emit(next);

    // Clear and lazy-load the next level down
    setOptions((prev) => {
      const copy = { ...prev };
      for (let i = idx + 1; i < LEVELS.length; i++) delete copy[LEVELS[i].key];
      return copy;
    });
    const childLevel = LEVELS[idx + 1]?.key;
    if (node && childLevel) loadChildren(childLevel, node.id);
  }

  async function pickSearchResult(result: SearchResult) {
    setQuery("");
    setSearchOpen(false);
    setInitializing(true);
    try {
      const res = await fetch(`/api/categories/${result.id}/chain`);
      const data = await res.json();
      const next: Partial<Record<CategoryLevel, CategoryNode>> = {};
      if (data.group) next.group = data.group;
      if (data.category) next.category = data.category;
      if (data.subcategory) next.subcategory = data.subcategory;
      if (data.range) next.range = data.range;
      setSelection(next);
      emit(next);
      if (next.group) loadChildren("category", next.group.id);
      if (next.category) loadChildren("subcategory", next.category.id);
      if (next.subcategory) loadChildren("range", next.subcategory.id);
    } finally {
      setInitializing(false);
    }
  }

  const chain = LEVELS.map((l) => selection[l.key]).filter(Boolean) as CategoryNode[];

  return (
    <div ref={rootRef} className="space-y-3">
      {/* Typeahead search */}
      <div className="relative">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--apt-text-muted)" }} />
        <input
          value={query}
          disabled={disabled}
          onChange={(e) => { setQuery(e.target.value); setSearchOpen(true); }}
          onFocus={() => setSearchOpen(true)}
          placeholder="Jump to a Group, Category, Subcategory, or Range…"
          className="w-full h-9 pl-8 pr-8 rounded-md text-[13px] border focus:outline-none focus:ring-2"
          style={{ background: "var(--apt-bg)", border: "1px solid var(--apt-border)", color: "var(--apt-text-primary)" }}
        />
        {searching && <Loader2 size={13} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin" style={{ color: "var(--apt-text-muted)" }} />}
        {!searching && query && (
          <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "var(--apt-text-muted)" }}>
            <X size={13} />
          </button>
        )}

        {searchOpen && query.trim() && (
          <div
            className="absolute left-0 right-0 top-full mt-1 z-30 max-h-72 overflow-y-auto rounded-lg py-1"
            style={{ background: "var(--apt-bg)", border: "1px solid var(--apt-border-strong)", boxShadow: "0 12px 32px rgba(0,0,0,0.18)" }}
          >
            {searchResults.length === 0 ? (
              <p className="px-3 py-3 text-[12px]" style={{ color: "var(--apt-text-muted)" }}>
                {searching ? "Searching…" : `No matches for "${query}"`}
              </p>
            ) : (
              searchResults.map((r) => (
                <button
                  key={r.id}
                  onClick={() => pickSearchResult(r)}
                  className="w-full flex items-center justify-between gap-3 px-3 py-2 text-left transition-colors hover:bg-[var(--apt-bg-raised)]"
                >
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium" style={{ color: "var(--apt-text-primary)" }}>{r.name}</p>
                    <p className="text-[11px] truncate" style={{ color: "var(--apt-text-muted)" }}>
                      {[...r.breadcrumb.map((b) => b.name)].join(" / ") || "Top level"}
                    </p>
                  </div>
                  <span className="text-[10px] uppercase tracking-wide font-semibold shrink-0" style={{ color: "var(--apt-text-muted)" }}>{r.level}</span>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Cascading level selects */}
      <div className="grid sm:grid-cols-2 gap-3">
        {LEVELS.map((level, idx) => {
          const parent = idx > 0 ? selection[LEVELS[idx - 1].key] : undefined;
          const locked = idx > 0 && !parent;
          const list = options[level.key] ?? [];
          const isLoading = loadingLevel === level.key || (idx === 0 && initializing);
          if (level.key === "range" && !locked && list.length === 0 && !isLoading && !selection.range) {
            return (
              <div key={level.key} className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium" style={{ color: "var(--apt-text-primary)" }}>Range</label>
                <p className="text-[12px] h-9 flex items-center px-3 rounded-md" style={{ background: "var(--apt-bg-subtle)", color: "var(--apt-text-muted)" }}>No ranges — optional</p>
              </div>
            );
          }
          return (
            <div key={level.key} className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium" style={{ color: "var(--apt-text-primary)" }}>
                {level.label}{level.key !== "range" && level.key !== "group" ? " (optional)" : ""}
              </label>
              <div className="relative">
                <select
                  disabled={disabled || locked || isLoading}
                  value={selection[level.key]?.id ?? ""}
                  onChange={(e) => {
                    const node = list.find((n) => n.id === e.target.value) ?? null;
                    selectAt(level.key, node);
                  }}
                  className="w-full h-9 px-3 rounded-md text-[13px] border appearance-none disabled:opacity-50"
                  style={{ background: "var(--apt-bg)", border: "1px solid var(--apt-border)", color: "var(--apt-text-primary)" }}
                >
                  <option value="">{locked ? "Select parent first" : isLoading ? "Loading…" : `Select ${level.label.toLowerCase()}…`}</option>
                  {list.map((n) => <option key={n.id} value={n.id}>{n.name}</option>)}
                </select>
                {isLoading && <Loader2 size={13} className="absolute right-8 top-1/2 -translate-y-1/2 animate-spin" style={{ color: "var(--apt-text-muted)" }} />}
              </div>
            </div>
          );
        })}
      </div>

      {/* Breadcrumb preview */}
      <div className="flex items-center gap-1.5 flex-wrap text-[12px] px-3 py-2 rounded-md" style={{ background: "var(--apt-bg-subtle)" }}>
        <FolderTree size={13} style={{ color: "var(--apt-text-muted)" }} />
        {chain.length === 0 ? (
          <span style={{ color: "var(--apt-text-muted)" }}>Not assigned to a catalogue path</span>
        ) : (
          chain.map((c, i) => (
            <span key={c.id} className="flex items-center gap-1.5">
              {i > 0 && <ChevronRight size={11} style={{ color: "var(--apt-text-muted)" }} />}
              <span style={{ color: i === chain.length - 1 ? "var(--apt-text-primary)" : "var(--apt-text-secondary)", fontWeight: i === chain.length - 1 ? 600 : 400 }}>{c.name}</span>
            </span>
          ))
        )}
        {chain.length > 0 && <Check size={12} style={{ color: "#16a34a" }} className="ml-auto" />}
      </div>
    </div>
  );
}
