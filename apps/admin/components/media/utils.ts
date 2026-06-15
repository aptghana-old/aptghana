import type { MediaType } from "./types";

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`;
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function formatRelative(dateStr: string): string {
  const date = new Date(dateStr);
  const diff = Date.now() - date.getTime();
  const s    = Math.floor(diff / 1000);
  const m    = Math.floor(s / 60);
  const h    = Math.floor(m / 60);
  const d    = Math.floor(h / 24);

  if (s < 60)  return "just now";
  if (m < 60)  return `${m}m ago`;
  if (h < 24)  return `${h}h ago`;
  if (d < 7)   return `${d}d ago`;
  if (d < 30)  return `${Math.floor(d / 7)}w ago`;
  if (d < 365) return `${Math.floor(d / 30)}mo ago`;
  return `${Math.floor(d / 365)}y ago`;
}

export function getMediaType(mimetype: string): MediaType {
  if (mimetype === "image/svg+xml")   return "svg";
  if (mimetype.startsWith("image/"))  return "image";
  if (mimetype.startsWith("video/"))  return "video";
  if (mimetype.startsWith("audio/"))  return "audio";
  if (mimetype === "application/pdf") return "pdf";
  if (mimetype.includes("spreadsheetml") || mimetype.includes("vnd.ms-excel") || mimetype === "text/csv") return "spreadsheet";
  if (mimetype.includes("wordprocessingml") || mimetype.includes("msword")) return "document";
  if (mimetype.includes("zip") || mimetype.includes("tar") || mimetype.includes("compressed")) return "archive";
  return "file";
}

export function isPreviewable(mimetype: string): boolean {
  return mimetype.startsWith("image/") || mimetype === "application/pdf" || mimetype.startsWith("video/");
}

export function getFileExtension(filename: string): string {
  const dot = filename.lastIndexOf(".");
  return dot === -1 ? "" : filename.slice(dot + 1).toUpperCase();
}

export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload  = () => { URL.revokeObjectURL(url); resolve({ width: img.naturalWidth, height: img.naturalHeight }); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Could not read image dimensions")); };
    img.src = url;
  });
}

export function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const url   = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.onloadedmetadata = () => { URL.revokeObjectURL(url); resolve(video.duration); };
    video.onerror          = () => { URL.revokeObjectURL(url); reject(new Error("Could not read video duration")); };
    video.src = url;
  });
}

export function buildPreviewUrl(url: string, width = 400): string {
  // For MinIO/S3 public assets, we just use the URL as-is
  // A future enhancement could add query params for image resizing via a transform proxy
  return url;
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}

export function downloadAsset(url: string, filename: string): void {
  const a = document.createElement("a");
  a.href     = url;
  a.download = filename;
  a.target   = "_blank";
  a.rel      = "noopener noreferrer";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export function buildFolderPath(parts: string[]): string {
  return parts.filter(Boolean).join("/");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function debounce<T extends (...args: any[]) => void>(fn: T, ms: number): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}
