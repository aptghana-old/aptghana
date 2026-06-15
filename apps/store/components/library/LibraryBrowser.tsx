"use client";

import { useState, useCallback, useTransition, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  FileText, Film, BookOpen, Lightbulb, HelpCircle, Code2,
  Award, Download, ExternalLink, Search, Tag, Calendar,
  Loader2, ChevronRight,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface LibraryAsset {
  _id:          string;
  key:          string;
  url:          string;
  filename:     string;
  originalName: string;
  mimetype:     string;
  size:         number;
  folder:       string;
  tags:         string[];
  altText?:     string;
  description?: string;
  downloadCount: number;
  viewCount:    number;
  createdAt:    string;
}

export interface ResourceType {
  id:       string;
  title:    string;
  desc:     string;
  count:    number;
  icon:     React.ReactNode;
  color:    string;
  bgColor:  string;
}

interface Props {
  initialAssets: LibraryAsset[];
  initialTotal:  number;
  counts:        Record<string, number>;
  resourceTypes: ResourceType[];
  popularBrands: string[];
  activeType:    string;
  activeQuery:   string;
  activeBrand:   string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / k ** i).toFixed(1))} ${units[i]}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", { year: "numeric", month: "short" });
}

function getExtension(filename: string): string {
  return filename.split(".").pop()?.toUpperCase() ?? "FILE";
}

function getMimeColor(mimetype: string): { bg: string; text: string } {
  if (mimetype === "application/pdf")            return { bg: "#fee2e2", text: "#dc2626" };
  if (mimetype.startsWith("video/"))             return { bg: "#fee2e2", text: "#dc2626" };
  if (mimetype.includes("wordprocessingml") || mimetype.includes("msword"))
                                                  return { bg: "#dbeafe", text: "#1d4ed8" };
  if (mimetype.includes("spreadsheetml") || mimetype.includes("vnd.ms-excel"))
                                                  return { bg: "#dcfce7", text: "#15803d" };
  if (mimetype.startsWith("image/"))             return { bg: "#ede9fe", text: "#7c3aed" };
  if (mimetype.includes("zip") || mimetype.includes("compressed"))
                                                  return { bg: "#fef3c7", text: "#d97706" };
  return { bg: "#f3f4f6", text: "#6b7280" };
}

function getTypeIcon(id: string, size = 18): React.ReactNode {
  const props = { size, strokeWidth: 1.75 };
  switch (id) {
    case "datasheets":    return <FileText   {...props} />;
    case "manuals":       return <BookOpen   {...props} />;
    case "guides":        return <Lightbulb  {...props} />;
    case "videos":        return <Film       {...props} />;
    case "faqs":          return <HelpCircle {...props} />;
    case "software":      return <Code2      {...props} />;
    case "certificates":  return <Award      {...props} />;
    default:              return <FileText   {...props} />;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Asset card
// ─────────────────────────────────────────────────────────────────────────────

function AssetCard({ asset, onDownload }: { asset: LibraryAsset; onDownload: (id: string, url: string) => void }) {
  const ext     = getExtension(asset.filename);
  const colors  = getMimeColor(asset.mimetype);
  const isVideo = asset.mimetype.startsWith("video/");
  const label   = asset.altText || asset.description || asset.filename.replace(/[-_]/g, " ").replace(/\.[^.]+$/, "");

  return (
    <div
      className="group flex flex-col bg-[var(--bg-surface)] rounded-2xl border transition-all duration-200 overflow-hidden hover:shadow-[var(--shadow-2)] hover:-translate-y-0.5"
      style={{ borderColor: "var(--border)" }}
    >
      {/* Type header */}
      <div className="px-4 pt-4 pb-3 flex items-start justify-between gap-2">
        <div
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold tracking-wide shrink-0"
          style={{ background: colors.bg, color: colors.text }}
        >
          {ext}
        </div>
        {isVideo && (
          <div className="w-8 h-8 rounded-xl bg-[#fee2e2] flex items-center justify-center shrink-0">
            <Film size={15} color="#dc2626" strokeWidth={2} />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-4 flex-1 flex flex-col">
        <h3
          className="text-[13px] font-semibold leading-snug mb-1 line-clamp-2"
          style={{ color: "var(--text-1)" }}
        >
          {label}
        </h3>
        {asset.description && asset.description !== label && (
          <p className="text-[11px] leading-relaxed mb-2 line-clamp-2" style={{ color: "var(--text-3)" }}>
            {asset.description}
          </p>
        )}

        {/* Tags */}
        {asset.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1 mb-2">
            {asset.tags.slice(0, 3).map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium"
                style={{ background: "var(--bg-raised)", color: "var(--text-3)" }}
              >
                <Tag size={8} />
                {t}
              </span>
            ))}
          </div>
        )}

        {/* Meta */}
        <div className="flex items-center gap-3 mt-auto pb-3 pt-2" style={{ color: "var(--text-4)" }}>
          <span className="text-[10px] flex items-center gap-1">
            <Calendar size={9} />
            {formatDate(asset.createdAt)}
          </span>
          <span className="text-[10px]">{formatBytes(asset.size)}</span>
          {asset.downloadCount > 0 && (
            <span className="text-[10px] flex items-center gap-1">
              <Download size={9} />
              {asset.downloadCount.toLocaleString()}
            </span>
          )}
        </div>
      </div>

      {/* Footer action */}
      <div className="px-4 pb-4">
        {isVideo ? (
          <a
            href={asset.url}
            target="_blank"
            rel="noreferrer"
            onClick={() => onDownload(asset._id, asset.url)}
            className="flex items-center justify-center gap-2 w-full h-10 rounded-xl text-[12px] font-semibold transition-colors"
            style={{ background: "#fee2e2", color: "#dc2626" }}
          >
            <Film size={13} />
            Watch Video
            <ExternalLink size={11} />
          </a>
        ) : (
          <a
            href={asset.url}
            target="_blank"
            rel="noreferrer"
            download={asset.filename}
            onClick={() => onDownload(asset._id, asset.url)}
            className="flex items-center justify-center gap-2 w-full h-10 rounded-xl text-[12px] font-semibold transition-colors bg-[#0057b8] hover:bg-[#1a73e8] text-white"
          >
            <Download size={13} />
            Download
          </a>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

export function LibraryBrowser({
  initialAssets,
  initialTotal,
  counts,
  resourceTypes,
  popularBrands,
  activeType,
  activeQuery,
  activeBrand,
}: Props) {
  const router        = useRouter();
  const searchParams  = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Client-side "load more" state
  const [extraAssets, setExtraAssets]   = useState<LibraryAsset[]>([]);
  const [loadedPages, setLoadedPages]   = useState(1);
  const [loadingMore, setLoadingMore]   = useState(false);
  const [hasMore, setHasMore]           = useState(initialTotal > initialAssets.length);
  const searchRef = useRef<HTMLInputElement>(null);

  const allAssets = [...initialAssets, ...extraAssets];
  const totalShown = allAssets.length;

  // Navigate with new filters (SSR refetch)
  const navigate = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(updates)) {
        if (v) params.set(k, v); else params.delete(k);
      }
      // Reset extra state on filter change
      setExtraAssets([]);
      setLoadedPages(1);
      startTransition(() => { router.push(`/library?${params.toString()}`); });
    },
    [router, searchParams],
  );

  // Fetch additional pages client-side
  const loadMore = async () => {
    setLoadingMore(true);
    const nextPage = loadedPages + 1;
    try {
      const params = new URLSearchParams();
      if (activeType)  params.set("type",  activeType);
      if (activeQuery) params.set("q",     activeQuery);
      if (activeBrand) params.set("brand", activeBrand);
      params.set("page",  String(nextPage));
      params.set("limit", "24");
      const res  = await fetch(`/api/library?${params}`);
      const json = await res.json() as { assets: LibraryAsset[]; total: number; pages: number };
      setExtraAssets((prev) => [...prev, ...json.assets]);
      setLoadedPages(nextPage);
      setHasMore(nextPage < json.pages);
    } catch {
      // swallow
    } finally {
      setLoadingMore(false);
    }
  };

  // Track download without blocking UI
  const trackDownload = (id: string, _url: string) => {
    void fetch(`/api/assets/${id}`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ action: "increment-download" }),
    });
  };

  // Active type info for heading
  const activeTypeInfo = resourceTypes.find((r) => r.id === activeType);

  return (
    <div className="grid lg:grid-cols-[240px_1fr] gap-8 items-start">
      {/* ── Sidebar ───────────────────────────────────────────────────── */}
      <aside className="space-y-4 lg:sticky lg:top-28">
        {/* Type filter */}
        <div className="bg-[var(--bg-surface)] rounded-2xl p-5" style={{ border: "1px solid var(--border)" }}>
          <h2 className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--text-3)" }}>
            Resource Type
          </h2>
          <nav className="space-y-0.5">
            <button
              onClick={() => navigate({ type: undefined, brand: undefined })}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-[13px] transition-colors text-left"
              style={
                !activeType
                  ? { background: "#0057b8", color: "#ffffff", fontWeight: 600 }
                  : { color: "var(--text-2)" }
              }
            >
              All Resources
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={!activeType ? { background: "rgba(255,255,255,0.2)", color: "#fff" } : { background: "var(--bg-raised)", color: "var(--text-3)" }}
              >
                {Object.values(counts).reduce((a, b) => a + b, 0)}
              </span>
            </button>

            {resourceTypes.map((rt) => {
              const isActive = activeType === rt.id;
              const count    = counts[rt.id] ?? 0;
              return (
                <button
                  key={rt.id}
                  onClick={() => navigate({ type: rt.id, brand: undefined })}
                  className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-[13px] transition-colors text-left"
                  style={isActive ? { background: rt.bgColor, color: rt.color, fontWeight: 600 } : { color: "var(--text-2)" }}
                >
                  <span className="flex items-center gap-2 truncate">
                    <span style={{ color: isActive ? rt.color : "var(--text-4)" }}>
                      {getTypeIcon(rt.id, 14)}
                    </span>
                    <span className="truncate">{rt.title}</span>
                  </span>
                  <span
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0"
                    style={{ background: rt.bgColor, color: rt.color }}
                  >
                    {count > 0 ? count.toLocaleString() : "—"}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Brand filter */}
        <div className="bg-[var(--bg-surface)] rounded-2xl p-5" style={{ border: "1px solid var(--border)" }}>
          <h2 className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--text-3)" }}>
            By Brand
          </h2>
          <nav className="space-y-0.5">
            {popularBrands.map((brand) => (
              <button
                key={brand}
                onClick={() => navigate({ brand, type: activeType || undefined })}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-[13px] transition-colors text-left"
                style={
                  activeBrand === brand
                    ? { background: "#f0f7ff", color: "#0057b8", fontWeight: 600 }
                    : { color: "var(--text-2)" }
                }
              >
                {brand}
                {activeBrand === brand && <ChevronRight size={12} color="#0057b8" />}
              </button>
            ))}
          </nav>
        </div>

        {/* Help CTA */}
        <div className="rounded-2xl p-5 text-white" style={{ background: "#0a1628" }}>
          <h2 className="font-semibold mb-1.5 text-[13px]">Can't find what you need?</h2>
          <p className="text-[12px] text-white/50 mb-4">Our engineers can locate specific documentation.</p>
          <a
            href="/contact"
            className="inline-flex items-center gap-2 h-9 px-4 bg-white/10 hover:bg-white/15 border border-white/10 text-white text-[12px] font-semibold rounded-xl transition-colors"
          >
            Contact Us
          </a>
        </div>
      </aside>

      {/* ── Main content ──────────────────────────────────────────────── */}
      <div className="min-w-0">
        {/* Heading + search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            {activeTypeInfo ? (
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: activeTypeInfo.bgColor }}
                >
                  <span style={{ color: activeTypeInfo.color }}>
                    {getTypeIcon(activeTypeInfo.id, 18)}
                  </span>
                </div>
                <div>
                  <h2 className="text-[17px] font-bold leading-tight" style={{ color: "var(--text-1)" }}>
                    {activeTypeInfo.title}
                  </h2>
                  <p className="text-[12px]" style={{ color: "var(--text-3)" }}>
                    {totalShown} of {initialTotal.toLocaleString()} document{initialTotal !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
            ) : (
              <div>
                <h2 className="text-[17px] font-bold" style={{ color: "var(--text-1)" }}>
                  {activeQuery ? `Results for "${activeQuery}"` : activeBrand ? `${activeBrand} Documents` : "All Resources"}
                </h2>
                <p className="text-[12px] mt-0.5" style={{ color: "var(--text-3)" }}>
                  {initialTotal.toLocaleString()} document{initialTotal !== 1 ? "s" : ""}
                  {" "}available
                </p>
              </div>
            )}
          </div>

          {/* Inline search */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              navigate({ q: searchRef.current?.value || undefined });
            }}
            className="flex gap-0 w-full sm:w-auto"
          >
            <input
              ref={searchRef}
              type="text"
              defaultValue={activeQuery}
              placeholder="Search documents…"
              className="h-10 px-4 rounded-l-xl text-[13px] outline-none w-full sm:w-64 transition-colors"
              style={{
                background: "var(--bg-surface)",
                border:     "1px solid var(--border)",
                borderRight: "none",
                color:      "var(--text-1)",
              }}
            />
            <button
              type="submit"
              disabled={isPending}
              className="h-10 px-4 rounded-r-xl text-[12px] font-semibold text-white transition-colors bg-[#0057b8] hover:bg-[#1a73e8] shrink-0 flex items-center gap-1.5"
            >
              {isPending ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
            </button>
          </form>
        </div>

        {/* Active filters chips */}
        {(activeQuery || activeBrand || activeType) && (
          <div className="flex flex-wrap gap-2 mb-5">
            {activeType && activeTypeInfo && (
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium"
                style={{ background: activeTypeInfo.bgColor, color: activeTypeInfo.color }}
              >
                {getTypeIcon(activeType, 11)}
                {activeTypeInfo.title}
                <button onClick={() => navigate({ type: undefined })} className="ml-0.5 opacity-60 hover:opacity-100">✕</button>
              </span>
            )}
            {activeBrand && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium bg-[#f0f7ff] text-[#0057b8]">
                {activeBrand}
                <button onClick={() => navigate({ brand: undefined })} className="ml-0.5 opacity-60 hover:opacity-100">✕</button>
              </span>
            )}
            {activeQuery && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium bg-[#f5f3ff] text-[#7c3aed]">
                <Search size={11} />
                "{activeQuery}"
                <button onClick={() => navigate({ q: undefined })} className="ml-0.5 opacity-60 hover:opacity-100">✕</button>
              </span>
            )}
          </div>
        )}

        {/* Grid — show category cards if no filter active AND no results */}
        {!activeType && !activeQuery && !activeBrand && allAssets.length === 0 && (
          <CategoryCards resourceTypes={resourceTypes} counts={counts} onSelect={(id) => navigate({ type: id })} />
        )}

        {/* Grid — show category overview when browsing all with no search */}
        {!activeType && !activeQuery && !activeBrand && allAssets.length > 0 && (
          <>
            <CategoryCards resourceTypes={resourceTypes} counts={counts} onSelect={(id) => navigate({ type: id })} />
            <div className="mt-8">
              <h3 className="text-[14px] font-bold mb-4" style={{ color: "var(--text-1)" }}>
                Recently Added
              </h3>
              <DocumentGrid assets={allAssets} onDownload={trackDownload} />
            </div>
          </>
        )}

        {/* Filtered results grid */}
        {(activeType || activeQuery || activeBrand) && (
          <>
            {allAssets.length > 0 ? (
              <DocumentGrid assets={allAssets} onDownload={trackDownload} />
            ) : (
              <EmptyState type={activeType} query={activeQuery} onClear={() => navigate({ type: undefined, q: undefined, brand: undefined })} />
            )}
          </>
        )}

        {/* Load more */}
        {hasMore && (
          <div className="flex justify-center mt-8">
            <button
              onClick={() => void loadMore()}
              disabled={loadingMore}
              className="flex items-center gap-2 h-11 px-8 rounded-xl text-[13px] font-semibold transition-colors"
              style={{
                background: "var(--bg-surface)",
                border:     "1px solid var(--border)",
                color:      "var(--text-2)",
              }}
            >
              {loadingMore ? (
                <><Loader2 size={15} className="animate-spin" /> Loading…</>
              ) : (
                <>Load more documents</>
              )}
            </button>
          </div>
        )}

        {!hasMore && allAssets.length > 0 && (
          <p className="text-center mt-8 text-[11px]" style={{ color: "var(--text-4)" }}>
            All {initialTotal.toLocaleString()} document{initialTotal !== 1 ? "s" : ""} loaded
          </p>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Category overview cards (shown when browsing "All")
// ─────────────────────────────────────────────────────────────────────────────

function CategoryCards({
  resourceTypes,
  counts,
  onSelect,
}: {
  resourceTypes: ResourceType[];
  counts:        Record<string, number>;
  onSelect:      (id: string) => void;
}) {
  return (
    <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {resourceTypes.map((rt) => {
        const count = counts[rt.id] ?? 0;
        return (
          <button
            key={rt.id}
            onClick={() => onSelect(rt.id)}
            className="group flex items-start gap-4 p-5 text-left rounded-2xl border transition-all duration-200 hover:shadow-[var(--shadow-2)] hover:-translate-y-0.5"
            style={{
              background:   "var(--bg-surface)",
              borderColor:  "var(--border)",
            }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
              style={{ background: rt.bgColor }}
            >
              <span style={{ color: rt.color }}>{getTypeIcon(rt.id, 20)}</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2 mb-1">
                <h3
                  className="text-[13px] font-bold leading-tight group-hover:text-[#0057b8] transition-colors truncate"
                  style={{ color: "var(--text-1)" }}
                >
                  {rt.title}
                </h3>
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
                  style={{ background: rt.bgColor, color: rt.color }}
                >
                  {count > 0 ? count.toLocaleString() : "Soon"}
                </span>
              </div>
              <p className="text-[11px] leading-relaxed" style={{ color: "var(--text-3)" }}>
                {rt.desc}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Document grid
// ─────────────────────────────────────────────────────────────────────────────

function DocumentGrid({
  assets,
  onDownload,
}: {
  assets:     LibraryAsset[];
  onDownload: (id: string, url: string) => void;
}) {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {assets.map((asset) => (
        <AssetCard key={asset._id} asset={asset} onDownload={onDownload} />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Empty state
// ─────────────────────────────────────────────────────────────────────────────

function EmptyState({
  type, query, onClear,
}: {
  type:    string;
  query:   string;
  onClear: () => void;
}) {
  return (
    <div
      className="flex flex-col items-center justify-center py-20 px-8 rounded-2xl border text-center"
      style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
    >
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: "var(--bg-raised)" }}
      >
        <FileText size={28} style={{ color: "var(--text-4)" }} />
      </div>
      <h3 className="text-[15px] font-semibold mb-2" style={{ color: "var(--text-1)" }}>
        {query ? `No results for "${query}"` : "No documents yet"}
      </h3>
      <p className="text-[13px] max-w-xs mb-6" style={{ color: "var(--text-3)" }}>
        {query
          ? "Try a different search term or browse by category."
          : `${type ? "Documents for this category" : "Library documents"} will appear here once uploaded.`}
      </p>
      <div className="flex flex-wrap gap-3 justify-center">
        <button
          onClick={onClear}
          className="h-10 px-5 rounded-xl text-[13px] font-semibold transition-colors bg-[#0057b8] text-white hover:bg-[#1a73e8]"
        >
          Browse All Documents
        </button>
        <a
          href="/contact"
          className="h-10 px-5 rounded-xl text-[13px] font-semibold transition-colors border"
          style={{ borderColor: "var(--border)", color: "var(--text-2)" }}
        >
          Request a Document
        </a>
      </div>
    </div>
  );
}
