"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Upload, X, CheckCircle, AlertCircle, Loader2, File, Image, Film, FileText, RotateCcw } from "lucide-react";
import type { UploadItem, Asset } from "./types";
import { formatBytes, getImageDimensions, getVideoDuration, getMediaType } from "./utils";

interface Props {
  defaultFolder?: string;
  onUploadComplete: (assets: Asset[]) => void;
  onClose: () => void;
}

export function UploadManager({ defaultFolder = "uncategorized", onUploadComplete, onClose }: Props) {
  const [items,     setItems]     = useState<UploadItem[]>([]);
  const [folder,    setFolder]    = useState(defaultFolder);
  const [dragging,  setDragging]  = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const completedAssets = items.filter((i) => i.status === "done" && i.asset).map((i) => i.asset!);
  const hasItems        = items.length > 0;
  const allDone         = hasItems && items.every((i) => i.status === "done" || i.status === "error");
  const inProgress      = items.some((i) => i.status === "uploading" || i.status === "reading");

  function addFiles(files: File[]) {
    const newItems: UploadItem[] = files.map((file) => ({
      id:       `${Date.now()}-${Math.random()}`,
      file,
      folder,
      tags:     [],
      altText:  "",
      progress: 0,
      status:   "queued",
    }));
    setItems((prev) => [...prev, ...newItems]);
  }

  const uploadItem = useCallback(
    async (item: UploadItem) => {
      setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, status: "reading" } : i));

      // Read metadata client-side before uploading
      let width: number | undefined;
      let height: number | undefined;
      let duration: number | undefined;

      const mt = getMediaType(item.file.type);

      if (mt === "image" || mt === "svg") {
        try {
          const dims = await getImageDimensions(item.file);
          width  = dims.width;
          height = dims.height;
        } catch { /* ignore */ }
      }

      if (mt === "video") {
        try {
          duration = await getVideoDuration(item.file);
        } catch { /* ignore */ }
      }

      const form = new FormData();
      form.append("file",      item.file);
      form.append("folder",    item.folder || folder);
      form.append("tags",      JSON.stringify(item.tags));
      form.append("altText",   item.altText);
      if (width)    form.append("width",    String(width));
      if (height)   form.append("height",   String(height));
      if (duration) form.append("duration", String(duration));

      await new Promise<void>((resolve) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const pct = Math.round((e.loaded / e.total) * 100);
            setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, progress: pct, status: "uploading" } : i));
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            const res = JSON.parse(xhr.responseText) as { ok: boolean; asset?: Asset };
            setItems((prev) => prev.map((i) => i.id === item.id
              ? { ...i, status: "done", progress: 100, asset: res.asset }
              : i,
            ));
          } else {
            let errMsg = "Upload failed";
            try {
              const err = JSON.parse(xhr.responseText) as { error?: string };
              errMsg = err.error ?? errMsg;
            } catch { /* ignore */ }
            setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, status: "error", error: errMsg } : i));
          }
          resolve();
        };

        xhr.onerror = () => {
          setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, status: "error", error: "Network error" } : i));
          resolve();
        };

        xhr.open("POST", "/api/assets/upload");
        xhr.send(form);

        setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, xhr, status: "uploading" } : i));
      });
    },
    [folder],
  );

  // Auto-start queued uploads (max 3 concurrent)
  useEffect(() => {
    const queued    = items.filter((i) => i.status === "queued");
    const uploading = items.filter((i) => i.status === "uploading" || i.status === "reading");
    const slots     = 3 - uploading.length;

    if (slots > 0 && queued.length > 0) {
      queued.slice(0, slots).forEach((item) => void uploadItem(item));
    }
  }, [items, uploadItem]);

  function removeItem(id: string) {
    const item = items.find((i) => i.id === id);
    if (item?.xhr && (item.status === "uploading" || item.status === "reading")) {
      item.xhr.abort();
    }
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  function retryItem(id: string) {
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, status: "queued", progress: 0, error: undefined, xhr: undefined } : i));
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) addFiles(files);
  }

  function handleDone() {
    if (completedAssets.length > 0) onUploadComplete(completedAssets);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "var(--apt-bg-overlay)" }}
    >
      <div
        className="w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden"
        style={{ background: "var(--apt-bg)", border: "1px solid var(--apt-border)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b shrink-0" style={{ borderColor: "var(--apt-border)" }}>
          <div>
            <h2 className="text-[15px] font-semibold" style={{ color: "var(--apt-text-primary)" }}>Upload Assets</h2>
            <p className="text-[12px]" style={{ color: "var(--apt-text-muted)" }}>
              {inProgress ? `Uploading ${items.filter((i) => i.status === "uploading").length} file(s)…` : "Drag & drop or click to select files"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-colors hover:bg-[var(--apt-bg-raised)]"
            style={{ color: "var(--apt-text-muted)" }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Folder selector */}
        <div className="px-5 py-3 border-b flex items-center gap-3 shrink-0" style={{ borderColor: "var(--apt-border)" }}>
          <label className="text-[12px] font-medium shrink-0" style={{ color: "var(--apt-text-secondary)" }}>Upload to:</label>
          <select
            value={folder}
            onChange={(e) => setFolder(e.target.value)}
            className="flex-1 text-[12px] px-2 py-1.5 rounded-md border"
            style={{ background: "var(--apt-bg)", borderColor: "var(--apt-border)", color: "var(--apt-text-primary)" }}
          >
            {["products", "brands", "categories", "datasheets", "manuals", "videos", "marketing", "certificates", "homepage", "avatars/admins", "uncategorized"].map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
          <span className="text-[11px] shrink-0" style={{ color: "var(--apt-text-muted)" }}>
            or type a custom path
          </span>
          <input
            type="text"
            value={folder}
            onChange={(e) => setFolder(e.target.value)}
            placeholder="custom/folder/path"
            className="w-40 text-[12px] px-2 py-1.5 rounded-md border"
            style={{ background: "var(--apt-bg)", borderColor: "var(--apt-border)", color: "var(--apt-text-primary)" }}
          />
        </div>

        {/* Drop zone */}
        <div
          className={`mx-5 mt-4 shrink-0 rounded-xl border-2 border-dashed transition-colors cursor-pointer ${
            dragging ? "border-[#0057b8] bg-blue-50" : "border-[var(--apt-border)]"
          }`}
          style={{ padding: "24px 16px" }}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            accept="image/*,video/*,application/pdf,.doc,.docx,.xls,.xlsx,.csv,.zip"
            onChange={(e) => {
              const files = Array.from(e.target.files ?? []);
              if (files.length > 0) addFiles(files);
              e.target.value = "";
            }}
          />
          <div className="flex flex-col items-center gap-2 text-center">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: dragging ? "#dbeafe" : "var(--apt-bg-raised)", color: dragging ? "#0057b8" : "var(--apt-text-muted)" }}
            >
              <Upload size={18} />
            </div>
            <div>
              <p className="text-[13px] font-medium" style={{ color: "var(--apt-text-primary)" }}>
                {dragging ? "Drop files here" : "Click to browse or drag & drop"}
              </p>
              <p className="text-[11px]" style={{ color: "var(--apt-text-muted)" }}>
                Images, PDFs, videos, documents · Max 500 MB per file
              </p>
            </div>
          </div>
        </div>

        {/* Upload queue */}
        {hasItems && (
          <div className="flex-1 overflow-y-auto mx-5 mt-3 mb-1 space-y-2 min-h-0" style={{ scrollbarWidth: "thin" }}>
            {items.map((item) => (
              <UploadRow
                key={item.id}
                item={item}
                onRemove={() => removeItem(item.id)}
                onRetry={() => retryItem(item.id)}
              />
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t shrink-0" style={{ borderColor: "var(--apt-border)" }}>
          <span className="text-[12px]" style={{ color: "var(--apt-text-muted)" }}>
            {completedAssets.length} / {items.length} uploaded
            {items.filter((i) => i.status === "error").length > 0 && (
              <span style={{ color: "#dc2626" }}>
                {" "}· {items.filter((i) => i.status === "error").length} failed
              </span>
            )}
          </span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-[13px] font-medium"
              style={{ background: "var(--apt-bg-raised)", color: "var(--apt-text-secondary)" }}
            >
              {allDone ? "Close" : "Cancel"}
            </button>
            {completedAssets.length > 0 && (
              <button
                onClick={handleDone}
                className="px-4 py-2 rounded-lg text-[13px] font-medium transition-opacity hover:opacity-80"
                style={{ background: "#0057b8", color: "#ffffff" }}
              >
                Done ({completedAssets.length} uploaded)
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function UploadRow({
  item, onRemove, onRetry,
}: {
  item: UploadItem;
  onRemove: () => void;
  onRetry: () => void;
}) {
  const mt   = getMediaType(item.file.type);
  const Icon = mt === "image" || mt === "svg" ? Image : mt === "video" ? Film : mt === "pdf" ? FileText : File;

  return (
    <div
      className="flex items-center gap-3 p-3 rounded-lg"
      style={{ background: "var(--apt-bg-subtle)", border: "1px solid var(--apt-border)" }}
    >
      {/* Icon */}
      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "var(--apt-bg-raised)" }}>
        <Icon size={16} style={{ color: "var(--apt-text-muted)" }} />
      </div>

      {/* Name + progress */}
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-medium truncate" style={{ color: "var(--apt-text-primary)" }}>{item.file.name}</p>
        <p className="text-[11px]" style={{ color: "var(--apt-text-muted)" }}>{formatBytes(item.file.size)}</p>

        {(item.status === "uploading" || item.status === "reading") && (
          <div className="mt-1.5 h-1 rounded-full overflow-hidden" style={{ background: "var(--apt-bg-raised)" }}>
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{ width: `${item.progress}%`, background: "#0057b8" }}
            />
          </div>
        )}

        {item.status === "error" && (
          <p className="text-[11px] mt-0.5" style={{ color: "#dc2626" }}>{item.error}</p>
        )}
      </div>

      {/* Status icon */}
      <div className="shrink-0">
        {item.status === "queued" && (
          <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "var(--apt-bg-raised)", color: "var(--apt-text-muted)" }}>
            Queued
          </span>
        )}
        {(item.status === "uploading" || item.status === "reading") && (
          <div className="flex items-center gap-1">
            <Loader2 size={14} className="animate-spin" style={{ color: "#0057b8" }} />
            <span className="text-[11px] tabular-nums" style={{ color: "#0057b8" }}>{item.progress}%</span>
          </div>
        )}
        {item.status === "done" && <CheckCircle size={16} style={{ color: "#16a34a" }} />}
        {item.status === "error" && (
          <div className="flex items-center gap-1">
            <AlertCircle size={14} style={{ color: "#dc2626" }} />
            <button onClick={onRetry} className="p-1 rounded hover:bg-[var(--apt-bg-raised)]" title="Retry">
              <RotateCcw size={12} style={{ color: "var(--apt-text-muted)" }} />
            </button>
          </div>
        )}
      </div>

      {/* Remove */}
      <button
        onClick={onRemove}
        className="p-1 rounded hover:bg-[var(--apt-bg-raised)] shrink-0"
        style={{ color: "var(--apt-text-muted)" }}
        title="Remove from queue"
      >
        <X size={13} />
      </button>
    </div>
  );
}
