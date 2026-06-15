/* Single source of company identity for generated documents. */

import { EMAIL_SALES, STORE_DOMAIN } from "@apt/config";

export const COMPANY = {
  name: "APT Ghana",
  legalName: "Automation & Plant Technologies Ltd",
  tagline: "Industrial Automation & Electrical Distribution",
  address: "Plot 48 Liberation Road, Airport City, Accra, Ghana",
  phone: "+233 302 000 000",
  email: EMAIL_SALES,
  website: STORE_DOMAIN,
  /** Default terms paragraph printed in document footers */
  terms:
    "Prices are quoted in the stated currency and remain valid until the date shown. " +
    "Goods remain the property of Automation & Plant Technologies Ltd until paid for in full. " +
    "Delivery timelines are estimates and subject to stock confirmation. " +
    `For questions about this document, contact ${EMAIL_SALES} or +233 302 000 000.`,
} as const;

export function formatMoney(amount: number, currency: string): string {
  return `${currency} ${amount.toLocaleString("en-GH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatDate(d: Date | string | undefined | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}
