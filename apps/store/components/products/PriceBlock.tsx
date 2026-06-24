import type { ProductCardData } from "./ProductCard";

/* ─── Types ───────────────────────────────────────────────────────────────── */
export type PriceBlockSize = "sm" | "md" | "lg";

interface Props {
  pricing: ProductCardData["pricing"];
  discount?: number;   // percentage 0–100
  size?: PriceBlockSize;
  className?: string;
}

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
function fmt(amount: number, currency: string): string {
  return `${currency} ${amount.toLocaleString("en", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/* ─── PriceBlock ──────────────────────────────────────────────────────────── */
export function PriceBlock({
  pricing,
  discount = 0,
  size = "sm",
  className = "",
}: Props) {
  const {
    listPrice,
    tradePrice,
    currency,
    minimumOrderQty,
    taxLabel = "exc. VAT",
    taxRate,
    unit,
  } = pricing;

  const minQty = minimumOrderQty ?? 1;

  /* ── Price on Request ─────────────────────────────────────────────────── */
  if (!listPrice || listPrice <= 0) {
    if (size === "lg") {
      return (
        <div className={`flex flex-col gap-0.5 ${className}`}>
          <span className="text-xl font-bold text-se-green">Price on Request</span>
          <span className="text-xs text-(--text-4)">Contact us for pricing &amp; availability</span>
        </div>
      );
    }
    if (size === "md") {
      return (
        <div className={`flex flex-col gap-px ${className}`}>
          <span className="text-sm font-bold text-se-green">Price on Request</span>
          <span className="text-[10px] text-(--text-4)">Contact us for pricing</span>
        </div>
      );
    }
    return (
      <div className={`flex flex-col gap-px ${className}`}>
        <span className="text-[11px] font-bold text-se-green leading-tight">Price on Request</span>
      </div>
    );
  }

  /* ── Compute effective price ──────────────────────────────────────────── */
  const discountPct  = Math.max(0, Math.min(100, discount));
  const hasDiscount  = discountPct > 0;
  const afterDisc    = hasDiscount ? round2(listPrice * (1 - discountPct / 100)) : listPrice;

  // Trade price applies when lower than the already-discounted price
  const hasTradePrice = (tradePrice ?? 0) > 0 && (tradePrice as number) < afterDisc;
  const bestPrice     = hasTradePrice ? (tradePrice as number) : afterDisc;

  // Original price to cross out (catalogue list price, pre-discount)
  const crossedPrice = (hasDiscount || hasTradePrice) ? listPrice : null;

  // Savings amount
  const savedAmt  = crossedPrice ? round2(crossedPrice - bestPrice) : 0;
  const hasSavings = savedAmt > 0;

  // Inc-VAT price (shown only in lg with taxRate provided)
  const inclPrice = taxRate && taxRate > 0 ? round2(bestPrice * (1 + taxRate)) : null;

  /* ── Compact grid card ────────────────────────────────────────────────── */
  if (size === "sm") {
    return (
      <div className={`flex flex-col gap-px ${className}`}>

        {/* Main price */}
        <div className="flex items-baseline gap-1.5 flex-wrap">
          <span className="text-[12px] sm:text-[13px] font-bold text-(--text-1) leading-tight">
            {fmt(bestPrice, currency)}
          </span>
          {hasTradePrice && (
            <span className="text-[8px] font-black text-se-green uppercase tracking-widest">
              Trade
            </span>
          )}
        </div>

        {/* Crossed-out + tax label on one line */}
        <div className="flex items-center gap-1.5 flex-wrap leading-none">
          {crossedPrice && (
            <span className="text-[9px] text-(--text-4) line-through">
              {fmt(crossedPrice, currency)}
            </span>
          )}
          {taxLabel && (
            <span className="text-[9px] text-(--text-4)">{taxLabel}</span>
          )}
        </div>

        {/* Savings */}
        {hasSavings && (
          <span className="text-[9px] font-semibold text-se-green leading-none">
            Save {fmt(savedAmt, currency)}{hasDiscount ? ` (${discountPct}% off)` : ""}
          </span>
        )}

        {/* Min qty / unit */}
        {(minQty > 1 || unit) && (
          <span className="text-[9px] text-(--text-4) leading-none">
            {[minQty > 1 ? `Min. ${minQty}` : null, unit].filter(Boolean).join(" · ")}
          </span>
        )}
      </div>
    );
  }

  /* ── List card ────────────────────────────────────────────────────────── */
  if (size === "md") {
    return (
      <div className={`flex flex-col gap-0.5 ${className}`}>

        {/* Price row — main + crossed out side by side */}
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-sm font-bold text-(--text-1)">
            {fmt(bestPrice, currency)}
          </span>
          {crossedPrice && (
            <span className="text-[11px] text-(--text-4) line-through">
              {fmt(crossedPrice, currency)}
            </span>
          )}
          {hasTradePrice && (
            <span className="text-[9px] font-black text-se-green uppercase tracking-widest">
              Trade
            </span>
          )}
        </div>

        {/* Meta row — tax · savings · min qty */}
        <div className="flex items-center gap-2 flex-wrap text-[10px] text-(--text-4) leading-none">
          {taxLabel && <span>{taxLabel}</span>}
          {hasSavings && (
            <span className="text-se-green font-semibold">
              Save {fmt(savedAmt, currency)}{hasDiscount ? ` (${discountPct}%)` : ""}
            </span>
          )}
          {minQty > 1 && (
            <span>Min. {minQty}{unit ? ` · ${unit}` : ""}</span>
          )}
          {unit && minQty <= 1 && <span>{unit}</span>}
        </div>
      </div>
    );
  }

  /* ── Quick-view / full detail ─────────────────────────────────────────── */
  return (
    <div className={`flex flex-col gap-1 ${className}`}>

      {/* Main price + trade badge */}
      <div className="flex items-baseline gap-2 flex-wrap">
        <span className="text-2xl font-bold text-(--text-1)">
          {fmt(bestPrice, currency)}
        </span>
        {hasTradePrice && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-green-50 text-se-green dark:bg-green-900/20 border border-green-200 dark:border-green-700">
            Trade price
          </span>
        )}
      </div>

      {/* Tax lines */}
      {taxLabel && (
        <div className="flex items-center gap-2 text-xs text-(--text-4)">
          <span>{taxLabel}</span>
          {inclPrice && taxLabel !== "inc. VAT" && (
            <span>· inc. VAT: {fmt(inclPrice, currency)}</span>
          )}
        </div>
      )}

      {/* Crossed-out + savings */}
      {crossedPrice && (
        <div className="flex items-center gap-2 flex-wrap text-sm">
          <span className="text-(--text-4) line-through text-xs">
            was {fmt(crossedPrice, currency)}
          </span>
          {hasSavings && (
            <span className="font-semibold text-se-green text-xs">
              Save {fmt(savedAmt, currency)}{hasDiscount ? ` (${discountPct}% off)` : ""}
            </span>
          )}
        </div>
      )}

      {/* Min qty + unit */}
      {(minQty > 1 || unit) && (
        <p className="text-xs text-(--text-4)">
          {[minQty > 1 ? `Min. ${minQty} units` : null, unit].filter(Boolean).join(" · ")}
        </p>
      )}
    </div>
  );
}
