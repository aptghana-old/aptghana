export type {
  PaymentProvider, PaymentParams, PaymentInitResult,
  PaymentVerifyResult, WebhookEvent, WebhookEventType,
} from "./types";
export { PaystackProvider } from "./providers/paystack";

import { PaystackProvider } from "./providers/paystack";
import type { PaymentProvider } from "./types";

let _provider: PaymentProvider | null = null;

export function getPaymentProvider(): PaymentProvider {
  if (_provider) return _provider;
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) throw new Error("No payment provider configured. Set PAYSTACK_SECRET_KEY.");
  _provider = new PaystackProvider(key);
  return _provider;
}
