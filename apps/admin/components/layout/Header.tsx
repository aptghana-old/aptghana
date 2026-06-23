"use client";

import { Bell, Search, ChevronRight, Menu, LogOut, Settings, User } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { logoutAction } from "@/lib/auth/actions";
import type { AdminRole } from "@/types/next-auth";

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

const ROLE_LABELS: Record<AdminRole, string> = {
  super_admin: "Super Admin",
  manager:     "Manager",
  sales:       "Sales",
  account:     "Account",
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

function UserMenu({
  name,
  email,
  role,
  image,
}: {
  name: string;
  email: string;
  role: AdminRole;
  image?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="true"
        className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-md hover:bg-[var(--apt-bg-raised)] transition-colors"
      >
        {image ? (
          <img
            src={image}
            alt={name}
            className="w-7 h-7 rounded-full object-cover shrink-0"
          />
        ) : (
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0"
            style={{ background: "#0057b8" }}
          >
            {initials}
          </div>
        )}
        <div className="hidden lg:block text-left">
          <div className="text-[13px] font-medium leading-tight" style={{ color: "var(--apt-text-primary)" }}>
            {name}
          </div>
          <div className="text-[10px] leading-tight" style={{ color: "var(--apt-text-muted)" }}>
            {ROLE_LABELS[role] ?? role}
          </div>
        </div>
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-1.5 w-56 rounded-lg shadow-lg z-50 py-1 animate-scale-in"
          style={{
            background: "var(--apt-bg)",
            border: "1px solid var(--apt-border)",
            boxShadow: "var(--shadow-lg)",
          }}
          role="menu"
        >
          {/* User info */}
          <div className="px-3 py-2.5" style={{ borderBottom: "1px solid var(--apt-border)" }}>
            <div className="text-[13px] font-semibold truncate" style={{ color: "var(--apt-text-primary)" }}>
              {name}
            </div>
            <div className="text-[11px] truncate" style={{ color: "var(--apt-text-muted)" }}>
              {email}
            </div>
            <div
              className="inline-flex items-center mt-1 px-1.5 py-0.5 rounded text-[10px] font-semibold"
              style={{
                background: "rgba(0,87,184,0.1)",
                color: "#0057b8",
              }}
            >
              {ROLE_LABELS[role] ?? role}
            </div>
          </div>

          {/* Menu items */}
          <div className="py-1">
            <a
              href="/dashboard/settings/profile"
              className="flex items-center gap-2.5 px-3 py-2 text-[13px] transition-colors hover:bg-[var(--apt-bg-raised)]"
              style={{ color: "var(--apt-text-primary)" }}
              role="menuitem"
              onClick={() => setOpen(false)}
            >
              <User size={13} style={{ color: "var(--apt-text-muted)" }} />
              Profile settings
            </a>
            <a
              href="/dashboard/settings"
              className="flex items-center gap-2.5 px-3 py-2 text-[13px] transition-colors hover:bg-[var(--apt-bg-raised)]"
              style={{ color: "var(--apt-text-primary)" }}
              role="menuitem"
              onClick={() => setOpen(false)}
            >
              <Settings size={13} style={{ color: "var(--apt-text-muted)" }} />
              Settings
            </a>
          </div>

          {/* Logout */}
          <div className="py-1" style={{ borderTop: "1px solid var(--apt-border)" }}>
            <form action={logoutAction}>
              <button
                type="submit"
                className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] transition-colors hover:bg-[var(--color-error-50)] text-left"
                style={{ color: "var(--color-error-600)" }}
                role="menuitem"
              >
                <LogOut size={13} />
                Sign out
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export interface SessionUser {
  name: string;
  email: string;
  role: AdminRole;
  image?: string | null;
}

interface HeaderProps {
  user: SessionUser;
  onCommandPalette(): void;
  onMobileMenuToggle(): void;
}

export default function Header({ user, onCommandPalette, onMobileMenuToggle }: HeaderProps) {
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
        {/* Search trigger */}
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

        {/* Mobile search */}
        <button
          onClick={onCommandPalette}
          className="sm:hidden w-8 h-8 rounded-md flex items-center justify-center transition-colors hover:bg-[var(--apt-bg-raised)]"
          style={{ color: "var(--apt-text-muted)" }}
          aria-label="Search"
        >
          <Search size={16} />
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

        {/* User menu */}
        <UserMenu
          name={user.name}
          email={user.email}
          role={user.role}
          image={user.image}
        />
      </div>
    </header>
  );
}
