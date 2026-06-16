import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { hasPermission, type AdminRole } from "@apt/auth";
import { Button } from "@/components/ui/Button";
import { auth } from "@/lib/auth";
import NewArticleForm from "@/components/articles/NewArticleForm";

export const metadata: Metadata = { title: "New Article" };

export default async function NewArticlePage() {
  const session = await auth();
  const role = (session?.user as { role?: AdminRole } | undefined)?.role ?? "sales";
  const overrides = (session?.user as { permissions?: string[] } | undefined)?.permissions ?? [];
  if (!hasPermission(role, overrides, "content:edit")) redirect("/dashboard/articles");

  return (
    <div>
      <div className="flex items-center gap-4 px-6 py-4" style={{ borderBottom: "1px solid var(--apt-border)", background: "var(--apt-bg)" }}>
        <Link href="/dashboard/articles">
          <Button variant="ghost" size="sm" icon={<ChevronLeft size={14} />}>Articles</Button>
        </Link>
        <div style={{ width: 1, height: 20, background: "var(--apt-border)" }} />
        <h1 className="text-[15px] font-semibold" style={{ color: "var(--apt-text-primary)" }}>New Article</h1>
      </div>
      <div className="p-6">
        <NewArticleForm />
      </div>
    </div>
  );
}
