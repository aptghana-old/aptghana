import Link from "next/link";
import { STORE_URL } from "@apt/config";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0A0F1E] flex items-center justify-center px-6">
      <div className="text-center max-w-xl mx-auto">
        {/* 404 Number */}
        <div className="mb-6">
          <span
            className="text-[120px] font-extrabold leading-none text-transparent"
            style={{
              fontFamily: "var(--font-sora, 'Sora', sans-serif)",
              WebkitTextStroke: "2px #84CC16",
            }}
          >
            404
          </span>
        </div>

        {/* Eyebrow */}
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-6 h-0.5 rounded-full bg-[#84CC16]" />
          <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#84CC16]">
            Page Not Found
          </span>
          <div className="w-6 h-0.5 rounded-full bg-[#84CC16]" />
        </div>

        {/* Heading */}
        <h1
          className="text-3xl lg:text-4xl font-extrabold tracking-tight text-white mb-4"
          style={{ fontFamily: "var(--font-sora, 'Sora', sans-serif)" }}
        >
          We couldn&apos;t find that page
        </h1>

        {/* Description */}
        <p className="text-[#94A3B8] text-base leading-relaxed mb-8">
          The page you&apos;re looking for may have been moved, renamed, or no longer exists.
          Try searching for products on our store or browse one of the links below.
        </p>

        {/* Store suggestion */}
        <div className="mb-8 p-4 rounded-xl border border-[#84CC16]/20 bg-[#84CC16]/5">
          <p className="text-sm text-[#CBD5E1] mb-3">
            Looking for industrial products?
          </p>
          <Link
            href={STORE_URL}
            className="inline-flex items-center gap-2 h-12 px-7 bg-[#84CC16] text-[#0A0F1E] font-bold text-sm rounded-xl hover:bg-[#78B800] transition-colors"
          >
            Browse Our Online Store →
          </Link>
        </div>

        {/* Quick links */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 h-10 px-5 bg-white/10 text-white font-medium text-sm rounded-xl hover:bg-white/20 transition-colors border border-white/10"
          >
            ← Home
          </Link>
          <Link
            href="/solutions"
            className="inline-flex items-center gap-1.5 h-10 px-5 bg-white/10 text-white font-medium text-sm rounded-xl hover:bg-white/20 transition-colors border border-white/10"
          >
            Solutions
          </Link>
          <Link
            href="/brands"
            className="inline-flex items-center gap-1.5 h-10 px-5 bg-white/10 text-white font-medium text-sm rounded-xl hover:bg-white/20 transition-colors border border-white/10"
          >
            Brands
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center gap-1.5 h-10 px-5 bg-white/10 text-white font-medium text-sm rounded-xl hover:bg-white/20 transition-colors border border-white/10"
          >
            Contact Us
          </Link>
        </div>
      </div>
    </div>
  );
}
