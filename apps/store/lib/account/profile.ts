import { connectDB, UserModel } from "@apt/db";

/* Single source for the profile shape — used by /api/me and the server pages. */

export interface AccountProfile {
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  pendingEmail: string | null;
  emailVerified: boolean;
  phone: string;
  accountType: string;
  company: string;
  jobTitle: string;
  businessType: string;
  avatar: string | null;
  notificationPrefs: Record<string, boolean>;
  mfaEnabled: boolean;
  createdAt: string | null;
  lastLoginAt: string | null;
}

export async function getProfile(userId: string): Promise<AccountProfile | null> {
  await connectDB();
  const user = await UserModel.findById(userId)
    .select("email pendingEmail emailVerified name phone accountType company jobTitle businessType avatar notificationPrefs mfaEnabled createdAt lastLoginAt")
    .lean<{
      email: string; pendingEmail?: string; emailVerified: boolean; name: string;
      phone?: string; accountType: string; company?: string; jobTitle?: string;
      businessType?: string; avatar?: string; notificationPrefs?: Record<string, boolean>;
      mfaEnabled: boolean; createdAt?: Date; lastLoginAt?: Date;
    }>();
  if (!user) return null;

  const [firstName = "", ...rest] = (user.name ?? "").trim().split(/\s+/);
  return {
    firstName,
    lastName: rest.join(" "),
    name: user.name,
    email: user.email,
    pendingEmail: user.pendingEmail ?? null,
    emailVerified: user.emailVerified,
    phone: user.phone ?? "",
    accountType: user.accountType,
    company: user.company ?? "",
    jobTitle: user.jobTitle ?? "",
    businessType: user.businessType ?? "",
    avatar: user.avatar ?? null,
    notificationPrefs: (user.notificationPrefs ?? {}) as Record<string, boolean>,
    mfaEnabled: user.mfaEnabled,
    createdAt: user.createdAt ? user.createdAt.toISOString() : null,
    lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
  };
}
