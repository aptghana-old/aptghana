import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { connectDB, AssetModel } from "@apt/db";
import {
  uploadFile,
  sanitizeFilename,
  formatBytes,
  isImageMime,
  isVideoMime,
  isDocumentMime,
  ALLOWED_IMAGE_TYPES,
  ALLOWED_DOCUMENT_TYPES,
  ALLOWED_VIDEO_TYPES,
  MAX_IMAGE_SIZE,
  MAX_DOCUMENT_SIZE,
  MAX_VIDEO_SIZE,
} from "@apt/storage";
import { indexAsset, setupAssetsIndex } from "@apt/search";
import { requirePermission } from "@/lib/auth/require";

const MAGIC_BYTES: { mime: string; bytes: number[] }[] = [
  { mime: "image/jpeg",    bytes: [0xFF, 0xD8, 0xFF] },
  { mime: "image/png",     bytes: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A] },
  { mime: "image/gif",     bytes: [0x47, 0x49, 0x46, 0x38] },
  { mime: "image/webp",    bytes: [0x52, 0x49, 0x46, 0x46] },
  { mime: "application/pdf", bytes: [0x25, 0x50, 0x44, 0x46] },
];

function checkMagicBytes(buf: Buffer, declaredMime: string): boolean {
  const entry = MAGIC_BYTES.find((m) => m.mime === declaredMime);
  if (!entry) return true;
  return entry.bytes.every((b, i) => buf[i] === b);
}

const ALL_ALLOWED = new Set([
  ...ALLOWED_IMAGE_TYPES,
  ...ALLOWED_DOCUMENT_TYPES,
  ...ALLOWED_VIDEO_TYPES,
  "image/avif",
  "image/bmp",
  "image/tiff",
  "image/heic",
  "image/heif",
  "application/zip",
  "application/x-zip-compressed",
  "text/plain",
]);

function getMaxSize(mimetype: string): number {
  if (isVideoMime(mimetype)) return MAX_VIDEO_SIZE;
  if (isDocumentMime(mimetype)) return MAX_DOCUMENT_SIZE;
  return MAX_IMAGE_SIZE;
}

function buildFolder(rawFolder: string): string {
  return rawFolder
    .toLowerCase()
    .replace(/[^a-z0-9/_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 100) || "uncategorized";
}

export async function POST(req: Request) {
  const deny = await requirePermission('media:upload');
  if (deny) return deny;
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart/form-data" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (file.size === 0) {
    return NextResponse.json({ error: "File is empty" }, { status: 400 });
  }

  const mimetype = file.type || "application/octet-stream";
  const maxSize  = getMaxSize(mimetype);

  if (file.size > maxSize) {
    return NextResponse.json(
      { error: `File too large (max ${formatBytes(maxSize)})` },
      { status: 413 },
    );
  }

  const rawFolder   = (form.get("folder") as string | null)      ?? "uncategorized";
  const tags        = JSON.parse((form.get("tags") as string | null) ?? "[]") as string[];
  const altText     = (form.get("altText") as string | null)     ?? "";
  const description = (form.get("description") as string | null) ?? "";
  const uploadedBy  = (form.get("uploadedBy") as string | null)  ?? "";
  const width       = Number(form.get("width"))  || undefined;
  const height      = Number(form.get("height")) || undefined;
  const duration    = Number(form.get("duration")) || undefined;
  const pageCount   = Number(form.get("pageCount")) || undefined;

  const folder    = buildFolder(rawFolder);
  const safe      = sanitizeFilename(file.name);
  const uuid      = randomUUID().slice(0, 8);
  const key       = `${folder}/${uuid}-${safe}`;

  try {
    const buffer = Buffer.from(await file.arrayBuffer());

    if (!checkMagicBytes(buffer, mimetype)) {
      return NextResponse.json({ error: "File content does not match declared type" }, { status: 415 });
    }

    const result = await uploadFile(buffer, safe, mimetype, {
      folder:   folder as never, // media library allows free-form folders
      key,
      metadata: { folder, uploadedBy },
    });

    await connectDB();

    const asset = await AssetModel.create({
      key:          result.key,
      url:          result.url,
      filename:     safe,
      originalName: file.name,
      mimetype,
      size:         result.size || buffer.byteLength,
      width,
      height,
      duration,
      pageCount,
      folder,
      tags:         tags.filter(Boolean),
      altText,
      description,
      uploadedBy,
      status:       "active",
    });

    // Index in Meilisearch (non-fatal)
    void setupAssetsIndex().then(() => indexAsset(asset));

    return NextResponse.json({ ok: true, asset: serializeAsset(asset) }, { status: 201 });
  } catch (err) {
    console.error("[assets/upload]", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

function serializeAsset(doc: Record<string, unknown>): Record<string, unknown> {
  return JSON.parse(JSON.stringify(doc));
}
