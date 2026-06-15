"use client";

import { useState } from "react";
import { ChevronRight, FolderOpen, Folder } from "lucide-react";
import type { FolderNode } from "./types";
import { FOLDER_ICONS } from "./types";
import { formatBytes } from "./utils";

interface Props {
  folders: FolderNode[];
  activeFolder: string | null;
  onSelectFolder: (path: string | null) => void;
}

export function FolderTree({ folders, activeFolder, onSelectFolder }: Props) {
  return (
    <div className="space-y-0.5">
      <button
        onClick={() => onSelectFolder(null)}
        className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-[13px] font-medium transition-colors ${
          activeFolder === null ? "text-white" : ""
        }`}
        style={
          activeFolder === null
            ? { background: "#0057b8", color: "#ffffff" }
            : { color: "var(--apt-text-secondary)" }
        }
      >
        <FolderOpen size={14} className="shrink-0" />
        <span className="truncate">All Assets</span>
      </button>

      {folders.map((folder) => (
        <FolderItem
          key={folder.path}
          folder={folder}
          activeFolder={activeFolder}
          onSelectFolder={onSelectFolder}
          depth={0}
        />
      ))}
    </div>
  );
}

interface FolderItemProps {
  folder: FolderNode;
  activeFolder: string | null;
  onSelectFolder: (path: string | null) => void;
  depth: number;
}

function FolderItem({ folder, activeFolder, onSelectFolder, depth }: FolderItemProps) {
  const [expanded, setExpanded] = useState(depth === 0);
  const hasChildren = folder.children.length > 0;
  const isActive    = activeFolder === folder.path;
  const isAncestor  = activeFolder?.startsWith(folder.path + "/") ?? false;

  const rootName  = folder.path.split("/")[0];
  const emoji     = FOLDER_ICONS[rootName] ?? FOLDER_ICONS.default;

  return (
    <div>
      <div
        className="flex items-center gap-1 rounded-md transition-colors group"
        style={
          isActive
            ? { background: "#0057b8" }
            : isAncestor
            ? { background: "var(--apt-bg-raised)" }
            : {}
        }
      >
        {hasChildren ? (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="p-1 rounded transition-transform"
            style={{ color: isActive ? "#ffffff" : "var(--apt-text-muted)" }}
          >
            <ChevronRight
              size={12}
              className="transition-transform duration-150"
              style={{ transform: expanded ? "rotate(90deg)" : "rotate(0deg)" }}
            />
          </button>
        ) : (
          <span className="w-5 shrink-0" />
        )}

        <button
          onClick={() => onSelectFolder(folder.path)}
          className="flex-1 flex items-center gap-2 py-1.5 pr-2 text-[12px] text-left truncate"
          style={{
            color: isActive ? "#ffffff" : "var(--apt-text-secondary)",
            paddingLeft: `${depth * 8}px`,
          }}
        >
          <span className="text-[11px] shrink-0">{emoji}</span>
          <span className="truncate font-medium">{folder.name}</span>
          <span
            className="ml-auto shrink-0 text-[10px] tabular-nums"
            style={{ color: isActive ? "rgba(255,255,255,0.7)" : "var(--apt-text-muted)" }}
          >
            {folder.count}
          </span>
        </button>
      </div>

      {expanded && hasChildren && (
        <div className="ml-2">
          {folder.children.map((child) => (
            <FolderItem
              key={child.path}
              folder={child}
              activeFolder={activeFolder}
              onSelectFolder={onSelectFolder}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
