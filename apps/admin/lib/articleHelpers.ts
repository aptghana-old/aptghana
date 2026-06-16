import DOMPurify from "isomorphic-dompurify";

export function slugify(text: string): string {
  return text.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").trim();
}

/**
 * Sanitizes editor-authored HTML before it's persisted. Content is rendered
 * unescaped (`dangerouslySetInnerHTML`) on the public site, so this is the
 * one required choke point — never trust the editor's output as-is, even
 * though only content:edit-permitted admins can author it.
 */
export function sanitizeArticleHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ADD_TAGS: ["iframe"],
    ADD_ATTR: ["target", "allow", "allowfullscreen", "frameborder", "data-callout"],
  });
}

/** Strips HTML tags and estimates reading time at ~200 words/minute. */
export function estimateReadingTime(html: string): number {
  const text = html.replace(/<[^>]*>/g, " ").trim();
  if (!text) return 0;
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}
