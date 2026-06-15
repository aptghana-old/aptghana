import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB, QuoteModel } from "@apt/db";
import type { QuoteLike } from "@apt/documents";
import { allowedQuoteKind, quotePdf } from "@/lib/documents/serve";

interface Params { params: Promise<{ id: string }> }

/** Quote/proforma/receipt PDF for the signed-in owner of the quote. */
export async function GET(req: NextRequest, { params }: Params) {
  const { id } = await params;
  if (!/^[a-f0-9]{24}$/i.test(id)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await connectDB();
    const quote = await QuoteModel.findOne({
      _id: id,
      $or: [{ userId: session.user.id }, { "client.email": session.user.email?.toLowerCase() }],
    }).lean<QuoteLike & { paymentStatus?: string }>();
    if (!quote) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const kind = allowedQuoteKind(quote, req.nextUrl.searchParams.get("type"));
    if (!kind) {
      return NextResponse.json({ error: "Document not available for this quote's status" }, { status: 409 });
    }

    return await quotePdf(quote, kind, req.nextUrl.searchParams.get("download") === "1");
  } catch (err) {
    console.error("[documents quote]", err);
    return NextResponse.json({ error: "Failed to generate document" }, { status: 500 });
  }
}
