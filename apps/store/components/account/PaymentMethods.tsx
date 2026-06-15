"use client";

import { useState } from "react";
import {
  Alert, ConfirmDialog, FormField, GhostBtn, Icon, Modal, PageHeader, PrimaryBtn,
  SectionCard, EmptyState, inputBase,
} from "@/components/account/ui";
import type { SerializedPaymentMethod } from "@/lib/account/payment-methods";

const CARD_ICON = "M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z";
const PHONE_ICON = "M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18h3";
const BANK_ICON = "M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z";

const TYPE_META: Record<string, { label: string; icon: string }> = {
  card: { label: "Card", icon: CARD_ICON },
  mobile_money: { label: "Mobile Money", icon: PHONE_ICON },
  bank: { label: "Bank Account", icon: BANK_ICON },
};

const MOMO_NETWORKS = ["MTN MoMo", "Telecel Cash", "AT Money"];

type Result = { ok: boolean; msg: string } | null;

/** Brand detection runs locally — the full number is never sent anywhere. */
function detectBrand(digits: string): string {
  if (/^4/.test(digits)) return "Visa";
  if (/^5[1-5]/.test(digits) || /^2[2-7]/.test(digits)) return "Mastercard";
  if (/^3[47]/.test(digits)) return "American Express";
  if (/^6/.test(digits)) return "Discover";
  return "Card";
}

function AddMethodModal({ open, busy, onClose, onSubmit }: {
  open: boolean;
  busy: boolean;
  onClose: () => void;
  onSubmit: (payload: Record<string, unknown>) => void;
}) {
  const [type, setType] = useState<"card" | "mobile_money" | "bank">("card");
  const [number, setNumber] = useState("");      // never leaves the browser
  const [expMonth, setExpMonth] = useState("");
  const [expYear, setExpYear] = useState("");
  const [momoNetwork, setMomoNetwork] = useState(MOMO_NETWORKS[0]);
  const [momoNumber, setMomoNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [label, setLabel] = useState("");
  const [isDefault, setIsDefault] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const digits = (type === "card" ? number : type === "mobile_money" ? momoNumber : accountNumber).replace(/\D/g, "");
    const payload: Record<string, unknown> = {
      type,
      label: label.trim(),
      last4: digits.slice(-4),
      isDefault,
    };
    if (type === "card") {
      payload.brand = detectBrand(digits);
      payload.expMonth = parseInt(expMonth, 10);
      payload.expYear = parseInt(expYear, 10);
    }
    if (type === "mobile_money") payload.momoNetwork = momoNetwork;
    if (type === "bank") payload.bankName = bankName.trim();
    onSubmit(payload);
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add payment method"
      description="Only the last 4 digits are stored — full numbers never leave your device. One-click charging arrives with Paystack tokenization."
    >
      <form onSubmit={submit} className="space-y-4">
        {/* Type selector */}
        <div className="grid grid-cols-3 gap-2">
          {(Object.entries(TYPE_META) as [typeof type, { label: string; icon: string }][]).map(([t, meta]) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              aria-pressed={type === t}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-semibold transition-colors ${
                type === t
                  ? "border-navy-500 text-navy-500 bg-navy-50 dark:bg-navy-900/30"
                  : "border-(--border) text-(--text-3) hover:border-(--border-hi)"
              }`}
            >
              <Icon d={meta.icon} size={18} />
              {meta.label}
            </button>
          ))}
        </div>

        {type === "card" && (
          <>
            <FormField label="Card number" hint="Used only to read the brand and last 4 digits.">
              <input
                required inputMode="numeric" value={number}
                onChange={(e) => setNumber(e.target.value.replace(/[^\d ]/g, "").slice(0, 23))}
                placeholder="4242 4242 4242 4242" className={`${inputBase} font-mono`} autoComplete="cc-number"
              />
            </FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Expiry month">
                <input required inputMode="numeric" value={expMonth}
                  onChange={(e) => setExpMonth(e.target.value.replace(/\D/g, "").slice(0, 2))}
                  placeholder="MM" className={inputBase} autoComplete="cc-exp-month" />
              </FormField>
              <FormField label="Expiry year">
                <input required inputMode="numeric" value={expYear}
                  onChange={(e) => setExpYear(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  placeholder="YYYY" className={inputBase} autoComplete="cc-exp-year" />
              </FormField>
            </div>
          </>
        )}

        {type === "mobile_money" && (
          <>
            <FormField label="Network">
              <select value={momoNetwork} onChange={(e) => setMomoNetwork(e.target.value)} className={inputBase}>
                {MOMO_NETWORKS.map((n) => <option key={n}>{n}</option>)}
              </select>
            </FormField>
            <FormField label="Wallet number" hint="Only the last 4 digits are stored.">
              <input required inputMode="numeric" value={momoNumber}
                onChange={(e) => setMomoNumber(e.target.value.replace(/\D/g, "").slice(0, 12))}
                placeholder="024 XXX XXXX" className={`${inputBase} font-mono`} autoComplete="tel" />
            </FormField>
          </>
        )}

        {type === "bank" && (
          <>
            <FormField label="Bank name">
              <input required value={bankName} onChange={(e) => setBankName(e.target.value)}
                placeholder="e.g. Stanbic Bank Ghana" className={inputBase} />
            </FormField>
            <FormField label="Account number" hint="Only the last 4 digits are stored.">
              <input required inputMode="numeric" value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, "").slice(0, 20))}
                placeholder="Account number" className={`${inputBase} font-mono`} />
            </FormField>
          </>
        )}

        <FormField label="Label (optional)">
          <input value={label} onChange={(e) => setLabel(e.target.value)}
            placeholder='e.g. "Company card"' className={inputBase} maxLength={60} />
        </FormField>

        <label className="flex items-center gap-2.5 text-sm text-(--text-2) cursor-pointer">
          <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)}
            className="w-4 h-4 rounded accent-[#0057b8]" />
          Set as default payment method
        </label>

        <div className="flex justify-end gap-3 pt-2">
          <GhostBtn type="button" onClick={onClose}>Cancel</GhostBtn>
          <PrimaryBtn type="submit" loading={busy} variant="navy">Add Method</PrimaryBtn>
        </div>
      </form>
    </Modal>
  );
}

export default function PaymentMethods({ initial }: { initial: SerializedPaymentMethod[] }) {
  const [methods, setMethods] = useState(initial);
  const [addOpen, setAddOpen] = useState(false);
  const [deleting, setDeleting] = useState<SerializedPaymentMethod | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result>(null);

  async function call(path: string, init: RequestInit): Promise<boolean> {
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch(path, { ...init, headers: { "Content-Type": "application/json" } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Request failed");
      setMethods(data.methods ?? []);
      return true;
    } catch (err) {
      setResult({ ok: false, msg: err instanceof Error ? err.message : "Something went wrong." });
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function add(payload: Record<string, unknown>) {
    const ok = await call("/api/me/payment-methods", { method: "POST", body: JSON.stringify(payload) });
    if (ok) {
      setAddOpen(false);
      setResult({ ok: true, msg: "Payment method added." });
    }
  }

  async function setDefault(id: string) {
    setMethods((prev) => prev.map((m) => ({ ...m, isDefault: m.id === id }))); // optimistic
    await call(`/api/me/payment-methods/${id}`, { method: "PATCH", body: JSON.stringify({ setDefault: true }) });
  }

  async function remove() {
    if (!deleting) return;
    const ok = await call(`/api/me/payment-methods/${deleting.id}`, { method: "DELETE" });
    if (ok) setResult({ ok: true, msg: "Payment method removed." });
    setDeleting(null);
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader
        title="Payment Methods"
        subtitle="Manage your saved cards, mobile money wallets, and bank accounts."
        action={<PrimaryBtn type="button" variant="navy" onClick={() => setAddOpen(true)}>Add Method</PrimaryBtn>}
      />

      {result && <Alert type={result.ok ? "success" : "error"} message={result.msg} />}

      {methods.length === 0 ? (
        <div className="bg-(--bg-surface) border border-(--border) rounded-2xl">
          <EmptyState
            icon={CARD_ICON}
            title="No payment methods saved"
            description="Save a card, mobile money wallet, or bank account to speed up future payments."
            action={<PrimaryBtn type="button" variant="navy" onClick={() => setAddOpen(true)}>Add Your First Method</PrimaryBtn>}
          />
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {methods.map((m) => {
            const meta = TYPE_META[m.type] ?? TYPE_META.card;
            return (
              <div key={m.id} className="bg-(--bg-surface) border border-(--border) rounded-2xl p-5">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-(--bg-raised) flex items-center justify-center">
                    <Icon d={meta.icon} size={18} className="text-(--text-3)" />
                  </div>
                  {m.isDefault && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-navy-50 text-navy-600 dark:bg-navy-900/30 dark:text-navy-300">
                      Default
                    </span>
                  )}
                </div>
                <p className="text-sm font-bold text-(--text-1)">{m.label || `${m.brand} •••• ${m.last4}`}</p>
                <p className="text-xs text-(--text-3) mt-0.5">
                  {m.brand} •••• {m.last4}
                  {m.type === "card" && m.expMonth && m.expYear
                    ? ` · expires ${String(m.expMonth).padStart(2, "0")}/${String(m.expYear).slice(-2)}`
                    : ""}
                </p>
                <div className="flex items-center gap-3 mt-4 pt-3 border-t border-(--border) text-xs font-semibold">
                  {!m.isDefault && (
                    <button onClick={() => setDefault(m.id)} className="text-navy-500 hover:text-navy-400 transition-colors">
                      Make default
                    </button>
                  )}
                  <button onClick={() => setDeleting(m)} className="text-(--text-4) hover:text-red-500 transition-colors ml-auto">
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <SectionCard
        title="How saved methods are used"
        description="Today they prefill your details at checkout; one-click charging is coming with Paystack tokenization."
      >
        <p className="text-xs text-(--text-3) leading-relaxed">
          For your security we only store display details (brand and last 4 digits) — never full
          card or wallet numbers. All payments are processed by Paystack over a secure checkout;
          when card tokenization launches, saved cards will support one-click payment with the
          same security guarantees.
        </p>
      </SectionCard>

      <AddMethodModal
        key={String(addOpen)}
        open={addOpen}
        busy={busy}
        onClose={() => setAddOpen(false)}
        onSubmit={add}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={remove}
        title="Remove payment method"
        message={`Remove ${deleting?.label || `${deleting?.brand} •••• ${deleting?.last4}`}?`}
        confirmLabel="Remove"
        danger
        loading={busy}
      />
    </div>
  );
}
