import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB, AttachmentModel } from "@apt/db";
import {
  uploadFile,
  validateUpload,
  ALLOWED_ATTACHMENT_TYPES,
  MAX_ATTACHMENT_SIZE,
} from "@apt/storage";
import { createRateLimiter, getClientIp } from "@apt/auth";

// H-06: Rate limit file uploads — 5 per IP per minute to prevent storage exhaustion
const limiter = createRateLimiter(5, 60 * 1000);

// H-07: Magic byte signatures for common file types.
// We validate the actual file content against declared MIME type.
const MAGIC_BYTES: Array<{ mime: string | string[]; bytes: number[]; offset?: number }> = [
  { mime: "image/jpeg",    bytes: [0xFF, 0xD8, 0xFF] },
  { mime: "image/png",     bytes: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A] },
  { mime: "image/gif",     bytes: [0x47, 0x49, 0x46, 0x38] },
  { mime: "image/webp",    bytes: [0x52, 0x49, 0x46, 0x46], offset: 0 }, // RIFF header; validated further below
  { mime: "application/pdf",  bytes: [0x25, 0x50, 0x44, 0x46] }, // %PDF
  // DOCX / XLSX are ZIP archives
  {
    mime: [
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ],
    bytes: [0x50, 0x4B, 0x03, 0x04],
  },
  // Legacy DOC / XLS (OLE2 Compound Document)
  {
    mime: ["application/msword", "application/vnd.ms-excel"],
    bytes: [0xD0, 0xCF, 0x11, 0xE0],
  },
  // CSV is plain text — no reliable magic bytes, skip binary check
  { mime: "text/csv", bytes: [] },
  // SVG is XML — check for text markers
  { mime: "image/svg+xml", bytes: [] },
];

function getMimes(entry: (typeof MAGIC_BYTES)[number]): string[] {
  return Array.isArray(entry.mime) ? entry.mime : [entry.mime];
}

function checkMagicBytes(buf: Buffer, declaredMime: string): boolean {
  const entry = MAGIC_BYTES.find((e) => getMimes(e).includes(declaredMime));
  if (!entry) return false; // unknown type — reject
  if (entry.bytes.length === 0) {
    // Text types: ensure no null bytes (binary content disguised as text)
    return !buf.slice(0, 512).includes(0x00);
  }

  const offset = entry.offset ?? 0;
  for (let i = 0; i < entry.bytes.length; i++) {
    if (buf[offset + i] !== entry.bytes[i]) return false;
  }

  // Extra WebP check: bytes 8-11 must be WEBP
  if (declaredMime === "image/webp") {
    return buf.slice(8, 12).toString("ascii") === "WEBP";
  }

  return true;
}

export async function POST(req: NextRequest) {
  // H-06: Enforce per-IP rate limit
  const ip = getClientIp(req);
  const { allowed } = limiter.check(ip);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many upload attempts. Please wait before uploading again." },
      { status: 429 },
    );
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart form data" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const validation = validateUpload(file.size, file.type, ALLOWED_ATTACHMENT_TYPES, MAX_ATTACHMENT_SIZE);
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 413 });
  }

  try {
    const session = await auth();
    await connectDB();

    const buffer = Buffer.from(await file.arrayBuffer());

    // H-07: Validate actual file content against declared MIME type
    if (!checkMagicBytes(buffer, file.type)) {
      return NextResponse.json(
        { error: "File content does not match its declared type. Upload rejected." },
        { status: 415 },
      );
    }

    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const minioConfigured =
      process.env.STORAGE_ENDPOINT &&
      process.env.STORAGE_ACCESS_KEY &&
      process.env.STORAGE_SECRET_KEY;

    if (minioConfigured) {
      const uploaded = await uploadFile(buffer, file.name, file.type, {
        folder:             "rfq-attachments",
        cacheControl:       "private, max-age=3600",
        contentDisposition: `attachment; filename="${file.name.replace(/"/g, "")}"`,
      });

      const attachment = await AttachmentModel.create({
        name:        file.name.slice(0, 255),
        contentType: file.type,
        size:        file.size,
        storageKey:  uploaded.key,
        scope:       "rfq",
        uploadedBy:  session?.user?.id ?? undefined,
        expiresAt:   expires,
      });

      return NextResponse.json(
        { ok: true, id: String(attachment._id), name: attachment.name, size: attachment.size, contentType: attachment.contentType },
        { status: 201 },
      );
    }

    // Legacy fallback: Buffer in MongoDB
    const attachment = await AttachmentModel.create({
      name:        file.name.slice(0, 255),
      contentType: file.type,
      size:        file.size,
      data:        buffer,
      scope:       "rfq",
      uploadedBy:  session?.user?.id ?? undefined,
      expiresAt:   expires,
    });

    return NextResponse.json(
      { ok: true, id: String(attachment._id), name: attachment.name, size: attachment.size, contentType: attachment.contentType },
      { status: 201 },
    );
  } catch (err) {
    console.error("[rfq attachments POST] upload failed");
    return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 500 });
  }
}
