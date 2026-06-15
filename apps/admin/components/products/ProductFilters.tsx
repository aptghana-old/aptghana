"use client";

import { useRouter, usePathname } from "next/navigation";
import { useTransition, useCallback } from "react";
import { Search, X } from "lucide-react";

const STATUS_OPTIONS = [
  { value: "", label: "All status" },
  { value: "active", label: "Active" },
  { value: "draft", label: "Draft" },
  { value: "inactive", label: "Inactive" },
  { value: "archived", label: "Archived" },
];

interface Props {
  brands: { value: string; label: string }[];
  categories: { value: string; label: string }[];
  current: { q?: string; brand?: string; category?: string; status?: string };
}

export default function ProductFilters({ brands, categories, current }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();

  const push = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams();
      const merged = { ...current, ...updates };
      Object.entries(merged).forEach(([k, v]) => { if (v) params.set(k, v); });
      params.delete("page");
      startTransition(() => router.push(`${pathname}?${params.toString()}`));
    },
    [current, pathname, router]
  );

  const hasFilters = !!(current.q || current.brand || current.category || current.status);

  return (
    <div
      className="flex items-center gap-3 px-6 py-3 flex-wrap"
      style={{ borderBottom: "1px solid var(--apt-border)", background: "var(--apt-bg)" }}
    >
      {/* Search */}
      <div className="relative flex-1 min-w-48 max-w-xs">
        <Search
          size={13}
          className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: "var(--apt-text-muted)" }}
        />
        <input
          defaultValue={current.q ?? ""}
          placeholder="Search name, SKU, MPN…"
          onChange={(e) => push({ q: e.target.value })}
          className="w-full h-8 pl-8 pr-3 rounded-md text-[13px] border transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--apt-border-focus)]"
          style={{
            background: "var(--apt-bg-subtle)",
            border: "1px solid var(--apt-border)",
            color: "var(--apt-text-primary)",
          }}
        />
      </div>

      {/* Status */}
      <select
        value={current.status ?? ""}
        onChange={(e) => push({ status: e.target.value })}
        className="h-8 px-3 pr-7 rounded-md text-[13px] border appearance-none focus:outline-none focus:ring-2 focus:ring-[var(--apt-border-focus)]"
        style={{
          background: "var(--apt-bg-subtle)",
          border: "1px solid var(--apt-border)",
          color: current.status ? "var(--apt-text-primary)" : "var(--apt-text-muted)",
        }}
      >
        {STATUS_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>

      {/* Brand */}
      <select
        value={current.brand ?? ""}
        onChange={(e) => push({ brand: e.target.value })}
        className="h-8 px-3 pr-7 rounded-md text-[13px] border appearance-none focus:outline-none focus:ring-2 focus:ring-[var(--apt-border-focus)]"
        style={{
          background: "var(--apt-bg-subtle)",
          border: "1px solid var(--apt-border)",
          color: current.brand ? "var(--apt-text-primary)" : "var(--apt-text-muted)",
        }}
      >
        <option value="">All brands</option>
        {brands.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
      </select>

      {/* Category */}
      <select
        value={current.category ?? ""}
        onChange={(e) => push({ category: e.target.value })}
        className="h-8 px-3 pr-7 rounded-md text-[13px] border appearance-none focus:outline-none focus:ring-2 focus:ring-[var(--apt-border-focus)]"
        style={{
          background: "var(--apt-bg-subtle)",
          border: "1px solid var(--apt-border)",
          color: current.category ? "var(--apt-text-primary)" : "var(--apt-text-muted)",
        }}
      >
        <option value="">All categories</option>
        {categories.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
      </select>

      {/* Clear */}
      {hasFilters && (
        <button
          onClick={() => router.push(pathname)}
          className="flex items-center gap-1.5 h-8 px-3 rounded-md text-[12px] font-medium transition-colors hover:bg-[var(--apt-error-50)]"
          style={{ color: "var(--apt-text-muted)", border: "1px solid var(--apt-border)" }}
        >
          <X size={12} />
          Clear
        </button>
      )}
    </div>
  );
}
