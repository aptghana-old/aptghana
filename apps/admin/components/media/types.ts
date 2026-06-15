export type MediaType = "image" | "svg" | "video" | "audio" | "pdf" | "document" | "spreadsheet" | "archive" | "file";
export type AssetStatus = "active" | "archived" | "pending";
export type ViewMode = "grid" | "list" | "compact";
export type SortOption = "newest" | "oldest" | "name" | "size" | "popular";

export interface Asset {
  _id: string;
  key: string;
  url: string;
  filename: string;
  originalName: string;
  mimetype: string;
  mediaType: MediaType;
  size: number;
  width?: number;
  height?: number;
  duration?: number;
  pageCount?: number;
  folder: string;
  tags: string[];
  altText?: string;
  description?: string;
  thumbnails?: { small?: string; medium?: string; large?: string };
  usedIn: Array<{ type: string; entityId: string; entityName: string; field: string }>;
  uploadedBy?: string;
  status: AssetStatus;
  isFavorite: boolean;
  downloadCount: number;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface FolderNode {
  path: string;
  name: string;
  count: number;
  bytes: number;
  children: FolderNode[];
}

export interface UploadItem {
  id: string;
  file: File;
  folder: string;
  tags: string[];
  altText: string;
  progress: number;
  status: "queued" | "reading" | "uploading" | "done" | "error";
  error?: string;
  asset?: Asset;
  width?: number;
  height?: number;
  xhr?: XMLHttpRequest;
}

export interface MediaFilters {
  query: string;
  folder: string | null;
  mediaType: string | null;
  tags: string[];
  status: AssetStatus;
  favorites: boolean;
  sort: SortOption;
}

export interface MediaStats {
  total: number;
  totalBytes: number;
  byType: Record<string, { count: number; bytes: number }>;
  byFolder: Array<{ folder: string; count: number; bytes: number }>;
  byDay: Array<{ date: string; count: number; bytes: number }>;
  recent: Asset[];
  mostUsed: Asset[];
}

export const MEDIA_TYPE_LABELS: Record<string, string> = {
  image:       "Images",
  svg:         "SVG",
  video:       "Videos",
  audio:       "Audio",
  pdf:         "PDFs",
  document:    "Documents",
  spreadsheet: "Spreadsheets",
  archive:     "Archives",
  file:        "Other Files",
};

export const MEDIA_TYPE_COLORS: Record<string, string> = {
  image:       "#0284c7",
  svg:         "#7c3aed",
  video:       "#dc2626",
  audio:       "#d97706",
  pdf:         "#dc2626",
  document:    "#1d4ed8",
  spreadsheet: "#15803d",
  archive:     "#b45309",
  file:        "#64748b",
};

export const FOLDER_ICONS: Record<string, string> = {
  products:    "📦",
  brands:      "🏷️",
  categories:  "📂",
  datasheets:  "📄",
  manuals:     "📚",
  videos:      "🎬",
  marketing:   "📢",
  certificates:"🏆",
  homepage:    "🏠",
  avatars:     "👤",
  default:     "📁",
};
