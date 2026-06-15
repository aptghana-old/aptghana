import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth/config";

const { auth } = NextAuth(authConfig);

export default auth;

export const config = {
  /*
   * Cover all routes — auth is checked in handlers for public API endpoints.
   * Previously excluded api/ routes which allowed unauthenticated access to
   * protected endpoints like /api/rfq/attachments/[id].
   */
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|logo\\.png|icons/|images/).*)",
  ],
};
