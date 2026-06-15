import { NextResponse } from "next/server";
import {
  renderBusinessDocument,
  quoteToDocument,
  orderToDocument,
  type DocumentKind,
  type OrderLike,
  type QuoteLike,
} from "@apt/documents";

export { allowedQuoteKind, allowedOrderKind } from "@apt/documents";

/* Serving glue for the store's document endpoints. */

export function pdfResponse(buffer: Buffer, filename: string, download: boolean): NextResponse {
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}

export async function quotePdf(quote: QuoteLike, kind: DocumentKind, download: boolean) {
  const buffer = await renderBusinessDocument(quoteToDocument(quote, kind));
  const number = kind === "quote" ? quote.ref : quote.quoteNumber || quote.ref;
  return pdfResponse(buffer, `${number}-${kind}.pdf`, download);
}

export async function orderPdf(order: OrderLike, kind: DocumentKind, download: boolean) {
  const buffer = await renderBusinessDocument(orderToDocument(order, kind));
  return pdfResponse(buffer, `${order.ref ?? "order"}-${kind}.pdf`, download);
}
