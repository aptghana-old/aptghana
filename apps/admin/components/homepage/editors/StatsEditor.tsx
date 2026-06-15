"use client";

import { useState } from "react";
import type { HpSection, StatsConfig, StatItem } from "@apt/db";
import { Input, Textarea } from "@/components/ui/Input";

interface Props { section: HpSection; onChange: (s: HpSection) => void }

function uid() { return `stat-${Date.now()}`; }

export default function StatsEditor({ section, onChange }: Props) {
  const cfg = section.config as unknown as StatsConfig;
  const [fnInput, setFnInput] = useState("");

  function setCfg(patch: Partial<StatsConfig>) {
    onChange({ ...section, config: { ...cfg, ...patch } });
  }
  function updStat(id: string, patch: Partial<StatItem>) {
    setCfg({ items: cfg.items.map((s) => s.id === id ? { ...s, ...patch } : s) });
  }
  function addStat() {
    setCfg({ items: [...cfg.items, { id: uid(), value: "", label: "", desc: "" }] });
  }
  function removeStat(id: string) {
    setCfg({ items: cfg.items.filter((s) => s.id !== id) });
  }
  function addFootnote() {
    if (!fnInput.trim()) return;
    setCfg({ footnotes: [...cfg.footnotes, fnInput.trim()] });
    setFnInput("");
  }
  function removeFootnote(i: number) {
    setCfg({ footnotes: cfg.footnotes.filter((_, idx) => idx !== i) });
  }

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-[13px] font-semibold" style={{ color: "var(--apt-text-primary)" }}>Stat items</h3>
          <button onClick={addStat} className="text-[12px] font-medium px-3 py-1.5 rounded-md" style={{ background: "var(--apt-bg-raised)", color: "var(--apt-text-brand)" }}>+ Add stat</button>
        </div>
        <div className="space-y-3">
          {cfg.items.map((stat) => (
            <div key={stat.id} className="rounded-lg border p-3" style={{ borderColor: "var(--apt-border)", background: "var(--apt-bg)" }}>
              <div className="grid grid-cols-3 gap-2">
                <Input label="Value" value={stat.value} onChange={(e) => updStat(stat.id, { value: e.target.value })} placeholder="25+" />
                <Input label="Label" value={stat.label} onChange={(e) => updStat(stat.id, { label: e.target.value })} wrapperClass="col-span-2" placeholder="Years in Operation" />
                <Input label="Description" value={stat.desc} onChange={(e) => updStat(stat.id, { desc: e.target.value })} wrapperClass="col-span-2" placeholder="Serving West Africa since 1999" />
                <div className="flex items-end justify-end">
                  <button onClick={() => removeStat(stat.id)} className="h-9 px-3 rounded-md text-[12px] font-medium text-red-400 hover:text-red-600" style={{ background: "var(--apt-bg-raised)" }}>Remove</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-[13px] font-semibold mb-2" style={{ color: "var(--apt-text-primary)" }}>Footnotes / trust badges</h3>
        <div className="space-y-1.5 mb-2">
          {cfg.footnotes.map((fn, i) => (
            <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-md border" style={{ borderColor: "var(--apt-border)", background: "var(--apt-bg)" }}>
              <span className="flex-1 text-[13px]" style={{ color: "var(--apt-text-primary)" }}>{fn}</span>
              <button onClick={() => removeFootnote(i)} className="text-red-400 hover:text-red-600 text-[12px]">Remove</button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <Input value={fnInput} onChange={(e) => setFnInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addFootnote()} placeholder="e.g. ISO 9001 Certified" wrapperClass="flex-1" />
          <button onClick={addFootnote} className="px-3 py-1 rounded-md text-[12px] font-medium shrink-0" style={{ background: "var(--apt-bg-raised)", color: "var(--apt-text-brand)" }}>Add</button>
        </div>
      </div>
    </div>
  );
}
