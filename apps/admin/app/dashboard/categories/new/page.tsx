import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import CategoryForm from "@/components/categories/CategoryForm";

export const metadata: Metadata = { title: "New Group" };

interface Props {
  searchParams: Promise<{ name?: string }>;
}

export default async function NewCategoryPage({ searchParams }: Props) {
  const { name } = await searchParams;

  return (
    <div>
      <div
        className="flex items-center gap-4 px-6 py-4"
        style={{ borderBottom: "1px solid var(--apt-border)", background: "var(--apt-bg)" }}
      >
        <Link href="/dashboard/categories">
          <Button variant="ghost" size="sm" icon={<ChevronLeft size={14} />}>Categories</Button>
        </Link>
        <div style={{ width: 1, height: 20, background: "var(--apt-border)" }} />
        <h1 className="text-[15px] font-semibold" style={{ color: "var(--apt-text-primary)" }}>New Group</h1>
      </div>
      <div className="p-6 max-w-2xl">
        <p className="text-[12px] mb-4" style={{ color: "var(--apt-text-muted)" }}>
          Top-level entries are always Groups. To add a Category, Subcategory, or Range, use &ldquo;Add child&rdquo; on a node in the <Link href="/dashboard/categories" className="hover:underline" style={{ color: "var(--apt-text-brand)" }}>hierarchy manager</Link>.
        </p>
        <CategoryForm initial={name ? { name } : undefined} />
      </div>
    </div>
  );
}
