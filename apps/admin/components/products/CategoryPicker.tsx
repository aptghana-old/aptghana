"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

export type Selection = Partial<Record<CategoryLevel, CategoryNode>>;

export const LEVELS: { key: CategoryLevel; label: string }[] = [
  { key: "group", label: "Group" },
  { key: "category", label: "Category" },
  { key: "subcategory", label: "Subcategory" },
  { key: "range", label: "Range" },
];

export const LEVEL_INDEX: Record<CategoryLevel, number> = {
  group: 0,
  category: 1,
  subcategory: 2,
  range: 3,
};

/**
 * Returns a copy of `selection` with every level *below* `level` removed.
 * Ancestors (levels at or above `level`) are always preserved untouched —
 * this is the single rule that keeps the hierarchy consistent.
 */
export function clearDescendants<T>(
  selection: Partial<Record<CategoryLevel, T>>,
  level: CategoryLevel
): Partial<Record<CategoryLevel, T>> {
  const idx = LEVEL_INDEX[level];
  const next: Partial<Record<CategoryLevel, T>> = {};
  for (const l of LEVELS) {
    if (LEVEL_INDEX[l.key] <= idx && selection[l.key] !== undefined) {
      next[l.key] = selection[l.key];
    }
  }
  return next;
}

/** Ordered, gap-free chain of selected nodes (Group..deepest), derived purely from `selection`. */
export function chainFromSelection(selection: Selection): CategoryNode[] {
  return LEVELS.map((l) => selection[l.key]).filter(Boolean) as CategoryNode[];
}

/** Builds a `Selection` map from a resolved Group→Range chain (e.g. the `/chain` API response). */
export function selectionFromChainResponse(data: Partial<Record<CategoryLevel, CategoryNode>>): Selection {
  const next: Selection = {};
  for (const l of LEVELS) {
    if (data[l.key]) next[l.key] = data[l.key];
  }
  return next;
}

interface Props {
  /** Currently assigned leaf category id, if any. */
  value?: string | null;
  onChange(leafId: string | null, chain: CategoryNode[]): void;
  disabled?: boolean;
}

/** Cascading Group → Category → Subcategory → Range picker with typeahead search. */
export default function CategoryPicker({ value, onChange, disabled }: Props) {
  const [selection, setSelection] = useState<Selection>({});
  const [options, setOptions] = useState<Partial<Record<CategoryLevel, CategoryNode[]>>>({});
  const [loadingLevel, setLoadingLevel] = useState<CategoryLevel | null>(null);
  const [resolving, setResolving] = useState(Boolean(value));
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  // Always call the *latest* onChange without re-running effects when the
  // parent passes a fresh inline arrow function on every render.
  const onChangeRef = useRef(onChange);
  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);

  // Monotonic token guarding every async hierarchy-changing operation
  // (children fetch per level + chain resolution). Any new action — manual
  // selection, a new search pick, a new `value` to resolve — invalidates
  // whatever was previously in flight, so a slow/late response can never
  // clobber a newer selection.
  const childrenSeq = useRef<Record<CategoryLevel, number>>({ group: 0, category: 0, subcategory: 0, range: 0 });
  const chainSeq = useRef(0);

  const loadChildren = useCallback(async (level: CategoryLevel, parentId?: string) => {
    const seq = ++childrenSeq.current[level];
    setLoadingLevel(level);
    try {
      const qs = parentId ? `?parentId=${parentId}` : "";
      const res = await fetch(`/api/categories/children${qs}`);
      const json = await res.json();
      if (childrenSeq.current[level] !== seq) return; // superseded — discard
      setOptions((prev) => ({ ...prev, [level]: json.children ?? [] }));
    } finally {
      if (childrenSeq.current[level] === seq) {
        setLoadingLevel((cur) => (cur === level ? null : cur));
      }
    }
  }, []);

  /** Resolves a leaf id into its full chain and replaces the entire selection atomically. */
  const resolveChain = useCallback(async (leafId: string) => {
    const seq = ++chainSeq.current;
    setResolving(true);
    try {
      const res = await fetch(`/api/categories/${leafId}/chain`);
      if (!res.ok) return;
      const data = await res.json();
      if (chainSeq.current !== seq) return; // a newer action started — discard this result

      const next = selectionFromChainResponse(data);
      setSelection(next);
      // The root Group list is loaded once on mount and is never tied to a
      // parent selection — only the deeper, parent-dependent lists need to
      // be dropped and re-fetched for the new chain.
      setOptions((prev) => ({ group: prev.group }));
      for (const node of chainFromSelection(next)) {
        const childLevel = LEVELS[LEVEL_INDEX[node.level] + 1]?.key;
        if (childLevel) loadChildren(childLevel, node.id);
      }
    } finally {
      if (chainSeq.current === seq) setResolving(false);
    }
  }, [loadChildren]);

  // Load root groups once on mount. Legitimate data-fetch-on-mount effect —
  // loadChildren's loading flag must be set synchronously so the Group
  // select shows "Loading…" for the very first render frame.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadChildren("group"); }, [loadChildren]);

  // Initialize from an existing assignment (or react to the prop changing).
  // Same justification as above: resolveChain's loading flag must be set
  // synchronously, not deferred behind a microtask, to avoid a flash of
  // unloaded selects.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (value) resolveChain(value);
  }, [value, resolveChain]);

  useEffect(() => {
    if (!searchOpen) return;
    const onDown = (e: PointerEvent) => { if (!rootRef.current?.contains(e.target as Node)) setSearchOpen(false); };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [searchOpen]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    // Empty query: leave any stale results in state — the dropdown is only
    // rendered while `query.trim()` is truthy, so they're never shown.
    if (!query.trim()) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- legitimate debounced-fetch loading flag
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

  const chain = useMemo(() => chainFromSelection(selection), [selection]);

  // Single emission point: fires whenever the derived chain actually changes,
  // never while a chain resolution is still in flight.
  useEffect(() => {
    if (resolving) return;
    const leaf = chain[chain.length - 1] ?? null;
    onChangeRef.current(leaf?.id ?? null, chain);
  }, [chain, resolving]);

  const selectAt = useCallback((level: CategoryLevel, node: CategoryNode | null) => {
    // A manual pick always wins over any chain resolution still in flight.
    chainSeq.current++;

    setSelection((prev) => {
      const kept = clearDescendants(prev, level);
      if (node) kept[level] = node;
      else delete kept[level];
      return kept;
    });

    setOptions((prev) => clearDescendants(prev, level));

    const childLevel = LEVELS[LEVEL_INDEX[level] + 1]?.key;
    if (node && childLevel) loadChildren(childLevel, node.id);
  }, [loadChildren]);

  const pickSearchResult = useCallback((result: SearchResult) => {
    setQuery("");
    setSearchOpen(false);
    resolveChain(result.id);
  }, [resolveChain]);

  return (
    <div ref={rootRef} className="space-y-3">
      {/* Typeahead search */}
      <div className="relative">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--apt-text-muted)" }} />
        <input
          aria-label="Search catalogue hierarchy"
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
          const isLoading = loadingLevel === level.key || (idx === 0 && resolving);
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
                  aria-label={level.label}
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
      <div data-testid="catalogue-breadcrumb" className="flex items-center gap-1.5 flex-wrap text-[12px] px-3 py-2 rounded-md" style={{ background: "var(--apt-bg-subtle)" }}>
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
