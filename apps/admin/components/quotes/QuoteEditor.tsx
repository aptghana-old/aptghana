"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle, CheckCircle2, Copy, CreditCard, Lock, Package, Plus,
  Save, Search, Trash2, Truck, X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  QUOTE_STATUS_LABELS,
  QUOTE_TRANSITIONS,
  EDITABLE_STATUSES,
  APPROVABLE_STATUSES,
  computeQuoteTotals,
  allItemsPriced,
  type QuoteStatus,
  type QuoteTotals,
} from "@apt/types";

/* ─── Types ───────────────────────────────────────────────────────────────── */
export interface EditorItem {
  key: string;
  productId?: string;
  sku?: string;
  name: string;
  brand?: string;
  image?: string;
  quantity: number;
  unitPrice: number | null;
  notes: string;
}

export interface EditorQuote {
  id: string;
  ref: string;
  quoteNumber?: string;
  status: QuoteStatus;
  paymentStatus: string;
  pricingLocked: boolean;
  payUrl: string | null;
  items: EditorItem[];
  totals: QuoteTotals | null;
  quoteNote: string;
  internalNote: string;
  expiresAt: string | null;
  payment: { reference: string; channel?: string; paidAt?: string; amount?: number } | null;
}

interface PickerProduct {
  id: string;
  sku: string;
  name: string;
  brandSlug: string;
  imageUrl: string;
  listPrice: number;
  currency: string;
  minQty: number;
}

const fmt = (n: number, cur: string) =>
  `${cur} ${n.toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/* ─── Product picker (add / replace) ──────────────────────────────────────── */
function ProductPicker({ onSelect, onClose }: {
  onSelect: (p: PickerProduct) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PickerProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const q = query.trim();
    const timer = setTimeout(async () => {
      if (q.length < 2) {
        setResults([]);
        setLoading(false);
        return;
      }
      abortRef.current?.abort();
      const ctl = new AbortController();
      abortRef.current = ctl;
      setLoading(true);
      try {
        const res = await fetch(`/api/quotes/product-search?q=${encodeURIComponent(q)}`, { signal: ctl.signal });
        const data = (await res.json()) as { products: PickerProduct[] };
        setResults(data.products ?? []);
      } catch { /* aborted or failed */ }
      finally { setLoading(false); }
    }, q.length < 2 ? 0 : 250);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="card p-4 space-y-3" style={{ borderColor: "var(--apt-border-strong)" }}>
      <div className="flex items-center gap-2">
        <Input
          autoFocus
          placeholder="Search catalogue by SKU, MPN, or name…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          icon={<Search size={13} />}
          wrapperClass="flex-1"
        />
        <Button variant="ghost" size="sm" icon={<X size={13} />} onClick={onClose} aria-label="Close product search" />
      </div>

      {loading && <p className="text-[12px]" style={{ color: "var(--apt-text-muted)" }}>Searching…</p>}

      {results.length > 0 && (
        <ul className="divide-y max-h-72 overflow-auto" style={{ borderColor: "var(--apt-border)" }}>
          {results.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => onSelect(p)}
                className="w-full flex items-center gap-3 px-2 py-2.5 text-left rounded-md transition-colors hover:bg-[var(--apt-bg-raised)]"
              >
                <div className="w-9 h-9 rounded-md flex items-center justify-center shrink-0 overflow-hidden" style={{ background: "var(--apt-bg-raised)" }}>
                  {p.imageUrl
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={p.imageUrl} alt="" className="w-full h-full object-contain p-1" />
                    : <Package size={13} style={{ color: "var(--apt-text-muted)" }} />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium truncate" style={{ color: "var(--apt-text-primary)" }}>{p.name}</p>
                  <p className="font-mono text-[11px]" style={{ color: "var(--apt-text-muted)" }}>{p.sku}</p>
                </div>
                <span className="text-[12px] tabular-nums shrink-0" style={{ color: "var(--apt-text-secondary)" }}>
                  {p.listPrice > 0 ? fmt(p.listPrice, p.currency) : "Unpriced"}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {!loading && query.trim().length >= 2 && results.length === 0 && (
        <p className="text-[12px]" style={{ color: "var(--apt-text-muted)" }}>No matching products.</p>
      )}
    </div>
  );
}

/* ─── Editor ──────────────────────────────────────────────────────────────── */
export default function QuoteEditor({ quote }: { quote: EditorQuote }) {
  const router = useRouter();

  const editable = !quote.pricingLocked && EDITABLE_STATUSES.includes(quote.status);
  const approvable = APPROVABLE_STATUSES.includes(quote.status);

  const [items, setItems] = useState<EditorItem[]>(quote.items);
  const [discount, setDiscount] = useState(quote.totals?.discount ?? 0);
  const [taxRate, setTaxRate] = useState(quote.totals?.taxRate ?? 0);
  const [shipping, setShipping] = useState(quote.totals?.shipping ?? 0);
  const [currency, setCurrency] = useState(quote.totals?.currency ?? "GHS");
  const [validityDays, setValidityDays] = useState(14);
  const [quoteNote, setQuoteNote] = useState(quote.quoteNote);
  const [internalNote, setInternalNote] = useState(quote.internalNote);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [replaceKey, setReplaceKey] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [approving, setApproving] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const totals = useMemo(
    () => computeQuoteTotals({
      items: items.map((i) => ({ quantity: i.quantity, unitPrice: i.unitPrice ?? undefined })),
      discount, taxRate, shipping, currency,
    }),
    [items, discount, taxRate, shipping, currency],
  );
  const priced = allItemsPriced(items.map((i) => ({ quantity: i.quantity, unitPrice: i.unitPrice ?? undefined })));

  const setItem = useCallback((key: string, patch: Partial<EditorItem>) => {
    setItems((prev) => prev.map((i) => (i.key === key ? { ...i, ...patch } : i)));
  }, []);

  function addProduct(p: PickerProduct) {
    const newItem: EditorItem = {
      key: `new-${p.id}-${Date.now()}`,
      productId: p.id,
      sku: p.sku,
      name: p.name,
      brand: p.brandSlug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
      image: p.imageUrl,
      quantity: Math.max(1, p.minQty),
      unitPrice: p.listPrice > 0 ? p.listPrice : null,
      notes: "",
    };
    if (replaceKey) {
      setItems((prev) => prev.map((i) => (i.key === replaceKey ? { ...newItem, quantity: i.quantity, notes: i.notes } : i)));
      setReplaceKey(null);
    } else if (items.some((i) => i.productId === p.id)) {
      setNotice("Product is already on this quote.");
    } else {
      setItems((prev) => [...prev, newItem]);
    }
    setPickerOpen(false);
  }

  async function save(silent = false): Promise<boolean> {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/quotes/${quote.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            productId: i.productId,
            sku: i.sku,
            name: i.name,
            brand: i.brand,
            image: i.image,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            notes: i.notes,
          })),
          discount, taxRate, shipping, currency,
          validityDays,
          quoteNote, internalNote,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to save quote");
        return false;
      }
      if (!silent) {
        setNotice("Quote saved.");
        router.refresh();
      }
      return true;
    } catch {
      setError("Network error while saving.");
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function approve() {
    if (!priced) {
      setError("Every product needs a valid unit price before the quote can be approved.");
      return;
    }
    const ok = window.confirm(
      `Approve this quote for ${fmt(totals.grandTotal, currency)}?\n\nPricing will be locked and the customer will receive the approval email with a payment link.`,
    );
    if (!ok) return;

    setApproving(true);
    setError(null);
    try {
      const saved = await save(true);
      if (!saved) return;

      const res = await fetch(`/api/quotes/${quote.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ validityDays }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Approval failed");
        return;
      }
      setNotice(
        data.orderRef
          ? `Approved as ${data.quoteNumber} — order ${data.orderRef} created, awaiting payment. Customer email queued.`
          : `Approved as ${data.quoteNumber}. Customer email queued.`,
      );
      router.refresh();
    } catch {
      setError("Network error during approval.");
    } finally {
      setApproving(false);
    }
  }

  async function transition(target: QuoteStatus) {
    setTransitioning(true);
    setError(null);
    try {
      const res = await fetch(`/api/quotes/${quote.id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: target }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error ?? "Transition failed");
      else router.refresh();
    } catch {
      setError("Network error.");
    } finally {
      setTransitioning(false);
    }
  }

  const payUrl = quote.payUrl;

  const nextStatuses = (QUOTE_TRANSITIONS[quote.status] ?? []).filter(
    (s) => !["approved", "paid"].includes(s),
  );

  return (
    <div className="space-y-5">
      {/* Alerts */}
      {error && (
        <div className="flex items-start gap-2 px-4 py-3 rounded-lg text-[13px]" style={{ background: "#fef2f2", color: "#b91c1c", border: "1px solid #fecaca" }}>
          <AlertTriangle size={15} className="shrink-0 mt-0.5" />
          {error}
        </div>
      )}
      {notice && !error && (
        <div className="flex items-start gap-2 px-4 py-3 rounded-lg text-[13px]" style={{ background: "#f0fdf4", color: "#15803d", border: "1px solid #bbf7d0" }}>
          <CheckCircle2 size={15} className="shrink-0 mt-0.5" />
          {notice}
        </div>
      )}

      {/* Locked / payment banner */}
      {quote.pricingLocked && (
        <div className="card p-4 flex items-center gap-3 flex-wrap">
          <Lock size={15} style={{ color: "var(--apt-text-brand)" }} />
          <div className="flex-1 min-w-[200px]">
            <p className="text-[13px] font-semibold" style={{ color: "var(--apt-text-primary)" }}>
              Pricing locked — approved as {quote.quoteNumber}
            </p>
            <p className="text-[12px]" style={{ color: "var(--apt-text-muted)" }}>
              {quote.paymentStatus === "paid"
                ? `Paid${quote.payment ? ` · ${quote.payment.reference}` : ""}`
                : `Awaiting payment${quote.expiresAt ? ` · valid until ${new Date(quote.expiresAt).toLocaleDateString("en-GH")}` : ""}`}
            </p>
          </div>
          {payUrl && quote.paymentStatus !== "paid" && (
            <Button
              variant="secondary"
              size="sm"
              icon={copied ? <CheckCircle2 size={13} /> : <Copy size={13} />}
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(payUrl);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                } catch { /* clipboard unavailable */ }
              }}
            >
              {copied ? "Copied" : "Copy payment link"}
            </Button>
          )}
        </div>
      )}

      {/* Items */}
      <div className="card overflow-hidden">
        <div className="card-header flex items-center justify-between">
          <h2 className="text-[14px] font-semibold" style={{ color: "var(--apt-text-primary)" }}>
            Line Items ({items.length})
          </h2>
          {editable && (
            <Button variant="secondary" size="sm" icon={<Plus size={13} />} onClick={() => { setReplaceKey(null); setPickerOpen(true); }}>
              Add product
            </Button>
          )}
        </div>

        {pickerOpen && (
          <div className="p-4" style={{ borderBottom: "1px solid var(--apt-border)" }}>
            <ProductPicker onSelect={addProduct} onClose={() => { setPickerOpen(false); setReplaceKey(null); }} />
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="data-table w-full">
            <thead>
              <tr>
                <th>Product</th>
                <th className="text-right" style={{ width: 90 }}>Qty</th>
                <th className="text-right" style={{ width: 140 }}>Unit Price ({currency})</th>
                <th className="text-right" style={{ width: 120 }}>Line Total</th>
                {editable && <th style={{ width: 80 }} />}
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const line = item.unitPrice !== null ? item.unitPrice * item.quantity : null;
                const unpriced = item.unitPrice === null || item.unitPrice <= 0;
                return (
                  <tr key={item.key}>
                    <td>
                      <div className="flex items-start gap-3 py-1">
                        <div className="w-9 h-9 rounded-md flex items-center justify-center shrink-0 overflow-hidden" style={{ background: "var(--apt-bg-raised)" }}>
                          {item.image
                            // eslint-disable-next-line @next/next/no-img-element
                            ? <img src={item.image} alt="" className="w-full h-full object-contain p-1" />
                            : <Package size={13} style={{ color: "var(--apt-text-muted)" }} />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13px] font-medium leading-snug" style={{ color: "var(--apt-text-primary)" }}>{item.name}</p>
                          <p className="font-mono text-[11px]" style={{ color: "var(--apt-text-muted)" }}>
                            {[item.sku, item.brand].filter(Boolean).join(" · ")}
                          </p>
                          {editable ? (
                            <input
                              value={item.notes}
                              onChange={(e) => setItem(item.key, { notes: e.target.value })}
                              placeholder="Line note (visible to customer)…"
                              className="mt-1.5 w-full max-w-md h-7 px-2 rounded text-[12px] focus:outline-none focus:ring-1"
                              style={{ background: "var(--apt-bg-raised)", color: "var(--apt-text-secondary)", border: "1px solid var(--apt-border)" }}
                            />
                          ) : item.notes ? (
                            <p className="text-[11px] italic mt-1" style={{ color: "var(--apt-text-secondary)" }}>“{item.notes}”</p>
                          ) : null}
                        </div>
                      </div>
                    </td>
                    <td className="text-right align-top pt-3">
                      {editable ? (
                        <input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) => setItem(item.key, { quantity: Math.max(1, parseInt(e.target.value, 10) || 1) })}
                          className="w-16 h-8 px-2 rounded-md text-right text-[13px] tabular-nums focus:outline-none focus:ring-1"
                          style={{ background: "var(--apt-bg)", color: "var(--apt-text-primary)", border: "1px solid var(--apt-border)" }}
                          aria-label={`Quantity for ${item.name}`}
                        />
                      ) : (
                        <span className="tabular-nums">{item.quantity}</span>
                      )}
                    </td>
                    <td className="text-right align-top pt-3">
                      {editable ? (
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={item.unitPrice ?? ""}
                          placeholder="0.00"
                          onChange={(e) => {
                            const v = e.target.value;
                            setItem(item.key, { unitPrice: v === "" ? null : Math.max(0, parseFloat(v) || 0) });
                          }}
                          className="w-28 h-8 px-2 rounded-md text-right text-[13px] tabular-nums focus:outline-none focus:ring-1"
                          style={{
                            background: "var(--apt-bg)",
                            color: "var(--apt-text-primary)",
                            border: `1px solid ${unpriced ? "#f59e0b" : "var(--apt-border)"}`,
                          }}
                          aria-label={`Unit price for ${item.name}`}
                        />
                      ) : (
                        <span className="tabular-nums">{item.unitPrice !== null ? fmt(item.unitPrice, currency) : "—"}</span>
                      )}
                    </td>
                    <td className="text-right align-top pt-3">
                      <span className="tabular-nums font-medium" style={{ color: "var(--apt-text-primary)" }}>
                        {line !== null ? fmt(line, currency) : <span style={{ color: "var(--apt-text-disabled)" }}>—</span>}
                      </span>
                    </td>
                    {editable && (
                      <td className="text-right align-top pt-2.5">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost" size="xs" icon={<Search size={12} />}
                            title="Replace with another product"
                            onClick={() => { setReplaceKey(item.key); setPickerOpen(true); }}
                          />
                          <Button
                            variant="ghost" size="xs" icon={<Trash2 size={12} />}
                            title="Remove line"
                            onClick={() => setItems((prev) => prev.filter((i) => i.key !== item.key))}
                          />
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {!priced && editable && (
          <div className="flex items-center gap-2 px-5 py-2.5 text-[12px]" style={{ background: "#fffbeb", color: "#92400e", borderTop: "1px solid var(--apt-border)" }}>
            <AlertTriangle size={13} />
            All lines need a unit price greater than zero before this quote can be approved.
          </div>
        )}
      </div>

      {/* Pricing adjustments + totals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card p-5 space-y-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--apt-text-muted)" }}>Adjustments</p>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label={`Discount (${currency})`} type="number" min={0} step="0.01"
              value={discount} disabled={!editable}
              onChange={(e) => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
            />
            <Input
              label="Tax rate (%)" type="number" min={0} step="0.5"
              value={taxRate} disabled={!editable}
              onChange={(e) => setTaxRate(Math.max(0, parseFloat(e.target.value) || 0))}
            />
            <Input
              label={`Shipping (${currency})`} type="number" min={0} step="0.01"
              value={shipping} disabled={!editable}
              onChange={(e) => setShipping(Math.max(0, parseFloat(e.target.value) || 0))}
            />
            <Input
              label="Validity (days)" type="number" min={1} max={365}
              value={validityDays} disabled={!editable}
              onChange={(e) => setValidityDays(Math.max(1, Math.min(365, parseInt(e.target.value, 10) || 14)))}
              hint={quote.expiresAt ? `Currently valid until ${new Date(quote.expiresAt).toLocaleDateString("en-GH")}` : undefined}
            />
            <div className="col-span-2">
              <Input
                label="Currency" value={currency} disabled={!editable} maxLength={3}
                onChange={(e) => setCurrency(e.target.value.toUpperCase().slice(0, 3) || "GHS")}
                hint="ISO code charged at payment — GHS recommended for Paystack Ghana."
              />
            </div>
          </div>
        </div>

        <div className="card p-5">
          <p className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--apt-text-muted)" }}>Totals</p>
          <dl className="space-y-2 text-[13px]">
            <div className="flex justify-between">
              <dt style={{ color: "var(--apt-text-secondary)" }}>Subtotal</dt>
              <dd className="tabular-nums font-medium" style={{ color: "var(--apt-text-primary)" }}>{fmt(totals.subtotal, currency)}</dd>
            </div>
            {totals.discount > 0 && (
              <div className="flex justify-between">
                <dt style={{ color: "var(--apt-text-secondary)" }}>Discount</dt>
                <dd className="tabular-nums" style={{ color: "#dc2626" }}>− {fmt(totals.discount, currency)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt style={{ color: "var(--apt-text-secondary)" }}>Tax ({totals.taxRate}%)</dt>
              <dd className="tabular-nums" style={{ color: "var(--apt-text-primary)" }}>{fmt(totals.taxAmount, currency)}</dd>
            </div>
            <div className="flex justify-between">
              <dt style={{ color: "var(--apt-text-secondary)" }}>Shipping</dt>
              <dd className="tabular-nums" style={{ color: "var(--apt-text-primary)" }}>{fmt(totals.shipping, currency)}</dd>
            </div>
            <div className="flex justify-between pt-2.5 mt-1" style={{ borderTop: "1px solid var(--apt-border)" }}>
              <dt className="text-[14px] font-semibold" style={{ color: "var(--apt-text-primary)" }}>Grand Total</dt>
              <dd className="text-[16px] font-bold tabular-nums" style={{ color: "var(--apt-text-brand)" }}>{fmt(totals.grandTotal, currency)}</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Notes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card p-5">
          <label className="block text-[12px] font-medium mb-1.5" style={{ color: "var(--apt-text-primary)" }}>
            Note to customer <span style={{ color: "var(--apt-text-muted)" }}>(shown on the quote email)</span>
          </label>
          <textarea
            value={quoteNote} disabled={!editable}
            onChange={(e) => setQuoteNote(e.target.value)}
            rows={3} maxLength={5000}
            className="w-full px-3 py-2 rounded-md text-[13px] focus:outline-none focus:ring-1 disabled:opacity-50 resize-y"
            style={{ background: "var(--apt-bg)", color: "var(--apt-text-primary)", border: "1px solid var(--apt-border)" }}
            placeholder="Lead times, delivery terms, alternatives offered…"
          />
        </div>
        <div className="card p-5">
          <label className="block text-[12px] font-medium mb-1.5" style={{ color: "var(--apt-text-primary)" }}>
            Internal note <span style={{ color: "var(--apt-text-muted)" }}>(sales only)</span>
          </label>
          <textarea
            value={internalNote}
            onChange={(e) => setInternalNote(e.target.value)}
            rows={3} maxLength={5000}
            className="w-full px-3 py-2 rounded-md text-[13px] focus:outline-none focus:ring-1 resize-y"
            style={{ background: "var(--apt-bg)", color: "var(--apt-text-primary)", border: "1px solid var(--apt-border)" }}
            placeholder="Margin notes, supplier info, follow-ups…"
          />
        </div>
      </div>

      {/* Action bar */}
      <div className="card p-4 flex items-center gap-3 flex-wrap sticky bottom-4" style={{ boxShadow: "var(--apt-shadow-lg, 0 8px 24px rgba(0,0,0,0.12))" }}>
        {editable ? (
          <>
            <Button variant="secondary" size="md" icon={<Save size={14} />} loading={saving} onClick={() => save()}>
              Save changes
            </Button>
            {approvable && (
              <Button
                variant="primary" size="md" icon={<CheckCircle2 size={14} />}
                loading={approving} disabled={!priced || saving}
                title={priced ? undefined : "Every line needs a valid unit price"}
                onClick={approve}
              >
                Approve Quote · {fmt(totals.grandTotal, currency)}
              </Button>
            )}
            <span className="text-[12px] ml-auto" style={{ color: "var(--apt-text-muted)" }}>
              Approving locks pricing and emails the customer a payment link.
            </span>
          </>
        ) : (
          <>
            {quote.paymentStatus === "paid" && quote.payment && (
              <span className="flex items-center gap-2 text-[13px]" style={{ color: "var(--apt-text-primary)" }}>
                <CreditCard size={14} style={{ color: "#16a34a" }} />
                Paid {quote.payment.amount ? fmt(quote.payment.amount, currency) : ""} · ref{" "}
                <span className="font-mono">{quote.payment.reference}</span>
                {quote.payment.channel ? ` · ${quote.payment.channel}` : ""}
              </span>
            )}
            {nextStatuses.length > 0 && (
              <div className="flex items-center gap-2 ml-auto">
                <Truck size={14} style={{ color: "var(--apt-text-muted)" }} />
                {nextStatuses.map((s) => (
                  <Button
                    key={s}
                    variant={s === "cancelled" ? "destructive" : "secondary"}
                    size="sm"
                    loading={transitioning}
                    onClick={() => transition(s)}
                  >
                    {QUOTE_STATUS_LABELS[s]}
                  </Button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
