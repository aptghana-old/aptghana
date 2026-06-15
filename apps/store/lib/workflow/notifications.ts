import { BASE_URL, emailService, type WorkflowItem, type WorkflowRequestKind } from "@apt/email";
import { EMAIL_SALES as EMAIL_SALES_DEFAULT, ADMIN_URL as ADMIN_URL_DEFAULT } from "@apt/config";

/**
 * Workflow email dispatch. Callers run these inside `after()` from
 * "next/server" so sends never block the user-facing response; the email
 * service itself retries with backoff and logs every attempt to EmailLog.
 */

export const SALES_EMAIL = process.env.SALES_EMAIL ?? EMAIL_SALES_DEFAULT;
export const ADMIN_URL = (process.env.ADMIN_URL ?? ADMIN_URL_DEFAULT).replace(/\/$/, "");
export const STORE_URL = BASE_URL.replace(/\/$/, "");

export interface WorkflowQuoteData {
  id: string;
  ref: string;
  quoteNumber?: string;
  kind?: WorkflowRequestKind;
  source: "single_product" | "cart" | "custom";
  client: {
    name: string;
    firstName?: string;
    email: string;
    phone?: string;
    company?: string;
    country?: string;
    address?: string;
  };
  items: {
    name?: string;
    description: string;
    sku?: string;
    brand?: string;
    quantity: number;
    unitPrice?: number;
    lineTotal?: number;
    notes?: string;
  }[];
  note?: string;
  userId?: string;
}

export function toEmailItems(items: WorkflowQuoteData["items"]): WorkflowItem[] {
  return items.map((i) => ({
    name:      i.name || i.description,
    sku:       i.sku,
    brand:     i.brand,
    quantity:  i.quantity,
    unitPrice: i.unitPrice,
    lineTotal: i.lineTotal,
    notes:     i.notes,
  }));
}

/** RFQ submitted → confirmation to the customer + alert to the sales team. */
export async function sendRfqSubmittedEmails(quote: WorkflowQuoteData): Promise<void> {
  const items = toEmailItems(quote.items);
  const firstName = quote.client.firstName || quote.client.name.split(/\s+/)[0];

  await Promise.allSettled([
    emailService.send(
      quote.client.email,
      {
        kind: "rfq-customer",
        payload: {
          name:     firstName,
          company:  quote.client.company,
          rfqRef:   quote.ref,
          trackUrl: `${STORE_URL}/account/quotes`,
          items,
          message:  quote.note,
          currency: "GHS",
          kind:     quote.kind,
        },
      },
      { userId: quote.userId, meta: { quoteId: quote.id, ref: quote.ref } },
    ),
    emailService.send(
      SALES_EMAIL,
      {
        kind: "rfq-sales",
        payload: {
          rfqRef:    quote.ref,
          reviewUrl: `${ADMIN_URL}/dashboard/quotes/${quote.id}`,
          customer: {
            name:    quote.client.name,
            company: quote.client.company,
            email:   quote.client.email,
            phone:   quote.client.phone,
            country: quote.client.country,
            address: quote.client.address,
          },
          items,
          message: quote.note,
          source:  quote.source,
          currency: "GHS",
          kind:     quote.kind,
        },
      },
      { replyTo: quote.client.email, meta: { quoteId: quote.id, ref: quote.ref } },
    ),
  ]);
}

/** Payment confirmed → receipt to the customer + alert to the sales team. */
export async function sendPaymentEmails(args: {
  quote: WorkflowQuoteData & { quoteNumber: string };
  amount: number;
  currency: string;
  paymentReference: string;
  channel?: string;
  paidAt: Date;
  payToken: string;
}): Promise<void> {
  const { quote, amount, currency, paymentReference, channel, paidAt, payToken } = args;
  const firstName = quote.client.firstName || quote.client.name.split(/\s+/)[0];
  const paidAtLabel = paidAt.toLocaleString("en-GH", {
    day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
  });

  await Promise.allSettled([
    emailService.send(
      quote.client.email,
      {
        kind: "payment-customer",
        payload: {
          name:             firstName,
          quoteNumber:      quote.quoteNumber,
          amount,
          currency,
          paymentReference,
          channel,
          paidAt:   paidAtLabel,
          orderUrl: `${STORE_URL}/pay/${payToken}`,
        },
      },
      { userId: quote.userId, meta: { quoteId: quote.id, ref: paymentReference } },
    ),
    emailService.send(
      SALES_EMAIL,
      {
        kind: "payment-sales",
        payload: {
          quoteNumber:   quote.quoteNumber,
          rfqRef:        quote.ref,
          customerName:  quote.client.name,
          customerEmail: quote.client.email,
          company:       quote.client.company,
          amount,
          currency,
          paymentReference,
          channel,
          paidAt:   paidAtLabel,
          adminUrl: `${ADMIN_URL}/dashboard/quotes/${quote.id}`,
        },
      },
      { meta: { quoteId: quote.id, ref: paymentReference } },
    ),
  ]);
}
