import { NextResponse } from "next/server";
import {
  connectDB,
  PaymentModel,
  QuoteModel,
  generateWorkflowRef,
  recordAudit,
} from "@apt/db";
import { getPaymentProvider } from "@apt/payment";
import { BASE_URL } from "@apt/email";
import { devPaymentsEnabled } from "@/lib/payments/finalize";

const STORE_URL = BASE_URL.replace(/\/$/, "");

/**
 * Initialize payment for an approved quote, addressed by its secret pay
 * token. Idempotent: re-initializing reuses the pending gateway session
 * instead of creating duplicate charges.
 */
export async function POST(req: Request) {
  let body: { token?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const token = typeof body.token === "string" ? body.token.trim() : "";
  if (!/^[a-f0-9]{48}$/.test(token)) {
    return NextResponse.json({ error: "Invalid payment token" }, { status: 400 });
  }

  try {
    await connectDB();
    const quote = await QuoteModel.findOne({ payToken: token });
    // Token must match the stored value — never trust the filter alone
    if (!quote || quote.payToken !== token) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    }

    // Only approved quotes are payable — pending/rejected/expired are blocked
    if (quote.paymentStatus === "paid") {
      return NextResponse.json({ error: "This quote has already been paid." }, { status: 409 });
    }
    if (!["approved", "accepted"].includes(quote.status)) {
      return NextResponse.json(
        { error: "This quote is not approved for payment." },
        { status: 409 },
      );
    }
    if (quote.expiresAt && quote.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "This quotation has expired. Contact sales for a refreshed quote." },
        { status: 409 },
      );
    }

    const amount = quote.totals?.grandTotal ?? 0;
    const currency = quote.totals?.currency ?? "GHS";
    if (amount <= 0) {
      return NextResponse.json({ error: "Quote total is not set." }, { status: 409 });
    }

    // Idempotency: reuse a live gateway session for the same quote + amount
    const existing = await PaymentModel.findOne({
      quoteId: quote._id,
      status: "initialized",
      amount,
      currency,
      createdAt: { $gte: new Date(Date.now() - 30 * 60 * 1000) }, // Paystack sessions stay valid well past this
    }).sort({ createdAt: -1 });
    if (existing?.authorizationUrl) {
      return NextResponse.json({ ok: true, authorizationUrl: existing.authorizationUrl, reference: existing.reference });
    }

    const reference = generateWorkflowRef("PAY");
    const callbackUrl = `${STORE_URL}/api/pay/callback?token=${token}`;

    let authorizationUrl: string;
    let provider = "paystack";
    let accessCode: string | undefined;

    if (devPaymentsEnabled()) {
      // Local simulator — no gateway configured outside production
      provider = "dev";
      authorizationUrl = `${callbackUrl}&reference=${reference}`;
    } else {
      const init = await getPaymentProvider().initializePayment({
        amount,
        currency,
        email: quote.client.email,
        reference,
        callbackUrl,
        metadata: {
          quoteId: String(quote._id),
          quoteNumber: quote.quoteNumber,
          rfqRef: quote.ref,
        },
        channels: ["card", "bank_transfer", "mobile_money"],
      });
      if (!init.success) {
        return NextResponse.json({ error: "Payment gateway could not initialize the transaction." }, { status: 502 });
      }
      authorizationUrl = init.authorizationUrl;
      accessCode = init.accessCode;
    }

    const payment = await PaymentModel.create({
      reference,
      provider,
      quoteId: quote._id,
      quoteRef: quote.ref,
      quoteNumber: quote.quoteNumber,
      email: quote.client.email,
      amount,
      currency,
      status: "initialized",
      authorizationUrl,
      accessCode,
    });

    await recordAudit({
      entityType: "quote",
      entityId: quote._id,
      ref: quote.quoteNumber || quote.ref,
      action: "payment_initialized",
      actor: { type: "customer", name: quote.client.name },
      message: `Payment session ${reference} initialized for ${currency} ${amount.toLocaleString()}`,
      meta: { reference, paymentId: String(payment._id), provider },
    });

    return NextResponse.json({ ok: true, authorizationUrl, reference });
  } catch (err) {
    console.error("[pay init]", err);
    return NextResponse.json({ error: "Failed to start payment. Please try again." }, { status: 500 });
  }
}
