import type { NextAuthConfig } from "next-auth";

export const ADMIN_PROTECTED_PATHS = ["/dashboard"];
export const ADMIN_PUBLIC_PATHS = ["/login", "/forgot-password", "/reset-password"];
// /api/auth is the NextAuth handler itself — must remain public
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

      // P-17: Idle session check
      if (isLoggedIn) {
        const lastActivityAt = auth?.user?.lastActivityAt;
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

      return true;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
