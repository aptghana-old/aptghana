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
    <footer className="bg-[#0a1628] text-white/60">

      {/* ── Main grid ──────────────────────────────────────────────────── */}
      <div className={`${containerClass} pt-14 pb-10`}>
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-12">

          {/* Brand column */}
          <div>
            <Link href={brand.href} className="inline-flex items-center gap-3 mb-5 group">
              <div className="w-9 h-9 rounded-xl bg-[#3DCD58] flex items-center justify-center text-white font-black text-sm shrink-0">
                {brand.logoText}
              </div>
              <div>
                <div className="font-bold text-white leading-none text-sm group-hover:text-[#3DCD58] transition-colors">
                  {brand.name}
                </div>
                <div className="text-[10px] text-white/35 mt-0.5 uppercase tracking-widest">
                  {brand.tagline}
                </div>
              </div>
            </Link>

            <p className="text-sm leading-relaxed text-white/45 mb-6 max-w-[280px]">
              {brand.description}
            </p>

            {/* Contact info */}
            <ul className="space-y-3 mb-7">
              {contact.map((item, i) => (
                <li key={i}>
                  <a
                    href={item.href}
                    target={item.href.startsWith("http") ? "_blank" : undefined}
                    rel={item.href.startsWith("http") ? "noopener noreferrer" : undefined}
                    className="flex items-start gap-2.5 text-xs text-white/40 hover:text-white/70 transition-colors"
                  >
                    <svg
                      className="w-3.5 h-3.5 shrink-0 mt-0.5"
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
            <div className="flex items-center gap-2">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.07] flex items-center justify-center text-white/40 hover:text-white hover:bg-white/[0.08] hover:border-white/15 transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3DCD58]"
                >
                  <svg
                    className="w-3.5 h-3.5"
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
            className={`grid grid-cols-2 sm:grid-cols-3 gap-8 ${
              columns.length >= 5
                ? "lg:grid-cols-5"
                : columns.length === 4
                ? "lg:grid-cols-4"
                : "lg:grid-cols-3"
            }`}
          >
            {columns.map((col) => (
              <div key={col.title}>
                <h3 className="text-[10px] font-bold text-white uppercase tracking-widest mb-4">
                  {col.title}
                </h3>
                <ul className="space-y-2.5">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        target={link.external ? "_blank" : undefined}
                        rel={link.external ? "noopener noreferrer" : undefined}
                        className="text-xs text-white/40 hover:text-white/80 transition-colors leading-relaxed"
                      >
                        {link.label}
                        {link.external && (
                          <svg
                            className="inline-block w-2.5 h-2.5 ml-1 -mt-0.5 opacity-50"
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

        {/* ── Featured brands strip (optional) ──────────────────────────── */}
        {featuredBrands && featuredBrands.length > 0 && (
          <div className="mt-10 pt-8 border-t border-white/[0.06]">
            <p className="text-[10px] text-white/30 uppercase tracking-widest mb-4 font-semibold">
              Featured Brands
            </p>
            <div className="flex flex-wrap gap-2">
              {featuredBrands.map((b) => (
                <Link
                  key={b.name}
                  href={b.href}
                  className="px-3 py-1.5 text-xs font-medium text-white/40 border border-white/10 rounded-full hover:text-white/70 hover:border-white/20 transition-all"
                >
                  {b.name}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── Newsletter bar (optional) ──────────────────────────────────── */}
        {newsletter && (
          <div className="mt-10 pt-8 border-t border-white/[0.06]">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 justify-between">
              <div>
                <p className="text-sm font-semibold text-white mb-0.5">{newsletter.heading}</p>
                <p className="text-xs text-white/35">{newsletter.subheading}</p>
              </div>
              <form action={newsletter.action} method="post" className="flex w-full sm:w-auto">
                <input
                  type="email"
                  name="email"
                  placeholder="your@email.com"
                  required
                  className="flex-1 sm:w-64 h-10 px-4 bg-white/[0.05] border border-white/10 rounded-l-xl text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#3DCD58]/40 transition-colors"
                />
                <button
                  type="submit"
                  className="h-10 px-5 bg-[#3DCD58] hover:bg-[#2AA347] text-white text-xs font-bold rounded-r-xl transition-colors shrink-0"
                >
                  Subscribe
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* ── Bottom bar ────────────────────────────────────────────────────── */}
      <div className="border-t border-white/[0.05]">
        <div className={`${containerClass} py-5 flex flex-col sm:flex-row items-center justify-between gap-4`}>
          <p className="text-xs text-white/25 text-center sm:text-left">
            © {year} APT Ghana Limited. All rights reserved.
          </p>

          <nav aria-label="Legal" className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            {legalLinks.map((l) => (
              <Link
                key={l.label}
                href={l.href}
                className="text-xs text-white/25 hover:text-white/60 transition-colors whitespace-nowrap"
              >
                {l.label}
              </Link>
            ))}
          </nav>

          {certifications && certifications.length > 0 && (
            <div className="flex items-center gap-3 text-[10px] text-white/20 font-medium uppercase tracking-widest">
              {certifications.map((cert, i) => (
                <span key={cert} className="flex items-center gap-3">
                  {i > 0 && <span className="w-px h-3 bg-white/10" aria-hidden="true" />}
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
