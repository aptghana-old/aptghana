/**
 * Safely serialize an object for use in a <script type="application/ld+json">
 * dangerouslySetInnerHTML block. JSON.stringify alone is insufficient because
 * a value containing </script> would break out of the script tag.
 */
export function safeJsonLd(obj: unknown): string {
  return JSON.stringify(obj).replace(/<\/script>/gi, "<\\/script>");
}
