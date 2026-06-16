import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import DashboardShell from "@/components/layout/DashboardShell";
import type { AdminRole } from "@apt/auth";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = session.user as {
    name: string;
    email: string;
    role: AdminRole;
    permissions: string[];
    image?: string | null;
  };

  return (
    <DashboardShell
      user={{
        name:  user.name  ?? "Admin",
        email: user.email ?? "",
        role:  user.role  ?? "sales",
        image: user.image ?? null,
      }}
      role={user.role ?? "sales"}
      permissions={user.permissions ?? []}
    >
      {children}
    </DashboardShell>
  );
}
