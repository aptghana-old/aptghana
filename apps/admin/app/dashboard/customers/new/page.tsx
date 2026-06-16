import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { hasPermission, type AdminRole } from "@apt/auth";
import { auth } from "@/lib/auth";
import CustomerForm from "@/components/customers/CustomerForm";

export const metadata: Metadata = { title: "Add Customer" };

export default async function NewCustomerPage() {
  const session = await auth();
  const role = (session?.user as { role?: AdminRole } | undefined)?.role ?? "sales";
  const overrides = (session?.user as { permissions?: string[] } | undefined)?.permissions ?? [];
  if (!hasPermission(role, overrides, "customers:edit")) redirect("/dashboard/customers");

  return (
    <div>
      <div className="flex items-center gap-4 px-6 py-4" style={{ borderBottom: "1px solid var(--apt-border)", background: "var(--apt-bg)" }}>
        <Link href="/dashboard/customers">
          <Button variant="ghost" size="sm" icon={<ChevronLeft size={14} />}>Customers</Button>
        </Link>
        <div style={{ width: 1, height: 20, background: "var(--apt-border)" }} />
        <h1 className="text-[15px] font-semibold" style={{ color: "var(--apt-text-primary)" }}>Add Customer</h1>
      </div>
      <CustomerForm />
    </div>
  );
}
