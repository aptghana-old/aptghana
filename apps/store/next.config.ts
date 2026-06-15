import type { NextConfig } from "next";

const SITE_DOMAIN = "aptghana.com"; // keep in sync with packages/config/src/domains.ts

const nextConfig: NextConfig = {
  transpilePackages: [
    "@apt/auth",
    "@apt/config",
    "@apt/db",
    "@apt/documents",
    "@apt/email",
    "@apt/payment",
    "@apt/search",
    "@apt/storage",
    "@apt/types",
    "@apt/ui",
  ],
  images: {
    remotePatterns: [
      { hostname: `*.${SITE_DOMAIN}` },
      { hostname: "media.camozzi.com" },
      { hostname: "telemecaniquesensors.com" },
    ],
  },
  experimental: {
    // M-07: Cap request body size — prevents memory exhaustion from large JSON payloads
    serverActions: {
      bodySizeLimit: "4mb",
    },
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            // P-07: Nonce-based CSP requires all pages to be dynamically rendered.
            // The store has ISR/static pages, so unsafe-inline is kept here as a
            // fallback; the full nonce migration is tracked in PENDING_SECURITY_AUDIT.md.
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' https: blob:",
              "connect-src 'self' https://search.aptghana.com",
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
