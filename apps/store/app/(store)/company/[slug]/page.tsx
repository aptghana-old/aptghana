import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { SITE_URL } from "@apt/config";

export const revalidate = 3600;

interface PageData {
  title: string;
  tagline: string;
  intro: string;
  sections: { heading: string; body: string }[];
  cta: { label: string; href: string };
}

async function getDbPage(slug: string): Promise<PageData | null> {
  try {
    const { connectDB, CompanyPageModel } = await import("@apt/db");
    await connectDB();
    const doc = await CompanyPageModel.findOne({ slug, status: "active" }).lean() as Record<string, unknown> | null;
    if (!doc) return null;
    return {
      title: doc.title as string,
      tagline: ((doc.tagline ?? "") as string),
      intro: ((doc.intro ?? "") as string),
      sections: Array.isArray(doc.sections)
        ? (doc.sections as { heading: string; body: string }[]).filter((s) => s.heading?.trim())
        : [],
      cta: {
        label: ((doc.ctaLabel ?? "Get in Touch") as string),
        href: ((doc.ctaHref ?? "/contact") as string),
      },
    };
  } catch {
    return null;
  }
}

export async function generateStaticParams() {
  try {
    const { connectDB, CompanyPageModel } = await import("@apt/db");
    await connectDB();
    const docs = await CompanyPageModel.find({ status: "active" }).select("slug").lean();
    const dbSlugs = (docs as unknown as { slug: string }[]).map((d) => ({ slug: d.slug }));
    // const staticSlugs = Object.keys(STATIC_PAGES).map((slug) => ({ slug }));
    // const all = [ ...staticSlugs ];
    // for (const s of dbSlugs) {
    //   if (!all.find((x) => x.slug === s.slug)) all.push(s);
    // }
    return dbSlugs;
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const dbPage = await getDbPage(slug);
  const page = dbPage;
  if (!page) return { title: "Not Found | APT Ghana" };
  return {
    title: `${page.title} | APT Ghana`,
    description: `${page.tagline} — ${page.intro.slice(0, 120)}…`,
    openGraph: {
      title: `${page.title} | APT Ghana`,
      description: page.tagline,
      url: `${SITE_URL}/company/${slug}`,
    },
    alternates: { canonical: `${SITE_URL}/company/${slug}` },
  };
}

export default async function CompanySubPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const dbPage = await getDbPage(slug);
  const page = dbPage;
  if (!page) notFound();

  return (
    <>
      <main>
        {/* Hero */}
        <section className="bg-[#F8FAFC] dark:bg-[#0A0F1E] pt-20 pb-6">
          <div className="container-apt">
            <div className="flex items-center gap-2 text-xs text-[#0F172A]/40 dark:text-white/40 mb-6">
              <Link href="/company" className="hover:text-[#0F172A]/60 dark:hover:text-white/70 transition-colors">
                Company
              </Link>
              <span>/</span>
              <span className="text-[#475569] dark:text-white/60">{page.title}</span>
            </div>
            <div className="max-w-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-6 h-0.5 rounded-full bg-[#84CC16]" />
                <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#84CC16]">
                  {page.tagline}
                </span>
              </div>
              <h1
                className="text-4xl lg:text-5xl font-extrabold tracking-tight text-[#0F172A] dark:text-white"
                style={{ fontFamily: "var(--font-sora, 'Sora', sans-serif)" }}
              >
                {page.title}
              </h1>
            </div>
          </div>
        </section>

        {/* Intro */}
        <section className="py-12 bg-[#F8FAFC] dark:bg-[#0D1526]">
          <div className="container-apt max-w-3xl">
            <p className="text-[#0F172A] dark:text-[#94A3B8] text-lg leading-relaxed">{page.intro}</p>
          </div>
        </section>

        {/* Detail sections */}
        {page.sections.length > 0 && (
          <section className="section-py bg-white dark:bg-[#0A0F1E]">
            <div className="container-apt">
              <div className="grid lg:grid-cols-2 gap-6 max-w-5xl mx-auto">
                {page.sections.map((s) => (
                  <div
                    key={s.heading}
                    className="p-7 bg-[#F8FAFC] dark:bg-surface-900 rounded-2xl border border-[#E2E8F0] dark:border-white/10"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-5 h-0.5 rounded-full bg-[#84CC16]" />
                      <h3
                        className="font-bold text-[#0F172A] dark:text-[#F1F5F9] text-base"
                        style={{ fontFamily: "var(--font-sora, 'Sora', sans-serif)" }}
                      >
                        {s.heading}
                      </h3>
                    </div>
                    <p className="text-sm text-[#64748B] dark:text-[#94A3B8] leading-relaxed">{s.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="py-14 bg-[#0A0F1E]">
          <div className="container-apt flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <h2
                className="text-2xl font-extrabold text-white mb-2"
                style={{ fontFamily: "var(--font-sora, 'Sora', sans-serif)" }}
              >
                Ready to connect with APT Ghana?
              </h2>
              <p className="text-white/50 text-sm">Our team responds within one business day.</p>
            </div>
            <div className="flex gap-3 shrink-0">
              <Link
                href={page.cta.href}
                className="inline-flex items-center gap-2 h-12 px-7 bg-[#84CC16] text-[#0A0F1E] font-bold text-sm rounded-xl hover:bg-[#78B800] transition-colors whitespace-nowrap"
              >
                {page.cta.label} →
              </Link>
              <Link
                href="/company"
                className="inline-flex items-center gap-2 h-12 px-7 border border-white/20 text-white font-bold text-sm rounded-xl hover:bg-white/10 transition-colors whitespace-nowrap"
              >
                Back to Company
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
