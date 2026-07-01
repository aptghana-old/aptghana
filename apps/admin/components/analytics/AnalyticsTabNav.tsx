"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { ComponentType } from "react";

export interface AnalyticsTab {
  label: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
}

export function AnalyticsTabNav({ tabs }: { tabs: AnalyticsTab[] }) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/dashboard/analytics"
      ? pathname === href
      : pathname === href || pathname.startsWith(href + "/");

  return (
    <nav className="flex items-center gap-1">
      {tabs.map(({ label, href, icon: Icon }) => {
        const active = isActive(href);
        return (
          <Link
            key={href}
            href={href}
            className="relative flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
            style={{
              color: active ? "var(--apt-text-primary)" : "var(--apt-text-secondary)",
              background: active ? "var(--apt-bg-raised)" : "transparent",
            }}
          >
            {active && (
              <span
                className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r-full"
                style={{ background: "var(--apt-text-brand)" }}
              />
            )}
            <Icon className="w-3.5 h-3.5" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

/* ─── Segmented pill toggle, active state driven by a query param ───────────
 * Used for both the app scope (?app=) and range (?range=) selectors. Reads
 * the current value with useSearchParams so the active pill re-renders on
 * navigation (layouts can't read searchParams directly).
 */
export function AnalyticsQueryToggle({
  param,
  options,
  defaultValue = "",
}: {
  param: string;
  options: { label: string; value: string }[];
  defaultValue?: string;
}) {
  const searchParams = useSearchParams();
  const current = searchParams.get(param) ?? defaultValue;

  return (
    <div
      className="flex items-center rounded-lg overflow-hidden"
      style={{ background: "var(--apt-bg-raised)", border: "1px solid var(--apt-border)" }}
    >
      {options.map((opt) => {
        const active = opt.value === current;
        const params = new URLSearchParams(searchParams.toString());
        if (opt.value) params.set(param, opt.value);
        else params.delete(param);
        const href = params.toString() ? `?${params.toString()}` : "?";
        return (
          <Link
            key={opt.value || "__default"}
            href={href}
            className="px-2.5 py-1 text-xs font-medium transition-colors"
            style={{
              color: active ? "var(--apt-text-inverse)" : "var(--apt-text-muted)",
              background: active ? "var(--apt-chip-active)" : "transparent",
            }}
          >
            {opt.label}
          </Link>
        );
      })}
    </div>
  );
}
