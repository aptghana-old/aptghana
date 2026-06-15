/* Shared document model — one shape feeds every PDF variant. */

export type DocumentKind = "quote" | "proforma" | "order" | "invoice" | "receipt";

export interface DocumentParty {
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  address?: string;
  country?: string;
}

export interface DocumentLine {
  name: string;
  sku?: string;
  brand?: string;
  quantity: number;
  unitPrice?: number;
  lineTotal?: number;
  notes?: string;
}

export interface DocumentTotals {
  subtotal: number;
  discount: number;
  taxRate: number;
  taxAmount: number;
  shipping: number;
  grandTotal: number;
  currency: string;
}

export interface DocumentPayment {
  reference: string;
  channel?: string;
  paidAt?: string;   // human-readable
  amount?: number;
}

export interface BusinessDocumentData {
  kind: DocumentKind;
  /** Document number shown top-right, e.g. QT-260612-9C21 / ORD-… */
  number: string;
  /** Originating reference, e.g. "From request RFA-260612-AB12" */
  reference?: string;
  date: string;          // human-readable issue date
  validUntil?: string;   // quotes/proformas
  statusLabel?: string;  // e.g. "Awaiting Payment", "PAID"
  customer: DocumentParty;
  lines: DocumentLine[];
  totals?: DocumentTotals;
  /** RFQs before pricing hide the price columns */
  showPrices: boolean;
  note?: string;         // customer-facing note from sales
  payment?: DocumentPayment;
  /** Override the default terms paragraph */
  terms?: string;
}

/* ─── Bulk export datasets ────────────────────────────────────────────────── */

export interface ExportColumn {
  key: string;
  header: string;
  /** Excel column width (chars); also drives PDF column flex */
  width?: number;
  align?: "left" | "right";
  money?: boolean;
}

export type ExportRow = Record<string, string | number | null>;

export interface ExportData {
  title: string;
  /** Human description of applied filters, e.g. "Status: paid · 01 Jun – 12 Jun 2026" */
  subtitle?: string;
  columns: ExportColumn[];
  rows: ExportRow[];
}
