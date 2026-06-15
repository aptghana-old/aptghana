"use client";

import { useState } from "react";
import {
  X, Copy, Download, Archive, Trash2, Edit2, Star, Link2, Move,
  RotateCcw, ExternalLink, Eye, RefreshCw, Check, AlertTriangle,
} from "lucide-react";
import type { Asset } from "./types";
import { AssetPreview } from "./AssetPreview";
import { formatBytes, formatRelative, copyToClipboard, downloadAsset } from "./utils";

interface Props {
  asset: Asset;
  onClose: () => void;
  onUpdate: (updated: Asset) => void;
  onDelete: (id: string) => void;
}

type PanelTab = "info" | "usage" | "history";

export function AssetDetailsPanel({ asset, onClose, onUpdate, onDelete }: Props) {
  const [tab,          setTab]          = useState<PanelTab>("info");
  const [editing,      setEditing]      = useState(false);
  const [saving,       setSaving]       = useState(false);
  const [copied,       setCopied]       = useState<string | null>(null);
  const [confirmDelete,setConfirmDelete]= useState(false);

  const [editAlt,  setEditAlt]  = useState(asset.altText  ?? "");
  const [editDesc, setEditDesc] = useState(asset.description ?? "");
  const [editTags, setEditTags] = useState(asset.tags.join(", "));
  const [editName, setEditName] = useState(asset.filename);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/assets/${asset._id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          filename:    editName,
          altText:     editAlt,
          description: editDesc,
          tags:        editTags.split(",").map((t) => t.trim()).filter(Boolean),
        }),
      });
      if (res.ok) {
        const { asset: updated } = await res.json() as { asset: Asset };
        onUpdate({ ...asset, ...updated, mediaType: asset.mediaType });
        setEditing(false);
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleAction(action: string) {
    switch (action) {
      case "favorite": {
        const res = await fetch(`/api/assets/${asset._id}`, {
          method:  "PATCH",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ isFavorite: !asset.isFavorite }),
        });
        if (res.ok) {
          const { asset: updated } = await res.json() as { asset: Asset };
          onUpdate({ ...asset, ...updated, mediaType: asset.mediaType });
        }
        break;
      }
      case "archive": {
        await fetch(`/api/assets/${asset._id}`, {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ action: asset.status === "archived" ? "restore" : "archive" }),
        });
        onUpdate({ ...asset, status: asset.status === "archived" ? "active" : "archived" });
        break;
      }
      case "delete": {
        if (!confirmDelete) { setConfirmDelete(true); return; }
        const res = await fetch(`/api/assets/${asset._id}`, { method: "DELETE" });
        if (res.ok) onDelete(asset._id);
        break;
      }
      case "duplicate": {
        const res = await fetch(`/api/assets/${asset._id}`, {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ action: "duplicate" }),
        });
        if (res.ok) {
          const { asset: dup } = await res.json() as { asset: Asset };
          onUpdate(dup);
        }
        break;
      }
    }
  }

  function handleCopy(value: string, key: string) {
    copyToClipboard(value).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    });
  }

  const storageUrl = asset.url;
  const publicPath = `/${asset.key}`;

  return (
    <div
      className="flex flex-col h-full border-l"
      style={{ background: "var(--apt-bg)", borderColor: "var(--apt-border)", width: 380, minWidth: 380 }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b shrink-0"
        style={{ borderColor: "var(--apt-border)" }}
      >
        <h3 className="text-[13px] font-semibold truncate mr-2" style={{ color: "var(--apt-text-primary)" }}>
          Asset Details
        </h3>
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleAction("favorite")}
            className="p-1.5 rounded-md transition-colors hover:bg-[var(--apt-bg-raised)]"
            style={{ color: asset.isFavorite ? "#d97706" : "var(--apt-text-muted)" }}
            title={asset.isFavorite ? "Unmark favorite" : "Mark as favorite"}
          >
            <Star size={14} fill={asset.isFavorite ? "#d97706" : "none"} />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md transition-colors hover:bg-[var(--apt-bg-raised)]"
            style={{ color: "var(--apt-text-muted)" }}
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Preview */}
      <div
        className="aspect-video w-full overflow-hidden shrink-0"
        style={{ background: "var(--apt-bg-subtle)" }}
      >
        {asset.mediaType === "video" ? (
          <video
            src={asset.url}
            controls
            className="w-full h-full object-contain"
            style={{ maxHeight: 200 }}
          />
        ) : asset.mediaType === "pdf" ? (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2">
            <AssetPreview asset={asset} size={120} />
            <a
              href={asset.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[12px] flex items-center gap-1 hover:underline"
              style={{ color: "#0057b8" }}
            >
              <ExternalLink size={11} /> Open PDF
            </a>
          </div>
        ) : (
          <AssetPreview asset={asset} size={380} />
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b shrink-0" style={{ borderColor: "var(--apt-border)" }}>
        {(["info", "usage", "history"] as PanelTab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="flex-1 py-2 text-[12px] font-medium capitalize transition-colors"
            style={
              tab === t
                ? { color: "#0057b8", borderBottom: "2px solid #0057b8" }
                : { color: "var(--apt-text-muted)" }
            }
          >
            {t}
            {t === "usage" && asset.usedIn.length > 0 && (
              <span
                className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px]"
                style={{ background: "#0057b8", color: "#ffffff" }}
              >
                {asset.usedIn.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
        {tab === "info" && (
          <div className="p-4 space-y-4">
            {/* Filename */}
            <Field label="Filename">
              {editing ? (
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full text-[12px] px-2 py-1.5 rounded border"
                  style={{ borderColor: "var(--apt-border)", background: "var(--apt-bg)", color: "var(--apt-text-primary)" }}
                />
              ) : (
                <span className="text-[12px] break-all" style={{ color: "var(--apt-text-primary)" }}>{asset.filename}</span>
              )}
            </Field>

            {/* URLs */}
            <Field label="Public URL">
              <div className="flex items-center gap-1.5">
                <code className="flex-1 text-[11px] break-all truncate" style={{ color: "var(--apt-text-secondary)" }}>
                  {storageUrl}
                </code>
                <button onClick={() => handleCopy(storageUrl, "url")} className="p-1 rounded shrink-0 hover:bg-[var(--apt-bg-raised)]" style={{ color: "var(--apt-text-muted)" }}>
                  {copied === "url" ? <Check size={12} color="#16a34a" /> : <Copy size={12} />}
                </button>
                <a href={storageUrl} target="_blank" rel="noopener noreferrer" className="p-1 rounded shrink-0 hover:bg-[var(--apt-bg-raised)]" style={{ color: "var(--apt-text-muted)" }}>
                  <ExternalLink size={12} />
                </a>
              </div>
            </Field>

            <Field label="Storage Key">
              <div className="flex items-center gap-1.5">
                <code className="flex-1 text-[11px] break-all truncate" style={{ color: "var(--apt-text-secondary)" }}>
                  {asset.key}
                </code>
                <button onClick={() => handleCopy(asset.key, "key")} className="p-1 rounded shrink-0 hover:bg-[var(--apt-bg-raised)]" style={{ color: "var(--apt-text-muted)" }}>
                  {copied === "key" ? <Check size={12} color="#16a34a" /> : <Copy size={12} />}
                </button>
              </div>
            </Field>

            {/* Metadata grid */}
            <div className="grid grid-cols-2 gap-2">
              <MetaItem label="Type"     value={asset.mimetype.split("/")[1]?.toUpperCase() ?? asset.mimetype} />
              <MetaItem label="Size"     value={formatBytes(asset.size)} />
              {asset.width && asset.height && (
                <MetaItem label="Dimensions" value={`${asset.width} × ${asset.height}`} />
              )}
              {asset.duration && (
                <MetaItem label="Duration" value={`${Math.round(asset.duration)}s`} />
              )}
              {asset.pageCount && (
                <MetaItem label="Pages" value={`${asset.pageCount}`} />
              )}
              <MetaItem label="Folder"   value={asset.folder} />
              <MetaItem label="Uploaded" value={formatRelative(asset.createdAt)} />
              <MetaItem label="Modified" value={formatRelative(asset.updatedAt)} />
              <MetaItem label="Views"    value={asset.viewCount.toLocaleString()} />
              <MetaItem label="Downloads" value={asset.downloadCount.toLocaleString()} />
            </div>

            {/* Alt text */}
            <Field label="Alt Text">
              {editing ? (
                <textarea
                  value={editAlt}
                  onChange={(e) => setEditAlt(e.target.value)}
                  rows={2}
                  className="w-full text-[12px] px-2 py-1.5 rounded border resize-none"
                  placeholder="Describe this image for screen readers…"
                  style={{ borderColor: "var(--apt-border)", background: "var(--apt-bg)", color: "var(--apt-text-primary)" }}
                />
              ) : (
                <span className="text-[12px]" style={{ color: asset.altText ? "var(--apt-text-primary)" : "var(--apt-text-muted)" }}>
                  {asset.altText || "No alt text set"}
                </span>
              )}
            </Field>

            {/* Description */}
            <Field label="Description">
              {editing ? (
                <textarea
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  rows={3}
                  className="w-full text-[12px] px-2 py-1.5 rounded border resize-none"
                  placeholder="Add a description…"
                  style={{ borderColor: "var(--apt-border)", background: "var(--apt-bg)", color: "var(--apt-text-primary)" }}
                />
              ) : (
                <span className="text-[12px]" style={{ color: asset.description ? "var(--apt-text-primary)" : "var(--apt-text-muted)" }}>
                  {asset.description || "No description"}
                </span>
              )}
            </Field>

            {/* Tags */}
            <Field label="Tags">
              {editing ? (
                <input
                  value={editTags}
                  onChange={(e) => setEditTags(e.target.value)}
                  className="w-full text-[12px] px-2 py-1.5 rounded border"
                  placeholder="tag1, tag2, tag3"
                  style={{ borderColor: "var(--apt-border)", background: "var(--apt-bg)", color: "var(--apt-text-primary)" }}
                />
              ) : asset.tags.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {asset.tags.map((t) => (
                    <span key={t} className="px-2 py-0.5 rounded-full text-[11px]" style={{ background: "var(--apt-bg-raised)", color: "var(--apt-text-secondary)" }}>
                      {t}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-[12px]" style={{ color: "var(--apt-text-muted)" }}>No tags</span>
              )}
            </Field>
          </div>
        )}

        {tab === "usage" && (
          <div className="p-4">
            {asset.usedIn.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
                <Eye size={28} style={{ color: "var(--apt-text-muted)" }} />
                <p className="text-[13px] font-medium" style={{ color: "var(--apt-text-primary)" }}>Not in use</p>
                <p className="text-[12px]" style={{ color: "var(--apt-text-muted)" }}>This asset isn't referenced by any products or pages.</p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-[11px] font-medium mb-3" style={{ color: "var(--apt-text-muted)" }}>
                  Used in {asset.usedIn.length} place{asset.usedIn.length !== 1 ? "s" : ""}
                </p>
                {asset.usedIn.map((ref, i) => (
                  <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-lg" style={{ background: "var(--apt-bg-subtle)", border: "1px solid var(--apt-border)" }}>
                    <Link2 size={13} className="shrink-0 mt-0.5" style={{ color: "var(--apt-text-muted)" }} />
                    <div>
                      <p className="text-[12px] font-medium" style={{ color: "var(--apt-text-primary)" }}>{ref.entityName}</p>
                      <p className="text-[11px]" style={{ color: "var(--apt-text-muted)" }}>
                        {ref.type} · {ref.field}
                      </p>
                    </div>
                  </div>
                ))}
                <div className="mt-3 p-2.5 rounded-lg flex items-start gap-2" style={{ background: "#fef3c7", border: "1px solid #fde68a" }}>
                  <AlertTriangle size={13} className="shrink-0 mt-0.5" style={{ color: "#b45309" }} />
                  <p className="text-[11px]" style={{ color: "#b45309" }}>
                    Deleting this asset will break the references above. Use Archive to hide it without breaking references.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "history" && (
          <div className="p-4">
            <div className="space-y-2">
              <HistoryItem label="Uploaded" date={asset.createdAt} by={asset.uploadedBy} />
              <HistoryItem label="Last modified" date={asset.updatedAt} />
            </div>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="p-4 border-t space-y-2 shrink-0" style={{ borderColor: "var(--apt-border)" }}>
        {editing ? (
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-2 rounded-lg text-[13px] font-medium transition-opacity hover:opacity-80 disabled:opacity-50"
              style={{ background: "#0057b8", color: "#ffffff" }}
            >
              {saving ? "Saving…" : "Save Changes"}
            </button>
            <button
              onClick={() => setEditing(false)}
              className="flex-1 py-2 rounded-lg text-[13px] font-medium"
              style={{ background: "var(--apt-bg-raised)", color: "var(--apt-text-secondary)" }}
            >
              Cancel
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2">
              <ActionButton icon={<Edit2 size={13} />}    label="Edit metadata"  onClick={() => setEditing(true)} />
              <ActionButton icon={<Download size={13} />} label="Download"       onClick={() => downloadAsset(asset.url, asset.filename)} />
              <ActionButton icon={<Copy size={13} />}     label="Copy URL"       onClick={() => handleCopy(asset.url, "url")} />
              <ActionButton icon={<RefreshCw size={13} />}label="Duplicate"      onClick={() => handleAction("duplicate")} />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <ActionButton
                icon={<Archive size={13} />}
                label={asset.status === "archived" ? "Restore" : "Archive"}
                onClick={() => handleAction("archive")}
                variant="warning"
              />
              <ActionButton
                icon={<Trash2 size={13} />}
                label={confirmDelete ? "Confirm Delete" : "Delete"}
                onClick={() => handleAction("delete")}
                variant="destructive"
              />
            </div>
            {confirmDelete && (
              <div className="flex gap-2">
                <button onClick={() => setConfirmDelete(false)} className="flex-1 py-1.5 text-[12px] rounded-md" style={{ background: "var(--apt-bg-raised)", color: "var(--apt-text-secondary)" }}>
                  Cancel
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wide mb-1" style={{ color: "var(--apt-text-muted)" }}>{label}</p>
      {children}
    </div>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-2 rounded-lg" style={{ background: "var(--apt-bg-subtle)", border: "1px solid var(--apt-border)" }}>
      <p className="text-[10px]" style={{ color: "var(--apt-text-muted)" }}>{label}</p>
      <p className="text-[12px] font-medium truncate" style={{ color: "var(--apt-text-primary)" }}>{value}</p>
    </div>
  );
}

function ActionButton({
  icon, label, onClick, variant = "default",
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  variant?: "default" | "warning" | "destructive";
}) {
  const styles = {
    default:     { background: "var(--apt-bg-raised)",  color: "var(--apt-text-secondary)" },
    warning:     { background: "#fef3c7",               color: "#b45309" },
    destructive: { background: "#fee2e2",               color: "#dc2626" },
  };
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-center gap-1.5 py-2 rounded-lg text-[12px] font-medium transition-opacity hover:opacity-80"
      style={styles[variant]}
    >
      {icon} {label}
    </button>
  );
}

function HistoryItem({ label, date, by }: { label: string; date: string; by?: string }) {
  return (
    <div className="flex items-start gap-2.5 p-2.5 rounded-lg" style={{ background: "var(--apt-bg-subtle)", border: "1px solid var(--apt-border)" }}>
      <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: "#0057b8" }} />
      <div>
        <p className="text-[12px] font-medium" style={{ color: "var(--apt-text-primary)" }}>{label}</p>
        <p className="text-[11px]" style={{ color: "var(--apt-text-muted)" }}>
          {new Date(date).toLocaleString()}
          {by && ` · by ${by}`}
        </p>
      </div>
    </div>
  );
}
