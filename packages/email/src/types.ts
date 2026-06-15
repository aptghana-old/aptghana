/* ─── Result ──────────────────────────────────────────────────────────────── */
export interface EmailResult {
  success:   boolean;
  messageId: string | null;
  error:     string | null;
  retries:   number;
}

/* ─── Send options ────────────────────────────────────────────────────────── */
export interface SendOptions {
  /** Override the from address (default: process.env.EMAIL_FROM) */
  from?:      string;
  /** Reply-to address */
  replyTo?:   string;
  /** BCC addresses */
  bcc?:       string | string[];
  /** User ID for audit log association */
  userId?:    string;
  /** Max send attempts (default: 3) */
  maxRetries?: number;
  /** Additional metadata stored in the audit log */
  meta?:       Record<string, unknown>;
}

/* ─── Template-specific payloads ─────────────────────────────────────────── */

export interface VerifyEmailPayload {
  name:            string;
  verificationUrl: string;
}

export interface WelcomePayload {
  name:        string;
  accountType: "personal" | "business";
  company?:    string;
  loginUrl:    string;
}

export interface OTPPayload {
  name:    string;
  otp:     string;
  purpose: string;           // e.g. "sign in", "verify your email"
  expiresInMinutes: number;
}

export interface PasswordResetPayload {
  name:     string;
  resetUrl: string;
  expiresInMinutes: number;
}

export interface SignInAlertPayload {
  name:      string;
  timestamp: string;          // human-readable, e.g. "Mon 9 June, 14:32 UTC"
  device?:   string;          // e.g. "Chrome on Windows"
  location?: string;          // e.g. "Accra, Ghana"
  ip?:       string;
  settingsUrl: string;
}

export interface TwoFAAlertPayload {
  name:    string;
  action:  "enabled" | "disabled";
  timestamp: string;
  settingsUrl: string;
}

export interface OrderItem {
  name:       string;
  sku:        string;
  quantity:   number;
  unitPrice:  number;
  totalPrice: number;
  currency:   string;
  image?:     string;
}

export interface OrderAddress {
  line1:   string;
  line2?:  string;
  city:    string;
  region?: string;
  country: string;
}

export interface OrderConfirmationPayload {
  name:            string;
  orderRef:        string;
  orderUrl:        string;
  items:           OrderItem[];
  subtotal:        number;
  shipping:        number;
  tax:             number;
  total:           number;
  currency:        string;
  shippingAddress: OrderAddress;
  estimatedDelivery?: string;
}

export interface QuoteItem {
  description: string;
  sku?:        string;
  quantity:    number;
  targetPrice?: number;
}

export interface QuoteRequestPayload {
  name:       string;
  company?:   string;
  quoteRef:   string;
  quoteUrl:   string;
  items:      QuoteItem[];
  message?:   string;
  currency:   string;
}

export interface ShippingUpdatePayload {
  name:          string;
  orderRef:      string;
  orderUrl:      string;
  carrier?:      string;
  trackingNumber?: string;
  trackingUrl?:  string;
  status:        "shipped" | "out_for_delivery" | "delivered";
  estimatedDelivery?: string;
  shippingAddress: OrderAddress;
}

export interface AccountNotificationPayload {
  name:    string;
  subject: string;       // re-used as email subject
  title:   string;
  body:    string;       // plain text or simple HTML
  ctaLabel?: string;
  ctaUrl?:   string;
  type:    "info" | "warning" | "success" | "alert";
}

/* ─── RFQ → Quote → Payment workflow ──────────────────────────────────────── */

export interface WorkflowItem {
  name:       string;
  sku?:       string;
  brand?:     string;
  quantity:   number;
  unitPrice?: number;
  lineTotal?: number;
  notes?:     string;
}

export interface WorkflowTotals {
  subtotal:   number;
  discount:   number;
  taxRate:    number;
  taxAmount:  number;
  shipping:   number;
  grandTotal: number;
  currency:   string;
}

/** Cart approval requests become orders on approval; RFQs cover single/custom products. */
export type WorkflowRequestKind = "approval_request" | "rfq";

export interface RfqCustomerPayload {
  name:     string;
  company?: string;
  rfqRef:   string;
  trackUrl: string;
  items:    WorkflowItem[];
  message?: string;
  currency: string;
  kind?:    WorkflowRequestKind;
}

export interface RfqSalesPayload {
  rfqRef:    string;
  reviewUrl: string;
  customer: {
    name:     string;
    company?: string;
    email:    string;
    phone?:   string;
    country?: string;
    address?: string;
  };
  items:    WorkflowItem[];
  message?: string;
  source:   "single_product" | "cart" | "custom";
  currency: string;
  kind?:    WorkflowRequestKind;
}

export interface QuoteApprovedPayload {
  name:        string;
  company?:    string;
  quoteNumber: string;
  rfqRef:      string;
  payUrl:      string;
  items:       WorkflowItem[];
  totals:      WorkflowTotals;
  validUntil:  string;          // human-readable, e.g. "26 June 2026"
  quoteNote?:  string;
  kind?:       WorkflowRequestKind;
  /** Order created from the approved request (Awaiting Payment) */
  orderRef?:   string;
}

export interface PaymentCustomerPayload {
  name:             string;
  quoteNumber:      string;
  amount:           number;
  currency:         string;
  paymentReference: string;
  channel?:         string;
  paidAt:           string;     // human-readable
  orderUrl:         string;
}

export interface PaymentSalesPayload {
  quoteNumber:      string;
  rfqRef:           string;
  customerName:     string;
  customerEmail:    string;
  company?:         string;
  amount:           number;
  currency:         string;
  paymentReference: string;
  channel?:         string;
  paidAt:           string;
  adminUrl:         string;
}

/* ─── Union for service calls ─────────────────────────────────────────────── */
export type EmailTemplate =
  | { kind: "verify-email";          payload: VerifyEmailPayload }
  | { kind: "welcome";               payload: WelcomePayload }
  | { kind: "otp";                   payload: OTPPayload }
  | { kind: "password-reset";        payload: PasswordResetPayload }
  | { kind: "signin-alert";          payload: SignInAlertPayload }
  | { kind: "two-fa-alert";          payload: TwoFAAlertPayload }
  | { kind: "order-confirmation";    payload: OrderConfirmationPayload }
  | { kind: "quote-request";         payload: QuoteRequestPayload }
  | { kind: "shipping-update";       payload: ShippingUpdatePayload }
  | { kind: "account-notification";  payload: AccountNotificationPayload }
  | { kind: "rfq-customer";          payload: RfqCustomerPayload }
  | { kind: "rfq-sales";             payload: RfqSalesPayload }
  | { kind: "quote-approved";        payload: QuoteApprovedPayload }
  | { kind: "payment-customer";      payload: PaymentCustomerPayload }
  | { kind: "payment-sales";         payload: PaymentSalesPayload };

export type EmailKind = EmailTemplate["kind"];
