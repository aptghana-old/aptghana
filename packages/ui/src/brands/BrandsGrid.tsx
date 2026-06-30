"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { BrandListItem } from "./types";

const ACCENT = "#84CC16";
const DARK_BG = "#0A0F1E";

function getBrandMark(name: string): string {
  const words = name.split(/[\s\-+&]/);
  if (words.length === 1) return name.slice(0, 4).toUpperCase();
  return words
    .filter((w) => w.length > 0)
    .map((w) => w[0].toUpperCase())
    .join("")
    .slice(0, 4);
}

interface Props {
  brands: BrandListItem[];
  brandHref: (slug: string) => string;
  rfqHref: string;
  contactHref: string;
  containerClass: string;
}

const chipBase: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  height: 36,
  padding: "0 14px",
  borderRadius: 9,
  fontSize: 13,
  fontWeight: 600,
  border: "none",
  cursor: "pointer",
  background: "transparent",
  color: "var(--text-3)",
};

export default function BrandsGrid({ brands, brandHref, rfqHref, contactHref, containerClass }: Props) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "partners">("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return brands.filter((b) => {
      if (filter === "partners" && !b.isPartner && !b.isFeatured) return false;
      if (!q) return true;
      return (
        b.name.toLowerCase().includes(q) ||
        (b.country ?? "").toLowerCase().includes(q) ||
        (b.specialty ?? "").toLowerCase().includes(q)
      );
    });
  }, [brands, query, filter]);

  return (
    <section id="portfolio" style={{ background: "var(--bg-surface)", padding: "clamp(56px,8vw,100px) 0" }}>
      <div className={containerClass}>
        {/* Section header + controls */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: 24,
            marginBottom: 36,
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <span
                style={{ width: 28, height: 2, borderRadius: 2, background: ACCENT, display: "block", flexShrink: 0 }}
              />
              <span
                style={{
                  fontSize: 11.5,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.22em",
                  color: ACCENT,
                }}
              >
                Full Brand Portfolio
              </span>
            </div>
            <h2
              style={{
                fontFamily: "var(--font-sora, 'Sora', sans-serif)",
                fontWeight: 800,
                fontSize: "clamp(28px,3.6vw,46px)",
                lineHeight: 1.04,
                letterSpacing: "-0.03em",
                margin: 0,
                color: "var(--text-1)",
              }}
            >
              All {brands.length} brands<span style={{ color: ACCENT }}>.</span>
            </h2>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
            {/* Search */}
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                height: 46,
                padding: "0 16px",
                border: "1px solid var(--border)",
                borderRadius: 13,
                background: "var(--bg-raised)",
                minWidth: 220,
                cursor: "text",
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                style={{ color: "var(--text-4)", flexShrink: 0 }}
                aria-hidden
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="search"
                placeholder="Search brands…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                style={{
                  border: "none",
                  outline: "none",
                  background: "transparent",
                  fontFamily: "inherit",
                  fontSize: 14,
                  color: "var(--text-1)",
                  width: "100%",
                  minWidth: 0,
                }}
              />
            </label>

            {/* Filter chips */}
            <div
              style={{
                display: "flex",
                gap: 4,
                padding: 4,
                border: "1px solid var(--border)",
                borderRadius: 13,
                background: "var(--bg-raised)",
              }}
            >
              <button
                onClick={() => setFilter("all")}
                style={
                  filter === "all"
                    ? { ...chipBase, background: ACCENT, color: DARK_BG }
                    : chipBase
                }
              >
                All
              </button>
              <button
                onClick={() => setFilter("partners")}
                style={
                  filter === "partners"
                    ? { ...chipBase, background: ACCENT, color: DARK_BG }
                    : chipBase
                }
              >
                Partners
              </button>
            </div>
          </div>
        </div>

        {/* Brand grid */}
        {filtered.length > 0 ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 272px), 1fr))",
              gap: 16,
            }}
          >
            {filtered.map((brand) => (
              <Link
                key={brand.slug}
                href={brandHref(brand.slug)}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  border: "1px solid var(--border)",
                  borderRadius: 18,
                  background: "var(--bg-surface)",
                  padding: 22,
                  textDecoration: "none",
                  overflow: "hidden",
                }}
              >
                {/* Top row: mark + arrow */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    marginBottom: 16,
                  }}
                >
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 50,
                      height: 50,
                      borderRadius: 13,
                      background: "var(--bg-raised)",
                      border: "1px solid var(--border)",
                      fontFamily: "var(--font-sora, 'Sora', sans-serif)",
                      fontWeight: 800,
                      fontSize: 13,
                      color: "var(--text-1)",
                      letterSpacing: "-0.02em",
                      flexShrink: 0,
                    }}
                  >
                    {getBrandMark(brand.name)}
                  </span>
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    style={{ color: "var(--text-4)", marginTop: 4, flexShrink: 0 }}
                    aria-hidden
                  >
                    <path
                      d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>

                {/* Name + partner badge */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    flexWrap: "wrap",
                    marginBottom: 4,
                  }}
                >
                  <h3
                    style={{
                      fontFamily: "var(--font-sora, 'Sora', sans-serif)",
                      fontWeight: 700,
                      fontSize: 16,
                      letterSpacing: "-0.01em",
                      color: "var(--text-1)",
                      margin: 0,
                    }}
                  >
                    {brand.name}
                  </h3>
                  {(brand.isPartner || brand.isFeatured) && (
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                        padding: "3px 7px",
                        borderRadius: 999,
                        background: "rgba(132,204,22,0.13)",
                        color: ACCENT,
                        border: "1px solid rgba(132,204,22,0.3)",
                      }}
                    >
                      Partner
                    </span>
                  )}
                </div>

                {brand.country && (
                  <span
                    style={{
                      fontSize: 12.5,
                      color: "var(--text-4)",
                      marginBottom: brand.specialty ? 10 : 0,
                      display: "block",
                    }}
                  >
                    {brand.country}
                  </span>
                )}

                {brand.specialty && (
                  <p
                    style={{
                      fontSize: 13,
                      lineHeight: 1.55,
                      color: "var(--text-3)",
                      margin: 0,
                      flex: 1,
                    }}
                  >
                    {brand.specialty}
                  </p>
                )}

                {brand.productCount !== undefined && brand.productCount > 0 && (
                  <div
                    style={{
                      marginTop: 16,
                      paddingTop: 14,
                      borderTop: "1px solid var(--border)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: ACCENT }}>
                      {brand.productCount.toLocaleString()} products
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: "var(--text-4)",
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                      }}
                    >
                      Explore →
                    </span>
                  </div>
                )}
              </Link>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "64px 20px" }}>
            <p style={{ fontSize: 15, color: "var(--text-4)" }}>
              No brands match &ldquo;{query}&rdquo;.
            </p>
          </div>
        )}

        {/* Bottom CTA */}
        <div
          style={{
            position: "relative",
            marginTop: 56,
            borderRadius: 28,
            overflow: "hidden",
            background: DARK_BG,
            padding: "clamp(44px,6vw,72px) clamp(28px,5vw,56px)",
            textAlign: "center",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: -80,
              left: "50%",
              transform: "translateX(-50%)",
              width: 560,
              height: 320,
              background: "radial-gradient(circle, rgba(132,204,22,0.16) 0%, transparent 65%)",
              pointerEvents: "none",
            }}
            aria-hidden
          />
          <div style={{ position: "relative" }}>
            <h2
              style={{
                fontFamily: "var(--font-sora, 'Sora', sans-serif)",
                fontWeight: 800,
                fontSize: "clamp(22px,3vw,36px)",
                lineHeight: 1.12,
                letterSpacing: "-0.025em",
                color: "#fff",
                margin: "0 0 12px",
              }}
            >
              Can&apos;t find the brand you&apos;re looking for?
            </h2>
            <p
              style={{
                fontSize: 15,
                lineHeight: 1.65,
                color: "rgba(255,255,255,0.55)",
                maxWidth: 480,
                margin: "0 auto 28px",
              }}
            >
              We can source products from additional manufacturers. Contact our procurement team for
              specialist requirements.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 12 }}>
              <Link
                href={rfqHref}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 9,
                  height: 50,
                  padding: "0 28px",
                  borderRadius: 13,
                  background: ACCENT,
                  color: DARK_BG,
                  fontWeight: 700,
                  fontSize: 14.5,
                  textDecoration: "none",
                }}
              >
                Submit an RFQ
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  aria-hidden
                >
                  <path d="M5 12h14m-7-7 7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
              <Link
                href={contactHref}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  height: 50,
                  padding: "0 28px",
                  borderRadius: 13,
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.18)",
                  color: "rgba(255,255,255,0.88)",
                  fontWeight: 600,
                  fontSize: 14.5,
                  textDecoration: "none",
                }}
              >
                Contact sales
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
