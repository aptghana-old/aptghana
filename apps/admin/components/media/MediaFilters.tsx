"use client";

import { Image, Film, FileText, FileSpreadsheet, Archive, Music, Star, Clock, RotateCcw } from "lucide-react";
import type { MediaFilters as Filters, SortOption } from "./types";
import { FolderTree } from "./FolderTree";
import type { FolderNode } from "./types";

interface Props {
  filters: Filters;
  folders: FolderNode[];
  popularTags: string[];
  onChange: (partial: Partial<Filters>) => void;
}

const MEDIA_TYPES = [
  { key: "image",       label: "Images",      icon: Image,          color: "#0284c7" },
  { key: "svg",         label: "SVG",          icon: Image,          color: "#7c3aed" },
  { key: "video",       label: "Videos",       icon: Film,           color: "#dc2626" },
  { key: "audio",       label: "Audio",        icon: Music,          color: "#d97706" },
  { key: "pdf",         label: "PDFs",         icon: FileText,       color: "#dc2626" },
  { key: "document",    label: "Documents",    icon: FileText,       color: "#1d4ed8" },
  { key: "spreadsheet", label: "Spreadsheets", icon: FileSpreadsheet,color: "#15803d" },
  { key: "archive",     label: "Archives",     icon: Archive,        color: "#b45309" },
];

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "newest",  label: "Newest first" },
  { value: "oldest",  label: "Oldest first" },
  { value: "name",    label: "Name A–Z" },
  { value: "size",    label: "Largest first" },
  { value: "popular", label: "Most viewed" },
];

export function MediaFilters({ filters, folders, popularTags, onChange }: Props) {
  const hasActiveFilters = filters.mediaType || filters.tags.length > 0 || filters.favorites || filters.folder;

  return (
    <div className="flex flex-col h-full overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
      {/* Sort */}
      <div className="px-3 pt-3 pb-2">
        <label className="block text-[10px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--apt-text-muted)" }}>
          Sort By
        </label>
        <select
          value={filters.sort}
          onChange={(e) => onChange({ sort: e.target.value as SortOption })}
          className="w-full text-[12px] px-2 py-1.5 rounded-md border"
          style={{
            background:   "var(--apt-bg)",
            borderColor:  "var(--apt-border)",
            color:        "var(--apt-text-primary)",
          }}
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <div className="h-px mx-3" style={{ background: "var(--apt-border)" }} />

      {/* Quick filters */}
      <div className="px-3 py-3 space-y-1">
        <p className="text-[10px] font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--apt-text-muted)" }}>
          Quick Filters
        </p>
        <FilterButton
          label="Favorites"
          icon={<Star size={13} />}
          active={filters.favorites}
          color="#d97706"
          onClick={() => onChange({ favorites: !filters.favorites })}
        />
        <FilterButton
          label="Recently Added"
          icon={<Clock size={13} />}
          active={filters.sort === "newest" && !filters.mediaType && !filters.favorites}
          color="#0284c7"
          onClick={() => onChange({ sort: "newest", mediaType: null, favorites: false })}
        />
        <FilterButton
          label="Archived"
          icon={<Archive size={13} />}
          active={filters.status === "archived"}
          color="#64748b"
          onClick={() => onChange({ status: filters.status === "archived" ? "active" : "archived" })}
        />
      </div>

      <div className="h-px mx-3" style={{ background: "var(--apt-border)" }} />

      {/* File type */}
      <div className="px-3 py-3 space-y-0.5">
        <p className="text-[10px] font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--apt-text-muted)" }}>
          File Type
        </p>
        {MEDIA_TYPES.map(({ key, label, icon: Icon, color }) => (
          <FilterButton
            key={key}
            label={label}
            icon={<Icon size={13} />}
            active={filters.mediaType === key}
            color={color}
            onClick={() => onChange({ mediaType: filters.mediaType === key ? null : key })}
          />
        ))}
      </div>

      {/* Tags */}
      {popularTags.length > 0 && (
        <>
          <div className="h-px mx-3" style={{ background: "var(--apt-border)" }} />
          <div className="px-3 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--apt-text-muted)" }}>
              Tags
            </p>
            <div className="flex flex-wrap gap-1.5">
              {popularTags.slice(0, 20).map((tag) => {
                const active = filters.tags.includes(tag);
                return (
                  <button
                    key={tag}
                    onClick={() => {
                      const next = active
                        ? filters.tags.filter((t) => t !== tag)
                        : [...filters.tags, tag];
                      onChange({ tags: next });
                    }}
                    className="px-2 py-0.5 rounded-full text-[11px] font-medium transition-colors"
                    style={
                      active
                        ? { background: "#0057b8", color: "#ffffff" }
                        : { background: "var(--apt-bg-raised)", color: "var(--apt-text-secondary)" }
                    }
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}

      <div className="h-px mx-3" style={{ background: "var(--apt-border)" }} />

      {/* Folders */}
      <div className="px-3 py-3 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--apt-text-muted)" }}>
          Folders
        </p>
        <FolderTree
          folders={folders}
          activeFolder={filters.folder}
          onSelectFolder={(path) => onChange({ folder: path })}
        />
      </div>

      {/* Clear filters */}
      {hasActiveFilters && (
        <div className="px-3 pb-3 sticky bottom-0" style={{ background: "var(--apt-bg)" }}>
          <button
            onClick={() => onChange({ folder: null, mediaType: null, tags: [], favorites: false, status: "active" })}
            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-md text-[12px] font-medium transition-colors hover:opacity-80"
            style={{ background: "var(--apt-bg-raised)", color: "var(--apt-text-secondary)" }}
          >
            <RotateCcw size={12} />
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
}

interface FilterButtonProps {
  label: string;
  icon: React.ReactNode;
  active: boolean;
  color: string;
  onClick: () => void;
}

function FilterButton({ label, icon, active, color, onClick }: FilterButtonProps) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-[12px] font-medium transition-colors text-left"
      style={
        active
          ? { background: `${color}18`, color }
          : { color: "var(--apt-text-secondary)" }
      }
    >
      <span style={{ color: active ? color : "var(--apt-text-muted)" }}>{icon}</span>
      {label}
    </button>
  );
}
