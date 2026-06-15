export interface PaymentParams {
  amount: number;
  currency: string;
  email: string;
  reference: string;
  callbackUrl: string;
  metadata?: Record<string, unknown>;
  channels?: string[];
}

export interface PaymentInitResult {
  success: boolean;
  authorizationUrl: string;
  reference: string;
  accessCode?: string;
}

export interface PaymentVerifyResult {
  success: boolean;
  reference: string;
  status: "success" | "failed" | "abandoned" | "pending";
  amount: number;
  currency: string;
  paidAt?: Date;
  channel?: string;
  gatewayResponse?: string;
  metadata?: Record<string, unknown>;
}

export type WebhookEventType =
  | "charge.success"
  | "charge.dispute.create"
  | "charge.dispute.resolve"
  | "transfer.success"
  | "transfer.failed"
  | "refund.processed"
  | "payment_request.pending"
  | "payment_request.success";

export interface WebhookEvent {
  type: WebhookEventType;
  reference: string;
  amount: number;
  currency: string;
  data: Record<string, unknown>;
}

export interface PaymentProvider {
  readonly name: string;
  initializePayment(params: PaymentParams): Promise<PaymentInitResult>;
  verifyPayment(reference: string): Promise<PaymentVerifyResult>;
  verifyWebhook(payload: string, signature: string): boolean;
  parseWebhookEvent(payload: Record<string, unknown>): WebhookEvent;
  refund(reference: string, amount?: number): Promise<{ success: boolean; refundId?: string }>;
}
