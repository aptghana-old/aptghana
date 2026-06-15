"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/lib/store/cart";
import { Alert, Icon, PageHeader, PrimaryBtn, GhostBtn, StatusBadge } from "@/components/account/ui";
import { EMAIL_SALES } from "@apt/config";

export interface OrderView {
  id: string;
  ref: string;
  status: string;
  items: {
    productId: string | null;
    sku: string;
    name: string;
    brand: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    image: string;
    notes: string;
  }[];
  subtotal: number;
  discount: number;
  tax: number;
  shipping: number;
  total: number;
  currency: string;
  quoteNumber: string;
  payToken: string;
  paymentRef: string;
  paymentMethod: string;
  notes: string;
  trackingNumber: string;
  trackingUrl: string;
  createdAt: string;
  updatedAt: string;
}

const ORDER_LABELS: Record<string, string> = {
  pending: "Awaiting Payment",
  confirmed: "Confirmed",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

/** Linear fulfilment journey used for the status timeline. */
const TIMELINE: { key: string; label: string }[] = [
  { key: "pending", label: "Awaiting Payment" },
  { key: "confirmed", label: "Confirmed" },
  { key: "processing", label: "Processing" },
  { key: "shipped", label: "Shipped" },
  { key: "delivered", label: "Delivered" },
];

function fmt(n: number, cur: string) {
  return `${cur} ${n.toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

export default function OrderDetail({ order }: { order: OrderView }) {
  const cart = useCart();
  const [reordered, setReordered] = useState(false);

  const stageIndex = TIMELINE.findIndex((s) => s.key === order.status);
  const isCancelled = order.status === "cancelled" || order.status === "refunded";

  function reorder() {
    let added = 0;
    for (const item of order.items) {
      if (!item.productId) continue; // custom lines can't be re-added automatically
      cart.add({
        id: item.productId,
        sku: item.sku || undefined,
        name: item.name,
        imageUrl: item.image,
        price: item.unitPrice,
        currency: order.currency,
        minQty: 1,
      }, item.quantity);
      added++;
    }
    if (added > 0) {
      setReordered(true);
      setTimeout(() => setReordered(false), 4000);
    }
  }

  const reorderable = order.items.some((i) => i.productId);

  return (
    <div className="space-y-6">
      <div className="print:hidden">
        <PageHeader
          title={order.ref}
          subtitle={`Placed ${fmtDate(order.createdAt)}${order.quoteNumber ? ` · from quotation ${order.quoteNumber}` : ""}`}
          action={
            <div className="flex gap-2 flex-wrap justify-end">
              {order.status === "pending" && order.payToken && (
                <Link href={`/pay/${order.payToken}`}
                  className="inline-flex items-center h-9 px-4 bg-se-green hover:bg-se-green-hover text-white text-xs font-bold rounded-xl transition-colors">
                  Pay Now
                </Link>
              )}
              <GhostBtn type="button" onClick={() => window.print()} className="text-xs h-9 px-3">
                Print
              </GhostBtn>
              <a
                href={`/api/documents/order/${order.id}?type=invoice&download=1`}
                className="inline-flex items-center justify-center gap-2 h-9 px-3 border border-(--border) text-(--text-2) text-xs font-semibold rounded-xl hover:border-navy-400 hover:text-navy-500 transition-colors"
              >
                Invoice PDF
              </a>
              {order.paymentRef && (
                <a
                  href={`/api/documents/order/${order.id}?type=receipt&download=1`}
                  className="inline-flex items-center justify-center gap-2 h-9 px-3 border border-(--border) text-(--text-2) text-xs font-semibold rounded-xl hover:border-navy-400 hover:text-navy-500 transition-colors"
                >
                  Receipt PDF
                </a>
              )}
              {reorderable && (
                <PrimaryBtn type="button" variant="navy" onClick={reorder} className="text-xs h-9 px-4">
                  {reordered ? "Added to cart ✓" : "Reorder"}
                </PrimaryBtn>
              )}
            </div>
          }
        />
        {reordered && <Alert type="success" message="Items added to your cart — review quantities before submitting for approval." />}
      </div>

      {/* Invoice header (print only) */}
      <div className="hidden print:block border-b border-gray-300 pb-4">
        <h1 className="text-2xl font-bold">APT Ghana — Invoice</h1>
        <p className="text-sm mt-1">
          Order {order.ref}{order.quoteNumber ? ` · Quote ${order.quoteNumber}` : ""} · {fmtDate(order.createdAt)}
        </p>
        <p className="text-xs mt-1">Automation & Plant Technologies Ltd · Accra, Ghana · {EMAIL_SALES}</p>
      </div>

      {/* Status timeline */}
      <div className="bg-(--bg-surface) border border-(--border) rounded-2xl p-5 print:hidden">
        <div className="flex items-center justify-between gap-2 mb-4">
          <h2 className="text-sm font-bold text-(--text-1)">Order Status</h2>
          <StatusBadge status={order.status} label={ORDER_LABELS[order.status] ?? order.status} />
        </div>
        {isCancelled ? (
          <p className="text-sm text-(--text-3)">
            This order was {order.status}. Contact sales if you believe this is an error.
          </p>
        ) : (
          <ol className="flex items-center">
            {TIMELINE.map((stage, i) => {
              const reached = stageIndex >= i;
              const isLast = i === TIMELINE.length - 1;
              return (
                <li key={stage.key} className={`flex items-center ${isLast ? "" : "flex-1"}`}>
                  <div className="flex flex-col items-center gap-1.5">
                    <span
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors ${
                        reached ? "bg-se-green text-white" : "bg-(--bg-raised) text-(--text-4)"
                      }`}
                    >
                      {reached ? (
                        <Icon d="M4.5 12.75l6 6 9-13.5" size={12} strokeWidth={3} />
                      ) : (
                        i + 1
                      )}
                    </span>
                    <span className={`text-[10px] font-semibold text-center leading-tight max-w-[64px] ${reached ? "text-(--text-1)" : "text-(--text-4)"}`}>
                      {stage.label}
                    </span>
                  </div>
                  {!isLast && (
                    <div className={`flex-1 h-0.5 mx-1 mb-5 rounded ${stageIndex > i ? "bg-se-green" : "bg-(--border)"}`} />
                  )}
                </li>
              );
            })}
          </ol>
        )}
        {order.trackingNumber && (
          <p className="text-xs text-(--text-3) mt-4">
            Tracking:{" "}
            {order.trackingUrl ? (
              <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer" className="font-mono font-bold text-navy-500 hover:underline">
                {order.trackingNumber}
              </a>
            ) : (
              <span className="font-mono font-bold text-(--text-1)">{order.trackingNumber}</span>
            )}
          </p>
        )}
      </div>

      {/* Items */}
      <div className="bg-(--bg-surface) border border-(--border) rounded-2xl overflow-hidden print:border-gray-300">
        <div className="hidden sm:flex items-center px-6 py-2.5 border-b text-[11px] font-bold uppercase tracking-wider text-(--text-4) bg-(--bg-raised) border-(--border)">
          <span className="flex-1">Product</span>
          <span className="w-14 text-right">Qty</span>
          <span className="w-28 text-right">Unit</span>
          <span className="w-28 text-right">Total</span>
        </div>
        <ul className="divide-y divide-(--border)">
          {order.items.map((item, i) => (
            <li key={i} className="px-5 sm:px-6 py-4 flex items-start gap-3 flex-wrap sm:flex-nowrap">
              <div className="flex-1 min-w-[180px]">
                {item.brand && <p className="text-[11px] font-bold text-navy-500 uppercase tracking-wide">{item.brand}</p>}
                <p className="text-sm font-semibold text-(--text-1) leading-snug">{item.name}</p>
                {item.sku && <p className="text-[11px] font-mono text-(--text-4) mt-0.5">SKU {item.sku}</p>}
                {item.notes && <p className="text-[11px] italic text-(--text-3) mt-1">“{item.notes}”</p>}
              </div>
              <span className="w-14 text-right text-sm text-(--text-2) tabular-nums">×{item.quantity}</span>
              <span className="w-28 text-right text-sm text-(--text-2) tabular-nums">{fmt(item.unitPrice, order.currency)}</span>
              <span className="w-28 text-right text-sm font-semibold text-(--text-1) tabular-nums">{fmt(item.totalPrice, order.currency)}</span>
            </li>
          ))}
        </ul>

        {/* Totals */}
        <dl className="px-5 sm:px-6 py-4 border-t border-(--border) space-y-1.5 text-sm sm:max-w-xs sm:ml-auto">
          <div className="flex justify-between"><dt className="text-(--text-3)">Subtotal</dt><dd className="font-semibold tabular-nums text-(--text-1)">{fmt(order.subtotal, order.currency)}</dd></div>
          {order.discount > 0 && (
            <div className="flex justify-between"><dt className="text-(--text-3)">Discount</dt><dd className="tabular-nums text-red-600 dark:text-red-400">− {fmt(order.discount, order.currency)}</dd></div>
          )}
          {order.tax > 0 && (
            <div className="flex justify-between"><dt className="text-(--text-3)">Tax</dt><dd className="tabular-nums text-(--text-1)">{fmt(order.tax, order.currency)}</dd></div>
          )}
          {order.shipping > 0 && (
            <div className="flex justify-between"><dt className="text-(--text-3)">Shipping</dt><dd className="tabular-nums text-(--text-1)">{fmt(order.shipping, order.currency)}</dd></div>
          )}
          <div className="flex justify-between pt-2 border-t border-(--border)">
            <dt className="font-bold text-(--text-1)">Total</dt>
            <dd className="font-bold tabular-nums text-(--text-1)">{fmt(order.total, order.currency)}</dd>
          </div>
        </dl>
      </div>

      {/* Payment + notes */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="bg-(--bg-surface) border border-(--border) rounded-2xl p-5">
          <h2 className="text-xs font-bold text-(--text-4) uppercase tracking-widest mb-3">Payment</h2>
          {order.paymentRef ? (
            <div className="text-sm text-(--text-2) space-y-1">
              <p>Reference: <span className="font-mono font-semibold text-(--text-1)">{order.paymentRef}</span></p>
              {order.paymentMethod && <p>Method: <span className="capitalize">{order.paymentMethod.replace(/_/g, " ")}</span></p>}
            </div>
          ) : order.status === "pending" && order.payToken ? (
            <div>
              <p className="text-sm text-(--text-3) mb-3">This order is awaiting payment.</p>
              <Link href={`/pay/${order.payToken}`} className="inline-flex items-center h-9 px-4 bg-se-green hover:bg-se-green-hover text-white text-xs font-bold rounded-xl transition-colors print:hidden">
                Pay {fmt(order.total, order.currency)}
              </Link>
            </div>
          ) : (
            <p className="text-sm text-(--text-3)">No payment recorded.</p>
          )}
        </div>
        <div className="bg-(--bg-surface) border border-(--border) rounded-2xl p-5">
          <h2 className="text-xs font-bold text-(--text-4) uppercase tracking-widest mb-3">Notes</h2>
          <p className="text-sm text-(--text-3) leading-relaxed">
            {order.notes || "No notes on this order."}
          </p>
        </div>
      </div>
    </div>
  );
}
