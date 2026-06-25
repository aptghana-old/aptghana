/* ─── Shared pricing type ──────────────────────────────────────────────────── */
export interface PricingData {
  listPrice: number;
  tradePrice?: number;
  currency: string;
  minimumOrderQty?: number;
  taxLabel?: string;
  taxRate?: number;
  unit?: string;
  leadTime?: string;
  isCustomerPrice?: boolean;
}

/* ─── Formatting helpers ───────────────────────────────────────────────────── */
export function fmtPrice(amount: number, currency: string): string {
  return `${currency} ${amount.toLocaleString("en", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/* ─── Computed pricing (shared logic, no duplication across variants) ──────── */
interface Computed {
  hasPricing: boolean;
  effectivePrice: number;
  listRef: number;
  isTradePrice: boolean;
  savingsAmt: number;
  inclPrice: number | null;
  minQty: number;
  taxLabel: string;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function computePricing(pricing: PricingData, discountPct = 0): Computed {
  const { listPrice, tradePrice, taxRate, minimumOrderQty, taxLabel = "exc. VAT" } = pricing;
  const minQty = Math.max(1, minimumOrderQty ?? 1);

  if (!listPrice || listPrice <= 0) {
    return { hasPricing: false, effectivePrice: 0, listRef: 0, isTradePrice: false, savingsAmt: 0, inclPrice: null, minQty, taxLabel };
  }

  const clampedPct  = Math.max(0, Math.min(100, discountPct));
  const afterDisc   = clampedPct > 0 ? round2(listPrice * (1 - clampedPct / 100)) : listPrice;
  const useTradePrice = (tradePrice ?? 0) > 0 && (tradePrice as number) < afterDisc;
  const effectivePrice = useTradePrice ? (tradePrice as number) : afterDisc;
  const savingsAmt  = round2(listPrice - effectivePrice);
  const inclPrice   = taxRate && taxRate > 0 ? round2(effectivePrice * (1 + taxRate)) : null;

  return { hasPricing: true, effectivePrice, listRef: listPrice, isTradePrice: useTradePrice, savingsAmt, inclPrice, minQty, taxLabel };
}

/* ─── CompactPriceBlock ────────────────────────────────────────────────────── */
// Product grid card — 2–3 rows max, mobile-first at 320px+
interface CompactProps {
  pricing: PricingData;
  discount?: number;
  className?: string;
}

export function CompactPriceBlock({ pricing, discount = 0, className = "" }: CompactProps) {
  const c = computePricing(pricing, discount);

  if (!c.hasPricing) {
    return (
      <div className={`flex flex-col gap-0.5 ${className}`}>
        <span className="text-xs font-semibold text-navy-500 leading-tight">Request Pricing</span>
        <span className="text-xs text-(--text-4) leading-tight">Contact sales</span>
      </div>
    );
  }

  const metaParts: (string | null)[] = [
    c.taxLabel || null,
    c.minQty > 1 ? `Min. ${c.minQty}` : null,
    pricing.unit ?? null,
  ];
  const meta = metaParts.filter(Boolean).join(" · ");

  return (
    <div className={`flex flex-col gap-0.5 ${className}`}>

      {/* Primary price */}
      <div className="flex items-baseline gap-1.5 min-w-0">
        <span className="text-sm font-bold text-(--text-1) leading-tight tabular-nums">
          {fmtPrice(c.effectivePrice, pricing.currency)}
        </span>
        {c.isTradePrice && (
          <span className="text-xs font-medium text-navy-500 shrink-0">Trade</span>
        )}
      </div>

      {/* List price reference — shown only when a better price applies */}
      {c.savingsAmt > 0 && (
        <span className="text-xs text-(--text-4) tabular-nums leading-tight">
          List {fmtPrice(c.listRef, pricing.currency)}
        </span>
      )}

      {/* Tax · MOQ · unit */}
      {meta && (
        <span className="text-xs text-(--text-4) leading-tight">{meta}</span>
      )}
    </div>
  );
}

/* ─── ListPriceBlock ───────────────────────────────────────────────────────── */
// Search / list view — larger hierarchy, procurement-focused layout
interface ListProps {
  pricing: PricingData;
  discount?: number;
  className?: string;
}

export function ListPriceBlock({ pricing, discount = 0, className = "" }: ListProps) {
  const c = computePricing(pricing, discount);

  if (!c.hasPricing) {
    return (
      <div className={`flex flex-col gap-1 ${className}`}>
        <span className="text-sm font-semibold text-navy-500">Request Pricing</span>
        <span className="text-xs text-(--text-4)">Contact our sales team for a quote</span>
      </div>
    );
  }

  const showSavings = c.savingsAmt > 0 && c.savingsAmt / c.listRef > 0.005;

  return (
    <div className={`flex flex-col gap-0.5 ${className}`}>

      {/* Trade/customer label */}
      {(c.isTradePrice || pricing.isCustomerPrice) && (
        <span className="text-xs font-medium uppercase tracking-wider text-(--text-4) leading-tight">
          {c.isTradePrice ? "Trade Price" : "Your Price"}
        </span>
      )}

      {/* Primary price + list reference inline */}
      <div className="flex items-baseline gap-2 flex-wrap">
        <span className="text-base font-bold text-(--text-1) tabular-nums leading-tight">
          {fmtPrice(c.effectivePrice, pricing.currency)}
        </span>
        {c.savingsAmt > 0 && (
          <span className="text-xs text-(--text-4) tabular-nums">
            List {fmtPrice(c.listRef, pricing.currency)}
          </span>
        )}
      </div>

      {/* Meta row: tax · savings · moq · unit */}
      <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5 text-xs text-(--text-4) leading-tight">
        {c.taxLabel && <span>{c.taxLabel}</span>}
        {showSavings && (
          <span className="text-navy-500 font-medium">
            Save {fmtPrice(c.savingsAmt, pricing.currency)}
          </span>
        )}
        {c.minQty > 1 && (
          <span>Min. {c.minQty}{pricing.unit ? ` ${pricing.unit}` : ""}</span>
        )}
        {pricing.unit && c.minQty <= 1 && <span>{pricing.unit}</span>}
      </div>
    </div>
  );
}

/* ─── DetailPriceBlock ─────────────────────────────────────────────────────── */
// Quick-view modals and product detail pages — full enterprise pricing panel
interface DetailProps {
  pricing: PricingData;
  discount?: number;
  rfqHref?: string;
  className?: string;
}

export function DetailPriceBlock({ pricing, discount = 0, rfqHref, className = "" }: DetailProps) {
  const c = computePricing(pricing, discount);
  const showSavings = c.savingsAmt > 0 && c.savingsAmt / c.listRef > 0.01;

  if (!c.hasPricing) {
    return (
      <div className={`flex flex-col gap-2 ${className}`}>
        <span className="text-lg font-bold text-(--text-1)">Request Pricing</span>
        <p className="text-sm text-(--text-3) leading-relaxed">
          Contact our sales team for pricing and availability.
        </p>
        {rfqHref && (
          <a
            href={rfqHref}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-navy-500 hover:text-navy-400 transition-colors"
          >
            Submit RFQ
            <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </a>
        )}
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>

      {/* Trade/customer label */}
      {(c.isTradePrice || pricing.isCustomerPrice) && (
        <span className="text-xs font-semibold uppercase tracking-wider text-navy-500">
          {c.isTradePrice ? "Trade Price" : "Your Price"}
        </span>
      )}

      {/* Primary price + list reference */}
      <div className="flex items-baseline gap-3 flex-wrap">
        <span className="text-2xl font-bold text-(--text-1) tabular-nums leading-tight">
          {fmtPrice(c.effectivePrice, pricing.currency)}
        </span>
        {showSavings && (
          <span className="text-sm text-(--text-4) tabular-nums">
            List {fmtPrice(c.listRef, pricing.currency)}
          </span>
        )}
      </div>

      {/* VAT line */}
      <div className="flex items-center flex-wrap gap-x-3 gap-y-0.5 text-sm text-(--text-4)">
        {c.taxLabel && <span>{c.taxLabel}</span>}
        {c.inclPrice && (
          <span className="text-(--text-3)">
            inc. VAT {fmtPrice(c.inclPrice, pricing.currency)}
          </span>
        )}
      </div>

      {/* Savings — subdued, plain text */}
      {showSavings && (
        <p className="text-sm text-(--text-3)">
          Saving {fmtPrice(c.savingsAmt, pricing.currency)}
        </p>
      )}

      {/* Procurement metadata */}
      {(c.minQty > 1 || pricing.unit || pricing.leadTime) && (
        <dl className="flex flex-col gap-1 mt-0.5 text-sm">
          {c.minQty > 1 && (
            <div className="flex items-center gap-2">
              <dt className="text-(--text-4) shrink-0">Min. order</dt>
              <dd className="font-medium text-(--text-1) tabular-nums">
                {c.minQty.toLocaleString()}{pricing.unit ? ` ${pricing.unit}` : " units"}
              </dd>
            </div>
          )}
          {pricing.unit && c.minQty <= 1 && (
            <div className="flex items-center gap-2">
              <dt className="text-(--text-4) shrink-0">Unit</dt>
              <dd className="font-medium text-(--text-1)">{pricing.unit}</dd>
            </div>
          )}
          {pricing.leadTime && (
            <div className="flex items-center gap-2">
              <dt className="text-(--text-4) shrink-0">Lead time</dt>
              <dd className="font-medium text-(--text-1)">{pricing.leadTime}</dd>
            </div>
          )}
        </dl>
      )}
    </div>
  );
}
