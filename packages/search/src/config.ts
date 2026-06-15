import type { MeiliSettings } from "@apt/types";
import { getMeilisearchClient, INDEXES } from "./client";
import { applySettingsToIndex } from "./apply";

// ─── Default configs (used as seeds when no DB config exists) ────────────────

export const DEFAULT_PRODUCTS_SETTINGS: MeiliSettings = {
  searchableAttributes: [
    "name",
    "mpn",
    "sku",
    "shortDescription",
    "brandName",
    "brandSlug",
    "tags",
    "filterTags",
    "applications",
    "features",
    "certifications",
  ],
  filterableAttributes: [
    "id",
    "brandSlug",
    "listPrice",
    "categories",
    "hierarchicalCategories.lvl0",
    "hierarchicalCategories.lvl1",
    "hierarchicalCategories.lvl2",
    "hierarchicalCategories.lvl3",
    "tags",
    "specValues",
    "status",
    "inStock",
    "isClearance",
    "isFeatured",
    "discount",
    "currency",
  ],
  sortableAttributes: [
    "listPrice",
    "name",
    "views",
    "salesCount",
    "relevanceScore",
    "createdAt",
  ],
  rankingRules: [
    "relevanceScore:desc",
    "words",
    "typo",
    "proximity",
    "attribute",
    "sort",
    "exactness",
  ],
  synonyms: {
    vfd:              ["variable frequency drive", "drive", "inverter", "ac drive"],
    plc:              ["programmable logic controller", "controller"],
    hmi:              ["human machine interface", "panel", "display"],
    mcb:              ["miniature circuit breaker", "circuit breaker"],
    mccb:             ["molded case circuit breaker", "circuit breaker"],
    acb:              ["air circuit breaker", "circuit breaker"],
    ups:              ["uninterruptible power supply", "power backup"],
    scada:            ["supervisory control"],
    "circuit breaker": ["mcb", "mccb", "acb", "rcbo", "rccb"],
    motor:            ["electric motor", "ac motor", "dc motor", "servo motor"],
    sensor:           ["proximity sensor", "photoelectric sensor", "pressure sensor"],
    relay:            ["contactor", "overload relay"],
    cable:            ["wire", "conductor", "power cable"],
    vsd:              ["variable speed drive", "vfd", "inverter"],
    contactor:        ["magnetic contactor", "relay", "ac contactor"],
  },
  stopWords:         [],
  distinctAttribute: "sku",
  typoTolerance: {
    enabled: true,
    minWordSizeForTypos: { oneTypo: 4, twoTypos: 8 },
    disableOnWords: [],
    disableOnAttributes: [],
  },
  faceting:   { maxValuesPerFacet: 500 },
  pagination: { maxTotalHits: 10000 },
  dictionary:          [],
  separatorTokens:     [],
  nonSeparatorTokens:  [],
};

export const DEFAULT_ASSETS_SETTINGS: MeiliSettings = {
  searchableAttributes: [
    "filename",
    "originalName",
    "tags",
    "folder",
    "altText",
    "description",
    "uploadedBy",
  ],
  filterableAttributes: [
    "mediaType",
    "folder",
    "tags",
    "status",
    "mimetype",
    "isFavorite",
    "uploadedBy",
  ],
  sortableAttributes: ["createdAt", "updatedAt", "size", "filename"],
  rankingRules: ["words", "typo", "proximity", "attribute", "sort", "exactness"],
  synonyms:          {},
  stopWords:         [],
  distinctAttribute: null,
  typoTolerance: {
    enabled: true,
    minWordSizeForTypos: { oneTypo: 4, twoTypos: 8 },
    disableOnWords: [],
    disableOnAttributes: [],
  },
  faceting:   { maxValuesPerFacet: 100 },
  pagination: { maxTotalHits: 5000 },
  dictionary:          [],
  separatorTokens:     [],
  nonSeparatorTokens:  [],
};

export const DEFAULT_SETTINGS_BY_INDEX: Partial<Record<string, MeiliSettings>> = {
  [INDEXES.PRODUCTS]:   DEFAULT_PRODUCTS_SETTINGS,
  [INDEXES.ASSETS]:     DEFAULT_ASSETS_SETTINGS,
};

// ─── Config application ───────────────────────────────────────────────────────

export async function configureProductsIndex(settings?: MeiliSettings): Promise<void> {
  await applySettingsToIndex(
    INDEXES.PRODUCTS,
    settings ?? DEFAULT_PRODUCTS_SETTINGS,
  );
}

export async function configureSynonyms(
  synonyms?: Record<string, string[]>,
): Promise<void> {
  const client = getMeilisearchClient();
  const index  = client.index(INDEXES.PRODUCTS);
  await index.updateSynonyms(synonyms ?? DEFAULT_PRODUCTS_SETTINGS.synonyms);
}

/** Called by the reindex route. Accepts an optional DB-sourced config; falls back to defaults. */
export async function initializeSearchIndexes(
  productsSettings?: MeiliSettings,
): Promise<void> {
  await configureProductsIndex(productsSettings);
  console.log("Search indexes configured successfully");
}
