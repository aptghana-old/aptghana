#!/usr/bin/env tsx
/**
 * Comprehensive legacy media asset migration to VPS-hosted MinIO storage.
 *
 * Scans every MongoDB collection containing media URLs, downloads each asset,
 * uploads it to MinIO with a deterministic key, and replaces the old URL in
 * MongoDB.  Safe to re-run: already-migrated assets are detected via MinIO
 * HEAD and skipped.  Streaming embeds (YouTube, Vimeo, etc.) are skipped.
 *
 * Collections:
 *   products_v2      images.main, images.gallery, videos, documents, seo.ogImage
 *   brands_v2        logo, coverImage, seo.ogImage
 *   categories_v2    image, documents
 *   articles_v2      featuredImage, gallery, videos (file-hosted), attachments,
 *                    seo.ogImage, embedded <img> in content HTML
 *   industries       image
 *   homepage_configs carousel slides/panels, promo banners, full-width banners
 *
 * Usage:
 *   MONGODB_URI="..." STORAGE_ENDPOINT="..." tsx scripts/migrate-media-assets.ts
 *
 * Required env:
 *   MONGODB_URI, STORAGE_ENDPOINT, STORAGE_ACCESS_KEY, STORAGE_SECRET_KEY,
 *   STORAGE_BUCKET, STORAGE_PUBLIC_URL
 *
 * Optional env:
 *   MEILISEARCH_HOST, MEILISEARCH_ADMIN_KEY  (needed with --reindex)
 *
 * Flags:
 *   --dry-run              Log what would happen; no downloads, no DB writes
 *   --resume               Load MIGRATION_STATE.json and skip known-migrated URLs
 *   --reindex              Sync updated documents to Meilisearch after migration
 *   --concurrency=N        Parallel download slots (default: 5)
 *   --skip-products
 *   --skip-brands
 *   --skip-categories
 *   --skip-articles
 *   --skip-industries
 *   --skip-homepage
 *   --skip-html-scan       Skip embedded <img> scan in article HTML content
 */

import "dotenv/config";
import { createHash }   from "crypto";
import { MongoClient }  from "mongodb";
import fs               from "fs/promises";
import path             from "path";
import { MeiliSearch }  from "meilisearch";
import { uploadFile, fileExists, keyToUrl }  from "../packages/storage/src/upload";
import { buildProductRecord, extractCategoryIds } from "../packages/search/src/indexer";
import type { AssetFolder }       from "../packages/storage/src/types";
import type { ProductForIndex, CategoryForIndex } from "../packages/search/src/indexer";

// ── Environment ────────────────────────────────────────────────────────────────

const MONGODB_URI  = process.env.MONGODB_URI       ?? "";
const PUBLIC_BASE  = process.env.STORAGE_PUBLIC_URL ?? "";
const LEGACY_BASE  = "https://aptghana.com";

// ── Flags ──────────────────────────────────────────────────────────────────────

const DRY_RUN          = process.argv.includes("--dry-run");
const RESUME           = process.argv.includes("--resume");
const DO_REINDEX       = process.argv.includes("--reindex");
const SKIP_PRODUCTS    = process.argv.includes("--skip-products");
const SKIP_BRANDS      = process.argv.includes("--skip-brands");
const SKIP_CATS        = process.argv.includes("--skip-categories");
const SKIP_ARTICLES    = process.argv.includes("--skip-articles");
const SKIP_INDUSTRIES  = process.argv.includes("--skip-industries");
const SKIP_HOMEPAGE    = process.argv.includes("--skip-homepage");
const SKIP_HTML        = process.argv.includes("--skip-html-scan");
const CONCURRENCY      = Number(process.argv.find(a => a.startsWith("--concurrency="))?.split("=")[1] ?? 5);

// ── Output paths ───────────────────────────────────────────────────────────────

const ROOT         = path.join(process.cwd());
const REPORT_PATH  = path.join(ROOT, "MIGRATION_REPORT.md");
const CSV_PATH     = path.join(ROOT, "MIGRATION_BROKEN_ASSETS.csv");
const SUMMARY_PATH = path.join(ROOT, "MIGRATION_SUMMARY.json");
const STATE_PATH   = path.join(ROOT, "MIGRATION_STATE.json");

// ── Types ──────────────────────────────────────────────────────────────────────

interface MigrationStats {
  scanned:  number;
  attempted: number;
  uploaded:  number;
  skipped:   number;
  updated:   number;
  broken:    number;
  bytes:     number;
}

interface MigrationState {
  version:              1;
  startedAt:            string;
  completedCollections: string[];
  updatedCollections:   string[];
  migratedUrls:         Record<string, string>; // normalizedUrl → newUrl
}

interface AssetCtx {
  collection: string;
  docId:      string;
  field:      string;
}

// ── Global accumulators ────────────────────────────────────────────────────────

const totalStats: MigrationStats = { scanned: 0, attempted: 0, uploaded: 0, skipped: 0, updated: 0, broken: 0, bytes: 0 };
const collStats:  Record<string, MigrationStats> = {};
const updatedIds: Record<string, Set<string>>   = {}; // collection → docIds
const startMs = Date.now();

let state: MigrationState = {
  version: 1,
  startedAt: new Date().toISOString(),
  completedCollections: [],
  updatedCollections: [],
  migratedUrls: {},
};

// ── Concurrency semaphore ──────────────────────────────────────────────────────

class Semaphore {
  private running = 0;
  private readonly queue: Array<() => void> = [];
  constructor(private readonly max: number) {}
  acquire(): Promise<void> {
    if (this.running < this.max) { this.running++; return Promise.resolve(); }
    return new Promise(r => this.queue.push(() => { this.running++; r(); }));
  }
  release(): void {
    this.running--;
    this.queue.shift()?.();
  }
}

const sem = new Semaphore(CONCURRENCY);

// ── Per-domain rate limiting ───────────────────────────────────────────────────

const domainLast = new Map<string, number>();
const MIN_DOMAIN_MS = 100;

async function rateLimitDomain(url: string): Promise<void> {
  try {
    const host = new URL(url).hostname;
    const wait = MIN_DOMAIN_MS - (Date.now() - (domainLast.get(host) ?? 0));
    if (wait > 0) await sleep(wait);
    domainLast.set(host, Date.now());
  } catch { /* invalid URL, skip */ }
}

// ── Utilities ──────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}

function normalizeUrl(raw: string): string | null {
  const url = raw?.trim();
  if (!url)               return null;
  if (url.startsWith("data:")) return null;
  if (url.startsWith("//"))    return `https:${url}`;
  if (url.startsWith("/"))     return `${LEGACY_BASE}${url}`;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${LEGACY_BASE}/${url}`;
}

const STREAMING_HOSTS = new Set([
  "youtube.com", "www.youtube.com", "youtu.be", "m.youtube.com",
  "vimeo.com", "player.vimeo.com",
  "dailymotion.com", "wistia.com", "wi.st",
  "loom.com", "twitch.tv", "brightcove.com",
  "jwplayer.com", "vidyard.com", "kaltura.com",
  "facebook.com", "fb.com",
]);

function isStreaming(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return STREAMING_HOSTS.has(host);
  } catch { return false; }
}

function isAlreadyMigrated(url: string): boolean {
  return !!PUBLIC_BASE && url.startsWith(PUBLIC_BASE);
}

function deterministicKey(subfolder: string, normalizedUrl: string): string {
  const hash   = createHash("sha256").update(normalizedUrl).digest("hex").slice(0, 12);
  let filename: string;
  try {
    filename = decodeURIComponent(new URL(normalizedUrl).pathname.split("/").pop() ?? "asset");
  } catch {
    filename = normalizedUrl.split("/").pop() ?? "asset";
  }
  filename = filename.split("?")[0] || "asset";
  const ext  = filename.includes(".")
    ? filename.slice(filename.lastIndexOf(".")).toLowerCase().replace(/[^a-z0-9.]/g, "")
    : "";
  const safe = filename
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);
  const safeName = safe.endsWith(ext) ? safe : `${safe}${ext}`;
  return `${subfolder}/${hash}-${safeName}`;
}

const DOWNLOADABLE = [
  "image/", "application/pdf", "application/octet-stream",
  "application/vnd.", "application/msword", "application/zip",
  "application/x-zip", "application/x-rar", "video/",
  "application/postscript", "application/x-dwg", "application/acad",
  "application/epub", "application/x-7z", "text/plain",
];

function isDownloadable(ct: string): boolean {
  const t = ct.split(";")[0].trim().toLowerCase();
  return DOWNLOADABLE.some(p => t.startsWith(p));
}

function emptyStats(): MigrationStats {
  return { scanned: 0, attempted: 0, uploaded: 0, skipped: 0, updated: 0, broken: 0, bytes: 0 };
}

function mergeStats(target: MigrationStats, src: MigrationStats): void {
  for (const k of Object.keys(src) as Array<keyof MigrationStats>) {
    target[k] += src[k];
  }
}

function docFolderKey(collection: string, docId: string): void {
  if (!updatedIds[collection]) updatedIds[collection] = new Set();
  updatedIds[collection].add(docId);
  if (!state.updatedCollections.includes(collection)) {
    state.updatedCollections.push(collection);
  }
}

// ── CSV ────────────────────────────────────────────────────────────────────────

let csvReady = false;

async function logBroken(ctx: AssetCtx, url: string, error: string): Promise<void> {
  if (!csvReady) {
    await fs.writeFile(CSV_PATH, "Collection,DocumentId,Field,OriginalUrl,Error\n", "utf8").catch(() => null);
    csvReady = true;
  }
  const row = [ctx.collection, ctx.docId, ctx.field, url, error]
    .map(v => `"${String(v).replace(/"/g, '""')}"`)
    .join(",");
  await fs.appendFile(CSV_PATH, `${row}\n`, "utf8").catch(() => null);
}

// ── State persistence ──────────────────────────────────────────────────────────

async function loadState(): Promise<void> {
  if (!RESUME) return;
  try {
    const raw = await fs.readFile(STATE_PATH, "utf8");
    const loaded = JSON.parse(raw) as MigrationState;
    if (loaded?.version === 1) {
      state = loaded;
      state.startedAt = new Date().toISOString(); // refresh timestamp
      console.log(`  Resumed: ${Object.keys(state.migratedUrls).length.toLocaleString()} known URLs, ` +
                  `${state.completedCollections.length} completed collections`);
    }
  } catch { /* no state file */ }
}

async function saveState(): Promise<void> {
  if (DRY_RUN) return;
  await fs.writeFile(STATE_PATH, JSON.stringify(state, null, 2), "utf8").catch(() => null);
}

// ── Download ───────────────────────────────────────────────────────────────────

async function fetchWithRetry(
  url: string,
  maxAttempts = 3,
): Promise<{ data: Buffer; contentType: string } | { error: string }> {
  let lastError = "unknown error";

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (attempt > 0) await sleep(1000 * 2 ** (attempt - 1)); // 1s, 2s

    try {
      await rateLimitDomain(url);
      const res = await fetch(url, {
        signal: AbortSignal.timeout(30_000),
        headers: { "User-Agent": "APT-Ghana-Migration/1.0" },
      });

      // Permanent failures — don't retry
      if (res.status === 404) return { error: "HTTP 404 Not Found" };
      if (res.status === 403) return { error: "HTTP 403 Forbidden" };
      if (res.status === 410) return { error: "HTTP 410 Gone" };

      if (res.status >= 500) {
        lastError = `HTTP ${res.status} Server Error`;
        continue; // retry on server errors
      }

      if (!res.ok) {
        return { error: `HTTP ${res.status}` };
      }

      const contentType = res.headers.get("content-type") ?? "application/octet-stream";
      if (!isDownloadable(contentType)) {
        return { error: `Non-downloadable content-type: ${contentType.split(";")[0].trim()}` };
      }

      const data = Buffer.from(await res.arrayBuffer());
      return { data, contentType };
    } catch (err) {
      lastError = (err as Error).message;
    }
  }

  return { error: lastError };
}

// ── Core URL processor ─────────────────────────────────────────────────────────

async function processUrl(
  originalUrl: string,
  subfolder:   string,
  baseFolder:  AssetFolder,
  stats:       MigrationStats,
  ctx:         AssetCtx,
): Promise<string | null> {
  stats.scanned++;
  totalStats.scanned++;

  if (!originalUrl?.trim()) return null;

  const normalized = normalizeUrl(originalUrl);
  if (!normalized) return null;

  // Already on MinIO
  if (isAlreadyMigrated(normalized)) {
    stats.skipped++;
    totalStats.skipped++;
    return normalized;
  }

  // Streaming embed — skip silently
  if (isStreaming(normalized)) {
    stats.skipped++;
    totalStats.skipped++;
    return null;
  }

  // Resume state check
  if (RESUME && state.migratedUrls[normalized]) {
    stats.skipped++;
    totalStats.skipped++;
    return state.migratedUrls[normalized];
  }

  const key = deterministicKey(subfolder, normalized);
  stats.attempted++;
  totalStats.attempted++;

  if (DRY_RUN) {
    console.log(`    [dry-run] would upload: ${normalized}`);
    stats.uploaded++;
    totalStats.uploaded++;
    return null;
  }

  await sem.acquire();
  try {
    // Idempotency: check if already in MinIO
    if (await fileExists(key)) {
      const newUrl = keyToUrl(key);
      state.migratedUrls[normalized] = newUrl;
      stats.skipped++;
      totalStats.skipped++;
      return newUrl;
    }

    // Download
    const result = await fetchWithRetry(normalized);
    if ("error" in result) {
      stats.broken++;
      totalStats.broken++;
      await logBroken(ctx, originalUrl, result.error);
      return null;
    }

    const { data, contentType } = result;

    // Upload
    const uploaded = await uploadFile(data, key.split("/").pop()!, contentType, {
      folder: baseFolder,
      key,
      cacheControl: "public, max-age=31536000, immutable",
    });

    state.migratedUrls[normalized] = uploaded.url;
    stats.uploaded++;
    totalStats.uploaded++;
    stats.bytes += data.byteLength;
    totalStats.bytes += data.byteLength;
    return uploaded.url;
  } catch (err) {
    const error = (err as Error).message;
    stats.broken++;
    totalStats.broken++;
    await logBroken(ctx, originalUrl, `Upload error: ${error}`);
    return null;
  } finally {
    sem.release();
  }
}

// ── Products ───────────────────────────────────────────────────────────────────

async function migrateProducts(db: ReturnType<MongoClient["db"]>): Promise<void> {
  const coll  = "products_v2";
  const stats = (collStats[coll] = emptyStats());
  const col   = db.collection(coll);
  const total = await col.countDocuments();
  console.log(`\n  products_v2: ${total.toLocaleString()} documents`);

  const cursor = col.find({}, {
    projection: { slug: 1, images: 1, videos: 1, documents: 1, "seo.ogImage": 1 },
  });

  let idx = 0;
  for await (const raw of cursor) {
    idx++;
    if (idx % 50 === 0) process.stdout.write(`\r    ${idx}/${total}`);

    const doc  = raw as Record<string, unknown>;
    const id   = String(doc._id);
    const slug = (doc.slug as string) ?? id;
    const $set: Record<string, unknown> = {};

    // Main image
    const main = (doc.images as Record<string, { url?: string }>)?.main;
    if (main?.url) {
      const newUrl = await processUrl(main.url, `products/${slug}`, "products", stats, { collection: coll, docId: id, field: "images.main.url" });
      if (newUrl) $set["images.main.url"] = newUrl;
    }

    // Gallery
    const gallery: Array<{ url?: string }> = ((doc.images as Record<string, unknown>)?.["gallery"] as Array<{ url?: string }>) ?? [];
    for (let i = 0; i < gallery.length; i++) {
      const item = gallery[i];
      if (!item?.url) continue;
      const newUrl = await processUrl(item.url, `products/${slug}/gallery`, "products", stats, { collection: coll, docId: id, field: `images.gallery.${i}.url` });
      if (newUrl) $set[`images.gallery.${i}.url`] = newUrl;
    }

    // Videos (file-hosted only; streaming URLs are skipped inside processUrl)
    const videos: Array<{ url?: string; thumbnail?: string }> = (doc.videos as Array<{ url?: string; thumbnail?: string }>) ?? [];
    for (let i = 0; i < videos.length; i++) {
      const v = videos[i];
      if (v?.url) {
        const newUrl = await processUrl(v.url, "videos", "videos", stats, { collection: coll, docId: id, field: `videos.${i}.url` });
        if (newUrl) $set[`videos.${i}.url`] = newUrl;
      }
      if (v?.thumbnail) {
        const newUrl = await processUrl(v.thumbnail, `products/${slug}/gallery`, "products", stats, { collection: coll, docId: id, field: `videos.${i}.thumbnail` });
        if (newUrl) $set[`videos.${i}.thumbnail`] = newUrl;
      }
    }

    // Documents
    const docs: Array<{ url?: string; type?: string }> = (doc.documents as Array<{ url?: string; type?: string }>) ?? [];
    for (let i = 0; i < docs.length; i++) {
      const d = docs[i];
      if (!d?.url) continue;
      const folder = resolveDocFolder(d.type);
      const newUrl = await processUrl(d.url, folder, folder as AssetFolder, stats, { collection: coll, docId: id, field: `documents.${i}.url` });
      if (newUrl) $set[`documents.${i}.url`] = newUrl;
    }

    // SEO OG image
    const ogImage = (doc.seo as Record<string, string>)?.ogImage;
    if (ogImage) {
      const newUrl = await processUrl(ogImage, `products/${slug}`, "products", stats, { collection: coll, docId: id, field: "seo.ogImage" });
      if (newUrl) $set["seo.ogImage"] = newUrl;
    }

    if (Object.keys($set).length > 0 && !DRY_RUN) {
      await col.updateOne({ _id: raw._id }, { $set });
      stats.updated++;
      totalStats.updated++;
      docFolderKey(coll, id);
    }

    if (idx % 200 === 0) await saveState();
  }

  console.log(`\n    done — uploaded: ${stats.uploaded}, skipped: ${stats.skipped}, broken: ${stats.broken}, updated docs: ${stats.updated}`);
  state.completedCollections.push(coll);
  await saveState();
}

// ── Brands ─────────────────────────────────────────────────────────────────────

async function migrateBrands(db: ReturnType<MongoClient["db"]>): Promise<void> {
  const coll  = "brands_v2";
  const stats = (collStats[coll] = emptyStats());
  const col   = db.collection(coll);
  const total = await col.countDocuments();
  console.log(`\n  brands_v2: ${total.toLocaleString()} documents`);

  const cursor = col.find({}, { projection: { slug: 1, logo: 1, coverImage: 1, "seo.ogImage": 1 } });

  let idx = 0;
  for await (const raw of cursor) {
    idx++;
    const doc  = raw as Record<string, unknown>;
    const id   = String(doc._id);
    const slug = (doc.slug as string) ?? id;
    const $set: Record<string, unknown> = {};

    for (const field of ["logo", "coverImage"] as const) {
      const asset = (doc[field] as { url?: string });
      if (asset?.url) {
        const newUrl = await processUrl(asset.url, `brands/${slug}`, "brands", stats, { collection: coll, docId: id, field: `${field}.url` });
        if (newUrl) $set[`${field}.url`] = newUrl;
      }
    }

    const ogImage = (doc.seo as Record<string, string>)?.ogImage;
    if (ogImage) {
      const newUrl = await processUrl(ogImage, `brands/${slug}`, "brands", stats, { collection: coll, docId: id, field: "seo.ogImage" });
      if (newUrl) $set["seo.ogImage"] = newUrl;
    }

    if (Object.keys($set).length > 0 && !DRY_RUN) {
      await col.updateOne({ _id: raw._id }, { $set });
      stats.updated++;
      totalStats.updated++;
      docFolderKey(coll, id);
    }
  }

  console.log(`    done — uploaded: ${stats.uploaded}, skipped: ${stats.skipped}, broken: ${stats.broken}`);
  state.completedCollections.push(coll);
  await saveState();
}

// ── Categories ─────────────────────────────────────────────────────────────────

async function migrateCategories(db: ReturnType<MongoClient["db"]>): Promise<void> {
  const coll  = "categories_v2";
  const stats = (collStats[coll] = emptyStats());
  const col   = db.collection(coll);
  const total = await col.countDocuments();
  console.log(`\n  categories_v2: ${total.toLocaleString()} documents`);

  const cursor = col.find({}, { projection: { slug: 1, image: 1, documents: 1 } });

  for await (const raw of cursor) {
    const doc  = raw as Record<string, unknown>;
    const id   = String(doc._id);
    const slug = (doc.slug as string) ?? id;
    const $set: Record<string, unknown> = {};

    const image = (doc.image as { url?: string });
    if (image?.url) {
      const newUrl = await processUrl(image.url, `categories/${slug}`, "categories", stats, { collection: coll, docId: id, field: "image.url" });
      if (newUrl) $set["image.url"] = newUrl;
    }

    const docs: Array<{ url?: string; type?: string }> = (doc.documents as Array<{ url?: string; type?: string }>) ?? [];
    for (let i = 0; i < docs.length; i++) {
      const d = docs[i];
      if (!d?.url) continue;
      const folder = resolveDocFolder(d.type);
      const newUrl = await processUrl(d.url, folder, folder as AssetFolder, stats, { collection: coll, docId: id, field: `documents.${i}.url` });
      if (newUrl) $set[`documents.${i}.url`] = newUrl;
    }

    if (Object.keys($set).length > 0 && !DRY_RUN) {
      await col.updateOne({ _id: raw._id }, { $set });
      stats.updated++;
      totalStats.updated++;
      docFolderKey(coll, id);
    }
  }

  console.log(`    done — uploaded: ${stats.uploaded}, skipped: ${stats.skipped}, broken: ${stats.broken}`);
  state.completedCollections.push(coll);
  await saveState();
}

// ── Articles ───────────────────────────────────────────────────────────────────

async function migrateArticles(db: ReturnType<MongoClient["db"]>): Promise<void> {
  const coll  = "articles_v2";
  const stats = (collStats[coll] = emptyStats());
  const col   = db.collection(coll);
  const total = await col.countDocuments();
  console.log(`\n  articles_v2: ${total.toLocaleString()} documents`);

  const projection: Record<string, number> = {
    slug: 1, featuredImage: 1, gallery: 1, videos: 1, attachments: 1, "seo.ogImage": 1,
  };
  if (!SKIP_HTML) projection["content"] = 1;

  const cursor = col.find({}, { projection });

  let idx = 0;
  for await (const raw of cursor) {
    idx++;
    const doc  = raw as Record<string, unknown>;
    const id   = String(doc._id);
    const slug = (doc.slug as string) ?? id;
    const $set: Record<string, unknown> = {};

    // Featured image
    const featured = (doc.featuredImage as { url?: string });
    if (featured?.url) {
      const newUrl = await processUrl(featured.url, `marketing/articles/${slug}`, "marketing", stats, { collection: coll, docId: id, field: "featuredImage.url" });
      if (newUrl) $set["featuredImage.url"] = newUrl;
    }

    // Gallery
    const gallery: Array<{ url?: string }> = (doc.gallery as Array<{ url?: string }>) ?? [];
    for (let i = 0; i < gallery.length; i++) {
      const item = gallery[i];
      if (!item?.url) continue;
      const newUrl = await processUrl(item.url, `marketing/articles/${slug}/gallery`, "marketing", stats, { collection: coll, docId: id, field: `gallery.${i}.url` });
      if (newUrl) $set[`gallery.${i}.url`] = newUrl;
    }

    // Videos — skip streaming embeds (processUrl handles this)
    const videos: Array<{ url?: string }> = (doc.videos as Array<{ url?: string }>) ?? [];
    for (let i = 0; i < videos.length; i++) {
      const v = videos[i];
      if (!v?.url) continue;
      const newUrl = await processUrl(v.url, "videos", "videos", stats, { collection: coll, docId: id, field: `videos.${i}.url` });
      if (newUrl) $set[`videos.${i}.url`] = newUrl;
    }

    // Attachments
    const attachments: Array<{ url?: string }> = (doc.attachments as Array<{ url?: string }>) ?? [];
    for (let i = 0; i < attachments.length; i++) {
      const a = attachments[i];
      if (!a?.url) continue;
      const newUrl = await processUrl(a.url, "marketing/articles/attachments", "marketing", stats, { collection: coll, docId: id, field: `attachments.${i}.url` });
      if (newUrl) $set[`attachments.${i}.url`] = newUrl;
    }

    // SEO OG image
    const ogImage = (doc.seo as Record<string, string>)?.ogImage;
    if (ogImage) {
      const newUrl = await processUrl(ogImage, `marketing/articles/${slug}`, "marketing", stats, { collection: coll, docId: id, field: "seo.ogImage" });
      if (newUrl) $set["seo.ogImage"] = newUrl;
    }

    // Embedded images in HTML content
    if (!SKIP_HTML) {
      const content = (doc.content as string) ?? "";
      if (content) {
        const htmlUrlMap = new Map<string, string>();
        const imgRe = /<img\b[^>]*?\bsrc=["']([^"']+)["']/gi;
        let m: RegExpExecArray | null;
        const srcUrls = new Set<string>();
        while ((m = imgRe.exec(content)) !== null) {
          srcUrls.add(m[1]);
        }
        for (const src of srcUrls) {
          const newUrl = await processUrl(src, `marketing/articles/${slug}`, "marketing", stats, { collection: coll, docId: id, field: "content[img.src]" });
          if (newUrl) htmlUrlMap.set(src, newUrl);
        }
        if (htmlUrlMap.size > 0) {
          let updatedContent = content;
          for (const [oldSrc, newSrc] of htmlUrlMap) {
            updatedContent = updatedContent.split(oldSrc).join(newSrc);
          }
          $set["content"] = updatedContent;
        }
      }
    }

    if (Object.keys($set).length > 0 && !DRY_RUN) {
      await col.updateOne({ _id: raw._id }, { $set });
      stats.updated++;
      totalStats.updated++;
      docFolderKey(coll, id);
    }

    if (idx % 100 === 0) await saveState();
  }

  console.log(`    done — uploaded: ${stats.uploaded}, skipped: ${stats.skipped}, broken: ${stats.broken}`);
  state.completedCollections.push(coll);
  await saveState();
}

// ── Industries ─────────────────────────────────────────────────────────────────

async function migrateIndustries(db: ReturnType<MongoClient["db"]>): Promise<void> {
  const coll  = "industries";
  const stats = (collStats[coll] = emptyStats());
  const col   = db.collection(coll);
  const total = await col.countDocuments();
  console.log(`\n  industries: ${total.toLocaleString()} documents`);

  const cursor = col.find({}, { projection: { slug: 1, image: 1 } });

  for await (const raw of cursor) {
    const doc  = raw as Record<string, unknown>;
    const id   = String(doc._id);
    const slug = (doc.slug as string) ?? id;
    const $set: Record<string, unknown> = {};

    const image = (doc.image as { url?: string });
    if (image?.url) {
      const newUrl = await processUrl(image.url, `marketing/industries/${slug}`, "marketing", stats, { collection: coll, docId: id, field: "image.url" });
      if (newUrl) $set["image.url"] = newUrl;
    }

    if (Object.keys($set).length > 0 && !DRY_RUN) {
      await col.updateOne({ _id: raw._id }, { $set });
      stats.updated++;
      totalStats.updated++;
      docFolderKey(coll, id);
    }
  }

  console.log(`    done — uploaded: ${stats.uploaded}, skipped: ${stats.skipped}, broken: ${stats.broken}`);
  state.completedCollections.push(coll);
  await saveState();
}

// ── Homepage config ────────────────────────────────────────────────────────────

async function migrateHomepage(db: ReturnType<MongoClient["db"]>): Promise<void> {
  const coll  = "homepage_configs";
  const stats = (collStats[coll] = emptyStats());
  const col   = db.collection(coll);
  const total = await col.countDocuments();
  console.log(`\n  homepage_configs: ${total.toLocaleString()} documents`);

  const cursor = col.find({}, { projection: { carousel: 1, sections: 1 } });

  for await (const raw of cursor) {
    const doc = raw as Record<string, unknown>;
    const id  = String(doc._id);
    const $set: Record<string, unknown> = {};
    const ctx = { collection: coll, docId: id, field: "" };

    // Carousel slides
    const slides: Array<{ desktopImage?: string; mobileImage?: string }> =
      ((doc.carousel as Record<string, unknown>)?.["slides"] as Array<{ desktopImage?: string; mobileImage?: string }>) ?? [];

    for (let i = 0; i < slides.length; i++) {
      const s = slides[i];
      if (s?.desktopImage) {
        const newUrl = await processUrl(s.desktopImage, "homepage/carousel", "homepage", stats, { ...ctx, field: `carousel.slides.${i}.desktopImage` });
        if (newUrl) $set[`carousel.slides.${i}.desktopImage`] = newUrl;
      }
      if (s?.mobileImage) {
        const newUrl = await processUrl(s.mobileImage, "homepage/carousel", "homepage", stats, { ...ctx, field: `carousel.slides.${i}.mobileImage` });
        if (newUrl) $set[`carousel.slides.${i}.mobileImage`] = newUrl;
      }
    }

    // Carousel side panels
    const panels: Array<{ image?: string }> =
      ((doc.carousel as Record<string, unknown>)?.["sidePanels"] as Array<{ image?: string }>) ?? [];

    for (let i = 0; i < panels.length; i++) {
      const p = panels[i];
      if (p?.image) {
        const newUrl = await processUrl(p.image, "homepage/carousel", "homepage", stats, { ...ctx, field: `carousel.sidePanels.${i}.image` });
        if (newUrl) $set[`carousel.sidePanels.${i}.image`] = newUrl;
      }
    }

    // Sections
    const sections: Array<{ type: string; config: Record<string, unknown> }> =
      (doc.sections as Array<{ type: string; config: Record<string, unknown> }>) ?? [];

    for (let i = 0; i < sections.length; i++) {
      const sec = sections[i];
      if (!sec?.config) continue;

      if (sec.type === "promo_banners") {
        const banners: Array<{ image?: string }> = (sec.config["banners"] as Array<{ image?: string }>) ?? [];
        for (let j = 0; j < banners.length; j++) {
          const b = banners[j];
          if (b?.image) {
            const newUrl = await processUrl(b.image, "homepage/banners", "homepage", stats, { ...ctx, field: `sections.${i}.config.banners.${j}.image` });
            if (newUrl) $set[`sections.${i}.config.banners.${j}.image`] = newUrl;
          }
        }
      }

      if (sec.type === "full_width_banner") {
        const cfg = sec.config as { desktopImage?: string; mobileImage?: string };
        if (cfg.desktopImage) {
          const newUrl = await processUrl(cfg.desktopImage, "homepage/banners", "homepage", stats, { ...ctx, field: `sections.${i}.config.desktopImage` });
          if (newUrl) $set[`sections.${i}.config.desktopImage`] = newUrl;
        }
        if (cfg.mobileImage) {
          const newUrl = await processUrl(cfg.mobileImage, "homepage/banners", "homepage", stats, { ...ctx, field: `sections.${i}.config.mobileImage` });
          if (newUrl) $set[`sections.${i}.config.mobileImage`] = newUrl;
        }
      }
    }

    if (Object.keys($set).length > 0 && !DRY_RUN) {
      await col.updateOne({ _id: raw._id }, { $set });
      stats.updated++;
      totalStats.updated++;
      docFolderKey(coll, id);
    }
  }

  console.log(`    done — uploaded: ${stats.uploaded}, skipped: ${stats.skipped}, broken: ${stats.broken}`);
  state.completedCollections.push(coll);
  await saveState();
}

// ── Document folder helper ─────────────────────────────────────────────────────

function resolveDocFolder(type?: string): string {
  switch (type) {
    case "datasheet":
    case "drawing":       return "datasheets";
    case "manual":        return "manuals";
    case "certificate":
    case "compliance":    return "certificates";
    case "video":         return "videos";
    default:              return "marketing";
  }
}

// ── Meilisearch reindex ────────────────────────────────────────────────────────

async function reindexAffected(db: ReturnType<MongoClient["db"]>): Promise<void> {
  const meiliHost = process.env.MEILISEARCH_HOST;
  const meiliKey  = process.env.MEILISEARCH_ADMIN_KEY ?? process.env.MEILISEARCH_API_KEY ?? "";

  if (!meiliHost) {
    console.warn("\n  Skipping Meilisearch sync: MEILISEARCH_HOST not set");
    return;
  }

  const meili = new MeiliSearch({ host: meiliHost, apiKey: meiliKey });
  console.log("\n  Syncing Meilisearch...");

  const touched = state.updatedCollections;

  if (touched.includes("products_v2")) {
    console.log("    Reindexing products...");
    const idx      = meili.index("products");
    const brandMap = new Map<string, string>();
    const catMap   = new Map<string, { name: string; slug: string; level: string }>();

    const brands = await db.collection("brands_v2").find({}, { projection: { slug: 1, name: 1 } }).toArray();
    brands.forEach(b => brandMap.set(String((b as Record<string, unknown>).slug), String((b as Record<string, unknown>).name)));

    const cats = await db.collection("categories_v2").find({}, { projection: { _id: 1, name: 1, slug: 1, level: 1 } }).toArray();
    cats.forEach(c => catMap.set(String(c._id), { name: String((c as Record<string, unknown>).name), slug: String((c as Record<string, unknown>).slug), level: String((c as Record<string, unknown>).level) }));

    const ids = [...(updatedIds["products_v2"] ?? [])];
    const { ObjectId } = await import("mongodb");
    const cursor = db.collection("products_v2").find(
      { _id: { $in: ids.map(id => new ObjectId(id)) } }
    );

    let batch: ReturnType<typeof buildProductRecord>[] = [];
    for await (const rawProduct of cursor) {
      const product = rawProduct as unknown as ProductForIndex;
      const brandName = brandMap.get(product.brandSlug ?? "") ?? "";
      const catIds = extractCategoryIds(product.categories ?? []);
      const catDocs: CategoryForIndex[] = catIds.map(cid => {
        const c = catMap.get(cid);
        return c ? { _id: cid, name: c.name, slug: c.slug, level: c.level as CategoryForIndex["level"] } : null;
      }).filter(Boolean) as CategoryForIndex[];
      batch.push(buildProductRecord(product, brandName, catDocs));
      if (batch.length >= 100) {
        await idx.addDocuments(batch, { primaryKey: "id" });
        batch = [];
      }
    }
    if (batch.length > 0) await idx.addDocuments(batch, { primaryKey: "id" });
    console.log(`    ✓ ${ids.length} products synced`);
  }

  if (touched.includes("brands_v2")) {
    console.log("    Reindexing brands...");
    const idx = meili.index("brands");
    const ids = [...(updatedIds["brands_v2"] ?? [])];
    const { ObjectId } = await import("mongodb");
    const docs = await db.collection("brands_v2")
      .find({ _id: { $in: ids.map(id => new ObjectId(id)) } }, {
        projection: { _id: 1, name: 1, slug: 1, shortDescription: 1, logo: 1, isPartner: 1, country: 1, status: 1 },
      }).toArray();
    const records = docs.map(b => ({
      id: String(b._id),
      name: (b as Record<string, unknown>).name,
      slug: (b as Record<string, unknown>).slug,
      shortDescription: (b as Record<string, unknown>).shortDescription,
      logoUrl: ((b as Record<string, { url?: string }>).logo)?.url ?? "",
      isPartner: (b as Record<string, unknown>).isPartner ?? false,
      country: (b as Record<string, unknown>).country ?? "",
      status: (b as Record<string, unknown>).status,
    }));
    if (records.length > 0) await idx.addDocuments(records, { primaryKey: "id" });
    console.log(`    ✓ ${records.length} brands synced`);
  }

  if (touched.includes("categories_v2")) {
    console.log("    Reindexing categories...");
    const idx = meili.index("categories");
    const ids = [...(updatedIds["categories_v2"] ?? [])];
    const { ObjectId } = await import("mongodb");
    const docs = await db.collection("categories_v2")
      .find({ _id: { $in: ids.map(id => new ObjectId(id)) } }, {
        projection: { _id: 1, name: 1, slug: 1, level: 1, parentId: 1, description: 1, image: 1 },
      }).toArray();
    const records = docs.map(c => ({
      id: String(c._id),
      name: (c as Record<string, unknown>).name,
      slug: (c as Record<string, unknown>).slug,
      level: (c as Record<string, unknown>).level,
      parentId: String((c as Record<string, unknown>).parentId ?? ""),
      description: (c as Record<string, unknown>).description ?? "",
      imageUrl: ((c as Record<string, { url?: string }>).image)?.url ?? "",
    }));
    if (records.length > 0) await idx.addDocuments(records, { primaryKey: "id" });
    console.log(`    ✓ ${records.length} categories synced`);
  }

  if (touched.includes("articles_v2")) {
    console.log("    Reindexing articles...");
    const idx = meili.index("articles");
    const ids = [...(updatedIds["articles_v2"] ?? [])];
    const { ObjectId } = await import("mongodb");
    const docs = await db.collection("articles_v2")
      .find({ _id: { $in: ids.map(id => new ObjectId(id)) } }, {
        projection: { _id: 1, title: 1, slug: 1, excerpt: 1, status: 1, category: 1, tags: 1, featured: 1, authorName: 1, featuredImage: 1, publishDate: 1, viewCount: 1, readingTimeMinutes: 1 },
      }).toArray();
    const records = docs.map(a => ({
      id: String(a._id),
      title: (a as Record<string, unknown>).title ?? "",
      slug: (a as Record<string, unknown>).slug ?? "",
      excerpt: (a as Record<string, unknown>).excerpt ?? "",
      status: (a as Record<string, unknown>).status ?? "draft",
      category: (a as Record<string, unknown>).category ?? "",
      tags: (a as Record<string, unknown>).tags ?? [],
      featured: (a as Record<string, unknown>).featured ?? false,
      authorName: (a as Record<string, unknown>).authorName ?? "",
      featuredImageUrl: ((a as Record<string, { url?: string }>).featuredImage)?.url ?? "",
      publishDate: (a as Record<string, unknown>).publishDate
        ? new Date((a as Record<string, unknown>).publishDate as string).getTime()
        : null,
      viewCount: (a as Record<string, unknown>).viewCount ?? 0,
      readingTimeMinutes: (a as Record<string, unknown>).readingTimeMinutes ?? 0,
    }));
    if (records.length > 0) await idx.addDocuments(records, { primaryKey: "id" });
    console.log(`    ✓ ${records.length} articles synced`);
  }
}

// ── Report generation ──────────────────────────────────────────────────────────

async function writeReports(): Promise<void> {
  const durationMs  = Date.now() - startMs;
  const durationSec = (durationMs / 1000).toFixed(1);
  const mbMoved     = (totalStats.bytes / 1024 / 1024).toFixed(2);
  const now         = new Date().toISOString();

  // MIGRATION_SUMMARY.json
  const summary = {
    completedAt:   now,
    durationSeconds: Number(durationSec),
    dryRun:        DRY_RUN,
    totals:        totalStats,
    storageMB:     Number(mbMoved),
    byCollection:  Object.fromEntries(
      Object.entries(collStats).map(([k, v]) => [k, v])
    ),
    updatedCollections: state.updatedCollections,
  };
  await fs.writeFile(SUMMARY_PATH, JSON.stringify(summary, null, 2), "utf8").catch(() => null);

  // MIGRATION_REPORT.md
  const lines: string[] = [
    `# APT Ghana Media Migration Report`,
    ``,
    `**Completed:** ${now}  `,
    `**Duration:** ${durationSec}s  `,
    `**Mode:** ${DRY_RUN ? "Dry Run (no changes written)" : "Production"}  `,
    ``,
    `## Totals`,
    ``,
    `| Metric            | Count       |`,
    `|-------------------|-------------|`,
    `| URLs Scanned      | ${totalStats.scanned.toLocaleString()}  |`,
    `| Attempted         | ${totalStats.attempted.toLocaleString()}  |`,
    `| Uploaded          | ${totalStats.uploaded.toLocaleString()}  |`,
    `| Skipped           | ${totalStats.skipped.toLocaleString()}  |`,
    `| MongoDB Docs Updated | ${totalStats.updated.toLocaleString()}  |`,
    `| Broken            | ${totalStats.broken.toLocaleString()}  |`,
    `| Storage Consumed  | ${mbMoved} MB  |`,
    ``,
    `## By Collection`,
    ``,
    `| Collection | Scanned | Uploaded | Skipped | Broken | Docs Updated |`,
    `|------------|---------|----------|---------|--------|--------------|`,
  ];

  for (const [col, s] of Object.entries(collStats)) {
    lines.push(`| ${col} | ${s.scanned} | ${s.uploaded} | ${s.skipped} | ${s.broken} | ${s.updated} |`);
  }

  lines.push(
    ``,
    `## Output Files`,
    ``,
    `- \`MIGRATION_REPORT.md\` — this file`,
    `- \`MIGRATION_BROKEN_ASSETS.csv\` — assets that could not be downloaded`,
    `- \`MIGRATION_SUMMARY.json\` — machine-readable summary`,
    `- \`MIGRATION_STATE.json\` — resume checkpoint`,
    ``,
    `## Next Steps`,
    ``,
    totalStats.broken > 0
      ? `- Review \`MIGRATION_BROKEN_ASSETS.csv\` for ${totalStats.broken} failed assets`
      : `- No broken assets detected`,
    `- Run \`tsx scripts/reindex-migrated-assets.ts --clear\` to fully rebuild Meilisearch`,
    `- Verify site is serving assets from \`${PUBLIC_BASE}\``,
    `- Once verified, the old \`migrate-assets-to-minio.ts\` script can be retired`,
  );

  await fs.writeFile(REPORT_PATH, lines.join("\n"), "utf8").catch(() => null);
}

// ── Main ───────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  // Validate required env
  if (!MONGODB_URI)                    throw new Error("MONGODB_URI is required");
  if (!process.env.STORAGE_ENDPOINT)   throw new Error("STORAGE_ENDPOINT is required");
  if (!process.env.STORAGE_ACCESS_KEY) throw new Error("STORAGE_ACCESS_KEY is required");
  if (!process.env.STORAGE_SECRET_KEY) throw new Error("STORAGE_SECRET_KEY is required");
  if (!PUBLIC_BASE)                    throw new Error("STORAGE_PUBLIC_URL is required");

  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log("║   APT Ghana — Comprehensive Media Asset Migration            ║");
  console.log("╚══════════════════════════════════════════════════════════════╝");
  if (DRY_RUN) console.log("  MODE: DRY RUN — no files will be downloaded or written\n");
  console.log(`  Concurrency:    ${CONCURRENCY} parallel downloads`);
  console.log(`  Storage target: ${PUBLIC_BASE}`);
  console.log(`  HTML scanning:  ${SKIP_HTML ? "disabled" : "enabled"}`);
  console.log(`  Resume mode:    ${RESUME ? "enabled" : "disabled"}`);

  await loadState();

  const client = await MongoClient.connect(MONGODB_URI);
  const db     = client.db("aptghana_v2");

  try {
    if (!SKIP_PRODUCTS  && !isCollectionDone("products_v2"))   await migrateProducts(db);
    if (!SKIP_BRANDS    && !isCollectionDone("brands_v2"))     await migrateBrands(db);
    if (!SKIP_CATS      && !isCollectionDone("categories_v2")) await migrateCategories(db);
    if (!SKIP_ARTICLES  && !isCollectionDone("articles_v2"))   await migrateArticles(db);
    if (!SKIP_INDUSTRIES && !isCollectionDone("industries"))   await migrateIndustries(db);
    if (!SKIP_HOMEPAGE  && !isCollectionDone("homepage_configs")) await migrateHomepage(db);

    if (DO_REINDEX && !DRY_RUN) await reindexAffected(db);
  } finally {
    await client.close();
  }

  await saveState();
  await writeReports();

  const seconds = ((Date.now() - startMs) / 1000).toFixed(1);
  console.log("\n════════════════════════════════════════════════════════════════");
  console.log("MIGRATION COMPLETE");
  console.log("════════════════════════════════════════════════════════════════");
  console.log(`URLs scanned:    ${totalStats.scanned.toLocaleString()}`);
  console.log(`Uploaded:        ${totalStats.uploaded.toLocaleString()}`);
  console.log(`Skipped:         ${totalStats.skipped.toLocaleString()}`);
  console.log(`Docs updated:    ${totalStats.updated.toLocaleString()}`);
  console.log(`Broken:          ${totalStats.broken.toLocaleString()}`);
  console.log(`Storage moved:   ${(totalStats.bytes / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Duration:        ${seconds}s`);

  if (totalStats.broken > 0) {
    console.log(`\n  Broken assets logged to: ${CSV_PATH}`);
  }
  console.log(`  Report:  ${REPORT_PATH}`);
  console.log(`  Summary: ${SUMMARY_PATH}`);

  if (!DRY_RUN && state.updatedCollections.length > 0 && !DO_REINDEX) {
    console.log(`\n  Tip: run 'tsx scripts/reindex-migrated-assets.ts --clear' to rebuild Meilisearch.`);
  }

  if (totalStats.broken > 0) process.exit(1);
}

function isCollectionDone(name: string): boolean {
  if (!RESUME) return false;
  if (state.completedCollections.includes(name)) {
    console.log(`\n  Skipping ${name} (already completed in previous run)`);
    return true;
  }
  return false;
}

main().catch(err => {
  console.error("\nMigration failed:", err);
  process.exit(1);
});
