"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { X, Filter as FilterIcon, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import CategoryPicker from "@/components/products/CategoryPicker";
import type { DealFilterOptions, DealKind } from "@/lib/dealFilters";
import { DATE_PRESETS, emptyFormState, formStateToParams, type DealFilterFormState } from "./types";

interface Props {
  kind: DealKind;
  options: DealFilterOptions;
  current: Record<string, string | undefined>;
  open: boolean;
  onClose(): void;
}

export default function FilterDrawer({ kind, options, current, open, onClose }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [form, setForm] = useState<DealFilterFormState>(() => emptyFormState(current));

  const set = <K extends keyof DealFilterFormState>(k: K, v: DealFilterFormState[K]) => setForm((f) => ({ ...f, [k]: v }));

  function apply() {
    const qs = formStateToParams(form);
    router.push(`${pathname}?${qs.toString()}`);
    onClose();
  }

  function reset() {
    setForm(emptyFormState({}));
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" style={{ background: "var(--apt-bg-overlay)" }} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-md h-full overflow-y-auto" style={{ background: "var(--apt-bg)", borderLeft: "1px solid var(--apt-border-strong)" }}>
        <div className="flex items-center justify-between px-5 py-4 sticky top-0 z-10" style={{ borderBottom: "1px solid var(--apt-border)", background: "var(--apt-bg)" }}>
          <div className="flex items-center gap-2.5">
            <FilterIcon size={15} style={{ color: "var(--apt-text-brand)" }} />
            <h2 className="text-[15px] font-semibold" style={{ color: "var(--apt-text-primary)" }}>Filters</h2>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded flex items-center justify-center hover:bg-[var(--apt-bg-raised)]" style={{ color: "var(--apt-text-muted)" }}><X size={14} /></button>
        </div>

        <div className="p-5 space-y-5">
          <div>
            <label className="text-[12px] font-medium block mb-1.5" style={{ color: "var(--apt-text-primary)" }}>Date Range</label>
            <Select options={DATE_PRESETS} value={form.preset} onChange={(e) => set("preset", e.target.value)} />
            {form.preset === "custom" && (
              <div className="grid grid-cols-2 gap-2 mt-2">
                <Input type="date" label="From" value={form.from} onChange={(e) => set("from", e.target.value)} />
                <Input type="date" label="To" value={form.to} onChange={(e) => set("to", e.target.value)} />
              </div>
            )}
          </div>

          <Select label="Status" placeholder="Any status" options={options.statuses.map((s) => ({ value: s, label: s.replace(/_/g, " ") }))} value={form.status} onChange={(e) => set("status", e.target.value)} />

          <Input label="Customer" placeholder="Name or email" value={form.customer} onChange={(e) => set("customer", e.target.value)} />
          <Input label="Company" placeholder="Company name" value={form.company} onChange={(e) => set("company", e.target.value)} />

          <Select label="Sales Representative" placeholder="Any rep" options={options.salesReps} value={form.salesRep} onChange={(e) => set("salesRep", e.target.value)} />
          <Select label="Assigned User" placeholder="Any user" options={options.salesReps} value={form.assignedUser} onChange={(e) => set("assignedUser", e.target.value)} />

          <Select label="Brand" placeholder="Any brand" options={options.brands} value={form.brand} onChange={(e) => set("brand", e.target.value)} />

          <div>
            <label className="text-[12px] font-medium block mb-1.5" style={{ color: "var(--apt-text-primary)" }}>Category Path</label>
            <CategoryPicker
              value={form.categoryId || null}
              onChange={(id, chain) => { set("categoryId", id ?? ""); set("categoryLabel", chain.map((c) => c.name).join(" → ")); }}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Input label="Min Value" type="number" value={form.minValue} onChange={(e) => set("minValue", e.target.value)} />
            <Input label="Max Value" type="number" value={form.maxValue} onChange={(e) => set("maxValue", e.target.value)} />
          </div>

          <Select label="Currency" placeholder="Any currency" options={options.currencies.map((c) => ({ value: c, label: c }))} value={form.currency} onChange={(e) => set("currency", e.target.value)} />
          <Select label="Country / Region" placeholder="Any country" options={options.countries.map((c) => ({ value: c, label: c }))} value={form.country} onChange={(e) => set("country", e.target.value)} />
          <Select label="Source Channel" placeholder="Any channel" options={options.channels} value={form.channel} onChange={(e) => set("channel", e.target.value)} />

          {kind === "order" && (
            <Select label="Payment Status" placeholder="Any" options={[{ value: "unpaid", label: "Unpaid" }, { value: "paid", label: "Paid" }, { value: "refunded", label: "Refunded" }, { value: "failed", label: "Failed" }]} value={form.paymentStatus} onChange={(e) => set("paymentStatus", e.target.value)} />
          )}
          {kind === "quote" && (
            <Select label="Expiry" placeholder="Any" options={[{ value: "expired", label: "Expired" }, { value: "soon", label: "Expiring within 7 days" }]} value={form.expiring} onChange={(e) => set("expiring", e.target.value)} />
          )}
        </div>

        <div className="flex items-center gap-2 px-5 py-4 sticky bottom-0" style={{ borderTop: "1px solid var(--apt-border)", background: "var(--apt-bg)" }}>
          <Button variant="primary" size="md" onClick={apply} className="flex-1">Apply Filters</Button>
          <Button variant="secondary" size="md" icon={<RotateCcw size={13} />} onClick={reset}>Reset</Button>
        </div>
      </div>
    </div>
  );
}
