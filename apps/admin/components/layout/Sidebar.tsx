"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, BarChart2,
  Package, Tag, FolderTree, Image,
  ShoppingCart, FileText, Users,
  Globe, BookOpen, Navigation, Factory, Library, Zap, Briefcase, Building2,
  Search, Replace, TrendingUp, AlertCircle,
  UserCog, ScrollText, Plug, Settings,
  ChevronRight, ChevronsLeft,
  ExternalLink, X, LayoutTemplate,
} from "lucide-react";
import { createContext, useContext, useState } from "react";
import { SITE_URL, SITE_DOMAIN } from "@apt/config";
import {
  hasPermission,
  NAV_PERMISSION_MAP,
  type AdminRole,
  type Permission,
} from "@apt/auth";

const SidebarCtx = createContext<{ collapsed: boolean; toggle(): void }>({
  collapsed: false,
  toggle() { },
});
export const useSidebar = () => useContext(SidebarCtx);

type NavItem = { label: string; href: string; icon: React.ReactNode; badge?: string; badgeTone?: "neutral" | "accent" };
type NavSection = { section: string; items: NavItem[] };

const NAV: NavSection[] = [
  {
    section: "Overview",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: <LayoutDashboard size={16} /> },
      { label: "Analytics", href: "/dashboard/analytics", icon: <BarChart2 size={16} /> },
    ],
  },
  {
    section: "Catalog",
    items: [
      { label: "Products", href: "/dashboard/products", icon: <Package size={16} /> },
      { label: "Brands", href: "/dashboard/brands", icon: <Tag size={16} /> },
      { label: "Categories", href: "/dashboard/categories", icon: <FolderTree size={16} /> },
      { label: "Media", href: "/dashboard/media", icon: <Image size={16} /> },
    ],
  },
  {
    section: "Commerce",
    items: [
      { label: "Orders", href: "/dashboard/orders", icon: <ShoppingCart size={16} /> },
      { label: "Quotes/RFQ", href: "/dashboard/quotes", icon: <FileText size={16} /> },
      { label: "Customers", href: "/dashboard/customers", icon: <Users size={16} /> },
    ],
  },
  {
    section: "Content",
    items: [
      { label: "Homepage", href: "/dashboard/homepage", icon: <LayoutTemplate size={16} /> },
      { label: "Solutions", href: "/dashboard/solutions", icon: <Zap size={16} /> },
      { label: "Services", href: "/dashboard/services", icon: <Briefcase size={16} /> },
      { label: "Company", href: "/dashboard/company", icon: <Building2 size={16} /> },
      { label: "Industries", href: "/dashboard/industries", icon: <Factory size={16} /> },
      { label: "Resources", href: "/dashboard/resources", icon: <Library size={16} /> },
      { label: "Articles", href: "/dashboard/articles", icon: <BookOpen size={16} /> },
    ],
  },
  {
    section: "Search",
    items: [
      { label: "Configuration", href: "/dashboard/search", icon: <Search size={16} /> },
      { label: "Analytics", href: "/dashboard/search/analytics", icon: <TrendingUp size={16} /> },
      { label: "Zero Results", href: "/dashboard/search/gaps", icon: <AlertCircle size={16} /> },
    ],
  },
  {
    section: "System",
    items: [
      { label: "Users & Roles", href: "/dashboard/users", icon: <UserCog size={16} /> },
      { label: "Audit Log", href: "/dashboard/audit", icon: <ScrollText size={16} /> },
      { label: "Integrations", href: "/dashboard/integrations", icon: <Plug size={16} /> },
      { label: "Settings", href: "/dashboard/settings", icon: <Settings size={16} /> },
    ],
  },
];

function NavItemLink({ item, active, collapsed }: { item: NavItem; active: boolean; collapsed: boolean }) {
  return (
    <Link
      href={item.href}
      title={collapsed ? item.label : undefined}
      className={[
        "group relative flex items-center gap-2.5 px-3 py-[7px] rounded-md text-[13px] transition-all duration-100 select-none",
        active
          ? "bg-white/10 text-white font-medium"
          : "text-white/50 hover:text-white/85 hover:bg-white/6",
      ].join(" ")}
    >
      {active && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-[#0057b8]" />
      )}
      <span className={`shrink-0 ${active ? "text-white" : "text-white/45 group-hover:text-white/70"}`}>
        {item.icon}
      </span>
      {!collapsed && (
        <span className="truncate leading-none">{item.label}</span>
      )}
      {!collapsed && item.badge && (
        <span
          className={[
            "ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded-full leading-none font-mono",
            item.badgeTone === "accent" ? "bg-[#ff6b00] text-white" : "text-white/35 bg-white/5",
          ].join(" ")}
        >
          {item.badge}
        </span>
      )}
      {collapsed && (
        <span className="pointer-events-none absolute left-full ml-2.5 z-50 px-2 py-1 rounded-md bg-slate-900 text-white text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
          {item.label}
        </span>
      )}
    </Link>
  );
}

export interface SidebarNavCounts {
  products?: string;
  quotesPending?: string;
}

interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
  role: AdminRole;
  permissions: string[];
  counts?: SidebarNavCounts;
}

export default function Sidebar({ mobileOpen, onMobileClose, role, permissions, counts }: SidebarProps) {
  const [ collapsed, setCollapsed ] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname === href || pathname.startsWith(href + "/");

  const canView = (href: string): boolean => {
    const required = NAV_PERMISSION_MAP[ href ];
    if (!required) return true; // no restriction → always visible
    return hasPermission(role, permissions, required as Permission);
  };

  const BADGES: Record<string, { value?: string; tone: "neutral" | "accent" }> = {
    "/dashboard/products": { value: counts?.products, tone: "neutral" },
    "/dashboard/quotes": { value: counts?.quotesPending, tone: "accent" },
  };

  const visibleSections = NAV.map((section) => ({
    ...section,
    items: section.items
      .filter((item) => canView(item.href))
      .map((item) => {
        const badge = BADGES[item.href];
        return badge?.value ? { ...item, badge: badge.value, badgeTone: badge.tone } : item;
      }),
  })).filter((section) => section.items.length > 0);

  return (
    <SidebarCtx.Provider value={{ collapsed, toggle: () => setCollapsed((c) => !c) }}>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-60 md:hidden"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={[
          "flex flex-col h-full shrink-0 transition-all duration-200",
          "fixed inset-y-0 left-0 z-50",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          "md:relative md:translate-x-0 md:z-auto",
          "w-[280px]",
          collapsed ? "md:w-14" : "md:w-60",
        ].join(" ")}
        style={{
          background: "var(--apt-sidebar-bg)",
          borderRight: "1px solid var(--apt-sidebar-border)",
        }}
      >
        {/* Logo */}
        <div
          className="flex items-center gap-3 px-3 py-4 shrink-0"
          style={{ borderBottom: "1px solid var(--apt-sidebar-border)", height: 56 }}
        >
          <div className="shrink-0 w-7 h-7 rounded-lg bg-[#ff6b00] flex items-center justify-center">
            <span className="text-white font-bold text-[10px] leading-none tracking-tight">APT</span>
          </div>
          {!collapsed && (
            <div className="min-w-0 leading-none flex-1">
              <div className="text-white font-semibold text-[13px]">APT Admin</div>
              <div className="text-white/30 text-[10px] mt-0.5">Enterprise Platform</div>
            </div>
          )}
          {/* Mobile close button */}
          <button
            onClick={onMobileClose}
            className="md:hidden ml-auto w-7 h-7 rounded-md flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close navigation"
          >
            <X size={14} />
          </button>
        </div>

        {/* Desktop collapse toggle */}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="hidden md:flex absolute -right-3 top-[42px] z-10 w-6 h-6 rounded-full bg-slate-700 border border-slate-600 items-center justify-center text-white/60 hover:text-white hover:bg-slate-600 transition-colors shadow-md"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronsLeft size={12} />}
        </button>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2">
          {visibleSections.map((section) => (
            <div key={section.section} className="mb-5">
              {!collapsed && (
                <div
                  className="px-3 mb-1 text-[10px] font-semibold tracking-widest uppercase"
                  style={{ color: "rgba(255,255,255,0.2)" }}
                >
                  {section.section}
                </div>
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => (
                  <NavItemLink
                    key={item.href}
                    item={item}
                    active={isActive(item.href)}
                    collapsed={collapsed}
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div
          className="px-2 py-3 shrink-0"
          style={{ borderTop: "1px solid var(--apt-sidebar-border)" }}
        >
          {!collapsed && (
            <a
              href={SITE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-[7px] rounded-md text-[12px] text-white/35 hover:text-white/60 transition-colors mb-1"
            >
              <ExternalLink size={13} />
              <span>{SITE_DOMAIN}</span>
            </a>
          )}
          <div className="flex items-center gap-2.5 px-3 py-2">
            <div className="shrink-0 w-7 h-7 rounded-full bg-[#1e4278] flex items-center justify-center text-[11px] font-bold text-white">
              A
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-medium text-white/80 truncate leading-none">Admin</div>
                <div className="text-[11px] text-white/30 truncate mt-0.5">Super Admin</div>
              </div>
            )}
          </div>
        </div>
      </aside>
    </SidebarCtx.Provider>
  );
}
