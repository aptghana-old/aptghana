import { MeiliSearch } from "meilisearch";

let _client: MeiliSearch | null = null;

export function getMeilisearchClient(): MeiliSearch {
  if (!_client) {
    _client = new MeiliSearch({
      host: process.env.MEILISEARCH_HOST ?? "http://localhost:7700",
      apiKey: process.env.MEILISEARCH_API_KEY ?? "",
    });
  }
  return _client;
}

export const INDEXES = {
  PRODUCTS: "products",
  BRANDS: "brands",
  CATEGORIES: "categories",
  ARTICLES: "articles",
  DOCUMENTS: "documents",
  ASSETS: "assets",
} as const;
