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
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options",           value: "DENY" },
          { key: "X-Content-Type-Options",     value: "nosniff" },
          { key: "Referrer-Policy",            value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy",         value: "camera=(), microphone=(), geolocation=(), payment=()" },
          { key: "Strict-Transport-Security",  value: "max-age=63072000; includeSubDomains; preload" },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline'",    // TODO: replace with nonce-based CSP (M-19)
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' https: blob:",           // L-09: removed data: (data URIs not needed)
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
