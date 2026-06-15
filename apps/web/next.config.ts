import type { NextConfig } from "next";

const SITE_DOMAIN = "aptghana.com"; // keep in sync with packages/config/src/domains.ts

const nextConfig: NextConfig = {
  transpilePackages: [
    "@apt/auth",
    "@apt/config",
    "@apt/db",
    "@apt/storage",
    "@apt/types",
    "@apt/ui",
  ],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: `*.${SITE_DOMAIN}` },
      { protocol: "https", hostname: "media.camozzi.com" },
      { protocol: "https", hostname: "telemecaniquesensors.com" },
      { protocol: "https", hostname: "*.socomec.com" },
      { protocol: "https", hostname: "*.schneider-electric.com" },
    ],
  },
  experimental: {
    // M-07: Cap request body size — prevents memory exhaustion from large JSON payloads
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options",           value: "DENY" },
          { key: "X-Content-Type-Options",     value: "nosniff" },
          { key: "Referrer-Policy",            value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy",         value: "camera=(), microphone=(), geolocation=()" },
          { key: "Strict-Transport-Security",  value: "max-age=63072000; includeSubDomains; preload" },
          {
            // P-07: Web/marketing pages are primarily static (ISR), making nonce-based
            // CSP incompatible without forcing dynamic rendering on every page.
            // unsafe-inline is retained until a full nonce migration is done.
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' https: blob:",
              "connect-src 'self'",
              "font-src 'self'",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              "upgrade-insecure-requests",
            ].join("; "),
          },
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
