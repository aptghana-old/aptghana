"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useCart, type CartProductInput } from "@/lib/store/cart";
import { useWishlist } from "@/lib/store/wishlist";
import { useCompare, type CompareItem } from "@/lib/store/compare";
import { CompactPriceBlock, ListPriceBlock, DetailPriceBlock } from "./PriceBlock";
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
  isClearance?: boolean;
  isNew?: boolean;
  isFeatured?: boolean;
  discount?: number;
  specs?: { name: string; value: string; unit?: string }[];
  /** Catalogue breadcrumb, e.g. "Automation > PLCs > Compact PLCs" */
  cataloguePath?: string;
  /** Raw filter tag strings in "Key: Value" format from product tags/specs */
  filterTags?: string[];
  /** Brand logo image URL — shown as a small stamp overlaid on the product image */
  brandImage?: string;
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
      <path d={d} />
    </svg>
  );
}

const D = {
  heart: "M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z",
  heartFill: "M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001Z",
  compare: "M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5",
  eye: "M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
  cart: "M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z",
  check: "M4.5 12.75l6 6 9-13.5",
  close: "M6 18L18 6M6 6l12 12",
  arrow: "M8.25 4.5l7.5 7.5-7.5 7.5",
  rfq: "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25M9 16.5v.75m3-3v3M15 12v5.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z",
  box: "M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z",
  user: "M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z",
};

/* ─── Product image with fallback ─────────────────────────────────────────── */
function ProductImg({ url, alt, className }: { url: string; alt: string; className?: string }) {
  const [ failed, setFailed ] = useState(false);

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

/* ─── Availability pill ───────────────────────────────────────────────────── */
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

/* ─── Sign-in nudge tooltip ───────────────────────────────────────────────── */
function SignInNudge({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <div
      className="absolute bottom-full right-0 mb-2 z-10 animate-fade-in pointer-events-none"
      role="tooltip"
    >
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
function WishlistBtn({
  productId, size = "sm",
}: {
  productId: string; size?: "sm" | "md";
}) {
  const { has, toggle, isAuth, status } = useWishlist();
  const inWishlist = has(productId);
  const [ nudge, setNudge ] = useState(false);
  const nudgeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleClick = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    await toggle(productId);
    if (!isAuth) {
      setNudge(true);
      if (nudgeTimer.current) clearTimeout(nudgeTimer.current);
      nudgeTimer.current = setTimeout(() => setNudge(false), 3000);
    }
  }, [ productId, toggle, isAuth ]);

  useEffect(() => () => { if (nudgeTimer.current) clearTimeout(nudgeTimer.current); }, []);

  const isLoading = status === "syncing";

  /* 40px on mobile for tap target, 32px on sm+ */
  const smCls = `absolute top-1.5 right-1.5 w-10 h-10 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shadow transition-all ${inWishlist
    ? "bg-red-500 text-white"
    : "bg-(--bg-surface)/80 backdrop-blur-sm text-(--text-3) hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/30"
    }`;
  const mdCls = `w-8 h-8 rounded-lg flex items-center justify-center border transition-all ${inWishlist
    ? "bg-red-50 border-red-200 text-red-500 dark:bg-red-900/20 dark:border-red-800"
    : "border-(--border) text-(--text-3) hover:border-red-300 hover:text-red-400"
    }`;

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        disabled={isLoading}
        aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
        aria-pressed={inWishlist}
        className={size === "sm" ? smCls : mdCls}
      >
        {isLoading
          ? <span className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
          : <Ico d={inWishlist ? D.heartFill : D.heart} size={14} sw={2} fill={inWishlist ? "currentColor" : "none"} />
        }
      </button>
      <SignInNudge visible={nudge} />
    </div>
  );
}

/* ─── Compare button ──────────────────────────────────────────────────────── */
function CompareBtn({
  product, size = "sm",
}: {
  product: ProductCardData; size?: "sm" | "md";
}) {
  const { has, toggle, isAtMax } = useCompare();
  const inCompare = has(product.id);

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
  }, [ product, toggle ]);

  const smCls = `w-7 h-7 rounded flex items-center justify-center transition-colors ${inCompare ? "text-navy-500" : "text-(--text-4) hover:text-navy-500"
    }`;
  const mdCls = `w-8 h-8 rounded-lg flex items-center justify-center border transition-all ${inCompare
    ? "bg-navy-50 border-navy-300 text-navy-500 dark:bg-navy-900/40 dark:border-navy-600"
    : "border-(--border) text-(--text-3) hover:border-navy-300 hover:text-navy-400"
    }`;

  const disabled = isAtMax && !inCompare;

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

/* ─── Add-to-cart button ──────────────────────────────────────────────────── */
function CartBtn({
  product, size = "sm", className = "",
}: {
  product: ProductCardData; size?: "sm" | "md"; className?: string;
}) {
  const { add } = useCart();
  const [ added, setAdded ] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    const input: CartProductInput = {
      id: product.id,
      sku: product.sku,
      name: product.name,
      imageUrl: product.image.url,
      price: product.pricing.listPrice,
      currency: product.pricing.currency,
      minQty: product.pricing.minimumOrderQty ?? 1,
    };
    add(input, product.pricing.minimumOrderQty ?? 1);
    setAdded(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setAdded(false), 1800);
  }, [ product, add ]);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  if (size === "sm") {
    return (
      <button
        onClick={handleClick}
        className={`${className} flex items-center justify-center gap-1 h-9 px-2 rounded-lg text-[11px] font-bold transition-all ${added ? "bg-se-green text-white scale-95" : "bg-navy-500 hover:bg-navy-400 text-white"
          }`}
      >
        <Ico d={added ? D.check : D.cart} size={12} sw={2.5} />
        {added ? "Added" : "Add"}
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      className={`${className} flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${added ? "bg-se-green text-white" : "bg-navy-500 hover:bg-navy-400 text-white"
        }`}
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
  const [ added, setAdded ] = useState(false);
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
  }, [ onClose ]);

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
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" role="dialog" aria-modal aria-label={`Quick view: ${product.name}`}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto bg-(--bg-surface) rounded-2xl shadow-[0_24px_80px_rgba(0,0,0,0.35)] flex flex-col sm:flex-row">

        {/* Close */}
        <button onClick={onClose} aria-label="Close quick view"
          className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-(--bg-raised) flex items-center justify-center text-(--text-3) hover:text-(--text-1) transition-colors">
          <Ico d={D.close} size={14} sw={2.5} />
        </button>

        {/* Image */}
        <div className="sm:w-56 shrink-0 aspect-square sm:aspect-auto sm:h-auto bg-(--bg-raised) rounded-2xl sm:rounded-r-none overflow-hidden">
          <ProductImg url={product.image.url} alt={product.image.alt || product.name} className="w-full h-full" />
        </div>

        {/* Info */}
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
                className={`flex-1 flex items-center justify-center gap-2 h-10 rounded-xl text-sm font-bold transition-all ${added ? "bg-se-green text-white" : "bg-navy-500 hover:bg-navy-400 text-white"
                  }`}>
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

/* ─── ProductCard ─────────────────────────────────────────────────────────── */
export default function ProductCard({ product, layout = "grid" }: ProductCardProps) {
  const [ quickView, setQuickView ] = useState(false);

  const handleQV = useCallback((e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    setQuickView(true);
  }, []);

  const hasDisc = (product.discount ?? 0) > 0;
  const brandLabel = formatBrand(product.brandSlug, product.brandName);

  /* ── List layout (shown on sm+ only; mobile always uses grid) ──────────── */
  if (layout === "list") {
    const listFilterTags = product.filterTags?.filter((t) => t.includes(":")).slice(0, 5)
      ?? product.specs?.slice(0, 5).map((s) => `${s.name}: ${s.value}${s.unit ? ` ${s.unit}` : ""}`)
      ?? [];

    return (
      <>
        <article className="group/card card-product flex gap-3 sm:gap-4 p-3 sm:p-4">
          {/* Thumbnail */}
          <div className="relative shrink-0 w-24 h-24 sm:w-36 sm:h-36 rounded-xl overflow-hidden bg-white">
            <Link href={`/products/${product.slug}`} tabIndex={-1} aria-hidden className="block w-full h-full">
              <ProductImg url={product.image.url} alt={product.image.alt || product.name} className="w-full h-full" />
            </Link>
          </div>

          {/* Body */}
          <div className="flex-1 min-w-0 flex flex-col gap-1">

            {/* Brand + badges + stock */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                <div className="shadow-sm pointer-events-none flex items-center justify-center min-w-[28px]">
                  {product.brandImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={product.brandImage}
                      alt={`${brandLabel} logo`}
                      className="max-h-4 sm:max-h-5 max-w-10 shrink-0 sm:max-w-12 object-contain"
                      loading="lazy"
                    />
                  ) : (
                    <span className="text-[11px] font-bold text-navy-500 uppercase tracking-wide shrink-0">{brandLabel}</span>
                  )}
                </div>
                {product.isNew && <span className="px-1.5 py-px text-[9px] font-bold bg-navy-500 text-white rounded uppercase tracking-wide">New</span>}
                {product.isFeatured && <span className="px-1.5 py-px text-[9px] font-bold bg-apt-orange text-white rounded uppercase tracking-wide">Featured</span>}
                {product.isClearance && <span className="px-1.5 py-px text-[9px] font-bold bg-se-green text-white rounded uppercase tracking-wide">Clearance</span>}
                {hasDisc && <span className="px-1.5 py-px text-[9px] font-bold bg-red-500 text-white rounded uppercase tracking-wide">-{product.discount}%</span>}
              </div>
              <StockBadge inStock={product.inStock} />
            </div>

            {/* Product name */}
            <Link href={`/products/${product.slug}`}>
              <h3 className="text-sm font-semibold text-(--text-1) line-clamp-2 group-hover/card:text-navy-500 transition-colors leading-snug">
                {product.name}
              </h3>
            </Link>

            {/* SKU / MPN */}
            {(product.sku || product.mpn) && (
              <div className="flex items-center gap-3 flex-wrap">
                {product.sku && (
                  <span className="text-[10px] font-mono text-(--text-4)">
                    <span className="text-(--text-4) not-italic">SKU </span>{product.sku}
                  </span>
                )}
                {product.mpn && (
                  <span className="text-[10px] font-mono text-(--text-4)">
                    <span className="text-(--text-4) not-italic">MPN </span>{product.mpn}
                  </span>
                )}
              </div>
            )}

            {/* Short description — sm+ only to save mobile space */}
            {product.shortDescription && (
              <p className="hidden sm:block text-xs text-(--text-3) leading-relaxed line-clamp-2">{product.shortDescription}</p>
            )}

            {/* Filter tags / specs — desktop only (≥sm) */}
            {listFilterTags.length > 0 && (
              <div className="hidden sm:flex flex-wrap gap-1.5 mt-0.5">
                {listFilterTags.map((tag) => {
                  const sepIdx = tag.indexOf(":");
                  const key = sepIdx > 0 ? tag.slice(0, sepIdx).trim() : tag;
                  const val = sepIdx > 0 ? tag.slice(sepIdx + 1).trim() : "";
                  return (
                    <span
                      key={tag}
                      className="px-2 py-0.5 text-[10px] font-medium rounded-md bg-(--bg-raised) text-(--text-2) border border-(--border) whitespace-nowrap"
                    >
                      {key}{val ? <span className="font-bold"> {val}</span> : null}
                    </span>
                  );
                })}
              </div>
            )}

            {/* Bottom row: price + actions */}
            <div className="flex items-center gap-2 mt-auto pt-2 flex-wrap">
              <div className="flex-1 min-w-20">
                <ListPriceBlock pricing={product.pricing} discount={product.discount} />
              </div>

              <div className="flex items-center gap-1.5">
                <CartBtn product={product} size="md" />
                <Link href={rfqHref(product)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold border border-(--border) text-(--text-2) hover:border-navy-500/40 hover:text-navy-500 transition-colors">
                  <Ico d={D.rfq} size={13} sw={2} />
                  RFQ
                </Link>
                <WishlistBtn productId={product.id} size="md" />
                <CompareBtn product={product} size="md" />
                <button onClick={handleQV} aria-label="Quick view"
                  className="w-8 h-8 rounded-lg flex items-center justify-center border border-(--border) text-(--text-3) hover:border-navy-300 hover:text-navy-400 transition-colors">
                  <Ico d={D.eye} size={14} sw={2} />
                </button>
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

  /* ── Grid layout (default, always used on mobile) ──────────────────────── */
  return (
    <>
      <article className="group/card card-product flex flex-col overflow-hidden">

        {/* Image + overlays */}
        <div className="relative h-40 bg-white overflow-hidden">
          <Link href={`/products/${product.slug}`} className="block w-full h-full p-3" tabIndex={-1} aria-hidden>
            <ProductImg url={product.image.url} alt={product.image.alt || product.name} className="w-full h-full" />
          </Link>

          {/* Status badges — top-left */}
          {(product.isNew || product.isClearance || product.isFeatured || hasDisc) && (
            <div className="absolute top-2 left-2 flex flex-col gap-1 pointer-events-none">
              {product.isNew && <span className="px-1.5 py-px text-[9px] font-bold bg-navy-500 text-white rounded uppercase tracking-wide shadow-sm">New</span>}
              {product.isFeatured && <span className="px-1.5 py-px text-[9px] font-bold bg-apt-orange text-white rounded uppercase tracking-wide shadow-sm">Featured</span>}
              {product.isClearance && <span className="px-1.5 py-px text-[9px] font-bold bg-se-green text-white rounded uppercase tracking-wide shadow-sm">Clearance</span>}
              {hasDisc && <span className="px-1.5 py-px text-[9px] font-bold bg-red-500 text-white rounded uppercase tracking-wide shadow-sm">-{product.discount}%</span>}
            </div>
          )}

          {/* Brand stamp — always visible; logo if indexed, brand name text otherwise */}
          <div className="absolute top-2 right-2 shadow-sm pointer-events-none z-1 flex items-center justify-center min-w-[28px]">
            {product.brandImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.brandImage}
                alt={`${brandLabel} logo`}
                className="max-h-4 sm:max-h-5 max-w-10 sm:max-w-12 object-contain"
                loading="lazy"
              />
            ) : (
              <span className="text-[7px] sm:text-[8px] font-black uppercase tracking-widest text-(--text-3) leading-none whitespace-nowrap max-w-12 truncate">
                {brandLabel}
              </span>
            )}
          </div>

          {/* Wishlist — 40px tap target on mobile, 32px on sm+ */}
          <WishlistBtn productId={product.id} size="sm" />
        </div>

        {/* Content */}
        <div className="p-2.5 sm:p-3 flex flex-col flex-1">

          {/* Brand row + secondary actions (compare/quickview on sm+ only) */}
          <div className="flex items-center justify-between mb-1 gap-1 min-h-[18px]">
            <StockBadge inStock={product.inStock} />
            {/* <span className="text-[10px] font-bold text-navy-500 uppercase tracking-wide truncate">{brandLabel}</span> */}
            <div className="hidden sm:flex items-center gap-0.5 shrink-0">
              <CompareBtn product={product} size="sm" />
              <button
                onClick={handleQV}
                aria-label="Quick view"
                className="w-7 h-7 rounded flex items-center justify-center text-(--text-4) hover:text-navy-500 transition-colors"
              >
                <Ico d={D.eye} size={11} sw={2} />
              </button>
            </div>
          </div>

          {/* Product name */}
          <Link href={`/products/${product.slug}`} className="block flex-1 mb-1">
            <h3 className="text-[12px] sm:text-sm font-semibold text-(--text-1) leading-snug line-clamp-2 group-hover/card:text-navy-500 transition-colors">
              {product.name}
            </h3>
          </Link>

          {/* SKU + MPN */}
          {(product.sku || product.mpn) && (
            <div className="flex flex-col gap-px mt-0.5">
              {product.sku && (
                <p className="text-[9px] sm:text-[10px] font-mono text-(--text-4) truncate">
                  SKU {product.sku}
                </p>
              )}
              {product.mpn && (
                <p className="text-[9px] sm:text-[10px] font-mono text-(--text-4) truncate">
                  MPN {product.mpn}
                </p>
              )}
            </div>
          )}
          {/* Price + CTAs */}
          <div className="mt-2 pt-2 border-t border-(--border)">
            <CompactPriceBlock pricing={product.pricing} discount={product.discount} className="mb-1.5" />

            {/* Action buttons */}
            <div className="flex items-center gap-1.5">
              <CartBtn product={product} size="sm" className="flex-1" />
              <Link
                href={rfqHref(product)}
                title="Request a quote"
                aria-label={`Request a quote for ${product.name}`}
                className="flex items-center justify-center w-9 h-9 sm:w-8 sm:h-8 rounded-lg bg-(--bg-raised) text-(--text-3) hover:bg-navy-50 hover:text-navy-600 dark:hover:bg-navy-900/40 dark:hover:text-navy-300 border border-(--border) transition-colors shrink-0"
              >
                <Ico d={D.rfq} size={12} sw={2} />
              </Link>
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
        <div className="w-24 h-24 sm:w-36 sm:h-36 rounded-xl bg-(--bg-raised) shrink-0" />
        <div className="flex-1 space-y-2.5 py-0.5">
          <div className="h-3 w-20 bg-(--bg-raised) rounded" />
          <div className="h-4 w-3/4 bg-(--bg-raised) rounded" />
          <div className="h-3 w-1/3 bg-(--bg-raised) rounded" />
          <div className="h-3 w-5/6 bg-(--bg-raised) rounded" />
          <div className="h-3 w-2/3 bg-(--bg-raised) rounded" />
          <div className="flex gap-2 pt-1">
            <div className="h-8 w-24 bg-(--bg-raised) rounded-lg" />
            <div className="h-8 w-14 bg-(--bg-raised) rounded-lg" />
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="card-product overflow-hidden animate-pulse">
      <div className="aspect-square bg-(--bg-raised)" />
      <div className="p-2.5 sm:p-3 space-y-2">
        <div className="h-2.5 w-14 bg-(--bg-raised) rounded" />
        <div className="h-3.5 bg-(--bg-raised) rounded" />
        <div className="h-3.5 w-4/5 bg-(--bg-raised) rounded" />
        <div className="h-2.5 w-10 bg-(--bg-raised) rounded mt-0.5" />
        <div className="h-5 w-16 bg-(--bg-raised) rounded-full mt-2" />
        <div className="pt-2 border-t border-(--border) space-y-1.5">
          <div className="h-3.5 w-20 bg-(--bg-raised) rounded" />
          <div className="flex gap-1.5">
            <div className="flex-1 h-9 bg-(--bg-raised) rounded-lg" />
            <div className="w-9 h-9 bg-(--bg-raised) rounded-lg" />
          </div>
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
