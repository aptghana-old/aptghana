import Link from "next/link";
import { SearchX, LayoutDashboard } from "lucide-react";

export default function DashboardNotFound() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 p-12 text-center" style={{ minHeight: "calc(100vh - 57px)" }}>
      <div
        className="w-14 h-14 rounded-full flex items-center justify-center"
        style={{ background: "var(--apt-bg-raised)" }}
      >
        <SearchX size={24} style={{ color: "var(--apt-text-muted)" }} />
      </div>
      <div>
        <p className="text-[15px] font-semibold mb-1" style={{ color: "var(--apt-text-primary)" }}>
          Page not found
        </p>
        <p className="text-[13px] max-w-sm" style={{ color: "var(--apt-text-muted)" }}>
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
      </div>
      <Link
        href="/dashboard"
        className="inline-flex items-center justify-center gap-2 h-9 px-3.5 rounded-md text-[13px] font-medium bg-navy-500 text-white hover:bg-[#0049a0] active:bg-[#003d87] shadow-sm transition-colors"
      >
        <LayoutDashboard size={13} />
        Back to Dashboard
      </Link>
    </div>
  );
}
