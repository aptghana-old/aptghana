import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import {
  connectDB,
  OrderModel,
  QuoteModel,
  recordAudit,
  computeQuoteTotals,
  allItemsPriced,
  APPROVABLE_STATUSES,
  generateWorkflowRef,
  generatePayToken,
} from "@apt/db";
import type { QuoteStatus } from "@apt/types";
import { emailService } from "@apt/email";
import { STORE_URL as STORE_URL_DEFAULT } from "@apt/config";
import { requirePermission } from "@/lib/auth/require";

const STORE_URL = (process.env.STORE_URL ?? STORE_URL_DEFAULT).replace(/\/$/, "");

interface Params { params: Promise<{ id: string }> }

/**
 * Approve Quote: validates every line is priced (backend gate — the editor
 * enforces the same rule client-side), freezes totals, generates the quote
 * number and payment token, and emails the customer their approved quotation
 * with a Proceed to Payment CTA.
 *
 * Idempotent: re-approving an approved quote returns the existing state.
 */
export async function POST(req: NextRequest, { params }: Params) {
  const deny = await requirePermission('quotes:approve');
  if (deny) return deny;
  const { id } = await params;

  let body: { validityDays?: number } = {};
  try {
    body = await req.json();
  } catch { /* empty body is fine */ }

  try {
    await connectDB();
    const quote = await QuoteModel.findById(id);
    if (!quote) return NextResponse.json({ error: "Quote not found" }, { status: 404 });

    // Idempotency: already approved → no-op, no duplicate email
    if (quote.status === "approved" && quote.quoteNumber) {
      return NextResponse.json({
        ok: true,
        alreadyApproved: true,
        quoteNumber: quote.quoteNumber,
        payUrl: `${STORE_URL}/pay/${quote.payToken}`,
      });
    }

    if (!APPROVABLE_STATUSES.includes(quote.status as QuoteStatus)) {
      return NextResponse.json(
        { error: `Quote in status "${quote.status}" cannot be approved.` },
        { status: 409 },
      );
    }

    const items = quote.items as { quantity: number; unitPrice?: number; name?: string; description: string }[];
    if (!allItemsPriced(items)) {
      const unpriced = items
        .filter((i) => !(typeof i.unitPrice === "number" && i.unitPrice > 0))
        .map((i) => i.name || i.description);
      return NextResponse.json(
        {
          error: "Every product must have a valid unit price before approval.",
          unpricedItems: unpriced,
        },
        { status: 422 },
      );
    }

    // Freeze line totals + totals
    for (const item of quote.items) {
      item.lineTotal = Math.round((item.unitPrice ?? 0) * item.quantity * 100) / 100;
    }
    quote.totals = computeQuoteTotals({
      items,
      discount: quote.totals?.discount ?? 0,
      taxRate: quote.totals?.taxRate ?? 0,
      shipping: quote.totals?.shipping ?? 0,
      currency: quote.totals?.currency ?? "GHS",
    });

    const requestedDays = Math.floor(Number(body.validityDays));
    if (Number.isFinite(requestedDays) && requestedDays >= 1) {
      quote.expiresAt = new Date(Date.now() + Math.min(365, requestedDays) * 86_400_000);
    } else if (!quote.expiresAt || quote.expiresAt <= new Date()) {
      quote.expiresAt = new Date(Date.now() + 14 * 86_400_000); // default 14-day validity
    }

    const fromStatus = quote.status as QuoteStatus;
    quote.quoteNumber = quote.quoteNumber || generateWorkflowRef("QT");
    quote.payToken = quote.payToken || generatePayToken();
    quote.status = "approved";
    quote.paymentStatus = "awaiting";
    quote.pricingLocked = true;
    quote.approvedAt = new Date();
    quote.respondedAt = quote.respondedAt ?? new Date();

    // Transform the approved request into an Order awaiting payment
    if (!quote.orderId) {
      const order = await OrderModel.create({
        ref: generateWorkflowRef("ORD"),
        userId: quote.userId ?? undefined,
        guest: quote.userId ? undefined : {
          name: quote.client.name,
          email: quote.client.email,
          phone: quote.client.phone,
        },
        items: quote.items.map((i: {
          productId?: unknown; sku?: string; name?: string; description: string;
          brand?: string; quantity: number; unitPrice?: number; lineTotal?: number;
          image?: string; notes?: string;
        }) => ({
          productId: i.productId ?? undefined,
          sku: i.sku,
          name: i.name || i.description,
          brandSlug: i.brand,
          quantity: i.quantity,
          unitPrice: i.unitPrice ?? 0,
          totalPrice: i.lineTotal ?? 0,
          currency: quote.totals.currency,
          image: i.image,
          notes: i.notes,
        })),
        subtotal: quote.totals.subtotal,
        discount: quote.totals.discount,
        tax: quote.totals.taxAmount,
        shipping: quote.totals.shipping,
        total: quote.totals.grandTotal,
        currency: quote.totals.currency,
        status: "pending", // Awaiting Payment
        paymentStatus: "unpaid",
        originChannel: quote.originChannel,
        quoteId: quote._id,
        quoteNumber: quote.quoteNumber,
        payToken: quote.payToken,
        notes: quote.quoteNote ?? undefined,
      });
      quote.orderId = order._id;
      quote.orderRef = order.ref;

      await recordAudit({
        entityType: "quote",
        entityId: quote._id,
        ref: order.ref,
        action: "order_created",
        actor: { type: "system", name: "workflow" },
        message: `Order ${order.ref} created from approved request — awaiting payment`,
        meta: { orderId: String(order._id), quoteNumber: quote.quoteNumber },
      });
    }

    await quote.save();

    await recordAudit({
      entityType: "quote",
      entityId: quote._id,
      ref: quote.quoteNumber,
      action: "quote_approved",
      fromStatus,
      toStatus: "approved",
      actor: { type: "sales", name: "Sales" },
      message: `Quote approved and locked — ${quote.totals.currency} ${quote.totals.grandTotal.toLocaleString()}, valid until ${quote.expiresAt?.toDateString()}`,
      meta: { quoteNumber: quote.quoteNumber, grandTotal: quote.totals.grandTotal },
    });

    const payUrl = `${STORE_URL}/pay/${quote.payToken}`;
    const validUntil = (quote.expiresAt ?? new Date()).toLocaleDateString("en-GH", {
      day: "numeric", month: "long", year: "numeric",
    });

    // Queue the customer approval email
    const emailPayload = {
      name: quote.client.firstName || quote.client.name.split(/\s+/)[0],
      company: quote.client.company ?? undefined,
      quoteNumber: quote.quoteNumber as string,
      rfqRef: quote.ref,
      payUrl,
      items: (quote.items as {
        name?: string; description: string; sku?: string; brand?: string;
        quantity: number; unitPrice?: number; lineTotal?: number; notes?: string;
      }[]).map((i) => ({
        name: i.name || i.description,
        sku: i.sku,
        brand: i.brand,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        lineTotal: i.lineTotal,
      })),
      totals: quote.totals,
      validUntil,
      quoteNote: quote.quoteNote ?? undefined,
      kind: (quote.kind ?? "rfq") as "approval_request" | "rfq",
      orderRef: quote.orderRef ?? undefined,
    };
    const to = quote.client.email;
    const meta = { quoteId: String(quote._id), ref: quote.quoteNumber };

    after(async () => {
      await emailService.send(to, { kind: "quote-approved", payload: emailPayload }, { meta });
    });

    return NextResponse.json({
      ok: true,
      quoteNumber: quote.quoteNumber,
      orderRef: quote.orderRef,
      totals: quote.totals,
      validUntil: quote.expiresAt,
      payUrl,
    });
  } catch (err) {
    console.error("[admin quotes approve]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
