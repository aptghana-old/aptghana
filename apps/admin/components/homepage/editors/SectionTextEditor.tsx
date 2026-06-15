"use client";

import type { HpSection } from "@apt/db";
import { Input, Textarea } from "@/components/ui/Input";

interface Props {
  section: HpSection;
  onChange: (s: HpSection) => void;
  fields?: Array<"label" | "title" | "subtitle" | "showViewAll" | "limit">;
  hint?: string;
}

export default function SectionTextEditor({ section, onChange, fields = ["label", "title", "subtitle"], hint }: Props) {
  const cfg = section.config as Record<string, unknown>;
  function set(patch: Record<string, unknown>) {
    onChange({ ...section, config: { ...cfg, ...patch } });
  }
  const show = (f: string) => fields.includes(f as never);

  return (
    <div className="space-y-4">
      {hint && <p className="text-[12px]" style={{ color: "var(--apt-text-muted)" }}>{hint}</p>}
      <div className="grid grid-cols-1 gap-4">
        {show("label") && (
          <Input label="Section label (eyebrow)" value={String(cfg.label ?? "")} onChange={(e) => set({ label: e.target.value })} hint="Small uppercase text above the title" />
        )}
        {show("title") && (
          <Input label="Section title" value={String(cfg.title ?? "")} onChange={(e) => set({ title: e.target.value })} />
        )}
        {show("subtitle") && (
          <Textarea label="Subtitle / description" value={String(cfg.subtitle ?? "")} onChange={(e) => set({ subtitle: e.target.value })} className="text-[13px]" rows={2} />
        )}
        {show("showViewAll") && (
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={Boolean(cfg.showViewAll)} onChange={(e) => set({ showViewAll: e.target.checked })} className="rounded" />
            <span className="text-[13px]" style={{ color: "var(--apt-text-primary)" }}>Show "View all" link</span>
          </label>
        )}
        {show("limit") && (
          <div>
            <label className="text-[12px] font-medium" style={{ color: "var(--apt-text-primary)" }}>Max items shown</label>
            <input
              type="number" value={Number(cfg.limit ?? 8)} min={2} max={24} step={2}
              onChange={(e) => set({ limit: Number(e.target.value) })}
              className="mt-1.5 w-24 h-9 rounded-md border text-[13px] px-3 focus:outline-none focus:ring-2 focus:ring-[var(--apt-border-focus)]"
              style={{ borderColor: "var(--apt-border)", background: "var(--apt-bg)", color: "var(--apt-text-primary)" }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
