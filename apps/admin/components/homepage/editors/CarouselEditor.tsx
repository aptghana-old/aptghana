"use client";

import { useState } from "react";
import type { HpCarousel, HpSlide, HpSidePanel } from "@apt/db";
import { Input, Textarea } from "@/components/ui/Input";

interface Props {
  carousel: HpCarousel;
  onChange: (c: HpCarousel) => void;
}

function uid() { return `slide-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`; }

const BLANK_SLIDE: Omit<HpSlide, "id" | "order"> = {
  title: "", subtitle: "", badge: "",
  desktopImage: "", mobileImage: "",
  ctaLabel: "Shop Now", ctaHref: "/products",
  ctaSecondaryLabel: "", ctaSecondaryHref: "",
  align: "left", enabled: true, startAt: null, endAt: null,
};

const BLANK_PANEL: Omit<HpSidePanel, "id" | "order"> = {
  title: "", desc: "", href: "/", image: "", badge: "",
};

export default function CarouselEditor({ carousel, onChange }: Props) {
  const [activeSlide, setActiveSlide] = useState<string | null>(null);
  const [activePanel, setActivePanel] = useState<string | null>(null);

  /* ── helpers ── */
  function updSlide(id: string, patch: Partial<HpSlide>) {
    onChange({ ...carousel, slides: carousel.slides.map((s) => s.id === id ? { ...s, ...patch } : s) });
  }
  function updPanel(id: string, patch: Partial<HpSidePanel>) {
    onChange({ ...carousel, sidePanels: carousel.sidePanels.map((p) => p.id === id ? { ...p, ...patch } : p) });
  }
  function addSlide() {
    const id = uid();
    const order = carousel.slides.length;
    onChange({ ...carousel, slides: [...carousel.slides, { id, order, ...BLANK_SLIDE }] });
    setActiveSlide(id);
  }
  function addPanel() {
    const id = `panel-${Date.now()}`;
    const order = carousel.sidePanels.length;
    onChange({ ...carousel, sidePanels: [...carousel.sidePanels, { id, order, ...BLANK_PANEL }] });
    setActivePanel(id);
  }
  function removeSlide(id: string) {
    onChange({ ...carousel, slides: carousel.slides.filter((s) => s.id !== id) });
    if (activeSlide === id) setActiveSlide(null);
  }
  function removePanel(id: string) {
    onChange({ ...carousel, sidePanels: carousel.sidePanels.filter((p) => p.id !== id) });
    if (activePanel === id) setActivePanel(null);
  }
  function moveSlide(id: string, dir: -1 | 1) {
    const arr = [...carousel.slides].sort((a, b) => a.order - b.order);
    const idx = arr.findIndex((s) => s.id === id);
    const nxt = idx + dir;
    if (nxt < 0 || nxt >= arr.length) return;
    [arr[idx].order, arr[nxt].order] = [arr[nxt].order, arr[idx].order];
    onChange({ ...carousel, slides: arr });
  }

  const sortedSlides = [...carousel.slides].sort((a, b) => a.order - b.order);
  const sortedPanels = [...carousel.sidePanels].sort((a, b) => a.order - b.order);
  const selectedSlide = activeSlide ? carousel.slides.find((s) => s.id === activeSlide) : null;
  const selectedPanel = activePanel ? carousel.sidePanels.find((p) => p.id === activePanel) : null;

  return (
    <div className="space-y-6">
      {/* Autoplay */}
      <div>
        <label className="text-[12px] font-medium" style={{ color: "var(--apt-text-primary)" }}>Autoplay Interval (ms)</label>
        <input
          type="number"
          value={carousel.autoplayInterval}
          onChange={(e) => onChange({ ...carousel, autoplayInterval: Number(e.target.value) })}
          className="mt-1 w-32 h-9 rounded-md border text-[13px] px-3 focus:outline-none focus:ring-2 focus:ring-[var(--apt-border-focus)]"
          style={{ borderColor: "var(--apt-border)", background: "var(--apt-bg)", color: "var(--apt-text-primary)" }}
          min={1000} max={15000} step={500}
        />
      </div>

      {/* Slides list */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-[13px] font-semibold" style={{ color: "var(--apt-text-primary)" }}>Slides ({sortedSlides.length})</h3>
          <button onClick={addSlide} className="text-[12px] font-medium px-3 py-1.5 rounded-md" style={{ background: "var(--apt-bg-raised)", color: "var(--apt-text-brand)" }}>+ Add Slide</button>
        </div>

        <div className="space-y-1.5">
          {sortedSlides.map((slide, i) => (
            <div
              key={slide.id}
              className="rounded-lg border transition-colors"
              style={{ borderColor: activeSlide === slide.id ? "var(--apt-border-focus)" : "var(--apt-border)", background: "var(--apt-bg)" }}
            >
              <div
                className="flex items-center gap-2 px-3 py-2.5 cursor-pointer"
                onClick={() => setActiveSlide(activeSlide === slide.id ? null : slide.id)}
              >
                <span className="text-[11px] font-bold w-5 h-5 rounded flex items-center justify-center shrink-0" style={{ background: "var(--apt-bg-raised)", color: "var(--apt-text-muted)" }}>{i + 1}</span>
                <label className="flex items-center gap-1.5 cursor-pointer" onClick={(e) => e.stopPropagation()}>
                  <input type="checkbox" checked={slide.enabled} onChange={(e) => updSlide(slide.id, { enabled: e.target.checked })} className="rounded" />
                </label>
                <span className="flex-1 text-[13px] truncate" style={{ color: "var(--apt-text-primary)" }}>{slide.title || <em style={{ color: "var(--apt-text-muted)" }}>Untitled slide</em>}</span>
                <div className="flex items-center gap-0.5 shrink-0">
                  <button onClick={(e) => { e.stopPropagation(); moveSlide(slide.id, -1); }} disabled={i === 0} className="w-6 h-6 rounded flex items-center justify-center disabled:opacity-30" style={{ color: "var(--apt-text-muted)" }}>↑</button>
                  <button onClick={(e) => { e.stopPropagation(); moveSlide(slide.id, 1); }} disabled={i === sortedSlides.length - 1} className="w-6 h-6 rounded flex items-center justify-center disabled:opacity-30" style={{ color: "var(--apt-text-muted)" }}>↓</button>
                  <button onClick={(e) => { e.stopPropagation(); removeSlide(slide.id); }} className="w-6 h-6 rounded flex items-center justify-center text-red-400 hover:text-red-600">×</button>
                </div>
              </div>

              {/* Inline edit form */}
              {activeSlide === slide.id && selectedSlide && (
                <div className="px-3 pb-3 space-y-3 border-t" style={{ borderColor: "var(--apt-border)" }}>
                  <div className="pt-3 grid grid-cols-2 gap-3">
                    <Input label="Title" value={selectedSlide.title} onChange={(e) => updSlide(slide.id, { title: e.target.value })} wrapperClass="col-span-2" />
                    <Textarea label="Subtitle" value={selectedSlide.subtitle} onChange={(e) => updSlide(slide.id, { subtitle: e.target.value })} wrapperClass="col-span-2" className="text-[13px]" rows={2} />
                    <Input label="Badge text" value={selectedSlide.badge} onChange={(e) => updSlide(slide.id, { badge: e.target.value })} placeholder="e.g. New Arrival" />
                    <div>
                      <label className="text-[12px] font-medium" style={{ color: "var(--apt-text-primary)" }}>Text alignment</label>
                      <select value={selectedSlide.align} onChange={(e) => updSlide(slide.id, { align: e.target.value as "left" | "right" | "center" })} className="mt-1.5 w-full h-9 rounded-md border text-[13px] px-3 focus:outline-none focus:ring-2 focus:ring-[var(--apt-border-focus)]" style={{ borderColor: "var(--apt-border)", background: "var(--apt-bg)", color: "var(--apt-text-primary)" }}>
                        <option value="left">Left</option>
                        <option value="center">Center</option>
                        <option value="right">Right</option>
                      </select>
                    </div>
                    <Input label="Desktop image URL" value={selectedSlide.desktopImage} onChange={(e) => updSlide(slide.id, { desktopImage: e.target.value })} placeholder="/images/home/..." wrapperClass="col-span-2" />
                    <Input label="Mobile image URL" value={selectedSlide.mobileImage} onChange={(e) => updSlide(slide.id, { mobileImage: e.target.value })} placeholder="/images/home/... (optional)" wrapperClass="col-span-2" />
                    <Input label="CTA label" value={selectedSlide.ctaLabel} onChange={(e) => updSlide(slide.id, { ctaLabel: e.target.value })} />
                    <Input label="CTA URL" value={selectedSlide.ctaHref} onChange={(e) => updSlide(slide.id, { ctaHref: e.target.value })} />
                    <Input label="Secondary CTA label" value={selectedSlide.ctaSecondaryLabel} onChange={(e) => updSlide(slide.id, { ctaSecondaryLabel: e.target.value })} />
                    <Input label="Secondary CTA URL" value={selectedSlide.ctaSecondaryHref} onChange={(e) => updSlide(slide.id, { ctaSecondaryHref: e.target.value })} />
                    <Input label="Schedule start (ISO)" value={selectedSlide.startAt ?? ""} onChange={(e) => updSlide(slide.id, { startAt: e.target.value || null })} placeholder="2025-06-01T00:00:00Z" />
                    <Input label="Schedule end (ISO)" value={selectedSlide.endAt ?? ""} onChange={(e) => updSlide(slide.id, { endAt: e.target.value || null })} placeholder="2025-12-31T23:59:59Z" />
                  </div>
                  {selectedSlide.desktopImage && (
                    <div>
                      <p className="text-[11px] mb-1" style={{ color: "var(--apt-text-muted)" }}>Desktop preview</p>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={selectedSlide.desktopImage} alt="" className="w-full max-h-28 object-cover rounded-md" />
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Side panels */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-[13px] font-semibold" style={{ color: "var(--apt-text-primary)" }}>Side Panels ({sortedPanels.length})</h3>
          {sortedPanels.length < 3 && (
            <button onClick={addPanel} className="text-[12px] font-medium px-3 py-1.5 rounded-md" style={{ background: "var(--apt-bg-raised)", color: "var(--apt-text-brand)" }}>+ Add Panel</button>
          )}
        </div>

        <div className="space-y-1.5">
          {sortedPanels.map((panel) => (
            <div key={panel.id} className="rounded-lg border transition-colors" style={{ borderColor: activePanel === panel.id ? "var(--apt-border-focus)" : "var(--apt-border)", background: "var(--apt-bg)" }}>
              <div className="flex items-center gap-2 px-3 py-2.5 cursor-pointer" onClick={() => setActivePanel(activePanel === panel.id ? null : panel.id)}>
                <span className="flex-1 text-[13px] truncate" style={{ color: "var(--apt-text-primary)" }}>{panel.title || <em style={{ color: "var(--apt-text-muted)" }}>Untitled panel</em>}</span>
                <button onClick={(e) => { e.stopPropagation(); removePanel(panel.id); }} className="w-6 h-6 rounded flex items-center justify-center text-red-400 hover:text-red-600">×</button>
              </div>
              {activePanel === panel.id && selectedPanel && (
                <div className="px-3 pb-3 space-y-3 border-t" style={{ borderColor: "var(--apt-border)" }}>
                  <div className="pt-3 grid grid-cols-2 gap-3">
                    <Input label="Title" value={selectedPanel.title} onChange={(e) => updPanel(panel.id, { title: e.target.value })} wrapperClass="col-span-2" />
                    <Input label="Description" value={selectedPanel.desc} onChange={(e) => updPanel(panel.id, { desc: e.target.value })} wrapperClass="col-span-2" />
                    <Input label="Image URL" value={selectedPanel.image} onChange={(e) => updPanel(panel.id, { image: e.target.value })} placeholder="/images/home/..." wrapperClass="col-span-2" />
                    <Input label="Link URL" value={selectedPanel.href} onChange={(e) => updPanel(panel.id, { href: e.target.value })} />
                    <Input label="Badge" value={selectedPanel.badge} onChange={(e) => updPanel(panel.id, { badge: e.target.value })} />
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
