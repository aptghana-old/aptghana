import { NextResponse } from "next/server";
import {
  uploadFile,
  createPresignedUpload,
  deleteFile,
  validateUpload,
  ALLOWED_IMAGE_TYPES,
  ALLOWED_DOCUMENT_TYPES,
  ALLOWED_VIDEO_TYPES,
  MAX_IMAGE_SIZE,
  MAX_DOCUMENT_SIZE,
  MAX_VIDEO_SIZE,
} from "@apt/storage";
import type { AssetFolder } from "@apt/storage";
import { requireAdmin } from "@/lib/auth/require";

const MAGIC_BYTES: { mime: string; bytes: number[] }[] = [
  { mime: "image/jpeg",    bytes: [0xFF, 0xD8, 0xFF] },
  { mime: "image/png",     bytes: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A] },
  { mime: "image/gif",     bytes: [0x47, 0x49, 0x46, 0x38] },
  { mime: "image/webp",    bytes: [0x52, 0x49, 0x46, 0x46] },
  { mime: "application/pdf", bytes: [0x25, 0x50, 0x44, 0x46] },
];

function checkMagicBytes(buf: Buffer, declaredMime: string): boolean {
  const entry = MAGIC_BYTES.find((m) => m.mime === declaredMime);
  if (!entry) return true; // No signature known for this type — allow through
  return entry.bytes.every((b, i) => buf[i] === b);
}

const FOLDER_MAP: Record<string, AssetFolder> = {
  product:    "products",
  brand:      "brands",
  category:   "categories",
  datasheet:  "datasheets",
  manual:     "manuals",
  certificate:"certificates",
  video:      "videos",
  homepage:   "homepage",
  marketing:  "marketing",
  avatar:     "avatars/admins",
};

const MAX_SIZE_MAP: Record<string, number> = {
  image:    MAX_IMAGE_SIZE,
  document: MAX_DOCUMENT_SIZE,
  video:    MAX_VIDEO_SIZE,
};

const ALLOWED_TYPES_MAP = {
  image:    ALLOWED_IMAGE_TYPES,
  document: ALLOWED_DOCUMENT_TYPES,
  video:    ALLOWED_VIDEO_TYPES,
};

/**
 * POST /api/upload
 * Upload a file to MinIO. Admin only.
 *
 * Body (multipart form):
 *   file     — the file to upload
 *   context  — one of: product | brand | category | datasheet | manual | certificate | video | homepage | marketing | avatar
 *   type     — one of: image | document | video  (defaults to image)
 *   slug     — optional entity slug for deterministic key (e.g. brand slug)
 *
 * Returns:
 *   { ok: true, key, url, size, contentType }
 *
 * POST /api/upload?action=presign
 *   Returns a presigned PUT URL for direct browser-to-storage uploads.
 *   Body: { filename, contentType, context, slug? }
 *
 * DELETE /api/upload
 *   Body: { key }  — delete an object from storage.
 */

export async function POST(req: Request) {
  const deny = await requireAdmin();
  if (deny) return deny;
  const url    = new URL(req.url);
  const action = url.searchParams.get("action");

  // ── Presigned upload URL ──────────────────────────────────────────────────
  if (action === "presign") {
    try {
      const body        = await req.json() as { filename?: string; contentType?: string; context?: string; slug?: string };
      const filename    = body.filename    ?? "upload";
      const contentType = body.contentType ?? "application/octet-stream";
      const context     = body.context     ?? "product";
      const folder      = FOLDER_MAP[context] ?? "marketing";
      const key         = body.slug
        ? `${folder}/${body.slug}/${filename.replace(/[^a-z0-9._-]/gi, "-").toLowerCase()}`
        : undefined;

      const result = await createPresignedUpload(filename, contentType, { folder, key });

      return NextResponse.json({ ok: true, ...result });
    } catch (err) {
      console.error("[upload presign]", err);
      return NextResponse.json({ error: "Failed to generate presigned URL" }, { status: 500 });
    }
  }

  // ── Direct upload ─────────────────────────────────────────────────────────
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart form data" }, { status: 400 });
  }

  const file    = form.get("file");
  const context = (form.get("context") as string | null) ?? "product";
  const type    = (form.get("type")    as string | null) ?? "image";
  const slug    = form.get("slug")   as string | null;

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const allowedTypes = ALLOWED_TYPES_MAP[type as keyof typeof ALLOWED_TYPES_MAP] ?? ALLOWED_IMAGE_TYPES;
  const maxSize      = MAX_SIZE_MAP[type]  ?? MAX_IMAGE_SIZE;
  const folder       = FOLDER_MAP[context] ?? "marketing";

  const validation = validateUpload(file.size, file.type, allowedTypes, maxSize);
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 413 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());

    if (!checkMagicBytes(buffer, file.type)) {
      return NextResponse.json({ error: "File content does not match declared type" }, { status: 415 });
    }

    const key    = slug
      ? `${folder}/${slug}/${file.name.replace(/[^a-z0-9._-]/gi, "-").toLowerCase()}`
      : undefined;

    const result = await uploadFile(buffer, file.name, file.type, {
      folder,
      key,
      metadata: { context },
    });

    return NextResponse.json(
      {
        ok:          true,
        key:         result.key,
        url:         result.url,
        size:        result.size,
        contentType: result.contentType,
        etag:        result.etag,
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("[upload POST]", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const deny = await requireAdmin();
  if (deny) return deny;
  try {
    const { key } = await req.json() as { key?: string };
    if (!key || typeof key !== "string") {
      return NextResponse.json({ error: "key is required" }, { status: 400 });
    }

    // Safety: only allow deleting from known prefixes
    const allowedPrefixes = Object.values(FOLDER_MAP);
    const isSafe = allowedPrefixes.some((p) => key.startsWith(p + "/"));
    if (!isSafe) {
      return NextResponse.json({ error: "Key path not allowed" }, { status: 403 });
    }

    await deleteFile(key);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[upload DELETE]", err);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
