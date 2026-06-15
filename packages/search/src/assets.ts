import { getMeilisearchClient, INDEXES } from "./client";

// Local shape matching AssetDocument from @apt/db — avoids circular dependency
interface AssetLike {
  _id: { toString(): string } | string;
  key: string;
  url: string;
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  folder: string;
  tags: string[];
  altText?: string;
  description?: string;
  status: string;
  uploadedBy?: string;
  isFavorite: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface AssetSearchRecord {
  id: string;
  key: string;
  url: string;
  filename: string;
  originalName: string;
  mimetype: string;
  mediaType: string;
  size: number;
  folder: string;
  tags: string[];
  altText: string;
  description: string;
  status: string;
  uploadedBy: string;
  isFavorite: boolean;
  createdAt: number;
  updatedAt: number;
}

export function getMediaType(mimetype: string): string {
  if (mimetype === "image/svg+xml")   return "svg";
  if (mimetype.startsWith("image/"))  return "image";
  if (mimetype.startsWith("video/"))  return "video";
  if (mimetype.startsWith("audio/"))  return "audio";
  if (mimetype === "application/pdf") return "pdf";
  if (mimetype.includes("spreadsheetml") || mimetype.includes("vnd.ms-excel") || mimetype === "text/csv") return "spreadsheet";
  if (mimetype.includes("wordprocessingml") || mimetype.includes("msword")) return "document";
  if (mimetype.includes("zip") || mimetype.includes("tar") || mimetype.includes("compressed")) return "archive";
  return "file";
}

export function buildAssetRecord(asset: AssetLike): AssetSearchRecord {
  const id = typeof asset._id === "string" ? asset._id : asset._id.toString();
  return {
    id,
    key:          asset.key,
    url:          asset.url,
    filename:     asset.filename,
    originalName: asset.originalName,
    mimetype:     asset.mimetype,
    mediaType:    getMediaType(asset.mimetype),
    size:         asset.size,
    folder:       asset.folder,
    tags:         asset.tags ?? [],
    altText:      asset.altText ?? "",
    description:  asset.description ?? "",
    status:       asset.status,
    uploadedBy:   asset.uploadedBy ?? "",
    isFavorite:   asset.isFavorite,
    createdAt:    new Date(asset.createdAt as string).getTime(),
    updatedAt:    new Date(asset.updatedAt as string).getTime(),
  };
}

export async function indexAsset(asset: AssetLike): Promise<void> {
  try {
    const client = getMeilisearchClient();
    const index  = client.index(INDEXES.ASSETS);
    await index.addDocuments([buildAssetRecord(asset)]);
  } catch {
    // Non-fatal — search index may lag behind
  }
}

export async function indexAssets(assets: AssetLike[]): Promise<void> {
  if (assets.length === 0) return;
  try {
    const client  = getMeilisearchClient();
    const index   = client.index(INDEXES.ASSETS);
    await index.addDocuments(assets.map(buildAssetRecord));
  } catch {
    // Non-fatal
  }
}

export async function removeAssetFromIndex(id: string): Promise<void> {
  try {
    const client = getMeilisearchClient();
    const index  = client.index(INDEXES.ASSETS);
    await index.deleteDocument(id);
  } catch {
    // Non-fatal
  }
}

export async function searchAssets(
  query: string,
  options: {
    folder?: string;
    mediaType?: string;
    tags?: string[];
    status?: string;
    isFavorite?: boolean;
    uploadedBy?: string;
    page?: number;
    limit?: number;
    sort?: string;
  } = {},
) {
  const client  = getMeilisearchClient();
  const index   = client.index(INDEXES.ASSETS);

  const filterParts: string[] = [`status = "${options.status ?? "active"}"`];
  if (options.folder)     filterParts.push(`folder = "${options.folder.replace(/"/g, '\\"')}"`);
  if (options.mediaType)  filterParts.push(`mediaType = "${options.mediaType}"`);
  if (options.isFavorite) filterParts.push(`isFavorite = true`);
  if (options.uploadedBy) filterParts.push(`uploadedBy = "${options.uploadedBy}"`);
  if (options.tags?.length) {
    filterParts.push(`tags IN [${options.tags.map((t) => `"${t.replace(/"/g, '\\"')}"`).join(", ")}]`);
  }

  const limit  = options.limit ?? 50;
  const offset = ((options.page ?? 1) - 1) * limit;

  const sortArr: string[] = [];
  if (options.sort === "oldest")    sortArr.push("createdAt:asc");
  else if (options.sort === "name") sortArr.push("filename:asc");
  else if (options.sort === "size") sortArr.push("size:desc");
  else                              sortArr.push("createdAt:desc");

  return index.search(query, {
    filter:                filterParts.join(" AND "),
    limit,
    offset,
    facets:                ["mediaType", "folder", "tags", "uploadedBy"],
    attributesToHighlight: ["filename", "originalName", "description", "altText", "tags"],
    highlightPreTag:       "<mark>",
    highlightPostTag:      "</mark>",
    sort:                  sortArr,
  });
}

export async function setupAssetsIndex(): Promise<void> {
  try {
    const client = getMeilisearchClient();
    const index  = client.index(INDEXES.ASSETS);
    await index.updateSettings({
      searchableAttributes: ["filename", "originalName", "tags", "folder", "altText", "description", "uploadedBy"],
      filterableAttributes: ["mediaType", "folder", "tags", "status", "mimetype", "isFavorite", "uploadedBy"],
      sortableAttributes:   ["createdAt", "updatedAt", "size", "filename"],
      rankingRules:         ["words", "typo", "proximity", "attribute", "sort", "exactness"],
    });
  } catch {
    // Non-fatal
  }
}
