"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useCart, type CartItem } from "@/lib/store/cart";
import QtyStepper from "@/components/ui/QtyStepper";
import { EMAIL_SALES } from "@apt/config";

/* ─── Icon helper ─────────────────────────────────────────────────────────── */
function Ico({ d, size = 16, sw = 1.75 }: { d: string; size?: number; sw?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={d} />
    </svg>
  );
}

const D = {
  cart:    "M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z",
  trash:   "M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0",
  arrow:   "M8.25 4.5l7.5 7.5-7.5 7.5",
  rfq:     "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25M9 16.5v.75m3-3v3M15 12v5.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z",
  box:     "M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z",
  check:   "M4.5 12.75l6 6 9-13.5",
  phone:   "M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z",
  mail:    "M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75",
};

function fmt(n: number, cur = "USD") {
  if (n <= 0) return null;
  return `${cur} ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/* ─── Cart item row ───────────────────────────────────────────────────────── */
function CartRow({ item }: { item: CartItem }) {
  const { remove, setQty } = useCart();
  const [imgFailed, setImgFailed] = useState(false);

  const lineTotal = item.price > 0 ? item.price * item.qty : null;

  return (
    <div
      className="flex gap-4 p-4 sm:p-5 rounded-2xl border transition-colors"
      style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
    >
      {/* Thumbnail */}
      <div className="shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-(--bg-raised) flex items-center justify-center">
        {item.imageUrl && !imgFailed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.imageUrl}
            alt={item.name}
            className="w-full h-full object-contain p-2"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <Ico d={D.box} size={28} sw={1} />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <h3 className="text-sm font-semibold text-(--text-1) leading-snug line-clamp-2">{item.name}</h3>
        {item.sku && (
          <p className="text-[11px] font-mono text-(--text-4)">{item.sku}</p>
        )}

        {/* Price */}
        <div className="mt-auto pt-2 flex items-end justify-between gap-3 flex-wrap">
          {/* Qty stepper */}
          <QtyStepper
            qty={item.qty}
            minQty={item.minQty}
            onChange={(q) => setQty(item.productId, q)}
            onBelowMin={() => remove(item.productId)}
            label={`Quantity for ${item.name}`}
          />

          {/* Prices */}
          <div className="text-right">
            {lineTotal ? (
              <>
                <p className="text-sm font-bold text-(--text-1)">
                  {fmt(lineTotal, item.currency)}
                </p>
                {item.qty > 1 && (
                  <p className="text-[11px] text-(--text-4)">
                    {fmt(item.price, item.currency)} each
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm font-bold text-se-green">Price on Request</p>
            )}
          </div>
        </div>
      </div>

      {/* Remove */}
      <button
        onClick={() => remove(item.productId)}
        aria-label={`Remove ${item.name}`}
        className="shrink-0 self-start w-11 h-11 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-(--text-4) hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
      >
        <Ico d={D.trash} size={15} sw={1.75} />
      </button>
    </div>
  );
}

/* ─── Empty state ─────────────────────────────────────────────────────────── */
function EmptyCart() {
  return (
    <div
      className="rounded-2xl border p-12 text-center mb-6"
      style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
    >
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
        style={{ background: "var(--bg-raised)" }}
      >
        <Ico d={D.cart} size={28} sw={1.25} />
      </div>
      <h2 className="text-xl font-bold text-(--text-1) mb-2">Your cart is empty</h2>
      <p className="text-sm text-(--text-3) max-w-sm mx-auto mb-7">
        Browse our catalogue and add products to your procurement list, or request a quotation for a single or unlisted product.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link href="/search"
          className="inline-flex items-center gap-2 h-10 px-6 bg-navy-500 hover:bg-navy-400 text-white font-semibold text-sm rounded-xl transition-colors">
          Browse Products
        </Link>
        <Link href="/rfq"
          className="inline-flex items-center gap-2 h-10 px-6 bg-se-green hover:bg-se-green-hover text-white font-semibold text-sm rounded-xl transition-colors">
          Request a Quote
        </Link>
      </div>
    </div>
  );
}

/* ─── Order summary panel ─────────────────────────────────────────────────── */
function OrderSummary({
  items, count, total,
}: { items: CartItem[]; count: number; total: number }) {
  const hasUnpriced = items.some((i) => i.price <= 0);
  const currency    = items[0]?.currency ?? "USD";

  // The Request for Approval page imports the procurement basket for pricing
  const rfqHref = "/request-approval";

  return (
    <div
      className="rounded-2xl border p-5 sticky top-24"
      style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
    >
      <h2 className="text-base font-bold text-(--text-1) mb-4">Order Summary</h2>

      <dl className="space-y-2.5 mb-4">
        <div className="flex justify-between text-sm">
          <dt className="text-(--text-3)">Items ({count})</dt>
          <dd className="font-semibold text-(--text-1)">
            {total > 0 ? fmt(total, currency) : "—"}
          </dd>
        </div>
        <div className="flex justify-between text-sm">
          <dt className="text-(--text-3)">Shipping</dt>
          <dd className="font-medium text-(--text-4) text-xs italic">Quoted separately</dd>
        </div>
        <div className="flex justify-between text-sm">
          <dt className="text-(--text-3)">VAT (15%)</dt>
          <dd className="font-medium text-(--text-4) text-xs italic">Included in quote</dd>
        </div>
      </dl>

      {total > 0 && (
        <>
          <div
            className="flex justify-between items-center py-3 border-t border-b mb-4"
            style={{ borderColor: "var(--border)" }}
          >
            <span className="text-sm font-bold text-(--text-1)">Estimated Subtotal</span>
            <span className="text-base font-bold text-(--text-1)">{fmt(total, currency)}</span>
          </div>
          {hasUnpriced && (
            <p className="text-[11px] text-(--text-4) mb-4">
              * Some items are priced on request. Your quote will include full pricing.
            </p>
          )}
        </>
      )}

      <Link
        href={rfqHref}
        className="w-full flex items-center justify-center gap-2 h-11 rounded-xl text-sm font-bold text-white bg-se-green hover:bg-se-green-hover transition-colors mb-3"
      >
        <Ico d={D.rfq} size={15} sw={2} />
        Proceed to Approval
      </Link>

      <Link
        href="/search"
        className="w-full flex items-center justify-center gap-1.5 h-9 rounded-xl text-sm font-semibold text-(--text-3) hover:text-(--text-1) transition-colors"
      >
        Continue Shopping
        <Ico d={D.arrow} size={12} sw={2.5} />
      </Link>

      {/* Contact */}
      <div
        className="mt-4 pt-4 border-t flex flex-col gap-1.5"
        style={{ borderColor: "var(--border)" }}
      >
        <a href="tel:+233302123456"
          className="flex items-center gap-2 text-xs font-medium text-(--text-3) hover:text-navy-500 transition-colors">
          <Ico d={D.phone} size={13} sw={2} />
          +233 30 212 3456
        </a>
        <a href={`mailto:${EMAIL_SALES}`}
          className="flex items-center gap-2 text-xs font-medium text-(--text-3) hover:text-navy-500 transition-colors">
          <Ico d={D.mail} size={13} sw={2} />
          {EMAIL_SALES}
        </a>
      </div>
    </div>
  );
}

/* ─── How ordering works ──────────────────────────────────────────────────── */
function HowItWorks() {
  const steps = [
    ["Browse & Build",       "Find the products you need across our 6,000+ catalogue and add them to your procurement list."],
    ["Request Approval",     "Submit the whole list for pricing — with quantities, notes, and delivery requirements."],
    ["Pricing & Approval",   "Our engineers price every line and approve your request — same day for requests before 3 PM."],
    ["Pay Your Order",       "The approved request becomes an order with a secure online payment link (card, transfer, mobile money)."],
    ["Delivery",             "Fast delivery to Accra and all major cities, or collect from our Airport City showroom."],
  ];

  return (
    <div
      className="rounded-2xl border p-6 mt-6"
      style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
    >
      <h2 className="font-bold text-(--text-1) mb-5">How Ordering Works at APT Ghana</h2>
      <ol className="space-y-4">
        {steps.map(([title, desc], i) => (
          <li key={i} className="flex items-start gap-4">
            <span className="w-7 h-7 rounded-full bg-navy-500 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
              {i + 1}
            </span>
            <div>
              <p className="text-sm font-semibold text-(--text-1)">{title}</p>
              <p className="text-sm text-(--text-3) leading-relaxed">{desc}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

/* ─── Page ────────────────────────────────────────────────────────────────── */
export default function CartPage() {
  const { items, count, total, clear } = useCart();
  const [cleared, setCleared] = useState(false);

  const handleClear = useCallback(() => {
    clear();
    setCleared(true);
    setTimeout(() => setCleared(false), 2000);
  }, [clear]);

  const isEmpty = items.length === 0;

  return (
    <main className="flex-1" style={{ background: "var(--bg-base)" }}>
      {/* Hero */}
      <div className="bg-navy-900 py-10">
        <div className="container-store">
          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">Your Cart</h1>
          <p className="text-white/50 mt-2 text-sm">Review your items and request a formal quotation.</p>
        </div>
      </div>

      <div className="container-store py-8 md:py-12">
        {isEmpty ? (
          <div className="max-w-2xl mx-auto">
            <EmptyCart />
            <HowItWorks />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8 items-start">

            {/* Summary sidebar — order-1 on mobile (appears at top), order-2 on desktop */}
            <div className="order-1 lg:order-2">
              <OrderSummary items={items} count={count} total={total} />
            </div>

            {/* Items column — order-2 on mobile (below summary), order-1 on desktop */}
            <div className="order-2 lg:order-1">
              {/* Header row */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-(--text-1)">
                  {count} item{count !== 1 ? "s" : ""}
                </h2>
                <button
                  onClick={handleClear}
                  className="text-xs font-semibold text-(--text-4) hover:text-red-500 transition-colors flex items-center gap-1"
                >
                  {cleared
                    ? <><Ico d={D.check} size={12} sw={2.5} /> Cleared</>
                    : <><Ico d={D.trash} size={12} sw={2} />   Clear all</>
                  }
                </button>
              </div>

              {/* Item list */}
              <div className="flex flex-col gap-3">
                {items.map((item) => (
                  <CartRow key={item.productId} item={item} />
                ))}
              </div>

              <HowItWorks />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
