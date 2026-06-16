/**
 * P-07: Nonce-based Content Security Policy.
 * Replaces middleware.ts per the Next.js 16 proxy convention.
 *
 * On every request:
 * 1. NextAuth runs its authorized callback (SEC-009 + P-17 idle timeout).
 * 2. A per-request nonce is generated and injected into the CSP header.
 * 3. The nonce is forwarded to pages via the `x-nonce` request header so
 *    Next.js can attach it automatically to its framework scripts.
 */
import { NextRequest, NextResponse } from "next/server";
import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth/config";

const { auth } = NextAuth({
  ...authConfig,
  secret: [
    process.env.ADMIN_AUTH_SECRET,
    process.env.AUTH_SECRET,
  ].filter(Boolean) as string[],
});

const isDev = process.env.NODE_ENV === "development";

function buildCsp(nonce: string): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    // style-src must use 'unsafe-inline' without a nonce — when a nonce is present
    // browsers ignore 'unsafe-inline' per spec, which blocks React's style={{ }} props.
    // Inline style attributes cannot receive nonces, so nonce-based style enforcement
    // is not viable here. Script nonce (above) covers the higher-risk injection vector.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' https: blob:",
    "connect-src 'self'",
    "font-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join("; ");
}

export async function proxy(request: NextRequest) {
  // Run NextAuth: calls authorized callback (handles SEC-009 API guard, P-17 idle check,
  // protected route redirects). Returns a Response on redirect/block, null to proceed.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const authResult = await (auth as (req: NextRequest) => Promise<Response | null>)(request);

  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp   = buildCsp(nonce);

  // NextAuth's `auth()` middleware wrapper always returns a Response instance —
  // even when the `authorized` callback simply returns `true` to allow the request
  // through (it wraps that case in a plain NextResponse.next()). So we can't use
  // `instanceof Response` to distinguish "blocked" from "passed". Instead, check for
  // the actual signals of a block: a redirect (Location header / 3xx) or an auth
  // error status (401/403).
  const isBlocking =
    authResult instanceof Response &&
    (authResult.status >= 300 && authResult.status < 400 ||
      authResult.headers.has("location") ||
      authResult.status === 401 ||
      authResult.status === 403);

  if (isBlocking) {
    authResult!.headers.set("Content-Security-Policy", csp);
    return authResult;
  }

  // Auth passed — forward nonce to pages and set CSP on the response.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);

  const response = NextResponse.next({ request: { headers: requestHeaders } });

  // Preserve any side-effect headers NextAuth's pass-through response set
  // (e.g. session cookie rotation) since we're discarding that response object.
  if (authResult instanceof Response) {
    authResult.headers.forEach((value, key) => {
      if (key.toLowerCase() === "set-cookie") response.headers.append(key, value);
    });
  }

  response.headers.set("Content-Security-Policy", csp);
  // Preserve other security headers that were previously set in next.config.ts
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");
  response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  return response;
}

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
