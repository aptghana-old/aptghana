"use client";

import { useState, useRef, KeyboardEvent } from "react";
import {
  GripVertical,
  X,
  Plus,
  ChevronUp,
  ChevronDown,
  Info,
} from "lucide-react";

interface AttributeListProps {
  label: string;
  hint?: string;
  values: string[];
  onChange: (values: string[]) => void;
  /** Attributes locked at the top that cannot be removed (e.g. Meilisearch defaults) */
  locked?: string[];
}

export function AttributeList({
  label,
  hint,
  values,
  onChange,
  locked = [],
}: AttributeListProps) {
  const [input, setInput] = useState("");
  const [dragging, setDragging] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const add = () => {
    const trimmed = input.trim();
    if (!trimmed || values.includes(trimmed)) return;
    onChange([...values, trimmed]);
    setInput("");
    inputRef.current?.focus();
  };

  const remove = (idx: number) => onChange(values.filter((_, i) => i !== idx));

  const moveUp = (idx: number) => {
    if (idx === 0) return;
    const next = [...values];
    [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
    onChange(next);
  };

  const moveDown = (idx: number) => {
    if (idx === values.length - 1) return;
    const next = [...values];
    [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
    onChange(next);
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") { e.preventDefault(); add(); }
  };

  // Drag-and-drop handlers
  const onDragStart = (i: number) => setDragging(i);
  const onDragEnter = (i: number) => setDragOver(i);
  const onDragEnd   = () => {
    if (dragging !== null && dragOver !== null && dragging !== dragOver) {
      const next = [...values];
      const [item] = next.splice(dragging, 1);
      next.splice(dragOver, 0, item);
      onChange(next);
    }
    setDragging(null);
    setDragOver(null);
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="text-[12px] font-medium" style={{ color: "var(--apt-text-primary)" }}>
        {label}
      </label>
      {hint && (
        <div className="flex items-start gap-1.5">
          <Info size={11} className="mt-0.5 shrink-0" style={{ color: "var(--apt-text-muted)" }} />
          <p className="text-[11px]" style={{ color: "var(--apt-text-muted)" }}>{hint}</p>
        </div>
      )}

      {/* Ordered list */}
      <div
        className="card overflow-hidden"
        onDragOver={(e) => e.preventDefault()}
      >
        {locked.length > 0 && (
          <div className="divide-y" style={{ borderColor: "var(--apt-border)", opacity: 0.6 }}>
            {locked.map((attr) => (
              <div
                key={attr}
                className="flex items-center gap-2 px-3 py-2"
              >
                <div className="w-5 h-5 shrink-0" />
                <span
                  className="flex-1 text-[12px] font-mono px-2 py-0.5 rounded"
                  style={{ background: "var(--apt-bg-raised)", color: "var(--apt-text-muted)" }}
                >
                  {attr}
                </span>
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ background: "var(--apt-bg-raised)", color: "var(--apt-text-muted)" }}>
                  locked
                </span>
              </div>
            ))}
          </div>
        )}

        {values.length === 0 && !locked.length && (
          <div className="py-6 text-center text-[12px]" style={{ color: "var(--apt-text-muted)" }}>
            No attributes. Add one below.
          </div>
        )}

        <div className="divide-y" style={{ borderColor: "var(--apt-border)" }}>
          {values.map((attr, i) => (
            <div
              key={attr}
              draggable
              onDragStart={() => onDragStart(i)}
              onDragEnter={() => onDragEnter(i)}
              onDragEnd={onDragEnd}
              className="flex items-center gap-2 px-3 py-2 transition-colors"
              style={{
                background: dragOver === i && dragging !== i ? "var(--apt-bg-raised)" : undefined,
                opacity:    dragging === i ? 0.4 : 1,
              }}
            >
              {/* Order badge */}
              <span
                className="w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center shrink-0"
                style={{ background: "var(--apt-bg-raised)", color: "var(--apt-text-muted)" }}
              >
                {i + 1 + locked.length}
              </span>

              <GripVertical
                size={13}
                style={{ color: "var(--apt-text-muted)", cursor: "grab", flexShrink: 0 }}
              />

              <code
                className="flex-1 text-[12px] font-mono px-2 py-0.5 rounded"
                style={{ background: "#eff6ff", color: "#1d4ed8" }}
              >
                {attr}
              </code>

              {/* Up / Down nudge */}
              <div className="flex flex-col gap-0.5 shrink-0">
                <button
                  type="button"
                  onClick={() => moveUp(i)}
                  disabled={i === 0}
                  className="w-4 h-4 flex items-center justify-center rounded hover:bg-[var(--apt-bg-raised)] disabled:opacity-30 transition-colors"
                >
                  <ChevronUp size={10} style={{ color: "var(--apt-text-muted)" }} />
                </button>
                <button
                  type="button"
                  onClick={() => moveDown(i)}
                  disabled={i === values.length - 1}
                  className="w-4 h-4 flex items-center justify-center rounded hover:bg-[var(--apt-bg-raised)] disabled:opacity-30 transition-colors"
                >
                  <ChevronDown size={10} style={{ color: "var(--apt-text-muted)" }} />
                </button>
              </div>

              <button
                type="button"
                onClick={() => remove(i)}
                className="w-6 h-6 flex items-center justify-center rounded hover:bg-[#fef2f2] transition-colors shrink-0"
                style={{ color: "var(--apt-text-muted)" }}
              >
                <X size={11} />
              </button>
            </div>
          ))}
        </div>

        {/* Add row */}
        <div
          className="flex items-center gap-2 px-3 py-2.5"
          style={{ borderTop: "1px solid var(--apt-border)" }}
        >
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKey}
            placeholder="attributeName or nested.path"
            className="flex-1 h-7 px-2 rounded text-[12px] font-mono border focus:outline-none focus:ring-2 focus:ring-[var(--apt-border-focus)]"
            style={{
              background:  "var(--apt-bg)",
              borderColor: "var(--apt-border)",
              color:       "var(--apt-text-primary)",
            }}
          />
          <button
            type="button"
            onClick={add}
            disabled={!input.trim() || values.includes(input.trim())}
            className="flex items-center gap-1 text-[11px] px-2 py-1 rounded transition-colors disabled:opacity-40"
            style={{ color: "#0057b8" }}
          >
            <Plus size={11} /> Add
          </button>
        </div>
      </div>
    </div>
  );
}
