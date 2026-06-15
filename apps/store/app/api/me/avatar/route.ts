import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB, AttachmentModel, UserModel } from "@apt/db";

const MAX_SIZE = 2 * 1024 * 1024; // 2 MB
const ALLOWED = new Set(["image/png", "image/jpeg", "image/webp"]);

const MAGIC = [
  { mime: "image/jpeg", bytes: [0xFF, 0xD8, 0xFF] },
  { mime: "image/png",  bytes: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A] },
  { mime: "image/webp", bytes: [0x52, 0x49, 0x46, 0x46], offset4: [0x57, 0x45, 0x42, 0x50] },
];

function checkMagicBytes(buf: Buffer, mime: string): boolean {
  for (const m of MAGIC) {
    if (m.mime !== mime) continue;
    if (m.bytes.every((b, i) => buf[i] === b)) {
      if ("offset4" in m) return m.offset4!.every((b, i) => buf[8 + i] === b);
      return true;
    }
  }
  return false;
}

/** Upload a profile photo. Replaces (and deletes) any previous avatar. */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart form data" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "No image provided" }, { status: 400 });
  if (file.size === 0 || file.size > MAX_SIZE) {
    return NextResponse.json({ error: "Images must be under 2 MB" }, { status: 413 });
  }
  if (!ALLOWED.has(file.type)) {
    return NextResponse.json({ error: "Use a PNG, JPG, or WEBP image" }, { status: 415 });
  }

  try {
    await connectDB();
    const buffer = Buffer.from(await file.arrayBuffer());
    if (!checkMagicBytes(buffer, file.type)) {
      return NextResponse.json({ error: "File content does not match its declared type" }, { status: 415 });
    }
    const attachment = await AttachmentModel.create({
      name: file.name.slice(0, 255),
      contentType: file.type,
      size: file.size,
      data: buffer,
      scope: "avatar",
      uploadedBy: session.user.id,
    });
    const url = `/api/me/avatar/${String(attachment._id)}`;

    const prev = await UserModel.findByIdAndUpdate(session.user.id, { $set: { avatar: url } })
      .select("avatar")
      .lean<{ avatar?: string }>();

    // Remove the superseded avatar blob
    const prevId = prev?.avatar?.match(/\/api\/me\/avatar\/([a-f0-9]{24})$/)?.[1];
    if (prevId) await AttachmentModel.deleteOne({ _id: prevId, scope: "avatar" });

    return NextResponse.json({ ok: true, avatar: url }, { status: 201 });
  } catch (err) {
    console.error("[me avatar POST]", err);
    return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 500 });
  }
}

/** Remove the profile photo (falls back to initials). */
export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await connectDB();
    const prev = await UserModel.findByIdAndUpdate(session.user.id, { $unset: { avatar: 1 } })
      .select("avatar")
      .lean<{ avatar?: string }>();
    const prevId = prev?.avatar?.match(/\/api\/me\/avatar\/([a-f0-9]{24})$/)?.[1];
    if (prevId) await AttachmentModel.deleteOne({ _id: prevId, scope: "avatar" });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[me avatar DELETE]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
