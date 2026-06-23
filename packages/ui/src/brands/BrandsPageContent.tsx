import Link from "next/link";
import type { BrandListItem, BrandsPageConfig } from "./types";

interface Props {
  brands: BrandListItem[];
  config: BrandsPageConfig;
}

const GREEN = "#3DCD58";
const NAVY = "#0a1628";

export default function BrandsPageContent({ brands, config }: Props) {
  const count = brands.length;
  const { containerClass, brandHref, rfqHref, contactHref } = config;

  return (
    <main>
      {/* ── Hero band ── */}
      <section style={{ background: NAVY }} className="pt-10 pb-8">
        <div className={containerClass}>
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-1.5 text-[11px] mb-5 flex-wrap"
            style={{ color: "rgba(255,255,255,0.4)" }}
          >
            <Link href="/" className="hover:underline" style={{ color: "rgba(255,255,255,0.4)" }}>
              Home
            </Link>
            <span aria-hidden style={{ color: "rgba(255,255,255,0.2)" }}>/</span>
            <span style={{ color: "rgba(255,255,255,0.75)", fontWeight: 500 }} aria-current="page">
              Brands
            </span>
          </nav>

          <div className="flex items-center gap-3 mb-3">
            <div className="w-5 h-[2px] rounded-full" style={{ background: GREEN }} />
            <span
              className="text-[11px] font-bold uppercase tracking-[0.2em]"
              style={{ color: GREEN }}
            >
              Our Brand Partners
            </span>
          </div>

          <h1
            className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white mb-3"
            style={{ fontFamily: "var(--font-sora, 'Sora', sans-serif)" }}
          >
            {count}+ World-Class Industrial Brands
          </h1>
          <p
            className="text-base leading-relaxed max-w-xl"
            style={{ color: "rgba(255,255,255,0.5)" }}
          >
            APT Ghana is an authorised distributor for over {count} global manufacturers — delivering
            genuine products with full manufacturer warranty and technical support across West Africa.
          </p>
        </div>
      </section>

      {/* ── Schneider Feature Card ── */}
      <section className="py-12" style={{ background: "var(--bg-base)" }}>
        <div className={containerClass}>
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
            }}
          >
            <div className="grid grid-cols-1 lg:grid-cols-2">
              {/* Left: text content */}
              <div className="p-10 lg:p-14">
                <div
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6"
                  style={{
                    background: `${GREEN}1A`,
                    border: `1px solid ${GREEN}4D`,
                  }}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ background: GREEN }}
                    aria-hidden
                  />
                  <span
                    className="text-xs font-bold uppercase tracking-widest"
                    style={{ color: GREEN }}
                  >
                    Official Certified Distributor
                  </span>
                </div>

                <h2
                  className="text-3xl lg:text-4xl font-extrabold tracking-tight mb-5"
                  style={{
                    color: "var(--text-1)",
                    fontFamily: "var(--font-sora, 'Sora', sans-serif)",
                  }}
                >
                  Schneider Electric — Our Flagship Partnership
                </h2>

                <p
                  className="text-base leading-relaxed mb-4"
                  style={{ color: "var(--text-2)" }}
                >
                  APT Ghana has been an authorised Schneider Electric distributor since our founding
                  in 2009. In 2021, we were named Schneider Electric Partner of the Year, and in 2024
                  we received the Marketing Excellence award — recognising our commitment to promoting
                  energy management and automation solutions across Ghana.
                </p>
                <p
                  className="text-base leading-relaxed mb-8"
                  style={{ color: "var(--text-3)" }}
                >
                  As a certified Schneider partner, we supply the full range of Easergy, Modicon,
                  Harmony, Acti9, PowerPact, and APC products — backed by Schneider&apos;s global
                  warranty and our local technical expertise.
                </p>

                <div className="flex flex-wrap gap-3">
                  <Link
                    href={brandHref("schneider-electric")}
                    className="inline-flex items-center gap-2 h-10 px-6 rounded-xl font-bold text-sm transition-colors"
                    style={{ background: GREEN, color: NAVY }}
                  >
                    Browse Schneider Products →
                  </Link>
                  <Link
                    href={contactHref}
                    className="inline-flex items-center gap-2 h-10 px-6 rounded-xl font-semibold text-sm transition-colors"
                    style={{
                      background: "var(--bg-raised)",
                      border: "1px solid var(--border)",
                      color: "var(--text-2)",
                    }}
                  >
                    Request a Quote
                  </Link>
                </div>
              </div>

              {/* Right: dark stats panel */}
              <div
                className="flex items-center justify-center p-8 lg:p-14"
                style={{ background: "#003768" }}
              >
                <div className="text-center w-full max-w-xs">
                  <div
                    className="text-5xl font-extrabold text-white mb-1"
                    style={{ fontFamily: "var(--font-sora, 'Sora', sans-serif)" }}
                  >
                    SE
                  </div>
                  <p className="text-xs uppercase tracking-widest font-semibold mb-1" style={{ color: "rgba(255,255,255,0.6)" }}>
                    Schneider Electric
                  </p>
                  <p className="text-xs mb-8" style={{ color: "rgba(255,255,255,0.4)" }}>
                    Life Is On
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { value: "15+", label: "Years partner" },
                      { value: "2021", label: "Partner of Year" },
                      { value: "2024", label: "Marketing Excellence" },
                      { value: "1,000+", label: "SE products" },
                    ].map((s) => (
                      <div
                        key={s.label}
                        className="rounded-xl p-3 text-center"
                        style={{ background: "rgba(255,255,255,0.1)" }}
                      >
                        <div
                          className="text-lg font-extrabold"
                          style={{ color: GREEN }}
                        >
                          {s.value}
                        </div>
                        <div
                          className="text-[10px] uppercase tracking-wider mt-0.5"
                          style={{ color: "rgba(255,255,255,0.4)" }}
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
        </div>
      </section>

      {/* ── Trust Pillars ── */}
      <section className="py-14" style={{ background: NAVY }}>
        <div className={containerClass}>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {[
              {
                icon: "✓",
                title: "100% Genuine",
                description:
                  "Every product APT Ghana supplies is sourced directly from the manufacturer or their authorised regional distributor. No grey-market imports, no counterfeits.",
              },
              {
                icon: "★",
                title: "Manufacturer Supported",
                description:
                  "As an authorised partner, our clients benefit from full OEM warranties, access to manufacturer technical support, and certified replacement parts.",
              },
              {
                icon: "→",
                title: "Locally Available",
                description:
                  "We hold significant stock in our Accra warehouse, enabling fast delivery across Ghana. For non-stocked items, we leverage our OEM networks for expedited supply.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl p-8"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                <div
                  className="flex items-center justify-center w-10 h-10 rounded-xl font-bold text-lg mb-5"
                  style={{
                    background: `${GREEN}26`,
                    color: GREEN,
                  }}
                  aria-hidden
                >
                  {item.icon}
                </div>
                <h3
                  className="font-bold text-xl mb-3 text-white"
                  style={{ fontFamily: "var(--font-sora, 'Sora', sans-serif)" }}
                >
                  {item.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Full Brand Portfolio Grid ── */}
      <section className="py-14" style={{ background: "var(--bg-base)" }}>
        <div className={containerClass}>
          {/* Heading */}
          <div className="flex items-center gap-3 mb-2">
            <div className="w-5 h-[2px] rounded-full" style={{ background: GREEN }} />
            <span
              className="text-[11px] font-bold uppercase tracking-[0.2em]"
              style={{ color: GREEN }}
            >
              Full Brand Portfolio
            </span>
          </div>
          <h2
            className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-10"
            style={{
              color: "var(--text-1)",
              fontFamily: "var(--font-sora, 'Sora', sans-serif)",
            }}
          >
            All {count}+ Brands
          </h2>

          {/* 3-column brand card grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {brands.map((brand) => (
              <Link
                key={brand.slug}
                href={brandHref(brand.slug)}
                className="group rounded-2xl p-6 transition-all"
                style={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border)",
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0 pr-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3
                        className="font-bold text-base leading-snug"
                        style={{ color: "var(--text-1)" }}
                      >
                        {brand.name}
                      </h3>
                      {(brand.isPartner || brand.isFeatured) && (
                        <span
                          className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full shrink-0"
                          style={{
                            background: `${GREEN}1A`,
                            color: GREEN,
                            border: `1px solid ${GREEN}4D`,
                          }}
                        >
                          Partner
                        </span>
                      )}
                    </div>
                    {brand.country && (
                      <span
                        className="text-xs mt-0.5 block"
                        style={{ color: "var(--text-4)" }}
                      >
                        {brand.country}
                      </span>
                    )}
                  </div>
                  {/* Arrow icon */}
                  <svg
                    className="w-4 h-4 shrink-0 mt-0.5 transition-colors"
                    style={{ color: "var(--text-4)" }}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                    aria-hidden
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
                    />
                  </svg>
                </div>
                {brand.specialty && (
                  <p
                    className="text-xs leading-relaxed"
                    style={{ color: "var(--text-3)" }}
                  >
                    {brand.specialty}
                  </p>
                )}
                {brand.productCount !== undefined && brand.productCount > 0 && (
                  <p
                    className="text-[10px] font-semibold uppercase tracking-wide mt-2"
                    style={{ color: "var(--text-4)" }}
                  >
                    {brand.productCount.toLocaleString()} products
                  </p>
                )}
              </Link>
            ))}
          </div>

          {/* Bottom CTA */}
          <div
            className="mt-12 rounded-2xl p-8 sm:p-10 text-center"
            style={{ background: NAVY }}
          >
            <h2
              className="text-xl sm:text-2xl font-bold text-white mb-2"
              style={{ fontFamily: "var(--font-sora, 'Sora', sans-serif)" }}
            >
              Can&apos;t find the brand you&apos;re looking for?
            </h2>
            <p
              className="text-sm mb-6 max-w-md mx-auto"
              style={{ color: "rgba(255,255,255,0.5)" }}
            >
              We can source products from additional manufacturers. Contact our procurement team for
              specialist requirements.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                href={rfqHref}
                className="inline-flex items-center gap-2 h-11 px-7 rounded-xl font-semibold text-sm transition-colors"
                style={{ background: GREEN, color: NAVY }}
              >
                Submit an RFQ
              </Link>
              <Link
                href={contactHref}
                className="inline-flex items-center gap-2 h-11 px-7 rounded-xl font-semibold text-sm transition-colors"
                style={{
                  border: "1px solid rgba(255,255,255,0.2)",
                  color: "rgba(255,255,255,0.7)",
                }}
              >
                Contact Sales
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
