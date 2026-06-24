import type { SearchProductRecord } from "@apt/types";
import { getMeilisearchClient, INDEXES } from "./client";

// ─── Input types ──────────────────────────────────────────────────────────────

export interface CategoryForIndex {
  _id?: unknown;
  name: string;
  slug?: string;
  level?: "group" | "category" | "subcategory" | "range";
}

// Spec attribute — tolerant of both migrated format ({value}) and admin format ({values[]})
interface RawSpecAttr {
  name?: unknown;
  value?: unknown;
  values?: unknown;
  unit?: unknown;
}

interface RawSpecGroup {
  group?: unknown;
  groupName?: unknown;
  attributes?: RawSpecAttr[];
  specs?: RawSpecAttr[];
}

export interface ProductForIndex {
  _id: unknown;
  sku: string;
  mpn: string;
  name: string;
  shortDescription?: string;
  brandSlug?: string;
  categories?: unknown[];
  tags?: string[];
  features?: string[];
  applications?: string[];
  images?: { main?: { url?: string } };
  pricing?: { listPrice?: number; currency?: string };
  inventory?: { quantity?: number; tracked?: boolean };
  specifications?: RawSpecGroup[];
  isNew?: boolean;
  isClearance?: boolean;
  isFeatured?: boolean;
  discount?: number;
  views?: number;
  salesCount?: number;
  relevanceScore?: number;
}

// ─── Spec extraction ──────────────────────────────────────────────────────────

// Spec names that add no filtering value
const SKIP_SPEC_NAMES = new Set([
  // Packaging
  "unit type of package 1", "number of units in package 1", "packing type",
  "package 1 height", "package 1 width", "package 1 length", "package 1 weight",
  "net weight", "product net weight", "gross weight",
  // Admin/catalogue metadata
  "warranty", "standards", "order code", "ean", "ean code", "upc",
  "country of origin", "product description", "product name",
  "name of series", "range of product", "range", "product reference",
  "device short name", "model", "series", "product or component type",
  "fluid", "r",  // common but noisy
]);

function toTitleCase(s: string): string {
  return s
    .replace(/\[(.+?)\]/g, "($1)")   // [In] → (In)
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function resolveAttrValue(attr: RawSpecAttr): string {
  if (attr.value != null && String(attr.value).trim()) return String(attr.value).trim();
  if (Array.isArray(attr.values) && attr.values.length) return String(attr.values[0]).trim();
  if (typeof attr.values === "string" && attr.values.trim()) return attr.values.trim();
  return "";
}

/**
 * Extract specification filters from a product's structured specs and tags.
 * Returns an array of "Spec Name::value" strings for Meilisearch faceting.
 */
export function extractSpecValues(product: ProductForIndex): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  function add(rawName: string, rawValue: string) {
    const name  = toTitleCase(rawName.trim());
    const value = rawValue.trim();
    if (!name || !value) return;
    if (value.length > 60) return; // descriptions, not filter values
    if (SKIP_SPEC_NAMES.has(rawName.toLowerCase().trim())) return;
    if (SKIP_SPEC_NAMES.has(name.toLowerCase())) return;
    const entry = `${name}::${value}`;
    if (!seen.has(entry)) {
      seen.add(entry);
      result.push(entry);
    }
  }

  // 1. From structured specifications (primary, clean source)
  for (const grp of (product.specifications ?? [])) {
    const attrs = grp.attributes ?? grp.specs ?? [];
    for (const attr of attrs) {
      const name  = String(attr.name  ?? "").trim();
      const value = resolveAttrValue(attr);
      const unit  = String(attr.unit  ?? "").trim();
      if (name && value) add(name, unit ? `${value} ${unit}` : value);
    }
  }

  // 2. From tags in "Key: Value" format (legacy Schneider filter data)
  for (const tag of (product.tags ?? [])) {
    const colonIdx = tag.indexOf(": ");
    if (colonIdx > 0 && colonIdx < tag.length - 2) {
      const key   = tag.substring(0, colonIdx).trim();
      const value = tag.substring(colonIdx + 2).trim();
      // Skip if the key itself looks like a sentence (>4 words = description)
      if (key.split(" ").length <= 4) add(key, value);
    }
  }

  return result;
}

// ─── Hierarchy ────────────────────────────────────────────────────────────────

const LEVEL_KEY: Record<string, "lvl0" | "lvl1" | "lvl2" | "lvl3"> = {
  group:       "lvl0",
  category:    "lvl1",
  subcategory: "lvl2",
  range:       "lvl3",
};

// ─── Record builder ───────────────────────────────────────────────────────────

export function buildProductRecord(
  product: ProductForIndex,
  brandName: string,
  categories: CategoryForIndex[],
): SearchProductRecord {
  const pricing   = product.pricing   ?? {};
  const inventory = product.inventory ?? {};

  const hierarchicalCategories: SearchProductRecord["hierarchicalCategories"] = {};
  for (const cat of categories) {
    if (cat.level) {
      const key = LEVEL_KEY[cat.level];
      if (key) hierarchicalCategories[key] = cat.name;
    }
  }

  const inStock =
    inventory.tracked === false ? true : (inventory.quantity ?? 0) > 0;

  return {
    id:               String(product._id),
    sku:              product.sku    ?? "",
    mpn:              product.mpn    ?? "",
    name:             product.name   ?? "",
    shortDescription: product.shortDescription ?? "",
    brandSlug:        product.brandSlug ?? "",
    brandName,
    categories:       categories.map((c) => c.name),
    hierarchicalCategories,
    tags:             product.tags ?? [],
    filterTags: [
      ...(product.tags         ?? []),
      ...(product.features     ?? []),
      ...(product.applications ?? []),
    ],
    specValues:     extractSpecValues(product),
    imageUrl:       product.images?.main?.url ?? "",
    listPrice:      pricing.listPrice  ?? 0,
    currency:       pricing.currency   ?? "GHS",
    inStock,
    isNew:          product.isNew       ?? false,
    isFeatured:     product.isFeatured  ?? false,
    isClearance:    product.isClearance ?? false,
    discount:       product.discount    ?? 0,
    relevanceScore: product.relevanceScore ?? 0,
    views:          product.views      ?? 0,
    salesCount:     product.salesCount ?? 0,
    status:         "active",
  };
}

// ─── Meilisearch operations ───────────────────────────────────────────────────

export async function upsertProductRecord(record: SearchProductRecord): Promise<void> {
  const client = getMeilisearchClient();
  await client.index(INDEXES.PRODUCTS).addDocuments([record], { primaryKey: "id" });
}

export async function removeProductRecord(id: string): Promise<void> {
  const client = getMeilisearchClient();
  try {
    await client.index(INDEXES.PRODUCTS).deleteDocument(id);
  } catch {
    // No-op if document was never indexed
  }
}

// ─── Category ID extraction ───────────────────────────────────────────────────
// Handles: raw ObjectId strings, Mongoose ObjectId objects, and {id, name, slug} objects
// (admin API stores categories as plain objects; migrated products store ObjectId refs)

export function extractCategoryIds(categories: unknown[]): string[] {
  return categories
    .map((c): string | null => {
      if (!c) return null;
      if (typeof c === "string" && /^[0-9a-f]{24}$/i.test(c)) return c;
      if (typeof c === "object") {
        const obj = c as Record<string, unknown>;
        if (typeof obj.id  === "string" && /^[0-9a-f]{24}$/i.test(obj.id))  return obj.id;
        if (typeof obj._id === "string" && /^[0-9a-f]{24}$/i.test(obj._id)) return obj._id;
        const str = String(c);
        if (/^[0-9a-f]{24}$/i.test(str)) return str;
      }
      return null;
    })
    .filter(Boolean) as string[];
}
