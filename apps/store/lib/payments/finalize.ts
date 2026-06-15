import {
  connectDB,
  OrderModel,
  PaymentModel,
  QuoteModel,
  TransactionModel,
  recordAudit,
} from "@apt/db";
import { getPaymentProvider } from "@apt/payment";
import { sendPaymentEmails } from "@/lib/workflow/notifications";

export interface FinalizeResult {
  ok: boolean;
  status: "paid" | "already_paid" | "failed" | "not_found" | "mismatch";
  message?: string;
}

/** Local dev simulator is only valid with no live Paystack key outside production. */
export function devPaymentsEnabled(): boolean {
  return !process.env.PAYSTACK_SECRET_KEY && process.env.NODE_ENV !== "production";
}

interface VerifiedCharge {
  success: boolean;
  amount: number;
  currency: string;
  channel?: string;
  paidAt?: Date;
  gatewayResponse?: string;
  raw?: Record<string, unknown>;
}

/**
 * Finalize a payment by gateway reference. Called from the Paystack webhook
 * AND the browser callback — safe to run any number of times, from either
 * path, concurrently:
 *
 *  - the Quote flip to paid is an atomic findOneAndUpdate guarded on
 *    paymentStatus ≠ paid (only one caller wins → exactly-once emails)
 *  - the Transaction insert is protected by a unique (reference, type) index
 */
export async function finalizePayment(reference: string): Promise<FinalizeResult> {
  await connectDB();

  const payment = await PaymentModel.findOne({ reference });
  if (!payment) return { ok: false, status: "not_found", message: "Unknown payment reference" };

  // Fast path: this reference has already been fully processed
  if (payment.status === "success") return { ok: true, status: "already_paid" };

  // 1. Verify with the gateway (or the dev simulator)
  let charge: VerifiedCharge;
  if (payment.provider === "dev" && devPaymentsEnabled()) {
    charge = {
      success: true,
      amount: payment.amount,
      currency: payment.currency,
      channel: "dev-simulator",
      paidAt: new Date(),
      gatewayResponse: "Simulated payment (no PAYSTACK_SECRET_KEY configured)",
    };
  } else {
    const verified = await getPaymentProvider().verifyPayment(reference);
    charge = {
      success: verified.success,
      amount: verified.amount,
      currency: verified.currency,
      channel: verified.channel,
      paidAt: verified.paidAt,
      gatewayResponse: verified.gatewayResponse,
      raw: verified.metadata,
    };
  }

  if (!charge.success) {
    if (payment.status === "initialized") {
      payment.status = "failed";
      payment.gatewayResponse = charge.gatewayResponse;
      await payment.save();
      await recordAudit({
        entityType: "payment",
        entityId: payment._id,
        ref: reference,
        action: "payment_failed",
        actor: { type: "system", name: "paystack" },
        message: charge.gatewayResponse,
        meta: { quoteId: String(payment.quoteId) },
      });
    }
    return { ok: false, status: "failed", message: charge.gatewayResponse };
  }

  // 2. Amount integrity — a verified charge must match what we initialized
  if (Math.abs(charge.amount - payment.amount) > 0.01 || charge.currency !== payment.currency) {
    await recordAudit({
      entityType: "payment",
      entityId: payment._id,
      ref: reference,
      action: "payment_amount_mismatch",
      actor: { type: "system", name: "paystack" },
      message: `Expected ${payment.currency} ${payment.amount}, gateway reported ${charge.currency} ${charge.amount}`,
      meta: { quoteId: String(payment.quoteId) },
    });
    return { ok: false, status: "mismatch", message: "Charged amount does not match the quote total" };
  }

  const paidAt = charge.paidAt ?? new Date();

  // 3. Atomic winner-takes-all flip of the quote → exactly-once side effects
  const quote = await QuoteModel.findOneAndUpdate(
    {
      _id: payment.quoteId,
      paymentStatus: { $ne: "paid" },
      status: { $in: ["approved", "accepted"] },
    },
    {
      $set: {
        status: "paid",
        paymentStatus: "paid",
        "payment.reference": reference,
        "payment.channel": charge.channel,
        "payment.paidAt": paidAt,
        "payment.amount": charge.amount,
      },
    },
    { new: true },
  );

  // 4. Persist the payment + transaction records regardless of who won
  payment.status = "success";
  payment.channel = charge.channel;
  payment.paidAt = paidAt;
  payment.gatewayResponse = charge.gatewayResponse;
  await payment.save();

  let transactionId: unknown = null;
  try {
    const txn = await TransactionModel.create({
      reference,
      paymentId: payment._id,
      quoteId: payment.quoteId,
      provider: payment.provider,
      type: "charge",
      status: "success",
      amount: charge.amount,
      currency: charge.currency,
      channel: charge.channel,
      paidAt,
      gatewayResponse: charge.gatewayResponse,
      raw: charge.raw ?? {},
    });
    transactionId = txn._id;
  } catch (err) {
    // E11000 duplicate — another caller already recorded this charge
    if (!(err instanceof Error && err.message.includes("E11000"))) throw err;
  }

  if (!quote) {
    // Lost the race (or quote was in an unexpected state) — no duplicate emails
    return { ok: true, status: "already_paid" };
  }

  if (transactionId) {
    await QuoteModel.updateOne(
      { _id: quote._id },
      { $set: { "payment.transactionId": transactionId } },
    );
  }

  // Confirm the linked order (created at approval, Awaiting Payment until now)
  if (quote.orderId) {
    await OrderModel.updateOne(
      { _id: quote.orderId, status: "pending" },
      { $set: { status: "confirmed", paymentRef: reference, paymentMethod: charge.channel } },
    );
  }

  await recordAudit({
    entityType: "quote",
    entityId: quote._id,
    ref: quote.quoteNumber || quote.ref,
    action: "payment_succeeded",
    fromStatus: "approved",
    toStatus: "paid",
    actor: { type: "system", name: payment.provider },
    message: `Payment of ${charge.currency} ${charge.amount.toLocaleString()} received via ${charge.channel ?? "unknown channel"}${quote.orderRef ? ` — order ${quote.orderRef} confirmed` : ""}`,
    meta: { reference, transactionId: transactionId ? String(transactionId) : undefined, orderRef: quote.orderRef ?? undefined },
  });

  // 5. Exactly-once notification emails (we won the atomic flip)
  await sendPaymentEmails({
    quote: {
      id: String(quote._id),
      ref: quote.ref,
      quoteNumber: quote.quoteNumber as string,
      source: (quote.source ?? "cart") as "single_product" | "cart",
      client: quote.client,
      items: quote.items,
      userId: quote.userId ? String(quote.userId) : undefined,
    },
    amount: charge.amount,
    currency: charge.currency,
    paymentReference: reference,
    channel: charge.channel,
    paidAt,
    payToken: quote.payToken as string,
  });

  return { ok: true, status: "paid" };
}
