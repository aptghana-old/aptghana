"use client";

import { useState } from "react";
import type { HpSection, WhyChooseConfig, WhyChooseItem } from "@apt/db";
import { Input, Textarea } from "@/components/ui/Input";

interface Props { section: HpSection; onChange: (s: HpSection) => void }

function uid() { return `why-${Date.now()}`; }

export default function WhyChooseEditor({ section, onChange }: Props) {
  const cfg = section.config as unknown as WhyChooseConfig;
  const [active, setActive] = useState<string | null>(null);

  function setCfg(patch: Partial<WhyChooseConfig>) {
    onChange({ ...section, config: { ...cfg, ...patch } });
  }
  function updItem(id: string, patch: Partial<WhyChooseItem>) {
    setCfg({ items: cfg.items.map((i) => i.id === id ? { ...i, ...patch } : i) });
  }
  function addItem() {
    const id = uid();
    const item: WhyChooseItem = { id, title: "", desc: "", accent: "#0057b8", iconPath: "" };
    setCfg({ items: [...cfg.items, item] });
    setActive(id);
  }
  function removeItem(id: string) {
    setCfg({ items: cfg.items.filter((i) => i.id !== id) });
    if (active === id) setActive(null);
  }
  function moveItem(id: string, dir: -1 | 1) {
    const arr = [...cfg.items];
    const idx = arr.findIndex((i) => i.id === id);
    const nxt = idx + dir;
    if (nxt < 0 || nxt >= arr.length) return;
    [arr[idx], arr[nxt]] = [arr[nxt], arr[idx]];
    setCfg({ items: arr });
  }

  const activeItem = active ? cfg.items.find((i) => i.id === active) : null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        <Input label="Section title" value={cfg.title} onChange={(e) => setCfg({ title: e.target.value })} />
        <Textarea label="Subtitle" value={cfg.subtitle} onChange={(e) => setCfg({ subtitle: e.target.value })} className="text-[13px]" rows={2} />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-[13px] font-semibold" style={{ color: "var(--apt-text-primary)" }}>Items ({cfg.items.length})</h3>
          <button onClick={addItem} className="text-[12px] font-medium px-3 py-1.5 rounded-md" style={{ background: "var(--apt-bg-raised)", color: "var(--apt-text-brand)" }}>+ Add item</button>
        </div>

        <div className="space-y-1.5">
          {cfg.items.map((item, i) => (
            <div key={item.id} className="rounded-lg border" style={{ borderColor: active === item.id ? "var(--apt-border-focus)" : "var(--apt-border)", background: "var(--apt-bg)" }}>
              <div className="flex items-center gap-2 px-3 py-2.5 cursor-pointer" onClick={() => setActive(active === item.id ? null : item.id)}>
                <span className="w-3 h-3 rounded-full shrink-0" style={{ background: item.accent }} />
                <span className="flex-1 text-[13px] truncate" style={{ color: "var(--apt-text-primary)" }}>{item.title || "Untitled"}</span>
                <div className="flex items-center gap-0.5 shrink-0">
                  <button onClick={(e) => { e.stopPropagation(); moveItem(item.id, -1); }} disabled={i === 0} className="w-6 h-6 rounded disabled:opacity-30 text-[12px]" style={{ color: "var(--apt-text-muted)" }}>↑</button>
                  <button onClick={(e) => { e.stopPropagation(); moveItem(item.id, 1); }} disabled={i === cfg.items.length - 1} className="w-6 h-6 rounded disabled:opacity-30 text-[12px]" style={{ color: "var(--apt-text-muted)" }}>↓</button>
                  <button onClick={(e) => { e.stopPropagation(); removeItem(item.id); }} className="w-6 h-6 rounded text-red-400 hover:text-red-600">×</button>
                </div>
              </div>

              {active === item.id && activeItem && (
                <div className="px-3 pb-3 border-t space-y-3" style={{ borderColor: "var(--apt-border)" }}>
                  <div className="pt-3 grid grid-cols-2 gap-3">
                    <Input label="Title" value={activeItem.title} onChange={(e) => updItem(item.id, { title: e.target.value })} wrapperClass="col-span-2" />
                    <Textarea label="Description" value={activeItem.desc} onChange={(e) => updItem(item.id, { desc: e.target.value })} wrapperClass="col-span-2" className="text-[13px]" rows={3} />
                    <div>
                      <label className="text-[12px] font-medium" style={{ color: "var(--apt-text-primary)" }}>Accent color</label>
                      <div className="flex items-center gap-2 mt-1.5">
                        <input type="color" value={activeItem.accent} onChange={(e) => updItem(item.id, { accent: e.target.value })} className="w-9 h-9 rounded cursor-pointer border" style={{ borderColor: "var(--apt-border)" }} />
                        <Input value={activeItem.accent} onChange={(e) => updItem(item.id, { accent: e.target.value })} className="font-mono" />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
