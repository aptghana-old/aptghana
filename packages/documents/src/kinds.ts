import type { DocumentKind } from "./types";

/* State-based gating of document variants — shared by every endpoint. */

/** Which document variant a quote supports right now (null = not available). */
export function allowedQuoteKind(
  quote: { quoteNumber?: string; paymentStatus?: string },
  requested: string | null,
): DocumentKind | null {
  const approved = Boolean(quote.quoteNumber);
  const paid = quote.paymentStatus === "paid";
  const kind = (requested ?? (paid ? "receipt" : approved ? "proforma" : "quote")) as DocumentKind;

  if (kind === "quote") return "quote";
  if (kind === "proforma" && approved) return "proforma";
  if (kind === "receipt" && paid) return "receipt";
  return null;
}

/** Which document variant an order supports right now (null = not available). */
export function allowedOrderKind(
  order: { paymentRef?: string; status?: string },
  requested: string | null,
): DocumentKind | null {
  const paid = Boolean(order.paymentRef);
  const kind = (requested ?? (paid ? "invoice" : "order")) as DocumentKind;

  if (kind === "order" || kind === "invoice") return kind;
  if (kind === "receipt" && paid) return "receipt";
  return null;
}
