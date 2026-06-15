#!/usr/bin/env tsx
/**
 * Full Meilisearch reindex from MongoDB.
 * Rebuilds all search indexes from scratch using MongoDB as the source of truth.
 *
 * Usage:
 *   MONGODB_URI="..." MEILISEARCH_HOST="..." MEILISEARCH_API_KEY="..." tsx scripts/reindex-meilisearch.ts
 *
 * Flags:
 *   --index=products   Reindex only this index (products | brands | categories)
 *   --clear            Delete all documents before reindexing (default: upsert)
 */

import "dotenv/config";
import { MongoClient } from "mongodb";
import { MeiliSearch } from "meilisearch";
import { buildProductRecord, extractCategoryIds } from "../packages/search/src/indexer";
import { initializeSearchIndexes } from "../packages/search/src/config";
import type { ProductForIndex, CategoryForIndex } from "../packages/search/src/indexer";

const MONGODB_URI    = process.env.MONGODB_URI ?? "";
const MEILI_HOST     = process.env.MEILISEARCH_HOST ?? "http://localhost:7700";
const MEILI_KEY      = process.env.MEILISEARCH_API_KEY ?? process.env.MEILISEARCH_MASTER_KEY ?? "";

const TARGET_INDEX   = process.argv.find((a) => a.startsWith("--index="))?.split("=")[1];
const CLEAR_FIRST    = process.argv.includes("--clear");
const BATCH_SIZE     = 250;

async function reindexProducts(
  db: ReturnType<MongoClient["db"]>,
  meili: MeiliSearch,
): Promise<void> {
  console.log("\n  Reindexing products...");
  const index = meili.index("products");

  if (CLEAR_FIRST) {
    await index.deleteAllDocuments();
    console.log("  Cleared existing product index");
  }

  const productsColl   = db.collection("products_v2");
  const brandsColl     = db.collection("brands_v2");
  const categoriesColl = db.collection("categories_v2");

  // Build brand lookup
  const brands = await brandsColl.find({}, { projection: { slug: 1, name: 1 } }).toArray();
  const brandMap = new Map(brands.map((b) => [
    (b as Record<string, unknown>).slug as string,
    (b as Record<string, unknown>).name as string,
  ]));

  // Build category lookup
  const cats = await categoriesColl
    .find({}, { projection: { _id: 1, name: 1, slug: 1, level: 1 } })
    .toArray();
  const catMap = new Map(cats.map((c) => [
    String(c._id),
    { name: (c as Record<string, unknown>).name as string, slug: (c as Record<string, unknown>).slug as string, level: (c as Record<string, unknown>).level as string },
  ]));

  const total   = await productsColl.countDocuments({ status: "active" });
  const cursor  = productsColl.find({ status: "active" });
  let processed = 0;
  let batch: ReturnType<typeof buildProductRecord>[] = [];

  for await (const rawProduct of cursor) {
    const product = rawProduct as unknown as ProductForIndex;
    const brandName = brandMap.get(product.brandSlug ?? "") ?? product.brandSlug ?? "";

    const catIds  = extractCategoryIds(product.categories ?? []);
    const catDocs: CategoryForIndex[] = catIds
      .map((id) => {
        const c = catMap.get(id);
        if (!c) return null;
        return {
          _id: id,
          name: c.name,
          slug: c.slug,
          level: c.level as CategoryForIndex["level"],
        };
      })
      .filter(Boolean) as CategoryForIndex[];

    batch.push(buildProductRecord(product, brandName, catDocs));

    if (batch.length >= BATCH_SIZE) {
      await index.addDocuments(batch, { primaryKey: "id" });
      processed += batch.length;
      batch = [];
      process.stdout.write(`\r  ${processed}/${total} products indexed   `);
    }
  }

  if (batch.length > 0) {
    await index.addDocuments(batch, { primaryKey: "id" });
    processed += batch.length;
  }

  console.log(`\n  ✓ ${processed} products indexed`);
}

async function reindexBrands(
  db: ReturnType<MongoClient["db"]>,
  meili: MeiliSearch,
): Promise<void> {
  console.log("\n  Reindexing brands...");
  const index = meili.index("brands");

  if (CLEAR_FIRST) await index.deleteAllDocuments();

  const coll = db.collection("brands_v2");
  const docs = await coll.find({ status: { $ne: "deleted" } }, {
    projection: { _id: 1, name: 1, slug: 1, shortDescription: 1, logo: 1, isPartner: 1, country: 1, status: 1 },
  }).toArray();

  const records = docs.map((b) => ({
    id:               String(b._id),
    name:             (b as Record<string, unknown>).name,
    slug:             (b as Record<string, unknown>).slug,
    shortDescription: (b as Record<string, unknown>).shortDescription,
    logoUrl:          ((b as Record<string, { url?: string }>).logo)?.url ?? "",
    isPartner:        (b as Record<string, unknown>).isPartner ?? false,
    country:          (b as Record<string, unknown>).country ?? "",
    status:           (b as Record<string, unknown>).status,
  }));

  await index.addDocuments(records, { primaryKey: "id" });
  console.log(`  ✓ ${records.length} brands indexed`);
}

async function reindexCategories(
  db: ReturnType<MongoClient["db"]>,
  meili: MeiliSearch,
): Promise<void> {
  console.log("\n  Reindexing categories...");
  const index = meili.index("categories");

  if (CLEAR_FIRST) await index.deleteAllDocuments();

  const coll = db.collection("categories_v2");
  const docs = await coll.find({ status: { $ne: "deleted" } }, {
    projection: { _id: 1, name: 1, slug: 1, level: 1, parentId: 1, description: 1, image: 1 },
  }).toArray();

  const records = docs.map((c) => ({
    id:          String(c._id),
    name:        (c as Record<string, unknown>).name,
    slug:        (c as Record<string, unknown>).slug,
    level:       (c as Record<string, unknown>).level,
    parentId:    String((c as Record<string, unknown>).parentId ?? ""),
    description: (c as Record<string, unknown>).description ?? "",
    imageUrl:    ((c as Record<string, { url?: string }>).image)?.url ?? "",
  }));

  await index.addDocuments(records, { primaryKey: "id" });
  console.log(`  ✓ ${records.length} categories indexed`);
}

async function main() {
  if (!MONGODB_URI) throw new Error("MONGODB_URI required");
  if (!MEILI_HOST)  throw new Error("MEILISEARCH_HOST required");

  console.log("╔══════════════════════════════════════════════════════════╗");
  console.log("║   APT Ghana — Meilisearch Full Reindex                   ║");
  console.log("╚══════════════════════════════════════════════════════════╝");
  console.log(`Target: ${MEILI_HOST}`);
  if (TARGET_INDEX) console.log(`Filter: ${TARGET_INDEX} only`);
  if (CLEAR_FIRST)  console.log("Mode: CLEAR + INSERT");

  const meili  = new MeiliSearch({ host: MEILI_HOST, apiKey: MEILI_KEY });
  const client = await MongoClient.connect(MONGODB_URI);
  const db     = client.db("aptghana_v2");

  const startMs = Date.now();

  try {
    // Always ensure index settings are up to date
    await initializeSearchIndexes();

    if (!TARGET_INDEX || TARGET_INDEX === "products")   await reindexProducts(db, meili);
    if (!TARGET_INDEX || TARGET_INDEX === "brands")     await reindexBrands(db, meili);
    if (!TARGET_INDEX || TARGET_INDEX === "categories") await reindexCategories(db, meili);
  } finally {
    await client.close();
  }

  const seconds = ((Date.now() - startMs) / 1000).toFixed(1);
  console.log(`\n✓ Reindex complete in ${seconds}s`);
  console.log("Note: Meilisearch indexes tasks asynchronously. Allow ~1 min for indexing to finish.");
}

main().catch((err) => {
  console.error("Reindex failed:", err);
  process.exit(1);
});
