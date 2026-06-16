import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { connectDB, AdminModel } from "@apt/db";
import { PageHeader } from "@/components/ui/PageHeader";
import ProfileForm from "./ProfileForm";

export const metadata: Metadata = { title: "Profile Settings" };

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  await connectDB();
  const admin = await AdminModel.findById(session.user.id)
    .select("name email username role mfaEnabled avatar lastLoginAt createdAt")
    .lean<{
      name: string;
      email: string;
      username: string;
      role: string;
      mfaEnabled: boolean;
      avatar?: string;
      lastLoginAt?: Date;
      createdAt: Date;
    }>();

  if (!admin) redirect("/login");

  return (
    <div>
      <PageHeader
        title="Profile Settings"
        description="Manage your account details, password, and security preferences."
      />
      <div className="p-6 max-w-2xl">
        <ProfileForm
          name={admin.name}
          email={admin.email}
          username={admin.username}
          role={admin.role}
          mfaEnabled={admin.mfaEnabled}
          lastLoginAt={admin.lastLoginAt ? admin.lastLoginAt.toISOString() : null}
          createdAt={admin.createdAt.toISOString()}
        />
      </div>
    </div>
  );
}
