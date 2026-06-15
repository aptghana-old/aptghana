#!/usr/bin/env tsx
/**
 * Migrate existing assets (product images, brand logos, RFQ attachments) to MinIO.
 *
 * Sources:
 *  1. Product images     — product.images.main.url / product.images.gallery[].url
 *  2. Product documents  — product.documents[].url
 *  3. Brand logos        — brand.logo.url / brand.coverImage.url
 *  4. Category images    — category.image.url
 *  5. RFQ attachments    — Buffer stored in MongoDB attachments_v2.data
 *
 * Usage:
 *   MONGODB_URI="..." STORAGE_ENDPOINT="..." tsx scripts/migrate-assets-to-minio.ts
 *
 * Flags:
 *   --dry-run          Report what would be done without writing
 *   --skip-products    Skip product assets
 *   --skip-brands      Skip brand assets
 *   --skip-attachments Skip RFQ attachment migration
 *   --only-attachments Only migrate RFQ attachments (fastest way to move buffers out of MongoDB)
 */

import "dotenv/config";
import { MongoClient, ObjectId } from "mongodb";
import { uploadFile, fileExists, deleteFile } from "../packages/storage/src/upload";
import { isImageMime } from "../packages/storage/src/helpers";

const MONGODB_URI  = process.env.MONGODB_URI ?? "";
const DRY_RUN      = process.argv.includes("--dry-run");
const SKIP_PRODS   = process.argv.includes("--skip-products");
const SKIP_BRANDS  = process.argv.includes("--skip-brands");
const SKIP_ATTACH  = process.argv.includes("--skip-attachments");
const ONLY_ATTACH  = process.argv.includes("--only-attachments");
const PUBLIC_BASE  = process.env.STORAGE_PUBLIC_URL ?? "";

interface MigrationStats {
  attempted: number;
  uploaded:  number;
  skipped:   number;
  failed:    number;
  bytes:     number;
}

function emptyStats(): MigrationStats {
  return { attempted: 0, uploaded: 0, skipped: 0, failed: 0, bytes: 0 };
}

// ─── URL download helper ──────────────────────────────────────────────────────

async function downloadUrl(url: string): Promise<{ data: Buffer; contentType: string } | null> {
  if (!url || url.startsWith(PUBLIC_BASE)) return null; // already on MinIO
  if (url.startsWith("/"))                  return null; // relative/local path — skip

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(30_000) });
    if (!res.ok) {
      console.warn(`      HTTP ${res.status} for ${url}`);
      return null;
    }
    const contentType = res.headers.get("content-type") ?? "application/octet-stream";
    const data = Buffer.from(await res.arrayBuffer());
    return { data, contentType };
  } catch (err) {
    console.warn(`      Download failed: ${url}`, (err as Error).message);
    return null;
  }
}

// ─── Product assets ───────────────────────────────────────────────────────────

async function migrateProductAssets(db: ReturnType<MongoClient["db"]>): Promise<MigrationStats> {
  const stats = emptyStats();
  const coll  = db.collection("products_v2");
  const total = await coll.countDocuments();
  console.log(`\n  Products: ${total} documents`);

  const cursor = coll.find({}, {
    projection: { slug: 1, images: 1, documents: 1 },
  });

  let idx = 0;
  for await (const product of cursor) {
    idx++;
    process.stdout.write(`\r  [${idx}/${total}]`);

    const updates: Record<string, unknown> = {};
    const slug = (product as Record<string, unknown>).slug as string ?? String(product._id);

    // Main image
    const main = (product as Record<string, { url?: string }>).images?.main;
    if (main?.url && !main.url.startsWith(PUBLIC_BASE)) {
      stats.attempted++;
      const result = await migrateUrl(main.url, `products/${slug}`, "image", stats);
      if (result) updates["images.main.url"] = result;
    }

    // Gallery
    const gallery: Array<{ url?: string }> = (product as Record<string, unknown[]>).images?.["gallery"] ?? [];
    const newGallery: string[] = [];
    for (let i = 0; i < gallery.length; i++) {
      const item = gallery[i];
      if (item?.url && !item.url.startsWith(PUBLIC_BASE)) {
        stats.attempted++;
        const result = await migrateUrl(item.url, `products/${slug}/gallery`, "image", stats);
        if (result) {
          newGallery.push(result);
          updates[`images.gallery.${i}.url`] = result;
        }
      }
    }

    // Documents
    const docs: Array<{ url?: string; type?: string }> = (product as Record<string, unknown[]>).documents ?? [];
    for (let i = 0; i < docs.length; i++) {
      const doc = docs[i];
      if (doc?.url && !doc.url.startsWith(PUBLIC_BASE)) {
        stats.attempted++;
        const folder = doc.type === "video" ? "videos" : "datasheets";
        const result = await migrateUrl(doc.url, folder, "document", stats);
        if (result) updates[`documents.${i}.url`] = result;
      }
    }

    if (Object.keys(updates).length > 0 && !DRY_RUN) {
      await coll.updateOne({ _id: product._id }, { $set: updates });
    }
  }

  console.log(`\n  Products: ${stats.uploaded} uploaded, ${stats.skipped} skipped, ${stats.failed} failed`);
  return stats;
}

// ─── Brand assets ─────────────────────────────────────────────────────────────

async function migrateBrandAssets(db: ReturnType<MongoClient["db"]>): Promise<MigrationStats> {
  const stats = emptyStats();
  const coll  = db.collection("brands_v2");
  const total = await coll.countDocuments();
  console.log(`\n  Brands: ${total} documents`);

  const cursor = coll.find({}, { projection: { slug: 1, logo: 1, coverImage: 1 } });

  for await (const brand of cursor) {
    const slug    = (brand as Record<string, unknown>).slug as string;
    const updates: Record<string, unknown> = {};

    for (const field of ["logo", "coverImage"] as const) {
      const asset = (brand as Record<string, { url?: string }>)[field];
      if (asset?.url && !asset.url.startsWith(PUBLIC_BASE)) {
        stats.attempted++;
        const result = await migrateUrl(asset.url, `brands/${slug}`, "image", stats);
        if (result) updates[`${field}.url`] = result;
      }
    }

    if (Object.keys(updates).length > 0 && !DRY_RUN) {
      await coll.updateOne({ _id: brand._id }, { $set: updates });
    }
  }

  console.log(`  Brands: ${stats.uploaded} uploaded, ${stats.skipped} skipped, ${stats.failed} failed`);
  return stats;
}

// ─── Category assets ──────────────────────────────────────────────────────────

async function migrateCategoryAssets(db: ReturnType<MongoClient["db"]>): Promise<MigrationStats> {
  const stats = emptyStats();
  const coll  = db.collection("categories_v2");
  const total = await coll.countDocuments();
  console.log(`\n  Categories: ${total} documents`);

  const cursor = coll.find({}, { projection: { slug: 1, image: 1 } });

  for await (const cat of cursor) {
    const slug  = (cat as Record<string, unknown>).slug as string;
    const image = (cat as Record<string, { url?: string }>).image;
    if (image?.url && !image.url.startsWith(PUBLIC_BASE)) {
      stats.attempted++;
      const result = await migrateUrl(image.url, `categories/${slug}`, "image", stats);
      if (result && !DRY_RUN) {
        await coll.updateOne({ _id: cat._id }, { $set: { "image.url": result } });
      }
    }
  }

  console.log(`  Categories: ${stats.uploaded} uploaded, ${stats.skipped} skipped, ${stats.failed} failed`);
  return stats;
}

// ─── RFQ Attachments (Buffer → MinIO) ────────────────────────────────────────

async function migrateAttachments(db: ReturnType<MongoClient["db"]>): Promise<MigrationStats> {
  const stats = emptyStats();
  const coll  = db.collection("attachments_v2");

  // Only migrate docs that still have a Buffer (no storageKey yet)
  const query = { storageKey: { $exists: false }, data: { $exists: true } };
  const total = await coll.countDocuments(query);
  console.log(`\n  RFQ Attachments: ${total} with buffered data`);

  const cursor = coll.find(query, {
    projection: { name: 1, contentType: 1, size: 1, data: 1 },
  });

  let idx = 0;
  for await (const doc of cursor) {
    idx++;
    process.stdout.write(`\r  [${idx}/${total}]`);
    stats.attempted++;

    if (DRY_RUN) { stats.skipped++; continue; }

    try {
      const attachment = doc as unknown as {
        _id: ObjectId;
        name: string;
        contentType: string;
        size: number;
        data: Buffer;
      };

      const buffer = Buffer.isBuffer(attachment.data)
        ? attachment.data
        : Buffer.from((attachment.data as unknown as { buffer: ArrayBuffer }).buffer);

      const key = `rfq-attachments/${String(attachment._id)}-${attachment.name.replace(/[^a-z0-9._-]/gi, "-")}`;

      const result = await uploadFile(buffer, attachment.name, attachment.contentType, {
        folder: "rfq-attachments",
        key,
        cacheControl: "private, max-age=3600",
        contentDisposition: `attachment; filename="${attachment.name}"`,
      });

      // Update document: add storageKey, clear Buffer
      await coll.updateOne(
        { _id: attachment._id },
        {
          $set:   { storageKey: result.key },
          $unset: { data: "" },
        }
      );

      stats.uploaded++;
      stats.bytes += attachment.size;
    } catch (err) {
      console.error(`\n  Failed to migrate attachment ${String(doc._id)}:`, err);
      stats.failed++;
    }
  }

  console.log(`\n  Attachments: ${stats.uploaded} uploaded, ${stats.failed} failed, ${(stats.bytes / 1024 / 1024).toFixed(1)} MB freed from MongoDB`);
  return stats;
}

// ─── Shared URL migration ─────────────────────────────────────────────────────

async function migrateUrl(
  url: string,
  folder: string,
  type: "image" | "document",
  stats: MigrationStats,
): Promise<string | null> {
  if (DRY_RUN) { stats.skipped++; return null; }

  const downloaded = await downloadUrl(url);
  if (!downloaded) { stats.skipped++; return null; }

  const { data, contentType } = downloaded;
  const filename = url.split("/").pop() ?? `asset-${Date.now()}`;

  try {
    const result = await uploadFile(data, filename, contentType, {
      folder: folder as Parameters<typeof uploadFile>[3]["folder"],
    });
    stats.uploaded++;
    stats.bytes += data.byteLength;
    return result.url;
  } catch (err) {
    console.warn(`      Upload failed for ${url}:`, (err as Error).message);
    stats.failed++;
    return null;
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  if (!MONGODB_URI) throw new Error("MONGODB_URI environment variable required");
  if (!process.env.STORAGE_ENDPOINT) throw new Error("STORAGE_ENDPOINT required");
  if (!process.env.STORAGE_ACCESS_KEY) throw new Error("STORAGE_ACCESS_KEY required");
  if (!process.env.STORAGE_SECRET_KEY) throw new Error("STORAGE_SECRET_KEY required");
  if (!PUBLIC_BASE) throw new Error("STORAGE_PUBLIC_URL required");

  console.log("╔══════════════════════════════════════════════════════════╗");
  console.log("║   APT Ghana — Asset Migration to MinIO                   ║");
  console.log("╚══════════════════════════════════════════════════════════╝");
  if (DRY_RUN) console.log("MODE: DRY RUN — no files will be written\n");

  const client = await MongoClient.connect(MONGODB_URI);
  const db     = client.db("aptghana_v2");

  const allStats = emptyStats();
  const merge = (s: MigrationStats) => {
    allStats.attempted += s.attempted;
    allStats.uploaded  += s.uploaded;
    allStats.skipped   += s.skipped;
    allStats.failed    += s.failed;
    allStats.bytes     += s.bytes;
  };

  try {
    if (ONLY_ATTACH) {
      merge(await migrateAttachments(db));
    } else {
      if (!SKIP_PRODS)  merge(await migrateProductAssets(db));
      if (!SKIP_BRANDS) merge(await migrateBrandAssets(db));
      if (!SKIP_BRANDS) merge(await migrateCategoryAssets(db));
      if (!SKIP_ATTACH) merge(await migrateAttachments(db));
    }
  } finally {
    await client.close();
  }

  console.log("\n════════════════════════════════════════════════════════════");
  console.log("ASSET MIGRATION SUMMARY");
  console.log("════════════════════════════════════════════════════════════");
  console.log(`Attempted: ${allStats.attempted}`);
  console.log(`Uploaded:  ${allStats.uploaded}`);
  console.log(`Skipped:   ${allStats.skipped}`);
  console.log(`Failed:    ${allStats.failed}`);
  console.log(`Data moved: ${(allStats.bytes / 1024 / 1024).toFixed(1)} MB`);

  if (allStats.failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error("Asset migration failed:", err);
  process.exit(1);
});
