"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useCart } from "@/lib/store/cart";
import { useWishlist } from "@/lib/store/wishlist";
import { useCompare, type CompareItem } from "@/lib/store/compare";
import { computePricing, fmtPrice, DetailPriceBlock } from "./PriceBlock";
import type { PricingData } from "./PriceBlock";

/* ─── Types ───────────────────────────────────────────────────────────────── */
export type ProductCardLayout = "grid" | "list";

export interface ProductCardData {
  id: string;
  name: string;
  slug: string;
  sku?: string;
  mpn?: string;
  brandSlug: string;
  brandName?: string;
  shortDescription?: string;
  image: { url: string; alt?: string };
  pricing: PricingData;
  inStock: boolean;
  stockNote?: string;
  isClearance?: boolean;
  isNew?: boolean;
  isFeatured?: boolean;
  discount?: number;
  specs?: { name: string; value: string; unit?: string }[];
  cataloguePath?: string;
  filterTags?: string[];
  brandImage?: string;
  datasheetUrl?: string;
}

interface ProductCardProps {
  product: ProductCardData;
  layout?: ProductCardLayout;
  priority?: boolean;
}

/* ─── Utilities ───────────────────────────────────────────────────────────── */
function formatBrand(slug: string, name?: string): string {
  if (name) return name;
  return slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

function rfqHref(product: ProductCardData): string {
  return product.sku
    ? `/rfq?sku=${encodeURIComponent(product.sku)}`
    : `/rfq?product=${encodeURIComponent(product.id)}`;
}

/* ─── SVG icon helper ─────────────────────────────────────────────────────── */
function Ico({
  d, size = 16, sw = 1.75, cls = "", fill = "none",
}: {
  d: string; size?: number; sw?: number; cls?: string; fill?: string;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" className={cls} aria-hidden>
      {d.split(" M").map((seg, i) => (
        <path key={i} d={i === 0 ? seg : "M" + seg} />
      ))}
    </svg>
  );
}

const D = {
  heart: "M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z",
  heartFill: "M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001Z",
  compare: "M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5",
  eye: "M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
  cart: "M3.5 5h2.2l1.8 10.2a1.6 1.6 0 0 0 1.6 1.3h7.6a1.6 1.6 0 0 0 1.6-1.3L21 8H7",
  cartCircles: "M9.5 20a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4zm9 0a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4z",
  check: "M4.5 12.75l6 6 9-13.5",
  close: "M6 18L18 6M6 6l12 12",
  arrow: "M8.25 4.5l7.5 7.5-7.5 7.5",
  rfq: "M9 11l3 3 3-3M12 4v9M5 20h14",
  doc: "M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z M14 3v5h5 M8 13h8M8 16h5",
  box: "M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z",
  user: "M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z",
  bell: "M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0",
};

/* ─── Product image with fallback ─────────────────────────────────────────── */
function ProductImg({ url, alt, className }: { url: string; alt: string; className?: string }) {
  const [failed, setFailed] = useState(false);

  if (failed || !url) {
    return (
      <div className={`flex items-center justify-center bg-(--bg-raised) ${className ?? ""}`}>
        <Ico d={D.box} size={32} sw={1} cls="text-(--text-4)" />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={alt}
      className="w-full h-full object-contain transition-transform duration-300 group-hover/card:scale-[1.04]"
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

/* ─── Availability pill (QuickView modal only) ────────────────────────────── */
function StockBadge({ inStock }: { inStock: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 shrink-0 text-[10px] sm:text-[11px] font-semibold px-1.5 sm:px-2 py-0.5 rounded-full ${inStock
      ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
      : "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400"
      }`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${inStock ? "bg-green-500" : "bg-amber-400"}`} />
      {inStock ? "In Stock" : "On Request"}
    </span>
  );
}

/* ─── Inline stock dot indicator ──────────────────────────────────────────── */
function StockDot({ inStock, note }: { inStock: boolean; note?: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`w-2 h-2 rounded-full shrink-0 ${inStock ? "bg-se-green" : "bg-amber-400"}`} />
      <span className={`text-[11px] sm:text-[12px] font-semibold ${inStock ? "text-se-green" : "text-amber-600"}`}>
        {inStock ? "In stock" : "On back-order"}
      </span>
      {note && (
        <span className="font-mono text-[10px] sm:text-[10.5px] text-(--text-4)">{note}</span>
      )}
    </div>
  );
}

/* ─── Qty stepper ─────────────────────────────────────────────────────────── */
function QtyInput({
  qty, minQty, onChange,
}: {
  qty: number; minQty: number; onChange: (n: number) => void;
}) {
  return (
    <div className="flex items-center border border-(--border) rounded-md overflow-hidden h-9 shrink-0">
      <button
        type="button"
        onClick={() => onChange(Math.max(minQty, qty - minQty))}
        className="w-7 sm:w-8 h-full flex items-center justify-center bg-(--bg-raised) text-(--text-2) text-base hover:bg-(--bg-sunken) transition-colors border-r border-(--border)"
        aria-label="Decrease quantity"
      >−</button>
      <input
        type="number"
        value={qty}
        min={minQty}
        step={minQty}
        onChange={(e) => {
          const v = parseInt(e.target.value, 10);
          if (!isNaN(v)) onChange(Math.max(minQty, v));
        }}
        className="w-8 sm:w-9 h-full text-center font-mono text-[12px] sm:text-[13px] font-semibold text-(--text-1) bg-transparent border-none outline-none"
      />
      <button
        type="button"
        onClick={() => onChange(qty + minQty)}
        className="w-7 sm:w-8 h-full flex items-center justify-center bg-(--bg-raised) text-(--text-2) text-base hover:bg-(--bg-sunken) transition-colors border-l border-(--border)"
        aria-label="Increase quantity"
      >+</button>
    </div>
  );
}

/* ─── Sign-in nudge tooltip ───────────────────────────────────────────────── */
function SignInNudge({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <div className="absolute bottom-full right-0 mb-2 z-10 animate-fade-in pointer-events-none" role="tooltip">
      <div
        className="flex items-center gap-1.5 whitespace-nowrap px-2.5 py-1.5 rounded-lg text-[11px] font-semibold shadow-lg"
        style={{
          background: "var(--bg-raised)",
          color: "var(--text-2)",
          border: "1px solid var(--border-hi)",
          boxShadow: "var(--shadow-2)",
        }}
      >
        <Ico d={D.user} size={11} sw={2} />
        Sign in to save across devices
      </div>
      <div
        className="absolute right-2.5 top-full w-2 h-2 rotate-45 -mt-1"
        style={{ background: "var(--bg-raised)", borderRight: "1px solid var(--border-hi)", borderBottom: "1px solid var(--border-hi)" }}
      />
    </div>
  );
}

/* ─── Wishlist button ─────────────────────────────────────────────────────── */
function WishlistBtn({ productId }: { productId: string }) {
  const { has, toggle, isAuth, status } = useWishlist();
  const inWishlist = has(productId);
  const [nudge, setNudge] = useState(false);
  const nudgeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleClick = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    await toggle(productId);
    if (!isAuth) {
      setNudge(true);
      if (nudgeTimer.current) clearTimeout(nudgeTimer.current);
      nudgeTimer.current = setTimeout(() => setNudge(false), 3000);
    }
  }, [productId, toggle, isAuth]);

  useEffect(() => () => { if (nudgeTimer.current) clearTimeout(nudgeTimer.current); }, []);

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        disabled={status === "syncing"}
        aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
        aria-pressed={inWishlist}
        className={`w-7 h-7 flex items-center justify-center rounded-[5px] border transition-all cursor-pointer ${inWishlist
          ? "bg-red-500 border-red-500 text-white"
          : "bg-white border-(--border-hi) text-(--text-3) hover:border-red-300 hover:text-red-400"
          }`}
      >
        {status === "syncing"
          ? <span className="w-3 h-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
          : <Ico d={inWishlist ? D.heartFill : D.heart} size={13} sw={1.8} fill={inWishlist ? "currentColor" : "none"} />
        }
      </button>
      <SignInNudge visible={nudge} />
    </div>
  );
}

/* ─── Compare button ──────────────────────────────────────────────────────── */
function CompareBtn({
  product, size = "sm", showLabel = false,
}: {
  product: ProductCardData; size?: "sm" | "md"; showLabel?: boolean;
}) {
  const { has, toggle, isAtMax } = useCompare();
  const inCompare = has(product.id);
  const disabled = isAtMax && !inCompare;

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    const item: CompareItem = {
      id: product.id,
      name: product.name,
      slug: product.slug,
      imageUrl: product.image.url,
      brandName: formatBrand(product.brandSlug, product.brandName),
    };
    toggle(item);
  }, [product, toggle]);

  if (showLabel) {
    return (
      <button
        onClick={handleClick}
        disabled={disabled}
        aria-label={inCompare ? "Remove from compare" : disabled ? "Compare list is full" : "Add to compare"}
        aria-pressed={inCompare}
        title={disabled ? "Compare list is full (max 4)" : undefined}
        className={`flex items-center gap-1.5 text-[11.5px] font-medium text-(--text-3) hover:text-(--text-1) transition-colors ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
      >
        <span className={`w-3.5 h-3.5 rounded-[3px] border-[1.5px] flex items-center justify-center text-[9px] transition-colors shrink-0 ${inCompare ? "bg-navy-500 border-navy-500 text-white" : "border-(--border-hi) text-transparent"}`}>
          {inCompare && "✓"}
        </span>
        Compare
      </button>
    );
  }

  const smCls = `w-7 h-7 rounded flex items-center justify-center transition-colors ${inCompare ? "text-navy-500" : "text-(--text-4) hover:text-navy-500"}`;
  const mdCls = `w-8 h-8 rounded-lg flex items-center justify-center border transition-all ${inCompare
    ? "bg-navy-50 border-navy-300 text-navy-500"
    : "border-(--border) text-(--text-3) hover:border-navy-300 hover:text-navy-400"}`;

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      aria-label={inCompare ? "Remove from compare" : disabled ? "Compare list is full" : "Add to compare"}
      aria-pressed={inCompare}
      title={disabled ? "Compare list is full (max 4)" : undefined}
      className={`${size === "sm" ? smCls : mdCls} ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
    >
      <Ico d={D.compare} size={12} sw={2} />
    </button>
  );
}

/* ─── Cart button (QuickView modal only) ──────────────────────────────────── */
function CartBtn({
  product, className = "",
}: {
  product: ProductCardData; className?: string;
}) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    add({
      id: product.id,
      sku: product.sku,
      name: product.name,
      imageUrl: product.image.url,
      price: product.pricing.listPrice,
      currency: product.pricing.currency,
      minQty: product.pricing.minimumOrderQty ?? 1,
    }, product.pricing.minimumOrderQty ?? 1);
    setAdded(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setAdded(false), 1800);
  }, [product, add]);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  return (
    <button
      onClick={handleClick}
      className={`${className} flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${added ? "bg-se-green text-white" : "bg-navy-500 hover:bg-navy-600 text-white"}`}
    >
      <Ico d={added ? D.check : D.cart} size={13} sw={2.5} />
      {added ? "Added!" : "Add to Cart"}
    </button>
  );
}

/* ─── Quick View modal (portal) ───────────────────────────────────────────── */
function QuickViewModal({
  product, onClose,
}: {
  product: ProductCardData; onClose: () => void;
}) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", esc);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", esc);
      if (timer.current) clearTimeout(timer.current);
    };
  }, [onClose]);

  const handleAdd = () => {
    add({
      id: product.id,
      sku: product.sku,
      name: product.name,
      imageUrl: product.image.url,
      price: product.pricing.listPrice,
      currency: product.pricing.currency,
      minQty: product.pricing.minimumOrderQty ?? 1,
    }, product.pricing.minimumOrderQty ?? 1);
    setAdded(true);
    timer.current = setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className="fixed inset-0 z-200 flex items-center justify-center p-4" role="dialog" aria-modal aria-label={`Quick view: ${product.name}`}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto bg-(--bg-surface) rounded-2xl shadow-[0_24px_80px_rgba(0,0,0,0.35)] flex flex-col sm:flex-row">

        <button onClick={onClose} aria-label="Close quick view"
          className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-(--bg-raised) flex items-center justify-center text-(--text-3) hover:text-(--text-1) transition-colors">
          <Ico d={D.close} size={14} sw={2.5} />
        </button>

        <div className="sm:w-56 shrink-0 aspect-square sm:aspect-auto sm:h-auto bg-(--bg-raised) rounded-2xl sm:rounded-r-none overflow-hidden">
          <ProductImg url={product.image.url} alt={product.image.alt || product.name} className="w-full h-full" />
        </div>

        <div className="flex-1 p-5 flex flex-col min-w-0">
          <p className="text-[11px] font-bold text-navy-500 uppercase tracking-wide mb-1">
            {formatBrand(product.brandSlug, product.brandName)}
          </p>
          <h2 className="text-lg font-bold text-(--text-1) leading-snug mb-2">{product.name}</h2>

          {(product.sku || product.mpn) && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-3">
              {product.sku && <span className="text-[11px] font-mono text-(--text-4)">SKU {product.sku}</span>}
              {product.mpn && <span className="text-[11px] font-mono text-(--text-4)">MPN {product.mpn}</span>}
            </div>
          )}

          {product.shortDescription && (
            <p className="text-sm text-(--text-2) leading-relaxed line-clamp-4 mb-3">
              {product.shortDescription}
            </p>
          )}

          {product.specs && product.specs.length > 0 && (
            <div className="mb-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-(--text-4) mb-2">Key Specifications</p>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
                {product.specs.slice(0, 6).map((s) => (
                  <div key={s.name}>
                    <dt className="text-[10px] text-(--text-4)">{s.name}</dt>
                    <dd className="text-[12px] font-semibold text-(--text-1)">{s.value}{s.unit ? ` ${s.unit}` : ""}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          <div className="mt-auto pt-3 border-t border-(--border)">
            <div className="flex items-start justify-between gap-3 mb-3">
              <DetailPriceBlock pricing={product.pricing} discount={product.discount} rfqHref={rfqHref(product)} />
              <StockBadge inStock={product.inStock} />
            </div>

            <div className="flex gap-2">
              <button onClick={handleAdd}
                className={`flex-1 flex items-center justify-center gap-2 h-10 rounded-xl text-sm font-bold transition-all ${added ? "bg-se-green text-white" : "bg-navy-500 hover:bg-navy-600 text-white"}`}>
                <Ico d={added ? D.check : D.cart} size={15} sw={2.5} />
                {added ? "Added!" : "Add to Cart"}
              </button>
              <Link href={rfqHref(product)} onClick={onClose}
                className="flex-1 flex items-center justify-center gap-2 h-10 rounded-xl text-sm font-bold border border-(--border) text-(--text-1) hover:border-navy-500/40 hover:text-navy-500 transition-colors">
                <Ico d={D.rfq} size={14} sw={2} />
                Request Quote
              </Link>
            </div>

            <Link href={`/products/${product.slug}`} onClick={onClose}
              className="flex items-center justify-center gap-1 mt-3 text-xs font-semibold text-navy-500 hover:text-navy-400 transition-colors">
              View Full Details
              <Ico d={D.arrow} size={12} sw={2.5} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Specs table ─────────────────────────────────────────────────────────── */
function SpecsTable({
  specs, maxRows = 3,
}: {
  specs: { name: string; value: string; unit?: string }[]; maxRows?: number;
}) {
  return (
    <div className="border border-(--border) rounded-md overflow-hidden">
      {specs.slice(0, maxRows).map((s, i) => (
        <div
          key={s.name}
          className={`flex items-center justify-between gap-2 px-2.5 py-1.25 border-b border-(--border) last:border-b-0 ${i % 2 === 1 ? "bg-(--bg-raised)" : "bg-(--bg-surface)"}`}
        >
          <span className="text-[11px] text-(--text-3) shrink-0">{s.name}</span>
          <span className="font-mono text-[11px] font-medium text-(--text-1) text-right">
            {s.value}{s.unit ? ` ${s.unit}` : ""}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ─── ProductCard ─────────────────────────────────────────────────────────── */
export default function ProductCard({ product, layout = "grid" }: ProductCardProps) {
  const [quickView, setQuickView] = useState(false);
  const [qty, setQty] = useState(product.pricing.minimumOrderQty ?? 1);
  const [added, setAdded] = useState(false);
  const addTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { add } = useCart();

  const minQty = product.pricing.minimumOrderQty ?? 1;
  const c = computePricing(product.pricing, product.discount);
  const hasDisc = (product.discount ?? 0) > 0;
  const brandLabel = formatBrand(product.brandSlug, product.brandName);
  const brandAbbr = brandLabel.split(" ").filter(Boolean).map((w) => w[0]).join("").slice(0, 3).toUpperCase();

  const handleAdd = useCallback((e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    add({
      id: product.id,
      sku: product.sku,
      name: product.name,
      imageUrl: product.image.url,
      price: c.effectivePrice,
      currency: product.pricing.currency,
      minQty,
    }, qty);
    setAdded(true);
    if (addTimer.current) clearTimeout(addTimer.current);
    addTimer.current = setTimeout(() => setAdded(false), 1700);
  }, [product, add, qty, minQty, c.effectivePrice]);

  useEffect(() => () => { if (addTimer.current) clearTimeout(addTimer.current); }, []);

  const handleQV = useCallback((e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    setQuickView(true);
  }, []);

  /* ── List layout ────────────────────────────────────────────────────────── */
  if (layout === "list") {
    return (
      <>
        <article className="group/card card-product flex gap-3 sm:gap-4 p-3 sm:p-4">

          {/* Thumbnail */}
          <div className="relative shrink-0 w-24 h-24 sm:w-40 sm:h-40 rounded-xl overflow-hidden bg-white">
            <Link href={`/products/${product.slug}`} tabIndex={-1} aria-hidden className="block w-full h-full p-2">
              <ProductImg url={product.image.url} alt={product.image.alt || product.name} className="w-full h-full" />
            </Link>
            {/* Badges */}
            <div className="absolute top-1.5 left-1.5 flex flex-col gap-1 pointer-events-none">
              {product.isNew && <span className="font-mono text-[8.5px] sm:text-[9.5px] font-semibold tracking-wide text-white bg-(--text-1) px-1.5 py-0.5 rounded-[3px]">NEW</span>}
              {product.isClearance && <span className="font-mono text-[8.5px] sm:text-[9.5px] font-semibold tracking-wide text-white bg-red-600 px-1.5 py-0.5 rounded-[3px]">CLEARANCE</span>}
              {hasDisc && <span className="font-mono text-[8.5px] sm:text-[9.5px] font-bold text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded-[3px]">-{product.discount}%</span>}
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 min-w-0 flex flex-col gap-2">

            {/* Top row: brand + name + save */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                <span className="text-[9.5px] sm:text-[10px] font-bold uppercase tracking-wide text-navy-500 truncate">{brandLabel}</span>
                <Link href={`/products/${product.slug}`}>
                  <h3 className="text-[12.5px] sm:text-[14px] font-semibold text-(--text-1) line-clamp-2 leading-snug group-hover/card:text-navy-500 transition-colors">
                    {product.name}
                  </h3>
                </Link>
                {(product.sku || product.mpn) && (
                  <p className="font-mono text-[9px] sm:text-[10.5px] text-(--text-4) truncate">
                    {[product.sku && `SKU ${product.sku}`, product.mpn && `MPN ${product.mpn}`].filter(Boolean).join("   ·   ")}
                  </p>
                )}
              </div>
              {/* Save button — inline, not overlaid */}
              <div className="shrink-0">
                <WishlistBtn productId={product.id} />
              </div>
            </div>

            {/* Filter tags */}
            {product.filterTags && product.filterTags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {product.filterTags.filter((t) => t.includes(":")).slice(0, 6).map((tag) => {
                  const sep = tag.indexOf(":");
                  const key = tag.slice(0, sep).trim();
                  const val = tag.slice(sep + 1).trim();
                  return (
                    <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-md bg-(--bg-raised) text-(--text-3) border border-(--border) whitespace-nowrap">
                      {key}<span className="font-semibold text-(--text-1)">{val}</span>
                    </span>
                  );
                })}
              </div>
            )}

            {/* Stock */}
            <StockDot inStock={product.inStock} note={product.stockNote} />

            {/* Specs + price row */}
            <div className="flex gap-3 sm:gap-4 flex-col sm:flex-row sm:items-start">
              {/* Specs table */}
              {product.specs && product.specs.length > 0 && (
                <div className="flex-1 min-w-0">
                  <SpecsTable specs={product.specs} maxRows={4} />
                </div>
              )}

              {/* Price */}
              <div className="sm:w-48 flex flex-col gap-1 shrink-0">
                {c.hasPricing ? (
                  <>
                    <div className="flex items-baseline gap-1.5 flex-wrap">
                      <span className="text-[18px] sm:text-[22px] font-bold text-(--text-1) leading-tight tabular-nums">
                        {fmtPrice(c.effectivePrice, product.pricing.currency)}
                      </span>
                      <span className="text-[10.5px] text-(--text-4)">ex {product.pricing.taxLabel || "VAT"}</span>
                    </div>
                    <div className="flex items-baseline gap-1.5">
                      {c.inclPrice && (
                        <span className="text-[11px] sm:text-[12px] text-(--text-3)">
                          {fmtPrice(c.inclPrice, product.pricing.currency)} inc {product.pricing.taxLabel || "VAT"}
                        </span>
                      )}
                      {c.savingsAmt > 0 && (
                        <span className="text-[11px] text-(--text-4) line-through tabular-nums">
                          {fmtPrice(c.listRef, product.pricing.currency)}
                        </span>
                      )}
                    </div>
                    {c.savingsAmt > 0 && (
                      <span className="font-mono text-[11px] font-semibold text-navy-500">
                        Save {fmtPrice(c.savingsAmt, product.pricing.currency)}
                      </span>
                    )}
                    <div className="flex items-center gap-1 font-mono text-[9.5px] sm:text-[10.5px] text-(--text-4) flex-wrap">
                      {c.minQty > 1 && <span>MOQ {c.minQty}</span>}
                      {c.minQty > 1 && product.pricing.leadTime && <span className="text-(--border-hi)">·</span>}
                      {product.pricing.leadTime && <span>{product.pricing.leadTime}</span>}
                    </div>
                  </>
                ) : (
                  <span className="text-sm font-semibold text-navy-500">Request Pricing</span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1.5 mt-auto flex-wrap">
              {c.hasPricing && product.inStock && (
                <QtyInput qty={qty} minQty={minQty} onChange={setQty} />
              )}
              {product.inStock ? (
                <button
                  onClick={handleAdd}
                  className={`flex items-center justify-center gap-1.5 h-9 px-4 rounded-md text-[12px] sm:text-[12.5px] font-semibold transition-all ${added
                    ? "bg-se-green text-white"
                    : "bg-navy-500 hover:bg-navy-600 text-white"
                    }`}
                >
                  <Ico d={added ? D.check : D.cart} size={13} sw={2} />
                  {added ? "Added" : "Add to basket"}
                </button>
              ) : (
                <button className="flex items-center justify-center gap-1.5 h-9 px-4 border border-(--border) rounded-md text-(--text-1) text-[12px] font-semibold hover:border-navy-400 hover:text-navy-500 transition-colors">
                  <Ico d={D.bell} size={13} sw={1.8} />
                  Notify me
                </button>
              )}
              <Link
                href={rfqHref(product)}
                title="Add to quote"
                className="flex items-center justify-center gap-1.5 h-9 px-3 border border-(--border) rounded-md text-(--text-2) text-[12px] font-semibold hover:border-navy-400 hover:text-navy-500 transition-colors"
              >
                <Ico d={D.rfq} size={13} sw={2} />
                <span className="hidden sm:inline">Add to quote</span>
              </Link>
              <CompareBtn product={product} size="md" />
              {product.datasheetUrl ? (
                <a
                  href={product.datasheetUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="hidden sm:flex items-center gap-1 h-9 px-3 border border-(--border) rounded-md text-(--text-2) text-[12px] font-semibold hover:border-navy-400 hover:text-navy-500 transition-colors"
                >
                  <Ico d={D.doc} size={13} sw={1.8} />
                  Datasheet
                </a>
              ) : (
                <button
                  onClick={handleQV}
                  aria-label="Quick view"
                  className="hidden sm:flex items-center gap-1 h-9 px-3 border border-(--border) rounded-md text-(--text-2) text-[12px] font-semibold hover:border-navy-400 hover:text-navy-500 transition-colors"
                >
                  <Ico d={D.eye} size={13} sw={2} />
                  Quick view
                </button>
              )}
            </div>
          </div>
        </article>

        {quickView && createPortal(
          <QuickViewModal product={product} onClose={() => setQuickView(false)} />,
          document.body,
        )}
      </>
    );
  }

  /* ── Grid layout ────────────────────────────────────────────────────────── */
  return (
    <>
      <article className="group/card card-product flex flex-col overflow-hidden">

        {/* Image + overlays */}
        <div className="relative h-40 sm:h-44 bg-white overflow-hidden">
          <Link href={`/products/${product.slug}`} className="block w-full h-full p-3" tabIndex={-1} aria-hidden>
            <ProductImg url={product.image.url} alt={product.image.alt || product.name} className="w-full h-full" />
          </Link>

          {/* Status badges — top-left */}
          {(product.isNew || product.isClearance || product.isFeatured || hasDisc) && (
            <div className="absolute top-2 left-2 flex flex-col gap-1 pointer-events-none">
              {product.isNew && (
                <span className="font-mono text-[9.5px] font-semibold tracking-wide text-white bg-(--text-1) px-1.5 py-0.5 rounded-[3px]">NEW</span>
              )}
              {product.isClearance && (
                <span className="font-mono text-[9.5px] font-semibold tracking-wide text-white bg-red-600 px-1.5 py-0.5 rounded-[3px]">CLEARANCE</span>
              )}
              {product.isFeatured && (
                <span className="font-mono text-[9.5px] font-semibold tracking-wide text-white bg-apt-orange px-1.5 py-0.5 rounded-[3px]">FEATURED</span>
              )}
              {hasDisc && (
                <span className="font-mono text-[9.5px] font-bold text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded-[3px]">
                  -{product.discount}%
                </span>
              )}
            </div>
          )}

          {/* Wishlist — top-right */}
          <div className="absolute top-2 right-2 z-10">
            <WishlistBtn productId={product.id} />
          </div>

          {/* Brand stamp — bottom-left */}
          <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-white/90 border border-white/50 rounded-sm px-1.5 py-0.5 shadow-sm pointer-events-none">
            {product.brandImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={product.brandImage} alt="" className="max-h-3.5 max-w-12 object-contain" loading="lazy" />
            ) : (
              <>
                <span className="w-1.5 h-1.5 rounded-xs bg-navy-500 shrink-0" />
                <span className="font-mono text-[9px] sm:text-[9.5px] font-semibold tracking-wide text-(--text-2)">{brandAbbr}</span>
              </>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-2 sm:gap-2.5 p-2.5 sm:p-3 flex-1">

          {/* Breadcrumb */}
          {product.cataloguePath && (
            <p className="font-mono text-[9px] sm:text-[10px] text-(--text-4) truncate leading-none">
              {product.cataloguePath}
            </p>
          )}

          {/* Brand + name + SKU */}
          <div className="flex flex-col gap-0.5 sm:gap-1">
            <span className="text-[9.5px] sm:text-[10px] font-bold uppercase tracking-wide text-navy-500 truncate">
              {brandLabel}
            </span>
            <Link href={`/products/${product.slug}`}>
              <h3 className="text-[12px] sm:text-[13.5px] font-semibold text-(--text-1) line-clamp-2 leading-snug group-hover/card:text-navy-500 transition-colors">
                {product.name}
              </h3>
            </Link>
            {(product.sku || product.mpn) && (
              <p className="font-mono text-[9px] sm:text-[10.5px] text-(--text-4) truncate">
                {[product.sku && `SKU ${product.sku}`, product.mpn && `MPN ${product.mpn}`].filter(Boolean).join("   ·   ")}
              </p>
            )}
          </div>

          {/* Specs table — sm+ only */}
          {product.specs && product.specs.length > 0 && (
            <div className="hidden sm:block">
              <SpecsTable specs={product.specs} maxRows={3} />
            </div>
          )}

          {/* Stock indicator */}
          <StockDot inStock={product.inStock} note={product.stockNote} />

          {/* Price section */}
          <div className="flex flex-col gap-1 pt-1.5 border-t border-(--border)">
            {c.hasPricing ? (
              <>
                {/* Main price + ex VAT + strikethrough */}
                <div className="flex items-baseline gap-1.5 flex-wrap">
                  <span className="text-[17px] sm:text-[20px] font-bold text-(--text-1) leading-tight tabular-nums">
                    {fmtPrice(c.effectivePrice, product.pricing.currency)}
                  </span>
                  <span className="text-[10px] sm:text-[10.5px] text-(--text-4)">ex {product.pricing.taxLabel || "VAT"}</span>
                  {c.savingsAmt > 0 && (
                    <span className="text-[10.5px] sm:text-[11px] text-(--text-4) line-through tabular-nums">
                      {fmtPrice(c.listRef, product.pricing.currency)}
                    </span>
                  )}
                </div>

                {/* Inc VAT + savings */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {c.inclPrice && (
                    <span className="text-[10.5px] sm:text-[12px] text-(--text-3)">
                      {fmtPrice(c.inclPrice, product.pricing.currency)} inc {product.pricing.taxLabel || "VAT"}
                    </span>
                  )}
                  {c.savingsAmt > 0 && (
                    <span className="font-mono text-[10px] sm:text-[11px] font-semibold text-navy-500">
                      Save {fmtPrice(c.savingsAmt, product.pricing.currency)}
                    </span>
                  )}
                </div>

                {/* MOQ · lead time */}
                <div className="hidden sm:flex items-center gap-1 flex-wrap font-mono text-[10px] sm:text-[10.5px] text-(--text-4)">
                  {c.minQty > 1 && <span>MOQ {c.minQty}</span>}
                  {c.minQty > 1 && product.pricing.leadTime && <span className="text-(--border)">·</span>}
                  {product.pricing.leadTime && <span>{product.pricing.leadTime}</span>}
                </div>
              </>
            ) : (
              <span className="text-xs font-semibold text-navy-500">Request Pricing</span>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-1.5 mt-auto">

            {/* Qty stepper + primary CTA */}
            <div className="flex gap-1.5">
              {c.hasPricing && product.inStock && (
                <QtyInput qty={qty} minQty={minQty} onChange={setQty} />
              )}
              {product.inStock ? (
                <button
                  onClick={handleAdd}
                  className={`flex-1 flex items-center justify-center gap-1.5 h-9 rounded-md text-[11px] sm:text-[12.5px] font-semibold transition-all ${added
                    ? "bg-se-green text-white"
                    : "bg-navy-500 hover:bg-navy-600 text-white"
                    }`}
                >
                  <Ico d={added ? D.check : D.cart} size={13} sw={2} />
                  {added ? "Added" : "Add to basket"}
                </button>
              ) : (
                <button className="flex-1 flex items-center justify-center gap-1.5 h-9 border border-(--border) rounded-md text-(--text-1) text-[11px] sm:text-[12px] font-semibold hover:border-navy-400 hover:text-navy-500 transition-colors">
                  <Ico d={D.bell} size={12} sw={1.8} />
                  Notify me
                </button>
              )}
            </div>

            {/* Add to quote */}
            <Link
              href={rfqHref(product)}
              className="flex items-center justify-center gap-1.5 h-8 border border-(--border) rounded-md text-(--text-2) text-[11px] sm:text-[12px] font-semibold hover:border-navy-400 hover:text-navy-500 transition-colors"
            >
              <Ico d={D.rfq} size={12} sw={2} />
              Add to quote
            </Link>

            {/* Footer: compare + datasheet/quickview — sm+ only */}
            <div className="hidden sm:flex items-center justify-between pt-2 border-t border-(--border)">
              <CompareBtn product={product} showLabel />
              {product.datasheetUrl ? (
                <a
                  href={product.datasheetUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="flex items-center gap-1 text-[11.5px] font-medium text-(--text-3) hover:text-navy-500 transition-colors"
                >
                  <Ico d={D.doc} size={13} sw={1.8} />
                  Datasheet
                </a>
              ) : (
                <button
                  onClick={handleQV}
                  className="flex items-center gap-1 text-[11.5px] font-medium text-(--text-3) hover:text-navy-500 transition-colors"
                >
                  <Ico d={D.eye} size={12} sw={2} />
                  Quick view
                </button>
              )}
            </div>
          </div>
        </div>
      </article>

      {quickView && createPortal(
        <QuickViewModal product={product} onClose={() => setQuickView(false)} />,
        document.body,
      )}
    </>
  );
}

/* ─── Skeleton ────────────────────────────────────────────────────────────── */
export function ProductCardSkeleton({ layout = "grid" }: { layout?: ProductCardLayout }) {
  if (layout === "list") {
    return (
      <div className="card-product flex gap-4 p-4 animate-pulse">
        <div className="w-24 h-24 sm:w-40 sm:h-40 rounded-xl bg-(--bg-raised) shrink-0" />
        <div className="flex-1 space-y-2.5 py-0.5">
          <div className="h-3 w-16 bg-(--bg-raised) rounded" />
          <div className="h-4 w-3/4 bg-(--bg-raised) rounded" />
          <div className="h-3 w-1/3 bg-(--bg-raised) rounded" />
          <div className="h-2 w-2 rounded-full bg-(--bg-raised)" />
          <div className="h-5 w-24 bg-(--bg-raised) rounded" />
          <div className="h-3 w-2/3 bg-(--bg-raised) rounded" />
          <div className="flex gap-2 pt-1">
            <div className="h-9 w-20 bg-(--bg-raised) rounded-md" />
            <div className="h-9 w-28 bg-(--bg-raised) rounded-md" />
            <div className="h-9 w-24 bg-(--bg-raised) rounded-md" />
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="card-product overflow-hidden animate-pulse">
      <div className="h-40 sm:h-44 bg-(--bg-raised)" />
      <div className="p-2.5 sm:p-3 space-y-2">
        <div className="h-2 w-24 bg-(--bg-raised) rounded" />
        <div className="h-2.5 w-16 bg-(--bg-raised) rounded" />
        <div className="h-3.5 bg-(--bg-raised) rounded" />
        <div className="h-3.5 w-4/5 bg-(--bg-raised) rounded" />
        <div className="h-2.5 w-28 bg-(--bg-raised) rounded" />
        <div className="hidden sm:block space-y-1">
          <div className="h-7 bg-(--bg-raised) rounded-[5px]" />
          <div className="h-7 bg-(--bg-raised) rounded-[5px]" />
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-(--bg-raised)" />
          <div className="h-3 w-14 bg-(--bg-raised) rounded" />
        </div>
        <div className="pt-1.5 border-t border-(--border) space-y-1.5">
          <div className="h-6 w-28 bg-(--bg-raised) rounded" />
          <div className="h-3 w-20 bg-(--bg-raised) rounded" />
          <div className="flex gap-1.5 pt-1">
            <div className="h-9 w-20 bg-(--bg-raised) rounded-md" />
            <div className="flex-1 h-9 bg-(--bg-raised) rounded-md" />
          </div>
          <div className="h-8 bg-(--bg-raised) rounded-md" />
        </div>
      </div>
    </div>
  );
}

/* ─── Empty state ─────────────────────────────────────────────────────────── */
export function ProductCardEmpty() {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-(--bg-raised) flex items-center justify-center mb-4">
        <Ico d={D.box} size={28} sw={1} cls="text-(--text-4)" />
      </div>
      <h3 className="text-lg font-bold text-(--text-1) mb-2">No products found</h3>
      <p className="text-sm text-(--text-3) max-w-sm mb-6">
        Try adjusting your filters or search terms. Our team can also source products not listed online.
      </p>
      <a href="/rfq"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-se-green hover:bg-se-green-hover transition-colors">
        Request a Quote
        <Ico d={D.arrow} size={14} sw={2.5} />
      </a>
    </div>
  );
}
