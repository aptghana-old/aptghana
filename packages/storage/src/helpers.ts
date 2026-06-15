// ─── MIME type utilities ──────────────────────────────────────────────────────

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg":  ".jpg",
  "image/png":   ".png",
  "image/webp":  ".webp",
  "image/gif":   ".gif",
  "application/pdf": ".pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
  "application/msword": ".doc",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
  "application/vnd.ms-excel": ".xls",
  "video/mp4":  ".mp4",
  "video/webm": ".webm",
  "text/csv":   ".csv",
};

export function mimeToExtension(mime: string): string {
  return MIME_TO_EXT[mime.toLowerCase()] ?? "";
}

export function isImageMime(mime: string): boolean {
  return mime.startsWith("image/");
}

export function isDocumentMime(mime: string): boolean {
  return (
    mime === "application/pdf" ||
    mime.includes("wordprocessingml") ||
    mime.includes("spreadsheetml") ||
    mime === "application/msword" ||
    mime === "application/vnd.ms-excel" ||
    mime === "text/csv"
  );
}

export function isVideoMime(mime: string): boolean {
  return mime.startsWith("video/");
}

// ─── File size formatting ─────────────────────────────────────────────────────

export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}

// ─── Filename sanitization ────────────────────────────────────────────────────

export function sanitizeFilename(filename: string): string {
  return filename
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9._-]/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 200);
}

/** Build a deterministic object key for a known entity (e.g. brand logo) */
export function buildEntityKey(
  folder: string,
  entitySlug: string,
  filename: string,
): string {
  const safe = sanitizeFilename(filename);
  return `${folder}/${entitySlug}/${safe}`;
}

// ─── Allowed type guards ──────────────────────────────────────────────────────

// L-03: SVG is excluded from allowed upload types because SVG can embed executable
// <script> elements. When served inline with Content-Type: image/svg+xml the browser
// executes the script in the document context, enabling stored XSS.
// If SVG uploads are required in the future, sanitise them server-side with svgo before
// storing, and serve them with Content-Disposition: attachment to prevent inline rendering.
export const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export const ALLOWED_DOCUMENT_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "text/csv",
]);

export const ALLOWED_ATTACHMENT_TYPES = new Set([
  ...ALLOWED_IMAGE_TYPES,
  ...ALLOWED_DOCUMENT_TYPES,
]);

export const ALLOWED_VIDEO_TYPES = new Set([
  "video/mp4",
  "video/webm",
]);

export const MAX_IMAGE_SIZE    = 10 * 1024 * 1024;  // 10 MB
export const MAX_DOCUMENT_SIZE = 50 * 1024 * 1024;  // 50 MB
export const MAX_VIDEO_SIZE    = 500 * 1024 * 1024; // 500 MB
export const MAX_ATTACHMENT_SIZE = 25 * 1024 * 1024; // 25 MB

export function validateUpload(
  size: number,
  contentType: string,
  allowedTypes: Set<string>,
  maxSize: number,
): { valid: boolean; error?: string } {
  if (size === 0)        return { valid: false, error: "File is empty" };
  if (size > maxSize)    return { valid: false, error: `File too large (max ${formatBytes(maxSize)})` };
  if (!allowedTypes.has(contentType)) {
    return { valid: false, error: `File type not allowed: ${contentType}` };
  }
  return { valid: true };
}
