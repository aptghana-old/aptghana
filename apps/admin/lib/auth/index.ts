import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { connectDB, AdminModel } from "@apt/db";
import { verifyPassword, verifyMfaOtp } from "@apt/auth";
import { authConfig } from "./config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  secret: process.env.ADMIN_AUTH_SECRET ?? process.env.AUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8-hour admin sessions
  },
  providers: [
    Credentials({
      credentials: {
        email:    {},
        password: {},
        otp:      {},
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
          role:        admin.role,
          permissions: admin.permissions,
          mfaEnabled:  admin.mfaEnabled,
        };
      },
    }),
  ],
  callbacks: {
    authorized: authConfig.callbacks.authorized,

    async jwt({ token, user }) {
      if (user) {
        token.id          = user.id ?? "";
        token.role        = (user as { role?: string }).role ?? "viewer";
        token.permissions = (user as { permissions?: string[] }).permissions ?? [];
        token.mfaEnabled  = (user as { mfaEnabled?: boolean }).mfaEnabled ?? false;
      }
      return token;
    },

    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const u = session.user as any;
        u.role        = token.role;
        u.permissions = token.permissions;
        u.mfaEnabled  = token.mfaEnabled;
      }
      return session;
    },
  },
});
