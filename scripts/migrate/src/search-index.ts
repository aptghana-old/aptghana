/**
 * Push all active products_v2 documents to Meilisearch.
 * Run after the products migration.
 *
 * Usage: tsx scripts/migrate/src/search-index.ts
 */

import mongoose from "mongoose";
import "dotenv/config";
import { buildProductRecord, extractCategoryIds, type ProductForIndex, type CategoryForIndex } from "@apt/search";
import { getMeilisearchClient, INDEXES, initializeSearchIndexes } from "@apt/search";

const URI              = process.env.MONGODB_URI           ?? "";
const MEILISEARCH_HOST = process.env.MEILISEARCH_HOST      ?? "http://localhost:7700";
const MEILISEARCH_KEY  = process.env.MEILISEARCH_API_KEY   ?? "";
const BATCH_SIZE = 200;

// Loose schemas for migration context — strict: false to accept any stored shape
const ProductSchema  = new mongoose.Schema({}, { strict: false });
const BrandSchema    = new mongoose.Schema({}, { strict: false });
const CatSchema      = new mongoose.Schema({}, { strict: false });

async function indexProducts() {
  await mongoose.connect(URI);
  const db = mongoose.connection.useDb("database");

  const Product  = db.model("MigProd", ProductSchema, "products_v2");
  const Brand    = db.model("MigBrand", BrandSchema, "brands_v2");
  const Category = db.model("MigCat",  CatSchema,   "categories_v2");

  // Override env so the @apt/search client hits the right host
  process.env.MEILISEARCH_HOST    = MEILISEARCH_HOST;
  process.env.MEILISEARCH_API_KEY = MEILISEARCH_KEY;

  // Apply index configuration + synonyms
  console.log("Configuring Meilisearch indexes…");
  await initializeSearchIndexes();

  // Prefetch brands and categories for efficiency
  const [brands, categories] = await Promise.all([
    Brand.find({}).lean() as Promise<Record<string, unknown>[]>,
    Category.find({ status: "active" }).lean() as Promise<Record<string, unknown>[]>,
  ]);

  const brandMap = new Map<string, string>();
  for (const b of brands) brandMap.set(String(b._id), String(b.name ?? ""));

  const catMap = new Map<string, CategoryForIndex>();
  for (const c of categories) {
    catMap.set(String(c._id), {
      _id:   c._id,
      name:  String(c.name ?? ""),
      slug:  String(c.slug ?? ""),
      level: (c.level ?? "category") as CategoryForIndex["level"],
    });
  }

  const client = getMeilisearchClient();
  const index  = client.index(INDEXES.PRODUCTS);

  const total = await Product.countDocuments({ status: "active" });
  console.log(`Indexing ${total} active products…`);

  let offset  = 0;
  let indexed = 0;
  let errors  = 0;

  while (offset < total) {
    const batch = await Product.find({ status: "active" })
      .skip(offset)
      .limit(BATCH_SIZE)
      .lean() as Record<string, unknown>[];

    const records = [];
    for (const raw of batch) {
      try {
        const product: ProductForIndex = {
          _id:              raw._id,
          sku:              String(raw.sku  ?? ""),
          mpn:              String(raw.mpn  ?? ""),
          name:             String(raw.name ?? ""),
          shortDescription: raw.shortDescription as string | undefined,
          brandSlug:        raw.brandSlug as string | undefined,
          categories:       raw.categories as unknown[],
          tags:             raw.tags       as string[],
          features:         raw.features   as string[],
          applications:     raw.applications as string[],
          images:           raw.images as ProductForIndex["images"],
          pricing:          raw.pricing    as ProductForIndex["pricing"],
          inventory:        raw.inventory  as ProductForIndex["inventory"],
          isClearance:      raw.isClearance as boolean | undefined,
          isFeatured:       raw.isFeatured  as boolean | undefined,
          discount:         raw.discount    as number  | undefined,
          views:            raw.views       as number  | undefined,
          salesCount:       raw.salesCount  as number  | undefined,
          relevanceScore:   raw.relevanceScore as number | undefined,
        };

        const brandName   = raw.brandId ? (brandMap.get(String(raw.brandId)) ?? "") : "";
        const catIds      = extractCategoryIds(raw.categories as unknown[] ?? []);
        const resolvedCats = catIds.map((cid) => catMap.get(cid)).filter(Boolean) as CategoryForIndex[];

        records.push(buildProductRecord(product, brandName, resolvedCats));
      } catch (err) {
        errors++;
        console.warn(`  Skipped product ${raw._id}: ${err}`);
      }
    }

    if (records.length) {
      await index.addDocuments(records, { primaryKey: "id" });
    }

    indexed += batch.length;
    offset  += BATCH_SIZE;
    console.log(`  ${indexed}/${total} (${errors} errors)`);
  }

  console.log(`\nSearch index complete: ${indexed - errors} indexed, ${errors} errors`);
  await mongoose.disconnect();
}

indexProducts().catch((err) => { console.error(err); process.exit(1); });
