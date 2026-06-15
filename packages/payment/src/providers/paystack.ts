import type {
  PaymentProvider, PaymentParams, PaymentInitResult,
  PaymentVerifyResult, WebhookEvent,
} from "../types";
import * as crypto from "crypto";

interface PaystackInitResponse {
  status: boolean;
  data?: { authorization_url: string; reference: string; access_code: string };
}

interface PaystackVerifyResponse {
  status: boolean;
  data?: {
    status: string;
    reference: string;
    amount: number;
    currency: string;
    paid_at?: string;
    channel?: string;
    gateway_response?: string;
    metadata?: Record<string, unknown>;
  };
}

interface PaystackRefundResponse {
  status: boolean;
  data?: { id: string };
}

export class PaystackProvider implements PaymentProvider {
  readonly name = "paystack";

  private readonly secretKey: string;
  private readonly baseUrl = "https://api.paystack.co";

  constructor(secretKey: string) {
    if (!secretKey) throw new Error("PAYSTACK_SECRET_KEY is required");
    if (secretKey.includes("REPLACE_WITH") || secretKey.includes("xxxx")) {
      throw new Error("PAYSTACK_SECRET_KEY is not configured — replace the placeholder value before deploying");
    }
    this.secretKey = secretKey;
  }

  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Paystack API error ${res.status}: ${body}`);
    }
    return res.json() as Promise<T>;
  }

  async initializePayment(params: PaymentParams): Promise<PaymentInitResult> {
    const body = {
      email: params.email,
      amount: Math.round(params.amount * 100),
      currency: params.currency,
      reference: params.reference,
      callback_url: params.callbackUrl,
      metadata: params.metadata,
      channels: params.channels ?? ["card", "mobile_money", "bank_transfer"],
    };

    const res = await this.request<PaystackInitResponse>("/transaction/initialize", {
      method: "POST",
      body: JSON.stringify(body),
    });

    if (!res.status || !res.data) {
      return { success: false, authorizationUrl: "", reference: params.reference };
    }

    return {
      success: true,
      authorizationUrl: res.data.authorization_url,
      reference: res.data.reference,
      accessCode: res.data.access_code,
    };
  }

  async verifyPayment(reference: string): Promise<PaymentVerifyResult> {
    const res = await this.request<PaystackVerifyResponse>(`/transaction/verify/${encodeURIComponent(reference)}`);

    if (!res.status || !res.data) {
      return { success: false, reference, status: "failed", amount: 0, currency: "GHS" };
    }

    const d = res.data;
    const success = d.status === "success";

    return {
      success,
      reference: d.reference,
      status: (d.status as PaymentVerifyResult["status"]) ?? "failed",
      amount: d.amount / 100,
      currency: d.currency,
      paidAt: d.paid_at ? new Date(d.paid_at) : undefined,
      channel: d.channel,
      gatewayResponse: d.gateway_response,
      metadata: d.metadata,
    };
  }

  verifyWebhook(payload: string, signature: string): boolean {
    const hash = crypto
      .createHmac("sha512", this.secretKey)
      .update(payload)
      .digest("hex");
    // Constant-time comparison prevents timing side-channel attacks (HMAC forgery)
    if (hash.length !== signature.length) return false;
    try {
      return crypto.timingSafeEqual(
        Buffer.from(hash, "hex"),
        Buffer.from(signature, "hex"),
      );
    } catch {
      return false;
    }
  }

  parseWebhookEvent(payload: Record<string, unknown>): WebhookEvent {
    const event = payload.event as string;
    const data = (payload.data ?? {}) as Record<string, unknown>;

    return {
      type: event as WebhookEvent["type"],
      reference: (data.reference as string) ?? "",
      amount: typeof data.amount === "number" ? data.amount / 100 : 0,
      currency: (data.currency as string) ?? "GHS",
      data,
    };
  }

  async refund(reference: string, amount?: number): Promise<{ success: boolean; refundId?: string }> {
    const body: Record<string, unknown> = { transaction: reference };
    if (amount !== undefined) body.amount = Math.round(amount * 100);

    const res = await this.request<PaystackRefundResponse>("/refund", {
      method: "POST",
      body: JSON.stringify(body),
    });

    return { success: res.status, refundId: res.data?.id };
  }
}
