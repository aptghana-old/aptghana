"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search, LayoutDashboard, Package, Tag, FolderTree,
  ShoppingCart, FileText, Users, Globe, BookOpen,
  UserCog, Settings, BarChart2, Plus, ArrowRight,
  ScrollText, TrendingUp,
} from "lucide-react";

type CommandItem = {
  id: string;
  group: string;
  label: string;
  description?: string;
  icon: React.ReactNode;
  href?: string;
  shortcut?: string;
  keywords?: string;
};

const COMMANDS: CommandItem[] = [
  // Navigate
  { id: "nav-dashboard",  group: "Navigate", label: "Dashboard",        icon: <LayoutDashboard size={15} />, href: "/dashboard" },
  { id: "nav-analytics",  group: "Navigate", label: "Analytics",        icon: <BarChart2 size={15} />,       href: "/dashboard/analytics" },
  { id: "nav-products",   group: "Navigate", label: "Products",         icon: <Package size={15} />,         href: "/dashboard/products",   keywords: "catalog" },
  { id: "nav-brands",     group: "Navigate", label: "Brands",           icon: <Tag size={15} />,             href: "/dashboard/brands" },
  { id: "nav-categories", group: "Navigate", label: "Categories",       icon: <FolderTree size={15} />,      href: "/dashboard/categories" },
  { id: "nav-orders",     group: "Navigate", label: "Orders",           icon: <ShoppingCart size={15} />,    href: "/dashboard/orders" },
  { id: "nav-quotes",     group: "Navigate", label: "Quotes & RFQs",    icon: <FileText size={15} />,        href: "/dashboard/quotes",     keywords: "rfq" },
  { id: "nav-customers",  group: "Navigate", label: "Customers",        icon: <Users size={15} />,           href: "/dashboard/customers" },
  { id: "nav-pages",      group: "Navigate", label: "Pages (CMS)",      icon: <Globe size={15} />,           href: "/dashboard/cms" },
  { id: "nav-articles",   group: "Navigate", label: "Articles",         icon: <BookOpen size={15} />,        href: "/dashboard/articles" },
  { id: "nav-search",     group: "Navigate", label: "Search Config",    icon: <Search size={15} />,          href: "/dashboard/search" },
  { id: "nav-trends",     group: "Navigate", label: "Search Analytics", icon: <TrendingUp size={15} />,      href: "/dashboard/search/analytics" },
  { id: "nav-users",      group: "Navigate", label: "Users & Roles",    icon: <UserCog size={15} />,         href: "/dashboard/users" },
  { id: "nav-audit",      group: "Navigate", label: "Audit Log",        icon: <ScrollText size={15} />,      href: "/dashboard/audit" },
  { id: "nav-settings",   group: "Navigate", label: "Settings",         icon: <Settings size={15} />,        href: "/dashboard/settings" },
  // Create
  { id: "new-product",   group: "Create", label: "New Product",   icon: <Plus size={15} />, href: "/dashboard/products/new",  description: "Add a product to the catalogue" },
  { id: "new-brand",     group: "Create", label: "New Brand",     icon: <Plus size={15} />, href: "/dashboard/brands/new",    description: "Register a brand" },
  { id: "new-article",   group: "Create", label: "New Article",   icon: <Plus size={15} />, href: "/dashboard/articles/new",  description: "Write a blog post or guide" },
  { id: "new-customer",  group: "Create", label: "New Customer",  icon: <Plus size={15} />, href: "/dashboard/customers/new", description: "Add a customer account" },
];

function score(item: CommandItem, query: string): number {
  const q = query.toLowerCase();
  const label = item.label.toLowerCase();
  const kw = (item.keywords ?? "").toLowerCase();
  if (label === q) return 100;
  if (label.startsWith(q)) return 80;
  if (label.includes(q)) return 60;
  if (kw.includes(q)) return 40;
  if (item.description?.toLowerCase().includes(q)) return 20;
  return 0;
}

export default function CommandPalette({ open, onClose }: { open: boolean; onClose(): void }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const filtered = query.trim()
    ? COMMANDS.map((c) => ({ ...c, _score: score(c, query) }))
        .filter((c) => c._score > 0)
        .sort((a, b) => b._score - a._score)
    : COMMANDS;

  const grouped = filtered.reduce<Record<string, CommandItem[]>>((acc, item) => {
    (acc[item.group] ??= []).push(item);
    return acc;
  }, {});

  const flat = Object.values(grouped).flat();

  const navigate = useCallback(
    (item: CommandItem) => {
      if (item.href) router.push(item.href);
      onClose();
    },
    [router, onClose]
  );

  useEffect(() => {
    if (open) {
      setQuery("");
      setCursor(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => { setCursor(0); }, [query]);

  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-index="${cursor}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [cursor]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === "ArrowDown") { e.preventDefault(); setCursor((c) => Math.min(c + 1, flat.length - 1)); }
      if (e.key === "ArrowUp")   { e.preventDefault(); setCursor((c) => Math.max(c - 1, 0)); }
      if (e.key === "Enter")     { e.preventDefault(); const item = flat[cursor]; if (item) navigate(item); }
      if (e.key === "Escape")    { e.preventDefault(); onClose(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, flat, cursor, navigate, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] animate-fade-in"
      style={{ background: "var(--apt-bg-overlay)" }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-xl rounded-xl overflow-hidden shadow-2xl animate-scale-in"
        style={{ background: "var(--apt-bg)", border: "1px solid var(--apt-border)" }}
      >
        {/* Search input */}
        <div
          className="flex items-center gap-3 px-4 py-3"
          style={{ borderBottom: "1px solid var(--apt-border)" }}
        >
          <Search size={16} style={{ color: "var(--apt-text-muted)", flexShrink: 0 }} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search commands, pages, products…"
            className="flex-1 bg-transparent text-[14px] outline-none"
            style={{ color: "var(--apt-text-primary)" }}
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="text-xs px-1.5 py-0.5 rounded"
              style={{ background: "var(--apt-bg-raised)", color: "var(--apt-text-muted)" }}
            >
              Clear
            </button>
          )}
          <kbd className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "var(--apt-bg-raised)", color: "var(--apt-text-muted)" }}>
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-[400px] overflow-y-auto py-2">
          {flat.length === 0 ? (
            <p className="px-4 py-8 text-sm text-center" style={{ color: "var(--apt-text-muted)" }}>
              No results for &ldquo;{query}&rdquo;
            </p>
          ) : (
            Object.entries(grouped).map(([group, items]) => (
              <div key={group}>
                <div
                  className="px-4 py-1.5 text-[10px] font-semibold tracking-widest uppercase"
                  style={{ color: "var(--apt-text-muted)" }}
                >
                  {group}
                </div>
                {items.map((item) => {
                  const idx = flat.indexOf(item);
                  const active = idx === cursor;
                  return (
                    <button
                      key={item.id}
                      data-index={idx}
                      onClick={() => navigate(item)}
                      onMouseEnter={() => setCursor(idx)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
                      style={{
                        background: active ? "var(--apt-bg-raised)" : "transparent",
                        color: active ? "var(--apt-text-primary)" : "var(--apt-text-secondary)",
                      }}
                    >
                      <span style={{ color: active ? "var(--apt-text-brand)" : "var(--apt-text-muted)" }}>
                        {item.icon}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-medium truncate">{item.label}</div>
                        {item.description && (
                          <div className="text-[11px] truncate" style={{ color: "var(--apt-text-muted)" }}>
                            {item.description}
                          </div>
                        )}
                      </div>
                      {active && <ArrowRight size={13} style={{ color: "var(--apt-text-muted)" }} />}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div
          className="flex items-center gap-3 px-4 py-2 text-[11px]"
          style={{ borderTop: "1px solid var(--apt-border)", color: "var(--apt-text-muted)" }}
        >
          <span><kbd className="font-mono">↑↓</kbd> navigate</span>
          <span><kbd className="font-mono">↵</kbd> open</span>
          <span><kbd className="font-mono">esc</kbd> close</span>
        </div>
      </div>
    </div>
  );
}
