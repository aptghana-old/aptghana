"use client";

import { useState } from "react";
import Link from "next/link";
import { STORE_URL } from "@apt/config";

const STATS = [
  { value: "6,000+", label: "Industrial Products" },
  { value: "26+", label: "Global Brand Partners" },
  { value: "15+", label: "Years of Expertise" },
  { value: "500+", label: "Industry Clients" },
];

const SEARCH_SUGGESTIONS = [
  "ATV630 VFD",
  "Acti 9 MCB",
  "WEG W22 Motor",
  "Camozzi Valve",
  "Circuit Breaker",
  "PLC Schneider",
];

export default function Hero() {
  const [query, setQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      window.location.href = `${STORE_URL}/search?q=${encodeURIComponent(query.trim())}`;
    }
  };

  return (
    <section className="relative min-h-screen bg-[#F8FAFC] dark:bg-[#0A0F1E] flex items-center overflow-hidden">
      {/* Subtle grid background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(30,58,95,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(30,58,95,0.05) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
      {/* Dark mode grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none hidden dark:block"
        style={{
          backgroundImage:
            "linear-gradient(rgba(132,204,22,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(132,204,22,0.04) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
      {/* Light mode top gradient */}
      <div className="absolute top-0 inset-x-0 h-[40%] pointer-events-none bg-gradient-to-b from-[#EFF6FF]/60 via-transparent to-transparent dark:hidden" />
      {/* Dark mode left glow */}
      <div className="absolute top-0 left-0 w-[60%] h-full pointer-events-none hidden dark:block bg-gradient-to-r from-[#0057b8]/8 via-transparent to-transparent" />
      {/* Bottom-right lime accents */}
      <div className="absolute bottom-0 right-0 w-[45%] h-[1px] pointer-events-none bg-gradient-to-l from-[#84CC16]/30 via-[#84CC16]/10 to-transparent" />
      <div className="absolute bottom-0 right-0 w-[1px] h-[35%] pointer-events-none bg-gradient-to-t from-[#84CC16]/30 via-[#84CC16]/10 to-transparent" />
      <div className="absolute bottom-20 right-20 w-36 h-36 rounded-full border border-[#84CC16]/8 dark:border-[#84CC16]/8 pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-20 h-20 rounded-full border border-[#84CC16]/12 dark:border-[#84CC16]/12 pointer-events-none" />

      <div className="container-apt relative z-10 py-24 lg:py-0">
        <div className="grid lg:grid-cols-5 gap-12 lg:gap-14 items-center min-h-screen lg:min-h-[calc(100vh-80px)]">

          {/* ── Left column (60%) ── */}
          <div className="lg:col-span-3 pt-8 lg:pt-0">
            {/* Eyebrow */}
            <div className="flex items-center gap-3 mb-7">
              <div className="w-8 h-[2px] rounded-full bg-[#84CC16]" />
              <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#84CC16]">
                West Africa's Industrial Technology Leader
              </span>
            </div>

            {/* Headline */}
            <h1
              className="font-extrabold text-[#0F172A] dark:text-white leading-[1.04] tracking-tight mb-6"
              style={{
                fontFamily: "var(--font-sora, 'Sora', sans-serif)",
                fontSize: "clamp(2.5rem, 5vw, 4.5rem)",
              }}
            >
              Powering Industry.<br />
              Driving Progress.<br />
              <span className="text-[#84CC16]">Delivering Excellence.</span>
            </h1>

            {/* Subtitle */}
            <p className="text-[#64748B] dark:text-[#94A3B8] text-lg sm:text-xl leading-relaxed max-w-[520px] mb-9">
              Ghana's most trusted industrial platform. 6,000+ products. 26+ global brands.
              15 years of expertise across mining, manufacturing, energy, and construction.
            </p>

            {/* Search bar */}
            <form
              onSubmit={handleSearch}
              className="flex gap-2 p-2 rounded-2xl border border-[#E2E8F0] dark:border-white/12 bg-white dark:bg-white/[0.05] max-w-[560px] mb-4"
            >
              <div className="flex flex-1 items-center gap-3 px-2">
                <svg
                  className="w-5 h-5 text-[#94A3B8] dark:text-white/30 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search products, SKUs, brands..."
                  className="w-full bg-transparent text-[#0F172A] dark:text-white placeholder-[#94A3B8] dark:placeholder-white/30 text-sm focus:outline-none py-2"
                  autoComplete="off"
                />
              </div>
              <button
                type="submit"
                className="shrink-0 px-5 py-2.5 rounded-xl text-sm font-bold text-[#0A0F1E] bg-[#84CC16] hover:bg-[#78B800] transition-colors"
              >
                Search
              </button>
            </form>

            <div className="flex flex-wrap items-center gap-2 mb-8 max-w-[560px]">
              <span className="text-[11px] text-[#94A3B8] dark:text-white/25">Try:</span>
              {SEARCH_SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    window.location.href = `${STORE_URL}/search?q=${encodeURIComponent(s)}`;
                  }}
                  className="px-2.5 py-1 text-[11px] text-[#64748B] dark:text-white/40 rounded-full border border-[#E2E8F0] dark:border-white/10 hover:text-[#0F172A] dark:hover:text-white hover:border-[#CBD5E0] dark:hover:border-white/25 transition-all"
                >
                  {s}
                </button>
              ))}
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap gap-4 mb-10">
              <Link
                href="/solutions"
                className="inline-flex items-center gap-2.5 h-13 px-7 font-bold text-base rounded-xl transition-all duration-200 bg-[#84CC16] text-[#0A0F1E] hover:bg-[#78B800] hover:shadow-[0_0_28px_rgba(132,204,22,0.3)]"
              >
                Explore Solutions
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              <Link
                href={STORE_URL}
                className="inline-flex items-center gap-2 h-13 px-7 border-2 border-[#E2E8F0] dark:border-white/15 text-[#0F172A] dark:text-white hover:border-[#CBD5E0] dark:hover:border-white/40 hover:bg-[#F1F5F9] dark:hover:bg-white/5 font-semibold text-base rounded-xl transition-all duration-200"
              >
                Browse 6,000+ Products
              </Link>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap gap-x-6 gap-y-3 border-t border-[#E2E8F0] dark:border-white/[0.07] pt-7">
              {[
                "Schneider Electric Certified Distributor",
                "ISO-compliant Processes",
                "15+ Years Industry Experience",
              ].map((text) => (
                <div key={text} className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 bg-[#84CC16]/15">
                    <svg className="w-3 h-3 text-[#84CC16]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-[#64748B] dark:text-[#94A3B8] text-xs font-medium">{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Right column (40%) — stat card ── */}
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-2xl border border-[#E2E8F0] dark:border-white/10 p-8 lg:p-10 bg-white dark:bg-white/[0.04] backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.06)] dark:shadow-[0_24px_60px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.06)]">
              <div className="flex items-center gap-3 mb-8 pb-6 border-b border-[#E2E8F0] dark:border-white/[0.07]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#84CC16] animate-pulse" />
                <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#94A3B8] dark:text-white/35">
                  Platform Overview
                </span>
              </div>

              <div className="grid grid-cols-2 gap-7">
                {STATS.map((stat) => (
                  <div key={stat.value}>
                    <div
                      className="text-[2.25rem] font-extrabold leading-none mb-1.5 tabular-nums text-[#84CC16]"
                      style={{ fontFamily: "var(--font-sora, 'Sora', sans-serif)" }}
                    >
                      {stat.value}
                    </div>
                    <div className="text-[#64748B] dark:text-white/40 text-xs font-medium leading-snug">{stat.label}</div>
                  </div>
                ))}
              </div>

              <div className="mt-8 pt-6 border-t border-[#E2E8F0] dark:border-white/[0.07]">
                <p className="text-[#94A3B8] dark:text-white/22 text-[11px] leading-relaxed">
                  Trusted by Ghana's leading mining, manufacturing, and energy companies since 2009.
                </p>
              </div>
            </div>

            {/* Schneider partner badge */}
            <div
              className="flex items-center gap-4 px-5 py-4 rounded-xl border"
              style={{ borderColor: "rgba(132,204,22,0.2)", background: "rgba(132,204,22,0.05)" }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "rgba(132,204,22,0.15)" }}
              >
                <svg className="w-5 h-5 text-[#84CC16]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              </div>
              <div>
                <p className="text-[#0F172A] dark:text-white text-xs font-semibold">Official Certified Partner</p>
                <p className="text-[#64748B] dark:text-white/30 text-[11px] mt-0.5">Schneider Electric · West Africa</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
