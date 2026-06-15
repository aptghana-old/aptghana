"use client";

import { useState } from "react";
import type { HpSection, ResourcesConfig, ResourceItem } from "@apt/db";
import { Input, Textarea } from "@/components/ui/Input";

interface Props { section: HpSection; onChange: (s: HpSection) => void }

function uid() { return `res-${Date.now()}`; }

export default function ResourcesEditor({ section, onChange }: Props) {
  const cfg = section.config as unknown as ResourcesConfig;
  const [active, setActive] = useState<string | null>(null);

  function setCfg(patch: Partial<ResourcesConfig>) {
    onChange({ ...section, config: { ...cfg, ...patch } });
  }
  function updItem(id: string, patch: Partial<ResourceItem>) {
    setCfg({ items: cfg.items.map((i) => i.id === id ? { ...i, ...patch } : i) });
  }
  function addItem() {
    const id = uid();
    const item: ResourceItem = { id, title: "", desc: "", href: "/library", iconPath: "" };
    setCfg({ items: [...cfg.items, item] });
    setActive(id);
  }
  function removeItem(id: string) {
    setCfg({ items: cfg.items.filter((i) => i.id !== id) });
    if (active === id) setActive(null);
  }

  const activeItem = active ? cfg.items.find((i) => i.id === active) : null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        <Input label="Section label" value={cfg.label} onChange={(e) => setCfg({ label: e.target.value })} placeholder="Technical Library" />
        <Input label="Title" value={cfg.title} onChange={(e) => setCfg({ title: e.target.value })} />
        <Textarea label="Subtitle" value={cfg.subtitle} onChange={(e) => setCfg({ subtitle: e.target.value })} className="text-[13px]" rows={2} />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-[13px] font-semibold" style={{ color: "var(--apt-text-primary)" }}>Resource cards ({cfg.items.length})</h3>
          <button onClick={addItem} className="text-[12px] font-medium px-3 py-1.5 rounded-md" style={{ background: "var(--apt-bg-raised)", color: "var(--apt-text-brand)" }}>+ Add card</button>
        </div>

        <div className="space-y-1.5">
          {cfg.items.map((item) => (
            <div key={item.id} className="rounded-lg border" style={{ borderColor: active === item.id ? "var(--apt-border-focus)" : "var(--apt-border)", background: "var(--apt-bg)" }}>
              <div className="flex items-center gap-2 px-3 py-2.5 cursor-pointer" onClick={() => setActive(active === item.id ? null : item.id)}>
                <span className="flex-1 text-[13px] truncate" style={{ color: "var(--apt-text-primary)" }}>{item.title || "Untitled"}</span>
                <button onClick={(e) => { e.stopPropagation(); removeItem(item.id); }} className="w-6 h-6 rounded text-red-400 hover:text-red-600">×</button>
              </div>
              {active === item.id && activeItem && (
                <div className="px-3 pb-3 border-t space-y-3" style={{ borderColor: "var(--apt-border)" }}>
                  <div className="pt-3 grid grid-cols-2 gap-3">
                    <Input label="Title" value={activeItem.title} onChange={(e) => updItem(item.id, { title: e.target.value })} wrapperClass="col-span-2" />
                    <Textarea label="Description" value={activeItem.desc} onChange={(e) => updItem(item.id, { desc: e.target.value })} wrapperClass="col-span-2" className="text-[13px]" rows={2} />
                    <Input label="Link URL" value={activeItem.href} onChange={(e) => updItem(item.id, { href: e.target.value })} wrapperClass="col-span-2" />
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
