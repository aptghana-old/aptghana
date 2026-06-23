import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connectDB, AdminModel } from "@apt/db";
import { hasPermission, type AdminRole } from "@apt/auth";
import { auth } from "@/lib/auth";
import UsersClient from "./_components/UsersClient";
import type { AdminUser } from "./_components/types";

export const metadata: Metadata = { title: "Users & Roles" };

export const dynamic = "force-dynamic";

async function getAdmins(): Promise<AdminUser[]> {
  try {
    await connectDB();
    const docs = await AdminModel.find({ deletedAt: { $exists: false } })
      .sort({ role: 1, name: 1 })
      .select("-passwordHash -mfaSecret -passwordResetToken -passwordResetExpiry")
      .lean<AdminUser[]>();
    return docs.map((d) => ({ ...d, _id: String(d._id) }));
  } catch {
    return [];
  }
}

export default async function UsersPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id, role, permissions } = session.user as {
    id: string;
    role: AdminRole;
    permissions: string[];
  };

  if (!hasPermission(role, permissions ?? [], "users:view")) {
    redirect("/dashboard?error=forbidden");
  }

  const users = await getAdmins();
  const canCreate = hasPermission(role, permissions ?? [], "users:create");

  return (
    <UsersClient
      initialUsers={users}
      currentUserId={id}
      currentUserRole={role}
      canCreate={canCreate}
    />
  );
}
