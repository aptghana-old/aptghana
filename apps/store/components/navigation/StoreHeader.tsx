"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import UserAccountButton from "./UserAccountButton";
import { SearchAutocomplete } from "@/components/search/SearchAutocomplete";
import { useCart } from "@/lib/store/cart";

/* ─── Mega menu types ────────────────────────────────────────────────────── */
interface DisplayGroup {
  id: string;
  label: string;
  color: string;
  href: string;
  iconPath: string;
  iconImage?: string;
  categories: {
    name: string; desc: string; href: string; img?: {
      url: string, alt?: string
    }; subcategories?: { name: string; slug: string; href: string }[]
  }[];
  featured: { name: string; tag: string; href: string; desc: string };
}

const NAV_LINKS = [
  { label: "Solutions", href: "/solutions" },
  { label: "Brands", href: "/brands" },
  { label: "Technical Library", href: "/library" },
  { label: "Contact", href: "/contact" },
];

/* ─── Icons ──────────────────────────────────────────────────────────────── */
function Icon({ d, size = 20, strokeWidth = 1.75, className = "", style }: { d: string; size?: number; strokeWidth?: number; className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} width={size} height={size} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={strokeWidth}>
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  );
}

/* ─── Fixed-size image container — reserves space before image loads ─────── */
function MegaMenuCategoryImage({ src, alt }: { src: string; alt: string }) {
  return (
    <div
      className="w-10 h-10 shrink-0 rounded-lg flex items-center justify-center overflow-hidden"
      style={{ background: "var(--bg-raised)" }}
    >
      <Image
        src={src}
        alt={alt}
        width={40}
        height={40}
        className="object-contain w-full h-full"
        sizes="40px"
        loading="lazy"
      />
    </div>
  );
}

/* ─── Header component ───────────────────────────────────────────────────── */
function adaptNavGroups(navGroups: import("@/app/layout").NavGroup[]): DisplayGroup[] {
  return navGroups.map((g) => ({
    id: g.id,
    label: g.label,
    color: g.color,
    iconImage: g.iconImage,
    href: g.href,
    iconPath: g.iconPath,
    img: g.img,
    categories: g.categories.map((c) => ({
      name: c.name,
      desc: c.desc ?? "",
      href: c.href,
      img: c.img,
      subcategories: (c.subcategories ?? []).map((s) => ({ name: s.name, slug: s.slug, href: s.href })),
    })),
    featured: g.featured,
  }));
}

export default function StoreHeader({ navGroups }: { navGroups?: import("@/app/layout").NavGroup[] }) {
  const displayGroups: DisplayGroup[] = navGroups?.length ? adaptNavGroups(navGroups) : [];
  const hasCatalog = displayGroups.length > 0;
  const [ megaOpen, setMegaOpen ] = useState(false);
  const [ activeGroup, setActiveGroup ] = useState(0);
  const [ mobileOpen, setMobileOpen ] = useState(false);
  const [ mobileGroup, setMobileGroup ] = useState<number | null>(null);
  const [ drawerSearch, setDrawerSearch ] = useState("");
  const [ scrolled, setScrolled ] = useState(false);
  const { count: cartCount } = useCart();
  const megaCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 4);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setMegaOpen(false); setMobileOpen(false); }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [ mobileOpen ]);

  const openMega = useCallback((index: number) => {
    if (megaCloseTimer.current) clearTimeout(megaCloseTimer.current);
    setActiveGroup(index);
    setMegaOpen(true);
  }, []);

  const delayedCloseMega = useCallback(() => {
    megaCloseTimer.current = setTimeout(() => setMegaOpen(false), 120);
  }, []);

  const cancelCloseMega = useCallback(() => {
    if (megaCloseTimer.current) clearTimeout(megaCloseTimer.current);
  }, []);

  const group = displayGroups[ activeGroup ] ?? displayGroups[ 0 ];

  return (
    <>
      <header
        ref={headerRef}
        className={`sticky top-0 z-50 transition-shadow duration-200 ${scrolled ? "shadow-[0_4px_24px_rgba(0,0,0,0.4)]" : ""}`}
      >
        {/* ── Desktop header row (lg+): Logo · Search · Actions ── */}
        <div className="hidden lg:block bg-[var(--apt-bg)]">
          <div className="container-store">
            <div className="flex items-center gap-3 h-15">

              {/* Logo */}
              <Link href="/" className="flex items-center shrink-0">
                <Image src="/logo.png" alt="APT Ghana" width={140} height={69}
                  className="h-10 w-auto object-contain dark:invert" priority />
              </Link>

              {/* Search bar with autocomplete */}
              <div className="flex-1 flex max-w-2xl mx-auto">
                <SearchAutocomplete variant="desktop" className="flex-1" />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-0.5 shrink-0">
                <UserAccountButton />

                <Link
                  href="/cart"
                  className="relative p-2 text-[var(--apt-text-muted)] hover:text-[var(--apt-text)] hover:bg-[var(--apt-bg-subtle)] rounded-lg transition-all"
                  aria-label="Cart"
                >
                  <Icon d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" size={20} />
                  {cartCount > 0 && (
                    <span className="absolute top-1 right-1 w-3.5 h-3.5 text-[9px] font-bold bg-[var(--apt-color-primary)] text-white rounded-full flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </Link>

                <Link
                  href="/rfq"
                  className="flex items-center gap-1.5 h-9 px-4 bg-[var(--apt-color-primary)] hover:bg-[var(--apt-color-primary)_/90] text-white text-[13px] font-bold rounded-lg ml-1 transition-colors shadow-md"
                >
                  <Icon d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25M9 16.5v.75m3-3v3M15 12v5.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" size={16} />
                  RFQ
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* ── Mobile header (< lg): Row 1 + Row 2 ── */}
        <div className="lg:hidden bg-[var(--apt-bg)]">
          <div className="container-store">

            {/* Row 1: Logo (left) · Account, Wishlist, Cart, Menu (right) */}
            <div className="flex items-center h-14">
              <Link href="/" className="flex items-center shrink-0">
                <Image src="/logo.png" alt="APT Ghana" width={120} height={59}
                  className="h-9 w-auto object-contain" priority />
              </Link>

              <div className="ml-auto flex items-center gap-0.5">
                <UserAccountButton />

                <Link
                  href="/cart"
                  className="relative p-2 text-[var(--apt-text-muted)] hover:text-[var(--apt-text)] hover:bg-[var(--apt-bg-subtle)] rounded-lg transition-all"
                  aria-label="Cart"
                >
                  <Icon d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" size={20} />
                  {cartCount > 0 && (
                    <span className="absolute top-1 right-1 w-3.5 h-3.5 text-[9px] font-bold bg-[var(--apt-color-primary)] text-white rounded-full flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </Link>

                <button
                  onClick={() => setMobileOpen(!mobileOpen)}
                  className="p-2 text-[var(--apt-text-muted)] hover:text-[var(--apt-text)] hover:bg-[var(--apt-bg-subtle)] rounded-lg ml-0.5 transition-all"
                  aria-label="Menu"
                >
                  {mobileOpen
                    ? <Icon d="M6 18L18 6M6 6l12 12" size={22} strokeWidth={2} />
                    : <Icon d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" size={22} strokeWidth={2} />
                  }
                </button>
              </div>
            </div>

            {/* Row 2: Full-width search with autocomplete */}
            <div className="pb-3">
              <SearchAutocomplete variant="mobile" />
            </div>
          </div>
        </div>

        {/* Desktop nav strip */}
        <div className="hidden lg:block bg-[var(--apt-bg-subtle)] border-t border-[var(--apt-border)]/[0.05]">
          <div className="container-store">
            <nav
              className="flex items-center h-10 gap-0.5"
              onMouseLeave={delayedCloseMega}
            >
              {/* Catalogue trigger */}
              {hasCatalog ? (
                <button
                  onMouseEnter={() => openMega(0)}
                  onFocus={() => openMega(0)}
                  onClick={() => { setMegaOpen(true); setActiveGroup(0); }}
                  aria-expanded={megaOpen}
                  aria-label="Catalogue menu"
                  className={`group flex items-center gap-1 h-full px-3.5 text-[13px] font-medium rounded-md transition-colors ${megaOpen ? "text-[var(--apt-text)] bg-[var(--apt-bg)]/[0.1]" : "text-[var(--apt-text-muted)] hover:text-[var(--apt-text)] hover:bg-[var(--apt-bg)]/[0.06]"}`}
                >
                  Catalogue
                  <Icon d="M19.5 8.25l-7.5 7.5-7.5-7.5" size={14} strokeWidth={2.5} className={`transition-transform duration-200 ${megaOpen ? "rotate-180" : ""}`} />
                </button>
              ) : (
                <Link href="/catalog" className="h-full px-3.5 flex items-center text-[13px] font-medium text-[var(--apt-text-muted)] hover:text-[var(--apt-text)] hover:bg-[var(--apt-bg)]/[0.06] rounded-md transition-colors">
                  Catalogue
                </Link>
              )}

              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onMouseEnter={delayedCloseMega}
                  className="h-full px-3.5 flex items-center text-[13px] font-medium text-[var(--apt-text-muted)] hover:text-[var(--apt-text)] hover:bg-[var(--apt-bg)]/[0.06] rounded-md transition-colors"
                >
                  {link.label}
                </Link>
              ))}

              <div className="ml-auto flex items-center gap-3 text-[11px] text-[var(--apt-text-muted)]/60 font-medium">
                <span className="hidden xl:block">6,000+ Products</span>
                <span className="w-px h-3 bg-[var(--apt-border)]/[0.2] hidden xl:block" />
                <span>26 Global Brands</span>
                <span className="w-px h-3 bg-[var(--apt-border)]/[0.2]" />
                <a href="tel:+233303964346" className="hover:text-[var(--apt-text)] transition-colors">+233 30 396 4346</a>
              </div>
            </nav>
          </div>
        </div>

        {/* Mega menu panel — images use Next.js Image with explicit sizes to prevent CLS */}
        {megaOpen && hasCatalog && (
          <div
            className="absolute left-0 right-0 top-full z-50 mega-panel mega-enter"
            onMouseEnter={cancelCloseMega}
            onMouseLeave={delayedCloseMega}
          >
            <div className="container-store py-5">
              <div className="flex gap-6">

                {/* Left: group selector */}
                <div className="w-52 shrink-0 space-y-0.5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--apt-text-muted)] px-3 pb-1.5">Categories</p>
                  {displayGroups.map((grp, i) => (
                    <button
                      key={grp.id}
                      onMouseEnter={() => setActiveGroup(i)}
                      onClick={() => { window.location.href = grp.href; setMegaOpen(false); }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg text-left transition-all ${activeGroup === i
                        ? "bg-[var(--apt-bg-subtle)] font-semibold text-[var(--apt-text)]"
                        : "text-[var(--apt-text-muted)] hover:bg-[var(--apt-bg-raised)]"
                        }`}
                    >
                      {/* Fixed 28×28 icon container prevents layout shift */}
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 overflow-hidden transition-all"
                        style={{ background: activeGroup === i ? grp.color + "33" : "var(--apt-bg-subtle)" }}
                      >
                        {grp.iconImage ? (
                          <Image
                            src={grp.iconImage}
                            alt={grp.label}
                            width={16}
                            height={16}
                            className="object-contain"
                            sizes="16px"
                            loading="lazy"
                          />
                        ) : (
                          <Icon d={grp.iconPath} size={15} strokeWidth={1.75} className={activeGroup === i ? "" : "text-[var(--apt-text-muted)]"} style={{ color: activeGroup === i ? grp.color : undefined } as React.CSSProperties} />
                        )}
                      </div>
                      <span className="truncate">{grp.label}</span>
                      {activeGroup === i && (
                        <Icon d="M8.25 4.5l7.5 7.5-7.5 7.5" size={14} strokeWidth={2.5} className="ml-auto shrink-0 text-[var(--apt-color-primary)]" />
                      )}
                    </button>
                  ))}

                  <div className="pt-2 pb-1">
                    <Link
                      href="/catalog"
                      onClick={() => setMegaOpen(false)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[var(--apt-color-primary)] hover:text-[var(--apt-color-primary)_/80] transition-colors"
                    >
                      Browse Catalogue
                      <Icon d="M17 8l4 4m0 0l-4 4m4-4H3" size={14} strokeWidth={2} />
                    </Link>
                  </div>
                </div>

                {/* Divider */}
                <div className="w-px bg-[var(--border)] shrink-0" />

                {/* Center: subcategories */}
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--apt-text-muted)] mb-3" style={{ color: group.color }}>
                    {group.label}
                  </p>
                  <div className="grid grid-cols-2 xl:grid-cols-3 gap-1">
                    {group.categories.map((cat) => (
                      <Link
                        key={cat.href}
                        href={cat.href}
                        onClick={() => setMegaOpen(false)}
                        className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl hover:bg-[var(--bg-raised)] transition-colors group"
                      >
                        {/* Fixed 40×40 container prevents CLS when image loads */}
                        {cat.img?.url ? (
                          <MegaMenuCategoryImage src={cat.img.url} alt={cat.img.alt ?? cat.name} />
                        ) : (
                          <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 transition-all" style={{ background: group.color }} />
                        )}
                        <div>
                          <p className="text-sm font-semibold text-[var(--apt-text)] group-hover:text-[var(--apt-color-primary)] transition-colors leading-snug">{cat.name}</p>
                          <p className="text-xs text-[var(--apt-text-muted)] mt-0.5 leading-relaxed">{cat.desc}</p>
                        </div>
                      </Link>
                    ))}
                  </div>

                  {/* Quick actions */}
                  <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-[var(--apt-border)]">
                    <span className="text-[11px] text-[var(--apt-text-muted)] font-medium">Quick:</span>
                    {[
                      { label: "Browse Catalogue", href: "/catalog" },
                      { label: "Browse by Brand", href: "/brands" },
                      { label: "New Arrivals", href: "/catalog?sort=newest" },
                      { label: "Best Sellers", href: "/catalog?sort=popular" },
                      { label: "Request a Quote", href: "/rfq" },
                    ].map((q) => (
                      <Link
                        key={q.href}
                        href={q.href}
                        onClick={() => setMegaOpen(false)}
                        className="px-3 py-1 rounded-full text-[11px] font-medium bg-[var(--apt-bg-subtle)] text-[var(--apt-text)] hover:bg-[var(--apt-color-primary)_/10] hover:text-[var(--apt-color-primary)] transition-colors border border-[var(--apt-border)]"
                      >
                        {q.label}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[90] lg:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-[min(100vw,380px)] bg-[var(--apt-bg)] overflow-y-auto flex flex-col">

            {/* Mobile header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--apt-border)]/[0.08]">
              <Link href="/" onClick={() => setMobileOpen(false)} className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[var(--apt-color-primary)] flex items-center justify-center text-[var(--apt-text)] font-black text-xs">APT</div>
                <span className="text-[var(--apt-text)] font-bold text-sm">APT Ghana Store</span>
              </Link>
              <button onClick={() => setMobileOpen(false)} className="w-9 h-9 flex items-center justify-center text-[var(--apt-text-muted)]/50 hover:text-[var(--apt-text)] hover:bg-[var(--apt-bg-subtle)] rounded-lg transition-all">
                <Icon d="M6 18L18 6M6 6l12 12" size={20} strokeWidth={2} />
              </button>
            </div>

            {/* Mobile drawer quick search */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setMobileOpen(false);
                if (drawerSearch.trim()) window.location.href = `/search?q=${encodeURIComponent(drawerSearch.trim())}`;
              }}
              className="px-4 py-3 border-b border-[var(--apt-border)]/[0.06]"
            >
              <div className="flex rounded-xl overflow-hidden ring-1 ring-[var(--apt-border)]/[0.2]">
                <input
                  type="text"
                  value={drawerSearch}
                  onChange={(e) => setDrawerSearch(e.target.value)}
                  placeholder="Search products..."
                  className="flex-1 min-w-0 h-11 px-4 bg-[var(--apt-bg-subtle)]/[0.06] text-sm text-[var(--apt-text)] placeholder-[var(--apt-text-muted)]/30 focus:outline-none"
                  autoComplete="off"
                />
                <button type="submit" className="h-11 px-4 bg-[var(--apt-bg-raised)] text-[var(--apt-text)] shrink-0 transition-colors" aria-label="Search">
                  <Icon d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" size={17} strokeWidth={2.5} />
                </button>
              </div>
            </form>

            {/* Mobile nav */}
            <nav className="flex-1 py-3 px-3">
              {/* Catalogue accordion */}
              <div>
                {hasCatalog ? (
                  <button
                    onClick={() => setMobileGroup(mobileGroup === -1 ? null : -1)}
                    aria-expanded={mobileGroup === -1}
                    className="w-full flex items-center justify-between px-3 py-3 text-sm font-semibold text-[var(--apt-text)]/80 hover:text-[var(--apt-text)] rounded-xl hover:bg-[var(--apt-bg-subtle)]/[0.06] transition-all"
                  >
                    Catalogue
                    <Icon d="M19.5 8.25l-7.5 7.5-7.5-7.5" size={16} strokeWidth={2.5} className={`transition-transform ${mobileGroup === -1 ? "rotate-180" : ""}`} />
                  </button>
                ) : (
                  <Link href="/catalog" onClick={() => setMobileOpen(false)} className="flex items-center justify-between px-3 py-3 text-sm font-semibold text-[var(--apt-text)]/80 hover:text-[var(--apt-text)] rounded-xl hover:bg-[var(--apt-bg-subtle)]/[0.06] transition-all">
                    Catalogue
                    <Icon d="M8.25 4.5l7.5 7.5-7.5 7.5" size={16} strokeWidth={2.5} />
                  </Link>
                )}

                {mobileGroup === -1 && hasCatalog && (
                  <div className="ml-3 mt-1 space-y-0.5">
                    {displayGroups.map((grp, i) => (
                      <div key={grp.id}>
                        <button
                          onClick={() => setMobileGroup(i)}
                          className="w-full flex items-center gap-2.5 px-3 py-3 sm:py-2.5 text-sm text-white/60 hover:text-white rounded-lg hover:bg-white/[0.06] transition-all"
                        >
                          <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0" style={{ background: grp.color + "25" }}>
                            <Icon d={grp.iconPath} size={13} strokeWidth={1.75} style={{ color: grp.color } as React.CSSProperties} />
                          </div>
                          <span className="flex-1 text-left">{grp.label}</span>
                          <Icon d="M8.25 4.5l7.5 7.5-7.5 7.5" size={13} strokeWidth={2} className="shrink-0 opacity-40" />
                        </button>

                        {mobileGroup === i && (
                          <div className="ml-4 mt-1 space-y-0.5 pl-3 border-l border-[var(--apt-border)]/[0.2]">
                            {grp.categories.map((cat) => (
                              <Link
                                key={cat.href}
                                href={cat.href}
                                onClick={() => setMobileOpen(false)}
                                className="block px-2 py-2.5 sm:py-1.5 text-xs text-[var(--apt-text-muted)]/50 hover:text-[var(--apt-text)] transition-colors"
                              >
                                {cat.name}
                              </Link>
                            ))}
                            <Link href={grp.href} onClick={() => setMobileOpen(false)} className="block px-2 py-1.5 text-xs font-semibold text-[var(--apt-color-primary)] hover:text-[var(--apt-color-primary)_/80] transition-colors">
                              All {grp.label} →
                            </Link>
                          </div>
                        )}
                      </div>
                    ))}
                    <Link href="/catalog" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-3 py-2.5 text-sm font-semibold text-[var(--apt-color-primary)] hover:text-[var(--apt-color-primary)_/80] mt-1">
                      Browse Catalogue
                      <Icon d="M17 8l4 4m0 0l-4 4m4-4H3" size={14} strokeWidth={2} />
                    </Link>
                  </div>
                )}
              </div>

              {/* Other nav links */}
              {[ ...NAV_LINKS, { label: "Request a Quote", href: "/rfq" } ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center px-3 py-3 text-sm font-medium text-[var(--apt-text-muted)]/60 hover:text-[var(--apt-text)] rounded-xl hover:bg-[var(--apt-bg-subtle)]/[0.06] transition-all"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Mobile footer actions */}
            <div className="p-4 border-t border-[var(--apt-border)]/[0.08] space-y-2">
              <Link href="/rfq" onClick={() => setMobileOpen(false)} className="flex items-center justify-center gap-2 w-full h-11 bg-[var(--apt-color-primary)] hover:bg-[var(--apt-color-primary)_/90] text-[var(--apt-text)] font-bold text-sm rounded-xl transition-colors">
                Request a Quote
              </Link>
              <div className="flex gap-2">
                <Link href="/account" onClick={() => setMobileOpen(false)} className="flex-1 flex items-center justify-center gap-2 h-10 bg-[var(--apt-bg-subtle)]/[0.06] hover:bg-[var(--apt-bg)]/[0.10] text-[var(--apt-text)]/70 hover:text-[var(--apt-text)] text-sm font-medium rounded-lg transition-all">
                  <Icon d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" size={16} />
                  Account
                </Link>
                <Link href="/cart" onClick={() => setMobileOpen(false)} className="flex-1 flex items-center justify-center gap-2 h-10 bg-[var(--apt-bg-subtle)]/[0.06] hover:bg-[var(--apt-bg)]/[0.10] text-[var(--apt-text)]/70 hover:text-[var(--apt-text)] text-sm font-medium rounded-lg transition-all">
                  <Icon d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" size={16} />
                  Cart
                </Link>
              </div>
              <a href="tel:+233303964346" className="flex items-center justify-center gap-2 text-[var(--apt-text-muted)]/30 hover:text-[var(--apt-text)]/60 transition-colors py-1">
                <Icon d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" size={13} strokeWidth={1.75} />
                +233 30 396 4346
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
