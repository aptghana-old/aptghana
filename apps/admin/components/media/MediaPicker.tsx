"use client";

import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  type KeyboardEvent,
} from "react";
import { createPortal } from "react-dom";
import {
  X,
  Search,
  Upload,
  Grid3X3,
  List,
  LayoutList,
  Check,
  Star,
  RefreshCw,
} from "lucide-react";
import type { Asset, MediaType, ViewMode, SortOption } from "./types";
import { MEDIA_TYPE_LABELS } from "./types";
import { AssetPreview } from "./AssetPreview";
import { formatBytes, formatRelative, getMediaType, debounce } from "./utils";
import { UploadManager } from "./UploadManager";

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

export interface MediaPickerProps {
  /** Whether the picker dialog is open */
  open: boolean;
  /** Called when the user closes without selecting */
  onClose: () => void;
  /** Called when the user confirms selection */
  onSelect: (assets: Asset[]) => void;
  /** Allow selecting more than one asset */
  multiple?: boolean;
  /** Restrict visible/selectable assets to these media types */
  accept?: MediaType | MediaType[];
  /** Pre-select a folder filter */
  defaultFolder?: string;
  /** Dialog title */
  title?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function MediaPicker({
  open,
  onClose,
  onSelect,
  multiple = false,
  accept,
  defaultFolder,
  title = "Select Asset",
}: MediaPickerProps) {
  const [assets, setAssets]           = useState<Asset[]>([]);
  const [total, setTotal]             = useState(0);
  const [page, setPage]               = useState(1);
  const [loading, setLoading]         = useState(false);
  const [query, setQuery]             = useState("");
  const [folder, setFolder]           = useState<string>(defaultFolder ?? "");
  const [mediaType, setMediaType]     = useState<string>("");
  const [sort, setSort]               = useState<SortOption>("newest");
  const [viewMode, setViewMode]       = useState<ViewMode>("grid");
  const [selected, setSelected]       = useState<Set<string>>(new Set());
  const [uploadOpen, setUploadOpen]   = useState(false);
  const [preview, setPreview]         = useState<Asset | null>(null);
  const [mounted, setMounted]         = useState(false);

  const abortRef  = useRef<AbortController | null>(null);
  const inputRef  = useRef<HTMLInputElement>(null);
  const gridRef   = useRef<HTMLDivElement>(null);

  const acceptArr = useMemo<MediaType[] | undefined>(
    () =>
      accept == null
        ? undefined
        : Array.isArray(accept)
        ? accept
        : [accept],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(accept)],
  );

  // ── Reset & refetch on open ─────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    setMounted(true);
    setAssets([]);
    setTotal(0);
    setPage(1);
    setSelected(new Set());
    setPreview(null);
    setQuery("");
    setFolder(defaultFolder ?? "");
    setMediaType(acceptArr?.length === 1 ? acceptArr[0] : "");
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Fetch assets ────────────────────────────────────────────────────────
  const fetchAssets = useCallback(
    async (reset = false, pg = 1, q = query) => {
      abortRef.current?.abort();
      abortRef.current = new AbortController();

      setLoading(true);

      try {
        const params = new URLSearchParams();
        params.set("page",  String(pg));
        params.set("limit", "48");
        params.set("sort",  sort);
        params.set("status", "active");
        if (q)         params.set("query",     q);
        if (folder)    params.set("folder",    folder);
        if (mediaType) params.set("mediaType", mediaType);

        const endpoint = q ? "/api/assets/search" : "/api/assets";
        const res      = await fetch(`${endpoint}?${params}`, {
          signal: abortRef.current.signal,
        });
        if (!res.ok) throw new Error("Fetch failed");

        const json = await res.json() as { assets: Asset[]; total: number };

        // Attach computed mediaType if missing
        const enriched = json.assets.map((a) => ({
          ...a,
          mediaType: a.mediaType ?? getMediaType(a.mimetype),
        }));

        // Filter by accept constraint client-side (belt-and-suspenders)
        const filtered = acceptArr
          ? enriched.filter((a) => acceptArr.includes(a.mediaType as MediaType))
          : enriched;

        setAssets((prev) => (reset ? filtered : [...prev, ...filtered]));
        setTotal(json.total);
        setPage(pg);
      } catch (err) {
        if ((err as Error).name !== "AbortError") console.error(err);
      } finally {
        setLoading(false);
      }
    },
    [sort, folder, mediaType, query, acceptArr], // eslint-disable-line react-hooks/exhaustive-deps
  );

  // ── Debounced query search ──────────────────────────────────────────────
  const debouncedSearch = useRef(
    debounce((q: string) => { fetchAssets(true, 1, q); }, 300),
  ).current;

  useEffect(() => {
    if (!open) return;
    fetchAssets(true, 1);
  }, [open, sort, folder, mediaType]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Keyboard: Escape closes ─────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    const handle = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [open, onClose]);

  // ── Infinite scroll ─────────────────────────────────────────────────────
  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!sentinelRef.current) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !loading && assets.length < total) {
          void fetchAssets(false, page + 1);
        }
      },
      { rootMargin: "200px" },
    );
    obs.observe(sentinelRef.current);
    return () => obs.disconnect();
  }, [loading, assets.length, total, page, fetchAssets]);

  // ── Selection helpers ───────────────────────────────────────────────────
  const toggleSelect = (id: string) => {
    if (!multiple) {
      setSelected(new Set([id]));
      setPreview(assets.find((a) => a._id === id) ?? null);
      return;
    }
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
    setPreview(assets.find((a) => a._id === id) ?? null);
  };

  const handleConfirm = () => {
    const chosen = assets.filter((a) => selected.has(a._id));
    if (chosen.length === 0) return;
    onSelect(chosen);
    onClose();
  };

  const handleUploadComplete = (uploaded: Asset[]) => {
    if (uploaded.length > 0) {
      setAssets((prev) => [...uploaded, ...prev]);
      setTotal((t) => t + uploaded.length);
      // Auto-select the newly uploaded asset(s)
      const ids = new Set(uploaded.map((a) => a._id));
      setSelected(ids);
      setPreview(uploaded[0] ?? null);
    }
  };

  if (!mounted || !open) return null;

  const typeOptions: Array<{ value: string; label: string }> = [
    { value: "", label: "All Types" },
    ...(acceptArr
      ? acceptArr.map((t) => ({ value: t, label: MEDIA_TYPE_LABELS[t] ?? t }))
      : Object.entries(MEDIA_TYPE_LABELS).map(([v, l]) => ({ value: v, label: l }))),
  ];

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[9000] bg-black/60 backdrop-blur-sm"
        aria-hidden
        onClick={onClose}
      />

      {/* Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="fixed z-[9001] inset-4 sm:inset-8 lg:inset-12 flex flex-col rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: "var(--apt-bg)", border: "1px solid var(--apt-border)" }}
      >
        {/* ── Header ──────────────────────────────────────────────────── */}
        <div
          className="flex items-center gap-3 px-5 py-4 shrink-0"
          style={{ borderBottom: "1px solid var(--apt-border)" }}
        >
          <div className="flex-1 min-w-0">
            <h2 className="text-[15px] font-semibold" style={{ color: "var(--apt-text-primary)" }}>
              {title}
            </h2>
            {multiple && (
              <p className="text-[11px] mt-0.5" style={{ color: "var(--apt-text-muted)" }}>
                {selected.size > 0 ? `${selected.size} selected` : "Click assets to select"}
              </p>
            )}
          </div>

          {/* View toggles */}
          <div className="hidden sm:flex items-center gap-1 p-1 rounded-lg" style={{ background: "var(--apt-bg-subtle)" }}>
            {(["grid", "list", "compact"] as const).map((m) => {
              const icons = { grid: <Grid3X3 size={14} />, list: <List size={14} />, compact: <LayoutList size={14} /> };
              return (
                <button
                  key={m}
                  onClick={() => setViewMode(m)}
                  className="p-1.5 rounded-md transition-colors"
                  style={{
                    background: viewMode === m ? "var(--apt-bg)" : "transparent",
                    color: viewMode === m ? "var(--apt-text-primary)" : "var(--apt-text-muted)",
                    boxShadow: viewMode === m ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                  }}
                >
                  {icons[m]}
                </button>
              );
            })}
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors hover:bg-[var(--apt-bg-subtle)]"
            style={{ color: "var(--apt-text-muted)" }}
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Toolbar ─────────────────────────────────────────────────── */}
        <div
          className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 px-5 py-3 shrink-0"
          style={{ borderBottom: "1px solid var(--apt-border)", background: "var(--apt-bg-subtle)" }}
        >
          {/* Search */}
          <div className="relative flex-1 min-w-0">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--apt-text-muted)" }} />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search assets…"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                debouncedSearch(e.target.value);
              }}
              onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                if (e.key === "Enter") fetchAssets(true, 1, query);
              }}
              className="w-full pl-9 pr-3 py-2 rounded-lg text-[13px] outline-none transition-colors"
              style={{
                background: "var(--apt-bg)",
                border: "1px solid var(--apt-border)",
                color: "var(--apt-text-primary)",
              }}
            />
          </div>

          {/* Type filter */}
          <select
            value={mediaType}
            onChange={(e) => setMediaType(e.target.value)}
            className="px-3 py-2 rounded-lg text-[12px] outline-none transition-colors"
            style={{
              background: "var(--apt-bg)",
              border: "1px solid var(--apt-border)",
              color: "var(--apt-text-secondary)",
            }}
          >
            {typeOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          {/* Sort */}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOption)}
            className="px-3 py-2 rounded-lg text-[12px] outline-none transition-colors"
            style={{
              background: "var(--apt-bg)",
              border: "1px solid var(--apt-border)",
              color: "var(--apt-text-secondary)",
            }}
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="name">Name</option>
            <option value="size">Size</option>
            <option value="popular">Popular</option>
          </select>

          {/* Upload */}
          <button
            onClick={() => setUploadOpen(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-medium transition-colors shrink-0"
            style={{ background: "#0057b8", color: "#ffffff" }}
          >
            <Upload size={13} />
            <span className="hidden sm:inline">Upload</span>
          </button>
        </div>

        {/* ── Body ────────────────────────────────────────────────────── */}
        <div className="flex flex-1 min-h-0">
          {/* Asset grid / list */}
          <div
            ref={gridRef}
            className="flex-1 overflow-y-auto p-4"
            style={{ scrollbarGutter: "stable" }}
          >
            {viewMode === "grid" && (
              <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))" }}>
                {assets.map((asset) => (
                  <PickerGridCard
                    key={asset._id}
                    asset={asset}
                    selected={selected.has(asset._id)}
                    onToggle={toggleSelect}
                  />
                ))}
              </div>
            )}

            {viewMode === "list" && (
              <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--apt-border)" }}>
                {assets.map((asset) => (
                  <PickerListRow
                    key={asset._id}
                    asset={asset}
                    selected={selected.has(asset._id)}
                    onToggle={toggleSelect}
                  />
                ))}
              </div>
            )}

            {viewMode === "compact" && (
              <div className="space-y-0.5">
                {assets.map((asset) => (
                  <PickerCompactRow
                    key={asset._id}
                    asset={asset}
                    selected={selected.has(asset._id)}
                    onToggle={toggleSelect}
                  />
                ))}
              </div>
            )}

            {/* Empty */}
            {!loading && assets.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "var(--apt-bg-subtle)" }}>
                  <Search size={24} style={{ color: "var(--apt-text-muted)" }} />
                </div>
                <p className="text-[13px]" style={{ color: "var(--apt-text-muted)" }}>
                  {query ? `No results for "${query}"` : "No assets found"}
                </p>
                <button
                  onClick={() => setUploadOpen(true)}
                  className="text-[12px] font-medium underline underline-offset-2"
                  style={{ color: "#0057b8" }}
                >
                  Upload your first asset
                </button>
              </div>
            )}

            {/* Infinite scroll sentinel + spinner */}
            <div ref={sentinelRef} className="flex items-center justify-center py-4">
              {loading && (
                <RefreshCw size={16} className="animate-spin" style={{ color: "var(--apt-text-muted)" }} />
              )}
              {!loading && assets.length > 0 && assets.length >= total && (
                <p className="text-[11px]" style={{ color: "var(--apt-text-muted)" }}>
                  All {total} asset{total !== 1 ? "s" : ""} loaded
                </p>
              )}
            </div>
          </div>

          {/* Preview panel — shown on md+ when something is hovered/selected */}
          {preview && (
            <aside
              className="hidden lg:flex flex-col w-[240px] shrink-0 overflow-y-auto"
              style={{ borderLeft: "1px solid var(--apt-border)" }}
            >
              <PreviewPanel asset={preview} selected={selected.has(preview._id)} onToggle={toggleSelect} />
            </aside>
          )}
        </div>

        {/* ── Footer ──────────────────────────────────────────────────── */}
        <div
          className="flex items-center justify-between gap-4 px-5 py-4 shrink-0"
          style={{ borderTop: "1px solid var(--apt-border)", background: "var(--apt-bg-subtle)" }}
        >
          <p className="text-[12px]" style={{ color: "var(--apt-text-muted)" }}>
            {total > 0 ? `${total.toLocaleString()} asset${total !== 1 ? "s" : ""}` : ""}
            {selected.size > 0 && ` · ${selected.size} selected`}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-[13px] font-medium transition-colors"
              style={{
                background: "var(--apt-bg)",
                border: "1px solid var(--apt-border)",
                color: "var(--apt-text-secondary)",
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={selected.size === 0}
              className="px-5 py-2 rounded-lg text-[13px] font-semibold transition-all"
              style={{
                background: selected.size > 0 ? "#0057b8" : "var(--apt-bg-raised)",
                color:      selected.size > 0 ? "#ffffff"  : "var(--apt-text-muted)",
                cursor:     selected.size > 0 ? "pointer"  : "not-allowed",
              }}
            >
              {selected.size > 1
                ? `Select ${selected.size} assets`
                : selected.size === 1
                ? "Select asset"
                : "Select"}
            </button>
          </div>
        </div>
      </div>

      {/* Upload sub-modal */}
      {uploadOpen && (
        <UploadManager
          defaultFolder={folder || "uploads"}
          onClose={() => setUploadOpen(false)}
          onUploadComplete={handleUploadComplete}
        />
      )}
    </>,
    document.body,
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function PickerGridCard({
  asset, selected, onToggle,
}: { asset: Asset; selected: boolean; onToggle: (id: string) => void }) {
  return (
    <button
      type="button"
      onClick={() => onToggle(asset._id)}
      className={`relative rounded-xl overflow-hidden text-left transition-all w-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0057b8] ${
        selected ? "ring-2 ring-[#0057b8] ring-offset-1" : "hover:shadow-md"
      }`}
      style={{ border: "1px solid var(--apt-border)", background: "var(--apt-bg)" }}
    >
      {/* Check badge */}
      <div
        className={`absolute top-1.5 left-1.5 z-10 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
          selected ? "border-[#0057b8] bg-[#0057b8]" : "border-white/70 bg-white/80 opacity-0 group-hover:opacity-100"
        }`}
      >
        {selected && <Check size={11} color="#fff" strokeWidth={3} />}
      </div>

      {/* Preview */}
      <div className="aspect-square overflow-hidden" style={{ background: "var(--apt-bg-subtle)" }}>
        <AssetPreview asset={asset} size={160} />
      </div>

      {/* Info */}
      <div className="px-2 py-2">
        <p className="text-[11px] font-medium truncate leading-tight" style={{ color: "var(--apt-text-primary)" }}>
          {asset.filename}
        </p>
        <p className="text-[10px] mt-0.5" style={{ color: "var(--apt-text-muted)" }}>
          {formatBytes(asset.size)}
        </p>
      </div>
    </button>
  );
}

function PickerListRow({
  asset, selected, onToggle,
}: { asset: Asset; selected: boolean; onToggle: (id: string) => void }) {
  return (
    <button
      type="button"
      onClick={() => onToggle(asset._id)}
      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors border-b last:border-0 focus-visible:outline-none ${
        selected ? "bg-blue-50 dark:bg-blue-950/30" : "hover:bg-[var(--apt-bg-subtle)]"
      }`}
      style={{ borderColor: "var(--apt-border)" }}
    >
      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
        selected ? "border-[#0057b8] bg-[#0057b8]" : "border-[var(--apt-border)]"
      }`}>
        {selected && <Check size={11} color="#fff" strokeWidth={3} />}
      </div>

      <div className="w-9 h-9 rounded overflow-hidden shrink-0">
        <AssetPreview asset={asset} size={36} />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium truncate" style={{ color: "var(--apt-text-primary)" }}>
          {asset.filename}
        </p>
        <p className="text-[11px] truncate" style={{ color: "var(--apt-text-muted)" }}>
          {asset.folder}
        </p>
      </div>

      <div className="hidden sm:flex gap-4 shrink-0 text-[11px]" style={{ color: "var(--apt-text-muted)" }}>
        <span>{formatBytes(asset.size)}</span>
        {asset.width && asset.height && <span>{asset.width}×{asset.height}</span>}
        <span>{formatRelative(asset.createdAt)}</span>
      </div>

      {asset.isFavorite && (
        <Star size={12} fill="#d97706" style={{ color: "#d97706" }} className="shrink-0" />
      )}
    </button>
  );
}

function PickerCompactRow({
  asset, selected, onToggle,
}: { asset: Asset; selected: boolean; onToggle: (id: string) => void }) {
  return (
    <button
      type="button"
      onClick={() => onToggle(asset._id)}
      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-colors focus-visible:outline-none ${
        selected ? "bg-blue-50 dark:bg-blue-950/30" : "hover:bg-[var(--apt-bg-subtle)]"
      }`}
    >
      <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
        selected ? "border-[#0057b8] bg-[#0057b8]" : "border-[var(--apt-border)]"
      }`}>
        {selected && <Check size={9} color="#fff" strokeWidth={3} />}
      </div>
      <div className="w-6 h-6 rounded overflow-hidden shrink-0">
        <AssetPreview asset={asset} size={24} />
      </div>
      <span className="flex-1 min-w-0 text-[12px] truncate" style={{ color: "var(--apt-text-primary)" }}>
        {asset.filename}
      </span>
      <span className="text-[10px] shrink-0" style={{ color: "var(--apt-text-muted)" }}>
        {formatBytes(asset.size)}
      </span>
    </button>
  );
}

function PreviewPanel({
  asset, selected, onToggle,
}: { asset: Asset; selected: boolean; onToggle: (id: string) => void }) {
  return (
    <div className="p-4 flex flex-col gap-4">
      {/* Large preview */}
      <div
        className="rounded-xl overflow-hidden aspect-square"
        style={{ background: "var(--apt-bg-subtle)" }}
      >
        <AssetPreview asset={asset} size={220} />
      </div>

      {/* Meta */}
      <div className="space-y-2">
        <p className="text-[13px] font-semibold leading-tight" style={{ color: "var(--apt-text-primary)" }}>
          {asset.filename}
        </p>
        <dl className="grid grid-cols-[auto,1fr] gap-x-3 gap-y-1">
          {[
            ["Type",    MEDIA_TYPE_LABELS[asset.mediaType] ?? asset.mediaType],
            ["Size",    formatBytes(asset.size)],
            ...(asset.width && asset.height ? [["Dims", `${asset.width}×${asset.height}`]] : []),
            ["Folder",  asset.folder],
            ["Added",   formatRelative(asset.createdAt)],
          ].map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="text-[10px] font-medium" style={{ color: "var(--apt-text-muted)" }}>{k}</dt>
              <dd className="text-[11px] truncate" style={{ color: "var(--apt-text-secondary)" }}>{v}</dd>
            </div>
          ))}
        </dl>
      </div>

      {asset.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {asset.tags.map((t) => (
            <span
              key={t}
              className="px-2 py-0.5 rounded-full text-[10px]"
              style={{ background: "var(--apt-bg-raised)", color: "var(--apt-text-muted)" }}
            >
              {t}
            </span>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => onToggle(asset._id)}
        className="w-full py-2 rounded-lg text-[12px] font-semibold transition-all"
        style={{
          background: selected ? "#0057b8" : "var(--apt-bg-raised)",
          color:      selected ? "#ffffff"  : "var(--apt-text-secondary)",
          border:     `1px solid ${selected ? "#0057b8" : "var(--apt-border)"}`,
        }}
      >
        {selected ? (
          <span className="flex items-center justify-center gap-1.5">
            <Check size={13} />
            Selected
          </span>
        ) : (
          "Select this asset"
        )}
      </button>
    </div>
  );
}
