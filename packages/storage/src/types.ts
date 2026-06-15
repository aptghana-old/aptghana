export type StorageBucket = "aptghana-assets";

export type AssetFolder =
  | "products"
  | "brands"
  | "categories"
  | "datasheets"
  | "manuals"
  | "certificates"
  | "rfq-attachments"
  | "avatars/users"
  | "avatars/admins"
  | "homepage"
  | "marketing"
  | "videos";

export interface UploadOptions {
  /** Destination folder within the bucket */
  folder: AssetFolder;
  /** Force a specific object key. Defaults to {folder}/{uuid}-{filename} */
  key?: string;
  /** Cache-Control header value. Defaults to 'public, max-age=31536000, immutable' for assets */
  cacheControl?: string;
  /** Content-Disposition header */
  contentDisposition?: string;
  /** Extra metadata stored with the object */
  metadata?: Record<string, string>;
  /** Bucket name. Defaults to STORAGE_BUCKET env var or 'aptghana-assets' */
  bucket?: StorageBucket;
}

export interface UploadResult {
  /** The full S3 object key (e.g. "products/slug/main-abc123.jpg") */
  key: string;
  /** Public URL to access the asset */
  url: string;
  /** Bucket the object was stored in */
  bucket: StorageBucket;
  /** File size in bytes */
  size: number;
  /** Content type */
  contentType: string;
  /** ETag from S3 */
  etag?: string;
}

export interface PresignedUploadResult {
  /** URL to PUT the file to */
  uploadUrl: string;
  /** The object key that will be used */
  key: string;
  /** The final public URL of the asset once uploaded */
  publicUrl: string;
  /** Unix timestamp (ms) when the presigned URL expires */
  expiresAt: number;
}

export interface DeleteOptions {
  bucket?: StorageBucket;
}

export interface ListOptions {
  prefix?: string;
  maxKeys?: number;
  bucket?: StorageBucket;
}

export interface StorageObject {
  key: string;
  size: number;
  lastModified: Date;
  url: string;
}
