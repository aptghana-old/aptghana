import type { Metadata } from "next";
import Link from "next/link";
import { Building2, ChevronRight } from "lucide-react";
import CompanyPageForm from "@/components/company/CompanyPageForm";

export const metadata: Metadata = { title: "New Company Page" };

export default function NewCompanyPage() {
  return (
    <div>
      <div className="card-header flex items-center gap-2 text-[12px]" style={{ color: "var(--apt-text-muted)" }}>
        <Link href="/dashboard/company" className="flex items-center gap-1.5 hover:text-[var(--apt-text-primary)] transition-colors">
          <Building2 size={13} />
          <span>Company</span>
        </Link>
        <ChevronRight size={11} />
        <span style={{ color: "var(--apt-text-primary)" }}>New Page</span>
      </div>

      <div className="p-4 sm:p-6 max-w-3xl">
        <div className="mb-6">
          <h1 className="text-[18px] font-bold" style={{ color: "var(--apt-text-primary)" }}>
            New Company Page
          </h1>
          <p className="text-[13px] mt-1" style={{ color: "var(--apt-text-muted)" }}>
            Add a new sub-page under /company
          </p>
        </div>
        <CompanyPageForm />
      </div>
    </div>
  );
}
