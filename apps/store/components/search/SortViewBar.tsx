"use client";

import { useRouter, useSearchParams } from "next/navigation";

interface Props {
  total: number;
  query?: string;
  basePath?: string;
}

const SORT_OPTIONS = [
  { value: "relevance",  label: "Relevance" },
  { value: "price_asc",  label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "name_asc",   label: "Name: A–Z" },
];

const PER_OPTIONS = [12, 24, 48];

export default function SortViewBar({ total, query, basePath = "/search" }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentSort = searchParams.get("sort") ?? "relevance";
  const currentPer  = searchParams.get("per")  ?? "24";

  function push(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value);
    params.delete("page");
    router.push(`${basePath}?${params.toString()}`);
  }

  return (
    <div className="flex items-center gap-2 flex-1 min-w-0">

      {/* Result count — visible on sm+, hidden on mobile (shown in filter button area) */}
      <p className="hidden sm:block text-sm shrink-0" style={{ color: "var(--text-3)" }}>
        <span className="font-semibold" style={{ color: "var(--text-1)" }}>
          {total.toLocaleString()}
        </span>
        {query
          ? <> for <span className="font-medium">&ldquo;{query}&rdquo;</span></>
          : " products"
        }
      </p>

      {/* Spacer */}
      <div className="hidden sm:block flex-1" />

      {/* Per page — only on sm+, too cramped on mobile */}
      <div className="hidden sm:flex items-center gap-1.5 shrink-0">
        <span className="text-[11px] font-medium" style={{ color: "var(--text-4)" }}>Show</span>
        <div
          className="flex rounded-lg overflow-hidden border"
          style={{ borderColor: "var(--border)" }}
        >
          {PER_OPTIONS.map((n) => (
            <button
              key={n}
              onClick={() => push("per", String(n))}
              className="px-2.5 py-1.5 text-[12px] font-medium transition-colors"
              style={{
                background: currentPer === String(n) ? "var(--bg-raised)" : "var(--bg-surface)",
                color:      currentPer === String(n) ? "var(--text-1)"   : "var(--text-3)",
              }}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Sort — always shown, flex-1 on mobile so it uses available width */}
      <select
        value={currentSort}
        onChange={(e) => push("sort", e.target.value)}
        className="flex-1 sm:flex-none h-10 sm:h-9 px-2.5 rounded-xl text-[13px] sm:text-[12px] font-medium border focus:outline-none focus:ring-2 focus:ring-navy-500/30 min-w-0"
        style={{
          background:  "var(--bg-surface)",
          borderColor: "var(--border)",
          color:       "var(--text-2)",
        }}
        aria-label="Sort products"
      >
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}
