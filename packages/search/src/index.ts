export { getMeilisearchClient, INDEXES } from "./client";
export {
  getMediaType,
  buildAssetRecord,
  indexAsset,
  indexAssets,
  removeAssetFromIndex,
  searchAssets,
  setupAssetsIndex,
  type AssetSearchRecord,
} from "./assets";
export { applySettingsToIndex, getLiveSettings } from "./apply";
export {
  configureProductsIndex,
  configureSynonyms,
  initializeSearchIndexes,
  DEFAULT_PRODUCTS_SETTINGS,
  DEFAULT_ASSETS_SETTINGS,
  DEFAULT_SETTINGS_BY_INDEX,
} from "./config";
export {
  buildProductRecord,
  upsertProductRecord,
  removeProductRecord,
  extractCategoryIds,
  type CategoryForIndex,
  type ProductForIndex,
} from "./indexer";

import { getMeilisearchClient, INDEXES } from "./client";
import type { SearchResult, SearchFilters } from "@apt/types";

// ─── Types ────────────────────────────────────────────────────────────────────

export type SearchSort = "relevance" | "price_asc" | "price_desc" | "name_asc";

const SORT_MAP: Record<Exclude<SearchSort, "relevance">, string> = {
  price_asc:  "listPrice:asc",
  price_desc: "listPrice:desc",
  name_asc:   "name:asc",
};

export interface AutocompleteSuggestion {
  type: "product" | "brand" | "category";
  id: string;
  label: string;
  meta?: string;
  href: string;
  imageUrl?: string;
}

export interface AutocompleteResult {
  products:   AutocompleteSuggestion[];
  brands:     AutocompleteSuggestion[];
  categories: AutocompleteSuggestion[];
}

export interface ProductSearchHit {
  id: string;
  sku: string;
  mpn: string;
  name: string;
  shortDescription: string;
  brandSlug: string;
  brandName: string;
  imageUrl: string;
  listPrice: number;
  currency: string;
  inStock: boolean;
  isNew: boolean;
  isClearance: boolean;
  isFeatured: boolean;
  discount: number;
  categories: string[];
  hierarchicalCategories: {
    lvl0?: string;
    lvl1?: string;
    lvl2?: string;
    lvl3?: string;
  };
  tags: string[];
  /** Flattened tags + features + applications — used for filter display on cards */
  filterTags?: string[];
  relevanceScore: number;
  salesCount: number;
}

// ─── Search ───────────────────────────────────────────────────────────────────

export async function searchProducts(
  query: string,
  filters: SearchFilters = {},
  page = 1,
  limit = 24,
  sort: SearchSort = "relevance",
): Promise<SearchResult<ProductSearchHit>> {
  const client = getMeilisearchClient();
  const index  = client.index(INDEXES.PRODUCTS);

  const filterParts: string[] = [];

  if (filters.brands?.length) {
    filterParts.push(
      `brandSlug IN [${filters.brands.map((b) => `"${b}"`).join(", ")}]`,
    );
  }
  if (filters.categories?.length) {
    filterParts.push(
      `categories IN [${filters.categories.map((c) => `"${c}"`).join(", ")}]`,
    );
  }
  if (filters.priceMin !== undefined) {
    filterParts.push(`listPrice >= ${filters.priceMin}`);
  }
  if (filters.priceMax !== undefined) {
    filterParts.push(`listPrice <= ${filters.priceMax}`);
  }
  if (filters.inStock)     filterParts.push("inStock = true");
  if (filters.isClearance) filterParts.push("isClearance = true");
  if (filters.tags?.length) {
    filterParts.push(
      `tags IN [${filters.tags.map((t) => `"${t}"`).join(", ")}]`,
    );
  }
  if (filters.specs?.length) {
    // Each spec filter is AND'd: every selected spec must match
    for (const sv of filters.specs) {
      filterParts.push(`specValues = "${sv.replace(/"/g, '\\"')}"`);
    }
  }
  filterParts.push("status = active");

  const result = await index.search<ProductSearchHit>(query, {
    offset: (page - 1) * limit,
    limit,
    filter: filterParts.length ? filterParts.join(" AND ") : undefined,
    sort:   sort !== "relevance" ? [SORT_MAP[sort]] : undefined,
    facets: [
      "brandSlug",
      "hierarchicalCategories.lvl0",
      "hierarchicalCategories.lvl1",
      "hierarchicalCategories.lvl2",
      "inStock",
      "isClearance",
      "specValues",
    ],
    attributesToHighlight: ["name", "mpn", "shortDescription"],
    highlightPreTag:  "<mark>",
    highlightPostTag: "</mark>",
    showRankingScore: false,
  });

  return {
    hits:             result.hits,
    totalHits:        result.estimatedTotalHits ?? 0,
    page,
    totalPages:       Math.ceil((result.estimatedTotalHits ?? 0) / limit),
    processingTimeMs: result.processingTimeMs,
    query,
    facets:           result.facetDistribution,
  };
}

// ─── Related products ─────────────────────────────────────────────────────────

export async function getRelatedProducts(
  excludeId: string,
  brandSlug: string,
  categoryNames: string[],
  limit = 6,
): Promise<ProductSearchHit[]> {
  const client = getMeilisearchClient();
  const index  = client.index(INDEXES.PRODUCTS);

  const filterParts = ["status = active", `id != "${excludeId}"`];

  if (brandSlug) {
    filterParts.push(`brandSlug = "${brandSlug}"`);
  }

  const result = await index.search<ProductSearchHit>("", {
    limit,
    filter: filterParts.join(" AND "),
    sort:   ["relevanceScore:desc"],
  });

  if (result.hits.length >= limit) return result.hits;

  if (categoryNames.length) {
    const catFilter = [
      "status = active",
      `id != "${excludeId}"`,
      `categories IN [${categoryNames.map((c) => `"${c}"`).join(", ")}]`,
    ];
    const fallback = await index.search<ProductSearchHit>("", {
      limit,
      filter: catFilter.join(" AND "),
      sort:   ["relevanceScore:desc"],
    });
    return fallback.hits;
  }

  return result.hits;
}

// ─── Autocomplete ─────────────────────────────────────────────────────────────

// ─── Shared brand/category extraction helpers ─────────────────────────────────

function extractBrands(
  hits: ProductSearchHit[],
  facets: Record<string, Record<string, number>> | undefined,
  max = 3,
): AutocompleteSuggestion[] {
  const seen = new Map<string, AutocompleteSuggestion>();
  for (const h of hits) {
    if (!seen.has(h.brandSlug)) {
      const count = facets?.brandSlug?.[h.brandSlug];
      seen.set(h.brandSlug, {
        type:  "brand",
        id:    h.brandSlug,
        label: h.brandName || slugToName(h.brandSlug),
        meta:  count ? `${count} products` : undefined,
        href:  `/brands/${h.brandSlug}`,
      });
    }
  }
  return Array.from(seen.values()).slice(0, max);
}

function extractCategories(
  hits: ProductSearchHit[],
  facets: Record<string, Record<string, number>> | undefined,
  query: string,
  max = 3,
): AutocompleteSuggestion[] {
  const seen = new Map<string, AutocompleteSuggestion>();
  for (const h of hits) {
    const cat = h.hierarchicalCategories?.lvl0;
    if (cat && !seen.has(cat)) {
      const count = facets?.["hierarchicalCategories.lvl0"]?.[cat];
      seen.set(cat, {
        type:  "category",
        id:    cat,
        label: cat,
        meta:  count ? `${count} products` : undefined,
        href:  `/search?cats=${encodeURIComponent(cat)}&q=${encodeURIComponent(query.trim())}`,
      });
    }
  }
  return Array.from(seen.values()).slice(0, max);
}

// ─── Rich product autocomplete (returns full ProductSearchHit records) ─────────

export interface ProductAutocompleteResult {
  products:   ProductSearchHit[];
  brands:     AutocompleteSuggestion[];
  categories: AutocompleteSuggestion[];
  totalHits:  number;
}

export async function getProductAutocomplete(
  query: string,
  limit = 10,
): Promise<ProductAutocompleteResult> {
  if (!query || query.trim().length < 2) {
    return { products: [], brands: [], categories: [], totalHits: 0 };
  }

  const result = await searchProducts(query.trim(), {}, 1, limit);

  return {
    products:   result.hits.slice(0, limit),
    brands:     extractBrands(result.hits, result.facets),
    categories: extractCategories(result.hits, result.facets, query),
    totalHits:  result.totalHits,
  };
}

// ─── Legacy suggestion shape (kept for backward compatibility) ─────────────────

export async function getAutocompleteSuggestions(
  query: string,
  limit = 6,
): Promise<AutocompleteResult> {
  if (!query || query.trim().length < 2) {
    return { products: [], brands: [], categories: [] };
  }

  const result = await searchProducts(query.trim(), {}, 1, limit);

  const products: AutocompleteSuggestion[] = result.hits.slice(0, limit).map((h) => ({
    type:     "product" as const,
    id:       h.id,
    label:    h.name,
    meta:     h.brandName || slugToName(h.brandSlug),
    href:     `/products/${h.sku.toLowerCase()}`,
    imageUrl: h.imageUrl || undefined,
  }));

  return {
    products,
    brands:     extractBrands(result.hits, result.facets),
    categories: extractCategories(result.hits, result.facets, query),
  };
}

export async function getSearchSuggestions(query: string, limit = 5): Promise<string[]> {
  if (!query || query.length < 2) return [];
  const result = await searchProducts(query, {}, 1, limit);
  return result.hits.map((h) => h.name).slice(0, limit);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function slugToName(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
