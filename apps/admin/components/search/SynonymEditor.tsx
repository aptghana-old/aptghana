"use client";

import { useState } from "react";
import { Plus, Trash2, ArrowLeftRight, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface SynonymRow {
  term: string;
  matches: string;
}

interface SynonymEditorProps {
  synonyms: Record<string, string[]>;
  onChange: (synonyms: Record<string, string[]>) => void;
}

function rowsFromRecord(rec: Record<string, string[]>): SynonymRow[] {
  return Object.entries(rec).map(([term, matches]) => ({
    term,
    matches: matches.join(", "),
  }));
}

function recordFromRows(rows: SynonymRow[]): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const row of rows) {
    const term = row.term.trim().toLowerCase();
    if (!term) continue;
    const matches = row.matches
      .split(",")
      .map((m) => m.trim().toLowerCase())
      .filter(Boolean);
    if (matches.length) out[term] = matches;
  }
  return out;
}

export function SynonymEditor({ synonyms, onChange }: SynonymEditorProps) {
  const [rows, setRows] = useState<SynonymRow[]>(() => rowsFromRecord(synonyms));
  const [filter, setFilter] = useState("");

  const commit = (next: SynonymRow[]) => {
    setRows(next);
    onChange(recordFromRows(next));
  };

  const update = (i: number, field: keyof SynonymRow, val: string) => {
    const next = rows.map((r, j) => (j === i ? { ...r, [field]: val } : r));
    commit(next);
  };

  const remove = (i: number) => commit(rows.filter((_, j) => j !== i));

  const add = () =>
    commit([...rows, { term: "", matches: "" }]);

  // Duplicate-term detection
  const termCounts = rows.reduce<Record<string, number>>((acc, r) => {
    const t = r.term.trim().toLowerCase();
    if (t) acc[t] = (acc[t] ?? 0) + 1;
    return acc;
  }, {});
  const duplicates = new Set(Object.entries(termCounts).filter(([, c]) => c > 1).map(([t]) => t));

  const visible = filter
    ? rows.filter(
        (r, i) =>
          r.term.toLowerCase().includes(filter.toLowerCase()) ||
          r.matches.toLowerCase().includes(filter.toLowerCase()) ||
          i === rows.length - 1, // always show the newest row for UX
      )
    : rows;

  return (
    <div className="flex flex-col gap-3">
      {/* Toolbar */}
      <div className="flex items-center gap-2">
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter synonyms…"
          className="h-8 px-3 rounded-md text-[12px] border flex-1 focus:outline-none focus:ring-2 focus:ring-[var(--apt-border-focus)]"
          style={{ background: "var(--apt-bg)", borderColor: "var(--apt-border)", color: "var(--apt-text-primary)" }}
        />
        <Button variant="secondary" size="sm" icon={<Plus size={12} />} onClick={add}>
          Add Synonym
        </Button>
      </div>

      {duplicates.size > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-[12px]" style={{ background: "#fffbeb", color: "#92400e", border: "1px solid #fde68a" }}>
          <AlertCircle size={13} className="shrink-0" />
          Duplicate terms detected: {Array.from(duplicates).join(", ")}. Only the first occurrence will be applied.
        </div>
      )}

      <div className="card overflow-hidden">
        {/* Header */}
        <div
          className="grid gap-3 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider"
          style={{ borderBottom: "1px solid var(--apt-border)", color: "var(--apt-text-muted)", gridTemplateColumns: "1fr 14px 1fr 28px" }}
        >
          <span>Search Term</span>
          <span />
          <span>Also Matches (comma-separated)</span>
          <span />
        </div>

        {visible.length === 0 && (
          <div className="py-10 text-center text-[13px]" style={{ color: "var(--apt-text-muted)" }}>
            {filter ? "No synonyms match your filter." : "No synonyms yet. Click «Add Synonym» to create the first one."}
          </div>
        )}

        <div className="divide-y" style={{ borderColor: "var(--apt-border)" }}>
          {visible.map((row, visIdx) => {
            // Map back to real index
            const realIdx = rows.indexOf(row);
            const isDup = duplicates.has(row.term.trim().toLowerCase());
            return (
              <div
                key={realIdx}
                className="grid items-center gap-3 px-4 py-2.5"
                style={{ gridTemplateColumns: "1fr 14px 1fr 28px" }}
              >
                <input
                  value={row.term}
                  onChange={(e) => update(realIdx, "term", e.target.value)}
                  placeholder="vfd"
                  className={`h-8 px-3 rounded-md text-[12px] font-mono border focus:outline-none focus:ring-2 focus:ring-[var(--apt-border-focus)] ${isDup ? "border-[#f59e0b]" : ""}`}
                  style={{ background: "#eff6ff", borderColor: isDup ? "#f59e0b" : "#bfdbfe", color: "#1d4ed8" }}
                />
                <ArrowLeftRight size={12} style={{ color: "var(--apt-text-muted)" }} />
                <input
                  value={row.matches}
                  onChange={(e) => update(realIdx, "matches", e.target.value)}
                  placeholder="synonym1, synonym2, synonym3"
                  className="h-8 px-3 rounded-md text-[12px] font-mono border focus:outline-none focus:ring-2 focus:ring-[var(--apt-border-focus)]"
                  style={{ background: "var(--apt-bg-subtle)", borderColor: "var(--apt-border)", color: "var(--apt-text-secondary)" }}
                />
                <button
                  type="button"
                  onClick={() => remove(realIdx)}
                  className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-[#fef2f2] transition-colors"
                  style={{ color: "var(--apt-text-muted)" }}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            );
          })}
        </div>

        <div className="px-4 py-2.5 flex items-center justify-between" style={{ borderTop: "1px solid var(--apt-border)" }}>
          <span className="text-[11px]" style={{ color: "var(--apt-text-muted)" }}>
            {rows.length} synonym group{rows.length !== 1 ? "s" : ""}
          </span>
          <Button variant="ghost" size="xs" icon={<Plus size={11} />} onClick={add}>Add row</Button>
        </div>
      </div>
    </div>
  );
}
