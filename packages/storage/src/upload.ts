import {
  PutObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  HeadObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  CopyObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";
import { getStorageClient, getDefaultBucket, getPublicBaseUrl } from "./client";
import type {
  UploadOptions,
  UploadResult,
  PresignedUploadResult,
  DeleteOptions,
  ListOptions,
  StorageObject,
  StorageBucket,
} from "./types";

// ─── Upload ───────────────────────────────────────────────────────────────────

/**
 * Upload a file buffer or stream to object storage.
 * Returns the full public URL and object key.
 */
export async function uploadFile(
  data: Buffer | Uint8Array | ReadableStream,
  filename: string,
  contentType: string,
  options: UploadOptions,
): Promise<UploadResult> {
  const client = getStorageClient();
  const bucket = options.bucket ?? (getDefaultBucket() as StorageBucket);
  const key    = options.key ?? buildKey(options.folder, filename);
  const size   = data instanceof Buffer || data instanceof Uint8Array ? data.byteLength : 0;

  const cmd = new PutObjectCommand({
    Bucket:             bucket,
    Key:                key,
    Body:               data,
    ContentType:        contentType,
    CacheControl:       options.cacheControl ?? "public, max-age=31536000, immutable",
    ContentDisposition: options.contentDisposition,
    Metadata:           options.metadata,
  });

  const response = await client.send(cmd);

  return {
    key,
    url:         `${getPublicBaseUrl()}/${key}`,
    bucket,
    size,
    contentType,
    ...(response.ETag ? { etag: response.ETag.replace(/"/g, "") } : {}),
  };
}

/**
 * Generate a presigned PUT URL for direct client-side upload.
 * The browser/client uploads directly to MinIO without going through the app server.
 */
export async function createPresignedUpload(
  filename: string,
  contentType: string,
  options: UploadOptions,
  expiresInSeconds = 900, // 15 minutes
): Promise<PresignedUploadResult> {
  const client = getStorageClient();
  const bucket = options.bucket ?? (getDefaultBucket() as StorageBucket);
  const key    = options.key ?? buildKey(options.folder, filename);

  const cmd = new PutObjectCommand({
    Bucket:      bucket,
    Key:         key,
    ContentType: contentType,
    Metadata:    options.metadata,
  });

  const uploadUrl = await getSignedUrl(client, cmd, { expiresIn: expiresInSeconds });

  return {
    uploadUrl,
    key,
    publicUrl:  `${getPublicBaseUrl()}/${key}`,
    expiresAt:  Date.now() + expiresInSeconds * 1000,
  };
}

/**
 * Generate a presigned GET URL for private/signed object access.
 * Use this for rfq-attachments and other non-public assets.
 */
export async function createPresignedDownload(
  key: string,
  expiresInSeconds = 3600,
  options: DeleteOptions = {},
): Promise<string> {
  const client = getStorageClient();
  const bucket = options.bucket ?? (getDefaultBucket() as StorageBucket);

  const cmd = new GetObjectCommand({ Bucket: bucket, Key: key });
  return getSignedUrl(client, cmd, { expiresIn: expiresInSeconds });
}

// ─── Delete ───────────────────────────────────────────────────────────────────

export async function deleteFile(key: string, options: DeleteOptions = {}): Promise<void> {
  const client = getStorageClient();
  const bucket = options.bucket ?? (getDefaultBucket() as StorageBucket);

  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}

export async function deleteFiles(keys: string[], options: DeleteOptions = {}): Promise<void> {
  if (keys.length === 0) return;
  const client = getStorageClient();
  const bucket = options.bucket ?? (getDefaultBucket() as StorageBucket);

  // S3 DeleteObjects supports up to 1000 keys per request
  for (let i = 0; i < keys.length; i += 1000) {
    const batch = keys.slice(i, i + 1000);
    await client.send(new DeleteObjectsCommand({
      Bucket:  bucket,
      Delete: { Objects: batch.map((k) => ({ Key: k })) },
    }));
  }
}

// ─── Exists / Metadata ────────────────────────────────────────────────────────

export async function fileExists(key: string, options: DeleteOptions = {}): Promise<boolean> {
  const client = getStorageClient();
  const bucket = options.bucket ?? (getDefaultBucket() as StorageBucket);
  try {
    await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return true;
  } catch {
    return false;
  }
}

// ─── List ─────────────────────────────────────────────────────────────────────

export async function listFiles(options: ListOptions = {}): Promise<StorageObject[]> {
  const client = getStorageClient();
  const bucket = options.bucket ?? (getDefaultBucket() as StorageBucket);
  const baseUrl = getPublicBaseUrl();

  const result = await client.send(new ListObjectsV2Command({
    Bucket:  bucket,
    Prefix:  options.prefix,
    MaxKeys: options.maxKeys ?? 1000,
  }));

  return (result.Contents ?? []).map((obj) => ({
    key:          obj.Key ?? "",
    size:         obj.Size ?? 0,
    lastModified: obj.LastModified ?? new Date(),
    url:          `${baseUrl}/${obj.Key}`,
  }));
}

// ─── Copy ─────────────────────────────────────────────────────────────────────

export async function copyFile(
  sourceKey: string,
  destKey: string,
  options: DeleteOptions = {},
): Promise<void> {
  const client = getStorageClient();
  const bucket = options.bucket ?? (getDefaultBucket() as StorageBucket);

  await client.send(new CopyObjectCommand({
    Bucket:     bucket,
    CopySource: `${bucket}/${sourceKey}`,
    Key:        destKey,
  }));
}

// ─── URL helpers ─────────────────────────────────────────────────────────────

export function keyToUrl(key: string): string {
  return `${getPublicBaseUrl()}/${key}`;
}

export function urlToKey(url: string): string | null {
  const base = getPublicBaseUrl();
  if (!url.startsWith(base)) return null;
  return url.slice(base.length + 1); // strip trailing slash
}

// ─── Internal ────────────────────────────────────────────────────────────────

function buildKey(folder: string, filename: string): string {
  const ext   = filename.includes(".") ? filename.slice(filename.lastIndexOf(".")) : "";
  const safe  = filename
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 100);
  return `${folder}/${randomUUID()}-${safe}${ext ? "" : ext}`;
}
