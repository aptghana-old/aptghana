import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { verify as totpVerify } from "otplib";
import { connectDB, UserModel } from "@apt/db";
import { authConfig } from "./config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  secret: process.env.AUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30-day ceiling; per-session exp set in jwt callback
  },
  providers: [
    Credentials({
      credentials: {
        email:      {},
        password:   {},
        otp:        {},
        rememberMe: {},
      },
      async authorize(credentials, request) {
        if (!credentials?.email || !credentials?.password) return null;

        await connectDB();
        const user = await UserModel
          .findOne({ email: (credentials.email as string).toLowerCase().trim() })
          .select("+passwordHash +mfaSecret +otpFailedAttempts +otpLockedUntil")
          .lean<{
            _id: unknown;
            email: string;
            name: string;
            passwordHash: string;
            emailVerified: boolean;
            mfaEnabled: boolean;
            mfaSecret?: string;
            otpFailedAttempts?: number;
            otpLockedUntil?: Date;
            status: string;
            accountType: string;
            avatar?: string;
            sessionVersion?: number;
          }>();

        if (!user) return null;

        const valid = await bcrypt.compare(credentials.password as string, user.passwordHash);
        if (!valid) return null;

        if (!user.emailVerified) throw new Error("EMAIL_NOT_VERIFIED");
        if (user.status === "suspended") throw new Error("ACCOUNT_SUSPENDED");

        if (user.mfaEnabled) {
          const otp = (credentials.otp as string | undefined)?.trim();
          if (!otp) throw new Error("NEEDS_MFA");

          // P-06: Enforce OTP lockout before attempting verification
          if (user.otpLockedUntil && user.otpLockedUntil > new Date()) {
            throw new Error("ACCOUNT_LOCKED");
          }

          const result = await totpVerify({ token: otp, secret: user.mfaSecret! });
          if (!result.valid) {
            const failures = (user.otpFailedAttempts ?? 0) + 1;
            await UserModel.findByIdAndUpdate(user._id, {
              $inc: { otpFailedAttempts: 1 },
              ...(failures >= 5 ? {
                $set: { otpLockedUntil: new Date(Date.now() + 15 * 60 * 1000) },
              } : {}),
            });
            throw new Error("INVALID_OTP");
          }

          // Clear lockout state on successful OTP
          await UserModel.findByIdAndUpdate(user._id, {
            $set: { otpFailedAttempts: 0 },
            $unset: { otpLockedUntil: 1 },
          });
        }

        // Record the sign-in for the security page (keeps the last 20 events)
        // M-21: IP addresses are privacy-sensitive (GDPR). We store only a /24 subnet
        // prefix for IPv4 (e.g. 192.168.1.0) and a /48 prefix for IPv6, which is
        // sufficient for geolocation context without identifying the exact user.
        const headers = request?.headers;
        const rawIp = headers?.get?.("x-forwarded-for")?.split(",")[0]?.trim()
          || headers?.get?.("x-real-ip") || undefined;
        const ip = rawIp ? anonymizeIp(rawIp) : undefined;
        const userAgent = headers?.get?.("user-agent")?.slice(0, 300) || undefined;
        await UserModel.findByIdAndUpdate(user._id, {
          lastLoginAt: new Date(),
          $push: { loginHistory: { $each: [{ at: new Date(), ip, userAgent }], $slice: -20 } },
        });

        return {
          id:          String(user._id),
          email:       user.email,
          name:        user.name,
          image:       user.avatar ?? null,
          emailVerified: user.emailVerified,
          mfaEnabled:  user.mfaEnabled,
          accountType: user.accountType,
          sessionVersion: user.sessionVersion ?? 0,
          rememberMe:  credentials.rememberMe === "true",
        };
      },
    }),
  ],
  callbacks: {
    authorized: authConfig.callbacks.authorized,

    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id          = user.id ?? "";
        token.emailVerified = (user as { emailVerified?: boolean }).emailVerified ?? false;
        token.mfaEnabled  = (user as { mfaEnabled?: boolean }).mfaEnabled ?? false;
        token.accountType = (user as { accountType?: string }).accountType ?? "personal";
        token.sv          = (user as { sessionVersion?: number }).sessionVersion ?? 0;
        token.svCheckedAt = Date.now();
        // Respect remember-me: if false, expire in 24 h instead of 30 d
        if (!(user as { rememberMe?: boolean }).rememberMe) {
          token.exp = Math.floor(Date.now() / 1000) + 24 * 60 * 60;
        }
        return token;
      }

      // Client-side session updates (profile edits) refresh name/avatar
      if (trigger === "update" && session) {
        const patch = session as { name?: string; image?: string | null; mfaEnabled?: boolean };
        if (patch.name !== undefined) token.name = patch.name;
        if (patch.image !== undefined) token.picture = patch.image;
        if (patch.mfaEnabled !== undefined) token.mfaEnabled = patch.mfaEnabled;
      }

      // "Sign out all devices": re-validate the session version against the DB
      // at most every 5 minutes so revocation lands without per-request reads
      const checkedAt = (token.svCheckedAt as number | undefined) ?? 0;
      if (token.id && Date.now() - checkedAt > 5 * 60 * 1000) {
        try {
          await connectDB();
          const fresh = await UserModel.findById(token.id)
            .select("sessionVersion status")
            .lean<{ sessionVersion?: number; status?: string }>();
          if (!fresh || fresh.status === "suspended") return null;
          if ((fresh.sessionVersion ?? 0) !== ((token.sv as number | undefined) ?? 0)) return null;
          token.svCheckedAt = Date.now();
        } catch {
          // DB hiccup — keep the session; next request re-checks
        }
      }
      return token;
    },

    session({ session, token }) {
      if (session.user) {
        session.user.id           = token.id as string;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const u = session.user as any;
        u.emailVerified = token.emailVerified;
        u.mfaEnabled    = token.mfaEnabled;
        u.accountType   = token.accountType;
      }
      return session;
    },
  },
});

/** M-21: Anonymise an IP address for privacy-compliant storage.
 *  IPv4 → zero last octet (e.g. 192.168.1.123 → 192.168.1.0)
 *  IPv6 → zero last 80 bits, keep /48 prefix
 */
function anonymizeIp(ip: string): string {
  if (ip.includes(":")) {
    // IPv6 — keep first 3 groups (/48 prefix)
    const parts = ip.split(":");
    return [...parts.slice(0, 3), "0", "0", "0", "0", "0"].join(":").slice(0, 39);
  }
  // IPv4 — zero last octet
  const parts = ip.split(".");
  if (parts.length !== 4) return "0.0.0.0";
  return `${parts[0]}.${parts[1]}.${parts[2]}.0`;
}
