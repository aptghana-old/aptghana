"use client";

import { useState } from "react";
import { X, Trash2, Archive, RotateCcw, Move, Tag, Download, Star } from "lucide-react";
import { downloadAsset } from "./utils";
import type { Asset } from "./types";

interface Props {
  selectedIds: Set<string>;
  assets: Asset[];
  onClear: () => void;
  onBulkAction: (operation: string, data?: { folder?: string; tags?: string[] }) => Promise<void>;
}

export function BulkActionsBar({ selectedIds, assets, onClear, onBulkAction }: Props) {
  const [pending,    setPending]    = useState<string | null>(null);
  const [tagInput,   setTagInput]   = useState("");
  const [showTagUI,  setShowTagUI]  = useState(false);
  const [showMoveUI, setShowMoveUI] = useState(false);
  const [moveTarget, setMoveTarget] = useState("");

  const count = selectedIds.size;
  if (count === 0) return null;

  async function run(operation: string, data?: { folder?: string; tags?: string[] }) {
    setPending(operation);
    try {
      await onBulkAction(operation, data);
      setShowTagUI(false);
      setShowMoveUI(false);
      setTagInput("");
      setMoveTarget("");
    } finally {
      setPending(null);
    }
  }

  function handleDownload() {
    const selected = assets.filter((a) => selectedIds.has(a._id));
    selected.forEach((a) => downloadAsset(a.url, a.filename));
  }

  return (
    <div
      className="flex items-center gap-2 px-4 py-2.5 border-b shrink-0 flex-wrap"
      style={{ background: "#0a1628", borderColor: "rgba(255,255,255,0.1)" }}
    >
      {/* Count */}
      <div className="flex items-center gap-2 mr-2">
        <span className="text-[13px] font-semibold text-white">{count} selected</span>
        <button
          onClick={onClear}
          className="p-1 rounded hover:bg-white/10 transition-colors"
          style={{ color: "rgba(255,255,255,0.6)" }}
        >
          <X size={13} />
        </button>
      </div>

      {/* Actions */}
      <BulkBtn icon={<Download size={13} />}  label="Download"  onClick={handleDownload} pending={pending === "download"} />
      <BulkBtn icon={<Star size={13} />}      label="Favorite"  onClick={() => run("favorite")} pending={pending === "favorite"} />
      <BulkBtn icon={<Archive size={13} />}   label="Archive"   onClick={() => run("archive")} pending={pending === "archive"} />
      <BulkBtn icon={<RotateCcw size={13} />} label="Restore"   onClick={() => run("restore")} pending={pending === "restore"} />

      <BulkBtn
        icon={<Tag size={13} />}
        label="Tag"
        onClick={() => { setShowTagUI((v) => !v); setShowMoveUI(false); }}
        active={showTagUI}
        pending={false}
      />
      <BulkBtn
        icon={<Move size={13} />}
        label="Move"
        onClick={() => { setShowMoveUI((v) => !v); setShowTagUI(false); }}
        active={showMoveUI}
        pending={false}
      />

      {showTagUI && (
        <div className="flex items-center gap-2 ml-2">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            placeholder="tag1, tag2"
            className="text-[12px] px-2 py-1 rounded border"
            style={{ background: "rgba(255,255,255,0.1)", borderColor: "rgba(255,255,255,0.2)", color: "#ffffff", width: 140 }}
            onKeyDown={(e) => { if (e.key === "Enter") run("add-tags", { tags: tagInput.split(",").map((t) => t.trim()).filter(Boolean) }); }}
          />
          <button
            onClick={() => run("add-tags", { tags: tagInput.split(",").map((t) => t.trim()).filter(Boolean) })}
            className="px-3 py-1 rounded text-[12px] font-medium"
            style={{ background: "#0057b8", color: "#ffffff" }}
          >
            Add tags
          </button>
          <button
            onClick={() => run("remove-tags", { tags: tagInput.split(",").map((t) => t.trim()).filter(Boolean) })}
            className="px-3 py-1 rounded text-[12px] font-medium"
            style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)" }}
          >
            Remove tags
          </button>
        </div>
      )}

      {showMoveUI && (
        <div className="flex items-center gap-2 ml-2">
          <select
            value={moveTarget}
            onChange={(e) => setMoveTarget(e.target.value)}
            className="text-[12px] px-2 py-1 rounded border"
            style={{ background: "rgba(255,255,255,0.1)", borderColor: "rgba(255,255,255,0.2)", color: "#ffffff" }}
          >
            <option value="">Select folder…</option>
            {["products", "brands", "categories", "datasheets", "manuals", "videos", "marketing", "certificates", "homepage"].map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
          <button
            onClick={() => moveTarget && run("move", { folder: moveTarget })}
            disabled={!moveTarget}
            className="px-3 py-1 rounded text-[12px] font-medium disabled:opacity-50"
            style={{ background: "#0057b8", color: "#ffffff" }}
          >
            Move here
          </button>
        </div>
      )}

      <div className="ml-auto">
        <BulkBtn
          icon={<Trash2 size={13} />}
          label="Delete"
          onClick={() => run("delete")}
          pending={pending === "delete"}
          destructive
        />
      </div>
    </div>
  );
}

function BulkBtn({
  icon, label, onClick, pending, active, destructive,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  pending: boolean;
  active?: boolean;
  destructive?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={pending}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors disabled:opacity-50"
      style={
        destructive
          ? { background: "#dc2626", color: "#ffffff" }
          : active
          ? { background: "#0057b8", color: "#ffffff" }
          : { background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.85)" }
      }
    >
      {icon}
      {pending ? "…" : label}
    </button>
  );
}
