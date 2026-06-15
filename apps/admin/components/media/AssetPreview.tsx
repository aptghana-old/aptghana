"use client";

import { useState } from "react";
import { FileText, Film, Music, Archive, FileSpreadsheet, File } from "lucide-react";
import type { Asset } from "./types";

interface Props {
  asset: Asset;
  size?: number;
  className?: string;
}

const TYPE_ICON: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  video:       { icon: Film,             color: "#7c3aed", bg: "#ede9fe" },
  audio:       { icon: Music,            color: "#d97706", bg: "#fef3c7" },
  pdf:         { icon: FileText,         color: "#dc2626", bg: "#fee2e2" },
  document:    { icon: FileText,         color: "#1d4ed8", bg: "#dbeafe" },
  spreadsheet: { icon: FileSpreadsheet,  color: "#15803d", bg: "#dcfce7" },
  archive:     { icon: Archive,          color: "#b45309", bg: "#fef3c7" },
  file:        { icon: File,             color: "#64748b", bg: "#f1f5f9" },
};

export function AssetPreview({ asset, size = 200, className = "" }: Props) {
  const [errored, setErrored] = useState(false);

  if ((asset.mediaType === "image" || asset.mediaType === "svg") && !errored) {
    return (
      <img
        src={asset.thumbnails?.small ?? asset.url}
        alt={asset.altText || asset.filename}
        width={size}
        height={size}
        loading="lazy"
        decoding="async"
        onError={() => setErrored(true)}
        className={`w-full h-full object-cover ${className}`}
        style={{ display: "block" }}
      />
    );
  }

  const config = TYPE_ICON[asset.mediaType] ?? TYPE_ICON.file;
  const Icon   = config.icon;
  const ext    = asset.filename.split(".").pop()?.toUpperCase() ?? "";

  return (
    <div
      className={`w-full h-full flex flex-col items-center justify-center gap-1 ${className}`}
      style={{ background: config.bg }}
    >
      <Icon size={Math.min(size * 0.35, 48)} style={{ color: config.color }} strokeWidth={1.5} />
      {size >= 60 && (
        <span className="text-[10px] font-bold tracking-wide uppercase" style={{ color: config.color }}>
          {ext}
        </span>
      )}
    </div>
  );
}
