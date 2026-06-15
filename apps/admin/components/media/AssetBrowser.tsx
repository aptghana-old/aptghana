"use client";

import { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import type { Asset, ViewMode } from "./types";
import { AssetCard } from "./AssetCard";

interface Props {
  assets: Asset[];
  viewMode: ViewMode;
  selectedIds: Set<string>;
  loading: boolean;
  hasMore: boolean;
  onSelect: (id: string, multi: boolean) => void;
  onClick: (asset: Asset) => void;
  onAction: (action: string, asset: Asset) => void;
  onLoadMore: () => void;
}

export function AssetBrowser({
  assets,
  viewMode,
  selectedIds,
  loading,
  hasMore,
  onSelect,
  onClick,
  onAction,
  onLoadMore,
}: Props) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    if (!sentinelRef.current || !hasMore) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && !loading) onLoadMore(); },
      { rootMargin: "300px" },
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, loading, onLoadMore]);

  if (!loading && assets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20 gap-3">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl" style={{ background: "var(--apt-bg-raised)" }}>
          🖼️
        </div>
        <div className="text-center">
          <p className="font-semibold mb-1" style={{ color: "var(--apt-text-primary)" }}>No assets found</p>
          <p className="text-sm" style={{ color: "var(--apt-text-muted)" }}>Try adjusting your filters or uploading new files.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
      {viewMode === "grid" && (
        <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
          {assets.map((asset) => (
            <AssetCard
              key={asset._id}
              asset={asset}
              viewMode="grid"
              selected={selectedIds.has(asset._id)}
              onSelect={onSelect}
              onClick={onClick}
              onAction={onAction}
            />
          ))}
        </div>
      )}

      {viewMode === "list" && (
        <div>
          {/* List header */}
          <div
            className="flex items-center gap-3 px-4 py-2 text-[10px] font-semibold uppercase tracking-wide sticky top-0 z-10 border-b"
            style={{ background: "var(--apt-bg-subtle)", borderColor: "var(--apt-border)", color: "var(--apt-text-muted)" }}
          >
            <span className="w-5" />
            <span className="w-9 shrink-0" />
            <span className="flex-1">Name</span>
            <span className="hidden sm:block w-16 text-right">Size</span>
            <span className="hidden sm:block w-20 text-right">Dimensions</span>
            <span className="hidden sm:block w-16 text-right">Uploaded</span>
            <span className="hidden sm:block w-16 text-right">Views</span>
            <span className="w-5" />
            <span className="w-5" />
          </div>
          <div>
            {assets.map((asset) => (
              <AssetCard
                key={asset._id}
                asset={asset}
                viewMode="list"
                selected={selectedIds.has(asset._id)}
                onSelect={onSelect}
                onClick={onClick}
                onAction={onAction}
              />
            ))}
          </div>
        </div>
      )}

      {viewMode === "compact" && (
        <div className="p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-0.5">
          {assets.map((asset) => (
            <AssetCard
              key={asset._id}
              asset={asset}
              viewMode="compact"
              selected={selectedIds.has(asset._id)}
              onSelect={onSelect}
              onClick={onClick}
              onAction={onAction}
            />
          ))}
        </div>
      )}

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="h-4" />

      {/* Loading indicator */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 size={20} className="animate-spin" style={{ color: "var(--apt-text-muted)" }} />
          <span className="ml-2 text-sm" style={{ color: "var(--apt-text-muted)" }}>Loading assets…</span>
        </div>
      )}

      {!loading && !hasMore && assets.length > 0 && (
        <p className="text-center text-[11px] py-6" style={{ color: "var(--apt-text-muted)" }}>
          All {assets.length} assets loaded
        </p>
      )}
    </div>
  );
}
