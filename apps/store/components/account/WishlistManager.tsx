"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/lib/store/cart";
import { useWishlist } from "@/lib/store/wishlist";
import { Alert, EmptyState, GhostBtn, Icon, PageHeader } from "@/components/account/ui";

export interface WishlistProduct {
  id: string;
  sku: string;
  mpn: string;
  slug: string;
  name: string;
  brandSlug: string;
  imageUrl: string;
  listPrice: number;
  currency: string;
  minQty: number;
  inStock: boolean;
  active: boolean;
}

const HEART_ICON = "M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z";
const CART_ICON = "M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z";
const BOX_ICON = "M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z";

function brandLabel(slug: string) {
  return slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

function fmt(n: number, cur: string) {
  return `${cur} ${n.toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function WishlistManager({ initial }: { initial: WishlistProduct[] }) {
  const { toggle } = useWishlist();
  const cart = useCart();
  const [items, setItems] = useState(initial);
  const [notice, setNotice] = useState<string | null>(null);
  const [addedId, setAddedId] = useState<string | null>(null);

  async function remove(item: WishlistProduct) {
    setItems((prev) => prev.filter((i) => i.id !== item.id)); // optimistic
    try {
      await toggle(item.id);
    } catch {
      setItems((prev) => [item, ...prev]); // rollback
    }
  }

  function addToCart(item: WishlistProduct) {
    cart.add({
      id: item.id,
      sku: item.sku,
      name: item.name,
      imageUrl: item.imageUrl,
      price: item.listPrice,
      currency: item.currency,
      minQty: item.minQty,
    }, item.minQty);
    setAddedId(item.id);
    setTimeout(() => setAddedId((cur) => (cur === item.id ? null : cur)), 1800);
  }

  function exportCsv() {
    const rows = [
      ["SKU", "MPN", "Name", "Brand", "Price", "Currency", "Link"],
      ...items.map((i) => [
        i.sku, i.mpn, i.name.replace(/"/g, "'"), brandLabel(i.brandSlug),
        i.listPrice > 0 ? String(i.listPrice) : "On request", i.currency,
        `${window.location.origin}/products/${i.slug}`,
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `apt-ghana-wishlist-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function share() {
    const text = [
      "My APT Ghana product list:",
      ...items.map((i) => `• ${i.name} (${i.sku}) — ${window.location.origin}/products/${i.slug}`),
    ].join("\n");
    try {
      if (navigator.share) {
        await navigator.share({ title: "APT Ghana wishlist", text });
        return;
      }
      await navigator.clipboard.writeText(text);
      setNotice("List copied to clipboard — paste it anywhere to share.");
      setTimeout(() => setNotice(null), 4000);
    } catch { /* user dismissed the share sheet */ }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Wishlist"
        subtitle={items.length ? `${items.length} saved product${items.length !== 1 ? "s" : ""}.` : "Products you have saved for later."}
        action={
          items.length > 0 ? (
            <div className="flex gap-2">
              <GhostBtn type="button" onClick={share} className="text-xs h-9 px-3">Share</GhostBtn>
              <GhostBtn type="button" onClick={exportCsv} className="text-xs h-9 px-3">Export CSV</GhostBtn>
            </div>
          ) : undefined
        }
      />

      {notice && <Alert type="success" message={notice} />}

      {items.length === 0 ? (
        <div className="bg-(--bg-surface) border border-(--border) rounded-2xl">
          <EmptyState
            icon={HEART_ICON}
            title="Your wishlist is empty"
            description="Save products you are interested in — tap the heart on any product to review or order later."
            action={
              <Link href="/search" className="inline-flex items-center gap-1.5 h-10 px-5 bg-navy-500 hover:bg-navy-400 text-white text-sm font-bold rounded-xl transition-colors">
                Browse Products
              </Link>
            }
          />
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex gap-4 p-4 rounded-2xl border bg-(--bg-surface) border-(--border)"
            >
              {/* Thumb */}
              <Link href={`/products/${item.slug}`} className="shrink-0 w-20 h-20 rounded-xl overflow-hidden bg-(--bg-raised) flex items-center justify-center">
                {item.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.imageUrl} alt={item.name} className="w-full h-full object-contain p-1.5" />
                ) : (
                  <Icon d={BOX_ICON} size={24} strokeWidth={1.25} className="text-(--text-4)" />
                )}
              </Link>

              {/* Body */}
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold text-navy-500 uppercase tracking-wide">{brandLabel(item.brandSlug)}</p>
                <Link href={`/products/${item.slug}`}>
                  <h3 className="text-sm font-semibold text-(--text-1) leading-snug line-clamp-2 hover:text-navy-500 transition-colors">
                    {item.name}
                  </h3>
                </Link>
                <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                  <span className="text-[11px] font-mono text-(--text-4)">SKU {item.sku}</span>
                  {!item.active && (
                    <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">No longer listed</span>
                  )}
                </div>

                {/* Bottom row */}
                <div className="flex items-center justify-between gap-3 mt-2.5 flex-wrap">
                  <span className={`text-sm font-bold ${item.listPrice > 0 ? "text-(--text-1)" : "text-se-green"}`}>
                    {item.listPrice > 0 ? fmt(item.listPrice, item.currency) : "Price on Request"}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => addToCart(item)}
                      disabled={!item.active}
                      className={`flex items-center gap-1.5 h-8 px-3 rounded-lg text-[11px] font-bold transition-all disabled:opacity-40 ${
                        addedId === item.id ? "bg-se-green text-white" : "bg-navy-500 hover:bg-navy-400 text-white"
                      }`}
                    >
                      <Icon d={addedId === item.id ? "M4.5 12.75l6 6 9-13.5" : CART_ICON} size={12} strokeWidth={2.5} />
                      {addedId === item.id ? "Added" : "Add to Cart"}
                    </button>
                    <Link
                      href={`/rfq?sku=${encodeURIComponent(item.sku)}`}
                      className="flex items-center h-8 px-3 rounded-lg text-[11px] font-bold border border-(--border) text-(--text-2) hover:border-navy-400 hover:text-navy-500 transition-colors"
                    >
                      Request Quote
                    </Link>
                    <button
                      onClick={() => remove(item)}
                      aria-label={`Remove ${item.name} from wishlist`}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-(--text-4) hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <Icon d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
