import type { NextAuthConfig } from "next-auth";

/* Protected route prefixes — checked in both middleware and layouts */
export const PROTECTED_PATHS = [
  "/account/dashboard",
  "/account/settings",
  "/account/orders",
  "/account/quotes",
  "/account/addresses",
  "/account/profile",
  "/account/wishlist",
  "/account/payment",
  "/account/notifications",
  "/account/security",
];

export const AUTH_PATHS = [
  "/account/register",
  "/account/forgot-password",
  "/account/reset-password",
  "/account/verify-email",
];

/* Edge-compatible config — no Node.js imports allowed here */
export const authConfig = {
  pages: {
    signIn: "/account",
    error: "/account",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const path = nextUrl.pathname;

      const isProtected = PROTECTED_PATHS.some((p) => path.startsWith(p));
      if (isProtected && !isLoggedIn) {
        const url = new URL("/account", nextUrl);
        if (path !== "/account") url.searchParams.set("from", path);
        return Response.redirect(url);
      }

      // Redirect authenticated users away from sign-in to dashboard
      if (isLoggedIn && path === "/account" && !nextUrl.searchParams.has("signout")) {
        return Response.redirect(new URL("/account/dashboard", nextUrl));
      }

      return true;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
