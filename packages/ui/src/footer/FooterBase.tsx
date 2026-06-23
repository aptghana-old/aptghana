import Link from "next/link";
import type { FooterConfig } from "./types";

interface Props {
  config: FooterConfig;
}

export default function FooterBase({ config }: Props) {
  const {
    brand,
    contact,
    socials,
    columns,
    legalLinks,
    certifications,
    newsletter,
    featuredBrands,
    containerClass = "mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8",
  } = config;

  const year = new Date().getFullYear();

  return (
    <footer
      className="
        bg-white text-slate-500
        dark:bg-[#0b1829] dark:text-white/55
        transition-colors duration-300
        relative
      "
    >
      {/* ── Top accent rule — energy/current motif ──────────────────────── */}
      <div
        className="
          h-1 w-full
          bg-[linear-gradient(90deg,transparent_0%,#3DCD58_30%,#3DCD58_70%,transparent_100%)]
          opacity-60 dark:opacity-90
        "
        aria-hidden="true"
      />

      {/* ── Main grid ──────────────────────────────────────────────────────── */}
      <div className={`${containerClass} pt-10 pb-8`}>
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-12">

          {/* Brand column — left-border accent, slight tinted bg in dark */}
          <div
            className="
              border-l-2 pl-5 pt-1 pb-1
              border-[#3DCD58]/20 dark:border-[#3DCD58]/25
              dark:bg-[#3DCD58]/[0.03] dark:rounded-r-lg
            "
          >
            <Link
              href={brand.href}
              className="inline-flex items-center gap-2.5 mb-4 group"
            >
              <div
                className="
                  w-9 h-9 rounded-[10px] bg-[#3DCD58] flex items-center justify-center
                  text-white font-extrabold text-[11px] tracking-wide shrink-0
                  transition-all duration-200
                  group-hover:bg-[#2AA347] group-hover:scale-105
                "
              >
                {brand.logoText}
              </div>
              <div>
                <div
                  className="
                    font-bold text-[13.5px] leading-tight tracking-tight
                    text-slate-900 group-hover:text-[#3DCD58]
                    dark:text-white/95 dark:group-hover:text-[#3DCD58]
                    transition-colors duration-200
                  "
                >
                  {brand.name}
                </div>
                <div
                  className="
                    text-[9px] mt-0.5 uppercase tracking-[0.12em] font-medium
                    text-slate-400 dark:text-white/30
                  "
                >
                  {brand.tagline}
                </div>
              </div>
            </Link>

            <p
              className="
                text-xs leading-relaxed mb-5 max-w-[240px]
                text-slate-400 dark:text-white/45
              "
            >
              {brand.description}
            </p>

            {/* Contact info */}
            <ul className="space-y-2.5 mb-5">
              {contact.map((item, i) => (
                <li key={i}>
                  <a
                    href={item.href}
                    target={item.href.startsWith("http") ? "_blank" : undefined}
                    rel={item.href.startsWith("http") ? "noopener noreferrer" : undefined}
                    className="
                      flex items-start gap-2 text-[11.5px] transition-colors duration-200
                      text-slate-400 hover:text-slate-500
                      dark:text-white/35 dark:hover:text-white/60
                    "
                  >
                    <svg
                      className="w-[13px] h-[13px] shrink-0 mt-0.5 opacity-70"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.75}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d={item.iconPath} />
                    </svg>
                    {item.text}
                  </a>
                </li>
              ))}
            </ul>

            {/* Social links */}
            <div className="flex items-center gap-1.5">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="
                    size-8 rounded-[8px] flex items-center justify-center
                    transition-all duration-200
                    focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3DCD58]
                    bg-slate-100 border border-slate-200/80 text-slate-400
                    hover:bg-slate-200 hover:border-slate-300 hover:text-slate-700 hover:-translate-y-px
                    dark:bg-white/[0.045] dark:border-white/[0.07] dark:text-white/35
                    dark:hover:bg-white/[0.09] dark:hover:border-white/[0.13] dark:hover:text-white
                    dark:hover:-translate-y-px
                  "
                >
                  <svg
                    className="size-3.5 object-contain"
                    viewBox={s.viewBox ?? "0 0 24 24"}
                    fill={s.filled ? "currentColor" : "none"}
                    stroke={s.filled ? "none" : "currentColor"}
                    strokeWidth={s.filled ? 0 : 1.75}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d={s.iconPath} />
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          <div
            className={`
              grid grid-cols-2 sm:grid-cols-3 gap-7
              ${columns.length >= 5
                ? "lg:grid-cols-5"
                : columns.length === 4
                  ? "lg:grid-cols-4"
                  : "lg:grid-cols-3"
              }
            `}
          >
            {columns.map((col) => (
              <div key={col.title}>
                {/* Column header — small green dot marker + small-caps */}
                <h3
                  className="
                    flex items-center gap-1.5
                    text-[9.5px] font-bold uppercase tracking-[0.10em] mb-3.5
                    text-slate-900 dark:text-white/95
                  "
                >
                  <span
                    className="
                      inline-block w-1 h-1 rounded-full bg-[#3DCD58] shrink-0
                    "
                    aria-hidden="true"
                  />
                  {col.title}
                </h3>
                <ul className="space-y-2">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        target={link.external ? "_blank" : undefined}
                        rel={link.external ? "noopener noreferrer" : undefined}
                        className="
                          inline-flex items-center gap-1 text-xs leading-snug
                          transition-colors duration-200
                          text-slate-400 hover:text-slate-700
                          dark:text-white/38 dark:hover:text-white/82
                        "
                      >
                        {link.label}
                        {link.external && (
                          <svg
                            className="w-[9px] h-[9px] opacity-40 shrink-0"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                            />
                          </svg>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* ── Featured brands strip (optional) ──────────────────────────────── */}
        {featuredBrands && featuredBrands.length > 0 && (
          <div
            className="
              mt-8 pt-6
              border-t border-slate-200/80 dark:border-white/[0.055]
            "
          >
            <p
              className="
                text-[9px] uppercase tracking-[0.12em] mb-2.5 font-semibold
                text-slate-300 dark:text-white/20
              "
            >
              Featured Partners
            </p>
            <div className="flex flex-wrap gap-1.5">
              {featuredBrands.map((b) => (
                <Link
                  key={b.name}
                  href={b.href}
                  className="
                    px-3 py-[5px] text-[11.5px] font-medium rounded-full
                    transition-all duration-200
                    text-slate-400 border border-slate-200/80
                    hover:text-slate-600 hover:border-slate-300 hover:bg-slate-50
                    dark:text-white/35 dark:border-white/[0.09]
                    dark:hover:text-white/65 dark:hover:border-white/20 dark:hover:bg-white/[0.04]
                  "
                >
                  {b.name}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── Newsletter bar (optional) ────────────────────────────────────── */}
        {newsletter && (
          <div
            className="
              mt-8 pt-6
              border-t border-slate-200/80 dark:border-white/[0.055]
            "
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 justify-between">
              <div>
                <p
                  className="
                    text-[13px] font-semibold mb-0.5
                    text-slate-900 dark:text-white/95
                  "
                >
                  {newsletter.heading}
                </p>
                <p
                  className="
                    text-[11.5px]
                    text-slate-400 dark:text-white/32
                  "
                >
                  {newsletter.subheading}
                </p>
              </div>
              <form action={newsletter.action} method="post" className="flex w-full sm:w-auto">
                <input
                  type="email"
                  name="email"
                  placeholder="your@email.com"
                  required
                  className="
                    flex-1 sm:w-52 h-9 px-3.5 rounded-l-[9px] text-xs transition-colors
                    focus:outline-none
                    bg-slate-100 border border-slate-200/80 text-slate-800 placeholder-slate-300
                    focus:border-[#3DCD58]/50
                    dark:bg-white/[0.05] dark:border-white/[0.09] dark:text-white
                    dark:placeholder-white/20 dark:focus:border-[#3DCD58]/40
                  "
                />
                <button
                  type="submit"
                  className="
                    h-9 px-4 bg-[#3DCD58] hover:bg-[#2AA347]
                    text-white text-[11.5px] font-bold tracking-wide
                    rounded-r-[9px] transition-colors shrink-0
                  "
                >
                  Subscribe
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* ── Bottom bar ──────────────────────────────────────────────────────── */}
      <div
        className="
          border-t
          border-slate-100 bg-slate-50/70
          dark:border-white/[0.045] dark:bg-[#0f2035]/60
        "
      >
        <div
          className={`${containerClass} py-4 flex flex-col sm:flex-row items-center justify-between gap-3`}
        >
          <p
            className="
              text-[11px] text-center sm:text-left
              text-slate-400 dark:text-white/22
            "
          >
            © {year} APT Ghana Limited. All rights reserved.
          </p>

          <nav
            aria-label="Legal"
            className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5"
          >
            {legalLinks.map((l) => (
              <Link
                key={l.label}
                href={l.href}
                className="
                  text-[11px] transition-colors whitespace-nowrap
                  text-slate-400 hover:text-slate-600
                  dark:text-white/22 dark:hover:text-white/55
                "
              >
                {l.label}
              </Link>
            ))}
          </nav>

          {certifications && certifications.length > 0 && (
            <div
              className="
                flex items-center gap-2.5
                text-[9.5px] font-semibold uppercase tracking-[0.10em]
                text-slate-300 dark:text-white/18
              "
            >
              {certifications.map((cert, i) => (
                <span key={cert} className="flex items-center gap-2.5">
                  {i > 0 && (
                    <span
                      className="w-px h-2.5 bg-slate-200 dark:bg-white/[0.08]"
                      aria-hidden="true"
                    />
                  )}
                  {cert}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}