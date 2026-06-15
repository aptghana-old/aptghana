"use server";

import { connectDB, AdminModel } from "@apt/db";
import { hashToken, hashPassword, isPasswordValid } from "@apt/auth";
import { redirect } from "next/navigation";

export type ResetPasswordState =
  | null
  | { error: "INVALID_TOKEN" | "EXPIRED_TOKEN" | "WEAK_PASSWORD" | "PASSWORDS_MISMATCH" | "UNKNOWN" };

export async function resetPasswordAction(
  _prev: ResetPasswordState,
  formData: FormData,
): Promise<ResetPasswordState> {
  const token           = ((formData.get("token") as string) ?? "").trim();
  const newPassword     = (formData.get("password") as string) ?? "";
  const confirmPassword = (formData.get("confirmPassword") as string) ?? "";

  if (!token) return { error: "INVALID_TOKEN" };
  if (newPassword !== confirmPassword) return { error: "PASSWORDS_MISMATCH" };
  if (!isPasswordValid(newPassword)) return { error: "WEAK_PASSWORD" };

  await connectDB();
  const hashed = hashToken(token);
  const admin = await AdminModel
    .findOne({ passwordResetToken: hashed })
    .select("+passwordResetToken +passwordResetExpiry")
    .lean<{ _id: unknown; passwordResetExpiry?: Date }>();

  if (!admin) return { error: "INVALID_TOKEN" };
  if (!admin.passwordResetExpiry || admin.passwordResetExpiry < new Date()) {
    return { error: "EXPIRED_TOKEN" };
  }

  const passwordHash = await hashPassword(newPassword);
  await AdminModel.findByIdAndUpdate(admin._id, {
    passwordHash,
    $unset: { passwordResetToken: 1, passwordResetExpiry: 1 },
    // Increment sessionVersion to invalidate all existing sessions (if implemented)
  });

  redirect("/login?reset=success");
}
