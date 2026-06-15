import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, Plus, Edit } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";

export const metadata: Metadata = { title: "Articles" };

const SAMPLE_ARTICLES = [
  { id: "1", title: "How to Select the Right VFD for Your Application", category: "Technical Guide", status: "published", author: "APT Team", date: "2026-05-15" },
  { id: "2", title: "Understanding IEC vs NEMA Standards in Industrial Automation", category: "Knowledge Base", status: "published", author: "APT Team", date: "2026-04-28" },
  { id: "3", title: "APT Ghana Becomes Authorised Distributor for Camozzi", category: "News", status: "draft", author: "APT Team", date: "2026-06-01" },
];

export default function ArticlesPage() {
  return (
    <div>
      <PageHeader
        title="Articles"
        description="Blog posts, technical guides, case studies, and news."
        actions={
          <Link href="/dashboard/articles/new">
            <Button variant="primary" size="sm" icon={<Plus size={13} />}>New Article</Button>
          </Link>
        }
      />
      <div className="p-6">
        {SAMPLE_ARTICLES.length === 0 ? (
          <div className="card">
            <EmptyState
              icon={<BookOpen size={22} />}
              title="No articles yet"
              description="Start writing guides, case studies, and news articles."
              action={
                <Link href="/dashboard/articles/new">
                  <Button variant="primary" size="sm" icon={<Plus size={13} />}>Write first article</Button>
                </Link>
              }
            />
          </div>
        ) : (
          <div className="card overflow-hidden">
            <table className="data-table">
              <thead>
                <tr><th>Title</th><th>Category</th><th>Author</th><th>Status</th><th>Date</th><th className="w-px" /></tr>
              </thead>
              <tbody>
                {SAMPLE_ARTICLES.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <Link href={`/dashboard/articles/${a.id}`} className="text-[13px] font-medium hover:underline" style={{ color: "var(--apt-text-primary)" }}>
                        {a.title}
                      </Link>
                    </td>
                    <td><span className="text-[12px]" style={{ color: "var(--apt-text-muted)" }}>{a.category}</span></td>
                    <td><span className="text-[12px]" style={{ color: "var(--apt-text-secondary)" }}>{a.author}</span></td>
                    <td><Badge variant={a.status === "published" ? "active" : "draft"} dot>{a.status}</Badge></td>
                    <td><span className="text-[12px]" style={{ color: "var(--apt-text-muted)" }}>{a.date}</span></td>
                    <td>
                      <Link href={`/dashboard/articles/${a.id}/edit`}>
                        <Button variant="ghost" size="xs" icon={<Edit size={11} />}>Edit</Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
