"use client";

import { useState } from "react";
import { FormField, Icon, inputBase } from "@/components/account/ui";
import type { DraftItemInput } from "@/lib/store/request-draft";
import { D } from "./icons";

interface CustomItemFormProps {
  onAdd: (item: DraftItemInput) => void;
  onClose: () => void;
}

/** Manual entry for products not listed on the website. */
export default function CustomItemForm({ onAdd, onClose }: CustomItemFormProps) {
  const [name, setName] = useState("");
  const [partNo, setPartNo] = useState("");
  const [brand, setBrand] = useState("");
  const [qty, setQty] = useState(1);
  const [notes, setNotes] = useState("");

  function handleAdd() {
    const trimmed = name.trim();
    if (!trimmed) return;
    onAdd({
      productId: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name:      trimmed.slice(0, 300),
      sku:       partNo.trim().slice(0, 100) || undefined,
      brandName: brand.trim().slice(0, 100) || undefined,
      qty:       Math.max(1, qty),
      notes:     notes.trim().slice(0, 1000),
      custom:    true,
    });
    onClose();
  }

  return (
    <div className="px-5 sm:px-6 py-5 border-t" style={{ borderColor: "var(--border)", background: "var(--bg-raised)" }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-[14px] font-bold text-(--text-1)">Add a product not listed on the website</h3>
          <p className="text-xs text-(--text-3) mt-0.5">
            Describe the product — part numbers and datasheets help us quote faster.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close custom product form"
          className="w-8 h-8 rounded-lg flex items-center justify-center text-(--text-4) hover:text-(--text-1) hover:bg-(--bg-surface) transition-colors"
        >
          <Icon d={D.close} size={14} strokeWidth={2.5} />
        </button>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <FormField label="Product name / description *">
            <input value={name} onChange={(e) => setName(e.target.value)} maxLength={300}
              placeholder="e.g. Soft starter for 75kW pump motor, 400V" className={inputBase} />
          </FormField>
        </div>
        <FormField label="Part number / MPN">
          <input value={partNo} onChange={(e) => setPartNo(e.target.value)} maxLength={100}
            placeholder="e.g. ATS480D75Y" className={inputBase} />
        </FormField>
        <FormField label="Brand / Manufacturer">
          <input value={brand} onChange={(e) => setBrand(e.target.value)} maxLength={100}
            placeholder="e.g. Schneider Electric" className={inputBase} />
        </FormField>
        <FormField label="Quantity">
          <input type="number" min={1} value={qty}
            onChange={(e) => setQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
            className={inputBase} />
        </FormField>
        <FormField label="Specifications / requirements">
          <input value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={1000}
            placeholder="Voltage, certifications, equivalents accepted…" className={inputBase} />
        </FormField>
      </div>

      <button
        type="button"
        onClick={handleAdd}
        disabled={!name.trim()}
        className="mt-4 inline-flex items-center gap-2 h-10 px-5 rounded-xl text-sm font-bold text-white bg-navy-500 hover:bg-navy-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <Icon d={D.plus} size={14} strokeWidth={2.5} />
        Add to request
      </button>
    </div>
  );
}
