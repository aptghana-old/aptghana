import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@apt/auth",
    "@apt/config",
    "@apt/db",
    "@apt/documents",
    "@apt/email",
    "@apt/odoo",
    "@apt/search",
    "@apt/storage",
    "@apt/types",
  ],
  experimental: {
    // M-07: Cap request body size — prevents memory exhaustion from large JSON payloads
    serverActions: {
      bodySizeLimit: "4mb",
    },
  },
  async headers() {
    return [
      {
        // P-07: Security headers are set per-request by proxy.ts (which also injects the CSP nonce).
        // This static fallback covers responses that bypass the proxy (e.g. static assets).
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options",          value: "DENY" },
          { key: "X-Content-Type-Options",    value: "nosniff" },
          { key: "Referrer-Policy",           value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy",        value: "camera=(), microphone=(), geolocation=(), payment=()" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
        ],
      },
      {
        source: "/api/(.*)",
        headers: [{ key: "Cache-Control", value: "no-store" }],
      },
    ];
  },
};

export default nextConfig;
