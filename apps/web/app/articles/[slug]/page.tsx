import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Header from "@/components/navigation/Header";
import Footer from "@/components/navigation/Footer";
import { SITE_URL } from "@apt/config";
import { connectDB, ArticleModel } from "@apt/db";

export const revalidate = 60;

interface ArticlePage {
  title: string;
  excerpt?: string;
  content: string;
  category?: string;
  authorName?: string;
  publishDate?: Date;
  readingTimeMinutes?: number;
  featuredImage?: { url?: string; alt?: string };
  seo?: { title?: string; description?: string; keywords?: string[]; ogImage?: string };
}

async function getArticle(slug: string): Promise<ArticlePage | null> {
  try {
    await connectDB();
    const article = await ArticleModel.findOneAndUpdate(
      { slug, status: "published" },
      { $inc: { viewCount: 1 } },
      { new: false }
    ).lean<ArticlePage>();
    return article ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) return { title: "Article Not Found | APT Ghana" };
  return {
    title: `${article.seo?.title || article.title} | APT Ghana`,
    description: article.seo?.description || article.excerpt,
    keywords: article.seo?.keywords,
    openGraph: {
      title: article.title,
      description: article.excerpt,
      url: `${SITE_URL}/articles/${slug}`,
      images: article.seo?.ogImage || article.featuredImage?.url ? [ article.seo?.ogImage || article.featuredImage!.url! ] : undefined,
    },
    alternates: { canonical: `${SITE_URL}/articles/${slug}` },
  };
}

export default async function ArticleDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) notFound();

  return (
    <>
      <Header />
      <main>
        <section className="bg-[#F8FAFC] dark:bg-[#0A0F1E] pt-20 pb-12">
          <div className="container-apt max-w-3xl">
            <div className="flex items-center gap-2 text-xs text-[#0F172A]/40 dark:text-white/40 mb-6">
              <Link href="/resources" className="hover:text-[#0F172A]/60 dark:hover:text-white/70 transition-colors">Articles</Link>
              {article.category && <><span>/</span><span className="text-[#475569] dark:text-white/60">{article.category}</span></>}
            </div>
            <h1
              className="text-3xl lg:text-4xl font-extrabold tracking-tight text-[#0F172A] dark:text-white mb-4"
              style={{ fontFamily: "var(--font-sora, 'Sora', sans-serif)" }}
            >
              {article.title}
            </h1>
            <div className="flex items-center gap-3 text-sm text-[#64748B] dark:text-[#94A3B8]">
              {article.authorName && <span>{article.authorName}</span>}
              {article.publishDate && <span>· {new Date(article.publishDate).toLocaleDateString("en-GH", { day: "numeric", month: "long", year: "numeric" })}</span>}
              {article.readingTimeMinutes ? <span>· {article.readingTimeMinutes} min read</span> : null}
            </div>
          </div>
        </section>

        {article.featuredImage?.url && (
          <section className="bg-[#F8FAFC] dark:bg-[#0A0F1E] pb-8">
            <div className="container-apt max-w-3xl">
              <div className="relative w-full aspect-video rounded-2xl overflow-hidden">
                <Image
                  src={article.featuredImage.url}
                  alt={article.featuredImage.alt ?? article.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 768px"
                  priority
                />
              </div>
            </div>
          </section>
        )}

        <section className="section-py bg-white dark:bg-[#0A0F1E]">
          <div className="container-apt max-w-3xl">
            <div
              className="article-prose text-[#0F172A] dark:text-[#E2E8F0]"
              dangerouslySetInnerHTML={{ __html: article.content }}
            />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
