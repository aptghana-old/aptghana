import type { Metadata } from "next";
import { LayoutDashboard, Share2, FileText, Radio } from "lucide-react";
import { getActiveSessionIds } from "@/lib/analytics/liveVisitors";
import { AnalyticsTabNav, AnalyticsQueryToggle } from "@/components/analytics/AnalyticsTabNav";

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

export default async function AnalyticsLayout({ children }: Props) {
  const activeSessions = await getActiveSessionIds();

  return (
    <div className="flex flex-col min-h-full" style={{ background: "var(--apt-bg-subtle)" }}>

      {/* ── Shell topbar ──────────────────────────────────────────────────────── */}
      <div
        className="flex items-center justify-between gap-4 px-6 py-3 flex-wrap"
        style={{ borderBottom: "1px solid var(--apt-border)", background: "var(--apt-bg)" }}
      >
        {/* Tab nav */}
        <AnalyticsTabNav tabs={TABS} />

        {/* Right controls */}
        <div className="flex items-center gap-2">
          {/* Live badge */}
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full"
            style={{ background: "rgba(0,212,111,0.08)", color: "#00D68F", border: "1px solid rgba(0,212,111,0.15)" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-[#00D68F] animate-pulse" />
            {activeSessions.length} active now
          </span>

          {/* App filter */}
          <AnalyticsQueryToggle param="app" options={APPS} />

          {/* Range selector */}
          <AnalyticsQueryToggle param="range" options={RANGES} defaultValue="7d" />
        </div>
      </div>

      {/* ── Content ───────────────────────────────────────────────────────────── */}
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 max-w-[1600px] mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
