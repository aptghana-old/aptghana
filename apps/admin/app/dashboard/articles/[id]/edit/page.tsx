import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, FileEdit } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ComingSoon } from "@/components/ui/ComingSoon";

export const metadata: Metadata = { title: "Edit Article" };

export default async function EditArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <div>
      <div
        className="flex items-center gap-4 px-6 py-4"
        style={{ borderBottom: "1px solid var(--apt-border)", background: "var(--apt-bg)" }}
      >
        <Link href={`/dashboard/articles/${id}`}>
          <Button variant="ghost" size="sm" icon={<ChevronLeft size={14} />}>Article</Button>
        </Link>
        <div style={{ width: 1, height: 20, background: "var(--apt-border)" }} />
        <h1 className="text-[15px] font-semibold" style={{ color: "var(--apt-text-primary)" }}>Edit Article</h1>
      </div>
      <div className="p-6">
        <div className="card">
          <ComingSoon
            icon={<FileEdit size={24} />}
            title="Article Edit Interface"
            description="Full-featured article editing with rich text, SEO controls, and media management is coming soon."
            milestones={[
              { label: "Tiptap rich text editor", done: false },
              { label: "Inline image and media uploads", done: false },
              { label: "Per-article SEO and OG settings", done: false },
              { label: "Publish / draft / scheduled states", done: false },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
