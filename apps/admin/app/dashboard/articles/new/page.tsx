import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ComingSoon } from "@/components/ui/ComingSoon";
import { BookOpen } from "lucide-react";

export const metadata: Metadata = { title: "New Article" };

export default function NewArticlePage() {
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
        <div className="card">
          <ComingSoon
            icon={<BookOpen size={28} />}
            title="Rich Text Article Editor"
            description="A full-featured content editor with Markdown support, image embeds, SEO fields, and publishing workflow is coming."
            milestones={[
              { label: "Article schema & DB model", done: false },
              { label: "Rich text editor (ProseMirror/Tiptap)", done: false },
              { label: "Image uploads in editor", done: false },
              { label: "SEO metadata fields", done: false },
              { label: "Draft / publish workflow", done: false },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
