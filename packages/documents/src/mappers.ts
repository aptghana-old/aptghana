import { formatDate } from "./company";
import type { BusinessDocumentData, DocumentKind, DocumentLine } from "./types";

/* Loose shapes matching the Mongo lean() documents from @apt/db. */

export interface QuoteLike {
  ref: string;
  quoteNumber?: string;
  orderRef?: string;
  kind?: string;
  status?: string;
  paymentStatus?: string;
  client: {
    name: string; email?: string; phone?: string;
    company?: string; country?: string; address?: string;
  };
  items: {
    name?: string; description: string; sku?: string; brand?: string;
    quantity: number; unitPrice?: number; lineTotal?: number; notes?: string;
  }[];
  totals?: {
    subtotal: number; discount: number; taxRate: number;
    taxAmount: number; shipping: number; grandTotal: number; currency: string;
  };
  quoteNote?: string;
  expiresAt?: Date | string;
  approvedAt?: Date | string;
  payment?: { reference?: string; channel?: string; paidAt?: Date | string; amount?: number };
  createdAt?: Date | string;
}

export interface OrderLike {
  ref?: string;
  status?: string;
  quoteNumber?: string;
  guest?: { name?: string; email?: string; phone?: string };
  customer?: { name?: string; email?: string; phone?: string; company?: string; address?: string; country?: string };
  items?: {
    name: string; sku?: string; brandSlug?: string; quantity: number;
    unitPrice: number; totalPrice: number; notes?: string;
  }[];
  subtotal?: number; discount?: number; tax?: number; shipping?: number;
  total?: number; currency?: string;
  paymentRef?: string; paymentMethod?: string;
  notes?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

const QUOTE_STATUS_LABELS: Record<string, string> = {
  pending: "Pending Review",
  reviewing: "Under Review",
  waiting_customer: "Waiting for Customer",
  approved: "Awaiting Payment",
  paid: "Paid",
  cancelled: "Cancelled",
  expired: "Expired",
};

function quoteLines(quote: QuoteLike, priced: boolean): DocumentLine[] {
  return quote.items.map((i) => ({
    name: i.name || i.description,
    sku: i.sku,
    brand: i.brand,
    quantity: i.quantity,
    unitPrice: priced ? i.unitPrice : undefined,
    lineTotal: priced ? i.lineTotal : undefined,
    notes: i.notes,
  }));
}

/**
 * Quote → document. `kind` controls the variant:
 *  - "quote": pre-approval RFQ/RFA acknowledgement (no prices until priced)
 *  - "proforma": approved quote awaiting payment
 *  - "receipt": paid quote (payment block included)
 */
export function quoteToDocument(quote: QuoteLike, kind: DocumentKind): BusinessDocumentData {
  const approved = Boolean(quote.quoteNumber);
  const priced = approved || kind !== "quote";
  const isPaid = quote.paymentStatus === "paid";

  return {
    kind,
    number: (kind === "quote" ? quote.ref : quote.quoteNumber || quote.ref),
    reference: kind === "quote" ? undefined : `From request ${quote.ref}${quote.orderRef ? ` · Order ${quote.orderRef}` : ""}`,
    date: formatDate(kind === "quote" ? quote.createdAt : quote.approvedAt ?? quote.createdAt),
    validUntil: kind === "proforma" && quote.expiresAt ? formatDate(quote.expiresAt) : undefined,
    statusLabel: isPaid ? "PAID" : QUOTE_STATUS_LABELS[quote.status ?? ""] ?? quote.status,
    customer: {
      name: quote.client.name,
      company: quote.client.company,
      email: quote.client.email,
      phone: quote.client.phone,
      address: quote.client.address,
      country: quote.client.country,
    },
    lines: quoteLines(quote, priced),
    totals: priced ? quote.totals : undefined,
    showPrices: priced && Boolean(quote.totals),
    note: quote.quoteNote,
    payment: kind === "receipt" && quote.payment?.reference
      ? {
          reference: quote.payment.reference,
          channel: quote.payment.channel,
          paidAt: quote.payment.paidAt ? formatDate(quote.payment.paidAt) : undefined,
          amount: quote.payment.amount,
        }
      : undefined,
  };
}

const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: "Awaiting Payment",
  confirmed: "Paid",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

/**
 * Order → document. `kind`:
 *  - "order": order confirmation
 *  - "invoice": commercial invoice (totals due / paid)
 *  - "receipt": payment receipt (requires paymentRef)
 */
export function orderToDocument(order: OrderLike, kind: DocumentKind): BusinessDocumentData {
  const customer = order.customer ?? order.guest ?? {};
  const paid = Boolean(order.paymentRef) || ["confirmed", "processing", "shipped", "delivered"].includes(order.status ?? "");
  const currency = order.currency ?? "GHS";

  return {
    kind,
    number: order.ref ?? "ORDER",
    reference: order.quoteNumber ? `From quotation ${order.quoteNumber}` : undefined,
    date: formatDate(order.createdAt),
    statusLabel: kind === "receipt" ? "PAID" : ORDER_STATUS_LABELS[order.status ?? ""] ?? order.status,
    customer: {
      name: customer.name ?? "Customer",
      company: (customer as { company?: string }).company,
      email: customer.email,
      phone: customer.phone,
      address: (customer as { address?: string }).address,
      country: (customer as { country?: string }).country,
    },
    lines: (order.items ?? []).map((i) => ({
      name: i.name,
      sku: i.sku,
      brand: i.brandSlug,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      lineTotal: i.totalPrice,
      notes: i.notes,
    })),
    totals: {
      subtotal: order.subtotal ?? 0,
      discount: order.discount ?? 0,
      taxRate: 0,
      taxAmount: order.tax ?? 0,
      shipping: order.shipping ?? 0,
      grandTotal: order.total ?? 0,
      currency,
    },
    showPrices: true,
    note: order.notes,
    payment: (kind === "receipt" || (kind === "invoice" && paid)) && order.paymentRef
      ? {
          reference: order.paymentRef,
          channel: order.paymentMethod,
          paidAt: formatDate(order.updatedAt),
          amount: order.total,
        }
      : undefined,
  };
}
