import { S3Client } from "@aws-sdk/client-s3";

let _client: S3Client | null = null;

export function getStorageClient(): S3Client {
  if (_client) return _client;

  const endpoint = process.env.STORAGE_ENDPOINT;
  const region   = process.env.STORAGE_REGION   ?? "us-east-1";
  const accessKey = process.env.STORAGE_ACCESS_KEY;
  const secretKey = process.env.STORAGE_SECRET_KEY;

  if (!endpoint) throw new Error("STORAGE_ENDPOINT environment variable is not set");
  if (!accessKey) throw new Error("STORAGE_ACCESS_KEY environment variable is not set");
  if (!secretKey) throw new Error("STORAGE_SECRET_KEY environment variable is not set");

  _client = new S3Client({
    endpoint,
    region,
    credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
    // Required for MinIO path-style addressing
    forcePathStyle: true,
  });

  return _client;
}

export function getDefaultBucket(): string {
  return process.env.STORAGE_BUCKET ?? "aptghana-assets";
}

export function getPublicBaseUrl(): string {
  const url = process.env.STORAGE_PUBLIC_URL;
  if (!url) throw new Error("STORAGE_PUBLIC_URL environment variable is not set");
  return url.replace(/\/$/, "");
}

/** Reset client (for testing or config changes at runtime) */
export function resetStorageClient(): void {
  _client = null;
}
