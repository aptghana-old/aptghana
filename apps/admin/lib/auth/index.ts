import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { connectDB, AdminModel } from "@apt/db";
import { verifyPassword, verifyMfaOtp } from "@apt/auth";
import { authConfig } from "./config";

const REMEMBER_ME_AGE = 30 * 24 * 60 * 60; // 30 days
const DEFAULT_SESSION_AGE = 8 * 60 * 60;    // 8 hours

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  // Pass both secrets so NextAuth tries each on decryption — allows key rotation
  // without invalidating existing sessions. New tokens are always signed with [0].
  secret: [
    process.env.ADMIN_AUTH_SECRET,
    process.env.AUTH_SECRET,
  ].filter(Boolean) as string[],
  session: {
    strategy: "jwt",
    maxAge: REMEMBER_ME_AGE, // upper bound; short sessions enforced via token.exp
  },
  providers: [
    Credentials({
      credentials: {
        email:     {},
        password:  {},
        otp:       {},
        rememberMe: {},
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        await connectDB();
        const admin = await AdminModel
          .findOne({ email: (credentials.email as string).toLowerCase().trim() })
          .select("+passwordHash +mfaSecret")
          .lean<{
            _id: unknown;
            email: string;
            name: string;
            username: string;
            passwordHash: string;
            role: string;
            permissions: string[];
            mfaEnabled: boolean;
            mfaSecret?: string;
            status: string;
            avatar?: string;
          }>();

        if (!admin) return null;

        const valid = await verifyPassword(credentials.password as string, admin.passwordHash);
        if (!valid) return null;

        if (admin.status === "suspended") throw new Error("ACCOUNT_SUSPENDED");

        if (admin.mfaEnabled) {
          const otp = (credentials.otp as string | undefined)?.trim();
          if (!otp) throw new Error("NEEDS_MFA");
          if (!verifyMfaOtp(otp, admin.mfaSecret!)) throw new Error("INVALID_OTP");
        }

        await AdminModel.findByIdAndUpdate(admin._id, { lastLoginAt: new Date() });

        return {
          id:          String(admin._id),
          email:       admin.email,
          name:        admin.name,
          image:       admin.avatar ?? null,
          role:        admin.role as import("@/types/next-auth").AdminRole,
          permissions: admin.permissions,
          mfaEnabled:  admin.mfaEnabled,
          rememberMe:  credentials.rememberMe as string,
        };
      },
    }),
  ],
  callbacks: {
    authorized: authConfig.callbacks.authorized,

    async jwt({ token, user }) {
      if (user) {
        token.id             = user.id ?? "";
        token.role           = (user as { role?: string }).role ?? "viewer";
        token.permissions    = (user as { permissions?: string[] }).permissions ?? [];
        token.mfaEnabled     = (user as { mfaEnabled?: boolean }).mfaEnabled ?? false;
        token.lastActivityAt = Date.now();
        token.rememberMe     = (user as { rememberMe?: string }).rememberMe === "1";
        // Set token expiry based on remember me preference
        const maxAge = token.rememberMe ? REMEMBER_ME_AGE : DEFAULT_SESSION_AGE;
        token.exp = Math.floor(Date.now() / 1000) + maxAge;
      } else {
        // P-17: Refresh lastActivityAt on every authenticated request (sliding idle window)
        token.lastActivityAt = Date.now();
      }
      return token;
    },

    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const u = session.user as any;
        u.role           = token.role;
        u.permissions    = token.permissions;
        u.mfaEnabled     = token.mfaEnabled;
        u.lastActivityAt = token.lastActivityAt;
      }
      return session;
    },
  },
});
