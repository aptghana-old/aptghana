import { NextResponse } from "next/server";
import { getPaymentProvider } from "@apt/payment";
import { finalizePayment } from "@/lib/payments/finalize";

/**
 * Paystack webhook (charge.success et al). Signature-verified, then runs the
 * same idempotent finalization as the browser callback. Always returns 200
 * for valid signatures so Paystack does not retry handled events.
 */
export async function POST(req: Request) {
  const payload = await req.text();
  const signature = req.headers.get("x-paystack-signature") ?? "";

  let provider;
  try {
    provider = getPaymentProvider();
  } catch {
    // No gateway configured — webhook cannot be authenticated
    return NextResponse.json({ error: "Payment provider not configured" }, { status: 503 });
  }

  if (!signature || !provider.verifyWebhook(payload, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event;
  try {
    event = provider.parseWebhookEvent(JSON.parse(payload));
  } catch {
    return NextResponse.json({ error: "Malformed payload" }, { status: 400 });
  }

  if (event.type === "charge.success" && event.reference) {
    try {
      const result = await finalizePayment(event.reference);
      return NextResponse.json({ received: true, result: result.status });
    } catch (err) {
      console.error("[paystack webhook]", err);
      // 500 → Paystack retries, which is what we want for transient failures
      return NextResponse.json({ error: "Processing failed" }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
