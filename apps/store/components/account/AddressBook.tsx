"use client";

import { useState } from "react";
import {
  Alert, ConfirmDialog, FormField, GhostBtn, Icon, Modal, PageHeader, PrimaryBtn,
  SectionCard, EmptyState, inputBase,
} from "@/components/account/ui";
import type { SerializedAddress } from "@/lib/account/addresses";

const PIN_ICON = "M15 10.5a3 3 0 11-6 0 3 3 0 016 0z M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z";

type Result = { ok: boolean; msg: string } | null;

interface FormState {
  id?: string;
  label: string;
  line1: string;
  line2: string;
  city: string;
  region: string;
  country: string;
  postalCode: string;
  phone: string;
  isDefaultShipping: boolean;
  isDefaultBilling: boolean;
}

const EMPTY_FORM: FormState = {
  label: "", line1: "", line2: "", city: "", region: "",
  country: "Ghana", postalCode: "", phone: "",
  isDefaultShipping: false, isDefaultBilling: false,
};

function AddressForm({ open, initial, busy, onClose, onSubmit }: {
  open: boolean;
  initial: FormState;
  busy: boolean;
  onClose: () => void;
  onSubmit: (form: FormState) => void;
}) {
  // Parent passes a fresh `key` per open, so initial state re-seeds on remount
  const [form, setForm] = useState(initial);
  const set = (k: keyof FormState, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial.id ? "Edit address" : "Add address"}
      description="Used for deliveries, billing, and quotations."
    >
      <form
        onSubmit={(e) => { e.preventDefault(); onSubmit(form); }}
        className="space-y-4"
      >
        <div className="grid sm:grid-cols-2 gap-4">
          <FormField label="Label" hint='e.g. "Head Office", "Tema Warehouse"'>
            <input value={form.label} onChange={(e) => set("label", e.target.value)} placeholder="Head Office" className={inputBase} />
          </FormField>
          <FormField label="Contact phone">
            <input type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+233 XX XXX XXXX" className={inputBase} />
          </FormField>
        </div>
        <FormField label="Street address *">
          <input required value={form.line1} onChange={(e) => set("line1", e.target.value)} placeholder="Street, building, plot" className={inputBase} autoComplete="address-line1" />
        </FormField>
        <FormField label="Address line 2">
          <input value={form.line2} onChange={(e) => set("line2", e.target.value)} placeholder="Suite, floor (optional)" className={inputBase} autoComplete="address-line2" />
        </FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="City *">
            <input required value={form.city} onChange={(e) => set("city", e.target.value)} placeholder="Accra" className={inputBase} autoComplete="address-level2" />
          </FormField>
          <FormField label="Region">
            <input value={form.region} onChange={(e) => set("region", e.target.value)} placeholder="Greater Accra" className={inputBase} autoComplete="address-level1" />
          </FormField>
          <FormField label="Country">
            <input value={form.country} onChange={(e) => set("country", e.target.value)} className={inputBase} autoComplete="country-name" />
          </FormField>
          <FormField label="Postal / GPS code">
            <input value={form.postalCode} onChange={(e) => set("postalCode", e.target.value)} placeholder="GA-123-4567" className={inputBase} autoComplete="postal-code" />
          </FormField>
        </div>

        <div className="flex flex-col gap-2.5 pt-1">
          {([["isDefaultShipping", "Set as default delivery address"], ["isDefaultBilling", "Set as default billing address"]] as const).map(([key, label]) => (
            <label key={key} className="flex items-center gap-2.5 text-sm text-(--text-2) cursor-pointer">
              <input
                type="checkbox"
                checked={form[key]}
                onChange={(e) => set(key, e.target.checked)}
                className="w-4 h-4 rounded accent-[#0057b8]"
              />
              {label}
            </label>
          ))}
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <GhostBtn type="button" onClick={onClose}>Cancel</GhostBtn>
          <PrimaryBtn type="submit" loading={busy} variant="navy">
            {initial.id ? "Save Address" : "Add Address"}
          </PrimaryBtn>
        </div>
      </form>
    </Modal>
  );
}

export default function AddressBook({ initial }: { initial: SerializedAddress[] }) {
  const [addresses, setAddresses] = useState(initial);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<FormState>(EMPTY_FORM);
  const [deleting, setDeleting] = useState<SerializedAddress | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result>(null);

  async function call(path: string, init: RequestInit): Promise<boolean> {
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch(path, { ...init, headers: { "Content-Type": "application/json", ...init.headers } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Request failed");
      setAddresses(data.addresses ?? []);
      return true;
    } catch (err) {
      setResult({ ok: false, msg: err instanceof Error ? err.message : "Something went wrong." });
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function save(form: FormState) {
    const payload = {
      label: form.label, line1: form.line1, line2: form.line2, city: form.city,
      region: form.region, country: form.country, postalCode: form.postalCode, phone: form.phone,
      ...(form.id
        ? { setDefaultShipping: form.isDefaultShipping || undefined, setDefaultBilling: form.isDefaultBilling || undefined }
        : { isDefaultShipping: form.isDefaultShipping, isDefaultBilling: form.isDefaultBilling }),
    };
    const ok = form.id
      ? await call(`/api/me/addresses/${form.id}`, { method: "PATCH", body: JSON.stringify(payload) })
      : await call("/api/me/addresses", { method: "POST", body: JSON.stringify(payload) });
    if (ok) {
      setFormOpen(false);
      setResult({ ok: true, msg: form.id ? "Address updated." : "Address added." });
    }
  }

  async function setDefault(id: string, type: "shipping" | "billing") {
    // Optimistic: flip locally, server response reconciles
    setAddresses((prev) => prev.map((a) => ({
      ...a,
      ...(type === "shipping" ? { isDefaultShipping: a.id === id } : { isDefaultBilling: a.id === id }),
    })));
    await call(`/api/me/addresses/${id}`, {
      method: "PATCH",
      body: JSON.stringify(type === "shipping" ? { setDefaultShipping: true } : { setDefaultBilling: true }),
    });
  }

  async function remove() {
    if (!deleting) return;
    const ok = await call(`/api/me/addresses/${deleting.id}`, { method: "DELETE" });
    if (ok) setResult({ ok: true, msg: "Address deleted." });
    setDeleting(null);
  }

  function openAdd() {
    setEditing({ ...EMPTY_FORM });
    setFormOpen(true);
  }

  function openEdit(a: SerializedAddress) {
    setEditing({
      id: a.id, label: a.label, line1: a.line1, line2: a.line2, city: a.city,
      region: a.region, country: a.country, postalCode: a.postalCode, phone: a.phone,
      isDefaultShipping: a.isDefaultShipping, isDefaultBilling: a.isDefaultBilling,
    });
    setFormOpen(true);
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader
        title="Addresses"
        subtitle="Manage your saved delivery and billing addresses."
        action={<PrimaryBtn type="button" variant="navy" onClick={openAdd}>Add Address</PrimaryBtn>}
      />

      {result && <Alert type={result.ok ? "success" : "error"} message={result.msg} />}

      {addresses.length === 0 ? (
        <div className="bg-(--bg-surface) border border-(--border) rounded-2xl">
          <EmptyState
            icon={PIN_ICON}
            title="No saved addresses"
            description="Add delivery and billing addresses to speed up quotations and checkout."
            action={<PrimaryBtn type="button" variant="navy" onClick={openAdd}>Add Your First Address</PrimaryBtn>}
          />
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {addresses.map((a) => (
            <div key={a.id} className="bg-(--bg-surface) border border-(--border) rounded-2xl p-5 flex flex-col">
              <div className="flex items-start justify-between gap-2 mb-2">
                <p className="text-sm font-bold text-(--text-1)">{a.label}</p>
                <div className="flex gap-1 flex-wrap justify-end">
                  {a.isDefaultShipping && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-navy-50 text-navy-600 dark:bg-navy-900/30 dark:text-navy-300">Delivery</span>
                  )}
                  {a.isDefaultBilling && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400">Billing</span>
                  )}
                </div>
              </div>
              <p className="text-sm text-(--text-2) leading-relaxed flex-1">
                {a.line1}{a.line2 ? <>, {a.line2}</> : null}<br />
                {[a.city, a.region].filter(Boolean).join(", ")}<br />
                {[a.country, a.postalCode].filter(Boolean).join(" · ")}
                {a.phone && <><br /><span className="text-(--text-4)">{a.phone}</span></>}
              </p>
              <div className="flex items-center gap-3 mt-4 pt-3 border-t border-(--border) text-xs font-semibold flex-wrap">
                <button onClick={() => openEdit(a)} className="text-navy-500 hover:text-navy-400 transition-colors">Edit</button>
                {!a.isDefaultShipping && (
                  <button onClick={() => setDefault(a.id, "shipping")} className="text-(--text-3) hover:text-(--text-1) transition-colors">
                    Make delivery default
                  </button>
                )}
                {!a.isDefaultBilling && (
                  <button onClick={() => setDefault(a.id, "billing")} className="text-(--text-3) hover:text-(--text-1) transition-colors">
                    Make billing default
                  </button>
                )}
                <button onClick={() => setDeleting(a)} className="text-(--text-4) hover:text-red-500 transition-colors ml-auto">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <SectionCard title="About Addresses" description="How saved addresses are used in your account.">
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { label: "Delivery Address", desc: "Prefills your delivery details on quotations and is used as the default ship-to address for orders." },
            { label: "Billing Address", desc: "Used for invoices and payment records. Typically your registered business or personal address." },
          ].map((t) => (
            <div key={t.label} className="p-4 rounded-xl bg-(--bg-raised) border border-(--border)">
              <Icon d={PIN_ICON} size={16} className="text-(--text-4) mb-2" />
              <p className="text-sm font-bold text-(--text-1) mb-1">{t.label}</p>
              <p className="text-xs text-(--text-3) leading-relaxed">{t.desc}</p>
            </div>
          ))}
        </div>
      </SectionCard>

      <AddressForm
        key={editing.id ?? `new-${formOpen}`}
        open={formOpen}
        initial={editing}
        busy={busy}
        onClose={() => setFormOpen(false)}
        onSubmit={save}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={remove}
        title="Delete address"
        message={`Remove "${deleting?.label}"? This cannot be undone.`}
        confirmLabel="Delete"
        danger
        loading={busy}
      />
    </div>
  );
}
