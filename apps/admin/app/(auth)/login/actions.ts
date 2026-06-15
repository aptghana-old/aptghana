"use server";

import { connectDB, AdminModel } from "@apt/db";
import { verifyPassword, verifyMfaOtp, createRateLimiter } from "@apt/auth";
import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { isRedirectError } from "next/dist/client/components/redirect-error";

// 10 attempts per 5 minutes per IP
const loginLimiter = createRateLimiter(10, 5 * 60 * 1000);

export type LoginState =
  | null
  | { needsMfa: true }
  | { error: "INVALID_CREDENTIALS" | "ACCOUNT_SUSPENDED" | "TOO_MANY_ATTEMPTS" | "INVALID_OTP" | "UNKNOWN" };

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email      = ((formData.get("email") as string) ?? "").trim().toLowerCase();
  const password   = (formData.get("password") as string) ?? "";
  const otp        = ((formData.get("otp") as string) ?? "").trim() || undefined;
  const rememberMe = formData.get("rememberMe") === "on";
  const from       = (formData.get("from") as string) || "/dashboard";

  if (!email || !password) return { error: "INVALID_CREDENTIALS" };

  // Rate limit by IP
  const hdrs = await headers();
  const ip =
    hdrs.get("x-real-ip") ??
    (process.env.TRUSTED_PROXY_HEADER === "1"
      ? (hdrs.get("x-forwarded-for") ?? "").split(",")[0]?.trim()
      : null) ??
    "unknown";

  const { allowed } = loginLimiter.check(`admin:login:${ip}`);
  if (!allowed) return { error: "TOO_MANY_ATTEMPTS" };

  // Validate credentials directly — gives us the MFA branch without relying on
  // NextAuth's error propagation, then calls signIn only on verified credentials.
  await connectDB();
  const admin = await AdminModel.findOne({ email })
    .select("+passwordHash +mfaSecret")
    .lean<{
      _id: unknown;
      passwordHash: string;
      status: string;
      mfaEnabled: boolean;
      mfaSecret?: string;
    }>();

  if (!admin) {
    // Constant-time response — don't reveal whether the email exists
    await verifyPassword("__probe__", "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBANH9H54SN3OQ");
    return { error: "INVALID_CREDENTIALS" };
  }

  const valid = await verifyPassword(password, admin.passwordHash);
  if (!valid) return { error: "INVALID_CREDENTIALS" };

  if (admin.status === "suspended") return { error: "ACCOUNT_SUSPENDED" };

  if (admin.mfaEnabled) {
    if (!otp) return { needsMfa: true };
    if (!verifyMfaOtp(otp, admin.mfaSecret!)) return { error: "INVALID_OTP" };
  }

  // Credentials verified — create NextAuth session
  try {
    await signIn("credentials", {
      email,
      password,
      otp: otp ?? "",
      rememberMe: rememberMe ? "1" : "",
      redirectTo: from,
    });
  } catch (error) {
    if (isRedirectError(error)) throw error; // successful redirect
    if (error instanceof AuthError) return { error: "UNKNOWN" };
    throw error;
  }

  redirect(from);
}
