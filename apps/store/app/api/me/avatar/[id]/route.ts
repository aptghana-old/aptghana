import { NextRequest, NextResponse } from "next/server";
import { connectDB, AttachmentModel } from "@apt/db";

interface Params { params: Promise<{ id: string }> }

/** Serve an avatar image (rendered inline, long-cached). */
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  if (!/^[a-f0-9]{24}$/i.test(id)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    await connectDB();
    const attachment = await AttachmentModel.findOne({ _id: id, scope: "avatar" })
      .select("+data contentType")
      .lean<{ contentType: string; data: { buffer: ArrayBuffer } | Buffer }>();
    if (!attachment) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const buffer = Buffer.isBuffer(attachment.data)
      ? attachment.data
      : Buffer.from((attachment.data as { buffer: ArrayBuffer }).buffer);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": attachment.contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (err) {
    console.error("[me avatar GET]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
