#!/usr/bin/env tsx
/**
 * Full Meilisearch reindex after media migration.
 *
 * Rebuilds all search indexes from MongoDB — the canonical source of truth.
 * Extends the base reindex-meilisearch.ts to include articles and to support
 * incremental post-migration updates.
 *
 * Usage:
 *   MONGODB_URI="..." MEILISEARCH_HOST="..." tsx scripts/reindex-migrated-assets.ts
 *
 * Flags:
 *   --index=products|brands|categories|articles|all
 *                          Reindex only this index (default: all)
 *   --clear                Delete all documents before reindexing (full rebuild)
 *   --after-migration      Read MIGRATION_STATE.json and reindex only collections
 *                          that had documents updated during migration
 *   --batch-size=N         Documents per Meilisearch batch (default: 250)
 *
 * Settings applied:
 *   products   — searchable/filterable/sortable attributes from existing config
 *   brands     — searchable by name/slug/description
 *   categories — searchable by name/slug/description
 *   articles   — searchable by title/excerpt/category/tags
 */

import "dotenv/config";
import { MongoClient }    from "mongodb";
import { MeiliSearch }    from "meilisearch";
import fs                 from "fs/promises";
import path               from "path";
import { buildProductRecord, extractCategoryIds } from "../packages/search/src/indexer";
import { initializeSearchIndexes }                from "../packages/search/src/config";
import type { ProductForIndex, CategoryForIndex } from "../packages/search/src/indexer";

// ── Config ─────────────────────────────────────────────────────────────────────

const MONGODB_URI    = process.env.MONGODB_URI      ?? "";
const MEILI_HOST     = process.env.MEILISEARCH_HOST ?? "http://localhost:7700";
const MEILI_KEY      = process.env.MEILISEARCH_ADMIN_KEY ?? process.env.MEILISEARCH_API_KEY ?? process.env.MEILISEARCH_MASTER_KEY ?? "";
const BATCH_SIZE     = Number(process.argv.find(a => a.startsWith("--batch-size="))?.split("=")[1] ?? 250);
const TARGET_INDEX   = process.argv.find(a => a.startsWith("--index="))?.split("=")[1] as string | undefined;
const CLEAR_FIRST    = process.argv.includes("--clear");
const AFTER_MIGRATION = process.argv.includes("--after-migration");

const STATE_PATH = path.join(process.cwd(), "MIGRATION_STATE.json");

// ── Helpers ────────────────────────────────────────────────────────────────────

interface MigrationState {
  version:            1;
  updatedCollections: string[];
}

async function loadMigrationState(): Promise<MigrationState | null> {
  try {
    const raw = await fs.readFile(STATE_PATH, "utf8");
    return JSON.parse(raw) as MigrationState;
  } catch {
    return null;
  }
}

function shouldIndex(indexName: string, touchedCollections: string[]): boolean {
  if (!AFTER_MIGRATION) {
    return !TARGET_INDEX || TARGET_INDEX === indexName || TARGET_INDEX === "all";
  }
  // --after-migration: only collections that had docs updated
  const collectionMap: Record<string, string> = {
    products:   "products_v2",
    brands:     "brands_v2",
    categories: "categories_v2",
    articles:   "articles_v2",
  };
  return touchedCollections.includes(collectionMap[indexName] ?? indexName);
}

// ── Product reindex ────────────────────────────────────────────────────────────

async function reindexProducts(
  db:    ReturnType<MongoClient["db"]>,
  meili: MeiliSearch,
): Promise<void> {
  console.log("\n  Reindexing products...");
  const index = meili.index("products");
  if (CLEAR_FIRST) {
    await index.deleteAllDocuments();
    console.log("    Cleared existing index");
  }

  // Build lookup maps for brand names and category metadata
  const brands = await db.collection("brands_v2")
    .find({}, { projection: { slug: 1, name: 1 } })
    .toArray();
  const brandMap = new Map(brands.map(b => [
    String((b as Record<string, unknown>).slug),
    String((b as Record<string, unknown>).name),
  ]));

  const cats = await db.collection("categories_v2")
    .find({}, { projection: { _id: 1, name: 1, slug: 1, level: 1 } })
    .toArray();
  const catMap = new Map(cats.map(c => [
    String(c._id),
    {
      name:  String((c as Record<string, unknown>).name),
      slug:  String((c as Record<string, unknown>).slug),
      level: String((c as Record<string, unknown>).level),
    },
  ]));

  const total   = await db.collection("products_v2").countDocuments({ status: "active" });
  const cursor  = db.collection("products_v2").find({ status: "active" });
  let processed = 0;
  let batch: ReturnType<typeof buildProductRecord>[] = [];

  for await (const rawProduct of cursor) {
    const product   = rawProduct as unknown as ProductForIndex;
    const brandName = brandMap.get(product.brandSlug ?? "") ?? product.brandSlug ?? "";
    const catIds    = extractCategoryIds(product.categories ?? []);
    const catDocs: CategoryForIndex[] = catIds
      .map(id => {
        const c = catMap.get(id);
        return c ? { _id: id, name: c.name, slug: c.slug, level: c.level as CategoryForIndex["level"] } : null;
      })
      .filter(Boolean) as CategoryForIndex[];

    batch.push(buildProductRecord(product, brandName, catDocs));

    if (batch.length >= BATCH_SIZE) {
      await index.addDocuments(batch, { primaryKey: "id" });
      processed += batch.length;
      batch = [];
      process.stdout.write(`\r    ${processed.toLocaleString()}/${total.toLocaleString()} products   `);
    }
  }

  if (batch.length > 0) {
    await index.addDocuments(batch, { primaryKey: "id" });
    processed += batch.length;
  }

  console.log(`\n    ✓ ${processed.toLocaleString()} products indexed`);
}

// ── Brand reindex ──────────────────────────────────────────────────────────────

async function reindexBrands(
  db:    ReturnType<MongoClient["db"]>,
  meili: MeiliSearch,
): Promise<void> {
  console.log("\n  Reindexing brands...");
  const index = meili.index("brands");
  if (CLEAR_FIRST) await index.deleteAllDocuments();

  // Ensure settings
  await index.updateSettings({
    searchableAttributes: ["name", "slug", "shortDescription", "country"],
    filterableAttributes: ["status", "isPartner", "country"],
    sortableAttributes:   ["name"],
  }).catch(() => null);

  const docs = await db.collection("brands_v2")
    .find({ status: { $ne: "deleted" } }, {
      projection: { _id: 1, name: 1, slug: 1, shortDescription: 1, logo: 1, isPartner: 1, country: 1, status: 1 },
    })
    .toArray();

  const records = docs.map(b => ({
    id:               String(b._id),
    name:             (b as Record<string, unknown>).name ?? "",
    slug:             (b as Record<string, unknown>).slug ?? "",
    shortDescription: (b as Record<string, unknown>).shortDescription ?? "",
    logoUrl:          ((b as Record<string, { url?: string }>).logo)?.url ?? "",
    isPartner:        (b as Record<string, unknown>).isPartner ?? false,
    country:          (b as Record<string, unknown>).country ?? "",
    status:           (b as Record<string, unknown>).status ?? "active",
  }));

  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    await index.addDocuments(records.slice(i, i + BATCH_SIZE), { primaryKey: "id" });
  }
  console.log(`    ✓ ${records.length.toLocaleString()} brands indexed`);
}

// ── Category reindex ───────────────────────────────────────────────────────────

async function reindexCategories(
  db:    ReturnType<MongoClient["db"]>,
  meili: MeiliSearch,
): Promise<void> {
  console.log("\n  Reindexing categories...");
  const index = meili.index("categories");
  if (CLEAR_FIRST) await index.deleteAllDocuments();

  await index.updateSettings({
    searchableAttributes: ["name", "slug", "description"],
    filterableAttributes: ["level", "parentId", "status"],
    sortableAttributes:   ["name"],
  }).catch(() => null);

  const docs = await db.collection("categories_v2")
    .find({ status: { $ne: "deleted" } }, {
      projection: { _id: 1, name: 1, slug: 1, level: 1, parentId: 1, description: 1, image: 1, status: 1 },
    })
    .toArray();

  const records = docs.map(c => ({
    id:          String(c._id),
    name:        (c as Record<string, unknown>).name ?? "",
    slug:        (c as Record<string, unknown>).slug ?? "",
    level:       (c as Record<string, unknown>).level ?? "",
    parentId:    String((c as Record<string, unknown>).parentId ?? ""),
    description: (c as Record<string, unknown>).description ?? "",
    imageUrl:    ((c as Record<string, { url?: string }>).image)?.url ?? "",
    status:      (c as Record<string, unknown>).status ?? "active",
  }));

  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    await index.addDocuments(records.slice(i, i + BATCH_SIZE), { primaryKey: "id" });
  }
  console.log(`    ✓ ${records.length.toLocaleString()} categories indexed`);
}

// ── Article reindex ────────────────────────────────────────────────────────────

async function reindexArticles(
  db:    ReturnType<MongoClient["db"]>,
  meili: MeiliSearch,
): Promise<void> {
  console.log("\n  Reindexing articles...");
  const index = meili.index("articles");
  if (CLEAR_FIRST) await index.deleteAllDocuments();

  // Apply article index settings
  await index.updateSettings({
    searchableAttributes: ["title", "excerpt", "category", "tags", "authorName"],
    filterableAttributes: ["status", "category", "tags", "featured"],
    sortableAttributes:   ["publishDate", "viewCount", "readingTimeMinutes"],
    rankingRules: ["words", "typo", "proximity", "attribute", "sort", "exactness"],
  }).catch(() => null);

  const cursor = db.collection("articles_v2").find(
    { status: { $in: ["published", "scheduled", "draft", "review", "archived"] } },
    {
      projection: {
        _id: 1, title: 1, slug: 1, excerpt: 1, status: 1, category: 1,
        tags: 1, featured: 1, authorName: 1, featuredImage: 1,
        publishDate: 1, viewCount: 1, readingTimeMinutes: 1,
      },
    }
  );

  let batch: object[] = [];
  let processed = 0;

  for await (const raw of cursor) {
    const a = raw as Record<string, unknown>;
    batch.push({
      id:                 String(raw._id),
      title:              a.title               ?? "",
      slug:               a.slug                ?? "",
      excerpt:            a.excerpt             ?? "",
      status:             a.status              ?? "draft",
      category:           a.category            ?? "",
      tags:               a.tags                ?? [],
      featured:           a.featured            ?? false,
      authorName:         a.authorName          ?? "",
      featuredImageUrl:   (a.featuredImage as { url?: string })?.url ?? "",
      publishDate:        a.publishDate
        ? new Date(a.publishDate as string | Date).getTime()
        : null,
      viewCount:          a.viewCount           ?? 0,
      readingTimeMinutes: a.readingTimeMinutes  ?? 0,
    });

    if (batch.length >= BATCH_SIZE) {
      await index.addDocuments(batch, { primaryKey: "id" });
      processed += batch.length;
      batch = [];
      process.stdout.write(`\r    ${processed.toLocaleString()} articles   `);
    }
  }

  if (batch.length > 0) {
    await index.addDocuments(batch, { primaryKey: "id" });
    processed += batch.length;
  }

  console.log(`\n    ✓ ${processed.toLocaleString()} articles indexed`);
}

// ── Main ───────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  if (!MONGODB_URI) throw new Error("MONGODB_URI required");
  if (!MEILI_HOST)  throw new Error("MEILISEARCH_HOST required");

  let touchedCollections: string[] = [];

  if (AFTER_MIGRATION) {
    const migState = await loadMigrationState();
    if (!migState) {
      console.error("Error: MIGRATION_STATE.json not found. Run migration first or omit --after-migration.");
      process.exit(1);
    }
    touchedCollections = migState.updatedCollections;
    console.log(`  After-migration mode: reindexing ${touchedCollections.join(", ")}`);
  }

  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log("║   APT Ghana — Meilisearch Reindex (Post-Migration)           ║");
  console.log("╚══════════════════════════════════════════════════════════════╝");
  console.log(`  Host:  ${MEILI_HOST}`);
  if (TARGET_INDEX)   console.log(`  Index: ${TARGET_INDEX}`);
  if (CLEAR_FIRST)    console.log("  Mode:  CLEAR + REBUILD");

  const meili  = new MeiliSearch({ host: MEILI_HOST, apiKey: MEILI_KEY });
  const client = await MongoClient.connect(MONGODB_URI);
  const db     = client.db("aptghana_v2");
  const startMs = Date.now();

  try {
    // Apply product index settings (keeps existing tuning)
    await initializeSearchIndexes().catch(() => null);

    if (shouldIndex("products",   touchedCollections)) await reindexProducts(db, meili);
    if (shouldIndex("brands",     touchedCollections)) await reindexBrands(db, meili);
    if (shouldIndex("categories", touchedCollections)) await reindexCategories(db, meili);
    if (shouldIndex("articles",   touchedCollections)) await reindexArticles(db, meili);
  } finally {
    await client.close();
  }

  const seconds = ((Date.now() - startMs) / 1000).toFixed(1);
  console.log(`\n✓ Reindex complete in ${seconds}s`);
  console.log("  Note: Meilisearch indexes asynchronously. Allow ~60s for indexing to complete.");
}

main().catch(err => {
  console.error("Reindex failed:", err);
  process.exit(1);
});
