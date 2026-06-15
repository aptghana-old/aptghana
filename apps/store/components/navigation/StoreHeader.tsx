"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useTheme } from "./ThemeProvider";
import UserAccountButton from "./UserAccountButton";

/* ─── Mega menu data ─────────────────────────────────────────────────────── */
const MEGA_GROUPS = [
  {
    id: "electrical",
    label: "Electrical Solutions",
    color: "#1d4ed8",
    href: "/catalog/electrical-solutions",
    iconPath: "M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z",
    categories: [
      { name: "Circuit Breakers", desc: "MCBs, MCCBs & ACBs", href: "/catalog/electrical-solutions/circuit-protection-and-control" },
      { name: "Contactors & Starters", desc: "Motor contactors & DOL starters", href: "/catalog/electrical-solutions/contactors-and-starters" },
      { name: "Switchgear & Panels", desc: "Distribution boards & enclosures", href: "/catalog/electrical-solutions/switchgear-and-panels" },
      { name: "Control & Push Buttons", desc: "Pilot devices & indicators", href: "/catalog/electrical-solutions/control-and-push-buttons" },
      { name: "Cable & Wiring", desc: "Terminals, ducts & cable trays", href: "/catalog/electrical-solutions/cable-and-wiring" },
      { name: "Measurement", desc: "Current transformers & meters", href: "/catalog/electrical-solutions/measurement-and-monitoring" },
    ],
    featured: { name: "Schneider Electric", tag: "Authorized Partner", href: "/brands/schneider-electric", desc: "Complete electrical infrastructure solutions" },
  },
  {
    id: "automation",
    label: "Automation & Control",
    color: "#0369a1",
    href: "/catalog/automation-and-control",
    iconPath: "M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z",
    categories: [
      { name: "PLCs & Controllers", desc: "Programmable logic controllers", href: "/catalog/automation-and-control/plcs-and-controllers" },
      { name: "HMI & Displays", desc: "Human-machine interfaces", href: "/catalog/automation-and-control/hmi-and-displays" },
      { name: "Variable Speed Drives", desc: "AC & DC variable frequency drives", href: "/catalog/automation-and-control/variable-speed-drives" },
      { name: "Sensors & Detection", desc: "Proximity, photo & level sensors", href: "/catalog/automation-and-control/sensors-and-detection" },
      { name: "Motors & Gearboxes", desc: "IE3 motors & speed reducers", href: "/catalog/automation-and-control/motors-and-gearboxes" },
      { name: "Industrial Networks", desc: "Ethernet, PROFIBUS & MODBUS", href: "/catalog/automation-and-control/industrial-networks" },
    ],
    featured: { name: "WEG", tag: "Preferred Distributor", href: "/brands/weg", desc: "World-class motors, drives & automation" },
  },
  {
    id: "pneumatics",
    label: "Pneumatic Systems",
    color: "#0891b2",
    href: "/catalog/pneumatic-systems",
    iconPath: "M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z",
    categories: [
      { name: "Cylinders & Actuators", desc: "ISO, mini & compact cylinders", href: "/catalog/pneumatic-systems/cylinders-and-actuators" },
      { name: "Directional Valves", desc: "5/2, 5/3 & solenoid valves", href: "/catalog/pneumatic-systems/directional-valves" },
      { name: "FRL Units", desc: "Filters, regulators & lubricators", href: "/catalog/pneumatic-systems/frl-units" },
      { name: "Fittings & Tubing", desc: "Push-in fittings & flexible tubing", href: "/catalog/pneumatic-systems/fittings-and-tubing" },
      { name: "Air Treatment", desc: "Dryers, filters & separators", href: "/catalog/pneumatic-systems/air-treatment" },
      { name: "Vacuum Technology", desc: "Vacuum generators & cups", href: "/catalog/pneumatic-systems/vacuum-technology" },
    ],
    featured: { name: "Camozzi", tag: "Exclusive Distributor", href: "/brands/camozzi", desc: "Precision Italian pneumatic engineering" },
  },
  {
    id: "conveying",
    label: "Conveying Solutions",
    color: "#7c3aed",
    href: "/catalog/conveying-solutions",
    iconPath: "M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5",
    categories: [
      { name: "Conveyor Belts", desc: "Rubber & PVC conveyor belting", href: "/catalog/conveying-solutions/conveyor-belts" },
      { name: "Rollers & Idlers", desc: "Carrying & return idler sets", href: "/catalog/conveying-solutions/rollers-and-idlers" },
      { name: "Chains & Sprockets", desc: "Roller chains & conveyor chains", href: "/catalog/conveying-solutions/chains-and-sprockets" },
      { name: "Pulleys & Bearings", desc: "Drive pulleys & self-aligning bearings", href: "/catalog/conveying-solutions/pulleys-and-bearings" },
      { name: "Drive Components", desc: "Gear motors & belt drives", href: "/catalog/conveying-solutions/drive-components" },
    ],
    featured: { name: "ABB", tag: "Authorized Partner", href: "/brands/abb", desc: "Drives & motors for material handling" },
  },
  {
    id: "power",
    label: "Power & Energy",
    color: "#d97706",
    href: "/catalog/power-and-energy",
    iconPath: "M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z",
    categories: [
      { name: "UPS Systems", desc: "Online & offline UPS solutions", href: "/catalog/power-and-energy/ups-systems" },
      { name: "Transformers", desc: "Dry-type & oil-filled transformers", href: "/catalog/power-and-energy/transformers" },
      { name: "Power Quality", desc: "Harmonic filters & power factor correction", href: "/catalog/power-and-energy/power-quality" },
      { name: "Energy Metering", desc: "Smart meters & power analyzers", href: "/catalog/power-and-energy/energy-metering" },
      { name: "Surge Protection", desc: "SPDs for all applications", href: "/catalog/power-and-energy/surge-protection" },
    ],
    featured: { name: "Eaton", tag: "Authorized Partner", href: "/brands/eaton", desc: "Intelligent power management solutions" },
  },
  {
    id: "safety",
    label: "Safety Systems",
    color: "#dc2626",
    href: "/catalog/safety-systems",
    iconPath: "M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z",
    categories: [
      { name: "Emergency Stop Devices", desc: "Push buttons & rope pull switches", href: "/catalog/safety-systems/emergency-stop-devices" },
      { name: "Safety Relays", desc: "Safety monitoring modules", href: "/catalog/safety-systems/safety-relays" },
      { name: "Light Curtains", desc: "Type 2 & Type 4 safety light curtains", href: "/catalog/safety-systems/light-curtains" },
      { name: "Safety Switches", desc: "Interlocking & solenoid switches", href: "/catalog/safety-systems/safety-switches" },
      { name: "Safety Controllers", desc: "Configurable safety controllers", href: "/catalog/safety-systems/safety-controllers" },
    ],
    featured: { name: "Phoenix Contact", tag: "Authorized Partner", href: "/brands/phoenix-contact", desc: "Comprehensive industrial safety systems" },
  },
];

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

/* ─── Theme dropdown ─────────────────────────────────────────────────────── */
const THEME_OPTIONS = [
  {
    value: "light"  as const,
    label: "Light",
    iconD: "M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z",
  },
  {
    value: "dark"   as const,
    label: "Dark",
    iconD: "M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z",
  },
  {
    value: "system" as const,
    label: "System",
    iconD: "M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25A2.25 2.25 0 0 1 5.25 3h13.5A2.25 2.25 0 0 1 21 5.25Z",
  },
] as const;

function ThemeDropdown() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);

  const current = THEME_OPTIONS.find((o) => o.value === theme) ?? THEME_OPTIONS[2];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((p) => !p)}
        aria-label={`Theme: ${current.label}`}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="flex items-center gap-1.5 p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-all"
      >
        <Icon d={current.iconD} size={18} strokeWidth={2} />
        <span className="hidden lg:block text-[11px] font-medium">{current.label}</span>
        <Icon
          d="M19.5 8.25l-7.5 7.5-7.5-7.5"
          size={11}
          strokeWidth={2.5}
          className={`transition-transform duration-150 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Select theme"
          className="absolute right-0 top-full mt-1.5 w-36 bg-navy-900/97 backdrop-blur-xl border border-white/[0.1] rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] overflow-hidden z-50 mega-enter"
        >
          {THEME_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              role="option"
              aria-selected={theme === opt.value}
              onClick={() => { setTheme(opt.value); setOpen(false); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-[13px] font-medium transition-colors ${
                theme === opt.value
                  ? "text-white bg-white/[0.07]"
                  : "text-white/60 hover:text-white hover:bg-white/[0.05]"
              }`}
            >
              <Icon d={opt.iconD} size={15} strokeWidth={2} className={theme === opt.value ? "text-navy-300" : "text-white/30"} />
              {opt.label}
              {theme === opt.value && (
                <Icon d="M4.5 12.75l6 6 9-13.5" size={13} strokeWidth={2.5} className="ml-auto text-navy-300" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Header component ───────────────────────────────────────────────────── */
type DisplayGroup = typeof MEGA_GROUPS[number];

function adaptNavGroups(navGroups: import("@/app/layout").NavGroup[]): DisplayGroup[] {
  return navGroups.map((g) => ({
    id: g.id,
    label: g.label,
    color: g.color,
    href: g.href,
    iconPath: g.iconPath,
    categories: g.categories.map((c) => ({
      name: c.name,
      desc: c.desc ?? "",
      href: c.href,
      subcategories: (c.subcategories ?? []).map((s) => ({ name: s.name, slug: s.slug, href: s.href })),
    })),
    featured: g.featured,
  }));
}

export default function StoreHeader({ navGroups }: { navGroups?: import("@/app/layout").NavGroup[] }) {
  const displayGroups: DisplayGroup[] = navGroups?.length ? adaptNavGroups(navGroups) : MEGA_GROUPS;
  const [megaOpen, setMegaOpen] = useState(false);
  const [activeGroup, setActiveGroup] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileGroup, setMobileGroup] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const [cartCount] = useState(0);
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
  }, [mobileOpen]);

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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`;
  };

  const group = displayGroups[activeGroup];

  return (
    <>
      <header
        ref={headerRef}
        className={`sticky top-0 z-50 transition-shadow duration-200 ${scrolled ? "shadow-[0_4px_24px_rgba(0,0,0,0.4)]" : ""}`}
      >
        {/* Announcement bar */}
        <div className="bg-apt-orange text-white text-center text-[11px] font-medium py-1.5 tracking-wide">
          Free technical support with every order &nbsp;·&nbsp;
          <a href="tel:+233303964346" className="underline underline-offset-2 hover:no-underline">+233 30 396 4346</a>
          &nbsp;·&nbsp; Same-day quotation before 3 PM
        </div>

        {/* Main header row */}
        <div className="bg-navy-900">
          <div className="container-store">
            <div className="flex items-center gap-3 h-[60px]">

              {/* Logo */}
              <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
                <div className="w-9 h-9 rounded-xl bg-apt-orange flex items-center justify-center text-white font-black text-xs tracking-tighter shrink-0 group-hover:bg-apt-orange-hover transition-colors">
                  APT
                </div>
                <div className="hidden sm:block leading-none">
                  <div className="text-white font-bold text-sm">APT Ghana</div>
                  <div className="text-white/35 text-[9px] uppercase tracking-widest font-semibold mt-0.5">Industrial Store</div>
                </div>
              </Link>

              {/* Search bar */}
              <form onSubmit={handleSearch} className="flex-1 flex max-w-2xl mx-auto">
                <div className="flex w-full rounded-xl overflow-hidden shadow-lg shadow-black/20 ring-1 ring-white/10 focus-within:ring-navy-400/60 transition-shadow">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search products, brands, part numbers, SKUs..."
                    className="flex-1 h-11 px-4 bg-white/[0.07] text-sm text-white placeholder-white/30 focus:outline-none focus:bg-white/[0.10] transition-colors"
                    autoComplete="off"
                  />
                  <button
                    type="submit"
                    className="h-11 px-5 bg-navy-500 hover:bg-navy-400 text-white flex items-center gap-2 text-sm font-semibold shrink-0 transition-colors"
                  >
                    <Icon d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" size={17} strokeWidth={2.5} />
                    <span className="hidden sm:block">Search</span>
                  </button>
                </div>
              </form>

              {/* Actions */}
              <div className="flex items-center gap-0.5 shrink-0">
                <ThemeDropdown />
                <UserAccountButton />

                <Link
                  href="/cart"
                  className="relative p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                  aria-label="Cart"
                >
                  <Icon d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" size={20} />
                  {cartCount > 0 && (
                    <span className="absolute top-1 right-1 w-3.5 h-3.5 text-[9px] font-bold bg-apt-orange text-white rounded-full flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </Link>

                <Link
                  href="/rfq"
                  className="hidden sm:flex items-center gap-1.5 h-9 px-4 bg-apt-orange hover:bg-apt-orange-hover text-white text-[13px] font-bold rounded-lg ml-1 transition-colors shadow-md shadow-orange-900/30"
                >
                  <Icon d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25M9 16.5v.75m3-3v3M15 12v5.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" size={16} />
                  RFQ
                </Link>

                {/* Mobile hamburger */}
                <button
                  onClick={() => setMobileOpen(!mobileOpen)}
                  className="lg:hidden p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-lg ml-1 transition-all"
                  aria-label="Menu"
                >
                  {mobileOpen
                    ? <Icon d="M6 18L18 6M6 6l12 12" size={22} strokeWidth={2} />
                    : <Icon d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" size={22} strokeWidth={2} />
                  }
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop nav strip */}
        <div className="hidden lg:block bg-navy-800 border-t border-white/[0.05]">
          <div className="container-store">
            <nav
              className="flex items-center h-10 gap-0.5"
              onMouseLeave={delayedCloseMega}
            >
              {/* Catalogue trigger */}
              <button
                onMouseEnter={() => openMega(0)}
                onFocus={() => openMega(0)}
                onClick={() => { setMegaOpen(true); setActiveGroup(0); }}
                aria-expanded={megaOpen}
                aria-label="Catalogue menu"
                className={`group flex items-center gap-1 h-full px-3.5 text-[13px] font-medium rounded-md transition-colors ${megaOpen ? "text-white bg-white/10" : "text-white/60 hover:text-white hover:bg-white/[0.06]"}`}
              >
                Catalogue
                <Icon
                  d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                  size={14}
                  strokeWidth={2.5}
                  className={`transition-transform duration-200 ${megaOpen ? "rotate-180" : ""}`}
                />
              </button>

              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onMouseEnter={delayedCloseMega}
                  className="h-full px-3.5 flex items-center text-[13px] font-medium text-white/60 hover:text-white hover:bg-white/[0.06] rounded-md transition-colors"
                >
                  {link.label}
                </Link>
              ))}

              <div className="ml-auto flex items-center gap-3 text-[11px] text-white/30 font-medium">
                <span className="hidden xl:block">6,000+ Products</span>
                <span className="w-px h-3 bg-white/10 hidden xl:block" />
                <span>26 Global Brands</span>
                <span className="w-px h-3 bg-white/10" />
                <a href="tel:+233303964346" className="hover:text-white/60 transition-colors">+233 30 396 4346</a>
              </div>
            </nav>
          </div>
        </div>

        {/* Mega menu panel */}
        {megaOpen && (
          <div
            className="absolute left-0 right-0 top-full z-50 mega-panel"
            onMouseEnter={cancelCloseMega}
            onMouseLeave={delayedCloseMega}
          >
            <div className="container-store py-5">
              <div className="flex gap-6">

                {/* Left: group selector */}
                <div className="w-52 shrink-0 space-y-0.5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-theme-4 px-3 pb-1.5">Categories</p>
                  {displayGroups.map((grp, i) => (
                    <button
                      key={grp.id}
                      onMouseEnter={() => setActiveGroup(i)}
                      onClick={() => { window.location.href = grp.href; setMegaOpen(false); }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg text-left transition-all ${
                        activeGroup === i
                          ? "bg-navy-50 dark:bg-navy-900/60 font-semibold text-navy-900 dark:text-white"
                          : "text-theme-2 hover:bg-[var(--bg-raised)]"
                      }`}
                    >
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all"
                        style={{ background: activeGroup === i ? grp.color + "20" : "var(--bg-raised)" }}
                      >
                        <Icon d={grp.iconPath} size={15} strokeWidth={1.75} className={activeGroup === i ? "" : "text-theme-3"} style={{ color: activeGroup === i ? grp.color : undefined } as React.CSSProperties} />
                      </div>
                      <span className="truncate">{grp.label}</span>
                      {activeGroup === i && (
                        <Icon d="M8.25 4.5l7.5 7.5-7.5 7.5" size={14} strokeWidth={2.5} className="ml-auto shrink-0 text-navy-500" />
                      )}
                    </button>
                  ))}

                  <div className="pt-2 pb-1">
                    <Link
                      href="/catalog"
                      onClick={() => setMegaOpen(false)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-navy-500 hover:text-navy-400 transition-colors"
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
                  <p className="text-[10px] font-bold uppercase tracking-widest text-theme-4 mb-3" style={{ color: group.color }}>
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
                        <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 transition-all" style={{ background: group.color }} />
                        <div>
                          <p className="text-sm font-semibold text-theme-1 group-hover:text-navy-500 transition-colors leading-snug">{cat.name}</p>
                          <p className="text-xs text-theme-3 mt-0.5 leading-relaxed">{cat.desc}</p>
                        </div>
                      </Link>
                    ))}
                  </div>

                  {/* Quick actions */}
                  <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-theme">
                    <span className="text-[11px] text-theme-4 font-medium">Quick:</span>
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
                        className="px-3 py-1 rounded-full text-[11px] font-medium bg-[var(--bg-raised)] text-theme-2 hover:bg-navy-50 hover:text-navy-600 dark:hover:bg-navy-900/50 dark:hover:text-navy-300 transition-colors border border-theme"
                      >
                        {q.label}
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Right: featured brand */}
                <div className="w-56 shrink-0 hidden xl:block">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-theme-4 mb-3">Featured Partner</p>
                  <Link
                    href={group.featured.href}
                    onClick={() => setMegaOpen(false)}
                    className="block p-4 rounded-xl border border-theme hover:border-navy-500/40 hover:shadow-lg transition-all group bg-[var(--bg-raised)]"
                  >
                    <span className="inline-block px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest rounded-full mb-3" style={{ background: group.color + "15", color: group.color }}>
                      {group.featured.tag}
                    </span>
                    <p className="font-bold text-theme-1 group-hover:text-navy-500 transition-colors text-base mb-1">{group.featured.name}</p>
                    <p className="text-xs text-theme-3 leading-relaxed mb-4">{group.featured.desc}</p>
                    <span className="flex items-center gap-1 text-xs font-semibold text-navy-500">
                      View Products
                      <Icon d="M8.25 4.5l7.5 7.5-7.5 7.5" size={13} strokeWidth={2.5} className="group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </Link>

                  <Link
                    href="/brands"
                    onClick={() => setMegaOpen(false)}
                    className="flex items-center justify-between mt-3 px-4 py-2.5 rounded-xl border border-theme hover:border-apt-orange/40 bg-[var(--bg-raised)] transition-all group"
                  >
                    <span className="text-sm font-semibold text-theme-2 group-hover:text-apt-orange transition-colors">All 26 Brands</span>
                    <Icon d="M17 8l4 4m0 0l-4 4m4-4H3" size={15} strokeWidth={2} className="text-theme-3 group-hover:text-apt-orange transition-colors group-hover:translate-x-0.5" />
                  </Link>
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
          <div className="absolute left-0 top-0 bottom-0 w-[min(100vw,380px)] bg-navy-900 overflow-y-auto flex flex-col">

            {/* Mobile header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.08]">
              <Link href="/" onClick={() => setMobileOpen(false)} className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-apt-orange flex items-center justify-center text-white font-black text-xs">APT</div>
                <span className="text-white font-bold text-sm">APT Ghana Store</span>
              </Link>
              <button onClick={() => setMobileOpen(false)} className="p-1.5 text-white/50 hover:text-white rounded-lg hover:bg-white/10 transition-all">
                <Icon d="M6 18L18 6M6 6l12 12" size={20} strokeWidth={2} />
              </button>
            </div>

            {/* Mobile search */}
            <form onSubmit={(e) => { e.preventDefault(); setMobileOpen(false); if (searchQuery.trim()) window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`; }} className="px-4 py-3 border-b border-white/[0.06]">
              <div className="flex rounded-xl overflow-hidden ring-1 ring-white/10">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products..."
                  className="flex-1 h-11 px-4 bg-white/[0.06] text-sm text-white placeholder-white/30 focus:outline-none"
                />
                <button type="submit" className="h-11 px-4 bg-navy-500 text-white transition-colors">
                  <Icon d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" size={17} strokeWidth={2.5} />
                </button>
              </div>
            </form>

            {/* Mobile nav */}
            <nav className="flex-1 py-3 px-3">
              {/* Catalogue accordion */}
              <div>
                <button
                  onClick={() => setMobileGroup(mobileGroup === -1 ? null : -1)}
                  aria-expanded={mobileGroup === -1}
                  className="w-full flex items-center justify-between px-3 py-3 text-sm font-semibold text-white/80 hover:text-white rounded-xl hover:bg-white/[0.06] transition-all"
                >
                  Catalogue
                  <Icon d="M19.5 8.25l-7.5 7.5-7.5-7.5" size={16} strokeWidth={2.5} className={`transition-transform ${mobileGroup === -1 ? "rotate-180" : ""}`} />
                </button>

                {mobileGroup === -1 && (
                  <div className="ml-3 mt-1 space-y-0.5">
                    {displayGroups.map((grp, i) => (
                      <div key={grp.id}>
                        <button
                          onClick={() => setMobileGroup(i)}
                          className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-white/60 hover:text-white rounded-lg hover:bg-white/[0.06] transition-all"
                        >
                          <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0" style={{ background: grp.color + "25" }}>
                            <Icon d={grp.iconPath} size={13} strokeWidth={1.75} style={{ color: grp.color } as React.CSSProperties} />
                          </div>
                          <span className="flex-1 text-left">{grp.label}</span>
                          <Icon d="M8.25 4.5l7.5 7.5-7.5 7.5" size={13} strokeWidth={2} className="shrink-0 opacity-40" />
                        </button>

                        {mobileGroup === i && (
                          <div className="ml-4 mt-1 space-y-0.5 pl-3 border-l border-white/10">
                            {grp.categories.map((cat) => (
                              <Link
                                key={cat.href}
                                href={cat.href}
                                onClick={() => setMobileOpen(false)}
                                className="block px-2 py-1.5 text-xs text-white/50 hover:text-white transition-colors"
                              >
                                {cat.name}
                              </Link>
                            ))}
                            <Link href={grp.href} onClick={() => setMobileOpen(false)} className="block px-2 py-1.5 text-xs font-semibold text-navy-300 hover:text-white transition-colors">
                              All {grp.label} →
                            </Link>
                          </div>
                        )}
                      </div>
                    ))}
                    <Link href="/catalog" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-3 py-2.5 text-sm font-semibold text-apt-orange mt-1">
                      Browse Catalogue
                      <Icon d="M17 8l4 4m0 0l-4 4m4-4H3" size={14} strokeWidth={2} />
                    </Link>
                  </div>
                )}
              </div>

              {/* Other nav links */}
              {[...NAV_LINKS, { label: "Request a Quote", href: "/rfq" }].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center px-3 py-3 text-sm font-medium text-white/60 hover:text-white rounded-xl hover:bg-white/[0.06] transition-all"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Mobile footer actions */}
            <div className="p-4 border-t border-white/[0.08] space-y-2">
              <Link href="/rfq" onClick={() => setMobileOpen(false)} className="flex items-center justify-center gap-2 w-full h-11 bg-apt-orange hover:bg-apt-orange-hover text-white font-bold text-sm rounded-xl transition-colors">
                Request a Quote
              </Link>
              <div className="flex gap-2">
                <Link href="/account" onClick={() => setMobileOpen(false)} className="flex-1 flex items-center justify-center gap-2 h-10 bg-white/[0.06] hover:bg-white/[0.10] text-white/70 hover:text-white text-sm font-medium rounded-lg transition-all">
                  <Icon d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" size={16} />
                  Account
                </Link>
                <Link href="/cart" onClick={() => setMobileOpen(false)} className="flex-1 flex items-center justify-center gap-2 h-10 bg-white/[0.06] hover:bg-white/[0.10] text-white/70 hover:text-white text-sm font-medium rounded-lg transition-all">
                  <Icon d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" size={16} />
                  Cart
                </Link>
              </div>
              <a href="tel:+233303964346" className="flex items-center justify-center gap-2 text-xs text-white/30 hover:text-white/60 transition-colors py-1">
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
