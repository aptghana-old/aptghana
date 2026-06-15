"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";

export interface HeroSlide {
  title: string;
  subtitle: string;
  cta: { label: string; href: string };
  ctaSecondary?: { label: string; href: string };
  desktopSrc: string;
  mobileSrc?: string;
  badge?: string;
  align?: "left" | "right" | "center";
}

interface HeroCarouselProps {
  slides: HeroSlide[];
  sidePanels?: { title: string; desc: string; href: string; image: string; badge?: string }[];
}

export default function HeroCarousel({ slides, sidePanels = [] }: HeroCarouselProps) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const next = useCallback(() => setCurrent((c) => (c + 1) % slides.length), [slides.length]);
  const prev = useCallback(() => setCurrent((c) => (c - 1 + slides.length) % slides.length), [slides.length]);

  useEffect(() => {
    if (paused) return;
    timerRef.current = setInterval(next, 5000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [next, paused]);

  const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(delta) > 40) { delta < 0 ? next() : prev(); }
    touchStartX.current = null;
  };

  const slide = slides[current];
  const alignClass = slide.align === "right" ? "items-end text-right" : slide.align === "center" ? "items-center text-center" : "items-start text-left";

  return (
    <div className="relative w-full flex flex-col lg:flex-row gap-3">
      {/* ── Main carousel ── */}
      <div
        className={`relative overflow-hidden rounded-2xl shadow-lg bg-navy-900 ${sidePanels.length > 0 ? "lg:flex-1" : "w-full"} h-64 sm:h-80 lg:h-[460px]`}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        aria-roledescription="carousel"
        aria-label="Promotional banners"
      >
        {/* Slides */}
        {slides.map((s, i) => (
          <div
            key={i}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${slides.length}`}
            aria-hidden={i !== current}
            className={`absolute inset-0 transition-opacity duration-700 ${i === current ? "opacity-100 z-10" : "opacity-0 z-0"}`}
          >
            {/* Mobile image */}
            {s.mobileSrc && (
              <Image
                src={s.mobileSrc}
                alt={s.title}
                fill
                priority={i === 0}
                sizes="100vw"
                className="object-cover object-center sm:hidden"
              />
            )}
            {/* Desktop image */}
            <Image
              src={s.desktopSrc}
              alt={s.title}
              fill
              priority={i === 0}
              sizes={sidePanels.length > 0 ? "(max-width: 1024px) 100vw, 70vw" : "100vw"}
              className={`object-cover object-center ${s.mobileSrc ? "hidden sm:block" : "block"}`}
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/35 to-transparent" />

            {/* Content */}
            <div className={`absolute inset-0 p-6 sm:p-8 lg:p-10 flex flex-col justify-end sm:justify-center ${alignClass}`}>
              <div className="max-w-sm space-y-3">
                {s.badge && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-se-green/20 border border-se-green/30 text-[11px] font-bold text-se-green uppercase tracking-widest">
                    <span className="w-1.5 h-1.5 rounded-full bg-se-green animate-pulse-dot" />
                    {s.badge}
                  </span>
                )}
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white leading-tight">{s.title}</h2>
                {s.subtitle && <p className="text-xs sm:text-sm text-white/70 leading-relaxed">{s.subtitle}</p>}
                <div className="flex flex-wrap gap-2 pt-1">
                  <Link
                    href={s.cta.href}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-navy-900 font-bold text-sm rounded-xl hover:bg-navy-50 transition-colors shadow-lg"
                  >
                    {s.cta.label}
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </Link>
                  {s.ctaSecondary && (
                    <Link
                      href={s.ctaSecondary.href}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold text-sm rounded-xl border border-white/20 backdrop-blur-sm transition-colors"
                    >
                      {s.ctaSecondary.label}
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Prev / Next */}
        {slides.length > 1 && (
          <>
            <button
              onClick={prev}
              aria-label="Previous slide"
              className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/30 hover:bg-black/55 backdrop-blur-sm flex items-center justify-center text-white transition-all opacity-0 group-focus-visible:opacity-100 hover:opacity-100 focus-visible:opacity-100"
              style={{ opacity: undefined }}
              onFocus={() => setPaused(true)}
              onBlur={() => setPaused(false)}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
            <button
              onClick={next}
              aria-label="Next slide"
              className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/30 hover:bg-black/55 backdrop-blur-sm flex items-center justify-center text-white transition-all"
              onFocus={() => setPaused(true)}
              onBlur={() => setPaused(false)}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </>
        )}

        {/* Dots */}
        {slides.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => { setCurrent(i); setPaused(true); setTimeout(() => setPaused(false), 6000); }}
                aria-label={`Go to slide ${i + 1}`}
                aria-current={i === current}
                className={`rounded-full transition-all duration-300 ${i === current ? "w-5 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/40 hover:bg-white/70"}`}
              />
            ))}
          </div>
        )}

        {/* Progress bar */}
        {!paused && (
          <div key={current} className="absolute bottom-0 left-0 h-0.5 bg-white/30 z-20" style={{ animation: "progress-bar 5s linear forwards", width: "0%" }} />
        )}
      </div>

      {/* ── Side panels ── */}
      {sidePanels.length > 0 && (
        <div className="flex flex-row lg:flex-col gap-3 lg:w-[260px] xl:w-[290px]">
          {sidePanels.map((panel, i) => (
            <Link
              key={i}
              href={panel.href}
              className="group relative flex-1 lg:flex-none lg:h-[calc(50%-6px)] rounded-2xl overflow-hidden shadow bg-navy-900 min-h-[120px] sm:min-h-[140px]"
            >
              <Image
                src={panel.image}
                alt={panel.title}
                fill
                loading="lazy"
                sizes="(max-width: 1024px) 50vw, 290px"
                className="object-cover object-center group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/40 to-transparent" />
              <div className="absolute inset-0 p-4 flex flex-col justify-center max-w-[200px]">
                {panel.badge && (
                  <span className="inline-block text-[10px] font-bold text-se-green uppercase tracking-widest mb-1">{panel.badge}</span>
                )}
                <p className="font-bold text-white text-sm leading-snug line-clamp-2">{panel.title}</p>
                <p className="text-[11px] text-white/60 mt-1 line-clamp-2">{panel.desc}</p>
                <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-white/80 group-hover:text-white transition-colors">
                  Shop Now
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
