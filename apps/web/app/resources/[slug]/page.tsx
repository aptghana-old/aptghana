import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Header from "@/components/navigation/Header";
import Footer from "@/components/navigation/Footer";
import { SITE_URL } from "@apt/config";
import { connectDB, ResourceModel } from "@apt/db";

export const revalidate = 3600;

interface ResourcePage {
  title: string;
  tagline: string;
  intro: string;
  type: string;
  items: { _id?: string; title: string; desc: string; meta?: string }[];
  cta: { label: string; href: string };
}


// ─── DB fetch ─────────────────────────────────────────────────────────────────

async function getResource(slug: string): Promise<ResourcePage | null> {
  try {
    await connectDB();
    type RawItem = { _id?: unknown; title?: string; description?: string; meta?: string };
    type RawResource = { title: string; tagline?: string; intro?: string; type?: string; items?: RawItem[]; cta?: { label?: string; href?: string } };
    const doc = await ResourceModel.findOne({ slug, status: "active" }).lean() as unknown as RawResource | null;
    if (!doc) return null;
    return {
      title: doc.title,
      tagline: doc.tagline || "",
      intro: doc.intro || "",
      type: doc.type || "other",
      items: (doc.items || []).map((item) => ({
        _id: String(item._id || ""),
        title: item.title || "",
        desc: item.description || "",
        meta: item.meta || "",
      })),
      cta: { label: doc.cta?.label || "Get in Touch", href: doc.cta?.href || "/contact" },
    };
  } catch {
    return null;
  }
}

async function getAllSlugs(): Promise<string[]> {
  try {
    await connectDB();
    const docs = await ResourceModel.find({ status: "active" }).select("slug").lean() as unknown as { slug: string }[];
    return docs.map((d) => d.slug);
  } catch {
    return [];
  }
}

export async function generateStaticParams() {
  const slugs = await getAllSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = await getResource(slug);
  if (!page) return { title: "Resource Not Found | APT Ghana" };
  return {
    title: `${page.title} | APT Ghana`,
    description: `${page.tagline} — ${page.intro.slice(0, 120)}…`,
    openGraph: {
      title: `${page.title} | APT Ghana`,
      description: page.tagline,
      url: `${SITE_URL}/resources/${slug}`,
    },
    alternates: { canonical: `${SITE_URL}/resources/${slug}` },
  };
}

export default async function ResourceDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await getResource(slug);

  if (!page) notFound();

  return (
    <>
      <Header />
      <main>
        {/* Hero */}
        <section className="bg-[#F8FAFC] dark:bg-[#0A0F1E] py-20">
          <div className="container-apt">
            <div className="flex items-center gap-2 text-xs text-[#0F172A]/40 dark:text-white/40 mb-6">
              <Link href="/resources" className="hover:text-[#0F172A]/60 dark:hover:text-white/70 transition-colors">Resources</Link>
              <span>/</span>
              <span className="text-[#475569] dark:text-white/60">{page.title}</span>
            </div>
            <div className="max-w-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-6 h-0.5 rounded-full bg-[#84CC16]" />
                <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#84CC16]">{page.tagline}</span>
              </div>
              <h1
                className="text-4xl lg:text-5xl font-extrabold tracking-tight text-[#0F172A] dark:text-white mb-6"
                style={{ fontFamily: "var(--font-sora, 'Sora', sans-serif)" }}
              >
                {page.title}
              </h1>
            </div>
          </div>
        </section>

        {/* Intro */}
        <section className="py-14 bg-[#F8FAFC] dark:bg-[#0D1526]">
          <div className="container-apt max-w-3xl">
            <p className="text-[#0F172A] dark:text-[#94A3B8] text-lg leading-relaxed">{page.intro}</p>
          </div>
        </section>

        {/* Items grid */}
        <section className="section-py bg-white dark:bg-[#0A0F1E]">
          <div className="container-apt">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {page.items.map((item, i) => (
                <div
                  key={item._id || i}
                  className="flex flex-col p-7 bg-[#F8FAFC] dark:bg-surface-900 rounded-2xl border border-[#E2E8F0] dark:border-white/10 hover:border-[#84CC16]/30 hover:shadow-lg transition-all"
                >
                  <div className="flex items-center gap-2.5 mb-4">
                    <span className="w-2 h-2 rounded-full bg-[#84CC16] shrink-0" />
                    <h3
                      className="font-bold text-[#0F172A] dark:text-[#F1F5F9] text-sm leading-snug"
                      style={{ fontFamily: "var(--font-sora, 'Sora', sans-serif)" }}
                    >
                      {item.title}
                    </h3>
                  </div>
                  <p className="text-sm text-[#64748B] dark:text-[#94A3B8] leading-relaxed flex-1 mb-4">{item.desc}</p>
                  {item.meta && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#84CC16] bg-[#84CC16]/10 px-2.5 py-1 rounded-full w-fit">
                      {item.meta}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-14 bg-[#0A0F1E]">
          <div className="container-apt flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <h2 className="text-2xl font-extrabold text-white mb-2" style={{ fontFamily: "var(--font-sora, 'Sora', sans-serif)" }}>
                Can&apos;t find what you need?
              </h2>
              <p className="text-white/50 text-sm">Our technical team can source any documentation or resource.</p>
            </div>
            <div className="flex gap-3 shrink-0">
              <Link href={page.cta.href} className="inline-flex items-center gap-2 h-12 px-7 bg-[#84CC16] text-[#0A0F1E] font-bold text-sm rounded-xl hover:bg-[#78B800] transition-colors whitespace-nowrap">
                {page.cta.label} →
              </Link>
              <Link href="/resources" className="inline-flex items-center gap-2 h-12 px-7 border border-white/20 text-white font-bold text-sm rounded-xl hover:bg-white/10 transition-colors whitespace-nowrap">
                All Resources
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
