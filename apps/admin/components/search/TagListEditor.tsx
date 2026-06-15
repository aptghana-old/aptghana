"use client";

import { useState, useRef, KeyboardEvent } from "react";
import { X, Plus } from "lucide-react";

interface TagListEditorProps {
  label: string;
  hint?: string;
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  mono?: boolean;
}

export function TagListEditor({
  label,
  hint,
  values,
  onChange,
  placeholder = "Add entry…",
  mono = false,
}: TagListEditorProps) {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const add = () => {
    const trimmed = input.trim();
    if (!trimmed || values.includes(trimmed)) return;
    onChange([...values, trimmed]);
    setInput("");
  };

  const remove = (val: string) => onChange(values.filter((v) => v !== val));

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(); }
    if (e.key === "Backspace" && !input && values.length) {
      remove(values[values.length - 1]);
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[12px] font-medium" style={{ color: "var(--apt-text-primary)" }}>
        {label}
      </label>

      {/* Tag container — click anywhere to focus input */}
      <div
        className="min-h-[80px] rounded-md border p-2 flex flex-wrap gap-1.5 cursor-text"
        style={{
          background:   "var(--apt-bg)",
          borderColor:  "var(--apt-border)",
          color:        "var(--apt-text-primary)",
        }}
        onClick={() => inputRef.current?.focus()}
      >
        {values.map((val) => (
          <span
            key={val}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] ${mono ? "font-mono" : ""}`}
            style={{ background: "var(--apt-bg-raised)", color: "var(--apt-text-secondary)", border: "1px solid var(--apt-border)" }}
          >
            {val}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); remove(val); }}
              className="rounded hover:text-[#dc2626] transition-colors"
              style={{ color: "var(--apt-text-muted)" }}
            >
              <X size={9} />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKey}
          onBlur={add}
          placeholder={values.length ? "" : placeholder}
          className={`flex-1 min-w-[120px] bg-transparent outline-none text-[12px] ${mono ? "font-mono" : ""}`}
          style={{ color: "var(--apt-text-primary)" }}
        />
      </div>

      <div className="flex items-center justify-between">
        {hint && <p className="text-[11px]" style={{ color: "var(--apt-text-muted)" }}>{hint}</p>}
        <button
          type="button"
          onClick={add}
          disabled={!input.trim()}
          className="ml-auto flex items-center gap-1 text-[11px] px-2 py-0.5 rounded transition-colors disabled:opacity-40"
          style={{ color: "#0057b8" }}
        >
          <Plus size={10} /> Add
        </button>
      </div>
    </div>
  );
}
