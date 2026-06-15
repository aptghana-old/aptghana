import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { absolute: "APT Ghana Admin" },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex" style={{ background: "var(--apt-bg-subtle)" }}>
      {/* Left branding panel — hidden on mobile */}
      <div
        className="hidden lg:flex lg:w-[420px] xl:w-[480px] shrink-0 flex-col justify-between p-10 relative overflow-hidden"
        style={{ background: "var(--apt-sidebar-bg)" }}
      >
        {/* Decorative grid */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(var(--apt-border-strong) 1px, transparent 1px), linear-gradient(90deg, var(--apt-border-strong) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        {/* Decorative glow */}
        <div
          className="absolute -top-40 -left-40 w-80 h-80 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #0057b8 0%, transparent 70%)" }}
        />
        <div
          className="absolute -bottom-32 -right-20 w-64 h-64 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #3b82f6 0%, transparent 70%)" }}
        />

        <div className="relative z-10">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-12">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0"
              style={{ background: "#0057b8" }}
            >
              APT
            </div>
            <div>
              <div className="text-white font-semibold text-[15px] leading-tight">APT Ghana</div>
              <div className="text-[11px] font-medium" style={{ color: "rgba(255,255,255,0.4)" }}>
                Enterprise Platform
              </div>
            </div>
          </div>

          {/* Headline */}
          <h1 className="text-white font-bold text-2xl leading-snug mb-3">
            The operating system<br />for your business
          </h1>
          <p className="text-sm leading-relaxed mb-10" style={{ color: "rgba(255,255,255,0.5)" }}>
            Manage products, orders, customers, content, and analytics — all in one place.
          </p>

          {/* Feature list */}
          <ul className="space-y-4">
            {[
              ["Inventory & Products", "Real-time stock levels, pricing, and product data"],
              ["Orders & Quotes", "Track orders, approve quotes, and process RFQs"],
              ["Customer Management", "B2B accounts, contacts, and purchase history"],
              ["Content & SEO", "Pages, articles, navigation, and media library"],
              ["Analytics", "Sales performance, search analytics, and visitor insights"],
            ].map(([title, desc]) => (
              <li key={title} className="flex gap-3">
                <div
                  className="mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: "rgba(0,87,184,0.35)", border: "1px solid rgba(0,87,184,0.6)" }}
                >
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4L3.5 6.5L9 1" stroke="#60a5fa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div>
                  <div className="text-[13px] font-medium text-white">{title}</div>
                  <div className="text-[12px]" style={{ color: "rgba(255,255,255,0.4)" }}>{desc}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer */}
        <div className="relative z-10">
          <div
            className="pt-8 border-t text-[11px]"
            style={{ borderColor: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.3)" }}
          >
            © {new Date().getFullYear()} Automation & Plant Technologies Ltd
          </div>
        </div>
      </div>

      {/* Right content area */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2.5 mb-8">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs shrink-0"
            style={{ background: "#0057b8" }}
          >
            APT
          </div>
          <div className="font-semibold text-[15px]" style={{ color: "var(--apt-text-primary)" }}>
            APT Ghana Admin
          </div>
        </div>

        {children}
      </div>
    </div>
  );
}
