"use client";

import { useRouter, useSearchParams } from "next/navigation";

interface Props {
  basePath?: string;
}

export default function ActiveFilters({ basePath = "/search" }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const brands = searchParams.get("brands")?.split(",").filter(Boolean) ?? [];
  const cats = searchParams.get("cats")?.split(",").filter(Boolean) ?? [];
  const specs = searchParams.get("specs")?.split(",").filter(Boolean) ?? [];
  const instock = searchParams.get("instock") === "1";
  const clearance = searchParams.get("clearance") === "1";

  const hasFilters = brands.length > 0 || cats.length > 0 || specs.length > 0 || instock || clearance;
  if (!hasFilters) return null;

  function removeMulti(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");
    const existing = params.get(key)?.split(",").filter(Boolean) ?? [];
    const updated = existing.filter((v) => v !== value);
    if (updated.length > 0) {
      params.set(key, updated.join(","));
    } else {
      params.delete(key);
    }
    router.push(`${basePath}?${params.toString()}`, { scroll: false });
  }

  function removeKey(key: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(key);
    params.delete("page");
    router.push(`${basePath}?${params.toString()}`, { scroll: false });
  }

  function clearAll() {
    const params = new URLSearchParams();
    const q = searchParams.get("q");
    if (q) params.set("q", q);
    router.push(`${basePath}?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4 border-b" style={{ borderColor: "var(--border)" }}>
      <span className="text-[11px] font-semibold uppercase tracking-wide shrink-0" style={{ color: "var(--text-4)" }}>
        Filters:
      </span>

      {cats.map((cat) => (
        <Chip key={cat} label={cat} onRemove={() => removeMulti("cats", cat)} />
      ))}
      {brands.map((brand) => (
        <Chip
          key={brand}
          label={brand.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
          onRemove={() => removeMulti("brands", brand)}
        />
      ))}
      {specs.map((spec) => {
        const value = spec.includes("::") ? spec.split("::")[ 1 ] : spec;
        return <Chip key={spec} label={value} onRemove={() => removeMulti("specs", spec)} />;
      })}
      {instock && <Chip label="In Stock" onRemove={() => removeKey("instock")} />}
      {clearance && <Chip label="Clearance" onRemove={() => removeKey("clearance")} />}

      <button
        onClick={clearAll}
        className="text-[11px] font-semibold underline underline-offset-2 ml-1 hover:no-underline transition-colors"
        style={{ color: "var(--text-4)" }}
      >
        Clear all
      </button>
    </div>
  );
}

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <button
      onClick={onRemove}
      className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[12px] font-medium transition-opacity hover:opacity-70"
      style={{ background: "var(--bg-raised)", color: "var(--text-2)", border: "1px solid var(--border)" }}
    >
      <span className="max-w-[160px] truncate">{label}</span>
      <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  );
}
