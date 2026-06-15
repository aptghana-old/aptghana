import { NextRequest, NextResponse } from "next/server";
import { connectDB, AttachmentModel, QuoteModel } from "@apt/db";
import { createPresignedDownload } from "@apt/storage";
import { auth } from "@/lib/auth";

interface Params { params: Promise<{ id: string }> }

/** Serve an RFQ supporting document. Requires session and ownership verification. */
export async function GET(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!/^[a-f0-9]{24}$/i.test(id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    await connectDB();
    const attachment = await AttachmentModel.findById(id)
      .select("+data storageKey name contentType size quoteId uploadedBy")
      .lean<{
        name:        string;
        contentType: string;
        size:        number;
        storageKey?: string;
        quoteId?:    unknown;
        uploadedBy?: unknown;
        data?:       { buffer: ArrayBuffer } | Buffer;
      }>();

    if (!attachment) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Verify the requesting user owns this attachment or its parent quote
    const userId = session.user.id;
    const isUploader = attachment.uploadedBy?.toString() === userId;

    if (!isUploader && attachment.quoteId) {
      const quote = await QuoteModel.findOne({
        _id: attachment.quoteId,
        $or: [
          { "contact.email": session.user.email },
          { userId },
        ],
      }).select("_id").lean();
      if (!quote) return NextResponse.json({ error: "Not found" }, { status: 404 });
    } else if (!isUploader) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // ── MinIO redirect (primary path) ─────────────────────────────────────────
    if (attachment.storageKey) {
      const presignedUrl = await createPresignedDownload(attachment.storageKey, 3600);
      return NextResponse.redirect(presignedUrl, { status: 302 });
    }

    // ── Legacy: serve Buffer from MongoDB ─────────────────────────────────────
    if (!attachment.data) {
      return NextResponse.json({ error: "Attachment data not available" }, { status: 404 });
    }

    const buffer = Buffer.isBuffer(attachment.data)
      ? attachment.data
      : Buffer.from((attachment.data as { buffer: ArrayBuffer }).buffer);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type":        attachment.contentType,
        "Content-Disposition": `attachment; filename="${attachment.name.replace(/"/g, "")}"`,
        "Cache-Control":       "private, max-age=3600",
      },
    });
  } catch (err) {
    console.error("[rfq attachments GET]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
