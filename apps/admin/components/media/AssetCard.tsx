"use client";

import { useState } from "react";
import { Check, Star, MoreVertical, Download, Trash2, Archive, Copy, Move } from "lucide-react";
import type { Asset, ViewMode } from "./types";
import { formatBytes, formatRelative, getFileExtension } from "./utils";
import { AssetPreview } from "./AssetPreview";

interface Props {
  asset: Asset;
  viewMode: ViewMode;
  selected: boolean;
  onSelect: (id: string, multi: boolean) => void;
  onClick: (asset: Asset) => void;
  onAction: (action: string, asset: Asset) => void;
}

export function AssetCard({ asset, viewMode, selected, onSelect, onClick, onAction }: Props) {
  const [ menuOpen, setMenuOpen ] = useState(false);

  if (viewMode === "list") {
    return (
      <div
        className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors group border-b ${selected ? "bg-blue-50" : "hover:bg-[var(--apt-bg-subtle)]"}`}
        style={{ borderColor: "var(--apt-border)" }}
        onClick={(e) => { if ((e.target as HTMLElement).closest(".action-zone")) return; onClick(asset); }}
      >
        {/* Checkbox */}
        <div className="action-zone shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); onSelect(asset._id, e.shiftKey || e.metaKey); }}
            className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${selected ? "border-[#0057b8] bg-navy-500" : "border-[var(--apt-border)] bg-white group-hover:border-[#0057b8]"
              }`}
          >
            {selected && <Check size={11} color="#fff" strokeWidth={3} />}
          </button>
        </div>

        {/* Thumbnail */}
        <div className="w-9 h-9 rounded overflow-hidden shrink-0">
          <AssetPreview asset={asset} size={36} />
        </div>

        {/* Name + folder */}
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-medium truncate" style={{ color: "var(--apt-text-primary)" }}>{asset.filename}</p>
          <p className="text-[11px] truncate" style={{ color: "var(--apt-text-muted)" }}>{asset.folder}</p>
        </div>

        {/* Meta */}
        <div className="hidden sm:flex items-center gap-4 shrink-0 text-[11px]" style={{ color: "var(--apt-text-muted)" }}>
          <span className="w-16 text-right">{formatBytes(asset.size)}</span>
          {asset.width && asset.height && (
            <span className="w-20 text-right">{asset.width}×{asset.height}</span>
          )}
          <span className="w-16 text-right">{formatRelative(asset.createdAt)}</span>
          <span className="w-16 text-right">{asset.viewCount} views</span>
        </div>

        {/* Tags */}
        {asset.tags.length > 0 && (
          <div className="hidden lg:flex gap-1 shrink-0">
            {asset.tags.slice(0, 2).map((t) => (
              <span key={t} className="px-1.5 py-0.5 rounded-full text-[10px]" style={{ background: "var(--apt-bg-raised)", color: "var(--apt-text-muted)" }}>
                {t}
              </span>
            ))}
          </div>
        )}

        {/* Favorite */}
        <button
          onClick={(e) => { e.stopPropagation(); onAction("favorite", asset); }}
          className="action-zone shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded"
          style={{ color: asset.isFavorite ? "#d97706" : "var(--apt-text-muted)" }}
        >
          <Star size={13} fill={asset.isFavorite ? "#d97706" : "none"} />
        </button>

        {/* Context menu */}
        <div className="action-zone relative shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); }}
            className="p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ color: "var(--apt-text-muted)" }}
          >
            <MoreVertical size={14} />
          </button>
          {menuOpen && (
            <ContextMenu asset={asset} onAction={onAction} onClose={() => setMenuOpen(false)} />
          )}
        </div>
      </div>
    );
  }

  if (viewMode === "compact") {
    return (
      <div
        className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors group ${selected ? "bg-blue-50" : "hover:bg-[var(--apt-bg-subtle)]"}`}
        onClick={(e) => { if ((e.target as HTMLElement).closest(".action-zone")) return; onClick(asset); }}
      >
        <div className="action-zone shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); onSelect(asset._id, e.shiftKey || e.metaKey); }}
            className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${selected ? "border-[#0057b8] bg-navy-500" : "border-[var(--apt-border)]"
              }`}
          >
            {selected && <Check size={9} color="#fff" strokeWidth={3} />}
          </button>
        </div>
        <div className="w-7 h-7 rounded overflow-hidden shrink-0">
          <AssetPreview asset={asset} size={28} />
        </div>
        <span className="flex-1 min-w-0 text-[12px] truncate" style={{ color: "var(--apt-text-primary)" }}>
          {asset.filename}
        </span>
        <span className="text-[10px] shrink-0" style={{ color: "var(--apt-text-muted)" }}>
          {formatBytes(asset.size)}
        </span>
      </div>
    );
  }

  // Grid view
  return (
    <div
      className={`relative rounded-xl overflow-hidden cursor-pointer transition-all group ${selected ? "ring-2 ring-[#0057b8] ring-offset-2" : "hover:shadow-md"
        }`}
      style={{ border: "1px solid var(--apt-border)", background: "var(--apt-bg)" }}
      onClick={(e) => { if ((e.target as HTMLElement).closest(".action-zone")) return; onClick(asset); }}
    >
      {/* Selection checkbox */}
      <div className="action-zone absolute top-2 left-2 z-10">
        <button
          onClick={(e) => { e.stopPropagation(); onSelect(asset._id, e.shiftKey || e.metaKey); }}
          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all shadow-sm ${selected
              ? "border-[#0057b8] bg-navy-500 opacity-100"
              : "border-white/70 bg-white/80 opacity-0 group-hover:opacity-100"
            }`}
        >
          {selected && <Check size={11} color="#fff" strokeWidth={3} />}
        </button>
      </div>

      {/* Favorite */}
      <button
        onClick={(e) => { e.stopPropagation(); onAction("favorite", asset); }}
        className="action-zone absolute top-2 right-2 z-10 p-1 rounded-full bg-white/80 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ color: asset.isFavorite ? "#d97706" : "#64748b" }}
      >
        <Star size={12} fill={asset.isFavorite ? "#d97706" : "none"} />
      </button>

      {/* Preview area */}
      <div className="aspect-square w-full overflow-hidden" style={{ background: "var(--apt-bg-subtle)" }}>
        <AssetPreview asset={asset} size={300} />
      </div>

      {/* Info */}
      <div className="p-2.5">
        <p className="text-[12px] font-medium truncate leading-tight mb-0.5" style={{ color: "var(--apt-text-primary)" }}>
          {asset.filename}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-[10px]" style={{ color: "var(--apt-text-muted)" }}>
            {formatBytes(asset.size)}
            {asset.width && asset.height && ` · ${asset.width}×${asset.height}`}
          </span>
          <span className="text-[10px]" style={{ color: "var(--apt-text-muted)" }}>
            {getFileExtension(asset.filename)}
          </span>
        </div>
        {asset.tags.length > 0 && (
          <div className="flex gap-1 mt-1.5 flex-wrap">
            {asset.tags.slice(0, 2).map((t) => (
              <span key={t} className="px-1.5 py-0.5 rounded-full text-[9px] font-medium" style={{ background: "var(--apt-bg-raised)", color: "var(--apt-text-muted)" }}>
                {t}
              </span>
            ))}
            {asset.tags.length > 2 && (
              <span className="px-1.5 py-0.5 rounded-full text-[9px]" style={{ color: "var(--apt-text-muted)" }}>
                +{asset.tags.length - 2}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Hover overlay with quick actions */}
      <div
        className="absolute bottom-0 left-0 right-0 py-2 px-2.5 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1.5"
        style={{ background: "linear-gradient(to top, rgba(15,23,42,0.85), transparent)" }}
      >
        <ActionBtn icon={<Download size={12} />} title="Download" onClick={(e) => { e.stopPropagation(); onAction("download", asset); }} />
        <ActionBtn icon={<Copy size={12} />} title="Copy URL" onClick={(e) => { e.stopPropagation(); onAction("copy-url", asset); }} />
        <ActionBtn icon={<Archive size={12} />} title="Archive" onClick={(e) => { e.stopPropagation(); onAction("archive", asset); }} />
        <ActionBtn icon={<Trash2 size={12} />} title="Delete" onClick={(e) => { e.stopPropagation(); onAction("delete", asset); }} destructive />
      </div>
    </div>
  );
}

function ActionBtn({
  icon, title, onClick, destructive,
}: {
  icon: React.ReactNode;
  title: string;
  onClick: React.MouseEventHandler;
  destructive?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="action-zone p-1.5 rounded-md transition-opacity hover:opacity-80"
      style={{ background: destructive ? "#dc2626" : "rgba(255,255,255,0.2)", color: "#ffffff" }}
    >
      {icon}
    </button>
  );
}

function ContextMenu({
  asset, onAction, onClose,
}: {
  asset: Asset;
  onAction: (action: string, asset: Asset) => void;
  onClose: () => void;
}) {
  const items = [
    { label: "Copy URL", icon: <Copy size={13} />, action: "copy-url" },
    { label: "Download", icon: <Download size={13} />, action: "download" },
    { label: "Duplicate", icon: <Copy size={13} />, action: "duplicate" },
    { label: "Move", icon: <Move size={13} />, action: "move" },
    { label: "Archive", icon: <Archive size={13} />, action: "archive" },
    { label: "Delete", icon: <Trash2 size={13} />, action: "delete", destructive: true },
  ];

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        className="absolute right-0 top-6 z-50 py-1 rounded-lg shadow-xl w-40"
        style={{ background: "var(--apt-bg)", border: "1px solid var(--apt-border)" }}
      >
        {items.map(({ label, icon, action, destructive }) => (
          <button
            key={action}
            onClick={(e) => { e.stopPropagation(); onAction(action, asset); onClose(); }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] transition-colors hover:bg-[var(--apt-bg-subtle)] text-left"
            style={{ color: destructive ? "#dc2626" : "var(--apt-text-secondary)" }}
          >
            {icon}
            {label}
          </button>
        ))}
      </div>
    </>
  );
}
