import { NextRequest, NextResponse } from "next/server";
import { connectDB, QuoteModel } from "@apt/db";
import type { QuoteLike } from "@apt/documents";
import { allowedQuoteKind, quotePdf } from "@/lib/documents/serve";

interface Params { params: Promise<{ token: string }> }

/**
 * Document access via the secret payment token — the same authorization the
 * payment portal uses, so guests can download their proforma/receipt too.
 */
export async function GET(req: NextRequest, { params }: Params) {
  const { token } = await params;
  if (!/^[a-f0-9]{48}$/.test(token)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    await connectDB();
    const quote = await QuoteModel.findOne({ payToken: token })
      .lean<QuoteLike & { payToken?: string; paymentStatus?: string }>();
    // Token must match the stored value — never trust the filter alone
    if (!quote || quote.payToken !== token) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const kind = allowedQuoteKind(quote, req.nextUrl.searchParams.get("type"));
    if (!kind || kind === "quote") {
      // Token holders see priced documents only (proforma/receipt)
      return NextResponse.json({ error: "Document not available" }, { status: 409 });
    }

    return await quotePdf(quote, kind, req.nextUrl.searchParams.get("download") === "1");
  } catch (err) {
    console.error("[documents token]", err);
    return NextResponse.json({ error: "Failed to generate document" }, { status: 500 });
  }
}
