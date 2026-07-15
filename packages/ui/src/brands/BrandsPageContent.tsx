import Link from "next/link";
import type { BrandListItem, BrandsPageConfig } from "./types";
import BrandsGrid from "./BrandsGrid";

interface Props {
  brands: BrandListItem[];
  config: BrandsPageConfig;
}

const ACCENT = "#84CC16";
const DARK_BG = "#0A0F1E";

const HERO_STATS = [
  { display: "26+", label: "Brand partners" },
  { display: "17", label: "Years in West Africa" },
  { display: "8,000+", label: "Products available" },
];

const SCHNEIDER_AWARDS = [
  { year: "2009", label: "Appointed authorised Schneider Electric distributor" },
  { year: "2021", label: "Named Schneider Electric Partner of the Year" },
  { year: "2024", label: "Awarded Schneider Marketing Excellence" },
];

const SCHNEIDER_STATS = [
  { value: "17", label: "Years partner" },
  { value: "2021", label: "Partner of Year" },
  { value: "2024", label: "Mktg Excellence" },
  { value: "1,240", label: "SE products" },
];

const PILLARS = [
  {
    num: "01",
    icon: "✓",
    title: "100% Genuine",
    description:
      "Every product is sourced directly from the manufacturer or their authorised regional distributor. No grey-market imports, no counterfeits.",
  },
  {
    num: "02",
    icon: "★",
    title: "Manufacturer Supported",
    description:
      "As an authorised partner, clients benefit from full OEM warranties, manufacturer technical support, and certified replacement parts.",
  },
  {
    num: "03",
    icon: "→",
    title: "Locally Available",
    description:
      "We hold significant stock in our Accra warehouse for fast delivery across Ghana, and leverage OEM networks for expedited supply.",
  },
];

function getBrandMark(name: string): string {
  const words = name.split(/[\s\-+&]/);
  if (words.length === 1) return name.slice(0, 4).toUpperCase();
  return words
    .filter((w) => w.length > 0)
    .map((w) => w[ 0 ].toUpperCase())
    .join("")
    .slice(0, 4);
}

export default function BrandsPageContent({ brands, config }: Props) {
  const { containerClass, brandHref, rfqHref, contactHref } = config;
  const marqueeItems = [ ...brands, ...brands ];

  return (
    <main>
      {/* Marquee keyframe — inline style is valid in Next.js App Router */}
      <style>{`@keyframes brandsMarquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}`}</style>

      {/* ── 1. HERO ── */}
      <section style={{ background: "bg-[#0a1628]", position: "relative", overflow: "hidden" }}>
        {/* Subtle lime radial on the right */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            background:
              "radial-gradient(120% 90% at 90% -10%, rgba(132,204,22,0.09) 0%, transparent 52%)",
          }}
          aria-hidden
        />

        <div
          className={containerClass}
          style={{
            position: "relative",
            // paddingTop: "clamp(44px,6vw,88px)",
            paddingBottom: "clamp(56px,7vw,96px)",
          }}
        >
          {/* Breadcrumb */}
          <nav
            aria-label="Breadcrumb"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexWrap: "wrap",
              fontSize: 12,
              marginBottom: 40,
              color: "var(--text-4)",
            }}
          >
            <Link href="/" style={{ color: "var(--text-4)", textDecoration: "none" }}>
              Home
            </Link>
            <span aria-hidden style={{ color: "var(--border)" }}>
              /
            </span>
            <span style={{ color: "var(--text-2)", fontWeight: 600 }} aria-current="page">
              Brands
            </span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-10 xl:gap-16 items-end">
            {/* Left: headline + CTAs */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                <span
                  style={{
                    width: 28,
                    height: 2,
                    borderRadius: 2,
                    background: ACCENT,
                    display: "block",
                  }}
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
                  Our Brand Partners
                </span>
              </div>

              <h1
                style={{
                  fontFamily: "var(--font-sora, 'Sora', sans-serif)",
                  fontWeight: 800,
                  fontSize: "clamp(38px,5.8vw,72px)",
                  lineHeight: 1.03,
                  letterSpacing: "-0.03em",
                  margin: "0 0 24px",
                  color: "var(--text-1)",
                }}
              >
                World-class brands,{" "}
                <br className="hidden sm:block" />
                delivered with{" "}
                <span style={{ color: ACCENT }}>local certainty.</span>
              </h1>

              <p
                style={{
                  fontSize: "clamp(15px,1.2vw,17.5px)",
                  lineHeight: 1.7,
                  color: "var(--text-3)",
                  maxWidth: 540,
                  margin: "0 0 32px",
                }}
              >
                APT Ghana is the authorised distributor for over 26 global manufacturers — supplying
                genuine products with full manufacturer warranty and technical support across West
                Africa.
              </p>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                <a
                  href="#portfolio"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 9,
                    height: 50,
                    padding: "0 24px",
                    borderRadius: 13,
                    background: ACCENT,
                    color: DARK_BG,
                    fontWeight: 700,
                    fontSize: 14.5,
                    textDecoration: "none",
                    boxShadow: "0 12px 28px -12px rgba(132,204,22,0.65)",
                  }}
                >
                  Explore the portfolio
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    aria-hidden
                  >
                    <path
                      d="M5 12h14m-7-7 7 7-7 7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </a>
                <a
                  href="#schneider"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    height: 50,
                    padding: "0 22px",
                    borderRadius: 13,
                    background: "var(--bg-raised)",
                    border: "1px solid var(--border)",
                    color: "var(--text-1)",
                    fontWeight: 600,
                    fontSize: 14.5,
                    textDecoration: "none",
                  }}
                >
                  Our flagship partner
                </a>
              </div>
            </div>

            {/* Right: stats rail */}
            <div
              style={{
                border: "1px solid var(--border)",
                borderRadius: 22,
                background: "var(--bg-raised)",
                padding: "8px 28px",
                boxShadow: "0 22px 48px -30px rgba(15,23,42,0.22)",
              }}
            >
              {HERO_STATS.map((stat, i) => (
                <div
                  key={stat.label}
                  style={{
                    padding: "24px 0",
                    borderBottom:
                      i < HERO_STATS.length - 1 ? "1px solid var(--border)" : "none",
                  }}
                >
                  <div
                    style={{
                      fontFamily: "var(--font-sora, 'Sora', sans-serif)",
                      fontWeight: 800,
                      fontSize: "clamp(36px,4.2vw,52px)",
                      lineHeight: 1,
                      letterSpacing: "-0.03em",
                      color: ACCENT,
                    }}
                  >
                    {stat.display}
                  </div>
                  <div
                    style={{
                      marginTop: 8,
                      fontSize: 12.5,
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.12em",
                      color: "var(--text-4)",
                    }}
                  >
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. MARQUEE ── */}
      <section
        aria-label="Brand partners marquee"
        style={{
          borderTop: "1px solid var(--border)",
          borderBottom: "1px solid var(--border)",
          background: "var(--bg-raised)",
          padding: "20px 0",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Fade edges */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: 96,
            background: "linear-gradient(90deg,var(--bg-raised) 10%,transparent)",
            zIndex: 2,
            pointerEvents: "none",
          }}
          aria-hidden
        />
        <div
          style={{
            position: "absolute",
            right: 0,
            top: 0,
            bottom: 0,
            width: 96,
            background: "linear-gradient(270deg,var(--bg-raised) 10%,transparent)",
            zIndex: 2,
            pointerEvents: "none",
          }}
          aria-hidden
        />
        <div style={{ overflow: "hidden" }}>
          <div
            style={{
              display: "flex",
              width: "max-content",
              gap: 12,
              animation: "brandsMarquee 52s linear infinite",
            }}
          >
            {marqueeItems.map((b, i) => (
              <div
                key={i}
                aria-hidden={i >= brands.length}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "8px 14px 8px 8px",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  background: "var(--bg-surface)",
                  whiteSpace: "nowrap",
                  userSelect: "none",
                }}
              >
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: "var(--bg-raised)",
                    fontFamily: "var(--font-sora, 'Sora', sans-serif)",
                    fontWeight: 800,
                    fontSize: 11,
                    color: "var(--text-1)",
                    letterSpacing: "-0.02em",
                  }}
                >
                  {getBrandMark(b.name)}
                </span>
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-2)" }}>
                  {b.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. SCHNEIDER FLAGSHIP ── */}
      <section
        id="schneider"
        style={{ background: "var(--bg-base)", padding: "clamp(56px,8vw,100px) 0" }}
      >
        <div className={containerClass}>
          <div
            style={{
              border: "1px solid var(--border)",
              borderRadius: 26,
              overflow: "hidden",
              background: "var(--bg-surface)",
              boxShadow: "0 28px 60px -40px rgba(15,23,42,0.28)",
            }}
          >
            <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr]">
              {/* Left: narrative */}
              <div style={{ padding: "clamp(32px,4.4vw,58px)" }}>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "7px 14px",
                    borderRadius: 999,
                    background: "rgba(132,204,22,0.10)",
                    border: "1px solid rgba(132,204,22,0.28)",
                    marginBottom: 26,
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: ACCENT,
                      display: "block",
                    }}
                  />
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.16em",
                      color: ACCENT,
                    }}
                  >
                    Official Certified Distributor
                  </span>
                </div>

                <h2
                  style={{
                    fontFamily: "var(--font-sora, 'Sora', sans-serif)",
                    fontWeight: 800,
                    fontSize: "clamp(26px,3.2vw,42px)",
                    lineHeight: 1.08,
                    letterSpacing: "-0.025em",
                    margin: "0 0 20px",
                    color: "var(--text-1)",
                  }}
                >
                  Schneider Electric &mdash;
                  <br />
                  our flagship partnership.
                </h2>

                <p
                  style={{
                    fontSize: 15.5,
                    lineHeight: 1.7,
                    color: "var(--text-2)",
                    margin: "0 0 14px",
                    maxWidth: 520,
                  }}
                >
                  APT Ghana has been an authorised Schneider Electric distributor since our founding
                  in 2009. In 2021 we were named Schneider Electric Partner of the Year, and in 2024
                  we received the Marketing Excellence award — recognising our commitment to energy
                  management and automation across Ghana.
                </p>

                <p
                  style={{
                    fontSize: 15.5,
                    lineHeight: 1.7,
                    color: "var(--text-3)",
                    margin: "0 0 30px",
                    maxWidth: 520,
                  }}
                >
                  As a certified partner we supply the full range of Easergy, Modicon, Harmony,
                  Acti9, PowerPact and APC products — backed by Schneider&apos;s global warranty and
                  our local technical expertise.
                </p>

                {/* Awards timeline */}
                <div style={{ margin: "0 0 30px" }}>
                  {SCHNEIDER_AWARDS.map((award, i) => (
                    <div
                      key={award.year}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 16,
                        padding: "13px 0",
                        borderTop: i === 0 ? "1px solid var(--border)" : undefined,
                        borderBottom: "1px solid var(--border)",
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "var(--font-sora, 'Sora', sans-serif)",
                          fontWeight: 800,
                          fontSize: 13,
                          color: ACCENT,
                          minWidth: 40,
                          lineHeight: "20px",
                          flexShrink: 0,
                        }}
                      >
                        {award.year}
                      </span>
                      <span
                        style={{ fontSize: 14, color: "var(--text-2)", lineHeight: 1.55 }}
                      >
                        {award.label}
                      </span>
                    </div>
                  ))}
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                  <Link
                    href={`${brandHref}/schneider-electric`}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      height: 47,
                      padding: "0 22px",
                      borderRadius: 13,
                      background: ACCENT,
                      color: DARK_BG,
                      fontWeight: 700,
                      fontSize: 14,
                      textDecoration: "none",
                    }}
                  >
                    Browse Schneider Products
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2.5}
                      aria-hidden
                    >
                      <path
                        d="M5 12h14m-7-7 7 7-7 7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </Link>
                  <Link
                    href={contactHref}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      height: 47,
                      padding: "0 20px",
                      borderRadius: 13,
                      background: "var(--bg-raised)",
                      border: "1px solid var(--border)",
                      color: "var(--text-2)",
                      fontWeight: 600,
                      fontSize: 14,
                      textDecoration: "none",
                    }}
                  >
                    Request a Quote
                  </Link>
                </div>
              </div>

              {/* Right: dark Schneider stats panel */}
              <div
                style={{
                  background: "#003768",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  padding: "clamp(32px,4.4vw,56px)",
                }}
              >
                <div style={{ textAlign: "center", marginBottom: 28 }}>
                  <div
                    style={{
                      fontFamily: "var(--font-sora, 'Sora', sans-serif)",
                      fontWeight: 900,
                      fontSize: "clamp(64px,7.5vw,96px)",
                      lineHeight: 1,
                      color: "#fff",
                      letterSpacing: "-0.04em",
                    }}
                  >
                    SE
                  </div>
                  <p
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: "rgba(255,255,255,0.5)",
                      marginTop: 6,
                    }}
                  >
                    Schneider Electric
                  </p>
                  <p
                    style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 2 }}
                  >
                    Life Is On
                  </p>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {SCHNEIDER_STATS.map((s) => (
                    <div
                      key={s.label}
                      style={{
                        borderRadius: 13,
                        padding: "16px 12px",
                        textAlign: "center",
                        background: "rgba(255,255,255,0.09)",
                      }}
                    >
                      <div
                        style={{
                          fontFamily: "var(--font-sora, 'Sora', sans-serif)",
                          fontWeight: 800,
                          fontSize: "clamp(18px,2.2vw,26px)",
                          color: ACCENT,
                          lineHeight: 1,
                        }}
                      >
                        {s.value}
                      </div>
                      <div
                        style={{
                          marginTop: 7,
                          fontSize: 10.5,
                          fontWeight: 600,
                          textTransform: "uppercase",
                          letterSpacing: "0.09em",
                          color: "rgba(255,255,255,0.4)",
                        }}
                      >
                        {s.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. TRUST PILLARS ── */}
      <section
        style={{
          background: "var(--bg-raised)",
          borderTop: "1px solid var(--border)",
          padding: "clamp(56px,8vw,100px) 0",
        }}
      >
        <div className={containerClass}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <span
              style={{
                width: 28,
                height: 2,
                borderRadius: 2,
                background: ACCENT,
                display: "block",
                flexShrink: 0,
              }}
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
              Why distribute through APT
            </span>
          </div>
          <h2
            style={{
              fontFamily: "var(--font-sora, 'Sora', sans-serif)",
              fontWeight: 800,
              fontSize: "clamp(26px,3.4vw,44px)",
              lineHeight: 1.06,
              letterSpacing: "-0.03em",
              margin: "0 0 44px",
              color: "var(--text-1)",
              maxWidth: 620,
            }}
          >
            Genuine product, backed by the manufacturer.
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {PILLARS.map((p) => (
              <div
                key={p.num}
                style={{
                  position: "relative",
                  border: "1px solid var(--border)",
                  borderRadius: 22,
                  background: "var(--bg-surface)",
                  padding: "32px 28px 40px",
                  overflow: "hidden",
                }}
              >
                {/* Bottom accent bar */}
                <div
                  style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 3 }}
                  aria-hidden
                >
                  <div
                    style={{
                      height: "100%",
                      width: "68%",
                      background: `linear-gradient(90deg,${ACCENT},rgba(132,204,22,0.1))`,
                    }}
                  />
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 18,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: "rgba(132,204,22,0.10)",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--font-sora, 'Sora', sans-serif)",
                        fontWeight: 800,
                        fontSize: 20,
                        color: ACCENT,
                      }}
                    >
                      {p.icon}
                    </span>
                  </div>
                  <span
                    style={{
                      fontFamily: "var(--font-sora, 'Sora', sans-serif)",
                      fontWeight: 800,
                      fontSize: 32,
                      letterSpacing: "-0.04em",
                      color: "var(--border)",
                      lineHeight: 1,
                    }}
                  >
                    {p.num}
                  </span>
                </div>

                <h3
                  style={{
                    fontFamily: "var(--font-sora, 'Sora', sans-serif)",
                    fontWeight: 700,
                    fontSize: 20,
                    letterSpacing: "-0.02em",
                    margin: "0 0 10px",
                    color: "var(--text-1)",
                  }}
                >
                  {p.title}
                </h3>
                <p
                  style={{ fontSize: 14, lineHeight: 1.65, color: "var(--text-3)", margin: 0 }}
                >
                  {p.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. PORTFOLIO (client — interactive search/filter) ── */}
      <BrandsGrid
        brands={brands}
        brandHref={brandHref}
        rfqHref={rfqHref}
        contactHref={contactHref}
        containerClass={containerClass}
      />
    </main>
  );
}
