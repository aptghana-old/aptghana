"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, Globe, Star, Tag } from "lucide-react";
import { Badge, statusVariant } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { brandTint, brandInitials } from "@/lib/brandTints";

export interface BrandCard {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  country?: string;
  status: string;
  isFeatured: boolean;
  isPartner: boolean;
  productCount: number;
}

type Filter = "all" | "featured" | "partners" | "inactive";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "featured", label: "Featured" },
  { key: "partners", label: "Partners" },
  { key: "inactive", label: "Inactive" },
];

function matches(brand: BrandCard, filter: Filter): boolean {
  if (filter === "featured") return brand.isFeatured;
  if (filter === "partners") return brand.isPartner;
  if (filter === "inactive") return brand.status !== "active";
  return true;
}

export default function BrandsGrid({ brands }: { brands: BrandCard[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const counts = useMemo(
    () =>
      Object.fromEntries(
        FILTERS.map((f) => [f.key, brands.filter((b) => matches(b, f.key)).length])
      ) as Record<Filter, number>,
    [brands]
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return brands.filter(
      (b) =>
        matches(b, filter) &&
        (!q || b.name.toLowerCase().includes(q) || b.slug.includes(q) || (b.country ?? "").toLowerCase().includes(q))
    );
  }, [brands, query, filter]);

  return (
    <div className="space-y-4">
      {/* Toolbar: search + filter chips */}
      <div className="flex items-center gap-2.5 flex-wrap">
        <div
          className="flex items-center gap-2 h-9 px-3 rounded-lg flex-1 min-w-[180px] max-w-xs"
          style={{ background: "var(--apt-bg)", border: "1px solid var(--apt-border)" }}
        >
          <Search size={14} style={{ color: "var(--apt-text-muted)" }} className="shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search brands…"
            className="w-full bg-transparent outline-none text-[12.5px]"
            style={{ color: "var(--apt-text-primary)" }}
            aria-label="Search brands"
          />
        </div>
        {FILTERS.map((f) => {
          const isActive = filter === f.key;
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className="h-8 px-3.5 rounded-full text-[12px] font-semibold transition-colors whitespace-nowrap"
              style={
                isActive
                  ? { background: "var(--apt-text-primary)", color: "var(--apt-bg)" }
                  : { background: "var(--apt-bg)", border: "1px solid var(--apt-border)", color: "var(--apt-text-secondary)" }
              }
            >
              {f.label} · {counts[f.key]}
            </button>
          );
        })}
      </div>

      {/* Card grid */}
      {visible.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<Tag size={22} />}
            title="No brands match"
            description={query ? `Nothing matches “${query}”. Try a different search.` : "No brands in this filter yet."}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
          {visible.map((b) => {
            const tint = brandTint(b.name);
            return (
              <Link
                key={b.id}
                href={`/dashboard/brands/${b.id}`}
                className="card block p-[18px] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[0_6px_18px_rgba(16,22,30,0.08)]"
              >
                <div className="flex items-start justify-between gap-2.5">
                  <div
                    className="w-[46px] h-[46px] rounded-xl flex items-center justify-center shrink-0 overflow-hidden text-[17px] font-extrabold tracking-tight"
                    style={{ background: tint.bg, color: tint.fg }}
                  >
                    {b.logoUrl ? (
                      <img src={b.logoUrl} alt={b.name} className="w-full h-full object-contain p-1.5" />
                    ) : (
                      brandInitials(b.name)
                    )}
                  </div>
                  {b.isFeatured && <Star size={16} fill="#F5820A" stroke="#F5820A" strokeWidth={1.5} />}
                </div>

                <div className="mt-3.5 text-[15px] font-bold tracking-tight truncate" style={{ color: "var(--apt-text-primary)" }}>
                  {b.name}
                </div>
                <div className="flex items-center gap-1.5 mt-1 text-[12px]" style={{ color: "var(--apt-text-muted)" }}>
                  <Globe size={12} className="shrink-0" />
                  <span className="truncate">{b.country || "—"}</span>
                  {b.isPartner && (
                    <span
                      className="ml-auto text-[10.5px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap"
                      style={{ background: "#EEF0FF", color: "#3D4CD6" }}
                    >
                      Partner
                    </span>
                  )}
                </div>

                <div
                  className="flex items-center justify-between mt-3.5 pt-3.5"
                  style={{ borderTop: "1px solid var(--apt-border)" }}
                >
                  <div>
                    <span className="font-mono text-[15px] font-bold tabular-nums" style={{ color: "var(--apt-text-primary)" }}>
                      {b.productCount.toLocaleString()}
                    </span>
                    <span className="text-[11px] ml-1" style={{ color: "var(--apt-text-muted)" }}>SKUs</span>
                  </div>
                  <Badge variant={statusVariant(b.status)}>{b.status}</Badge>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
