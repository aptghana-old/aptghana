import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { connectDB, UserModel } from "@apt/db";
import { hasPermission, type AdminRole } from "@apt/auth";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge, statusVariant } from "@/components/ui/Badge";
import { auth } from "@/lib/auth";
import CustomerForm, { type CustomerFormData } from "@/components/customers/CustomerForm";

export const metadata: Metadata = { title: "Edit Customer" };

interface Props { params: Promise<{ id: string }> }

interface CustomerDoc {
  _id: { toString(): string };
  name: string; email: string; phone?: string; accountType: string; businessType?: string;
  company?: string; jobTitle?: string; industry?: string; website?: string; taxNumber?: string;
  status: string;
  addresses?: { line1: string; line2?: string; city: string; region?: string; country?: string; postalCode?: string; isDefaultBilling?: boolean; isDefaultShipping?: boolean }[];
}

async function getCustomer(id: string) {
  try {
    await connectDB();
    return await UserModel.findById(id).lean<CustomerDoc>();
  } catch {
    return null;
  }
}

export default async function EditCustomerPage({ params }: Props) {
  const session = await auth();
  const role = (session?.user as { role?: AdminRole } | undefined)?.role ?? "sales";
  const overrides = (session?.user as { permissions?: string[] } | undefined)?.permissions ?? [];
  if (!hasPermission(role, overrides, "customers:edit")) redirect("/dashboard/customers");

  const { id } = await params;
  const customer = await getCustomer(id);
  if (!customer) notFound();

  const billing = customer.addresses?.find((a) => a.isDefaultBilling);
  const shipping = customer.addresses?.find((a) => a.isDefaultShipping);
  const blankAddress = { line1: "", line2: "", city: "", region: "", country: "GH", postalCode: "" };

  const initial: Partial<CustomerFormData> = {
    name: customer.name,
    email: customer.email,
    phone: customer.phone ?? "",
    accountType: customer.accountType,
    businessType: customer.businessType ?? "",
    company: customer.company ?? "",
    jobTitle: customer.jobTitle ?? "",
    industry: customer.industry ?? "",
    website: customer.website ?? "",
    taxNumber: customer.taxNumber ?? "",
    status: customer.status,
    billingAddress: billing ? { line1: billing.line1, line2: billing.line2 ?? "", city: billing.city, region: billing.region ?? "", country: billing.country ?? "GH", postalCode: billing.postalCode ?? "" } : blankAddress,
    shippingAddress: shipping ? { line1: shipping.line1, line2: shipping.line2 ?? "", city: shipping.city, region: shipping.region ?? "", country: shipping.country ?? "GH", postalCode: shipping.postalCode ?? "" } : blankAddress,
  };

  return (
    <div>
      <div className="flex items-center gap-4 px-6 py-4 flex-wrap" style={{ borderBottom: "1px solid var(--apt-border)", background: "var(--apt-bg)" }}>
        <Link href={`/dashboard/customers/${id}`}>
          <Button variant="ghost" size="sm" icon={<ChevronLeft size={14} />}>Back to customer</Button>
        </Link>
        <div style={{ width: 1, height: 20, background: "var(--apt-border)" }} />
        <h1 className="text-[15px] font-semibold truncate flex-1" style={{ color: "var(--apt-text-primary)" }}>Edit: {customer.name}</h1>
        <Badge variant={statusVariant(customer.status)} dot>{customer.status}</Badge>
      </div>
      <CustomerForm customerId={id} initial={initial} />
    </div>
  );
}
