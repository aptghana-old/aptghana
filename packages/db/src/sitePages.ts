import { connectDB } from "./connection";
import { SitePageModel } from "./models/SitePage";

/**
 * Fetch a published SitePage doc and merge it onto a typed static fallback —
 * field by field, so a partially-filled CMS doc never blanks out copy that
 * hasn't been entered yet. Falls back to `fallback` entirely if there's no
 * published doc for `slug`, or the DB is unreachable.
 */
export async function getSitePageData<T extends object>(
  slug: string,
  fallback: T,
): Promise<T> {
  try {
    await connectDB();
    const doc = (await SitePageModel.findOne({ slug, status: "published" }).lean()) as Record<string, unknown> | null;
    if (!doc) return fallback;

    const merged = { ...fallback } as Record<string, unknown>;
    const fallbackRecord = fallback as Record<string, unknown>;
    for (const key of Object.keys(fallbackRecord)) {
      const docVal = doc[key];
      const fallbackVal = fallbackRecord[key];
      if (Array.isArray(fallbackVal)) {
        merged[key] = Array.isArray(docVal) && docVal.length > 0 ? docVal : fallbackVal;
      } else {
        merged[key] = docVal ?? fallbackVal;
      }
    }
    return merged as T;
  } catch {
    return fallback;
  }
}
