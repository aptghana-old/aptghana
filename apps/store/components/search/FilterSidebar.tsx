"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, IconLabel } from "@apt/ui";
import {
  X as CloseIcon,
  PlusIcon as AddIcon,
  FilterIcon,
  MinusIcon as RemoveIcon,
} from "lucide-react";

interface FilterSidebarProps {
  facets?: Record<string, Record<string, number>>;
  basePath?: string;
}

export function useFilterURL(basePath = "/search") {
  const router = useRouter();
  const searchParams = useSearchParams();

  function applyFilter(key: string, value: string, exclusive = false) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");

    if (exclusive) {
      const current = params.get(key);
      if (current === value) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    } else {
      const existing = params.get(key)?.split(",").filter(Boolean) ?? [];
      const idx = existing.indexOf(value);
      if (idx >= 0) {
        existing.splice(idx, 1);
      } else {
        existing.push(value);
      }
      if (existing.length > 0) {
        params.set(key, existing.join(","));
      } else {
        params.delete(key);
      }
    }

    router.push(`${basePath}?${params.toString()}`, { scroll: false });
  }

  function clearFilter(key: string) {
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

  function isActive(key: string, value: string): boolean {
    return (searchParams.get(key)?.split(",").filter(Boolean) ?? []).includes(value);
  }

  return { applyFilter, clearFilter, clearAll, isActive, searchParams };
}

/* ─── Chevron ──────────────────────────────────────────────────────────────── */
function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width={14} height={14} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"
      className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
      aria-hidden
    >
      <path d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
  );
}

/* ─── Section wrapper ──────────────────────────────────────────────────────── */
function FilterSection({
  title, children, defaultOpen = true,
}: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [ open, setOpen ] = useState(defaultOpen);
  return (
    <div className="border-b last:border-b-0" style={{ borderColor: "var(--border)" }}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full border-l-4 border-l-gray-600 px-1.5 flex items-center text-left justify-between pb-1 min-h-[44px] sm:min-h-[36px] group"
        aria-expanded={open}
      >
        <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "var(--text-4)" }}>
          {title}
        </span>
        <span style={{ color: "var(--text-4)" }}>
          {open ? (
            <RemoveIcon className="w-6 h-6" />
          ) : (
            <AddIcon className="w-6 h-6" />
          )}
        </span>
      </button>
      {open && <div className="px-1.5">{children}</div>}
    </div>
  );
}

/* ─── Checkbox row ──────────────────────────────────────────────────────────── */
function CheckRow({
  checked, onChange, label, count,
}: { checked: boolean; onChange: () => void; label: string; count?: number }) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer group">
      <span
        className={`w-4 h-4 rounded flex items-center justify-center shrink-0 transition-colors border ${checked ? "bg-[#3DCD58] border-[#3DCD58]" : "border-current"
          }`}
        style={{ color: checked ? undefined : "var(--border-hi)" }}
      >
        {checked && (
          <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        )}
        <input type="checkbox" checked={checked} onChange={onChange} className="sr-only" />
      </span>
      <span className="text-[13px] flex-1 leading-snug" style={{ color: "var(--text-2)" }}>{label}</span>
      {count !== undefined && (
        <span className="text-[11px] font-medium tabular-nums px-1.5 py-0.5 rounded-full shrink-0"
          style={{ background: "var(--bg-raised)", color: "var(--text-4)" }}>
          {count.toLocaleString()}
        </span>
      )}
    </label>
  );
}

/* ─── Main component ────────────────────────────────────────────────────────── */
export default function FilterSidebar({ facets, basePath = "/search" }: FilterSidebarProps) {
  const { applyFilter, isActive } = useFilterURL(basePath);

  /* Availability */
  const inStockCount = facets?.[ "inStock" ]?.[ "true" ] ?? 0;
  const clearanceCount = facets?.[ "isClearance" ]?.[ "true" ] ?? 0;

  /* Hierarchical categories — collect each level that has > 1 distinct value */
  type HierLevel = { key: string; label: string; entries: [ string, number ][] };
  const hierLevels: HierLevel[] = [];
  const levelLabels: Record<string, string> = {
    "hierarchicalCategories.lvl0": "Product Group",
    "hierarchicalCategories.lvl1": "Category",
    "hierarchicalCategories.lvl2": "Subcategory",
    "hierarchicalCategories.lvl3": "Range",
  };
  for (const [ key, label ] of Object.entries(levelLabels)) {
    const raw = facets?.[ key ] ?? {};
    const entries = Object.entries(raw).sort(([ , a ], [ , b ]) => b - a);
    // Skip levels with only 1 value (already locked/filtered) unless it's currently active
    const hasActiveFilter = entries.some(([ v ]) => isActive("cats", v));
    if (entries.length > 1 || hasActiveFilter) {
      hierLevels.push({ key, label, entries: entries.slice(0, 15) });
    }
  }

  /* Brands */
  const brandEntries = Object.entries(facets?.[ "brandSlug" ] ?? {})
    .sort(([ , a ], [ , b ]) => b - a)
    .slice(0, 20);

  /* Spec values — group by name, pick top groups by total count */
  type SpecGroup = { name: string; values: [ string, number ][] };
  const specMap = new Map<string, [ string, number ][]>();
  for (const [ raw, count ] of Object.entries(facets?.[ "specValues" ] ?? {})) {
    const sep = raw.indexOf("::");
    if (sep < 1) continue;
    const name = raw.slice(0, sep);
    const value = raw.slice(sep + 2);
    if (!specMap.has(name)) specMap.set(name, []);
    specMap.get(name)!.push([ value, count ]);
  }
  const specGroups: SpecGroup[] = Array.from(specMap.entries())
    .map(([ name, values ]) => ({
      name,
      values: values.sort(([ , a ], [ , b ]) => b - a).slice(0, 8),
    }))
    .sort((a, b) => {
      const sumA = a.values.reduce((s, [ , c ]) => s + c, 0);
      const sumB = b.values.reduce((s, [ , c ]) => s + c, 0);
      return sumB - sumA;
    })
    .slice(0, 10);

  const hasAnyFilter = inStockCount > 0 || clearanceCount > 0 || hierLevels.length > 0 || brandEntries.length > 0 || specGroups.length > 0;

  if (!hasAnyFilter) {
    return (
      <p className="text-[12px] py-4 text-center" style={{ color: "var(--text-4)" }}>
        No filters available
      </p>
    );
  }

  return (
    <div>
      <div className="grow shadow-xs border border-gray-300 p-2.5 flex items-center justify-between">
        <IconLabel
          icon={FilterIcon}
          label="Filters"
          labelPosition="right"
          classNameLabel="text-[16px]"
          className="gap-1 heading-5"
          classNameIcon="w-5 h-5"
        />

        <Button
          className="text-neutral-darkest"
          onClick={() => { }}
        >
          <IconLabel
            icon={true ? RemoveIcon : AddIcon}
            label={`${true ? "Collapse" : "Expand"
              } all`}
            labelPosition="left"
            classNameLabel="text-[16px]"
          />
        </Button>
      </div>
      {/* Availability */}
      {(inStockCount > 0 || clearanceCount > 0) && (
        <FilterSection title="Availability">
          <div className="space-y-0.5">
            {inStockCount > 0 && (
              <CheckRow
                checked={isActive("instock", "1")}
                onChange={() => applyFilter("instock", "1", true)}
                label="In Stock"
                count={inStockCount}
              />
            )}
            {clearanceCount > 0 && (
              <CheckRow
                checked={isActive("clearance", "1")}
                onChange={() => applyFilter("clearance", "1", true)}
                label="Clearance"
                count={clearanceCount}
              />
            )}
          </div>
        </FilterSection>
      )}

      {/* Hierarchical categories */}
      {hierLevels.map(({ key, label, entries }) => (
        <FilterSection key={key} title={label}>
          <div className="space-y-0.5">
            {entries.map(([ name, count ]) => (
              <CheckRow
                key={name}
                checked={isActive("cats", name)}
                onChange={() => applyFilter("cats", name)}
                label={name}
                count={count}
              />
            ))}
          </div>
        </FilterSection>
      ))}

      {/* Brands */}
      {brandEntries.length > 0 && (
        <FilterSection title="Brand">
          <div className="space-y-0.5">
            {brandEntries.map(([ brand, count ]) => (
              <CheckRow
                key={brand}
                checked={isActive("brands", brand)}
                onChange={() => applyFilter("brands", brand)}
                label={brand.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
                count={count}
              />
            ))}
          </div>
        </FilterSection>
      )}

      {/* Specifications */}
      {specGroups.map(({ name, values }) => (
        <FilterSection key={name} title={name} defaultOpen={false}>
          <div className="space-y-0.5">
            {values.map(([ value, count ]) => (
              <CheckRow
                key={value}
                checked={isActive("specs", `${name}::${value}`)}
                onChange={() => applyFilter("specs", `${name}::${value}`)}
                label={value}
                count={count}
              />
            ))}
          </div>
        </FilterSection>
      ))}
    </div>
  );
}
