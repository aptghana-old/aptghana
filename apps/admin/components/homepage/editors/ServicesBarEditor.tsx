"use client";

import { useState } from "react";
import type { HpSection, ServicesBarConfig } from "@apt/db";
import { Input } from "@/components/ui/Input";

interface Props { section: HpSection; onChange: (s: HpSection) => void }

type ServiceItem = ServicesBarConfig["items"][number];

function uid() { return `svc-${Date.now()}`; }

export default function ServicesBarEditor({ section, onChange }: Props) {
  const cfg = section.config as unknown as ServicesBarConfig;
  const [active, setActive] = useState<string | null>(null);

  function setCfg(items: ServiceItem[]) {
    onChange({ ...section, config: { ...cfg, items } });
  }
  function updItem(id: string, patch: Partial<ServiceItem>) {
    setCfg(cfg.items.map((i) => i.id === id ? { ...i, ...patch } : i));
  }
  function addItem() {
    const id = uid();
    const order = cfg.items.length;
    const item: ServiceItem = { id, order, title: "", desc: "", color: "#0057b8", iconPath: "" };
    setCfg([...cfg.items, item]);
    setActive(id);
  }
  function removeItem(id: string) {
    setCfg(cfg.items.filter((i) => i.id !== id));
    if (active === id) setActive(null);
  }
  function moveItem(id: string, dir: -1 | 1) {
    const arr = [...cfg.items].sort((a, b) => a.order - b.order);
    const idx = arr.findIndex((i) => i.id === id);
    const nxt = idx + dir;
    if (nxt < 0 || nxt >= arr.length) return;
    [arr[idx].order, arr[nxt].order] = [arr[nxt].order, arr[idx].order];
    setCfg(arr);
  }

  const sorted = [...cfg.items].sort((a, b) => a.order - b.order);
  const activeItem = active ? cfg.items.find((i) => i.id === active) : null;

  return (
    <div className="space-y-4">
      <p className="text-[12px]" style={{ color: "var(--apt-text-muted)" }}>4 service trust signals shown in a horizontal bar below the hero.</p>
      <div className="flex justify-end">
        <button onClick={addItem} className="text-[12px] font-medium px-3 py-1.5 rounded-md" style={{ background: "var(--apt-bg-raised)", color: "var(--apt-text-brand)" }}>+ Add item</button>
      </div>
      <div className="space-y-1.5">
        {sorted.map((item, i) => (
          <div key={item.id} className="rounded-lg border" style={{ borderColor: active === item.id ? "var(--apt-border-focus)" : "var(--apt-border)", background: "var(--apt-bg)" }}>
            <div className="flex items-center gap-2 px-3 py-2.5 cursor-pointer" onClick={() => setActive(active === item.id ? null : item.id)}>
              <span className="w-3 h-3 rounded-full shrink-0" style={{ background: item.color }} />
              <span className="flex-1 text-[13px] truncate" style={{ color: "var(--apt-text-primary)" }}>{item.title || "Untitled"}</span>
              <div className="flex items-center gap-0.5 shrink-0">
                <button onClick={(e) => { e.stopPropagation(); moveItem(item.id, -1); }} disabled={i === 0} className="w-6 h-6 rounded disabled:opacity-30 text-[12px]" style={{ color: "var(--apt-text-muted)" }}>↑</button>
                <button onClick={(e) => { e.stopPropagation(); moveItem(item.id, 1); }} disabled={i === sorted.length - 1} className="w-6 h-6 rounded disabled:opacity-30 text-[12px]" style={{ color: "var(--apt-text-muted)" }}>↓</button>
                <button onClick={(e) => { e.stopPropagation(); removeItem(item.id); }} className="w-6 h-6 rounded text-red-400 hover:text-red-600">×</button>
              </div>
            </div>
            {active === item.id && activeItem && (
              <div className="px-3 pb-3 border-t space-y-3" style={{ borderColor: "var(--apt-border)" }}>
                <div className="pt-3 grid grid-cols-2 gap-3">
                  <Input label="Title" value={activeItem.title} onChange={(e) => updItem(item.id, { title: e.target.value })} wrapperClass="col-span-2" />
                  <Input label="Description" value={activeItem.desc} onChange={(e) => updItem(item.id, { desc: e.target.value })} wrapperClass="col-span-2" />
                  <div>
                    <label className="text-[12px] font-medium" style={{ color: "var(--apt-text-primary)" }}>Accent color</label>
                    <div className="flex items-center gap-2 mt-1.5">
                      <input type="color" value={activeItem.color} onChange={(e) => updItem(item.id, { color: e.target.value })} className="w-9 h-9 rounded cursor-pointer border" style={{ borderColor: "var(--apt-border)" }} />
                      <Input value={activeItem.color} onChange={(e) => updItem(item.id, { color: e.target.value })} className="font-mono" />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
