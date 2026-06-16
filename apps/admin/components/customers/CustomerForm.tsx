"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Select } from "@/components/ui/Input";

export interface CustomerFormData {
  name: string;
  email: string;
  phone: string;
  accountType: string;
  businessType: string;
  company: string;
  jobTitle: string;
  industry: string;
  website: string;
  taxNumber: string;
  status: string;
  notes: string;
  billingAddress: { line1: string; line2: string; city: string; region: string; country: string; postalCode: string };
  shippingAddress: { line1: string; line2: string; city: string; region: string; country: string; postalCode: string };
}

interface Props {
  customerId?: string;
  initial?: Partial<CustomerFormData>;
}

const EMPTY_ADDRESS = { line1: "", line2: "", city: "", region: "", country: "GH", postalCode: "" };

const DRAFT_KEY = "apt:customer:draft:new";

const ACCOUNT_TYPE_OPTIONS = [
  { value: "personal", label: "Individual" },
  { value: "business", label: "Business" },
];
const BUSINESS_TYPE_OPTIONS = [
  { value: "contractor", label: "Contractor" },
  { value: "engineer", label: "Engineer" },
  { value: "procurement", label: "Procurement" },
  { value: "reseller", label: "Reseller" },
  { value: "end-user", label: "End User" },
  { value: "other", label: "Other" },
];
const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "suspended", label: "Suspended" },
  { value: "pending", label: "Pending" },
];

function emptyForm(): CustomerFormData {
  return {
    name: "", email: "", phone: "", accountType: "personal", businessType: "",
    company: "", jobTitle: "", industry: "", website: "", taxNumber: "",
    status: "active", notes: "",
    billingAddress: { ...EMPTY_ADDRESS },
    shippingAddress: { ...EMPTY_ADDRESS },
  };
}

export default function CustomerForm({ customerId, initial }: Props) {
  const router = useRouter();
  const isEdit = Boolean(customerId);
  const [form, setForm] = useState<CustomerFormData>(() => {
    const base = { ...emptyForm(), ...initial };
    if (!isEdit && typeof window !== "undefined") {
      try {
        const draft = localStorage.getItem(DRAFT_KEY);
        if (draft) return { ...base, ...JSON.parse(draft) };
      } catch { /* ignore corrupt draft */ }
    }
    return base;
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Draft persistence — create mode only
  useEffect(() => {
    if (isEdit) return;
    localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
  }, [form, isEdit]);

  function set<K extends keyof CustomerFormData>(key: K, value: CustomerFormData[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  }

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = "Name is required";
    if (!form.email.trim()) next.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = "Enter a valid email";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  const saveNow = useCallback(async () => {
    if (!isEdit || !validate()) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/customers/${customerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) { setSaved(true); router.refresh(); }
      else { const j = await res.json(); setError(j.error ?? "Save failed"); }
    } finally {
      setSaving(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, customerId, form, router]);

  // Autosave — edit mode only, debounced on every change
  useEffect(() => {
    if (!isEdit) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(saveNow, 1500);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form]);

  async function submitCreate() {
    setError(null);
    if (!validate()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? "Failed to create customer"); return; }
      localStorage.removeItem(DRAFT_KEY);
      router.push(`/dashboard/customers/${json.id}`);
    } catch {
      setError("Failed to create customer");
    } finally {
      setSaving(false);
    }
  }

  function updateAddress(which: "billingAddress" | "shippingAddress", field: string, value: string) {
    set(which, { ...form[which], [field]: value });
  }

  return (
    <div className="p-4 sm:p-6 max-w-4xl space-y-5">
      <div className="card p-5 space-y-4">
        <h2 className="text-[14px] font-semibold" style={{ color: "var(--apt-text-primary)" }}>General</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <Input label="Full name" required value={form.name} onChange={(e) => set("name", e.target.value)} error={errors.name} />
          <Input label="Email" type="email" required value={form.email} onChange={(e) => set("email", e.target.value)} error={errors.email} disabled={isEdit} hint={isEdit ? "Email cannot be changed here" : undefined} />
          <Input label="Phone" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
          <Select label="Customer type" options={ACCOUNT_TYPE_OPTIONS} value={form.accountType} onChange={(e) => set("accountType", e.target.value)} />
          <Select label="Status" options={STATUS_OPTIONS} value={form.status} onChange={(e) => set("status", e.target.value)} />
          <Select label="Business type" placeholder="Not specified" options={BUSINESS_TYPE_OPTIONS} value={form.businessType} onChange={(e) => set("businessType", e.target.value)} />
        </div>
      </div>

      <div className="card p-5 space-y-4">
        <h2 className="text-[14px] font-semibold" style={{ color: "var(--apt-text-primary)" }}>Business Information</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <Input label="Company" value={form.company} onChange={(e) => set("company", e.target.value)} />
          <Input label="Job title" value={form.jobTitle} onChange={(e) => set("jobTitle", e.target.value)} />
          <Input label="Industry" value={form.industry} onChange={(e) => set("industry", e.target.value)} />
          <Input label="Website" value={form.website} onChange={(e) => set("website", e.target.value)} placeholder="https://" />
          <Input label="Tax / VAT number" value={form.taxNumber} onChange={(e) => set("taxNumber", e.target.value)} />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        <div className="card p-5 space-y-4">
          <h2 className="text-[14px] font-semibold" style={{ color: "var(--apt-text-primary)" }}>Billing Address</h2>
          <AddressFields value={form.billingAddress} onChange={(f, v) => updateAddress("billingAddress", f, v)} />
        </div>
        <div className="card p-5 space-y-4">
          <h2 className="text-[14px] font-semibold" style={{ color: "var(--apt-text-primary)" }}>Shipping Address</h2>
          <AddressFields value={form.shippingAddress} onChange={(f, v) => updateAddress("shippingAddress", f, v)} />
        </div>
      </div>

      <div className="card p-5 space-y-3">
        <h2 className="text-[14px] font-semibold" style={{ color: "var(--apt-text-primary)" }}>Notes</h2>
        <Textarea placeholder="Internal notes about this customer…" value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={3} />
      </div>

      {error && <p className="text-[12.5px] text-[#dc2626]">{error}</p>}

      <div className="flex items-center gap-3 sticky bottom-0 py-3" style={{ background: "var(--apt-bg)" }}>
        {isEdit ? (
          <>
            <Button variant="primary" size="sm" icon={saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />} onClick={saveNow} disabled={saving}>
              {saving ? "Saving…" : "Save now"}
            </Button>
            {saved && !saving && (
              <span className="flex items-center gap-1.5 text-[12px]" style={{ color: "#15803d" }}>
                <CheckCircle2 size={13} /> Autosaved
              </span>
            )}
          </>
        ) : (
          <Button variant="primary" size="sm" icon={saving ? <Loader2 size={13} className="animate-spin" /> : undefined} onClick={submitCreate} disabled={saving}>
            {saving ? "Creating…" : "Create customer"}
          </Button>
        )}
        <Button variant="ghost" size="sm" onClick={() => router.back()}>Cancel</Button>
      </div>
    </div>
  );
}

function AddressFields({ value, onChange }: { value: CustomerFormData["billingAddress"]; onChange(field: string, value: string): void }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <Input wrapperClass="col-span-2" label="Address line 1" value={value.line1} onChange={(e) => onChange("line1", e.target.value)} />
      <Input wrapperClass="col-span-2" label="Address line 2" value={value.line2} onChange={(e) => onChange("line2", e.target.value)} />
      <Input label="City" value={value.city} onChange={(e) => onChange("city", e.target.value)} />
      <Input label="Region" value={value.region} onChange={(e) => onChange("region", e.target.value)} />
      <Input label="Postal code" value={value.postalCode} onChange={(e) => onChange("postalCode", e.target.value)} />
      <Input label="Country" value={value.country} onChange={(e) => onChange("country", e.target.value)} />
    </div>
  );
}
