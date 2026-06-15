"use client";

import { Bell, Search, ChevronRight, Moon, Sun, Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

const ROUTE_LABELS: Record<string, string> = {
  "/dashboard":             "Dashboard",
  "/dashboard/analytics":   "Analytics",
  "/dashboard/products":    "Products",
  "/dashboard/brands":      "Brands",
  "/dashboard/categories":  "Categories",
  "/dashboard/media":       "Media Library",
  "/dashboard/orders":      "Orders",
  "/dashboard/quotes":      "Quotes & RFQs",
  "/dashboard/customers":   "Customers",
  "/dashboard/cms":         "Pages",
  "/dashboard/articles":    "Articles",
  "/dashboard/navigation":  "Navigation Builder",
  "/dashboard/search":      "Search",
  "/dashboard/search/synonyms":  "Synonyms",
  "/dashboard/search/analytics": "Search Analytics",
  "/dashboard/search/gaps":      "Zero Results",
  "/dashboard/search/ranking":   "Ranking Rules",
  "/dashboard/users":       "Users & Roles",
  "/dashboard/audit":       "Audit Log",
  "/dashboard/integrations":"Integrations",
  "/dashboard/settings":    "Settings",
};

function Breadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  const crumbs = segments.reduce<{ label: string; href: string }[]>((acc, _seg, i) => {
    const href = "/" + segments.slice(0, i + 1).join("/");
    const label = ROUTE_LABELS[href] ?? _seg.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    acc.push({ label, href });
    return acc;
  }, []);

  if (crumbs.length <= 1) {
    return (
      <span className="text-sm font-semibold truncate" style={{ color: "var(--apt-text-primary)" }}>
        {crumbs[0]?.label ?? "Dashboard"}
      </span>
    );
  }

  return (
    <nav className="flex items-center gap-1 text-sm min-w-0">
      {crumbs.map((crumb, i) => (
        <span key={crumb.href} className="flex items-center gap-1 min-w-0">
          {i > 0 && <ChevronRight size={13} className="shrink-0" style={{ color: "var(--apt-text-muted)" }} />}
          {i === crumbs.length - 1 ? (
            <span className="font-semibold truncate" style={{ color: "var(--apt-text-primary)" }}>{crumb.label}</span>
          ) : (
            <a
              href={crumb.href}
              className="hidden sm:block shrink-0 transition-colors hover:underline"
              style={{ color: "var(--apt-text-muted)" }}
            >
              {crumb.label}
            </a>
          )}
        </span>
      ))}
    </nav>
  );
}

interface HeaderProps {
  onCommandPalette(): void;
  onMobileMenuToggle(): void;
}

export default function Header({ onCommandPalette, onMobileMenuToggle }: HeaderProps) {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    setDarkMode(document.documentElement.getAttribute("data-theme") === "dark");
  }, []);

  const toggleDark = () => {
    const next = !darkMode;
    setDarkMode(next);
    document.documentElement.setAttribute("data-theme", next ? "dark" : "light");
  };

  return (
    <header
      className="flex items-center gap-2 sm:gap-4 px-3 sm:px-5 shrink-0 z-10"
      style={{
        height: 56,
        background: "var(--apt-bg)",
        borderBottom: "1px solid var(--apt-border)",
      }}
    >
      {/* Mobile hamburger */}
      <button
        onClick={onMobileMenuToggle}
        className="md:hidden flex items-center justify-center w-8 h-8 rounded-md transition-colors hover:bg-[var(--apt-bg-raised)] shrink-0"
        style={{ color: "var(--apt-text-muted)" }}
        aria-label="Open navigation"
      >
        <Menu size={18} />
      </button>

      {/* Breadcrumb */}
      <div className="flex-1 min-w-0">
        <Breadcrumb />
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-1">
        {/* Search trigger — hidden on very small screens */}
        <button
          onClick={onCommandPalette}
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-md text-xs transition-colors"
          style={{
            background: "var(--apt-bg-raised)",
            border: "1px solid var(--apt-border)",
            color: "var(--apt-text-muted)",
          }}
        >
          <Search size={13} />
          <span className="hidden lg:inline">Search</span>
          <kbd
            className="hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium"
            style={{ background: "var(--apt-border)", color: "var(--apt-text-muted)" }}
          >
            ⌘K
          </kbd>
        </button>

        {/* Mobile search icon */}
        <button
          onClick={onCommandPalette}
          className="sm:hidden w-8 h-8 rounded-md flex items-center justify-center transition-colors hover:bg-[var(--apt-bg-raised)]"
          style={{ color: "var(--apt-text-muted)" }}
          aria-label="Search"
        >
          <Search size={16} />
        </button>

        {/* Dark mode */}
        <button
          onClick={toggleDark}
          className="w-8 h-8 rounded-md flex items-center justify-center transition-colors hover:bg-[var(--apt-bg-raised)]"
          style={{ color: "var(--apt-text-muted)" }}
          aria-label="Toggle dark mode"
        >
          {darkMode ? <Sun size={15} /> : <Moon size={15} />}
        </button>

        {/* Notifications */}
        <button
          className="relative w-8 h-8 rounded-md flex items-center justify-center transition-colors hover:bg-[var(--apt-bg-raised)]"
          style={{ color: "var(--apt-text-muted)" }}
          aria-label="Notifications"
        >
          <Bell size={15} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#ff6b00]" />
        </button>

        {/* Avatar */}
        <button className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-md hover:bg-[var(--apt-bg-raised)] transition-colors">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0"
            style={{ background: "#1e4278" }}
          >
            A
          </div>
          <span className="hidden lg:block text-[13px] font-medium" style={{ color: "var(--apt-text-primary)" }}>
            Admin
          </span>
        </button>
      </div>
    </header>
  );
}
