"use client";

import { useState } from "react";
import { X } from "lucide-react";

interface Props {
  label?: string;
  hint?: string;
  values: string[];
  onChange(values: string[]): void;
  placeholder?: string;
}

export default function TagInput({ label, hint, values, onChange, placeholder }: Props) {
  const [draft, setDraft] = useState("");

  function commit() {
    const v = draft.trim();
    if (v && !values.includes(v)) onChange([...values, v]);
    setDraft("");
  }

  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-[12px] font-medium" style={{ color: "var(--apt-text-primary)" }}>{label}</label>}
      <div
        className="flex flex-wrap gap-1.5 p-2 rounded-md border min-h-9"
        style={{ background: "var(--apt-bg)", border: "1px solid var(--apt-border)" }}
      >
        {values.map((v) => (
          <span key={v} className="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-full text-[12px]" style={{ background: "var(--apt-bg-raised)", color: "var(--apt-text-secondary)" }}>
            {v}
            <button onClick={() => onChange(values.filter((x) => x !== v))} className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-[var(--apt-border)]"><X size={10} /></button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); commit(); } }}
          onBlur={commit}
          placeholder={values.length === 0 ? placeholder : ""}
          className="flex-1 min-w-[100px] bg-transparent text-[13px] outline-none"
          style={{ color: "var(--apt-text-primary)" }}
        />
      </div>
      {hint && <p className="text-[11px]" style={{ color: "var(--apt-text-muted)" }}>{hint}</p>}
    </div>
  );
}
