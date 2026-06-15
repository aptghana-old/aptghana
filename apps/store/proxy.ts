/**
 * Replaces middleware.ts per the Next.js 16 proxy convention.
 * Handles NextAuth session checks (protected store routes, sign-in redirects).
 *
 * CSP is handled statically in next.config.ts for the store because the store
 * has ISR/static pages where nonces cannot be injected at render time.
 * See PENDING_SECURITY_AUDIT.md P-07 for the full nonce migration path.
 */
import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth/config";

const { auth } = NextAuth(authConfig);

export const proxy = auth;

export const config = {
  matcher: [
    {
      source: "/((?!_next/static|_next/image|favicon\\.ico|logo\\.png|icons/|images/).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
