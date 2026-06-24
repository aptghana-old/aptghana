"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { EMAIL_SALES, STORE_URL } from "@apt/config";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SolutionGroup {
  slug: string;
  name: string;
  description: string;
  image: { url: string; alt: string };
}

type MegaMenu = "solutions" | "industries" | "resources" | null;
type MobileSection = "solutions" | "industries" | "resources" | null;

// Passed from the server component (Header.tsx) — DB-driven
export interface NavIndustry { slug: string; name: string; desc: string; }
export interface NavResItem { label: string; desc: string; href: string; type: string; }

// ─── SVG helper ───────────────────────────────────────────────────────────────

function Svg({ children, size = 18 }: { children: React.ReactNode; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      {children}
    </svg>
  );
}

// ─── Solution icons ───────────────────────────────────────────────────────────

const IcoZap = () => (
  <Svg><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" /></Svg>
);

const IcoCpu = () => (
  <Svg>
    <rect x="4" y="4" width="16" height="16" rx="2" />
    <rect x="9" y="9" width="6" height="6" />
    <path d="M9 1v3M15 1v3M9 20v3M15 20v3M1 9h3M1 15h3M20 9h3M20 15h3" />
  </Svg>
);

const IcoGauge = () => (
  <Svg>
    <path d="M12 2a10 10 0 0 1 7.38 16.75" />
    <path d="M4.62 18.75A10 10 0 0 1 12 2" />
    <path d="m12 12-3.5-3.5" />
    <circle cx="12" cy="12" r="2" />
    <path d="M12 2v2M20 12h2M4 12H2" />
  </Svg>
);

const IcoTransformer = () => (
  <Svg>
    <path d="M2 20h20" />
    <path d="M6 20V8a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v12" />
    <path d="M18 20V4" />
    <circle cx="18" cy="4" r="1" fill="currentColor" stroke="none" />
    <circle cx="18" cy="20" r="1" fill="currentColor" stroke="none" />
    <path d="M6 14h8" />
  </Svg>
);

const IcoAir = () => (
  <Svg>
    <path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2" />
    <path d="M9.6 4.6A2 2 0 1 1 11 8H2" />
    <path d="M12.6 19.4A2 2 0 1 0 14 16H2" />
  </Svg>
);

const IcoShieldCheck = () => (
  <Svg>
    <path d="M12 2 3 7v6c0 5.25 4 8.75 9 10 5-1.25 9-4.75 9-10V7l-9-5z" />
    <path d="m9 12 2 2 4-4" />
  </Svg>
);

const IcoConveyor = () => (
  <Svg>
    <rect x="2" y="8" width="20" height="8" rx="2" />
    <circle cx="6" cy="19" r="2" />
    <circle cx="18" cy="19" r="2" />
    <path d="M6 17V8M18 17V8" />
    <path d="M8 12h8" />
  </Svg>
);

const IcoMotor = () => (
  <Svg>
    <circle cx="12" cy="12" r="8" />
    <circle cx="12" cy="12" r="3" />
    <path d="M12 4V2M12 22v-2M4 12H2M22 12h-2" />
    <path d="m6.34 6.34-1.42-1.42m14.14 14.14-1.42-1.42M6.34 17.66l-1.42 1.42m14.14-14.14-1.42 1.42" />
  </Svg>
);

// ─── Industry icons ───────────────────────────────────────────────────────────

const IcoMining = () => (
  <Svg>
    <path d="M2.97 12.92A2 2 0 0 0 2 14.63v3.24a2 2 0 0 0 .97 1.71l3 1.8a2 2 0 0 0 2.06 0L12 19l4.02 2.38a2 2 0 0 0 2.04-.02l2.94-1.77a2 2 0 0 0 .98-1.71v-3.23a2 2 0 0 0-.98-1.72l-3.96-2.34a2 2 0 0 0-2.06 0l-4 2.36a2 2 0 0 1-2.06 0l-3.98-2.35Z" />
    <path d="m7 16.5 4.83-2.83M12 19v-5M17 16.5l-4.83-2.83M3 14l9-5.5 9 5.5" />
  </Svg>
);

const IcoOilGas = () => (
  <Svg>
    <path d="M12 22c-4.2 0-7.5-3.8-7.5-8.5 0-3.3 2.5-5.8 4.5-7.5 0 3 2.5 4.5 4.5 4.5-1-3 1.5-6 3-7.5 0 4.5 3 7.5 3 10.5 0 4.7-3.3 8.5-7.5 8.5z" />
  </Svg>
);

const IcoManufacturing = () => (
  <Svg>
    <path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
    <path d="M17 18h1v-2h-1v2zm-4 0h1v-2h-1v2zm-4 0h1v-2H9v2z" />
  </Svg>
);

const IcoPower = () => (
  <Svg><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" /></Svg>
);

const IcoWater = () => (
  <Svg>
    <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5S12.5 5 12 2.5C11.5 5 9 7.9 7 9.5S5 13 5 15a7 7 0 0 0 7 7z" />
  </Svg>
);

const IcoPorts = () => (
  <Svg>
    <circle cx="12" cy="5" r="3" />
    <line x1="12" y1="8" x2="12" y2="20" />
    <path d="M5 12H2a10 10 0 0 0 20 0h-3" />
  </Svg>
);

const IcoFood = () => (
  <Svg>
    <path d="M11 2a2 2 0 0 0-2 2v5H7V4a2 2 0 0 0-4 0v6a4 4 0 0 0 3 3.87V22h2v-8.13A4 4 0 0 0 11 10V4a2 2 0 0 0-2-2h2zm6 0v9h3V2h-3zm0 9v11h3V11h-3z" />
  </Svg>
);

const IcoConstruction = () => (
  <Svg>
    <rect width="16" height="10" x="4" y="12" rx="1" />
    <path d="M12 12V6M8 6H4M20 6h-4M8 6a4 4 0 0 1 8 0" />
    <path d="M10 16h4M7 16v2M17 16v2" />
  </Svg>
);

// ─── Resource icons ───────────────────────────────────────────────────────────

const IcoFileText = () => (
  <Svg>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
  </Svg>
);

const IcoGraduationCap = () => (
  <Svg>
    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
    <path d="M6 12v5c3.53 1.84 8.47 1.84 12 0v-5" />
  </Svg>
);

const IcoDraftingCompass = () => (
  <Svg>
    <circle cx="12" cy="5" r="2" />
    <path d="m3 21 8.02-14.26" />
    <path d="m20.77 21-5.23-9.28" />
    <path d="M12.99 15.73 10.5 21" />
    <path d="m16.5 6-9 5.2" />
  </Svg>
);

const IcoBarChart = () => (
  <Svg>
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </Svg>
);

const IcoNewspaper = () => (
  <Svg>
    <path d="M4 3h16a1 1 0 0 1 1 1v13a2 2 0 0 1-2 2H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
    <path d="M8 7h8M8 11h8M8 15h5" />
  </Svg>
);

const IcoImages = () => (
  <Svg>
    <rect width="18" height="18" x="3" y="3" rx="2" />
    <circle cx="9" cy="9" r="2" />
    <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
  </Svg>
);

const IcoHeadphones = () => (
  <Svg>
    <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
    <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
  </Svg>
);

const IcoClipboard = () => (
  <Svg>
    <rect width="8" height="4" x="8" y="2" rx="1" />
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <path d="M12 11h4M12 16h4M8 11h.01M8 16h.01" />
  </Svg>
);

const IcoMessageCircle = () => (
  <Svg><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22z" /></Svg>
);

// ─── Nav icons ────────────────────────────────────────────────────────────────

const IcoChevronDown = ({ open }: { open: boolean }) => (
  <svg
    className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
);

const IcoArrowRight = () => (
  <Svg size={14}><path d="M5 12h14M12 5l7 7-7 7" /></Svg>
);

const IcoCheck = () => (
  <Svg size={13}><path d="M20 6 9 17l-5-5" /></Svg>
);

// ─── Solutions data ───────────────────────────────────────────────────────────

interface SolutionCard {
  slug: string;
  name: string;
  desc: string;
  icon: React.ReactNode;
  img?: { url: string; alt: string };
  bg: string;
  text: string;
  chips: string[];
}

/* ─── Static solution cards removed — nav now uses DB-only data ─── */

// Meta augmentation for DB groups (keyed by slug)
const SOLUTION_META: Record<string, Omit<SolutionCard, "slug" | "name" | "desc">> = {
  electrical: { icon: <IcoZap />, bg: "bg-yellow-50 dark:bg-yellow-950/30", text: "text-yellow-600 dark:text-yellow-400", chips: [ "Switchgear", "MCCBs", "Metering" ] },
  automation: { icon: <IcoCpu />, bg: "bg-blue-50 dark:bg-blue-950/30", text: "text-blue-600 dark:text-blue-400", chips: [ "PLCs", "HMIs", "SCADA" ] },
  drives: { icon: <IcoGauge />, bg: "bg-indigo-50 dark:bg-indigo-950/30", text: "text-indigo-600 dark:text-indigo-400", chips: [ "VFDs", "Soft Starters" ] },
  power: { icon: <IcoTransformer />, bg: "bg-orange-50 dark:bg-orange-950/30", text: "text-orange-600 dark:text-orange-400", chips: [ "Transformers", "UPS" ] },
  pneumatics: { icon: <IcoAir />, bg: "bg-sky-50 dark:bg-sky-950/30", text: "text-sky-600 dark:text-sky-400", chips: [ "Valves", "Cylinders" ] },
  safety: { icon: <IcoShieldCheck />, bg: "bg-red-50 dark:bg-red-950/30", text: "text-red-500 dark:text-red-400", chips: [ "Safety Relays", "E-Stops" ] },
  conveying: { icon: <IcoConveyor />, bg: "bg-amber-50 dark:bg-amber-950/30", text: "text-amber-600 dark:text-amber-400", chips: [ "Conveyor Drives", "Rollers" ] },
  motors: { icon: <IcoMotor />, bg: "bg-green-50 dark:bg-green-950/30", text: "text-green-600 dark:text-green-400", chips: [ "IE2/IE3 Motors", "Servos" ] },
};
const SOLUTION_META_DEFAULT: Omit<SolutionCard, "slug" | "name" | "desc"> = {
  icon: <IcoZap />, bg: "bg-slate-100 dark:bg-slate-800/40", text: "text-slate-600 dark:text-slate-300", chips: [],
};

// ─── Industry data ────────────────────────────────────────────────────────────

interface Industry { label: string; desc: string; href: string; bg: string; text: string; icon: React.ReactNode; }

// Icon/color map keyed by slug — Tailwind classes must be statically defined
const INDUSTRY_META: Record<string, { icon: React.ReactNode; bg: string; text: string }> = {
  "mining": { icon: <IcoMining />, bg: "bg-amber-50 dark:bg-amber-950/30", text: "text-amber-600 dark:text-amber-400" },
  "oil-gas": { icon: <IcoOilGas />, bg: "bg-orange-50 dark:bg-orange-950/30", text: "text-orange-600 dark:text-orange-400" },
  "manufacturing": { icon: <IcoManufacturing />, bg: "bg-blue-50 dark:bg-blue-950/30", text: "text-blue-600 dark:text-blue-400" },
  "energy": { icon: <IcoPower />, bg: "bg-yellow-50 dark:bg-yellow-950/30", text: "text-yellow-600 dark:text-yellow-500" },
  "water": { icon: <IcoWater />, bg: "bg-cyan-50 dark:bg-cyan-950/30", text: "text-cyan-600 dark:text-cyan-400" },
  "ports": { icon: <IcoPorts />, bg: "bg-indigo-50 dark:bg-indigo-950/30", text: "text-indigo-600 dark:text-indigo-400" },
  "food-beverage": { icon: <IcoFood />, bg: "bg-green-50 dark:bg-green-950/30", text: "text-green-600 dark:text-green-400" },
  "construction": { icon: <IcoConstruction />, bg: "bg-slate-100 dark:bg-slate-800/40", text: "text-slate-600 dark:text-slate-300" },
};
const INDUSTRY_META_DEFAULT = {
  icon: <IcoManufacturing />, bg: "bg-slate-100 dark:bg-slate-800/40", text: "text-slate-600 dark:text-slate-300",
};

/* ─── Static industry fallback removed — nav now uses DB-only data ─── */

// ─── Resource data ────────────────────────────────────────────────────────────

interface ResourceItem { label: string; desc: string; href: string; icon: React.ReactNode; }
interface ResourceGroup { heading: string; accent: string; items: ResourceItem[]; }

// Icon map keyed by resource type (code-defined)
const RESOURCE_ICON_MAP: Record<string, React.ReactNode> = {
  "library": <IcoFileText />,
  "training": <IcoGraduationCap />,
  "cad": <IcoDraftingCompass />,
  "case-studies": <IcoBarChart />,
  "news": <IcoNewspaper />,
  "projects": <IcoImages />,
  "certifications": <IcoFileText />,
  "other": <IcoFileText />,
};

// Maps resource types to the two dynamic nav groups
const RES_GROUP_CONFIG: { heading: string; accent: string; types: string[] }[] = [
  { heading: "Technical Resources", accent: "text-blue-500", types: [ "library", "training", "cad", "certifications" ] },
  { heading: "Knowledge Hub", accent: "text-[#84CC16]", types: [ "case-studies", "news", "projects", "other" ] },
];

// Get Support is always hardcoded — these are contact actions, not DB resource pages
const SUPPORT_GROUP: ResourceGroup = {
  heading: "Get Support",
  accent: "text-purple-500",
  items: [
    { label: "Technical Support", desc: "Speak with a certified product specialist", href: "/contact?type=technical", icon: <IcoHeadphones /> },
    { label: "Request a Quote", desc: "Formal quotation with pricing & lead times", href: STORE_URL + "/rfq", icon: <IcoClipboard /> },
    { label: "WhatsApp Us", desc: "+233 30 396 4346 — instant response", href: "https://wa.me/233303964346", icon: <IcoMessageCircle /> },
  ],
};

/* ─── Static resource groups removed — nav now uses DB-only data ─── */

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  groups: SolutionGroup[];
  navIndustries: NavIndustry[];
  navResItems: NavResItem[];
}

export default function HeaderClient({ groups, navIndustries, navResItems }: Props) {
  const [ scrolled, setScrolled ] = useState(false);
  const [ activeMenu, setActiveMenu ] = useState<MegaMenu>(null);
  const [ mobileOpen, setMobileOpen ] = useState(false);
  const [ mobileSection, setMobileSection ] = useState<MobileSection>(null);
  const [ hoveredSol, setHoveredSol ] = useState<string | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Solutions: DB groups enriched with icon/color meta
  const displaySolutions: SolutionCard[] = groups.map((g) => {
    const meta = SOLUTION_META[ g.slug ] ?? SOLUTION_META_DEFAULT;
    return { slug: g.slug, name: g.name, desc: g.description, img: g.image, ...meta };
  });

  // Active featured solution (hovered or first)
  const activeFeat = displaySolutions.find((s) => s.slug === hoveredSol) ?? displaySolutions[ 0 ];

  // Industries: DB docs enriched with icon/color
  const displayIndustries: Industry[] = navIndustries.map((ind) => ({
    label: ind.name,
    desc: ind.desc,
    href: `/industries/${ind.slug}`,
    ...(INDUSTRY_META[ ind.slug ] ?? INDUSTRY_META_DEFAULT),
  }));

  // Resources: group DB items by type, always append hardcoded Support group
  const dynamicResGroups: ResourceGroup[] = RES_GROUP_CONFIG
    .map((cfg) => ({
      heading: cfg.heading,
      accent: cfg.accent,
      items: navResItems
        .filter((r) => cfg.types.includes(r.type))
        .map((r) => ({ label: r.label, desc: r.desc, href: r.href, icon: RESOURCE_ICON_MAP[ r.type ] ?? <IcoFileText /> })),
    }))
    .filter((g) => g.items.length > 0);
  const displayResGroups: ResourceGroup[] = [ ...dynamicResGroups, SUPPORT_GROUP ];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setActiveMenu(null); setMobileOpen(false); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const openMenu = (m: MegaMenu) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setActiveMenu(m);
  };
  const scheduleClose = () => {
    closeTimer.current = setTimeout(() => setActiveMenu(null), 120);
  };

  const navBtn = (menu: MegaMenu) =>
    `relative flex items-center gap-1 px-3 py-2 text-sm font-medium transition-colors duration-150 rounded-md cursor-pointer select-none ${activeMenu === menu
      ? "text-[#0F172A] dark:text-white bg-[#F1F5F9] dark:bg-white/10"
      : "text-[#475569] dark:text-white/80 hover:text-[#0F172A] dark:hover:text-white hover:bg-[#F1F5F9] dark:hover:bg-white/10"
    }`;

  const toggleMobile = (s: MobileSection) =>
    setMobileSection((p) => (p === s ? null : s));

  return (
    <>
      {/* Backdrop */}
      {activeMenu && (
        <div
          className="fixed inset-0 z-40 bg-black/20 dark:bg-black/40 backdrop-blur-[2px]"
          style={{ top: "105px" }}
          onClick={() => setActiveMenu(null)}
          aria-hidden="true"
        />
      )}

      <header
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled
          ? "bg-white/95 dark:bg-[#080f1e]/97 backdrop-blur-md shadow-sm dark:shadow-[0_1px_0_0_rgba(255,255,255,.05)]"
          : "bg-white dark:bg-[#080f1e]"
          } border-b border-[#E2E8F0] dark:border-white/6`}
        onMouseLeave={scheduleClose}
        onMouseEnter={() => { if (closeTimer.current) clearTimeout(closeTimer.current); }}
      >
        {/* Top info bar */}
        <div className="border-b border-[#E2E8F0] dark:border-white/5 bg-[#F8FAFC] dark:bg-[#0a0f1e]">
          <div className="container-apt flex items-center justify-between h-9 text-xs text-[#64748B] dark:text-white/40">
            <span className="hidden sm:block">West Africa&apos;s Leading Industrial Technology Platform</span>
            <span className="sm:hidden">APT Ghana Industrial Solutions</span>
            <div className="hidden md:flex items-center gap-6">
              <a href="tel:+233303964346" className="hover:text-[#0F172A] dark:hover:text-white/70 transition-colors">+233 30 396 4346</a>
              <a href={`mailto:${EMAIL_SALES}`} className="hover:text-[#0F172A] dark:hover:text-white/70 transition-colors">{EMAIL_SALES}</a>
              <Link href={STORE_URL + "/rfq"} className="text-[#84CC16] hover:text-[#78B800] font-medium transition-colors">Get a Quote</Link>
            </div>
          </div>
        </div>

        {/* Main nav */}
        <div className="container-apt">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center shrink-0">
              <Image src="/images/logo.png" alt="APT Ghana" width={140} height={69}
                className="h-10 w-auto object-contain dark:invert" priority />
            </Link>

            {/* Desktop nav */}
            <nav className="hidden lg:flex items-center gap-0.5" role="navigation" aria-label="Main navigation">
              <button className={navBtn("solutions")}
                onMouseEnter={() => openMenu("solutions")}
                onClick={() => setActiveMenu(activeMenu === "solutions" ? null : "solutions")}
                aria-expanded={activeMenu === "solutions"} aria-haspopup="true">
                Solutions <IcoChevronDown open={activeMenu === "solutions"} />
              </button>
              <button className={navBtn("industries")}
                onMouseEnter={() => openMenu("industries")}
                onClick={() => setActiveMenu(activeMenu === "industries" ? null : "industries")}
                aria-expanded={activeMenu === "industries"} aria-haspopup="true">
                Industries <IcoChevronDown open={activeMenu === "industries"} />
              </button>
              <Link href="/brands" className="px-3 py-2 text-sm font-medium text-[#475569] dark:text-white/80 hover:text-[#0F172A] dark:hover:text-white hover:bg-[#F1F5F9] dark:hover:bg-white/10 transition-colors rounded-md" onMouseEnter={() => openMenu(null)}>Brands</Link>
              <Link href="/services" className="px-3 py-2 text-sm font-medium text-[#475569] dark:text-white/80 hover:text-[#0F172A] dark:hover:text-white hover:bg-[#F1F5F9] dark:hover:bg-white/10 transition-colors rounded-md" onMouseEnter={() => openMenu(null)}>Services</Link>
              <button className={navBtn("resources")}
                onMouseEnter={() => openMenu("resources")}
                onClick={() => setActiveMenu(activeMenu === "resources" ? null : "resources")}
                aria-expanded={activeMenu === "resources"} aria-haspopup="true">
                Resources <IcoChevronDown open={activeMenu === "resources"} />
              </button>
              <Link href="/company" className="px-3 py-2 text-sm font-medium text-[#475569] dark:text-white/80 hover:text-[#0F172A] dark:hover:text-white hover:bg-[#F1F5F9] dark:hover:bg-white/10 transition-colors rounded-md" onMouseEnter={() => openMenu(null)}>Company</Link>
            </nav>

            {/* Desktop CTAs */}
            <div className="hidden lg:flex items-center gap-2">
              <Link href={STORE_URL + "/rfq"} className="px-4 py-2 text-sm font-semibold text-[#0A0F1E] bg-[#84CC16] rounded-lg hover:bg-[#78B800] transition-colors">Request Quote</Link>
              <Link href={STORE_URL} className="px-4 py-2 text-sm font-semibold text-[#475569] dark:text-white border border-[#E2E8F0] dark:border-white/20 rounded-lg hover:bg-[#F1F5F9] dark:hover:bg-white/5 hover:border-[#CBD5E0] dark:hover:border-white/40 transition-all">Shop Online →</Link>
            </div>

            {/* Mobile controls */}
            <div className="lg:hidden flex items-center gap-1">
              <button
                className="p-2 text-[#475569] dark:text-white/80 hover:text-[#0F172A] dark:hover:text-white"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label="Toggle navigation menu" aria-expanded={mobileOpen}
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  {mobileOpen
                    ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════════
            SOLUTIONS MEGA MENU — Enterprise redesign
        ══════════════════════════════════════════════════════════════════════ */}
        {activeMenu === "solutions" && (
          <div
            className="absolute inset-x-0 top-full bg-white dark:bg-[#080f1e] border-t border-[#E2E8F0] dark:border-white/6 shadow-xl dark:shadow-[0_8px_40px_rgba(0,0,0,.4)] animate-mega-menu"
            onMouseEnter={() => openMenu("solutions")}
            role="dialog"
            aria-label="Solutions navigation"
          >
            <div className="container-apt py-8">

              {/* Section eyebrow */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-0.5 rounded-full bg-[#84CC16]" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#84CC16]">
                    Solutions & Capabilities
                  </span>
                </div>
                <span className="text-[11px] text-[#94A3B8] dark:text-white/30">
                  6,000+ products · 26+ global brands
                </span>
              </div>

              <div className="flex gap-6">
                {/* ── Left: 4-col capability card grid ── */}
                <div className="flex-1 min-w-0">
                  {displaySolutions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                      <p className="text-[13px] font-semibold text-[#0F172A]">Solutions are being configured</p>
                      <p className="text-[12px] text-[#94A3B8] mt-1">Visit the solutions page or contact us for more information.</p>
                      <Link href="/solutions" className="mt-3 text-[12px] font-semibold text-[#0057b8] hover:underline" onClick={() => setActiveMenu(null)}>
                        Browse Solutions →
                      </Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 gap-1.5">
                      {displaySolutions.map((sol) => (
                        <Link
                          key={sol.slug}
                          href={`/solutions/${sol.slug}`}
                          className={`group relative flex gap-2.5 p-3.5 rounded-xl border transition-all duration-150 cursor-pointer
                            ${hoveredSol === sol.slug
                              ? "bg-[#F8FAFC] dark:bg-white/5 border-[#E2E8F0] dark:border-white/10 shadow-sm"
                              : "bg-transparent border-transparent hover:bg-[#F8FAFC] dark:hover:bg-white/4 hover:border-[#E2E8F0] dark:hover:border-white/7"
                            }`}
                          onMouseEnter={() => setHoveredSol(sol.slug)}
                          onMouseLeave={() => setHoveredSol(null)}
                          onClick={() => setActiveMenu(null)}
                          aria-current={hoveredSol === sol.slug ? "true" : undefined}
                        >
                          {hoveredSol === sol.slug && (
                            <span className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full bg-[#84CC16]" aria-hidden="true" />
                          )}
                          <div className={`size-12 rounded-lg flex items-center justify-center shrink-0 transition-all duration-150 ${sol.bg} ${sol.text} group-hover:scale-110`}>
                            {sol.img ? <Image src={sol.img.url} alt={sol.img.alt} width={40} height={40} className="size-10 object-contain" /> : sol.icon}
                          </div>
                          <div>
                            <div className={`text-[13px] font-semibold leading-tight transition-colors duration-150 ${hoveredSol === sol.slug
                              ? "text-[#0057b8] dark:text-[#84CC16]"
                              : "text-[#0F172A] dark:text-white/90 group-hover:text-[#0057b8] dark:group-hover:text-[#84CC16]"
                              }`}>
                              {sol.name}
                            </div>
                            <div className="text-[11px] text-[#94A3B8] dark:text-white/40 mt-0.5 leading-relaxed line-clamp-2">
                              {sol.desc}
                            </div>
                          </div>
                          {sol.chips.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-auto pt-1">
                              {sol.chips.slice(0, 2).map((chip) => (
                                <span key={chip} className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#F1F5F9] dark:bg-white/6 text-[#64748B] dark:text-white/40 leading-none">
                                  {chip}
                                </span>
                              ))}
                            </div>
                          )}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* ── Footer action strip ── */}
              <div className="mt-5 pt-4 border-t border-[#E2E8F0] dark:border-white/6 flex items-center justify-between">
                <div className="flex items-center gap-1 flex-wrap">
                  <Link
                    href="/solutions"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold text-[#0057b8] dark:text-[#60a5fa] hover:bg-[#F1F5F9] dark:hover:bg-white/5 rounded-lg transition-colors"
                    onClick={() => setActiveMenu(null)}
                  >
                    Browse All Solutions
                  </Link>
                  <span className="text-[#E2E8F0] dark:text-white/10">·</span>
                  <Link
                    href="/solutions?filter=industry"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-[#475569] dark:text-white/50 hover:text-[#0F172A] dark:hover:text-white hover:bg-[#F1F5F9] dark:hover:bg-white/5 rounded-lg transition-colors"
                    onClick={() => setActiveMenu(null)}
                  >
                    Solutions by Industry
                  </Link>
                  <span className="text-[#E2E8F0] dark:text-white/10">·</span>
                  <Link
                    href="/brands"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-[#475569] dark:text-white/50 hover:text-[#0F172A] dark:hover:text-white hover:bg-[#F1F5F9] dark:hover:bg-white/5 rounded-lg transition-colors"
                    onClick={() => setActiveMenu(null)}
                  >
                    Browse by Brand
                  </Link>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href="/contact?type=sales"
                    className="flex items-center gap-2 px-4 py-1.5 text-[12px] font-medium text-[#475569] dark:text-white/60 border border-[#E2E8F0] dark:border-white/15 hover:bg-[#F8FAFC] dark:hover:bg-white/5 rounded-lg transition-colors"
                    onClick={() => setActiveMenu(null)}
                  >
                    Contact Sales
                  </Link>
                  <Link
                    href={STORE_URL + "/rfq"}
                    className="flex items-center gap-2 px-4 py-1.5 text-[12px] font-semibold text-white bg-[#0057b8] hover:bg-[#0046a0] rounded-lg transition-colors"
                    onClick={() => setActiveMenu(null)}
                  >
                    Get a Quote
                    <IcoArrowRight />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            INDUSTRIES MEGA MENU
        ══════════════════════════════════════════════════════════════════════ */}
        {activeMenu === "industries" && (
          <div
            className="absolute inset-x-0 top-full bg-white dark:bg-[#080f1e] border-t border-[#E2E8F0] dark:border-white/6 shadow-xl dark:shadow-[0_8px_40px_rgba(0,0,0,.4)] animate-mega-menu"
            onMouseEnter={() => openMenu("industries")}
            role="dialog"
            aria-label="Industries navigation"
          >
            <div className="container-apt py-8">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-4 h-0.5 rounded-full bg-[#84CC16]" />
                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#84CC16]">Industries We Serve</span>
              </div>

              <div className="flex gap-7">
                {/* Industry grid */}
                <div className="flex-1 min-w-0">
                  {displayIndustries.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                      <p className="text-[13px] font-semibold text-[#0F172A]">Industry pages are being configured</p>
                      <p className="text-[12px] text-[#94A3B8] mt-1">Visit the industries page or contact us to discuss your sector.</p>
                      <Link href="/industries" className="mt-3 text-[12px] font-semibold text-[#0057b8] hover:underline" onClick={() => setActiveMenu(null)}>
                        Browse Industries →
                      </Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-1">
                      {displayIndustries.map((ind) => (
                        <Link
                          key={ind.href} href={ind.href}
                          className="group flex items-start gap-3 p-3.5 rounded-xl hover:bg-[#F8FAFC] dark:hover:bg-white/4 transition-all duration-150 border border-transparent hover:border-[#E2E8F0] dark:hover:border-white/7"
                          onClick={() => setActiveMenu(null)}
                        >
                          <div className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${ind.bg} ${ind.text} transition-transform duration-150 group-hover:scale-110`}>
                            {ind.icon}
                          </div>
                          <div className="min-w-0 pt-0.5">
                            <div className="text-[13px] font-semibold text-[#0F172A] dark:text-white/90 group-hover:text-[#0057b8] dark:group-hover:text-[#84CC16] transition-colors leading-tight">{ind.label}</div>
                            <div className="text-[11px] text-[#94A3B8] dark:text-white/40 mt-0.5 leading-relaxed line-clamp-1">{ind.desc}</div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                {/* Sector spotlight */}
                <div className="w-72 shrink-0">
                  <div className="h-full rounded-2xl overflow-hidden bg-[#0A0F1E] dark:bg-[#0d1530] border border-white/6">
                    <div className="h-1 bg-linear-to-r from-[#84CC16] via-[#a3e635] to-[#84CC16]" />
                    <div className="p-6">
                      <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#84CC16] mb-3">Sector Expertise</div>
                      <h3 className="text-[15px] font-bold text-white leading-snug mb-3" style={{ fontFamily: "var(--font-sora,'Sora',sans-serif)" }}>
                        Powering West Africa&apos;s Most Demanding Industries
                      </h3>
                      <p className="text-[12px] text-white/50 leading-relaxed mb-5">
                        From deep-level gold mining to offshore oil & gas — APT Ghana delivers certified automation and electrical solutions built for the region.
                      </p>
                      <div className="space-y-2.5 mb-6">
                        {[
                          { label: "Mining & Minerals", value: "35% of clients" },
                          { label: "Manufacturing", value: "Fastest growing" },
                          { label: "Power & Energy", value: "26+ brand partners" },
                        ].map((s) => (
                          <div key={s.label} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-[#84CC16]" />
                              <span className="text-[12px] text-white/60">{s.label}</span>
                            </div>
                            <span className="text-[11px] font-semibold text-[#84CC16]">{s.value}</span>
                          </div>
                        ))}
                      </div>
                      <Link
                        href="/industries"
                        className="flex items-center justify-between w-full px-4 py-2.5 rounded-lg bg-white/7 hover:bg-white/12 border border-white/10 text-white text-[12px] font-semibold transition-all group"
                        onClick={() => setActiveMenu(null)}
                      >
                        Browse by Industry
                        <span className="text-[#84CC16] group-hover:translate-x-0.5 transition-transform"><IcoArrowRight /></span>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer strip */}
              <div className="mt-5 pt-4 border-t border-[#E2E8F0] dark:border-white/6 flex items-center justify-between">
                <div className="flex items-center gap-1 flex-wrap">
                  <Link href="/industries" className="px-3 py-1.5 text-[12px] font-medium text-[#475569] dark:text-white/50 hover:text-[#0F172A] dark:hover:text-white hover:bg-[#F1F5F9] dark:hover:bg-white/5 rounded-lg transition-colors" onClick={() => setActiveMenu(null)}>All Industries</Link>
                  <span className="text-[#E2E8F0] dark:text-white/10">·</span>
                  <Link href="/solutions" className="px-3 py-1.5 text-[12px] font-medium text-[#475569] dark:text-white/50 hover:text-[#0F172A] dark:hover:text-white hover:bg-[#F1F5F9] dark:hover:bg-white/5 rounded-lg transition-colors" onClick={() => setActiveMenu(null)}>Browse Solutions by Industry</Link>
                </div>
                <Link
                  href="/contact"
                  className="flex items-center gap-2 px-4 py-1.5 text-[12px] font-semibold text-white bg-[#0057b8] hover:bg-[#0046a0] rounded-lg transition-colors"
                  onClick={() => setActiveMenu(null)}
                >
                  Request Technical Consultation
                  <IcoArrowRight />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            RESOURCES MEGA MENU
        ══════════════════════════════════════════════════════════════════════ */}
        {activeMenu === "resources" && (
          <div
            className="absolute inset-x-0 top-full bg-white dark:bg-[#080f1e] border-t border-[#E2E8F0] dark:border-white/6 shadow-xl dark:shadow-[0_8px_40px_rgba(0,0,0,.4)] animate-mega-menu"
            onMouseEnter={() => openMenu("resources")}
            role="dialog"
            aria-label="Resources navigation"
          >
            <div className="container-apt py-8">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-4 h-0.5 rounded-full bg-[#84CC16]" />
                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#84CC16]">Resources & Knowledge</span>
              </div>

              <div className="flex gap-8">
                {/* 3 groups */}
                <div className="flex-1 grid grid-cols-3 gap-8 min-w-0">
                  {displayResGroups.map((group) => (
                    <div key={group.heading}>
                      <div className="flex items-center gap-2 mb-4">
                        <span className={`text-[10px] font-bold uppercase tracking-[0.16em] ${group.accent}`}>{group.heading}</span>
                        <div className="flex-1 h-px bg-[#E2E8F0] dark:bg-white/6" />
                      </div>
                      <div className="space-y-0.5">
                        {group.items.map((item) => (
                          <Link
                            key={item.href} href={item.href}
                            className="group flex items-start gap-3 p-2.5 rounded-xl hover:bg-[#F8FAFC] dark:hover:bg-white/4 transition-all duration-150"
                            onClick={() => setActiveMenu(null)}
                          >
                            <div className="shrink-0 w-8 h-8 rounded-lg bg-[#F1F5F9] dark:bg-white/6 flex items-center justify-center text-[#475569] dark:text-white/50 group-hover:bg-[#84CC16]/10 group-hover:text-[#84CC16] transition-all">
                              {item.icon}
                            </div>
                            <div className="min-w-0 pt-0.5">
                              <div className="text-[13px] font-semibold text-[#0F172A] dark:text-white/90 group-hover:text-[#0057b8] dark:group-hover:text-[#84CC16] transition-colors leading-tight">{item.label}</div>
                              <div className="text-[11px] text-[#94A3B8] dark:text-white/40 mt-0.5 leading-relaxed">{item.desc}</div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Featured card */}
                <div className="w-64 shrink-0">
                  <div className="h-full rounded-2xl overflow-hidden bg-[#0A0F1E] dark:bg-[#0d1530] border border-white/6">
                    <div className="h-1 bg-linear-to-r from-[#84CC16] via-[#a3e635] to-[#84CC16]" />
                    <div className="p-6">
                      <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#84CC16] mb-3">Featured Resource</div>
                      <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-[#84CC16]/10 text-[#84CC16] text-[10px] font-semibold mb-3">
                        <IcoFileText />
                        PDF Guide
                      </div>
                      <h3 className="text-[14px] font-bold text-white leading-snug mb-2" style={{ fontFamily: "var(--font-sora,'Sora',sans-serif)" }}>
                        WEG Motor Selection Guide for West Africa
                      </h3>
                      <p className="text-[11px] text-white/50 leading-relaxed mb-5">
                        Efficiency classes, duty cycles, and environmental ratings for IE2/IE3 motors in tropical climates. Updated for 2025.
                      </p>
                      <div className="flex items-center gap-3 mb-5 text-[11px] text-white/40">
                        <span>32 pages</span>
                        <span className="w-1 h-1 rounded-full bg-white/20" />
                        <span>Free download</span>
                      </div>
                      <Link
                        href="/resources/library"
                        className="flex items-center justify-between w-full px-4 py-2.5 rounded-lg bg-[#84CC16] hover:bg-[#78B800] text-[#0A0F1E] text-[12px] font-bold transition-colors group"
                        onClick={() => setActiveMenu(null)}
                      >
                        Download PDF
                        <span className="group-hover:translate-x-0.5 transition-transform"><IcoArrowRight /></span>
                      </Link>
                      <div className="mt-4 pt-4 border-t border-white/8">
                        <Link href="/resources" className="text-[11px] text-white/40 hover:text-white/70 transition-colors" onClick={() => setActiveMenu(null)}>
                          Browse all resources →
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer strip */}
              <div className="mt-5 pt-4 border-t border-[#E2E8F0] dark:border-white/6 flex items-center justify-between">
                <div className="flex items-center gap-1 flex-wrap">
                  <Link href="/resources" className="px-3 py-1.5 text-[12px] font-medium text-[#475569] dark:text-white/50 hover:text-[#0F172A] dark:hover:text-white hover:bg-[#F1F5F9] dark:hover:bg-white/5 rounded-lg transition-colors" onClick={() => setActiveMenu(null)}>All Resources</Link>
                  <span className="text-[#E2E8F0] dark:text-white/10">·</span>
                  <Link href="/resources/library" className="px-3 py-1.5 text-[12px] font-medium text-[#475569] dark:text-white/50 hover:text-[#0F172A] dark:hover:text-white hover:bg-[#F1F5F9] dark:hover:bg-white/5 rounded-lg transition-colors" onClick={() => setActiveMenu(null)}>Technical Library</Link>
                  <span className="text-[#E2E8F0] dark:text-white/10">·</span>
                  <Link href="/resources/training" className="px-3 py-1.5 text-[12px] font-medium text-[#475569] dark:text-white/50 hover:text-[#0F172A] dark:hover:text-white hover:bg-[#F1F5F9] dark:hover:bg-white/5 rounded-lg transition-colors" onClick={() => setActiveMenu(null)}>Training Programs</Link>
                </div>
                <p className="text-[11px] text-[#94A3B8] dark:text-white/30">6,000+ products · 26+ global brands</p>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* ══════════════════════════════════════════════════════════════════════
          MOBILE MENU
      ══════════════════════════════════════════════════════════════════════ */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-white dark:bg-[#080f1e] pt-[105px] overflow-y-auto lg:hidden">
          <nav className="container-apt py-4 flex flex-col" aria-label="Mobile navigation">

            {/* ── Solutions accordion ── */}
            <div className="border-b border-[#E2E8F0] dark:border-white/7">
              <button
                className="w-full flex items-center justify-between py-3.5 text-[#0F172A] dark:text-white/90 text-[15px] font-medium"
                onClick={() => toggleMobile("solutions")}
                aria-expanded={mobileSection === "solutions"}
              >
                Solutions
                <svg className={`w-4 h-4 text-[#94A3B8] dark:text-white/25 transition-transform duration-200 ${mobileSection === "solutions" ? "rotate-90" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {mobileSection === "solutions" && (
                <div className="pb-4 space-y-3">
                  {displaySolutions.length > 0 && (
                    <div className="grid grid-cols-2 gap-1.5">
                      {displaySolutions.map((sol) => (
                        <Link
                          key={sol.slug}
                          href={`/solutions/${sol.slug}`}
                          className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-[#F8FAFC] dark:bg-white/4 hover:bg-[#F1F5F9] dark:hover:bg-white/7 transition-colors"
                          onClick={() => setMobileOpen(false)}
                        >
                          <div className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center ${sol.bg} ${sol.text}`}>
                            {sol.icon}
                          </div>
                          <span className="text-[12px] font-semibold text-[#0F172A] dark:text-white/80 leading-tight">{sol.name}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Link
                      href="/solutions"
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#0057b8] text-white text-[13px] font-semibold"
                      onClick={() => setMobileOpen(false)}
                    >
                      Browse All <IcoArrowRight />
                    </Link>
                    <Link
                      href="/contact?type=quote"
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#84CC16] text-[#0A0F1E] text-[13px] font-semibold"
                      onClick={() => setMobileOpen(false)}
                    >
                      Get Quote <IcoArrowRight />
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* ── Industries accordion ── */}
            <div className="border-b border-[#E2E8F0] dark:border-white/7">
              <button
                className="w-full flex items-center justify-between py-3.5 text-[#0F172A] dark:text-white/90 text-[15px] font-medium"
                onClick={() => toggleMobile("industries")}
                aria-expanded={mobileSection === "industries"}
              >
                Industries
                <svg className={`w-4 h-4 text-[#94A3B8] dark:text-white/25 transition-transform duration-200 ${mobileSection === "industries" ? "rotate-90" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {mobileSection === "industries" && (
                <div className="pb-4 space-y-1.5">
                  {displayIndustries.length > 0 && (
                    <div className="grid grid-cols-2 gap-1.5 mb-3">
                      {displayIndustries.map((ind) => (
                        <Link
                          key={ind.href} href={ind.href}
                          className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-[#F8FAFC] dark:bg-white/4 hover:bg-[#F1F5F9] dark:hover:bg-white/7 transition-colors"
                          onClick={() => setMobileOpen(false)}
                        >
                          <div className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center ${ind.bg} ${ind.text}`}>{ind.icon}</div>
                          <span className="text-[12px] font-semibold text-[#0F172A] dark:text-white/80 leading-tight">{ind.label}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                  <Link href="/industries" className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#0057b8] text-white text-[13px] font-semibold" onClick={() => setMobileOpen(false)}>
                    All Industries <IcoArrowRight />
                  </Link>
                </div>
              )}
            </div>

            {/* Brands, Services */}
            {[ { label: "Brands", href: "/brands" }, { label: "Services", href: "/services" } ].map((item) => (
              <Link
                key={item.href} href={item.href}
                className="flex items-center justify-between py-3.5 border-b border-[#E2E8F0] dark:border-white/7 text-[#0F172A] dark:text-white/90 text-[15px] font-medium"
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
                <svg className="w-4 h-4 text-[#94A3B8] dark:text-white/25" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ))}

            {/* ── Resources accordion ── */}
            <div className="border-b border-[#E2E8F0] dark:border-white/7">
              <button
                className="w-full flex items-center justify-between py-3.5 text-[#0F172A] dark:text-white/90 text-[15px] font-medium"
                onClick={() => toggleMobile("resources")}
                aria-expanded={mobileSection === "resources"}
              >
                Resources
                <svg className={`w-4 h-4 text-[#94A3B8] dark:text-white/25 transition-transform duration-200 ${mobileSection === "resources" ? "rotate-90" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {mobileSection === "resources" && (
                <div className="pb-4 space-y-4">
                  {displayResGroups.map((group) => (
                    <div key={group.heading}>
                      <div className={`text-[10px] font-bold uppercase tracking-[0.14em] mb-2 ${group.accent}`}>{group.heading}</div>
                      <div className="space-y-0.5">
                        {group.items.map((item) => (
                          <Link
                            key={item.href} href={item.href}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#F8FAFC] dark:hover:bg-white/4 transition-colors"
                            onClick={() => setMobileOpen(false)}
                          >
                            <div className="shrink-0 w-7 h-7 rounded-lg bg-[#F1F5F9] dark:bg-white/5 flex items-center justify-center text-[#64748B] dark:text-white/40">{item.icon}</div>
                            <div>
                              <div className="text-[13px] font-semibold text-[#0F172A] dark:text-white/80">{item.label}</div>
                              <div className="text-[11px] text-[#94A3B8] dark:text-white/30">{item.desc}</div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                  <Link href="/resources" className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#F1F5F9] dark:bg-white/6 text-[#0F172A] dark:text-white text-[13px] font-semibold" onClick={() => setMobileOpen(false)}>
                    All Resources <IcoArrowRight />
                  </Link>
                </div>
              )}
            </div>

            {/* Company, Contact */}
            {[ { label: "Company", href: "/company" }, { label: "Contact", href: "/contact" } ].map((item) => (
              <Link
                key={item.href} href={item.href}
                className="flex items-center justify-between py-3.5 border-b border-[#E2E8F0] dark:border-white/7 text-[#0F172A] dark:text-white/90 text-[15px] font-medium"
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
                <svg className="w-4 h-4 text-[#94A3B8] dark:text-white/25" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ))}

            {/* Primary CTAs */}
            <div className="pt-5 flex flex-col gap-3">
              <Link href={STORE_URL + "/rfq"} className="w-full py-3.5 text-center font-bold text-[#0A0F1E] bg-[#84CC16] rounded-xl hover:bg-[#78B800] transition-colors" onClick={() => setMobileOpen(false)}>
                Request Quote
              </Link>
              <Link href={STORE_URL} className="w-full py-3.5 text-center font-semibold text-[#475569] dark:text-white border border-[#E2E8F0] dark:border-white/15 rounded-xl hover:bg-[#F1F5F9] dark:hover:bg-white/5 transition-colors" onClick={() => setMobileOpen(false)}>
                Shop Online →
              </Link>
            </div>

            {/* Contact strip */}
            <div className="mt-6 pt-5 border-t border-[#E2E8F0] dark:border-white/7 flex flex-col gap-2 pb-8">
              <a href="tel:+233303964346" className="flex items-center gap-2 text-[12px] text-[#64748B] dark:text-white/40 hover:text-[#0F172A] dark:hover:text-white/70 transition-colors">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                </svg>
                +233 30 396 4346
              </a>
              <a href={`mailto:${EMAIL_SALES}`} className="flex items-center gap-2 text-[12px] text-[#64748B] dark:text-white/40 hover:text-[#0F172A] dark:hover:text-white/70 transition-colors">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
                {EMAIL_SALES}
              </a>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
