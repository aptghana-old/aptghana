import type { NextAuthConfig } from "next-auth";
import {
  hasPermission,
  ROUTE_PERMISSION_MAP,
  type AdminRole,
  type Permission,
} from "@apt/auth";

export const ADMIN_PROTECTED_PATHS = ["/dashboard"];
export const ADMIN_PUBLIC_PATHS = ["/login", "/forgot-password", "/reset-password"];
const PUBLIC_API_PREFIX = "/api/auth";

// P-17: Idle timeout — 30 minutes without a new token issuance logs out the admin.
const IDLE_TIMEOUT_MS = 30 * 60 * 1000;

export const authConfig = {
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const path = nextUrl.pathname;

      // P-17: Idle session check — token.lastActivityAt is forwarded via the JWT
      if (isLoggedIn) {
        const lastActivityAt = (auth?.user as { lastActivityAt?: number })?.lastActivityAt;
        if (lastActivityAt && Date.now() - lastActivityAt > IDLE_TIMEOUT_MS) {
          if (path.startsWith("/api") && !path.startsWith(PUBLIC_API_PREFIX)) {
            return Response.json(
              { error: "Session expired due to inactivity. Please sign in again." },
              { status: 403 },
            );
          }
          const url = new URL("/login", nextUrl);
          url.searchParams.set("reason", "idle");
          return Response.redirect(url);
        }
      }

      // SEC-009: All /api routes require a session except the NextAuth handler.
      if (path.startsWith("/api") && !path.startsWith(PUBLIC_API_PREFIX)) {
        if (!isLoggedIn) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }
        return true;
      }

      const isProtected = ADMIN_PROTECTED_PATHS.some((p) => path.startsWith(p));
      if (isProtected && !isLoggedIn) {
        const url = new URL("/login", nextUrl);
        url.searchParams.set("from", path);
        return Response.redirect(url);
      }

      // Redirect already-authenticated users away from auth pages
      const isAuthPage = ADMIN_PUBLIC_PATHS.some((p) => path === p);
      if (isLoggedIn && isAuthPage) {
        return Response.redirect(new URL("/dashboard", nextUrl));
      }

      // RBAC: enforce route-level permissions for authenticated dashboard pages.
      // Role + permissions come directly from the JWT token (set by the jwt callback
      // in lib/auth/index.ts and forwarded to auth.user in NextAuth v5 middleware).
      if (isLoggedIn && isProtected) {
        const user = auth?.user as { role?: string; permissions?: string[] };
        const role = user?.role as AdminRole | undefined;
        const overrides = user?.permissions ?? [];

        if (role) {
          const entry = ROUTE_PERMISSION_MAP.find((r) => path.startsWith(r.prefix));
          if (entry && !hasPermission(role, overrides, entry.permission as Permission)) {
            return Response.redirect(new URL("/dashboard?error=forbidden", nextUrl));
          }
        }
      }

      return true;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
