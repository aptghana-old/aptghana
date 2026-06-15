import Link from "next/link";
import type { Metadata } from "next";
import { LayoutDashboard, Users, Share2, FileText, Radio } from "lucide-react";

export const metadata: Metadata = {
  title: { default: "Analytics", template: "%s · Analytics" },
};

const TABS = [
  { label: "Overview",    href: "/dashboard/analytics",             icon: LayoutDashboard },
  { label: "Visitors",    href: "/dashboard/analytics/visitors",    icon: Radio },
  { label: "Acquisition", href: "/dashboard/analytics/acquisition", icon: Share2 },
  { label: "Content",     href: "/dashboard/analytics/content",     icon: FileText },
];

const RANGES = [
  { label: "7d",  value: "7d"  },
  { label: "30d", value: "30d" },
  { label: "90d", value: "90d" },
];

const APPS = [
  { label: "All Apps", value: ""      },
  { label: "Web",      value: "web"   },
  { label: "Store",    value: "store" },
];

interface Props {
  children: React.ReactNode;
}

export default function AnalyticsLayout({ children }: Props) {
  return (
    <div className="flex flex-col min-h-full" style={{ background: "var(--apt-bg-subtle)" }}>

      {/* ── Shell topbar ──────────────────────────────────────────────────────── */}
      <div
        className="flex items-center justify-between gap-4 px-6 py-3 flex-wrap"
        style={{ borderBottom: "1px solid var(--apt-border)", background: "var(--apt-bg)" }}
      >
        {/* Tab nav */}
        <nav className="flex items-center gap-1">
          {TABS.map(({ label, href, icon: Icon }) => (
            <AnalyticsTabLink key={href} href={href} label={label} Icon={Icon} />
          ))}
        </nav>

        {/* Right controls */}
        <div className="flex items-center gap-2">
          {/* Live badge */}
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full"
            style={{ background: "rgba(0,212,111,0.08)", color: "#00D68F", border: "1px solid rgba(0,212,111,0.15)" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-[#00D68F] animate-pulse" />
            Live
          </span>

          {/* App filter */}
          <div className="flex items-center rounded-lg overflow-hidden" style={{ background: "var(--apt-bg-raised)", border: "1px solid var(--apt-border)" }}>
            {APPS.map((a) => (
              <AppFilterLink key={a.value} label={a.label} value={a.value} />
            ))}
          </div>

          {/* Range selector */}
          <div className="flex items-center rounded-lg overflow-hidden" style={{ background: "var(--apt-bg-raised)", border: "1px solid var(--apt-border)" }}>
            {RANGES.map((r) => (
              <RangeLink key={r.value} label={r.label} value={r.value} />
            ))}
          </div>
        </div>
      </div>

      {/* ── Content ───────────────────────────────────────────────────────────── */}
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 max-w-[1600px] mx-auto w-full">
        {children}
      </main>
    </div>
  );
}

/* ─── Tab link — server component, no active state tracking ─────────────── */
function AnalyticsTabLink({ href, label, Icon }: { href: string; label: string; Icon: React.ComponentType<{ className?: string }> }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
      style={{ color: "var(--apt-text-secondary)" }}
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
    </Link>
  );
}

function RangeLink({ label, value }: { label: string; value: string }) {
  return (
    <Link
      href={`?range=${value}`}
      className="px-2.5 py-1 text-xs font-medium transition-colors"
      style={{ color: "var(--apt-text-muted)" }}
    >
      {label}
    </Link>
  );
}

function AppFilterLink({ label, value }: { label: string; value: string }) {
  const param = value ? `?app=${value}` : "?";
  return (
    <Link
      href={param}
      className="px-2.5 py-1 text-xs font-medium transition-colors"
      style={{ color: "var(--apt-text-muted)" }}
    >
      {label}
    </Link>
  );
}
