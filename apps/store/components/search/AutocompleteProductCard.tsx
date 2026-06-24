"use client";

import Image from "next/image";
import type { ProductSearchHit } from "@apt/search";

/* ─── Text highlight ──────────────────────────────────────────────────────────── */

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function highlightText(text: string, query: string): React.ReactNode {
  if (!query.trim() || !text) return text;
  const re = new RegExp(`(${escapeRegex(query.trim())})`, "gi");
  const parts = text.split(re);
  return parts.map((part, i) =>
    re.test(part) ? (
      <mark
        key={i}
        className="bg-yellow-100 dark:bg-yellow-900/40 text-yellow-900 dark:text-yellow-200 rounded-[2px] px-[1px] not-italic font-semibold"
      >
        {part}
      </mark>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

/* ─── Catalogue breadcrumb path ──────────────────────────────────────────────── */

function CataloguePath({ cats }: { cats: Record<string, string> | undefined }) {
  if (!cats) return null;
  const path = [cats.lvl0, cats.lvl1, cats.lvl2, cats.lvl3].filter(Boolean);
  if (!path.length) return null;
  return (
    <p className="text-[10px] leading-snug mt-0.5 truncate" style={{ color: "var(--text-4)" }}>
      {path.join(" › ")}
    </p>
  );
}

/* ─── Status badge ────────────────────────────────────────────────────────────── */

type BadgeVariant = "blue" | "navy" | "orange";

function Badge({ label, variant }: { label: string; variant: BadgeVariant }) {
  const cls: Record<BadgeVariant, string> = {
    blue:   "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    navy:   "bg-navy-50 text-navy-700 dark:bg-navy-900/40 dark:text-navy-300",
    orange: "bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  };
  return (
    <span
      className={`inline-flex items-center h-4 px-1.5 rounded-full text-[9px] font-bold uppercase tracking-wide shrink-0 ${cls[variant]}`}
    >
      {label}
    </span>
  );
}

/* ─── Fallback box icon ───────────────────────────────────────────────────────── */

function BoxIcon() {
  return (
    <svg
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      style={{ color: "var(--text-4)" }}
    >
      <path d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
    </svg>
  );
}

/* ─── Main component ─────────────────────────────────────────────────────────── */

export interface AutocompleteProductCardProps {
  hit:      ProductSearchHit;
  query:    string;
  onSelect: () => void;
  isActive: boolean;
  id?:      string;
}

export function AutocompleteProductCard({
  hit,
  query,
  onSelect,
  isActive,
  id,
}: AutocompleteProductCardProps) {
  const href = `/products/${hit.sku.toLowerCase()}`;
  const hasBadges = hit.isNew || hit.isFeatured || hit.isClearance;
  const showMpn = hit.mpn && hit.mpn !== hit.sku;

  return (
    <a
      href={href}
      id={id}
      role="option"
      aria-selected={isActive}
      onClick={(e) => {
        e.preventDefault();
        onSelect();
        window.location.href = href;
      }}
      className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors ${
        isActive ? "" : "hover:bg-[var(--bg-raised)]"
      }`}
      style={isActive ? { background: "var(--bg-raised)" } : undefined}
    >
      {/* Product image — fixed dimensions prevent CLS */}
      <div
        className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-lg shrink-0 overflow-hidden flex items-center justify-center"
        style={{ background: "var(--bg-raised)" }}
      >
        {hit.imageUrl ? (
          <Image
            src={hit.imageUrl}
            alt={hit.name}
            width={56}
            height={56}
            className="object-contain w-full h-full p-1"
            loading="lazy"
            sizes="(max-width: 640px) 40px, (max-width: 1024px) 48px, 56px"
          />
        ) : (
          <BoxIcon />
        )}
      </div>

      {/* Product information */}
      <div className="flex-1 min-w-0">
        {/* Product name with highlight */}
        <p
          className="text-sm font-semibold leading-snug line-clamp-2"
          style={{ color: "var(--text-1)" }}
        >
          {highlightText(hit.name, query)}
        </p>

        {/* Brand · SKU · MPN */}
        <div className="flex items-center flex-wrap gap-x-2 gap-y-0 mt-0.5 min-w-0">
          {hit.brandName && (
            <span
              className="text-[11px] font-medium shrink-0"
              style={{ color: "var(--text-3)" }}
            >
              {hit.brandName}
            </span>
          )}
          {hit.sku && (
            <span className="text-[11px] shrink-0" style={{ color: "var(--text-4)" }}>
              SKU:&nbsp;{highlightText(hit.sku, query)}
            </span>
          )}
          {showMpn && (
            <span
              className="text-[11px] shrink-0 hidden sm:inline"
              style={{ color: "var(--text-4)" }}
            >
              MPN:&nbsp;{highlightText(hit.mpn, query)}
            </span>
          )}
        </div>

        {/* Catalogue path */}
        <CataloguePath cats={hit.hierarchicalCategories as Record<string, string>} />

        {/* Short description — hidden on mobile to save vertical space */}
        {hit.shortDescription && (
          <p
            className="text-[11px] leading-relaxed line-clamp-1 mt-0.5 hidden sm:block"
            style={{ color: "var(--text-4)" }}
          >
            {hit.shortDescription}
          </p>
        )}

        {/* Status badges */}
        {hasBadges && (
          <div className="flex items-center gap-1 mt-1">
            {hit.isNew      && <Badge label="New"       variant="blue"   />}
            {hit.isFeatured && <Badge label="Featured"  variant="navy"   />}
            {hit.isClearance && <Badge label="Clearance" variant="orange" />}
          </div>
        )}
      </div>

      {/* Chevron */}
      <svg
        width={12}
        height={12}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
        className="shrink-0 mt-1"
        style={{ color: "var(--text-4)" }}
      >
        <path d="M8.25 4.5l7.5 7.5-7.5 7.5" />
      </svg>
    </a>
  );
}
