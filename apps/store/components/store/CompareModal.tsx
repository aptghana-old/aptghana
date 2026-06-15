"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useCompare }                        from "@/lib/store/compare";
import { useCart,    type CartProductInput } from "@/lib/store/cart";
import type { CompareProductData }           from "@/app/api/products/compare/route";

/* ─── Icon ────────────────────────────────────────────────────────────────── */
function Ico({ d, size = 14, sw = 1.75 }: { d: string; size?: number; sw?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={d} />
    </svg>
  );
}

const D = {
  close: "M6 18 18 6M6 6l12 12",
  cart:  "M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z",
  check: "M4.5 12.75l6 6 9-13.5",
  rfq:   "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25M9 16.5v.75m3-3v3M15 12v5.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z",
  eye:   "M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
  plus:  "M12 4.5v15m7.5-7.5h-15",
};

function fmt(n: number, cur = "USD") {
  return `${cur} ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/* ─── Spec alignment ──────────────────────────────────────────────────────── */
interface SpecGroup { groupName: string; specNames: string[] }

function buildSpecStructure(products: CompareProductData[]) {
  const groupOrder: string[] = [];
  const groupSpecs = new Map<string, Set<string>>();

  products.forEach((p) => {
    (p.specifications ?? []).forEach((g) => {
      if (!g?.groupName) return;
      if (!groupSpecs.has(g.groupName)) {
        groupOrder.push(g.groupName);
        groupSpecs.set(g.groupName, new Set());
      }
      (g.specs ?? []).forEach((s) => s?.name && groupSpecs.get(g.groupName)!.add(s.name));
    });
  });

  const groups: SpecGroup[] = groupOrder
    .map((name) => ({ groupName: name, specNames: [...(groupSpecs.get(name) ?? [])] }))
    .filter((g) => g.specNames.length > 0);

  const valueCache = new Map<string, Map<string, string>>();
  products.forEach((p) => {
    const m = new Map<string, string>();
    (p.specifications ?? []).forEach((g) => {
      (g?.specs ?? []).forEach((s) => {
        if (s?.name) m.set(s.name, (s.value ?? "") + (s.unit ? ` ${s.unit}` : ""));
      });
    });
    valueCache.set(p.id, m);
  });

  const getValue = (p: CompareProductData, name: string) =>
    valueCache.get(p.id)?.get(name) ?? "";

  return { groups, getValue };
}

/* ─── Table helpers ───────────────────────────────────────────────────────── */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest"
      style={{ background: "var(--bg-raised)", color: "var(--text-4)", borderBottom: "1px solid var(--border)" }}
    >
      {children}
    </div>
  );
}

function allSame(vals: string[]) {
  const nonEmpty = vals.filter(Boolean);
  return nonEmpty.length === 0 || nonEmpty.every((v) => v === nonEmpty[0]);
}

/* ─── Product column header ───────────────────────────────────────────────── */
function ProductCol({
  product, onRemove,
}: { product: CompareProductData; onRemove: () => void }) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleCart = useCallback(() => {
    const input: CartProductInput = {
      id: product.id, sku: product.sku, name: product.name,
      imageUrl: product.imageUrl, price: product.pricing.listPrice,
      currency: product.pricing.currency, minQty: product.pricing.minimumOrderQty ?? 1,
    };
    add(input, product.pricing.minimumOrderQty ?? 1);
    setAdded(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setAdded(false), 1800);
  }, [product, add]);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const hasPrice = product.pricing.listPrice > 0;

  return (
    <div className="flex flex-col p-2.5 md:p-4">
      {/* Remove */}
      <div className="flex justify-end mb-1.5">
        <button
          onClick={onRemove}
          className="flex items-center gap-1 text-[10px] md:text-[11px] font-medium text-(--text-4) hover:text-red-500 transition-colors"
          aria-label={`Remove ${product.name}`}
        >
          <Ico d={D.close} size={10} sw={2.5} />
          <span className="hidden sm:inline">Remove</span>
        </button>
      </div>

      {/* Image */}
      <Link href={`/products/${product.slug}`}
        className="block rounded-lg md:rounded-xl overflow-hidden bg-(--bg-raised) mb-2 hover:opacity-90 transition-opacity"
        style={{ aspectRatio: "1/1" }}>
        {product.imageUrl
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={product.imageUrl} alt={product.name}
              className="w-full h-full object-contain p-1.5 md:p-3" loading="lazy" />
          : <div className="w-full h-full flex items-center justify-center">
              <span className="text-(--text-4) text-[10px]">No image</span>
            </div>
        }
      </Link>

      <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider text-navy-500 mb-0.5 truncate">
        {product.brandName}
      </p>
      <Link href={`/products/${product.slug}`}>
        <h3 className="text-[11px] md:text-sm font-bold text-(--text-1) leading-snug hover:text-navy-500 transition-colors line-clamp-2 md:line-clamp-3 mb-1">
          {product.name}
        </h3>
      </Link>
      {product.sku && (
        <p className="text-[9px] md:text-[10px] font-mono text-(--text-4) mb-2 truncate">{product.sku}</p>
      )}

      <div className="mb-2 md:mb-3">
        {hasPrice
          ? <p className="text-xs md:text-base font-bold text-(--text-1) leading-tight">
              {fmt(product.pricing.listPrice, product.pricing.currency)}
            </p>
          : <p className="text-[11px] md:text-sm font-bold text-se-green">Price on Request</p>
        }
        {(product.pricing.minimumOrderQty ?? 1) > 1 && (
          <p className="text-[9px] md:text-[10px] text-(--text-4)">
            Min. {product.pricing.minimumOrderQty} units
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1 mt-auto">
        {hasPrice ? (
          <button onClick={handleCart}
            className={`w-full flex items-center justify-center gap-1 h-7 md:h-8 rounded-md md:rounded-lg text-[10px] md:text-xs font-bold transition-all ${
              added ? "bg-se-green text-white" : "bg-navy-500 hover:bg-navy-400 text-white"
            }`}>
            <Ico d={added ? D.check : D.cart} size={11} sw={2.5} />
            <span className="hidden sm:inline">{added ? "Added!" : "Add to Cart"}</span>
            <span className="sm:hidden">{added ? "✓" : "Cart"}</span>
          </button>
        ) : (
          <Link href={`/rfq?product=${product.slug}`}
            className="w-full flex items-center justify-center gap-1 h-7 md:h-8 rounded-md md:rounded-lg text-[10px] md:text-xs font-bold bg-(--bg-raised) text-(--text-2) hover:bg-navy-50 hover:text-navy-600 dark:hover:bg-navy-900/40 dark:hover:text-navy-300 border border-(--border) transition-colors">
            <Ico d={D.rfq} size={11} sw={2} />
            <span className="hidden sm:inline">Request Quote</span>
            <span className="sm:hidden">RFQ</span>
          </Link>
        )}
        <Link href={`/products/${product.slug}`}
          className="w-full flex items-center justify-center gap-1 h-6 md:h-7 text-[10px] md:text-[11px] font-semibold text-(--text-3) hover:text-navy-500 transition-colors">
          <Ico d={D.eye} size={10} sw={2} />
          <span className="hidden xs:inline">View Details</span>
          <span className="xs:hidden">View</span>
        </Link>
      </div>
    </div>
  );
}

/* ─── Row cell ────────────────────────────────────────────────────────────── */
function LabelCell({ children, dim }: { children: React.ReactNode; dim: boolean }) {
  return (
    <div
      className="px-2.5 md:px-4 py-2 md:py-2.5 text-[10px] md:text-xs font-medium sticky left-0 transition-opacity"
      style={{
        color:        "var(--text-3)",
        background:   "var(--bg-surface)",
        borderRight:  "1px solid var(--border)",
        borderBottom: "1px solid var(--border)",
        opacity:      dim ? 0.35 : 1,
      }}
    >
      {children}
    </div>
  );
}

function ValueCell({ children, dim, highlight }: { children: React.ReactNode; dim: boolean; highlight: boolean }) {
  return (
    <div
      className="px-2.5 md:px-4 py-2 md:py-2.5 text-[10px] md:text-xs text-(--text-1) transition-opacity"
      style={{
        borderBottom: "1px solid var(--border)",
        opacity:      dim ? 0.35 : 1,
        background:   highlight ? "color-mix(in srgb, var(--bg-raised) 50%, transparent)" : undefined,
      }}
    >
      {children}
    </div>
  );
}

/* ─── Loading skeleton ────────────────────────────────────────────────────── */
function Skeleton({ cols }: { cols: number }) {
  return (
    <div
      className="compare-grid grid animate-pulse"
      style={{ "--n-cols": cols } as React.CSSProperties}
    >
      {Array.from({ length: cols }).map((_, i) => (
        <div key={i} className="p-2.5 md:p-4">
          <div className="aspect-square rounded-lg bg-(--bg-raised) mb-2" />
          <div className="h-2 w-12 bg-(--bg-raised) rounded mb-1.5" />
          <div className="h-3 bg-(--bg-raised) rounded mb-1" />
          <div className="h-3 w-4/5 bg-(--bg-raised) rounded mb-3" />
          <div className="h-4 w-20 bg-(--bg-raised) rounded mb-3" />
          <div className="h-7 bg-(--bg-raised) rounded" />
        </div>
      ))}
    </div>
  );
}

/* ─── Scroll hint gradient ────────────────────────────────────────────────── */
function ScrollHint({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <div
      className="pointer-events-none absolute right-0 top-0 bottom-0 w-10 md:hidden"
      style={{ background: "linear-gradient(to right, transparent, var(--bg-surface))" }}
      aria-hidden
    />
  );
}

/* ─── Main modal ──────────────────────────────────────────────────────────── */
function ModalContent() {
  const { items, isModalOpen, closeModal, remove, clear } = useCompare();
  const [products,       setProducts]       = useState<CompareProductData[]>([]);
  const [loading,        setLoading]        = useState(false);
  const [highlightDiffs, setHighlightDiffs] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch when modal opens or item list changes
  const idsKey = items.map((i) => i.id).join(",");
  useEffect(() => {
    if (!isModalOpen || items.length === 0) return;
    setLoading(true);
    fetch(`/api/products/compare?ids=${encodeURIComponent(idsKey)}`)
      .then((r) => r.json())
      .then((d: { products: CompareProductData[] }) => setProducts(d.products ?? []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isModalOpen, idsKey]);

  // Detect horizontal overflow to show scroll hint
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const check = () => setCanScrollRight(el.scrollWidth > el.clientWidth + 4);
    check();
    el.addEventListener("scroll", check);
    window.addEventListener("resize", check);
    return () => {
      el.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
  }, [products, loading]);

  // Keyboard close
  useEffect(() => {
    if (!isModalOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") closeModal(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isModalOpen, closeModal]);

  // Lock body scroll
  useEffect(() => {
    if (!isModalOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [isModalOpen]);

  if (!isModalOpen) return null;

  const handleRemove = (id: string) => {
    remove(id);
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const handleClear = () => { clear(); setProducts([]); };

  const { groups, getValue } = buildSpecStructure(products);
  const colCount = products.length;
  const gridStyle = { "--n-cols": colCount } as React.CSSProperties;

  const keyRows: { label: string; values: string[] }[] = products.length > 0 ? [
    { label: "List Price",     values: products.map((p) => p.pricing.listPrice > 0 ? fmt(p.pricing.listPrice, p.pricing.currency) : "Price on Request") },
    { label: "Availability",   values: products.map((p) => p.inStock ? "In Stock" : "On Request") },
    { label: "SKU / Part No.", values: products.map((p) => p.sku ?? "") },
    { label: "MPN",            values: products.map((p) => p.mpn ?? "") },
    { label: "Brand",          values: products.map((p) => p.brandName) },
  ] : [];

  const allFeatures = [...new Set(products.flatMap((p) => p.features ?? []))];
  const allCerts    = [...new Set(products.flatMap((p) => p.certifications ?? []))];

  return (
    <div
      className="fixed inset-0 z-[300] flex flex-col"
      role="dialog"
      aria-modal
      aria-label="Compare products"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeModal} />

      {/* Panel — bottom sheet on all sizes */}
      <div
        className="relative flex flex-col w-full h-full sm:h-auto sm:max-h-[92vh] sm:mt-auto sm:rounded-t-3xl overflow-hidden animate-slide-up-sheet"
        style={{ background: "var(--bg-surface)", boxShadow: "var(--shadow-3)" }}
      >
        {/* ── Header ── */}
        <div
          className="flex items-center gap-2 sm:gap-4 px-3 sm:px-5 py-3 sm:py-4 shrink-0 border-b"
          style={{ borderColor: "var(--border)" }}
        >
          {/* Title */}
          <h2 className="text-sm sm:text-base font-bold text-(--text-1) flex items-center gap-2 shrink-0">
            <span className="hidden sm:inline">Compare Products</span>
            <span className="sm:hidden">Compare</span>
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[11px] font-bold text-white bg-navy-500">
              {items.length}
            </span>
          </h2>

          {/* Highlight differences toggle */}
          <div className="flex items-center gap-1.5 ml-auto">
            <span className="hidden sm:inline text-xs font-medium text-(--text-2)">Highlight differences</span>
            <button
              role="switch"
              aria-checked={highlightDiffs}
              onClick={() => setHighlightDiffs((v) => !v)}
              className={`relative inline-flex w-9 h-5 rounded-full transition-colors cursor-pointer shrink-0 ${highlightDiffs ? "bg-navy-500" : "bg-(--bg-sunken)"}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${highlightDiffs ? "translate-x-4" : ""}`} />
              <span className="sr-only">Highlight differences</span>
            </button>
          </div>

          {/* Clear — always visible, text on desktop */}
          <button
            onClick={handleClear}
            className="text-xs font-semibold text-(--text-3) hover:text-red-500 transition-colors px-2 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 shrink-0"
          >
            <span className="hidden sm:inline">Clear all</span>
            <span className="sm:hidden"><Ico d={D.close} size={13} sw={2.5} /></span>
          </button>

          {/* Close */}
          <button
            onClick={closeModal}
            aria-label="Close compare"
            className="w-8 h-8 rounded-full flex items-center justify-center text-(--text-3) hover:text-(--text-1) hover:bg-(--bg-raised) transition-colors shrink-0"
          >
            <Ico d={D.close} size={15} sw={2.5} />
          </button>
        </div>

        {/* ── Scrollable body ── */}
        <div ref={scrollRef} className="flex-1 overflow-auto relative" style={{ WebkitOverflowScrolling: "touch" } as React.CSSProperties}>
          {loading ? (
            <Skeleton cols={items.length || 2} />
          ) : products.length === 0 ? (
            <div className="flex items-center justify-center py-16 text-(--text-3) text-sm">
              Failed to load product data.
            </div>
          ) : (
            <>
              {/* === Product headers === */}
              <div
                className="compare-grid grid border-b"
                style={{ ...gridStyle, borderColor: "var(--border)" }}
              >
                {/* Corner cell */}
                <div
                  className="p-2.5 md:p-4 sticky left-0 flex flex-col justify-end"
                  style={{ background: "var(--bg-surface)", borderRight: "1px solid var(--border)" }}
                >
                  <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-(--text-4) leading-tight">
                    {colCount} product{colCount !== 1 ? "s" : ""}
                  </p>
                  {colCount < 4 && (
                    <button
                      onClick={closeModal}
                      className="mt-1.5 flex items-center gap-1 text-[10px] md:text-[11px] font-semibold text-navy-500 hover:text-navy-400 transition-colors"
                    >
                      <span className="w-4 h-4 rounded-full border-2 border-navy-500 flex items-center justify-center shrink-0">
                        <Ico d={D.plus} size={8} sw={2.5} />
                      </span>
                      <span className="hidden sm:inline">Add more</span>
                    </button>
                  )}
                </div>

                {products.map((p) => (
                  <ProductCol key={p.id} product={p} onRemove={() => handleRemove(p.id)} />
                ))}
              </div>

              {/* === Key info === */}
              <div className="compare-grid grid" style={gridStyle}>
                <SectionLabel>Key Information</SectionLabel>
                {Array.from({ length: colCount }).map((_, i) => (
                  <div key={i} style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-raised)" }} />
                ))}

                {keyRows.map((row) => {
                  const same = allSame(row.values);
                  const dim  = highlightDiffs && same;
                  return (
                    <>
                      <LabelCell key={`lbl-${row.label}`} dim={dim}>{row.label}</LabelCell>
                      {row.values.map((v, i) => (
                        <ValueCell key={i} dim={dim} highlight={!same && highlightDiffs}>
                          {row.label === "Availability" ? (
                            <span className={`font-semibold ${v === "In Stock" ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400"}`}>
                              {v === "In Stock" ? "✓ " : "— "}{v}
                            </span>
                          ) : v || <span className="text-(--text-4)">—</span>}
                        </ValueCell>
                      ))}
                    </>
                  );
                })}
              </div>

              {/* === Spec groups === */}
              {groups.map((group) => (
                <div key={group.groupName} className="compare-grid grid" style={gridStyle}>
                  <SectionLabel>{group.groupName}</SectionLabel>
                  {Array.from({ length: colCount }).map((_, i) => (
                    <div key={i} style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-raised)" }} />
                  ))}

                  {group.specNames.map((specName) => {
                    const vals = products.map((p) => getValue(p, specName));
                    const same = allSame(vals);
                    const dim  = highlightDiffs && same;
                    return (
                      <>
                        <LabelCell key={`lbl-${specName}`} dim={dim}>{specName}</LabelCell>
                        {vals.map((v, i) => (
                          <ValueCell key={i} dim={dim} highlight={!same && highlightDiffs}>
                            {v || <span className="text-(--text-4)">—</span>}
                          </ValueCell>
                        ))}
                      </>
                    );
                  })}
                </div>
              ))}

              {/* === Features === */}
              {allFeatures.length > 0 && (
                <div className="compare-grid grid" style={gridStyle}>
                  <SectionLabel>Features</SectionLabel>
                  {Array.from({ length: colCount }).map((_, i) => (
                    <div key={i} style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-raised)" }} />
                  ))}
                  {allFeatures.map((feat) => {
                    const vals = products.map((p) => (p.features ?? []).includes(feat));
                    const same = vals.every((v) => v === vals[0]);
                    const dim  = highlightDiffs && same;
                    return (
                      <>
                        <LabelCell key={`lbl-feat-${feat}`} dim={dim}>{feat}</LabelCell>
                        {vals.map((has, i) => (
                          <ValueCell key={i} dim={dim} highlight={!same && highlightDiffs}>
                            {has
                              ? <span className="text-se-green font-bold">✓</span>
                              : <span className="text-(--text-4)">—</span>}
                          </ValueCell>
                        ))}
                      </>
                    );
                  })}
                </div>
              )}

              {/* === Certifications === */}
              {allCerts.length > 0 && (
                <div className="compare-grid grid" style={gridStyle}>
                  <SectionLabel>Certifications</SectionLabel>
                  {Array.from({ length: colCount }).map((_, i) => (
                    <div key={i} style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-raised)" }} />
                  ))}
                  {allCerts.map((cert) => {
                    const vals = products.map((p) => (p.certifications ?? []).includes(cert));
                    const same = vals.every((v) => v === vals[0]);
                    const dim  = highlightDiffs && same;
                    return (
                      <>
                        <LabelCell key={`lbl-cert-${cert}`} dim={dim}>{cert}</LabelCell>
                        {vals.map((has, i) => (
                          <ValueCell key={i} dim={dim} highlight={!same && highlightDiffs}>
                            {has
                              ? <span className="text-se-green font-bold">✓</span>
                              : <span className="text-(--text-4)">—</span>}
                          </ValueCell>
                        ))}
                      </>
                    );
                  })}
                </div>
              )}

              <div className="h-8" />
            </>
          )}

          {/* Scroll hint — gradient fade on right edge when content overflows */}
          <ScrollHint visible={canScrollRight} />
        </div>

        {/* ── Mobile scroll hint label ── */}
        {canScrollRight && (
          <div
            className="md:hidden shrink-0 flex items-center justify-center gap-1.5 py-2 text-[10px] font-medium text-(--text-4) border-t"
            style={{ borderColor: "var(--border)" }}
          >
            <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" aria-hidden>
              <path d="M14.25 19.5l-7.5-7.5 7.5-7.5M19.5 12H4.5" />
            </svg>
            Swipe to compare
            <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" aria-hidden>
              <path d="M9.75 4.5l7.5 7.5-7.5 7.5M4.5 12h15" />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Portal wrapper ──────────────────────────────────────────────────────── */
export default function CompareModal() {
  const { isModalOpen } = useCompare();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted || !isModalOpen) return null;

  return createPortal(<ModalContent />, document.body);
}
