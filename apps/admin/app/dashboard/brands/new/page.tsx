import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import BrandForm from "@/components/brands/BrandForm";

export const metadata: Metadata = { title: "New Brand" };

export default function NewBrandPage() {
  return (
    <div>
      <div className="flex items-center gap-4 px-6 py-4" style={{ borderBottom: "1px solid var(--apt-border)", background: "var(--apt-bg)" }}>
        <Link href="/dashboard/brands">
          <Button variant="ghost" size="sm" icon={<ChevronLeft size={14} />}>Brands</Button>
        </Link>
        <div style={{ width: 1, height: 20, background: "var(--apt-border)" }} />
        <h1 className="text-[15px] font-semibold" style={{ color: "var(--apt-text-primary)" }}>New Brand</h1>
      </div>
      <div className="p-6 max-w-2xl">
        <BrandForm />
      </div>
    </div>
  );
}
