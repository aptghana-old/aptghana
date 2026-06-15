"use client";

import { useState, useRef, KeyboardEvent } from "react";
import { GripVertical, Plus, Trash2, Lock, Info } from "lucide-react";

// The native Meilisearch rules that must follow the custom ones
const NATIVE_RULES = ["words", "typo", "proximity", "attribute", "sort", "exactness"];

const NATIVE_DESCRIPTIONS: Record<string, string> = {
  words:     "More query words matched = higher rank",
  typo:      "Fewer typos = higher rank",
  proximity: "Query words closer together = higher rank",
  attribute: "Matches in earlier searchable attributes rank higher",
  sort:      "Applies user-requested sort order",
  exactness: "Exact match preferred over partial match",
};

interface RankingEditorProps {
  rules: string[];
  onChange: (rules: string[]) => void;
}

export function RankingEditor({ rules, onChange }: RankingEditorProps) {
  const [input, setInput] = useState("");
  const [dragging, setDragging] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Separate custom rules (non-native) from the tail of native rules
  const customRules = rules.filter((r) => !NATIVE_RULES.includes(r));

  const addCustom = () => {
    const trimmed = input.trim();
    if (!trimmed || rules.includes(trimmed)) return;
    // Custom rules go before native rules
    onChange([...customRules, trimmed, ...NATIVE_RULES]);
    setInput("");
    inputRef.current?.focus();
  };

  const removeCustom = (rule: string) => {
    onChange([...customRules.filter((r) => r !== rule), ...NATIVE_RULES]);
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") { e.preventDefault(); addCustom(); }
  };

  const onDragStart = (i: number) => setDragging(i);
  const onDragEnter = (i: number) => setDragOver(i);
  const onDragEnd   = () => {
    if (dragging !== null && dragOver !== null && dragging !== dragOver) {
      const next = [...customRules];
      const [item] = next.splice(dragging, 1);
      next.splice(dragOver, 0, item);
      onChange([...next, ...NATIVE_RULES]);
    }
    setDragging(null);
    setDragOver(null);
  };

  const allRules = [...customRules, ...NATIVE_RULES];

  return (
    <div className="flex flex-col gap-3">
      <div
        className="flex items-start gap-3 p-3 rounded-lg"
        style={{ background: "#eff6ff", border: "1px solid #bfdbfe" }}
      >
        <Info size={13} className="shrink-0 mt-0.5" style={{ color: "#3b82f6" }} />
        <p className="text-[12px]" style={{ color: "#1d4ed8" }}>
          Rules apply in order — the first rule has highest priority. Custom rules (your tuning) always
          rank above the native Meilisearch rules. You can reorder custom rules by dragging.
          Use the format <code className="font-mono bg-blue-100 px-1 rounded">field:asc</code> or{" "}
          <code className="font-mono bg-blue-100 px-1 rounded">field:desc</code> for attribute-based sorting rules.
        </p>
      </div>

      <div className="card overflow-hidden" onDragOver={(e) => e.preventDefault()}>
        <div className="divide-y" style={{ borderColor: "var(--apt-border)" }}>
          {allRules.map((rule, i) => {
            const isNative = NATIVE_RULES.includes(rule);
            const customIdx = customRules.indexOf(rule);
            return (
              <div
                key={rule}
                draggable={!isNative}
                onDragStart={!isNative ? () => onDragStart(customIdx) : undefined}
                onDragEnter={!isNative ? () => onDragEnter(customIdx) : undefined}
                onDragEnd={!isNative ? onDragEnd : undefined}
                className="flex items-center gap-3 px-4 py-3"
                style={{
                  background: dragOver === customIdx && dragging !== customIdx && !isNative
                    ? "var(--apt-bg-raised)"
                    : undefined,
                  opacity: dragging === customIdx ? 0.4 : isNative ? 0.7 : 1,
                }}
              >
                <span
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
                  style={{ background: "var(--apt-bg-raised)", color: "var(--apt-text-muted)" }}
                >
                  {i + 1}
                </span>

                {!isNative ? (
                  <GripVertical size={13} style={{ color: "var(--apt-text-muted)", cursor: "grab", flexShrink: 0 }} />
                ) : (
                  <Lock size={11} style={{ color: "var(--apt-text-muted)", flexShrink: 0 }} />
                )}

                <div className="flex-1 min-w-0">
                  <code className="text-[13px] font-mono font-semibold" style={{ color: "#0057b8" }}>
                    {rule}
                  </code>
                  {isNative && (
                    <p className="text-[11px] mt-0.5" style={{ color: "var(--apt-text-muted)" }}>
                      {NATIVE_DESCRIPTIONS[rule]}
                    </p>
                  )}
                </div>

                {isNative ? (
                  <span
                    className="text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0"
                    style={{ background: "var(--apt-bg-raised)", color: "var(--apt-text-muted)" }}
                  >
                    Meilisearch default
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => removeCustom(rule)}
                    className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-[#fef2f2] transition-colors shrink-0"
                    style={{ color: "var(--apt-text-muted)" }}
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Add custom rule */}
        <div
          className="flex items-center gap-2 px-4 py-3"
          style={{ borderTop: "1px solid var(--apt-border)" }}
        >
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKey}
            placeholder="e.g. relevanceScore:desc"
            className="flex-1 h-8 px-3 rounded-md text-[12px] font-mono border focus:outline-none focus:ring-2 focus:ring-[var(--apt-border-focus)]"
            style={{ background: "var(--apt-bg)", borderColor: "var(--apt-border)", color: "var(--apt-text-primary)" }}
          />
          <button
            type="button"
            onClick={addCustom}
            disabled={!input.trim() || allRules.includes(input.trim())}
            className="flex items-center gap-1.5 h-8 px-3 rounded-md text-[12px] font-medium transition-colors disabled:opacity-40"
            style={{ background: "#0057b8", color: "#fff" }}
          >
            <Plus size={12} /> Add Rule
          </button>
        </div>
      </div>
    </div>
  );
}
