"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Upload, Grid3X3, List, LayoutGrid, Search, RefreshCw,
  ChevronLeft, ChevronRight, PanelRightClose, PanelRight,
  SlidersHorizontal, X,
} from "lucide-react";
import type { Asset, MediaFilters, MediaStats, FolderNode, ViewMode, SortOption } from "./types";
import { MediaDashboard }   from "./MediaDashboard";
import { AssetBrowser }     from "./AssetBrowser";
import { AssetDetailsPanel }from "./AssetDetailsPanel";
import { UploadManager }    from "./UploadManager";
import { MediaFilters as FiltersPanel } from "./MediaFilters";
import { BulkActionsBar }   from "./BulkActionsBar";
import { getMediaType, debounce, copyToClipboard, downloadAsset } from "./utils";

const DEFAULT_FILTERS: MediaFilters = {
  query:     "",
  folder:    null,
  mediaType: null,
  tags:      [],
  status:    "active",
  favorites: false,
  sort:      "newest",
};

const PAGE_SIZE = 50;

interface Props {
  initialAssets: Asset[];
  initialTotal:  number;
  initialStats:  MediaStats;
}

export function MediaLibrary({ initialAssets, initialTotal, initialStats }: Props) {
  const [assets,       setAssets]       = useState<Asset[]>(initialAssets);
  const [total,        setTotal]        = useState(initialTotal);
  const [stats,        setStats]        = useState<MediaStats>(initialStats);
  const [page,         setPage]         = useState(1);
  const [loading,      setLoading]      = useState(false);
  const [filters,      setFilters]      = useState<MediaFilters>(DEFAULT_FILTERS);
  const [viewMode,     setViewMode]     = useState<ViewMode>("grid");
  const [selectedIds,  setSelectedIds]  = useState<Set<string>>(new Set());
  const [activeAsset,  setActiveAsset]  = useState<Asset | null>(null);
  const [uploadOpen,   setUploadOpen]   = useState(false);
  const [sidebarOpen,  setSidebarOpen]  = useState(true);
  const [detailsOpen,  setDetailsOpen]  = useState(false);
  const [folders,      setFolders]      = useState<FolderNode[]>([]);
  const [popularTags,  setPopularTags]  = useState<string[]>([]);
  const [globalDrag,   setGlobalDrag]   = useState(false);

  const abortRef = useRef<AbortController | null>(null);

  // Fetch folders + popular tags on mount
  useEffect(() => {
    void fetchFolders();
    void fetchPopularTags();
  }, []);

  // Re-fetch when filters change (debounced for query)
  const debouncedFetch = useCallback(
    debounce(() => void fetchAssets(true), 300),
    [filters],
  );

  useEffect(() => {
    if (filters.query) {
      debouncedFetch();
    } else {
      void fetchAssets(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  // Global drag-over → open upload manager
  useEffect(() => {
    const onDragOver  = (e: DragEvent) => { e.preventDefault(); setGlobalDrag(true); };
    const onDragLeave = (e: DragEvent) => { if (!e.relatedTarget) setGlobalDrag(false); };
    const onDrop      = (e: DragEvent) => { e.preventDefault(); setGlobalDrag(false); if (e.dataTransfer?.files.length) setUploadOpen(true); };
    document.addEventListener("dragover",  onDragOver);
    document.addEventListener("dragleave", onDragLeave);
    document.addEventListener("drop",      onDrop);
    return () => {
      document.removeEventListener("dragover",  onDragOver);
      document.removeEventListener("dragleave", onDragLeave);
      document.removeEventListener("drop",      onDrop);
    };
  }, []);

  async function fetchAssets(reset = false, nextPage = 1) {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.query)     params.set("q",         filters.query);
      if (filters.folder)    params.set("folder",    filters.folder);
      if (filters.mediaType) params.set("mediaType", filters.mediaType);
      if (filters.tags.length) params.set("tags",    filters.tags.join(","));
      if (filters.favorites) params.set("favorites", "true");
      params.set("status", filters.status);
      params.set("sort",   filters.sort);
      params.set("page",   String(reset ? 1 : nextPage));
      params.set("limit",  String(PAGE_SIZE));

      const endpoint = filters.query ? `/api/assets/search` : `/api/assets`;
      const res = await fetch(`${endpoint}?${params}`, { signal: ctrl.signal });
      if (!res.ok) return;

      const data = await res.json() as { assets: Asset[]; total: number; pages: number };
      const enriched = data.assets.map((a) => ({ ...a, mediaType: a.mediaType ?? getMediaType(a.mimetype) }));

      if (reset) {
        setAssets(enriched);
        setPage(1);
      } else {
        setAssets((prev) => [...prev, ...enriched]);
        setPage(nextPage);
      }
      setTotal(data.total);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
    } finally {
      setLoading(false);
    }
  }

  async function fetchFolders() {
    try {
      const res  = await fetch("/api/assets/folders");
      const data = await res.json() as { folders: FolderNode[] };
      setFolders(data.folders ?? []);
    } catch { /* ignore */ }
  }

  async function fetchPopularTags() {
    try {
      // Derive popular tags from current assets
      const tagCounts: Record<string, number> = {};
      initialAssets.forEach((a) => a.tags?.forEach((t) => { tagCounts[t] = (tagCounts[t] ?? 0) + 1; }));
      const sorted = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).map(([t]) => t);
      setPopularTags(sorted);
    } catch { /* ignore */ }
  }

  async function refreshStats() {
    try {
      const res  = await fetch("/api/assets/stats");
      const data = await res.json() as { stats: MediaStats };
      setStats(data.stats);
    } catch { /* ignore */ }
  }

  function updateFilters(partial: Partial<MediaFilters>) {
    setFilters((prev) => ({ ...prev, ...partial }));
    setSelectedIds(new Set());
  }

  function handleSelect(id: string, multi: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (multi) {
        if (next.has(id)) next.delete(id);
        else next.add(id);
      } else if (next.has(id) && next.size === 1) {
        next.clear();
      } else {
        next.clear();
        next.add(id);
      }
      return next;
    });
  }

  function handleAssetClick(asset: Asset) {
    setActiveAsset(asset);
    setDetailsOpen(true);
    // Increment view count
    void fetch(`/api/assets/${asset._id}`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ action: "increment-view" }),
    });
  }

  function handleAssetAction(action: string, asset: Asset) {
    switch (action) {
      case "copy-url":
        void copyToClipboard(asset.url);
        break;
      case "download":
        void fetch(`/api/assets/${asset._id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "increment-download" }) });
        downloadAsset(asset.url, asset.filename);
        break;
      case "archive":
        void fetch(`/api/assets/${asset._id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "archive" }) })
          .then(() => setAssets((prev) => prev.filter((a) => a._id !== asset._id)));
        break;
      case "delete":
        if (confirm(`Delete "${asset.filename}"? This cannot be undone.`)) {
          void fetch(`/api/assets/${asset._id}`, { method: "DELETE" })
            .then(() => {
              setAssets((prev) => prev.filter((a) => a._id !== asset._id));
              if (activeAsset?._id === asset._id) { setActiveAsset(null); setDetailsOpen(false); }
              setTotal((t) => t - 1);
              void refreshStats();
            });
        }
        break;
      case "favorite":
        void fetch(`/api/assets/${asset._id}`, {
          method:  "PATCH",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ isFavorite: !asset.isFavorite }),
        }).then(async (res) => {
          const { asset: updated } = await res.json() as { asset: Asset };
          setAssets((prev) => prev.map((a) => a._id === asset._id ? { ...a, ...updated, mediaType: a.mediaType } : a));
          if (activeAsset?._id === asset._id) setActiveAsset((prev) => prev ? { ...prev, isFavorite: !prev.isFavorite } : null);
        });
        break;
      case "duplicate":
        void fetch(`/api/assets/${asset._id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "duplicate" }) })
          .then(async (res) => {
            const { asset: dup } = await res.json() as { asset: Asset };
            const enriched = { ...dup, mediaType: getMediaType(dup.mimetype) };
            setAssets((prev) => [enriched, ...prev]);
            setTotal((t) => t + 1);
          });
        break;
    }
  }

  async function handleBulkAction(operation: string, data?: { folder?: string; tags?: string[] }) {
    const ids  = Array.from(selectedIds);
    const res  = await fetch("/api/assets/bulk", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ operation, ids, data }),
    });
    if (!res.ok) return;
    const { affected } = await res.json() as { affected: number };

    if (["delete", "archive"].includes(operation)) {
      setAssets((prev) => prev.filter((a) => !selectedIds.has(a._id)));
      setTotal((t) => t - affected);
    } else if (operation === "restore") {
      if (filters.status !== "archived") setAssets((prev) => prev.filter((a) => !selectedIds.has(a._id)));
    } else {
      // Re-fetch to reflect changes
      void fetchAssets(true);
    }

    setSelectedIds(new Set());
    void refreshStats();
  }

  function handleUploadComplete(newAssets: Asset[]) {
    const enriched = newAssets.map((a) => ({ ...a, mediaType: getMediaType(a.mimetype) }));
    setAssets((prev) => [...enriched, ...prev]);
    setTotal((t) => t + enriched.length);
    void fetchFolders();
    void refreshStats();
  }

  const hasMore = assets.length < total;

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: "var(--apt-bg)" }}>
      {/* Stats Dashboard */}
      <MediaDashboard stats={stats} />

      {/* Toolbar */}
      <div
        className="flex items-center gap-2 px-4 py-2.5 border-b shrink-0"
        style={{ borderColor: "var(--apt-border)", background: "var(--apt-bg)" }}
      >
        {/* Sidebar toggle */}
        <button
          onClick={() => setSidebarOpen((v) => !v)}
          className="p-2 rounded-lg transition-colors hover:bg-[var(--apt-bg-raised)]"
          style={{ color: "var(--apt-text-muted)" }}
          title={sidebarOpen ? "Hide filters" : "Show filters"}
        >
          <SlidersHorizontal size={15} />
        </button>

        {/* Search */}
        <div className="flex-1 relative max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--apt-text-muted)" }} />
          <input
            type="text"
            value={filters.query}
            onChange={(e) => updateFilters({ query: e.target.value })}
            placeholder="Search assets by name, tag, folder…"
            className="w-full pl-8 pr-8 py-1.5 text-[13px] rounded-lg border"
            style={{
              background:  "var(--apt-bg-subtle)",
              borderColor: "var(--apt-border)",
              color:       "var(--apt-text-primary)",
            }}
          />
          {filters.query && (
            <button
              onClick={() => updateFilters({ query: "" })}
              className="absolute right-2 top-1/2 -translate-y-1/2"
              style={{ color: "var(--apt-text-muted)" }}
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Results count */}
        <span className="text-[12px] tabular-nums shrink-0" style={{ color: "var(--apt-text-muted)" }}>
          {total.toLocaleString()} asset{total !== 1 ? "s" : ""}
        </span>

        {/* Spacer */}
        <div className="flex-1" />

        {/* View toggle */}
        <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: "var(--apt-border)" }}>
          {(["grid", "list", "compact"] as ViewMode[]).map((mode) => {
            const Icon = mode === "grid" ? Grid3X3 : mode === "list" ? List : LayoutGrid;
            return (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className="p-1.5 transition-colors"
                title={`${mode.charAt(0).toUpperCase() + mode.slice(1)} view`}
                style={
                  viewMode === mode
                    ? { background: "#0057b8", color: "#ffffff" }
                    : { background: "var(--apt-bg)", color: "var(--apt-text-muted)" }
                }
              >
                <Icon size={14} />
              </button>
            );
          })}
        </div>

        {/* Refresh */}
        <button
          onClick={() => void fetchAssets(true)}
          className="p-2 rounded-lg transition-colors hover:bg-[var(--apt-bg-raised)]"
          style={{ color: "var(--apt-text-muted)" }}
          title="Refresh"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>

        {/* Upload */}
        <button
          onClick={() => setUploadOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-opacity hover:opacity-80"
          style={{ background: "#0057b8", color: "#ffffff" }}
        >
          <Upload size={14} />
          Upload
        </button>

        {/* Details panel toggle */}
        <button
          onClick={() => setDetailsOpen((v) => !v)}
          className="p-2 rounded-lg transition-colors hover:bg-[var(--apt-bg-raised)]"
          style={{ color: detailsOpen ? "#0057b8" : "var(--apt-text-muted)" }}
          title={detailsOpen ? "Hide details" : "Show details"}
        >
          {detailsOpen ? <PanelRightClose size={15} /> : <PanelRight size={15} />}
        </button>
      </div>

      {/* Bulk actions bar */}
      <BulkActionsBar
        selectedIds={selectedIds}
        assets={assets}
        onClear={() => setSelectedIds(new Set())}
        onBulkAction={handleBulkAction}
      />

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar: filters */}
        {sidebarOpen && (
          <div
            className="shrink-0 border-r overflow-hidden"
            style={{ width: 220, borderColor: "var(--apt-border)", background: "var(--apt-bg)" }}
          >
            <FiltersPanel
              filters={filters}
              folders={folders}
              popularTags={popularTags}
              onChange={updateFilters}
            />
          </div>
        )}

        {/* Asset grid/list */}
        <div className="flex-1 min-w-0 overflow-hidden">
          <AssetBrowser
            assets={assets}
            viewMode={viewMode}
            selectedIds={selectedIds}
            loading={loading}
            hasMore={hasMore}
            onSelect={handleSelect}
            onClick={handleAssetClick}
            onAction={handleAssetAction}
            onLoadMore={() => void fetchAssets(false, page + 1)}
          />
        </div>

        {/* Right: details panel */}
        {detailsOpen && activeAsset && (
          <AssetDetailsPanel
            asset={activeAsset}
            onClose={() => { setDetailsOpen(false); setActiveAsset(null); }}
            onUpdate={(updated) => {
              setActiveAsset(updated);
              setAssets((prev) => prev.map((a) => a._id === updated._id ? updated : a));
            }}
            onDelete={(id) => {
              setAssets((prev) => prev.filter((a) => a._id !== id));
              setTotal((t) => t - 1);
              setDetailsOpen(false);
              setActiveAsset(null);
              void refreshStats();
            }}
          />
        )}
      </div>

      {/* Upload manager modal */}
      {uploadOpen && (
        <UploadManager
          defaultFolder={filters.folder ?? "uncategorized"}
          onUploadComplete={handleUploadComplete}
          onClose={() => setUploadOpen(false)}
        />
      )}

      {/* Global drag overlay */}
      {globalDrag && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center"
          style={{ background: "rgba(0,87,184,0.15)", border: "3px dashed #0057b8" }}
        >
          <div className="text-center">
            <Upload size={48} style={{ color: "#0057b8", margin: "0 auto 12px" }} />
            <p className="text-xl font-semibold" style={{ color: "#0057b8" }}>Drop files to upload</p>
          </div>
        </div>
      )}
    </div>
  );
}
