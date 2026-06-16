"use server";

import { connectDB, AdminModel } from "@apt/db";
import { verifyPassword, hashPassword, isPasswordValid } from "@apt/auth";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export type ProfileState =
  | null
  | { ok: true }
  | { error: "UNAUTHORIZED" | "NAME_REQUIRED" | "UNKNOWN" };

export async function updateProfileAction(_prev: ProfileState, formData: FormData): Promise<ProfileState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "UNAUTHORIZED" };

  const name = ((formData.get("name") as string) ?? "").trim();
  if (!name) return { error: "NAME_REQUIRED" };

  await connectDB();
  await AdminModel.findByIdAndUpdate(session.user.id, { name });
  revalidatePath("/dashboard/settings/profile");
  return { ok: true };
}

export type PasswordState =
  | null
  | { ok: true }
  | { error: "UNAUTHORIZED" | "WRONG_PASSWORD" | "WEAK_PASSWORD" | "MISMATCH" | "UNKNOWN" };

export async function changePasswordAction(_prev: PasswordState, formData: FormData): Promise<PasswordState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "UNAUTHORIZED" };

  const currentPassword = (formData.get("currentPassword") as string) ?? "";
  const newPassword     = (formData.get("newPassword") as string) ?? "";
  const confirmPassword = (formData.get("confirmPassword") as string) ?? "";

  if (newPassword !== confirmPassword) return { error: "MISMATCH" };
  if (!isPasswordValid(newPassword)) return { error: "WEAK_PASSWORD" };

  await connectDB();
  const admin = await AdminModel.findById(session.user.id).select("+passwordHash").lean<{ passwordHash: string }>();
  if (!admin) return { error: "UNAUTHORIZED" };

  const valid = await verifyPassword(currentPassword, admin.passwordHash);
  if (!valid) return { error: "WRONG_PASSWORD" };

  const passwordHash = await hashPassword(newPassword);
  await AdminModel.findByIdAndUpdate(session.user.id, { passwordHash });
  return { ok: true };
}
