import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connectDB, ArticleModel } from "@apt/db";
import { hasPermission, type AdminRole } from "@apt/auth";
import { auth } from "@/lib/auth";
import { getArticleAnalytics } from "@/lib/articleAnalytics";
import ArticleEditorShell, { type ArticleFormData } from "@/components/articles/ArticleEditorShell";

interface ArticleDoc {
  _id: { toString(): string };
  title: string;
  slug: string;
  excerpt?: string;
  content?: string;
  status: string;
  publishDate?: Date;
  category?: string;
  tags?: string[];
  featured?: boolean;
  authorName?: string;
  readingTimeMinutes?: number;
  canonicalUrl?: string;
  featuredImage?: { url?: string; alt?: string };
  gallery?: { url?: string; alt?: string }[];
  videos?: { url?: string; title?: string }[];
  attachments?: { name?: string; url?: string }[];
  seo?: { title?: string; description?: string; keywords?: string[]; ogImage?: string };
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  try {
    await connectDB();
    const a = await ArticleModel.findById(id).select("title").lean<{ title: string }>();
    return { title: a ? a.title : "Article" };
  } catch {
    return { title: "Article" };
  }
}

async function getArticle(id: string): Promise<ArticleDoc | null> {
  try {
    await connectDB();
    return await ArticleModel.findById(id).lean<ArticleDoc>();
  } catch {
    return null;
  }
}

export default async function ArticleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const article = await getArticle(id);
  if (!article) notFound();

  const session = await auth();
  const role = (session?.user as { role?: AdminRole } | undefined)?.role ?? "sales";
  const overrides = (session?.user as { permissions?: string[] } | undefined)?.permissions ?? [];
  const canEdit = hasPermission(role, overrides, "content:edit");

  const analytics = await getArticleAnalytics(article.slug);

  const initial: ArticleFormData = {
    title: article.title,
    slug: article.slug,
    excerpt: article.excerpt ?? "",
    content: article.content ?? "",
    status: article.status,
    publishDate: article.publishDate ? new Date(article.publishDate).toISOString().slice(0, 10) : "",
    category: article.category ?? "",
    tags: article.tags ?? [],
    featured: article.featured ?? false,
    authorName: article.authorName ?? "—",
    readingTimeMinutes: article.readingTimeMinutes ?? 0,
    canonicalUrl: article.canonicalUrl ?? "",
    featuredImage: article.featuredImage?.url ? { url: article.featuredImage.url, alt: article.featuredImage.alt } : null,
    gallery: (article.gallery ?? []).map((g) => ({ url: g.url ?? "", alt: g.alt })),
    videos: (article.videos ?? []).map((v) => ({ url: v.url ?? "", title: v.title })),
    attachments: (article.attachments ?? []).map((a) => ({ name: a.name ?? "", url: a.url ?? "" })),
    seoTitle: article.seo?.title ?? "",
    seoDescription: article.seo?.description ?? "",
    seoKeywords: article.seo?.keywords ?? [],
    ogImage: article.seo?.ogImage ?? "",
  };

  return <ArticleEditorShell articleId={id} initial={initial} canEdit={canEdit} analytics={analytics} />;
}
