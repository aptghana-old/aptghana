import { NextRequest, NextResponse } from "next/server";
import { connectDB, QuoteModel } from "@apt/db";
import {
  allowedQuoteKind,
  quoteToDocument,
  renderBusinessDocument,
  type QuoteLike,
} from "@apt/documents";
import { requireAdmin } from "@/lib/auth/require";

interface Params { params: Promise<{ id: string }> }

/** Quote / proforma / receipt PDF for the sales team. */
export async function GET(req: NextRequest, { params }: Params) {
  const deny = await requireAdmin();
  if (deny) return deny;
  const { id } = await params;
  if (!/^[a-f0-9]{24}$/i.test(id)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    await connectDB();
    const quote = await QuoteModel.findById(id).lean<QuoteLike & { paymentStatus?: string }>();
    if (!quote) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const kind = allowedQuoteKind(quote, req.nextUrl.searchParams.get("type"));
    if (!kind) {
      return NextResponse.json({ error: "Document not available for this quote's status" }, { status: 409 });
    }

    const buffer = await renderBusinessDocument(quoteToDocument(quote, kind));
    const number = kind === "quote" ? quote.ref : quote.quoteNumber || quote.ref;
    const download = req.nextUrl.searchParams.get("download") === "1";

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${number}-${kind}.pdf"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (err) {
    console.error("[admin quote pdf]", err);
    return NextResponse.json({ error: "Failed to generate document" }, { status: 500 });
  }
}
