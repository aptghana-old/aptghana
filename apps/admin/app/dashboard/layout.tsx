import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import DashboardShell from "@/components/layout/DashboardShell";
import { connectDB, ProductModel, QuoteModel } from "@apt/db";
import { formatNumber } from "@/lib/analytics/range";
import type { AdminRole } from "@apt/auth";

async function getNavCounts() {
  try {
    await connectDB();
    const [products, quotesPending] = await Promise.all([
      ProductModel.countDocuments({ status: "active" }),
      QuoteModel.countDocuments({ status: "pending" }),
    ]);
    return {
      products: formatNumber(products),
      quotesPending: quotesPending > 0 ? String(quotesPending) : undefined,
    };
  } catch {
    return {};
  }
}

function getSystemStatus() {
  const checks = [!!process.env.ODOO_URL, !!process.env.MEILISEARCH_HOST, !!process.env.PAYSTACK_SECRET_KEY];
  return { configured: checks.filter(Boolean).length, total: checks.length };
}

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

  const navCounts = await getNavCounts();

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
      navCounts={navCounts}
      systemStatus={getSystemStatus()}
    >
      {children}
    </DashboardShell>
  );
}
