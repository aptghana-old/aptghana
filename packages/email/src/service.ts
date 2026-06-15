import { render } from "@react-email/components";
import * as React from "react";
import { DEFAULT_FROM, getResendClient } from "./client";
import { logEmail } from "./logger";
import {
  AccountNotificationTemplate,
  OTPTemplate,
  OrderConfirmationTemplate,
  PasswordResetTemplate,
  PaymentCustomerTemplate,
  PaymentSalesTemplate,
  QuoteApprovedTemplate,
  QuoteRequestTemplate,
  RfqCustomerTemplate,
  RfqSalesTemplate,
  ShippingUpdateTemplate,
  SignInAlertTemplate,
  TwoFAAlertTemplate,
  VerifyEmailTemplate,
  WelcomeTemplate,
} from "./templates/index";
import type {
  EmailKind,
  EmailResult,
  EmailTemplate,
  SendOptions,
} from "./types";

/* ─── Subject lines ─────────────────────────────────────────────────────────── */
function getSubject(template: EmailTemplate): string {
  switch (template.kind) {
    case "verify-email":
      return "Verify your APT Ghana account";
    case "welcome":
      return `Welcome to APT Ghana, ${template.payload.name}!`;
    case "otp":
      return `Your APT Ghana verification code`;
    case "password-reset":
      return "Reset your APT Ghana password";
    case "signin-alert":
      return "New sign-in to your APT Ghana account";
    case "two-fa-alert":
      return `Two-factor authentication ${template.payload.action} — APT Ghana`;
    case "order-confirmation":
      return `Order confirmed — ${template.payload.orderRef}`;
    case "quote-request":
      return `Quote request received — ${template.payload.quoteRef}`;
    case "shipping-update": {
      const labels: Record<string, string> = {
        shipped:           "Your order has shipped",
        out_for_delivery:  "Out for delivery today",
        delivered:         "Your order has been delivered",
      };
      return `${labels[template.payload.status] ?? "Shipping update"} — ${template.payload.orderRef}`;
    }
    case "account-notification":
      return template.payload.subject;
    case "rfq-customer":
      return template.payload.kind === "approval_request"
        ? `We've received your procurement request (${template.payload.rfqRef})`
        : `We've received your quotation request (${template.payload.rfqRef})`;
    case "rfq-sales":
      return template.payload.kind === "approval_request"
        ? `New Procurement Request (${template.payload.rfqRef})`
        : `New RFQ Received (${template.payload.rfqRef})`;
    case "quote-approved":
      return template.payload.kind === "approval_request" && template.payload.orderRef
        ? `Your order is approved — payment due (${template.payload.orderRef})`
        : `Your quotation has been approved (${template.payload.quoteNumber})`;
    case "payment-customer":
      return `Payment Received (${template.payload.quoteNumber})`;
    case "payment-sales":
      return `Quote Paid (${template.payload.quoteNumber})`;
  }
}

/* ─── React → HTML ──────────────────────────────────────────────────────────── */
async function renderTemplate(template: EmailTemplate): Promise<string> {
  let element: React.ReactElement;

  switch (template.kind) {
    case "verify-email":
      element = React.createElement(VerifyEmailTemplate, template.payload);
      break;
    case "welcome":
      element = React.createElement(WelcomeTemplate, template.payload);
      break;
    case "otp":
      element = React.createElement(OTPTemplate, template.payload);
      break;
    case "password-reset":
      element = React.createElement(PasswordResetTemplate, template.payload);
      break;
    case "signin-alert":
      element = React.createElement(SignInAlertTemplate, template.payload);
      break;
    case "two-fa-alert":
      element = React.createElement(TwoFAAlertTemplate, template.payload);
      break;
    case "order-confirmation":
      element = React.createElement(OrderConfirmationTemplate, template.payload);
      break;
    case "quote-request":
      element = React.createElement(QuoteRequestTemplate, template.payload);
      break;
    case "shipping-update":
      element = React.createElement(ShippingUpdateTemplate, template.payload);
      break;
    case "account-notification":
      element = React.createElement(AccountNotificationTemplate, template.payload);
      break;
    case "rfq-customer":
      element = React.createElement(RfqCustomerTemplate, template.payload);
      break;
    case "rfq-sales":
      element = React.createElement(RfqSalesTemplate, template.payload);
      break;
    case "quote-approved":
      element = React.createElement(QuoteApprovedTemplate, template.payload);
      break;
    case "payment-customer":
      element = React.createElement(PaymentCustomerTemplate, template.payload);
      break;
    case "payment-sales":
      element = React.createElement(PaymentSalesTemplate, template.payload);
      break;
  }

  return render(element);
}

/* ─── Exponential backoff ───────────────────────────────────────────────────── */
function backoff(attempt: number): number {
  // 500ms, 1000ms, 2000ms — with jitter
  return Math.min(500 * Math.pow(2, attempt) + Math.random() * 200, 8000);
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

const TRANSIENT_CODES = new Set([429, 500, 502, 503, 504]);

function isTransient(err: unknown): boolean {
  if (err instanceof Error && "statusCode" in err) {
    return TRANSIENT_CODES.has((err as { statusCode: number }).statusCode);
  }
  return true; // unknown errors are treated as transient
}

/* ─── Dev fallback ──────────────────────────────────────────────────────────── */
function devLog(to: string, subject: string, kind: EmailKind): string {
  const id = `dev_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  console.log(
    `\n📧 [apt/email] DEV MODE — email not sent\n` +
    `   To:       ${to}\n` +
    `   Subject:  ${subject}\n` +
    `   Template: ${kind}\n` +
    `   ID:       ${id}\n`
  );
  return id;
}

/* ─── Email service ─────────────────────────────────────────────────────────── */
export class EmailService {
  async send(
    to: string,
    template: EmailTemplate,
    opts: SendOptions = {},
  ): Promise<EmailResult> {
    const { from = DEFAULT_FROM, replyTo, bcc, userId, maxRetries = 3, meta } = opts;
    const subject = getSubject(template);
    const kind = template.kind;
    const isDev = !process.env.RESEND_API_KEY;

    let retries = 0;
    let lastError: string | null = null;
    let messageId: string | null = null;

    // Dev fallback — no API key
    if (isDev) {
      messageId = devLog(to, subject, kind);
      await logEmail({ to, subject, template: kind, status: "sent", messageId, error: null, retries: 0, userId, meta });
      return { success: true, messageId, error: null, retries: 0 };
    }

    const html = await renderTemplate(template);

    while (retries <= maxRetries) {
      try {
        const client = getResendClient();
        const result = await client.emails.send({
          from,
          to,
          subject,
          html,
          ...(replyTo && { replyTo }),
          ...(bcc     && { bcc }),
        });

        if (result.error) {
          throw Object.assign(new Error(result.error.message), { statusCode: 400 });
        }

        messageId = result.data?.id ?? null;

        await logEmail({ to, subject, template: kind, status: "sent", messageId, error: null, retries, userId, meta });
        return { success: true, messageId, error: null, retries };

      } catch (err) {
        lastError = err instanceof Error ? err.message : String(err);
        const transient = isTransient(err);

        if (!transient || retries >= maxRetries) {
          break;
        }

        retries++;
        await logEmail({ to, subject, template: kind, status: "retrying", messageId: null, error: lastError, retries, userId, meta });
        await sleep(backoff(retries - 1));
      }
    }

    // All attempts exhausted
    await logEmail({ to, subject, template: kind, status: "failed", messageId: null, error: lastError, retries, userId, meta });
    console.error(`[apt/email] Failed to send "${kind}" to ${to} after ${retries} attempt(s): ${lastError}`);
    return { success: false, messageId: null, error: lastError, retries };
  }
}

export const emailService = new EmailService();
