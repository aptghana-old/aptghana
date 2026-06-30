"use client";

import { useEffect, useState } from "react";
import ProductCard, { type ProductCardData } from "./ProductCard";

const LS_KEY = "apt-recently-viewed";

/* ─── Skeleton ────────────────────────────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div className="rounded-xl overflow-hidden animate-pulse" style={{ border: "1px solid var(--border)" }}>
      <div className="aspect-square" style={{ background: "var(--bg-raised)" }} />
      <div className="p-3 space-y-2">
        <div className="h-3 rounded" style={{ background: "var(--bg-raised)", width: "80%" }} />
        <div className="h-3 rounded" style={{ background: "var(--bg-raised)", width: "55%" }} />
        <div className="h-3 rounded mt-3" style={{ background: "var(--bg-raised)", width: "40%" }} />
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <section className="py-8" style={{ borderBottom: "1px solid var(--border)" }}>
      <div className="h-6 w-48 rounded mb-5 animate-pulse" style={{ background: "var(--bg-raised)" }} />
      <div className="hidden sm:grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
      <div className="sm:hidden flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="shrink-0 w-[160px]"><SkeletonCard /></div>
        ))}
      </div>
    </section>
  );
}

/* ─── Section ─────────────────────────────────────────────────────────────── */
export default function Recommendations({ currentSku }: { currentSku: string }) {
  const [ products, setProducts ] = useState<ProductCardData[] | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const stored = JSON.parse(localStorage.getItem(LS_KEY) ?? "[]") as { sku: string }[];
        const skus = stored.map((s) => s.sku).filter(Boolean).slice(0, 15);

        const res = await fetch("/api/recommendations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ skus, currentSku, limit: 12 }),
        });
        if (!res.ok) { if (!cancelled) setProducts([]); return; }
        const data = (await res.json()) as { products: ProductCardData[] };
        if (!cancelled) setProducts(data.products ?? []);
      } catch {
        if (!cancelled) setProducts([]);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [ currentSku ]);

  if (products === null) return <Skeleton />;
  if (products.length === 0) return null;

  return (
    <section className="py-8" style={{ borderBottom: "1px solid var(--border)" }}>
      <div className="flex items-center justify-between gap-4 mb-5">
        <div>
          <h2 className="text-[17px] font-bold" style={{ color: "var(--text-1)" }}>
            Recommended For You
          </h2>
          <p className="text-[12px] mt-0.5" style={{ color: "var(--text-4)" }}>
            Based on products you&apos;ve viewed
          </p>
        </div>
        <span
          className="text-[12px] font-mono px-2 py-0.5 rounded-full"
          style={{ background: "rgba(0,87,184,0.08)", color: "#0057b8", border: "1px solid rgba(0,87,184,0.15)" }}
        >
          {products.length} products
        </span>
      </div>

      {/* Mobile */}
      <div className="sm:hidden flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
        {products.map((p) => (
          <div key={p.id} className="shrink-0 min-w-72">
            <ProductCard product={p} layout="grid" />
          </div>
        ))}
      </div>

      {/* Desktop */}
      <div className="hidden sm:grid grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {products.map((p) => (
          <div key={p.id} className="shrink-0 min-w-72">
            <ProductCard product={p} layout="grid" />
          </div>
        ))}
      </div>
    </section>
  );
}
