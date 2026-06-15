"use client";

import type { HpSection, FullWidthBannerConfig } from "@apt/db";
import { Input } from "@/components/ui/Input";

interface Props { section: HpSection; onChange: (s: HpSection) => void }

export default function FullWidthBannerEditor({ section, onChange }: Props) {
  const cfg = section.config as unknown as FullWidthBannerConfig;
  function set(patch: Partial<FullWidthBannerConfig>) {
    onChange({ ...section, config: { ...cfg, ...patch } });
  }

  return (
    <div className="space-y-4">
      <p className="text-[12px]" style={{ color: "var(--apt-text-muted)" }}>
        A full-width clickable image banner. Separate desktop and mobile images for optimal display.
      </p>
      <div className="grid grid-cols-2 gap-4">
        <Input label="Desktop image URL" value={cfg.desktopImage} onChange={(e) => set({ desktopImage: e.target.value })} placeholder="/images/home/..." wrapperClass="col-span-2" />
        <Input label="Mobile image URL" value={cfg.mobileImage} onChange={(e) => set({ mobileImage: e.target.value })} placeholder="/images/home/... (optional)" wrapperClass="col-span-2" />
        <Input label="Alt text (SEO)" value={cfg.altText} onChange={(e) => set({ altText: e.target.value })} wrapperClass="col-span-2" />
        <Input label="Link URL (href)" value={cfg.href} onChange={(e) => set({ href: e.target.value })} wrapperClass="col-span-2" />
        <Input label="Desktop aspect ratio" value={cfg.aspectDesktop} onChange={(e) => set({ aspectDesktop: e.target.value })} placeholder="1920/448" hint="width/height" />
        <Input label="Mobile aspect ratio" value={cfg.aspectMobile} onChange={(e) => set({ aspectMobile: e.target.value })} placeholder="375/245" hint="width/height" />
      </div>
      {cfg.desktopImage && (
        <div>
          <p className="text-[11px] mb-1.5" style={{ color: "var(--apt-text-muted)" }}>Desktop preview</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={cfg.desktopImage} alt="" className="w-full max-h-32 object-cover rounded-lg border" style={{ borderColor: "var(--apt-border)" }} />
        </div>
      )}
    </div>
  );
}
