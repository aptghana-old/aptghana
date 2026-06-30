"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { RecentlyViewedProduct } from "@/types/product";

const LS_KEY = "apt-recently-viewed";

/* ─── Card ───────────────────────────────────────────────────────────────── */
function RecentlyViewedCard({ item }: { item: RecentlyViewedProduct }) {
  return (
    <Link
      href={`/products/${item.sku}`}
      className="group flex flex-col rounded-xl overflow-hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
      style={{ border: "1px solid var(--border)", background: "var(--bg-surface)", textDecoration: "none" }}
    >
      {/* Image */}
      <div
        className="relative w-full overflow-hidden"
        style={{ aspectRatio: "1/1", background: "var(--bg-raised)" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.image.preview}
          alt={item.description}
          className="absolute inset-0 w-full h-full object-contain p-3 transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
          draggable={false}
        />
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col gap-1 flex-1">
        <p
          className="text-[12px] font-medium line-clamp-2 leading-snug"
          style={{ color: "var(--text-1)" }}
        >
          {item.description}
        </p>
        <p className="text-[11px] font-mono mt-auto pt-1" style={{ color: "var(--text-4)" }}>
          {item.sku}
        </p>
      </div>

      {/* Bottom hover bar */}
      <div
        className="h-0.5 w-full transition-all duration-200 opacity-0 group-hover:opacity-100"
        style={{ background: "#0057b8" }}
      />
    </Link>
  );
}

/* ─── Section ─────────────────────────────────────────────────────────────── */
export default function RecentlyViewed({ currentSku }: { currentSku: string }) {
  const [items, setItems] = useState<RecentlyViewedProduct[] | null>(null);

  useEffect(() => {
    try {
      const stored = JSON.parse(
        localStorage.getItem(LS_KEY) ?? "[]"
      ) as RecentlyViewedProduct[];
      setItems(
        stored.filter((item) => item.sku !== currentSku).slice(0, 12)
      );
    } catch {
      setItems([]);
    }
  }, [currentSku]);

  // null = hydrating — avoid CLS flash
  if (items === null || items.length === 0) return null;

  return (
    <section className="py-8" style={{ borderBottom: "1px solid var(--border)" }}>
      <div className="flex items-center justify-between gap-4 mb-5">
        <h2 className="text-[17px] font-bold" style={{ color: "var(--text-1)" }}>
          Recently Viewed
          <span className="text-[14px] font-normal ml-2" style={{ color: "var(--text-4)" }}>
            ({items.length})
          </span>
        </h2>
        <button
          onClick={() => {
            try { localStorage.removeItem(LS_KEY); } catch { /* noop */ }
            setItems([]);
          }}
          className="text-[12px] transition-colors hover:underline focus-visible:underline"
          style={{ color: "var(--text-4)" }}
        >
          Clear
        </button>
      </div>

      {/* Mobile: horizontal scroll */}
      <div className="sm:hidden flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
        {items.map((item) => (
          <div key={item.sku} className="shrink-0 w-[155px]">
            <RecentlyViewedCard item={item} />
          </div>
        ))}
      </div>

      {/* Desktop: grid */}
      <div className="hidden sm:grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {items.map((item) => (
          <RecentlyViewedCard key={item.sku} item={item} />
        ))}
      </div>
    </section>
  );
}
