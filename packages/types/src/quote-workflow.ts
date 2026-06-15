// Type-only import — erased at compile time, so the index↔workflow cycle has no runtime cost
import type { QuoteStatus, QuoteTotals } from "./index";

/* ─── Status machine (pure, client-safe) ──────────────────────────────────── */

/**
 * Allowed forward transitions. Anything not listed here is rejected by
 * assertTransition — the single gate for workflow moves, shared verbatim
 * between the admin editor (UI affordances) and the API routes (enforcement).
 */
export const QUOTE_TRANSITIONS: Partial<Record<QuoteStatus, QuoteStatus[]>> = {
  draft:              ["pending", "cancelled"],
  pending:            ["reviewing", "approved", "cancelled"],
  reviewing:          ["waiting_customer", "approved", "pending", "cancelled"],
  waiting_customer:   ["reviewing", "approved", "cancelled", "expired"],
  approved:           ["paid", "cancelled", "expired"],
  paid:               ["processing", "cancelled"],
  processing:         ["ready_for_delivery", "cancelled"],
  ready_for_delivery: ["shipped", "cancelled"],
  shipped:            ["delivered"],
  delivered:          ["completed"],
  expired:            ["reviewing", "cancelled"],
  // Legacy statuses can be pulled into the new workflow
  quoted:             ["approved", "cancelled", "expired"],
  accepted:           ["approved", "paid", "cancelled"],
};

export function canTransition(from: QuoteStatus, to: QuoteStatus): boolean {
  return QUOTE_TRANSITIONS[from]?.includes(to) ?? false;
}

export class QuoteWorkflowError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "QuoteWorkflowError";
  }
}

export function assertTransition(from: QuoteStatus, to: QuoteStatus): void {
  if (!canTransition(from, to)) {
    throw new QuoteWorkflowError(`Invalid status transition: ${from} → ${to}`);
  }
}

/** Statuses in which sales may edit items and pricing. */
export const EDITABLE_STATUSES: QuoteStatus[] = ["draft", "pending", "reviewing", "waiting_customer"];

/** Statuses from which a quote can be approved. */
export const APPROVABLE_STATUSES: QuoteStatus[] = ["pending", "reviewing", "waiting_customer"];

/* ─── Money math (pure, client-safe) ──────────────────────────────────────── */

export interface TotalsInput {
  items: { quantity: number; unitPrice?: number }[];
  discount?: number;
  taxRate?: number;
  shipping?: number;
  currency?: string;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Single source of truth for quote money math — used by the admin editor
 * (live preview), the approve endpoint (persisted totals) and the payment
 * portal (amount charged).
 */
export function computeQuoteTotals(input: TotalsInput): QuoteTotals {
  const subtotal = round2(
    input.items.reduce((sum, i) => sum + (i.unitPrice ?? 0) * i.quantity, 0)
  );
  const discount = round2(Math.min(Math.max(0, input.discount ?? 0), subtotal));
  const taxRate = Math.max(0, input.taxRate ?? 0);
  const taxable = subtotal - discount;
  const taxAmount = round2(taxable * (taxRate / 100));
  const shipping = round2(Math.max(0, input.shipping ?? 0));
  return {
    subtotal,
    discount,
    taxRate,
    taxAmount,
    shipping,
    grandTotal: round2(taxable + taxAmount + shipping),
    currency: input.currency ?? "GHS",
  };
}

/** Every line priced and strictly positive — approval precondition. */
export function allItemsPriced(items: { quantity: number; unitPrice?: number }[]): boolean {
  return items.length > 0 && items.every((i) => typeof i.unitPrice === "number" && i.unitPrice > 0);
}
