import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, Edit, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ComingSoon } from "@/components/ui/ComingSoon";

export const metadata: Metadata = { title: "Article" };

export default async function ArticleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <div>
      <div
        className="flex items-center gap-4 px-6 py-4"
        style={{ borderBottom: "1px solid var(--apt-border)", background: "var(--apt-bg)" }}
      >
        <Link href="/dashboard/articles">
          <Button variant="ghost" size="sm" icon={<ChevronLeft size={14} />}>Articles</Button>
        </Link>
        <div style={{ width: 1, height: 20, background: "var(--apt-border)" }} />
        <h1 className="text-[15px] font-semibold" style={{ color: "var(--apt-text-primary)" }}>Article</h1>
        <div className="ml-auto">
          <Link href={`/dashboard/articles/${id}/edit`}>
            <Button variant="secondary" size="sm" icon={<Edit size={13} />}>Edit</Button>
          </Link>
        </div>
      </div>
      <div className="p-6">
        <div className="card">
          <ComingSoon
            icon={<BookOpen size={24} />}
            title="Article Editor"
            description="The full CMS article editor — rich text, media embedding, SEO, tags, and scheduling — is in active development."
            milestones={[
              { label: "Rich text editor (Tiptap)", done: false },
              { label: "Media uploads and embedding", done: false },
              { label: "SEO fields per article", done: false },
              { label: "Tags and categories", done: false },
              { label: "Scheduled publish", done: false },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
