/**
 * Migrate products: database.products → products_v2
 *
 * Legacy fields mapped:
 *   supplierRef → supplierRef (kept)
 *   localRef → sku (APT-internal SKU)
 *   description → name
 *   longDescription → description
 *   brand (slug string) → brandSlug + brandId (ObjectId lookup)
 *   specifications (title + specs[name, values[]]) → specifications (group + attributes[])
 *   documents → documents (typed)
 *   filters → tags
 *   breadcrumbs → categories (resolved to ObjectIds)
 *   image/alternativeImages → images.main / images.gallery
 *   unitPrice → pricing.listPrice
 *   originalPrice → pricing.tradePrice
 *   qty → inventory.quantity
 *   clearance → isClearance
 *   discount → discount
 *   views → views
 *   sales → salesCount (sum of sales array)
 *   newArrival → isNew
 *   currencyCode → pricing.currency
 */

import mongoose from "mongoose";
import "dotenv/config";
import { SITE_URL } from "@apt/config";

const URI = process.env.MONGODB_URI ?? "";
const BATCH_SIZE = 200;

const LegacySchema  = new mongoose.Schema({}, { strict: false });
const NewSchema     = new mongoose.Schema({}, { strict: false, timestamps: true });
const BrandSchema   = new mongoose.Schema({}, { strict: false });
const CategorySchema = new mongoose.Schema({}, { strict: false });

function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

function normalizeSpecs(legacySpecs: Record<string, unknown>[]): Record<string, unknown>[] {
  return legacySpecs.map((s) => ({
    group: s.title as string ?? "Specifications",
    attributes: ((s.specs as Record<string, unknown>[] | undefined) ?? []).map((spec) => ({
      name: spec.name as string,
      value: (() => {
          const raw = spec.values;
          if (Array.isArray(raw)) return raw.join(", ").replace(/<[^>]+>/g, "").trim();
          if (typeof raw === "string") return raw.replace(/<[^>]+>/g, "").trim();
          return String(raw ?? "").replace(/<[^>]+>/g, "").trim();
        })(),
    })),
  }));
}

function normalizeDocuments(legacyDocs: Record<string, unknown>[]): Record<string, unknown>[] {
  return legacyDocs.map((d) => ({
    type: "datasheet",
    title: d.title as string ?? "Document",
    url: d.url as string ?? "",
    language: "en",
  }));
}

function normalizeImageUrl(path: string): string {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${SITE_URL}${path}`;
}

async function migrateProducts() {
  await mongoose.connect(URI);
  const db = mongoose.connection.useDb("database");

  const Legacy   = db.model("LegacyProd", LegacySchema, "products");
  const New      = db.model("NewProd", NewSchema, "products_v2");
  const Brand    = db.model("Brand2", BrandSchema, "brands_v2");
  const Category = db.model("Cat2", CategorySchema, "categories_v2");

  const totalLegacy = await Legacy.countDocuments();
  console.log(`Migrating ${totalLegacy} products in batches of ${BATCH_SIZE}...`);

  let offset = 0;
  let migrated = 0;
  let skipped = 0;
  let errors = 0;

  while (offset < totalLegacy) {
    const batch = await Legacy.find({}).skip(offset).limit(BATCH_SIZE).lean() as Record<string, unknown>[];

    for (const product of batch) {
      try {
        const localRef = (product.localRef as string | undefined) ?? (product.supplierRef as string | undefined) ?? "";
        const sku = localRef.toUpperCase();

        const exists = await New.findOne({ sku });
        if (exists) { skipped++; continue; }

        // Resolve brand ObjectId
        const brandSlug = (product.brand as string | undefined) ?? "";
        const brandDoc = await Brand.findOne({ slug: brandSlug }).lean() as { _id: mongoose.Types.ObjectId } | null;

        // Resolve category paths to ObjectIds
        const breadcrumbs = (product.breadcrumbs as { itemType: string; name: string }[] | undefined) ?? [];
        const categoryIds: mongoose.Types.ObjectId[] = [];
        for (const crumb of breadcrumbs) {
          const catDoc = await Category.findOne({ slug: crumb.name }).lean() as { _id: mongoose.Types.ObjectId } | null;
          if (catDoc) categoryIds.push(catDoc._id);
        }

        const primaryCategoryId = categoryIds[categoryIds.length - 1] ?? null;

        // Tags from filters
        const filters = (product.filters as { title: string; value: string }[] | undefined) ?? [];
        const tags = filters.map((f) => `${f.title}: ${f.value}`);

        // Slug
        const name = product.description as string ?? "";
        const baseSlug = slugify(name).slice(0, 100) || slugify(sku);
        let slug = baseSlug;
        let slugTries = 0;
        while (await New.findOne({ slug })) {
          slugTries++;
          slug = `${baseSlug}-${slugTries}`;
        }

        const unitPrice = (product.unitPrice as number | undefined) ?? 0;
        const originalPrice = (product.originalPrice as number | undefined) ?? 0;
        const salesArr = (product.sales as number[] | undefined) ?? [];
        const salesCount = salesArr.reduce((a, b) => a + b, 0);

        const mainImageRaw = (product.image as { preview?: string } | undefined)?.preview ?? "";
        const altImages = (product.alternativeImages as { preview?: string; zoomed?: string }[] | undefined) ?? [];

        const newProduct: Record<string, unknown> = {
          sku,
          mpn: sku,
          supplierRef: product.supplierRef as string | undefined,
          slug,
          name,
          shortDescription: name,
          description: (product.longDescription as string | undefined) ?? name,
          features: (product.bulletPoints as string[] | undefined) ?? [],
          applications: [],
          certifications: [],

          brandId: brandDoc?._id ?? null,
          brandSlug,
          categories: categoryIds,
          primaryCategoryId,
          tags,
          nodeType: product.nodeName as string | undefined,

          images: {
            main: { url: normalizeImageUrl(mainImageRaw), alt: name },
            gallery: altImages.map((img) => ({
              url: normalizeImageUrl(img.preview ?? img.zoomed ?? ""),
              alt: name,
            })).filter((img: { url: string }) => img.url),
          },

          drawings: (product.drawings as { title: string; content: string }[] | undefined) ?? [],
          specifications: normalizeSpecs((product.specifications as Record<string, unknown>[] | undefined) ?? []),
          documents: normalizeDocuments((product.documents as Record<string, unknown>[] | undefined) ?? []),

          pricing: {
            currency: (product.currencyCode as string | undefined) ?? "USD",
            listPrice: unitPrice,
            tradePrice: originalPrice > 0 && originalPrice < unitPrice ? originalPrice : undefined,
            minimumOrderQty: 1,
          },

          inventory: {
            tracked: true,
            quantity: (product.qty as number | undefined) ?? 0,
            reservedQuantity: 0,
          },

          relatedProducts: [],
          accessories: [],
          replacements: [],
          crossReferences: [],

          seo: {
            title: `${name} | APT Ghana`,
            description: `${name} — ${brandSlug} products available at APT Ghana. Technical specs, documents and fast delivery.`,
            keywords: [name.toLowerCase(), brandSlug, sku],
          },

          status: "active",
          isNew: (product.newArrival as boolean | undefined) ?? false,
          isFeatured: false,
          isClearance: (product.clearance as boolean | undefined) ?? false,
          discount: (product.discount as number | undefined) ?? 0,

          views: (product.views as number | undefined) ?? 0,
          salesCount,
          relevanceScore: (product.relevanceIndex as number | undefined) ?? 0,
        };

        await New.create(newProduct);
        migrated++;
      } catch (err) {
        errors++;
        if (errors <= 10) console.error(`  ✗ Error on ${product.localRef}:`, (err as Error).message);
      }
    }

    offset += BATCH_SIZE;
    console.log(`  Progress: ${Math.min(offset, totalLegacy)}/${totalLegacy} (migrated: ${migrated}, skipped: ${skipped}, errors: ${errors})`);
  }

  console.log(`\nProducts migration complete:`);
  console.log(`  Migrated: ${migrated}`);
  console.log(`  Skipped:  ${skipped}`);
  console.log(`  Errors:   ${errors}`);

  await mongoose.disconnect();
}

migrateProducts().catch((err) => { console.error(err); process.exit(1); });
