import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import ServiceForm from "@/components/services/ServiceForm";

export const metadata: Metadata = { title: "New Service" };

export default async function NewServicePage({
  searchParams,
}: {
  searchParams: Promise<{ section?: string }>;
}) {
  const { section } = await searchParams;

  return (
    <div>
      <div
        className="flex items-center gap-4 px-6 py-4"
        style={{ borderBottom: "1px solid var(--apt-border)", background: "var(--apt-bg)" }}
      >
        <Link href="/dashboard/services">
          <Button variant="ghost" size="sm" icon={<ChevronLeft size={14} />}>Services</Button>
        </Link>
        <div style={{ width: 1, height: 20, background: "var(--apt-border)" }} />
        <h1 className="text-[15px] font-semibold" style={{ color: "var(--apt-text-primary)" }}>New Service Item</h1>
      </div>
      <div className="p-6 max-w-xl">
        <ServiceForm initial={section ? { section } : undefined} />
      </div>
    </div>
  );
}
