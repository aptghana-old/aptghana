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
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline'",    // TODO: replace with nonce-based CSP (M-19)
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' https: blob:",           // L-09: removed data:
              "connect-src 'self'",
              "font-src 'self'",
              "frame-ancestors 'none'",
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
