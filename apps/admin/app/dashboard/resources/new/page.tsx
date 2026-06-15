import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import ResourceForm from "@/components/resources/ResourceForm";

export const metadata: Metadata = { title: "New Resource" };

export default function NewResourcePage() {
  return (
    <div>
      <div
        className="flex items-center gap-4 px-6 py-4"
        style={{ borderBottom: "1px solid var(--apt-border)", background: "var(--apt-bg)" }}
      >
        <Link href="/dashboard/resources">
          <Button variant="ghost" size="sm" icon={<ChevronLeft size={14} />}>Resources</Button>
        </Link>
        <div style={{ width: 1, height: 20, background: "var(--apt-border)" }} />
        <h1 className="text-[15px] font-semibold" style={{ color: "var(--apt-text-primary)" }}>New Resource</h1>
      </div>
      <div className="p-6 max-w-2xl">
        <ResourceForm />
      </div>
    </div>
  );
}
