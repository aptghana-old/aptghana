"use client";

import { useState } from "react";
import type { HpSection, CTAConfig } from "@apt/db";
import { Input, Textarea } from "@/components/ui/Input";

interface Props { section: HpSection; onChange: (s: HpSection) => void }

export default function CTAEditor({ section, onChange }: Props) {
  const cfg = section.config as unknown as CTAConfig;
  const [fnInput, setFnInput] = useState("");

  function set(patch: Partial<CTAConfig>) {
    onChange({ ...section, config: { ...cfg, ...patch } });
  }
  function addFootnote() {
    if (!fnInput.trim()) return;
    set({ footnotes: [...cfg.footnotes, fnInput.trim()] });
    setFnInput("");
  }
  function removeFootnote(i: number) {
    set({ footnotes: cfg.footnotes.filter((_, idx) => idx !== i) });
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input label="Badge text" value={cfg.badge} onChange={(e) => set({ badge: e.target.value })} wrapperClass="col-span-2" placeholder="Ready to Partner With Us?" />
        <Textarea label="Title (use \n for line breaks)" value={cfg.title} onChange={(e) => set({ title: e.target.value })} wrapperClass="col-span-2" className="text-[13px]" rows={2} />
        <Textarea label="Subtitle" value={cfg.subtitle} onChange={(e) => set({ subtitle: e.target.value })} wrapperClass="col-span-2" className="text-[13px]" rows={2} />
        <Input label="Primary CTA label" value={cfg.primaryLabel} onChange={(e) => set({ primaryLabel: e.target.value })} />
        <Input label="Primary CTA URL" value={cfg.primaryHref} onChange={(e) => set({ primaryHref: e.target.value })} />
        <Input label="Secondary CTA label" value={cfg.secondaryLabel} onChange={(e) => set({ secondaryLabel: e.target.value })} />
        <Input label="Secondary CTA URL" value={cfg.secondaryHref} onChange={(e) => set({ secondaryHref: e.target.value })} />
        <Input label="Phone number (tel: link)" value={cfg.phone} onChange={(e) => set({ phone: e.target.value })} wrapperClass="col-span-2" placeholder="+233302123456" />
      </div>

      <div>
        <h3 className="text-[13px] font-semibold mb-2" style={{ color: "var(--apt-text-primary)" }}>Footer trust badges</h3>
        <div className="space-y-1.5 mb-2">
          {cfg.footnotes.map((fn, i) => (
            <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-md border" style={{ borderColor: "var(--apt-border)", background: "var(--apt-bg)" }}>
              <span className="flex-1 text-[13px]" style={{ color: "var(--apt-text-primary)" }}>{fn}</span>
              <button onClick={() => removeFootnote(i)} className="text-red-400 hover:text-red-600 text-[12px]">Remove</button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <Input value={fnInput} onChange={(e) => setFnInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addFootnote()} placeholder="e.g. ISO 9001 Quality Management" wrapperClass="flex-1" />
          <button onClick={addFootnote} className="px-3 py-1 rounded-md text-[12px] font-medium shrink-0" style={{ background: "var(--apt-bg-raised)", color: "var(--apt-text-brand)" }}>Add</button>
        </div>
      </div>
    </div>
  );
}
