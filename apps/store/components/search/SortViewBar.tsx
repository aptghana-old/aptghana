"use client";

import { useRouter, useSearchParams } from "next/navigation";

interface Props {
  total: number;
  query?: string;
  basePath?: string;
}

const SORT_OPTIONS = [
  { value: "relevance", label: "Relevance" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "name_asc", label: "Name: A–Z" },
];

const PER_OPTIONS = [12, 24, 48];

export default function SortViewBar({ total, query, basePath = "/search" }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentSort = searchParams.get("sort") ?? "relevance";
  const currentView = searchParams.get("view") ?? "grid";
  const currentPer = searchParams.get("per") ?? "24";

  function push(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value);
    params.delete("page");
    router.push(`${basePath}?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-3 mb-5">
      {/* Result count */}
      <p className="text-sm flex-1 min-w-0" style={{ color: "var(--text-3)" }}>
        <span className="font-semibold" style={{ color: "var(--text-1)" }}>{total.toLocaleString()}</span> products
        {query ? <> for <span className="font-medium">&ldquo;{query}&rdquo;</span></> : ""}
      </p>

      {/* Per page */}
      <div className="flex items-center gap-1.5">
        <span className="text-[11px] font-medium" style={{ color: "var(--text-4)" }}>Show</span>
        <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: "var(--border)" }}>
          {PER_OPTIONS.map((n) => (
            <button
              key={n}
              onClick={() => push("per", String(n))}
              className="px-2.5 py-1 text-[12px] font-medium transition-colors"
              style={{
                background: currentPer === String(n) ? "var(--bg-raised)" : "var(--bg-surface)",
                color: currentPer === String(n) ? "var(--text-1)" : "var(--text-3)",
              }}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Sort */}
      <select
        value={currentSort}
        onChange={(e) => push("sort", e.target.value)}
        className="h-8 px-2.5 rounded-lg text-[12px] font-medium border focus:outline-none"
        style={{
          background: "var(--bg-surface)",
          borderColor: "var(--border)",
          color: "var(--text-2)",
        }}
        aria-label="Sort products"
      >
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>

      {/* View toggle */}
      <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: "var(--border)" }}>
        <button
          onClick={() => push("view", "grid")}
          aria-label="Grid view"
          className="p-1.5 transition-colors"
          style={{
            background: currentView === "grid" ? "var(--bg-raised)" : "var(--bg-surface)",
            color: currentView === "grid" ? "var(--text-1)" : "var(--text-4)",
          }}
        >
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
          </svg>
        </button>
        <button
          onClick={() => push("view", "list")}
          aria-label="List view"
          className="p-1.5 transition-colors"
          style={{
            background: currentView === "list" ? "var(--bg-raised)" : "var(--bg-surface)",
            color: currentView === "list" ? "var(--text-1)" : "var(--text-4)",
          }}
        >
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      </div>
    </div>
  );
}
