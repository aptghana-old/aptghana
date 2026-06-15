"use client";

import { useState } from "react";
import type { HpSection, PromoBannersConfig, PromoBannerItem } from "@apt/db";
import { Input, Textarea } from "@/components/ui/Input";

interface Props { section: HpSection; onChange: (s: HpSection) => void }

function uid() { return `banner-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`; }

const BLANK: Omit<PromoBannerItem, "id" | "order"> = {
  headline: "", sub: "", cta: "Shop Now", href: "/",
  image: "", badge: "", badgeColor: "#0057b8", enabled: true,
};

export default function PromoBannersEditor({ section, onChange }: Props) {
  const cfg = section.config as unknown as PromoBannersConfig;
  const [active, setActive] = useState<string | null>(null);

  function update(banners: PromoBannerItem[]) {
    onChange({ ...section, config: { ...cfg, banners } });
  }
  function updBanner(id: string, patch: Partial<PromoBannerItem>) {
    update(cfg.banners.map((b) => b.id === id ? { ...b, ...patch } : b));
  }
  function addBanner() {
    const id = uid();
    const order = cfg.banners.length;
    const banners = [...cfg.banners, { id, order, ...BLANK }];
    update(banners);
    setActive(id);
  }
  function removeBanner(id: string) {
    update(cfg.banners.filter((b) => b.id !== id));
    if (active === id) setActive(null);
  }
  function moveBanner(id: string, dir: -1 | 1) {
    const arr = [...cfg.banners].sort((a, b) => a.order - b.order);
    const idx = arr.findIndex((b) => b.id === id);
    const nxt = idx + dir;
    if (nxt < 0 || nxt >= arr.length) return;
    [arr[idx].order, arr[nxt].order] = [arr[nxt].order, arr[idx].order];
    update(arr);
  }

  const sorted = [...cfg.banners].sort((a, b) => a.order - b.order);
  const activeBanner = active ? cfg.banners.find((b) => b.id === active) : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[12px]" style={{ color: "var(--apt-text-muted)" }}>Up to 3 promotional image banners displayed in a row.</p>
        {sorted.length < 4 && <button onClick={addBanner} className="text-[12px] font-medium px-3 py-1.5 rounded-md" style={{ background: "var(--apt-bg-raised)", color: "var(--apt-text-brand)" }}>+ Add Banner</button>}
      </div>

      <div className="space-y-1.5">
        {sorted.map((banner, i) => (
          <div key={banner.id} className="rounded-lg border" style={{ borderColor: active === banner.id ? "var(--apt-border-focus)" : "var(--apt-border)", background: "var(--apt-bg)" }}>
            <div className="flex items-center gap-2 px-3 py-2.5 cursor-pointer" onClick={() => setActive(active === banner.id ? null : banner.id)}>
              <label className="flex items-center gap-1.5 cursor-pointer" onClick={(e) => e.stopPropagation()}>
                <input type="checkbox" checked={banner.enabled} onChange={(e) => updBanner(banner.id, { enabled: e.target.checked })} className="rounded" />
              </label>
              <span className="flex-1 text-[13px] truncate" style={{ color: "var(--apt-text-primary)" }}>{banner.headline || "Untitled banner"}</span>
              <div className="flex items-center gap-0.5 shrink-0">
                <button onClick={(e) => { e.stopPropagation(); moveBanner(banner.id, -1); }} disabled={i === 0} className="w-6 h-6 rounded disabled:opacity-30 text-[12px]" style={{ color: "var(--apt-text-muted)" }}>↑</button>
                <button onClick={(e) => { e.stopPropagation(); moveBanner(banner.id, 1); }} disabled={i === sorted.length - 1} className="w-6 h-6 rounded disabled:opacity-30 text-[12px]" style={{ color: "var(--apt-text-muted)" }}>↓</button>
                <button onClick={(e) => { e.stopPropagation(); removeBanner(banner.id); }} className="w-6 h-6 rounded text-red-400 hover:text-red-600">×</button>
              </div>
            </div>

            {active === banner.id && activeBanner && (
              <div className="px-3 pb-3 border-t space-y-3" style={{ borderColor: "var(--apt-border)" }}>
                <div className="pt-3 grid grid-cols-2 gap-3">
                  <Input label="Headline" value={activeBanner.headline} onChange={(e) => updBanner(banner.id, { headline: e.target.value })} wrapperClass="col-span-2" />
                  <Textarea label="Subtext" value={activeBanner.sub} onChange={(e) => updBanner(banner.id, { sub: e.target.value })} wrapperClass="col-span-2" className="text-[13px]" rows={2} />
                  <Input label="Image URL" value={activeBanner.image} onChange={(e) => updBanner(banner.id, { image: e.target.value })} placeholder="/images/home/..." wrapperClass="col-span-2" />
                  <Input label="CTA label" value={activeBanner.cta} onChange={(e) => updBanner(banner.id, { cta: e.target.value })} />
                  <Input label="Link URL" value={activeBanner.href} onChange={(e) => updBanner(banner.id, { href: e.target.value })} />
                  <Input label="Badge text" value={activeBanner.badge} onChange={(e) => updBanner(banner.id, { badge: e.target.value })} />
                  <div>
                    <label className="text-[12px] font-medium" style={{ color: "var(--apt-text-primary)" }}>Badge color</label>
                    <div className="flex items-center gap-2 mt-1.5">
                      <input type="color" value={activeBanner.badgeColor} onChange={(e) => updBanner(banner.id, { badgeColor: e.target.value })} className="w-9 h-9 rounded cursor-pointer border" style={{ borderColor: "var(--apt-border)" }} />
                      <Input value={activeBanner.badgeColor} onChange={(e) => updBanner(banner.id, { badgeColor: e.target.value })} className="font-mono" />
                    </div>
                  </div>
                </div>
                {activeBanner.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={activeBanner.image} alt="" className="w-full max-h-24 object-cover rounded-md" />
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
