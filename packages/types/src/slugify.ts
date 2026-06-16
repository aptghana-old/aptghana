/**
 * Canonical slug generator — single source of truth. This was previously
 * duplicated, byte-for-byte, in 21 places across apps/admin (API routes and
 * form components). Safe for both server and client bundles (no Node-only
 * dependencies), which is why it lives here rather than in @apt/db.
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}
