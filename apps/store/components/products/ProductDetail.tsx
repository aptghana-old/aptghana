"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import ProductCard, { type ProductCardData } from "./ProductCard";
import RecentlyViewed from "./RecentlyViewed";
import Recommendations from "./Recommendations";
import { ImageZoomClick } from "@/components/ImageZoom";
import { ProductProvider } from "@/components/Product/product-context";
import { useCart } from "@/lib/store/cart";
import { useWishlist } from "@/lib/store/wishlist";
import { useCompare, type CompareItem } from "@/lib/store/compare";
import { computePricing, fmtPrice } from "./PriceBlock";

/* ── Types ─────────────────────────────────────────────────────────────────── */
interface Media { url: string; alt: string; width?: number; height?: number }
interface SpecAttr { name: string; value: string; unit?: string }
interface SpecGroup { group: string; attributes: SpecAttr[] }
interface DocItem { type: string; title: string; url: string; language: string; fileSize?: number }
interface CrossRef { brand: string; mpn: string; description?: string }
interface VideoItem { title: string; url: string; thumbnail?: string }
interface BrandSummary {
  slug: string; name: string; logo?: Media;
  website?: string; country?: string; shortDescription?: string;
  productCount?: number; isPartner?: boolean;
}
interface RelatedProduct {
  _id: string; name: string; slug: string; sku: string;
  brandSlug: string; brandName?: string;
  images: { main: Media };
  pricing: { listPrice: number; currency: string };
  inventory: { quantity: number };
  discount?: number; isClearance?: boolean; isNew?: boolean;
}
interface CategoryRef { id: string; name: string; slug: string; level: string }

export interface ProductFull {
  _id: string; name: string; slug: string; sku: string; mpn: string; supplierRef?: string;
  brandSlug: string;
  shortDescription: string; description?: string;
  features: string[]; applications: string[]; certifications: string[];
  specifications: SpecGroup[];
  documents: DocItem[];
  images: { main: Media; gallery: Media[] };
  videos?: VideoItem[];
  image360Url?: string;
  pricing: { listPrice: number; currency: string; minimumOrderQty: number; leadTime?: string; tradePrice?: number };
  inventory: { quantity: number; tracked?: boolean; warehouseLocation?: string };
  isClearance: boolean; discount: number; isNew: boolean; isFeatured: boolean;
  status: string; tags?: string[];
  crossReferences?: CrossRef[];
  brand?: BrandSummary;
  categories?: CategoryRef[];
  catalogue?: { path?: string; url?: string };
  primaryCategoryId?: string;
  relatedProducts?: RelatedProduct[];
  accessories?: RelatedProduct[];
  replacements?: RelatedProduct[];
  fallbackProducts?: RelatedProduct[];
  brandProducts?: RelatedProduct[];
}

/* ── Icon primitive ─────────────────────────────────────────────────────────── */
function Icon({ d, size = 18, sw = 1.75, className = "", fill = "none", style }: {
  d: string | string[]; size?: number; sw?: number; className?: string; fill?: string;
  style?: React.CSSProperties;
}) {
  const paths = Array.isArray(d) ? d : [d];
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill}
      stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"
      className={className} style={style} aria-hidden="true">
      {paths.map((p, i) => <path key={i} d={p} />)}
    </svg>
  );
}

const IC = {
  cart:     "M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z",
  quote:    "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  heart:    "M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z",
  heartF:   "M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z",
  compare:  "M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5",
  share:    "M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z",
  check:    "M4.5 12.75l6 6 9-13.5",
  chevD:    "M19.5 8.25l-7.5 7.5-7.5-7.5",
  chevR:    "M8.25 4.5l7.5 7.5-7.5 7.5",
  download: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4",
  pdf:      "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z",
  info:     "M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z",
  search:   "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
  print:    "M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z",
  external: "M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25",
  phone:    "M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z",
  tag:      "M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z M6 6h.008v.008H6V6z",
  wrench:   "M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z",
  swap:     "M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5",
};

/* ── Utilities ──────────────────────────────────────────────────────────────── */
function brandLabel(slug: string) {
  return slug.split("-").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");
}
function fileSize(bytes?: number) {
  if (!bytes) return null;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}
function relatedToCard(p: RelatedProduct): ProductCardData {
  return {
    id: p._id,
    name: p.name,
    slug: p.sku.toLowerCase(),
    sku: p.sku,
    brandSlug: p.brandSlug,
    brandName: p.brandName,
    image: { url: p.images?.main?.url ?? "", alt: p.images?.main?.alt || p.name },
    pricing: { listPrice: p.pricing.listPrice, currency: p.pricing.currency },
    inStock: (p.inventory?.quantity ?? 0) > 0,
    isClearance: p.isClearance,
    isNew: p.isNew,
    discount: p.discount,
  };
}

/* ── Breadcrumb ─────────────────────────────────────────────────────────────── */
function Breadcrumb({ product }: { product: ProductFull }) {
  const LEVEL_ORDER = ["group", "category", "subcategory", "range"];

  // Guard: categories may be raw ObjectId strings when the DB hasn't embedded the ref
  const cats = (product.categories ?? [])
    .filter((c): c is CategoryRef => typeof c === "object" && !!c.name)
    .slice()
    .sort((a, b) => LEVEL_ORDER.indexOf(a.level) - LEVEL_ORDER.indexOf(b.level));

  const pathParts = product.catalogue?.path?.split("/").filter(Boolean) ?? [];

  const crumbs: { label: string; href?: string }[] = [
    { label: "Home", href: "/" },
    { label: "Catalogue", href: "/catalog" },
  ];

  if (cats.length > 0) {
    cats.forEach((cat, i) => {
      const href = pathParts.length > i
        ? `/catalog/${pathParts.slice(0, i + 1).join("/")}`
        : cat.slug ? `/catalog/${cat.slug}` : undefined;
      crumbs.push({ label: cat.name, href });
    });
  } else {
    crumbs.push({ label: product.brand?.name ?? brandLabel(product.brandSlug), href: `/brands/${product.brandSlug}` });
  }

  crumbs.push({ label: product.name });

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-[12px] mb-5 flex-wrap">
      {crumbs.map((c, i) => (
        <span key={i} className="flex items-center gap-1 min-w-0">
          {i > 0 && <span style={{ color: "var(--text-4)" }} className="shrink-0">/</span>}
          {c.href ? (
            <Link href={c.href} className="transition-colors hover:underline truncate max-w-35 sm:max-w-none" style={{ color: "var(--text-4)" }}>
              {c.label}
            </Link>
          ) : (
            <span className="font-medium truncate max-w-45 sm:max-w-none" style={{ color: "var(--text-2)" }}>{c.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

/* ── Purchase Panel ─────────────────────────────────────────────────────────── */
function PurchasePanel({ product, panelRef }: { product: ProductFull; panelRef?: React.RefObject<HTMLDivElement | null> }) {
  const { add } = useCart();
  const { has: inWishlist, toggle: toggleWishlist } = useWishlist();
  const { has: inCompare, toggle: toggleCompare, isAtMax } = useCompare();

  const [qty, setQty] = useState(Math.max(1, product.pricing.minimumOrderQty || 1));
  const [added, setAdded] = useState(false);
  const [copied, setCopied] = useState(false);

  const inStock = (product.inventory?.quantity ?? 0) > 0;
  const minQty = Math.max(1, product.pricing.minimumOrderQty || 1);
  const isWishlisted = inWishlist(product._id);
  const isCompared = inCompare(product._id);
  const bName = product.brand?.name ?? brandLabel(product.brandSlug);

  const c = computePricing({
    listPrice: product.pricing.listPrice,
    tradePrice: product.pricing.tradePrice,
    currency: product.pricing.currency,
    minimumOrderQty: product.pricing.minimumOrderQty,
    leadTime: product.pricing.leadTime,
  }, product.discount);

  const highlights = useMemo(() => {
    const all: { label: string; val: string }[] = [];
    for (const group of product.specifications ?? []) {
      for (const attr of group.attributes) {
        all.push({ label: attr.name, val: `${attr.value}${attr.unit ? ` ${attr.unit}` : ""}` });
        if (all.length >= 4) break;
      }
      if (all.length >= 4) break;
    }
    return all;
  }, [product.specifications]);

  const datasheetDoc = (product.documents ?? []).find(d => d.type === "datasheet");

  function handleAddToCart() {
    add({ id: product._id, sku: product.sku, name: product.name, imageUrl: product.images.main?.url ?? "", price: product.pricing.listPrice, currency: product.pricing.currency, minQty }, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }
  function handleQty(delta: number) { setQty((q) => Math.max(minQty, q + delta * minQty)); }
  async function handleShare() {
    try { await navigator.clipboard.writeText(window.location.href); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* noop */ }
  }
  async function handleWishlist() { await toggleWishlist(product._id); }
  function handleCompare() {
    const item: CompareItem = { id: product._id, name: product.name, slug: product.slug, imageUrl: product.images.main?.url ?? "", brandName: bName };
    toggleCompare(item);
  }

  return (
    <div ref={panelRef} className="space-y-4">
      {/* Brand badge row */}
      <div className="flex items-center gap-2.5 flex-wrap">
        {product.brand?.logo?.url ? (
          <img src={product.brand.logo.url} alt={bName} className="h-6 object-contain" style={{ maxWidth: 100 }} />
        ) : (
          <span className="text-[11px] font-bold uppercase tracking-widest px-2 py-1 rounded"
            style={{ background: "var(--bg-raised)", color: "#0057b8", border: "1px solid var(--border)" }}>
            {bName}
          </span>
        )}
        {product.brand?.isPartner && (
          <span className="text-[10px] font-mono font-bold uppercase tracking-wide px-2 py-0.5 rounded"
            style={{ background: "rgba(0,87,184,0.08)", color: "#0057b8", border: "1px solid rgba(0,87,184,0.2)" }}>
            Authorised Partner
          </span>
        )}
        {product.isNew && <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded text-white" style={{ background: "#0057b8" }}>New</span>}
        {product.isClearance && <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded" style={{ background: "#E8F9ED", color: "#15803d" }}>Clearance</span>}
        {product.isFeatured && <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded" style={{ background: "#fef3c7", color: "#92400e" }}>Featured</span>}
      </div>

      {/* Title */}
      <h1 className="text-[21px] md:text-[25px] font-bold leading-snug" style={{ color: "var(--text-1)" }}>
        {product.name}
      </h1>

      {/* Short description */}
      {product.shortDescription && (
        <p className="text-[13px] leading-relaxed" style={{ color: "var(--text-3)" }}>
          {product.shortDescription}
        </p>
      )}

      {/* Identifiers row */}
      <div className="flex items-center flex-wrap gap-x-4 gap-y-1 py-2.5 text-[12px]"
        style={{ borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
        <span style={{ color: "var(--text-4)" }}>
          SKU <span className="font-mono font-semibold" style={{ color: "var(--text-1)" }}>{product.sku}</span>
        </span>
        {product.mpn && (
          <span style={{ color: "var(--text-4)" }}>
            MPN <span className="font-mono font-semibold" style={{ color: "var(--text-1)" }}>{product.mpn}</span>
          </span>
        )}
        {product.supplierRef && (
          <span style={{ color: "var(--text-4)" }}>
            Ref <span className="font-mono font-semibold" style={{ color: "var(--text-1)" }}>{product.supplierRef}</span>
          </span>
        )}
      </div>

      {/* Key spec highlights — 4-up grid */}
      {highlights.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {highlights.map((h) => (
            <div key={h.label} className="rounded-xl px-3 py-2.5"
              style={{ background: "var(--bg-raised)", border: "1px solid var(--border)" }}>
              <dt className="text-[10px] uppercase tracking-wide mb-0.5 truncate" style={{ color: "var(--text-4)" }}>{h.label}</dt>
              <dd className="text-[13px] font-mono font-bold leading-tight truncate" style={{ color: "var(--text-1)" }}>{h.val}</dd>
            </div>
          ))}
        </div>
      )}

      {/* ── Buy Box ── */}
      <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
        {/* Main: Price column + Actions column */}
        <div className="p-4 flex flex-col sm:flex-row gap-4">
          {/* Price column */}
          <div className="flex-1 min-w-0">
            {!c.hasPricing ? (
              <div>
                <span className="text-[22px] font-bold" style={{ color: "var(--text-1)" }}>Request Pricing</span>
                <p className="text-[12px] mt-1" style={{ color: "var(--text-4)" }}>Contact sales for pricing</p>
              </div>
            ) : (
              <div className="space-y-0.5">
                <p className="text-[11px] uppercase tracking-wide" style={{ color: "var(--text-4)" }}>{c.taxLabel}</p>
                <div className="flex items-baseline gap-3 flex-wrap">
                  <span className="text-[26px] font-bold tabular-nums leading-none" style={{ color: "var(--text-1)" }}>
                    {fmtPrice(c.effectivePrice, product.pricing.currency)}
                  </span>
                  {c.savingsAmt > 0 && (
                    <span className="text-[13px] line-through tabular-nums" style={{ color: "var(--text-4)" }}>
                      {fmtPrice(c.listRef, product.pricing.currency)}
                    </span>
                  )}
                </div>
                {c.inclPrice && (
                  <p className="text-[12px]" style={{ color: "var(--text-3)" }}>
                    inc. VAT {fmtPrice(c.inclPrice, product.pricing.currency)}
                  </p>
                )}
                {c.savingsAmt > 0 && c.savingsAmt / c.listRef > 0.01 && (
                  <p className="text-[12px] font-semibold" style={{ color: "#15803d" }}>
                    Save {fmtPrice(c.savingsAmt, product.pricing.currency)} ({Math.round(c.savingsAmt / c.listRef * 100)}%)
                  </p>
                )}
                <div className="flex items-center gap-2 text-[11px] mt-1 flex-wrap" style={{ color: "var(--text-4)" }}>
                  {c.minQty > 1 && <span>MOQ {c.minQty} units</span>}
                  {c.minQty > 1 && product.pricing.leadTime && <span>·</span>}
                  {product.pricing.leadTime && <span>Lead {product.pricing.leadTime}</span>}
                </div>
              </div>
            )}
          </div>

          {/* Actions column */}
          <div className="flex flex-col gap-2 sm:w-[200px]">
            <div className="flex items-stretch gap-2 h-11">
              <div className="flex items-stretch rounded-xl overflow-hidden shrink-0"
                style={{ border: "1.5px solid var(--border-hi)" }}>
                <button onClick={() => handleQty(-1)} disabled={qty <= minQty}
                  className="w-9 flex items-center justify-center text-lg font-medium transition-colors disabled:opacity-30"
                  style={{ color: "var(--text-2)", background: "var(--bg-raised)" }}
                  aria-label="Decrease quantity">−</button>
                <input type="number" value={qty} min={minQty} step={minQty}
                  onChange={(e) => setQty(Math.max(minQty, parseInt(e.target.value) || minQty))}
                  className="w-12 text-center text-[14px] font-bold focus:outline-none"
                  style={{ background: "var(--bg-surface)", color: "var(--text-1)" }}
                  aria-label="Quantity" />
                <button onClick={() => handleQty(1)}
                  className="w-9 flex items-center justify-center text-lg font-medium transition-colors"
                  style={{ color: "var(--text-2)", background: "var(--bg-raised)" }}
                  aria-label="Increase quantity">+</button>
              </div>
              <button onClick={handleAddToCart}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl text-[13px] font-bold text-white transition-all active:scale-[0.97]"
                style={{ background: added ? "#15803d" : "#0057b8", boxShadow: "0 2px 12px rgba(0,87,184,0.25)" }}>
                <Icon d={added ? IC.check : IC.cart} size={15} sw={2} />
                {added ? "Added!" : "Add to basket"}
              </button>
            </div>
            <Link href={`/rfq?product=${product.slug}&sku=${product.sku}`}
              className="flex items-center justify-center gap-1.5 h-11 rounded-xl text-[13px] font-bold border-2 transition-colors hover:bg-(--text-1) hover:text-(--bg-surface)"
              style={{ borderColor: "var(--text-1)", color: "var(--text-1)" }}>
              <Icon d={IC.quote} size={15} sw={2} />
              Add to quote
            </Link>
          </div>
        </div>

        {/* Footer strip: stock + delivery */}
        <div className="px-4 py-3 flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-4 text-[12px]"
          style={{ borderTop: "1px solid var(--border)", background: "var(--bg-raised)" }}>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full shrink-0"
              style={{
                background: inStock ? "#22c55e" : "#f59e0b",
                boxShadow: `0 0 0 3px ${inStock ? "rgba(34,197,94,.15)" : "rgba(245,158,11,.15)"}`,
              }} />
            <span className="font-semibold" style={{ color: inStock ? "#15803d" : "#b45309" }}>
              {inStock ? `${product.inventory.quantity.toLocaleString()} in stock` : "Available on order"}
            </span>
          </div>
          <div className="flex items-center gap-1.5" style={{ color: "var(--text-4)" }}>
            <Icon d={IC.info} size={12} sw={2} />
            {inStock ? "Dispatch: 1–2 working days" : `Lead time: ${product.pricing.leadTime ?? "2–6 weeks"}`}
          </div>
          {inStock && product.inventory.warehouseLocation && (
            <span className="font-mono text-[11px]" style={{ color: "var(--text-4)" }}>
              {product.inventory.warehouseLocation}
            </span>
          )}
        </div>
      </div>

      {/* Secondary actions */}
      <div className="flex items-center gap-1 flex-wrap">
        <button onClick={handleWishlist}
          className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-[12px] font-medium transition-colors"
          style={{ color: isWishlisted ? "#dc2626" : "var(--text-3)", background: isWishlisted ? "rgba(220,38,38,0.07)" : "transparent" }}>
          <Icon d={isWishlisted ? IC.heartF : IC.heart} size={13} sw={2} fill={isWishlisted ? "currentColor" : "none"} />
          {isWishlisted ? "Saved" : "Save"}
        </button>
        <button onClick={handleCompare} disabled={isAtMax && !isCompared}
          className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-[12px] font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ color: isCompared ? "#0057b8" : "var(--text-3)", background: isCompared ? "rgba(0,87,184,0.07)" : "transparent" }}>
          <Icon d={IC.compare} size={13} sw={2} />
          {isCompared ? "Remove" : "Compare"}
        </button>
        <button onClick={handleShare}
          className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-[12px] font-medium transition-colors"
          style={{ color: "var(--text-3)" }}>
          <Icon d={IC.share} size={13} sw={2} />
          {copied ? "Copied!" : "Share"}
        </button>
        {datasheetDoc && (
          <a href={datasheetDoc.url} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-[12px] font-medium transition-colors ml-auto"
            style={{ color: "#dc2626", background: "rgba(220,38,38,0.06)" }}>
            <Icon d={IC.pdf} size={13} sw={1.75} />
            Datasheet
          </a>
        )}
      </div>

      {/* Technical support */}
      <div className="rounded-xl p-3.5 text-[13px]"
        style={{ background: "rgba(0,87,184,0.05)", border: "1px solid rgba(0,87,184,0.18)" }}>
        <p className="font-semibold mb-1" style={{ color: "var(--text-1)" }}>Need technical assistance?</p>
        <p className="mb-2" style={{ color: "var(--text-3)" }}>Our engineers are available Mon–Fri, 8:00–17:00 GMT.</p>
        <a href="tel:+233302123456" className="inline-flex items-center gap-1.5 font-semibold hover:opacity-80 transition-opacity" style={{ color: "#0057b8" }}>
          <Icon d={IC.phone} size={13} sw={2} />
          +233 30 212 3456
        </a>
      </div>
    </div>
  );
}

/* ── Mobile Sticky CTA Bar ──────────────────────────────────────────────────── */
function MobileStickyBar({ product, visible }: { product: ProductFull; visible: boolean }) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);
  const minQty = Math.max(1, product.pricing.minimumOrderQty || 1);

  function handleAdd() {
    add({ id: product._id, sku: product.sku, name: product.name, imageUrl: product.images.main?.url ?? "", price: product.pricing.listPrice, currency: product.pricing.currency, minQty }, minQty);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <div className={`fixed bottom-0 inset-x-0 z-50 lg:hidden transition-transform duration-300 ${visible ? "translate-y-0" : "translate-y-full"}`}
      style={{ background: "var(--bg-surface)", borderTop: "1px solid var(--border)", boxShadow: "0 -4px 24px rgba(0,0,0,0.12)" }}>
      <div className="flex items-center gap-2.5 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-mono truncate" style={{ color: "var(--text-4)" }}>{product.sku}</p>
          <p className="text-[12px] font-semibold truncate leading-tight" style={{ color: "var(--text-1)" }}>{product.name}</p>
        </div>
        <Link href={`/rfq?product=${product.slug}&sku=${product.sku}`}
          className="h-11 px-4 flex items-center gap-1.5 rounded-xl text-[13px] font-bold border-2 shrink-0"
          style={{ borderColor: "var(--border-hi)", color: "var(--text-1)" }}>
          <Icon d={IC.quote} size={14} sw={2} />
          RFQ
        </Link>
        <button onClick={handleAdd}
          className="h-11 px-4 flex items-center gap-1.5 rounded-xl text-[13px] font-bold text-white shrink-0 transition-colors"
          style={{ background: added ? "#15803d" : "#0057b8" }}>
          <Icon d={added ? IC.check : IC.cart} size={14} sw={2} />
          {added ? "Added!" : "Add"}
        </button>
      </div>
    </div>
  );
}

/* ── Section Nav (sticky anchor navigation) ─────────────────────────────────── */
interface SectionDef { id: string; label: string; count?: number }

function SectionNav({ sections }: { sections: SectionDef[] }) {
  const [active, setActive] = useState(sections[0]?.id ?? "");

  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    for (const s of sections) {
      const el = document.getElementById(s.id);
      if (!el) continue;
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActive(s.id); },
        { rootMargin: "-15% 0px -75% 0px" }
      );
      obs.observe(el);
      observers.push(obs);
    }
    return () => observers.forEach((o) => o.disconnect());
  }, [sections]);

  function scrollTo(id: string) {
    const el = document.getElementById(id);
    if (!el) return;
    const offset = 80;
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - offset, behavior: "smooth" });
  }

  return (
    <div className="sticky top-16 z-20 -mx-4 sm:-mx-6 lg:-mx-8 xl:-mx-0 mb-6"
      style={{ background: "var(--bg-surface)", borderBottom: "1px solid var(--border)", borderTop: "1px solid var(--border)" }}>
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex px-4 sm:px-6 lg:px-0" role="tablist" aria-label="Product information sections">
          {sections.map((s) => (
            <button key={s.id} role="tab" aria-selected={active === s.id}
              onClick={() => scrollTo(s.id)}
              className="flex items-center gap-1.5 px-4 py-3.5 text-[13px] font-semibold whitespace-nowrap transition-colors shrink-0 relative"
              style={{
                color: active === s.id ? "#0057b8" : "var(--text-3)",
                borderBottom: active === s.id ? "2px solid #0057b8" : "2px solid transparent",
              }}>
              {s.label}
              {s.count !== undefined && s.count > 0 && (
                <span className="inline-flex items-center justify-center min-w-[18px] h-4.5 px-1 rounded-full text-[10px] font-bold"
                  style={{ background: active === s.id ? "#0057b8" : "var(--bg-raised)", color: active === s.id ? "#fff" : "var(--text-3)" }}>
                  {s.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Section wrapper ─────────────────────────────────────────────────────────── */
function Section({ id, title, children, action }: { id: string; title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section id={id} className="py-8" style={{ borderBottom: "1px solid var(--border)" }}>
      <div className="flex items-center justify-between gap-4 mb-5">
        <h2 className="text-[17px] font-bold" style={{ color: "var(--text-1)" }}>{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

/* ── Overview section ────────────────────────────────────────────────────────── */
function OverviewSection({ product }: { product: ProductFull }) {
  const hasContent = product.description || product.features?.length || product.applications?.length || product.certifications?.length;

  if (!hasContent) {
    return (
      <Section id="overview" title="Overview">
        <p className="text-[14px] py-6 text-center" style={{ color: "var(--text-4)" }}>No additional product information available.</p>
      </Section>
    );
  }

  return (
    <Section id="overview" title="Overview">
      <div className="space-y-7">
        {product.description && (
          <div>
            <h3 className="text-[14px] font-bold mb-3" style={{ color: "var(--text-1)" }}>Product Description</h3>
            <div className="space-y-3">
              {product.description.split("\n").filter(Boolean).map((para, i) => (
                <p key={i} className="text-[14px] leading-relaxed" style={{ color: "var(--text-2)" }}>{para}</p>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {product.features?.length > 0 && (
            <div>
              <h3 className="text-[14px] font-bold mb-3" style={{ color: "var(--text-1)" }}>Key Features</h3>
              <ul className="space-y-2">
                {product.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-[13px]" style={{ color: "var(--text-2)" }}>
                    <span className="mt-0.5 shrink-0 w-4 h-4 flex items-center justify-center rounded-full" style={{ background: "rgba(0,87,184,0.12)", color: "#0057b8" }}>
                      <Icon d={IC.check} size={9} sw={3} />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {product.applications?.length > 0 && (
            <div>
              <h3 className="text-[14px] font-bold mb-3" style={{ color: "var(--text-1)" }}>Applications</h3>
              <ul className="space-y-2">
                {product.applications.map((a, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-[13px]" style={{ color: "var(--text-2)" }}>
                    <span className="mt-0.5 shrink-0 w-4 h-4 flex items-center justify-center rounded-full" style={{ background: "rgba(61,205,88,0.15)", color: "#15803d" }}>
                      <Icon d={IC.chevR} size={9} sw={3} />
                    </span>
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {product.certifications?.length > 0 && (
          <div>
            <h3 className="text-[14px] font-bold mb-3" style={{ color: "var(--text-1)" }}>Certifications & Standards</h3>
            <div className="flex flex-wrap gap-2">
              {product.certifications.map((c, i) => (
                <span key={i} className="px-3 py-1 rounded-full text-[12px] font-semibold" style={{ background: "#f0fdf4", color: "#15803d", border: "1px solid #bbf7d0" }}>{c}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </Section>
  );
}

/* ── Specifications section ──────────────────────────────────────────────────── */
const SPEC_ROW_LIMIT = 5;

function SpecificationsSection({ specs }: { specs: SpecGroup[] }) {
  const [query, setQuery] = useState("");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    if (!query.trim()) return specs;
    const q = query.toLowerCase();
    return specs.map((g) => ({
      ...g,
      attributes: g.attributes.filter((a) =>
        a.name.toLowerCase().includes(q) || a.value.toLowerCase().includes(q) || (a.unit ?? "").toLowerCase().includes(q)
      ),
    })).filter((g) => g.attributes.length > 0);
  }, [specs, query]);

  const totalAttrs = specs.reduce((s, g) => s + g.attributes.length, 0);
  const toggle = (name: string) => setCollapsed((p) => { const n = new Set(p); n.has(name) ? n.delete(name) : n.add(name); return n; });
  const toggleExpand = (name: string) => setExpanded((p) => { const n = new Set(p); n.has(name) ? n.delete(name) : n.add(name); return n; });

  if (specs.length === 0) {
    return (
      <Section id="specifications" title="Technical Specifications">
        <div className="py-10 text-center" style={{ color: "var(--text-4)" }}>
          <Icon d={IC.info} size={32} sw={1} className="mx-auto mb-3 opacity-40" />
          <p className="text-[14px]">No specifications listed. Contact us for detailed technical data.</p>
        </div>
      </Section>
    );
  }

  return (
    <Section id="specifications" title="Technical Specifications"
      action={
        <button onClick={() => window.print()}
          className="hidden sm:flex items-center gap-1.5 h-8 px-3 rounded-lg text-[12px] font-medium border transition-colors"
          style={{ borderColor: "var(--border)", color: "var(--text-3)", background: "var(--bg-raised)" }}>
          <Icon d={IC.print} size={13} sw={1.75} />
          Print
        </button>
      }>
      {/* Search */}
      <div className="relative mb-4">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--text-4)" }}>
          <Icon d={IC.search} size={14} />
        </span>
        <input type="search" value={query} onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search ${totalAttrs} specifications…`}
          className="w-full h-9 pl-9 pr-3 rounded-xl text-[13px] border focus:outline-none transition-colors"
          style={{ background: "var(--bg-raised)", borderColor: "var(--border)", color: "var(--text-1)" }}
          onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(0,87,184,0.5)"; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }} />
        {query && <p className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px]" style={{ color: "var(--text-4)" }}>{filtered.reduce((s, g) => s + g.attributes.length, 0)} results</p>}
      </div>

      <div className="space-y-3">
        {filtered.map((group) => {
          const isOpen = !collapsed.has(group.group);
          const isExpanded = expanded.has(group.group) || !!query.trim();
          const visible = isExpanded ? group.attributes : group.attributes.slice(0, SPEC_ROW_LIMIT);
          const hiddenCount = group.attributes.length - SPEC_ROW_LIMIT;
          return (
            <div key={group.group} className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
              <button type="button" onClick={() => toggle(group.group)}
                className="w-full flex items-center justify-between px-4 py-3 text-left transition-colors"
                style={{ background: "var(--bg-raised)" }} aria-expanded={isOpen}>
                <span className="text-[13px] font-bold" style={{ color: "var(--text-1)" }}>{group.group}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] tabular-nums" style={{ color: "var(--text-4)" }}>{group.attributes.length}</span>
                  <span className="transition-transform duration-200" style={{ color: "var(--text-4)", display: "inline-block", transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}>
                    <Icon d={IC.chevD} size={13} sw={2.5} />
                  </span>
                </div>
              </button>
              <div style={{ display: "grid", gridTemplateRows: isOpen ? "1fr" : "0fr", transition: "grid-template-rows 200ms ease" }}>
                <div className="overflow-hidden">
                  <table className="w-full text-[13px]">
                    <tbody>
                      {visible.map((attr, i) => (
                        <tr key={attr.name} style={{ background: i % 2 === 0 ? "var(--bg-surface)" : "var(--bg-raised)", borderTop: "1px solid var(--border)" }}>
                          <td className="px-4 py-2.5 w-[46%]" style={{ color: "var(--text-3)" }}>{attr.name}</td>
                          <td className="px-4 py-2.5 font-medium" style={{ color: "var(--text-1)" }}>
                            {attr.value}
                            {attr.unit && <span className="ml-1 text-[12px]" style={{ color: "var(--text-4)" }}>{attr.unit}</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {!isExpanded && hiddenCount > 0 && (
                    <button type="button" onClick={() => toggleExpand(group.group)}
                      className="w-full flex items-center justify-center gap-1.5 py-2.5 text-[12px] font-semibold transition-colors"
                      style={{ borderTop: "1px solid var(--border)", color: "#0057b8", background: "var(--bg-raised)" }}>
                      <Icon d={IC.chevD} size={12} sw={2.5} />
                      Show {hiddenCount} more row{hiddenCount !== 1 ? "s" : ""}
                    </button>
                  )}
                  {isExpanded && !query.trim() && group.attributes.length > SPEC_ROW_LIMIT && (
                    <button type="button" onClick={() => toggleExpand(group.group)}
                      className="w-full flex items-center justify-center gap-1.5 py-2.5 text-[12px] font-semibold transition-colors"
                      style={{ borderTop: "1px solid var(--border)", color: "var(--text-4)", background: "var(--bg-raised)" }}>
                      <Icon d={IC.chevD} size={12} sw={2.5} className="rotate-180" />
                      Show less
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && query && (
          <p className="py-8 text-center text-[14px]" style={{ color: "var(--text-4)" }}>No specifications match &ldquo;{query}&rdquo;</p>
        )}
      </div>
    </Section>
  );
}

/* ── Documents section ───────────────────────────────────────────────────────── */
const DOC_META: Record<string, { label: string; color: string; bg: string }> = {
  datasheet:   { label: "Datasheet",   color: "#dc2626", bg: "#fef2f2" },
  manual:      { label: "Manual",      color: "#0057b8", bg: "#ddeeff" },
  drawing:     { label: "Drawing",     color: "#7c3aed", bg: "#f5f3ff" },
  catalogue:   { label: "Catalogue",   color: "#0891b2", bg: "#ecfeff" },
  cad:         { label: "CAD",         color: "#0d9488", bg: "#f0fdfa" },
  certificate: { label: "Certificate", color: "#15803d", bg: "#f0fdf4" },
  compliance:  { label: "Compliance",  color: "#92400e", bg: "#fef3c7" },
  other:       { label: "Document",    color: "#374151", bg: "var(--bg-raised)" },
};

function DocumentsSection({ docs }: { docs: DocItem[] }) {
  if (docs.length === 0) {
    return (
      <Section id="documents" title="Documents & Downloads">
        <div className="py-10 text-center" style={{ color: "var(--text-4)" }}>
          <Icon d={IC.pdf} size={32} sw={1} className="mx-auto mb-3 opacity-40" />
          <p className="text-[14px]">No documents available. Contact us for technical documentation.</p>
        </div>
      </Section>
    );
  }

  const grouped = docs.reduce<Record<string, DocItem[]>>((acc, doc) => {
    const key = doc.type ?? "other";
    (acc[key] ??= []).push(doc);
    return acc;
  }, {});

  return (
    <Section id="documents" title="Documents & Downloads">
      <div className="space-y-5">
        {Object.entries(grouped).map(([type, items]) => {
          const meta = DOC_META[type] ?? DOC_META.other;
          return (
            <div key={type}>
              <h3 className="text-[12px] font-bold uppercase tracking-wide mb-3" style={{ color: "var(--text-3)" }}>{meta.label}s</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {items.map((doc, i) => (
                  <a key={i} href={doc.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3.5 rounded-xl transition-all group"
                    style={{ border: "1px solid var(--border)", background: "var(--bg-surface)", textDecoration: "none" }}
                    onMouseEnter={(e) => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = "#0057b8"; el.style.background = "var(--bg-raised)"; }}
                    onMouseLeave={(e) => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = "var(--border)"; el.style.background = "var(--bg-surface)"; }}>
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: meta.bg, color: meta.color }}>
                      <Icon d={IC.pdf} size={18} sw={1.5} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-semibold truncate" style={{ color: "var(--text-1)" }}>{doc.title}</div>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px]" style={{ color: "var(--text-4)" }}>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase" style={{ background: meta.bg, color: meta.color }}>{meta.label}</span>
                        <span>{doc.language.toUpperCase()}</span>
                        {doc.fileSize && <span>{fileSize(doc.fileSize)}</span>}
                      </div>
                    </div>
                    <Icon d={IC.download} size={15} sw={2} className="shrink-0" style={{ color: "var(--text-4)" }} />
                  </a>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </Section>
  );
}

/* ── Cross-References section ────────────────────────────────────────────────── */
function CrossRefSection({ refs }: { refs: CrossRef[] }) {
  if (!refs.length) return null;
  return (
    <Section id="cross-references" title="Cross-References">
      <div className="overflow-x-auto rounded-xl" style={{ border: "1px solid var(--border)" }}>
        <table className="w-full text-[13px]">
          <thead>
            <tr style={{ background: "var(--bg-raised)", borderBottom: "2px solid var(--border)" }}>
              {["Manufacturer", "Part Number", "Description"].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wide" style={{ color: "var(--text-3)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {refs.map((r, i) => (
              <tr key={i} style={{ borderBottom: "1px solid var(--border)", background: i % 2 === 0 ? "var(--bg-surface)" : "var(--bg-raised)" }}>
                <td className="px-4 py-3 font-semibold" style={{ color: "var(--text-1)" }}>{r.brand}</td>
                <td className="px-4 py-3 font-mono font-medium" style={{ color: "var(--text-1)" }}>{r.mpn}</td>
                <td className="px-4 py-3" style={{ color: "var(--text-3)" }}>{r.description ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  );
}

/* ── Brand section ───────────────────────────────────────────────────────────── */
function BrandSection({ product }: { product: ProductFull }) {
  const brand = product.brand;
  const name = brand?.name ?? brandLabel(product.brandSlug);

  return (
    <div className="rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5 my-8"
      style={{ background: "#0e1b24" }}>
      <div className="w-20 h-16 shrink-0 rounded-xl flex items-center justify-center p-2.5"
        style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)" }}>
        {brand?.logo?.url
          ? <img src={brand.logo.url} alt={name} className="w-full h-full object-contain" style={{ filter: "brightness(0) invert(1)" }} />
          : <span className="text-[11px] font-bold uppercase tracking-wider text-center leading-tight" style={{ color: "rgba(255,255,255,0.7)" }}>{name}</span>}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <h3 className="text-[16px] font-bold text-white">{name}</h3>
          {brand?.isPartner && (
            <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full"
              style={{ background: "rgba(61,205,88,0.2)", color: "#3dcd58" }}>
              Authorised Partner
            </span>
          )}
        </div>
        {brand?.country && <p className="text-[12px] mb-1" style={{ color: "rgba(255,255,255,0.5)" }}>{brand.country}</p>}
        {brand?.shortDescription && <p className="text-[13px] line-clamp-2" style={{ color: "rgba(255,255,255,0.7)" }}>{brand.shortDescription}</p>}
        {brand?.productCount && <p className="text-[12px] mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>{brand.productCount.toLocaleString()} products available</p>}
      </div>
      <div className="flex flex-col gap-2 shrink-0">
        <Link href={`/brands/${product.brandSlug}`}
          className="flex items-center justify-center gap-1.5 h-9 px-4 rounded-xl text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: "#0057b8" }}>
          All {name} Products
        </Link>
        {brand?.website && (
          <a href={brand.website} target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 h-9 px-4 rounded-xl text-[13px] font-medium transition-colors"
            style={{ border: "1px solid rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.8)", background: "rgba(255,255,255,0.05)" }}>
            <Icon d={IC.external} size={12} sw={1.75} />
            {name} Website
          </a>
        )}
      </div>
    </div>
  );
}

/* ── Tabbed Related Section (Related | Accessories | Replacements) ───────────── */
function TabbedRelatedSection({ product }: { product: ProductFull }) {
  const relatedProducts = (product.relatedProducts?.length ?? 0) > 0
    ? product.relatedProducts!
    : (product.fallbackProducts ?? []);
  const isRelatedFallback = (product.relatedProducts?.length ?? 0) === 0 && relatedProducts.length > 0;

  const tabs = [
    { key: "related",      label: isRelatedFallback ? "Similar Products" : "Related Products", products: relatedProducts },
    { key: "accessories",  label: "Accessories",  products: product.accessories  ?? [] },
    { key: "replacements", label: "Replacements", products: product.replacements ?? [] },
  ].filter(t => t.products.length > 0);

  const [activeKey, setActiveKey] = useState(tabs[0]?.key ?? "related");

  if (tabs.length === 0) return null;

  const activeProducts = (tabs.find(t => t.key === activeKey)?.products ?? []).slice(0, 12);

  return (
    <section id="related" className="py-8" style={{ borderBottom: "1px solid var(--border)" }}>
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveKey(tab.key)}
            className="flex items-center gap-2 h-9 px-4 rounded-full text-[13px] font-semibold border transition-all"
            style={{
              background:  activeKey === tab.key ? "#0057b8"  : "var(--bg-surface)",
              color:       activeKey === tab.key ? "#fff"      : "var(--text-2)",
              borderColor: activeKey === tab.key ? "#0057b8"   : "var(--border)",
            }}>
            {tab.label}
            <span className="text-[11px] tabular-nums opacity-70">{tab.products.length}</span>
          </button>
        ))}
      </div>
      <div className="sm:hidden flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
        {activeProducts.map(p => (
          <div key={p._id} className="shrink-0 w-[185px]">
            <ProductCard product={relatedToCard(p)} layout="grid" />
          </div>
        ))}
      </div>
      <div className="hidden sm:grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-3">
        {activeProducts.map(p => (
          <ProductCard key={p._id} product={relatedToCard(p)} layout="grid" />
        ))}
      </div>
    </section>
  );
}

/* ── Compatibility / Grouped Related Section ─────────────────────────────────── */
function CompatibilitySection({ product }: { product: ProductFull }) {
  const groups = [
    { label: "Accessories",       products: product.accessories  ?? [] },
    { label: "Replacement Parts", products: product.replacements ?? [] },
  ].filter(g => g.products.length > 0);

  const [selectedIdx, setSelectedIdx] = useState<number | undefined>();
  const [showAll, setShowAll] = useState(false);

  if (groups.length === 0) return null;

  const PREVIEW_LIMIT = 5;
  const activeGroup  = selectedIdx !== undefined ? groups[selectedIdx] : null;
  const visibleItems = activeGroup
    ? showAll ? activeGroup.products : activeGroup.products.slice(0, PREVIEW_LIMIT)
    : [];

  function open(idx: number) { setSelectedIdx(idx); setShowAll(false); }
  function close() { setSelectedIdx(undefined); setShowAll(false); }

  return (
    <section id="compatibility" className="py-8" style={{ borderBottom: "1px solid var(--border)" }}>
      <h2 className="text-[17px] font-bold mb-5" style={{ color: "var(--text-1)" }}>Compatible Products</h2>

      {/* Group tiles */}
      <div className="flex flex-col sm:flex-row flex-wrap gap-3">
        {groups.map((g, idx) => (
          <button key={g.label} onClick={() => open(idx)}
            className="flex items-center gap-3 text-left rounded-xl p-3.5 transition-all hover:shadow-md group"
            style={{ border: "1px solid var(--border)", background: "var(--bg-surface)", minWidth: 220, maxWidth: 320 }}>
            {g.products[0]?.images?.main?.url && (
              <img src={g.products[0].images.main.url} alt={g.label}
                className="w-10 h-10 object-contain shrink-0 rounded-lg"
                style={{ background: "var(--bg-raised)" }} loading="lazy" />
            )}
            <div className="min-w-0">
              <p className="text-[14px] font-semibold group-hover:underline" style={{ color: "var(--text-1)" }}>{g.label}</p>
              <p className="text-[12px]" style={{ color: "var(--text-4)" }}>{g.products.length} product{g.products.length !== 1 ? "s" : ""}</p>
            </div>
            <Icon d={IC.chevR} size={14} sw={2.5} className="ml-auto shrink-0" style={{ color: "var(--text-4)" }} />
          </button>
        ))}
      </div>

      {/* Dialog */}
      {selectedIdx !== undefined && activeGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-black/40" onClick={close} aria-hidden="true" />
          <div className="relative z-10 w-full max-w-3xl rounded-2xl overflow-hidden flex flex-col"
            style={{ background: "var(--bg-surface)", maxHeight: "85vh", boxShadow: "0 24px 64px rgba(0,0,0,0.22)" }}>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 shrink-0"
              style={{ background: "#0057b8", borderBottom: "1px solid rgba(255,255,255,0.15)" }}>
              <div>
                <p className="text-[11px] uppercase tracking-wide text-white/60 mb-0.5">Compatible with this product</p>
                <p className="text-[15px] font-bold text-white">{activeGroup.label}</p>
              </div>
              <button onClick={close} aria-label="Close"
                className="w-8 h-8 flex items-center justify-center rounded-full transition-colors"
                style={{ background: "rgba(255,255,255,0.15)", color: "#fff" }}>
                <Icon d="M6 18L18 6M6 6l12 12" size={14} sw={2.5} />
              </button>
            </div>

            {/* Table header */}
            <div className="hidden sm:grid grid-cols-[auto_1fr_auto_auto] items-center gap-4 px-5 py-2.5 text-[11px] font-bold uppercase tracking-wide shrink-0"
              style={{ background: "var(--bg-raised)", borderBottom: "1px solid var(--border)", color: "var(--text-4)" }}>
              <span className="w-14">Image</span>
              <span>Product</span>
              <span className="text-right w-28">Price</span>
              <span className="w-32" />
            </div>

            {/* Product rows */}
            <div className="overflow-y-auto flex-1">
              {visibleItems.map((p, i) => (
                <div key={p._id}
                  className="grid grid-cols-1 sm:grid-cols-[auto_1fr_auto_auto] items-center gap-3 sm:gap-4 px-5 py-4"
                  style={{ borderBottom: "1px solid var(--border)", background: i % 2 === 0 ? "var(--bg-surface)" : "var(--bg-raised)" }}>

                  {/* Image */}
                  <a href={`/products/${p.slug}`} tabIndex={-1}>
                    <img src={p.images?.main?.url ?? ""} alt={p.name}
                      className="w-14 h-14 object-contain rounded-lg shrink-0"
                      style={{ background: "var(--bg-raised)" }} />
                  </a>

                  {/* Info */}
                  <div className="min-w-0">
                    <a href={`/products/${p.slug}`}
                      className="text-[13px] font-semibold leading-snug line-clamp-2 hover:underline"
                      style={{ color: "var(--text-1)" }}>
                      {p.name}
                    </a>
                    <p className="text-[11px] font-mono mt-0.5" style={{ color: "var(--text-4)" }}>{p.sku}</p>
                  </div>

                  {/* Price */}
                  <div className="sm:text-right w-full sm:w-28">
                    {p.pricing?.listPrice ? (
                      <span className="text-[14px] font-bold tabular-nums" style={{ color: "var(--text-1)" }}>
                        {fmtPrice(p.pricing.listPrice, p.pricing.currency)}
                      </span>
                    ) : (
                      <span className="text-[12px]" style={{ color: "var(--text-4)" }}>POA</span>
                    )}
                  </div>

                  {/* CTA */}
                  <div className="flex gap-2 w-full sm:w-32">
                    <a href={`/products/${p.slug}`}
                      className="flex-1 h-9 flex items-center justify-center gap-1.5 rounded-lg text-[12px] font-bold text-white transition-colors"
                      style={{ background: "#0057b8" }}>
                      <Icon d={IC.external} size={12} sw={2} />
                      View
                    </a>
                  </div>
                </div>
              ))}

              {/* View All toggle */}
              {!showAll && activeGroup.products.length > PREVIEW_LIMIT && (
                <div className="px-5 py-4 flex items-center justify-between"
                  style={{ borderTop: "1px solid var(--border)", background: "var(--bg-raised)" }}>
                  <span className="text-[13px]" style={{ color: "var(--text-3)" }}>
                    Showing {PREVIEW_LIMIT} of {activeGroup.products.length} products
                  </span>
                  <button onClick={() => setShowAll(true)}
                    className="h-9 px-4 rounded-lg text-[13px] font-semibold border-2 transition-colors"
                    style={{ borderColor: "#0057b8", color: "#0057b8" }}>
                    View all {activeGroup.products.length}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

/* ── More from Brand (8–12 product carousel/grid) ───────────────────────────── */
function MoreFromBrandSection({ product }: { product: ProductFull }) {
  const brandName = product.brand?.name ?? brandLabel(product.brandSlug);
  const products = (product.brandProducts ?? []).slice(0, 12);
  if (products.length === 0) return null;

  return (
    <section id="more-from-brand" className="py-8" style={{ borderBottom: "1px solid var(--border)" }}>
      <div className="flex items-center justify-between gap-4 mb-5">
        <h2 className="text-[17px] font-bold" style={{ color: "var(--text-1)" }}>
          More from {brandName}
          <span className="text-[14px] font-normal ml-2" style={{ color: "var(--text-4)" }}>({products.length})</span>
        </h2>
        <Link href={`/brands/${product.brandSlug}`}
          className="text-[13px] font-semibold shrink-0 hover:underline"
          style={{ color: "#0057b8" }}>
          View all →
        </Link>
      </div>
      <div className="sm:hidden flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
        {products.map(p => (
          <div key={p._id} className="shrink-0 w-[185px]">
            <ProductCard product={relatedToCard(p)} layout="grid" />
          </div>
        ))}
      </div>
      <div className="hidden sm:grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
        {products.map(p => (
          <ProductCard key={p._id} product={relatedToCard(p)} layout="grid" />
        ))}
      </div>
    </section>
  );
}

/* ── Root export ─────────────────────────────────────────────────────────────── */
export default function ProductDetail({ product }: { product: ProductFull }) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [mobileCTAVisible, setMobileCTAVisible] = useState(false);

  useEffect(() => {
    function check() {
      if (!panelRef.current) return;
      const rect = panelRef.current.getBoundingClientRect();
      setMobileCTAVisible(rect.bottom < 0);
    }
    window.addEventListener("scroll", check, { passive: true });
    return () => window.removeEventListener("scroll", check);
  }, []);

  const totalSpecs = product.specifications?.reduce((s, g) => s + g.attributes.length, 0) ?? 0;
  const hasTabbedRelated =
    (product.relatedProducts?.length ?? 0) > 0 ||
    (product.accessories?.length ?? 0) > 0 ||
    (product.replacements?.length ?? 0) > 0 ||
    (product.fallbackProducts?.length ?? 0) > 0;
  const hasBrandProducts = (product.brandProducts?.length ?? 0) > 0;
  const hasCompatibility =
    (product.accessories?.length ?? 0) > 0 ||
    (product.replacements?.length ?? 0) > 0;

  const sections: SectionDef[] = [
    { id: "overview",       label: "Overview" },
    { id: "specifications", label: "Specifications", count: totalSpecs },
    { id: "documents",      label: "Documents", count: product.documents?.length ?? 0 },
    ...(product.crossReferences?.length ? [{ id: "cross-references", label: "Cross-Refs", count: product.crossReferences.length }] : []),
    ...(hasTabbedRelated ? [{ id: "related",         label: "Related" }] : []),
    ...(hasBrandProducts ? [{ id: "more-from-brand", label: "More from Brand" }] : []),
    ...(hasCompatibility  ? [{ id: "compatibility",   label: "Compatible" }] : []),
  ];

  return (
    <ProductProvider product={product}>
      <div className="pb-20 lg:pb-0">
        <Breadcrumb product={product} />

        {/* ── Hero: Gallery + Purchase Panel ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-8 xl:gap-10 mb-2">
          <div>
            <ImageZoomClick />
          </div>
          <aside className="lg:sticky lg:top-20 lg:self-start lg:max-h-[calc(100vh-5rem)] lg:overflow-y-auto">
            <PurchasePanel product={product} panelRef={panelRef} />
          </aside>
        </div>

        {/* ── Sticky section nav ── */}
        <SectionNav sections={sections} />

        {/* ── Content sections ── */}
        <OverviewSection product={product} />
        <SpecificationsSection specs={product.specifications ?? []} />
        <DocumentsSection docs={product.documents ?? []} />
        {(product.crossReferences?.length ?? 0) > 0 && (
          <CrossRefSection refs={product.crossReferences!} />
        )}

        {/* ── Brand block ── */}
        <BrandSection product={product} />

        {/* ── Tabbed related (Related | Accessories | Replacements) ── */}
        {hasTabbedRelated && <TabbedRelatedSection product={product} />}

        {/* ── More from Brand carousel (8–12 products) ── */}
        {hasBrandProducts && <MoreFromBrandSection product={product} />}

        {/* ── Compatible Products (Accessories / Replacement Parts) ── */}
        {hasCompatibility && <CompatibilitySection product={product} />}

        {/* ── Recommended For You ── */}
        <Recommendations currentSku={product.sku} />

        {/* ── Recently Viewed ── */}
        <RecentlyViewed currentSku={product.sku} />

        {/* ── Mobile sticky CTA ── */}
        <MobileStickyBar product={product} visible={mobileCTAVisible} />
      </div>
    </ProductProvider>
  );
}
