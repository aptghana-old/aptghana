"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ListIcon, Grid2X2Icon, SlidersHorizontalIcon } from "lucide-react";

interface Props {
  total: number;
  query?: string;
  basePath?: string;
  /** Desktop sidebar open state — passed when using SearchResultsLayout */
  filtersOpen?: boolean;
  /** Toggle desktop sidebar — passed when using SearchResultsLayout */
  onToggleFilters?: () => void;
}

const SORT_OPTIONS = [
  { value: "relevance", label: "Relevance" },
  { value: "price_asc", label: "Price: Low → High" },
  { value: "price_desc", label: "Price: High → Low" },
  { value: "name_asc", label: "Name: A–Z" },
];

const PER_OPTIONS = [12, 24, 48];

/* ─── Chevron icon (shared by both selects) ───────────────────────────────── */
function ChevronDown({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M19 9l-7 7-7-7" />
    </svg>
  );
}

/* ─── Segmented view-toggle button ───────────────────────────────────────── */
function ViewBtn({
  active, onClick, label, borderLeft, children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  borderLeft?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      disabled={active}
      className={[
        "w-9 h-9 flex items-center justify-center transition-colors",
        borderLeft ? "border-l border-(--border)" : "",
        active
          ? "bg-navy-500 text-white"
          : "bg-(--bg-surface) text-(--text-3) hover:text-(--text-1) hover:bg-(--bg-raised) disabled:cursor-default",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

/* ─── SortViewBar ─────────────────────────────────────────────────────────── */
export default function SortViewBar({
  total, query, basePath = "/search", filtersOpen, onToggleFilters,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentSort = searchParams.get("sort") ?? "relevance";
  const currentView = searchParams.get("view") ?? "grid";
  const currentPer  = searchParams.get("per")  ?? "24";

  function push(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value);
    params.delete("page");
    router.push(`${basePath}?${params.toString()}`);
  }

  const selectCls = [
    "h-9 rounded-lg text-[13px] border pl-3 pr-7 w-full",
    "appearance-none cursor-pointer",
    "bg-(--bg-surface) text-(--text-2) border-(--border)",
    "hover:border-(--border-hi) transition-colors",
    "focus:outline-none focus:ring-2 focus:ring-navy-500/30",
  ].join(" ");

  return (
    <div className="flex items-center gap-2 flex-1 min-w-0">

      {/* Desktop filter toggle — lg+ only, only when caller provides the handler */}
      {onToggleFilters && (
        <button
          onClick={onToggleFilters}
          aria-pressed={filtersOpen}
          aria-label={filtersOpen ? "Hide filters" : "Show filters"}
          className="hidden lg:flex items-center gap-1.5 h-9 px-3 rounded-lg text-[13px] font-semibold border shrink-0 transition-colors hover:border-(--border-hi)"
          style={{
            background:   "var(--bg-surface)",
            borderColor:  "var(--border)",
            color:        filtersOpen ? "var(--text-1)" : "var(--text-3)",
          }}
        >
          <SlidersHorizontalIcon className="w-3.5 h-3.5" />
          {filtersOpen ? "Hide filters" : "Filters"}
        </button>
      )}

      {/* Result count — sm+ only (mobile shows count in the filter button) */}
      <p className="hidden sm:block text-[13px] shrink-0 text-(--text-3)">
        <span className="font-semibold text-(--text-1)">{total.toLocaleString()}</span>
        {query
          ? <> for <span className="font-medium">&ldquo;{query}&rdquo;</span></>
          : " results"
        }
      </p>

      <div className="flex-1" />

      {/* Per-page — sm+ only */}
      <div className="relative hidden sm:block shrink-0">
        <select
          value={currentPer}
          onChange={(e) => push("per", e.target.value)}
          aria-label="Products per page"
          className={selectCls}
          style={{ minWidth: "110px" }}
        >
          {PER_OPTIONS.map((n) => (
            <option key={n} value={String(n)}>{n} per page</option>
          ))}
        </select>
        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-(--text-4) pointer-events-none" />
      </div>

      {/* Sort — fills available width on mobile, fixed width on sm+ */}
      <div className="relative flex-1 sm:flex-none min-w-0" style={{ minWidth: "0", maxWidth: "200px" }}>
        <select
          value={currentSort}
          onChange={(e) => push("sort", e.target.value)}
          aria-label="Sort products"
          className={selectCls}
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-(--text-4) pointer-events-none" />
      </div>

      {/* View toggle — sm+ only (mobile always shows grid layout) */}
      <div className="hidden sm:flex items-center border border-(--border) rounded-lg overflow-hidden shrink-0">
        <ViewBtn
          active={currentView === "grid"}
          onClick={() => push("view", "grid")}
          label="Grid view"
        >
          <Grid2X2Icon className="w-4 h-4" />
        </ViewBtn>
        <ViewBtn
          active={currentView === "list"}
          onClick={() => push("view", "list")}
          label="List view"
          borderLeft
        >
          <ListIcon className="w-4 h-4" />
        </ViewBtn>
      </div>
    </div>
  );
}
