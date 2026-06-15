import type { NextAuthConfig } from "next-auth";

export const ADMIN_PROTECTED_PATHS = ["/dashboard"];
export const ADMIN_AUTH_PATHS = ["/login"];
// /api/auth is the NextAuth handler itself — must remain public
const PUBLIC_API_PREFIX = "/api/auth";

export const authConfig = {
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const path = nextUrl.pathname;

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

      if (isLoggedIn && path === "/login") {
        return Response.redirect(new URL("/dashboard", nextUrl));
      }

      return true;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
