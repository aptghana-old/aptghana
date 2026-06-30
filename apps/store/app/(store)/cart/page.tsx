"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart, type CartItem } from "@/lib/store/cart";
import { EMAIL_SALES } from "@apt/config";

/* ── Constants ──────────────────────────────────────────────────────────────── */
const ACCENT = "#0057b8";
const ACCENT_DARK = "#003d82";
const FREE_THRESHOLD = 500; // display currency units
const VAT_RATE = 0.15;

/* ── Icon helper ─────────────────────────────────────────────────────────────── */
function Ico({ d, size = 16, sw = 1.8 }: { d: string; size?: number; sw?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={d} />
    </svg>
  );
}

const IC = {
  cart: "M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z",
  trash: "M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13",
  heart: "M12 20s-7-4.4-9.4-8.8C1.1 8 2.6 4.6 6 4.6c2 0 3.2 1.2 4 2.3.8-1.1 2-2.3 4-2.3 3.4 0 4.9 3.4 3.4 6.6C19 15.6 12 20 12 20z",
  chevL: "M15 18l-6-6 6-6",
  check: "M4.5 12.75l6 6 9-13.5",
  card: "M3 7h18v10H3zM3 11h18M7 15h3",
  dl: "M9 11l3 3 3-3M12 4v9M5 20h14",
  shield: "M12 2l7 3v6c0 4.5-3 8-7 11-4-3-7-6.5-7-11V5z",
  refresh: "M3 12a9 9 0 1 0 3-6.7M3 4v4h4",
  invoice: "M3 7h18v10H3zM3 11h18M7 15h3",
  box: "M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z",
  lock: "M8 10V7a4 4 0 0 1 8 0v3M4 10h16v10H4z",
  phone: "M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z",
  mail: "M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75",
};

/* ── Helpers ─────────────────────────────────────────────────────────────────── */
function fmt(n: number, cur = "GHS") {
  try {
    return new Intl.NumberFormat("en-GH", { style: "currency", currency: cur, minimumFractionDigits: 2 }).format(n);
  } catch {
    return `${cur} ${n.toFixed(2)}`;
  }
}

function relTime(ts: number) {
  const diff = Date.now() - ts;
  const M = 60000, H = 3600000, D = 86400000;
  if (diff < H) return `Added ${Math.max(1, Math.round(diff / M))} min ago`;
  if (diff < D) { const h = Math.round(diff / H); return `Added ${h} hr${h !== 1 ? "s" : ""} ago`; }
  const d = Math.round(diff / D);
  return `Added ${d} day${d !== 1 ? "s" : ""} ago`;
}

function itemStamp(item: CartItem) {
  if (item.sku) return item.sku.split("-")[ 0 ].slice(0, 3);
  return item.name.slice(0, 2).toUpperCase();
}

/* ── Checkbox ────────────────────────────────────────────────────────────────── */
function Checkbox({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button type="button" onClick={onChange} aria-pressed={checked}
      className="flex-none flex items-center justify-center rounded-[4px] transition-colors"
      style={{ width: 17, height: 17, border: `1.5px solid ${checked ? ACCENT : "#cfd8dc"}`, background: checked ? ACCENT : "#fff", color: "#fff" }}>
      {checked && <Ico d={IC.check} size={9} sw={2.5} />}
    </button>
  );
}

/* ── Cart line-item card ─────────────────────────────────────────────────────── */
function CartRow({ item, selected, onSelect, onSave, onRemove, onQtyChange }: {
  item: CartItem;
  selected: boolean;
  onSelect: () => void;
  onSave: () => void;
  onRemove: () => void;
  onQtyChange: (qty: number) => void;
}) {
  const [ imgFailed, setImgFailed ] = useState(false);
  const lineTotal = item.price > 0 ? item.price * item.qty : null;

  return (
    <div className="flex gap-3 sm:gap-[18px] rounded-lg p-3 sm:p-[18px] relative transition-all"
      style={{ background: "#fff", border: `1px solid ${selected ? ACCENT : "#e1e7ea"}`, boxShadow: "0 1px 2px rgba(15,30,40,.04)" }}>

      {/* Selection accent rail */}
      <span className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r-[3px] transition-colors"
        style={{ background: selected ? ACCENT : "transparent" }} aria-hidden />

      {/* Checkbox */}
      <div className="flex-none self-start mt-0.5 lg:ml-2">
        <Checkbox checked={selected} onChange={onSelect} />
      </div>

      {/* Product image */}
      <div className="flex-none relative rounded-[6px] border border-[#eceff1] bg-white overflow-hidden"
        style={{ width: 88, height: 88, }}>
        {item.imageUrl && !imgFailed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.imageUrl} alt={item.name}
            className="absolute inset-0 w-full h-full object-contain"
            onError={() => setImgFailed(true)} />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center font-mono text-[9px] tracking-wider text-[#9fb0b8]">no image</span>
        )}
        {/* Stamp badge */}
        <span className="absolute top-1.5 left-1.5 flex items-center gap-1 bg-white border border-[#e1e7ea] rounded-[4px] px-1 py-0.5">
          <span className="w-[5px] h-[5px] rounded-[1px]" style={{ background: ACCENT }} />
          <span className="font-mono text-[8px] font-semibold text-[#37474f]">{itemStamp(item)}</span>
        </span>
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
        <a href={`/products/${item.sku?.toLowerCase()}`}
          className="text-[14px] sm:text-[15px] font-semibold leading-snug text-[#18222a] line-clamp-2 hover:underline"
          style={{ textDecorationColor: ACCENT }}>
          {item.name}
        </a>
        <div className="flex flex-wrap gap-x-4 gap-y-0.5 font-mono text-[11px] text-[#78909c]">
          {item.sku && <span>SKU <b className="text-[#37474f] font-semibold">{item.sku}</b></span>}
          <span>{relTime(item.addedAt)}</span>
        </div>

        {/* Mobile price */}
        <div className="sm:hidden mt-1">
          {lineTotal ? (
            <span className="text-[16px] font-bold text-[#18222a]">{fmt(lineTotal, item.currency)}</span>
          ) : (
            <span className="text-[13px] font-semibold" style={{ color: ACCENT }}>Price on request</span>
          )}
        </div>

        {/* Mobile qty */}
        <div className="sm:hidden flex items-center gap-2 mt-1">
          <div className="flex items-center border border-[#cfd8dc] rounded-[6px] overflow-hidden h-9">
            <button type="button" onClick={() => onQtyChange(Math.max(item.minQty, item.qty - item.minQty))}
              disabled={item.qty <= item.minQty}
              className="w-9 h-full bg-[#f6f8f9] text-[#5b6b75] text-base disabled:opacity-40">−</button>
            <span className="w-9 text-center font-mono text-[13px] font-semibold text-[#28333b]">{item.qty}</span>
            <button type="button" onClick={() => onQtyChange(item.qty + item.minQty)}
              className="w-9 h-full bg-[#f6f8f9] text-[#5b6b75] text-base">+</button>
          </div>
          {item.price > 0 && <span className="text-[11px] text-[#8a98a0]">{fmt(item.price, item.currency)} each</span>}
        </div>

        {/* Row actions */}
        <div className="flex items-center gap-4 mt-auto pt-1.5">
          <button type="button" onClick={onSave}
            className="flex items-center gap-1.5 text-[12px] font-medium text-[#5b6b75] transition-colors hover:text-[#0057b8]">
            <Ico d={IC.heart} size={13} sw={1.8} />
            Save for later
          </button>
          <button type="button" onClick={onRemove}
            className="flex items-center gap-1.5 text-[12px] font-medium text-[#5b6b75] transition-colors hover:text-red-600">
            <Ico d={IC.trash} size={13} sw={1.8} />
            Remove
          </button>
        </div>
      </div>

      {/* Desktop: qty + price panel */}
      <div className="hidden sm:flex flex-none w-[180px] flex-col items-end gap-2.5 pl-[18px] border-l border-[#f1f4f5]">
        <div className="flex flex-col items-end gap-1">
          <span className="font-mono text-[10px] tracking-widest text-[#9fb0b8]">QUANTITY</span>
          <div className="flex items-center border border-[#cfd8dc] rounded-[6px] overflow-hidden h-[38px]">
            <button type="button" onClick={() => onQtyChange(Math.max(item.minQty, item.qty - item.minQty))}
              disabled={item.qty <= item.minQty}
              className="w-[34px] h-full bg-[#f6f8f9] text-[#5b6b75] text-[17px] hover:bg-[#eceff1] disabled:opacity-40 transition-colors">−</button>
            <input type="number" value={item.qty} min={item.minQty} step={item.minQty}
              onChange={(e) => { const v = parseInt(e.target.value, 10); if (!isNaN(v)) onQtyChange(v); }}
              className="w-[44px] h-full border-x border-[#eceff1] text-center font-mono text-[14px] font-semibold text-[#28333b] bg-white outline-none" />
            <button type="button" onClick={() => onQtyChange(item.qty + item.minQty)}
              className="w-[34px] h-full bg-[#f6f8f9] text-[#5b6b75] text-[17px] hover:bg-[#eceff1] transition-colors">+</button>
          </div>
          <span className="font-mono text-[10px]" style={{ color: item.qty <= item.minQty && item.minQty > 1 ? ACCENT : "#9fb0b8" }}>
            {item.minQty > 1 ? `Min order ${item.minQty}` : "Single units"}
          </span>
        </div>
        <div className="flex flex-col items-end gap-0.5 mt-auto">
          <span className="text-[12px] text-[#8a98a0]">
            {item.price > 0 ? `${fmt(item.price, item.currency)} each` : "Price on request"}
          </span>
          <span className="text-[22px] font-bold tracking-tight text-[#18222a] leading-none">
            {lineTotal ? fmt(lineTotal, item.currency) : "—"}
          </span>
          <span className="font-mono text-[10.5px] text-[#9fb0b8]">ex VAT</span>
        </div>
      </div>
    </div>
  );
}

/* ── Saved-for-later row ─────────────────────────────────────────────────────── */
function SavedRow({ item, onMove }: { item: CartItem; onMove: () => void }) {
  return (
    <div className="flex items-center gap-3 sm:gap-[14px] px-4 py-3 border-b border-[#f1f4f5] last:border-0">
      <div className="flex-none w-14 h-14 rounded-[5px] border border-[#eceff1] overflow-hidden"
        style={{ background: "repeating-linear-gradient(45deg,#eef2f4 0 8px,#f7f9fa 8px 16px)" }}>
        {item.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-contain p-1" />
        )}
      </div>
      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
        <span className="text-[13.5px] font-semibold text-[#18222a] line-clamp-1">{item.name}</span>
        <span className="font-mono text-[10.5px] text-[#9fb0b8]">
          {item.sku ? `SKU ${item.sku} · ` : ""}
          {item.price > 0 ? `${fmt(item.price, item.currency)} each` : "Price on request"}
        </span>
      </div>
      <button type="button" onClick={onMove}
        className="flex-none flex items-center gap-1.5 h-[34px] px-3.5 border border-[#cfd8dc] rounded-[6px] bg-white text-[#37474f] text-[12.5px] font-semibold transition-colors hover:border-[#0057b8] hover:text-[#0057b8]">
        <Ico d={IC.cart} size={13} sw={1.9} />
        <span className="hidden sm:inline">Move to basket</span>
        <span className="sm:hidden">Move</span>
      </button>
    </div>
  );
}

/* ── Bulk action bar ─────────────────────────────────────────────────────────── */
function BulkBar({ live, selected, onSelectAll, onSaveSelected, onRemoveSelected }: {
  live: CartItem[];
  selected: Set<string>;
  onSelectAll: () => void;
  onSaveSelected: () => void;
  onRemoveSelected: () => void;
}) {
  const allSelected = live.length > 0 && live.every((i) => selected.has(i.productId));
  const count = selected.size;
  const hasSelection = count > 0;

  return (
    <div className="flex items-center gap-2.5 sm:gap-[14px] flex-wrap bg-white border border-[#e1e7ea] rounded-lg px-3 sm:px-4 py-2.5 sm:py-[11px]">
      <button type="button" onClick={onSelectAll}
        className="flex items-center gap-2 text-[13px] font-semibold text-[#37474f] bg-transparent border-0 p-0 cursor-pointer">
        <span className="flex-none flex items-center justify-center rounded-[4px] transition-colors"
          style={{ width: 17, height: 17, border: `1.5px solid ${allSelected ? ACCENT : "#cfd8dc"}`, background: allSelected ? ACCENT : "#fff", color: "#fff" }}>
          {allSelected && <Ico d={IC.check} size={9} sw={2.5} />}
        </span>
        Select all
      </button>

      <span className="w-px h-[18px] bg-[#e1e7ea]" aria-hidden />
      <span className="font-mono text-[11.5px] text-[#8a98a0]">
        {count > 0 ? `${count} selected` : "No items selected"}
      </span>

      <div className="flex-1" />

      <button type="button" onClick={onSaveSelected} disabled={!hasSelection}
        className="flex items-center gap-1.5 h-8 px-3 border border-[#cfd8dc] rounded-[6px] bg-white text-[12.5px] font-semibold transition-colors"
        style={{ color: hasSelection ? "#37474f" : "#b6c2c8", cursor: hasSelection ? "pointer" : "default" }}>
        <Ico d={IC.heart} size={13} sw={1.8} />
        <span className="hidden sm:inline">Save for later</span>
        <span className="sm:hidden">Save</span>
      </button>

      <button type="button" onClick={onRemoveSelected} disabled={!hasSelection}
        className="flex items-center gap-1.5 h-8 px-3 border border-[#cfd8dc] rounded-[6px] bg-white text-[12.5px] font-semibold transition-colors"
        style={{ color: hasSelection ? "#37474f" : "#b6c2c8", cursor: hasSelection ? "pointer" : "default" }}>
        <Ico d={IC.trash} size={13} sw={1.8} />
        Remove
      </button>
    </div>
  );
}

/* ── Order summary panel ─────────────────────────────────────────────────────── */
function OrderSummary({ items }: { items: CartItem[] }) {
  const router = useRouter();
  const [ pending, setPending ] = useState(false);
  const [ promoCode, setPromoCode ] = useState("");

  const currency = items[ 0 ]?.currency ?? "GHS";
  const unitCount = items.reduce((s, i) => s + i.qty, 0);
  const subtotalNet = items.reduce((s, i) => s + (i.price > 0 ? i.price * i.qty : 0), 0);
  const freeDelivery = subtotalNet === 0 || subtotalNet >= FREE_THRESHOLD;
  const deliveryNet = freeDelivery ? 0 : 25;
  const vatAmt = (subtotalNet + deliveryNet) * VAT_RATE;
  const total = subtotalNet + deliveryNet + vatAmt;
  const remaining = Math.max(0, FREE_THRESHOLD - subtotalNet);
  const pct = Math.min(100, Math.round((subtotalNet / FREE_THRESHOLD) * 100));
  const hasUnpriced = items.some((i) => i.price <= 0);

  function handleCheckout() {
    setPending(true);
    setTimeout(() => router.push("/request-approval"), 500);
  }

  return (
    <div className="flex flex-col gap-3.5">
      <div className="bg-white border border-[#e1e7ea] rounded-lg overflow-hidden">
        <div className="px-[18px] pt-4 pb-1">
          <h2 className="text-[16px] font-bold text-[#18222a] tracking-tight mb-3.5">Order summary</h2>
          <div className="flex flex-col gap-[11px] pb-3.5 border-b border-[#eceff1]">
            <div className="flex justify-between items-baseline text-[13.5px]">
              <span className="text-[#5b6b75]">
                Subtotal{" "}
                <span className="font-mono text-[11px] text-[#9fb0b8]">({unitCount} {unitCount === 1 ? "item" : "items"})</span>
              </span>
              <span className="font-semibold text-[#18222a]">{subtotalNet > 0 ? fmt(subtotalNet, currency) : "—"}</span>
            </div>
            <div className="flex justify-between items-baseline text-[13.5px]">
              <span className="text-[#5b6b75]">Delivery</span>
              <span className="font-semibold" style={{ color: freeDelivery && subtotalNet > 0 ? ACCENT : "#18222a" }}>
                {subtotalNet === 0 ? "—" : freeDelivery ? "FREE" : fmt(deliveryNet, currency)}
              </span>
            </div>
            <div className="flex justify-between items-baseline text-[13.5px]">
              <span className="text-[#5b6b75]">VAT (15%)</span>
              <span className="font-semibold text-[#18222a]">{vatAmt > 0 ? fmt(vatAmt, currency) : "—"}</span>
            </div>
          </div>
        </div>

        {/* Free delivery progress bar */}
        {!freeDelivery && remaining > 0 && (
          <div className="mx-[18px] my-3 px-3 py-2.5 rounded-[6px]"
            style={{ background: "rgba(0,87,184,0.05)", border: "1px solid rgba(0,87,184,0.15)" }}>
            <div className="text-[11.5px] text-[#37474f] mb-1.5">
              Add <b>{fmt(remaining, currency)}</b> more for <b>FREE delivery</b>
            </div>
            <div className="h-[6px] rounded-full bg-[#e1e7ea] overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, background: ACCENT }} />
            </div>
          </div>
        )}

        <div className="px-[18px] pt-3.5 pb-[18px]">
          {/* Total */}
          <div className="flex justify-between items-baseline mb-3.5">
            <span className="text-[14px] font-bold text-[#18222a]">
              Total <span className="text-[11px] font-normal text-[#9fb0b8]">inc VAT</span>
            </span>
            <span className="text-[25px] font-bold tracking-tight text-[#18222a] leading-none">
              {total > 0 ? fmt(total, currency) : "—"}
            </span>
          </div>

          {hasUnpriced && (
            <p className="text-[11px] text-[#9fb0b8] mb-3">
              * Some items are priced on request and are excluded from this total.
            </p>
          )}

          {/* Promo code */}
          <div className="flex gap-2 mb-3.5">
            <input
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
              placeholder="Promo or contract code"
              className="flex-1 min-w-0 h-10 border border-[#cfd8dc] rounded-[6px] px-3 text-[13px] text-[#28333b] outline-none transition-colors focus:border-[#0057b8]"
            />
            <button type="button"
              className="flex-none h-10 px-4 border border-[#cfd8dc] rounded-[6px] bg-[#f6f8f9] text-[#37474f] text-[13px] font-semibold transition-colors hover:border-[#0057b8] hover:text-[#0057b8]">
              Apply
            </button>
          </div>

          {/* Primary CTA */}
          <button type="button" onClick={handleCheckout}
            className="w-full flex items-center justify-center gap-2 h-12 rounded-[7px] text-[15px] font-semibold text-white transition-all active:scale-[.98]"
            style={{ background: pending ? "#15803d" : ACCENT }}>
            <Ico d={pending ? IC.check : IC.card} size={17} sw={1.9} />
            {pending ? "✓ Proceeding…" : "Proceed to checkout"}
          </button>

          {/* Contact */}
          <div className="mt-4 pt-4 border-t border-[#eceff1] flex flex-col gap-2">
            <a href="tel:+233302123456"
              className="flex items-center gap-2 text-[12px] text-[#8a98a0] hover:text-[#37474f] transition-colors">
              <Ico d={IC.phone} size={12} sw={1.8} />
              +233 30 212 3456
            </a>
            <a href={`mailto:${EMAIL_SALES}`}
              className="flex items-center gap-2 text-[12px] text-[#8a98a0] hover:text-[#37474f] transition-colors">
              <Ico d={IC.mail} size={12} sw={1.8} />
              {EMAIL_SALES}
            </a>
          </div>
        </div>
      </div>

      {/* Trust badges */}
      <div className="bg-white border border-[#e1e7ea] rounded-lg px-4 py-3.5 flex flex-col gap-3">
        {[
          { icon: IC.refresh, title: "Free returns within 30 days", sub: "Unused stock, full refund" },
          { icon: IC.invoice, title: "Trade credit terms available", sub: "30-day invoicing on approved accounts" },
          { icon: IC.shield, title: "Genuine, certified parts", sub: "Direct from authorised brands" },
        ].map(({ icon, title, sub }) => (
          <div key={title} className="flex items-center gap-2.5 text-[#37474f]">
            <span className="flex-none w-7 h-7 rounded-[6px] flex items-center justify-center"
              style={{ background: "rgba(0,87,184,0.07)", color: ACCENT }}>
              <Ico d={icon} size={14} sw={1.9} />
            </span>
            <div className="flex flex-col gap-px min-w-0">
              <span className="text-[12.5px] font-semibold text-[#18222a]">{title}</span>
              <span className="text-[11.5px] text-[#8a98a0]">{sub}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-center gap-2 font-mono text-[10.5px] text-[#9fb0b8]">
        <Ico d={IC.lock} size={12} sw={1.8} />
        Secure checkout · 256-bit encryption
      </div>
    </div>
  );
}

/* ── Empty state ─────────────────────────────────────────────────────────────── */
function EmptyCart() {
  return (
    <div className="max-w-xl mx-auto text-center py-16 px-4">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
        style={{ background: "#f6f8f9", border: "1px solid #e1e7ea" }}>
        <Ico d={IC.box} size={28} sw={1.25} />
      </div>
      <h2 className="text-[22px] font-bold text-[#18222a] mb-2">Your basket is empty</h2>
      <p className="text-[13.5px] text-[#5b6b75] leading-relaxed max-w-sm mx-auto mb-8">
        Browse our 6,000+ product catalogue and add items to your procurement list, or request a
        quotation for a custom or unlisted product.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link href="/search"
          className="inline-flex items-center gap-2 h-11 px-6 rounded-[7px] text-[14px] font-semibold text-white transition-colors"
          style={{ background: ACCENT }}>
          Browse Products
        </Link>
        <Link href="/rfq"
          className="inline-flex items-center gap-2 h-11 px-6 rounded-[7px] text-[14px] font-semibold border border-[#cfd8dc] text-[#37474f] bg-white transition-colors hover:border-[#0057b8] hover:text-[#0057b8]">
          Request a Quote
        </Link>
      </div>
    </div>
  );
}

/* ── Page ────────────────────────────────────────────────────────────────────── */
export default function CartPage() {
  const { items, remove, setQty, add } = useCart();
  const [ selected, setSelected ] = useState<Set<string>>(new Set());
  const [ savedItems, setSavedItems ] = useState<CartItem[]>([]);

  const unitCount = items.reduce((s, i) => s + i.qty, 0);

  function toggleSelect(id: string) {
    setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  function selectAll() {
    const all = items.every((i) => selected.has(i.productId));
    setSelected(all ? new Set() : new Set(items.map((i) => i.productId)));
  }

  function saveItem(item: CartItem) {
    remove(item.productId);
    setSavedItems((prev) => [ ...prev.filter((s) => s.productId !== item.productId), item ]);
    setSelected((prev) => { const n = new Set(prev); n.delete(item.productId); return n; });
  }

  function saveSelected() {
    const toSave = items.filter((i) => selected.has(i.productId));
    toSave.forEach((i) => { remove(i.productId); });
    setSavedItems((prev) => {
      const map = new Map(prev.map((s) => [ s.productId, s ]));
      toSave.forEach((i) => map.set(i.productId, i));
      return [ ...map.values() ];
    });
    setSelected(new Set());
  }

  function removeSelected() {
    selected.forEach((id) => remove(id));
    setSelected(new Set());
  }

  function moveToBasket(item: CartItem) {
    setSavedItems((prev) => prev.filter((s) => s.productId !== item.productId));
    add({ id: item.productId, sku: item.sku, name: item.name, imageUrl: item.imageUrl, price: item.price, currency: item.currency, minQty: item.minQty }, item.qty);
  }

  const isEmpty = items.length === 0 && savedItems.length === 0;

  return (
    <main style={{ background: "#eceff1", minHeight: "100vh" }}>
      {/* Breadcrumb */}
      <div className="bg-white border-b border-[#e1e7ea]">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-[11px] flex items-center gap-2 font-mono text-[11.5px] text-[#8a98a0] flex-wrap">
          <Link href="/" className="transition-colors hover:text-[#37474f]">Home</Link>
          <span className="text-[#cfd8dc]">›</span>
          <span className="text-[#37474f]">Basket</span>
        </div>
      </div>

      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-6">
        {/* Page header */}
        <div className="flex items-end justify-between gap-4 flex-wrap mb-4">
          <div>
            <h1 className="text-[24px] sm:text-[26px] font-bold text-[#18222a] tracking-tight">Your basket</h1>
            {items.length > 0 && (
              <p className="text-[13.5px] text-[#5b6b75] mt-0.5">
                {items.length} {items.length === 1 ? "line" : "lines"} · {unitCount} {unitCount === 1 ? "item" : "items"} in your basket
              </p>
            )}
          </div>
          <Link href="/catalog"
            className="flex items-center gap-1.5 text-[13px] font-semibold text-[#5b6b75] transition-colors hover:text-[#0057b8]">
            <Ico d={IC.chevL} size={15} sw={1.9} />
            Continue shopping
          </Link>
        </div>

        {isEmpty ? (
          <EmptyCart />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-5 items-start">

            {/* ── Cart items column ── */}
            <div className="flex flex-col gap-3.5">
              {items.length > 0 && (
                <>
                  <BulkBar
                    live={items}
                    selected={selected}
                    onSelectAll={selectAll}
                    onSaveSelected={saveSelected}
                    onRemoveSelected={removeSelected}
                  />
                  {items.map((item) => (
                    <CartRow
                      key={item.productId}
                      item={item}
                      selected={selected.has(item.productId)}
                      onSelect={() => toggleSelect(item.productId)}
                      onSave={() => saveItem(item)}
                      onRemove={() => remove(item.productId)}
                      onQtyChange={(qty) => setQty(item.productId, qty)}
                    />
                  ))}
                </>
              )}

              {/* Saved for later section */}
              {savedItems.length > 0 && (
                <div className="bg-white border border-[#e1e7ea] rounded-lg overflow-hidden mt-1.5">
                  <div className="flex items-center gap-2.5 px-4 py-3 border-b border-[#eceff1] bg-[#fafbfc]">
                    <span style={{ color: ACCENT }}><Ico d={IC.heart} size={15} sw={1.9} /></span>
                    <span className="text-[13.5px] font-bold text-[#18222a]">Saved for later</span>
                    <span className="font-mono text-[11.5px] text-[#9fb0b8]">
                      {savedItems.length} {savedItems.length === 1 ? "item" : "items"}
                    </span>
                  </div>
                  {savedItems.map((item) => (
                    <SavedRow key={item.productId} item={item} onMove={() => moveToBasket(item)} />
                  ))}
                </div>
              )}
            </div>

            {/* ── Summary column (sticky desktop, above on mobile) ── */}
            <div className="order-first lg:order-none lg:sticky lg:top-5">
              {items.length > 0 ? (
                <OrderSummary items={items} />
              ) : (
                <div className="bg-white border border-[#e1e7ea] rounded-lg p-5 text-center">
                  <p className="text-[13.5px] text-[#5b6b75] mb-2">Your basket is empty</p>
                  <Link href="/search" className="text-[13px] font-semibold" style={{ color: ACCENT }}>
                    Browse products →
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
