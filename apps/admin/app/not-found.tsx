import Link from "next/link";
import { connection } from "next/server";
import { LayoutDashboard, ArrowLeft } from "lucide-react";

export default async function NotFound() {
  // Force dynamic rendering so the CSP nonce (set per-request by proxy.ts)
  // is available to inject into framework scripts — without this, Next
  // prerenders /_not-found statically at build time with no nonce, and
  // every script on the page gets blocked by the strict-dynamic CSP.
  await connection();

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: "#f8fafc", color: "#0f172a" }}>
      <div style={{ maxWidth: 480, width: "100%", textAlign: "center" }}>
        {/* APT Logo */}
        <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 48, height: 48, background: "#0a1628", borderRadius: 12, marginBottom: 24 }}>
          <span style={{ color: "#ff6b00", fontWeight: 700, fontSize: 11, letterSpacing: "-0.03em" }}>APT</span>
        </div>

        <div style={{ fontSize: 96, fontWeight: 800, color: "#e2e8f0", lineHeight: 1, marginBottom: 16, letterSpacing: "-0.04em" }}>
          404
        </div>

        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8, letterSpacing: "-0.02em" }}>
          Page not found
        </h1>
        <p style={{ fontSize: 14, color: "#64748b", marginBottom: 32, lineHeight: 1.6 }}>
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
          Use the navigation or search to find what you need.
        </p>

        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <Link
            href="/dashboard"
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "9px 16px", borderRadius: 8,
              background: "#0057b8", color: "#fff",
              fontSize: 13, fontWeight: 500, textDecoration: "none",
            }}
          >
            <LayoutDashboard size={14} />
            Go to Dashboard
          </Link>
          <Link
            href="javascript:history.back()"
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "9px 16px", borderRadius: 8,
              background: "#fff", color: "#475569",
              border: "1px solid #e2e8f0",
              fontSize: 13, fontWeight: 500, textDecoration: "none",
            }}
          >
            <ArrowLeft size={14} />
            Go back
          </Link>
        </div>
      </div>
    </div>
  );
}
