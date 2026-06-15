"use server";

import { connectDB, AdminModel } from "@apt/db";
import { generateToken, hashToken, createRateLimiter } from "@apt/auth";
import { Resend } from "resend";
import { headers } from "next/headers";

const forgotLimiter = createRateLimiter(3, 15 * 60 * 1000); // 3 per 15 min per IP

export type ForgotPasswordState =
  | null
  | { success: true }
  | { error: "TOO_MANY_ATTEMPTS" | "UNKNOWN" };

export async function forgotPasswordAction(
  _prev: ForgotPasswordState,
  formData: FormData,
): Promise<ForgotPasswordState> {
  const email = ((formData.get("email") as string) ?? "").trim().toLowerCase();
  if (!email) return { error: "UNKNOWN" };

  const hdrs = await headers();
  const ip =
    hdrs.get("x-real-ip") ??
    (process.env.TRUSTED_PROXY_HEADER === "1"
      ? (hdrs.get("x-forwarded-for") ?? "").split(",")[0]?.trim()
      : null) ??
    "unknown";

  const { allowed } = forgotLimiter.check(`admin:forgot:${ip}`);
  if (!allowed) return { error: "TOO_MANY_ATTEMPTS" };

  try {
    await connectDB();
    const admin = await AdminModel.findOne({ email }).lean<{ _id: unknown; name: string }>();

    // Always return success — don't leak whether the email exists
    if (admin) {
      const token = generateToken(32);
      const hashed = hashToken(token);
      const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await AdminModel.findByIdAndUpdate(admin._id, {
        passwordResetToken: hashed,
        passwordResetExpiry: expiry,
      });

      const resetUrl = `${process.env.AUTH_URL}/reset-password?token=${token}`;

      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: process.env.EMAIL_FROM ?? "APT Ghana <noreply@contact.aptghana.com>",
        to: email,
        subject: "Reset your APT Ghana admin password",
        html: `
          <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:40px 24px">
            <div style="margin-bottom:32px">
              <div style="display:inline-flex;align-items:center;justify-content:center;width:36px;height:36px;background:#0057b8;border-radius:8px;color:white;font-weight:700;font-size:11px">APT</div>
            </div>
            <h1 style="font-size:22px;font-weight:700;color:#0f172a;margin:0 0 8px">Reset your password</h1>
            <p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 24px">
              Hi ${admin.name}, we received a request to reset the password for your APT Ghana admin account.
              Click the button below to choose a new password. This link expires in 1 hour.
            </p>
            <a href="${resetUrl}" style="display:inline-block;background:#0057b8;color:white;font-weight:600;font-size:14px;padding:12px 24px;border-radius:8px;text-decoration:none">
              Reset password →
            </a>
            <p style="color:#94a3b8;font-size:12px;margin:24px 0 0">
              If you didn't request this, you can safely ignore this email. Your password won't change.
            </p>
            <hr style="border:none;border-top:1px solid #e2e8f0;margin:32px 0"/>
            <p style="color:#94a3b8;font-size:11px;margin:0">
              APT Ghana · Automation &amp; Plant Technologies Ltd
            </p>
          </div>
        `,
      });
    }

    return { success: true };
  } catch {
    return { error: "UNKNOWN" };
  }
}
