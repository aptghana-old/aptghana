import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import Header from "@/components/navigation/Header";
import Footer from "@/components/navigation/Footer";
import { SITE_URL, STORE_URL } from "@apt/config";
import { connectDB, CategoryModel } from "@apt/db";
import { EmptyState, ErrorState } from "@apt/ui";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Industrial Engineering Solutions | APT Ghana",
  description:
    "APT Ghana provides complete industrial engineering solutions including electrical distribution, automation & control, pneumatic systems, power & energy, conveying solutions, and safety systems.",
  openGraph: {
    title: "Industrial Engineering Solutions | APT Ghana",
    description:
      "Engineering solution areas serving Ghana's mining, manufacturing, energy, and infrastructure sectors.",
    url: `${SITE_URL}/solutions`,
  },
  alternates: { canonical: `${SITE_URL}/solutions` },
};

interface SolutionGroup {
  _id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  image: { url: string; alt: string };
  bulletPoints: string[];
  displayOrder: number;
}

async function getSolutionGroups(): Promise<{ groups: SolutionGroup[]; error: boolean }> {
  try {
    await connectDB();
    const docs = await CategoryModel.find({ level: "group", status: "active" })
      .select("_id slug name shortDescription description image bulletPoints displayOrder")
      .sort({ displayOrder: 1, name: 1 })
      .lean();

    type RawGroup = { _id: unknown; slug: string; name: string; shortDescription?: string; description?: string; image?: { url?: string; alt?: string }; bulletPoints?: string[]; displayOrder?: number };
    return {
      groups: (docs as unknown as RawGroup[]).map((g, i) => ({
        _id: String(g._id),
        slug: g.slug,
        name: g.name,
        tagline: g.shortDescription || "",
        description: g.description || g.shortDescription || "",
        image: { url: g.image?.url || "", alt: g.image?.alt || g.name },
        bulletPoints: (g.bulletPoints || []).slice(0, 4),
        displayOrder: g.displayOrder ?? i,
      })),
      error: false,
    };
  } catch (err) {
    console.error("[solutions] Failed to load solution groups:", err);
    return { groups: [], error: true };
  }
}

export default async function SolutionsPage() {
  const { groups, error } = await getSolutionGroups();

  return (
    <>
      <Header />
      <main>
        {/* Hero */}
        <section className="bg-[#F8FAFC] py-20">
          <div className="container-apt">
            <div className="max-w-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-6 h-0.5 rounded-full bg-[#84CC16]" />
                <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#84CC16]">
                  Engineering Solutions
                </span>
              </div>
              <h1
                className="text-4xl lg:text-5xl font-extrabold tracking-tight text-[#0F172A] mb-6"
                style={{ fontFamily: "var(--font-sora, 'Sora', sans-serif)" }}
              >
                Solutions for Every Industrial Challenge
              </h1>
              {groups.length > 0 && (
                <p className="text-[#64748B] text-lg leading-relaxed max-w-xl">
                  {groups.length} specialist engineering domains, backed by 26+ global OEM partnerships
                  and 15 years of project experience across West Africa&apos;s most demanding industrial sectors.
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Solutions Grid */}
        <section className="section-py bg-white">
          <div className="container-apt">
            {error ? (
              <ErrorState
                title="Unable to load solutions"
                description="We could not retrieve our solutions content at this time. Please refresh the page or contact us."
                action={
                  <Link href="/contact" className="inline-flex items-center gap-2 h-10 px-5 bg-navy-500 text-white text-sm font-semibold rounded-lg hover:bg-navy-400 transition-colors">
                    Contact Us
                  </Link>
                }
                fill
              />
            ) : groups.length === 0 ? (
              <EmptyState
                title="Solutions coming soon"
                description="Our engineering solutions directory is currently being configured. Contact our team to discuss your specific project requirements."
                action={
                  <Link href="/contact" className="inline-flex items-center gap-2 h-10 px-5 bg-navy-500 text-white text-sm font-semibold rounded-lg hover:bg-navy-400 transition-colors">
                    Discuss Your Project
                  </Link>
                }
                fill
              />
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {groups.map((sol, i) => (
                  <Link
                    key={sol.slug}
                    href={`/solutions/${sol.slug}`}
                    className={`group rounded-2xl border p-8 flex flex-col gap-6 transition-all hover:shadow-lg hover:-translate-y-1 ${i % 2 === 0
                      ? "bg-[#F8FAFC] border-[#E2E8F0] hover:border-[#84CC16]/40"
                      : "bg-white border-[#E2E8F0] hover:border-[#84CC16]/40"
                      }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        {sol.image.url ? (
                          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] shrink-0 overflow-hidden">
                            <Image
                              src={sol.image.url}
                              alt={sol.image.alt}
                              width={40}
                              height={40}
                              className="w-10 h-10 object-contain"
                            />
                          </div>
                        ) : (
                          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-[#0A0F1E] text-[#84CC16] shrink-0">
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                            </svg>
                          </div>
                        )}
                        <div>
                          <span className="text-xs font-bold text-[#94A3B8] uppercase tracking-widest">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          <h2
                            className="text-xl font-extrabold text-[#0F172A] group-hover:text-[#1E3A5F] transition-colors"
                            style={{ fontFamily: "var(--font-sora, 'Sora', sans-serif)" }}
                          >
                            {sol.name}
                          </h2>
                          {sol.tagline && (
                            <p className="text-xs text-[#84CC16] font-semibold uppercase tracking-wider mt-0.5">
                              {sol.tagline}
                            </p>
                          )}
                        </div>
                      </div>
                      <svg
                        className="w-5 h-5 text-[#94A3B8] group-hover:text-[#84CC16] transition-colors shrink-0 mt-1"
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                    </div>

                    <p className="text-[#64748B] text-sm leading-relaxed line-clamp-3">
                      {sol.description}
                    </p>

                    {sol.bulletPoints.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-auto">
                        {sol.bulletPoints.map((b) => (
                          <span
                            key={b}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0A0F1E]/5 text-xs font-medium text-[#0F172A]"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-[#84CC16]" />
                            {b}
                          </span>
                        ))}
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* CTA */}
        <section className="section-py bg-[#0A0F1E]">
          <div className="container-apt text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-6 h-0.5 rounded-full bg-[#84CC16]" />
              <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#84CC16]">Start Your Project</span>
              <div className="w-6 h-0.5 rounded-full bg-[#84CC16]" />
            </div>
            <h2
              className="text-4xl lg:text-5xl font-extrabold tracking-tight text-white mb-5 max-w-2xl mx-auto"
              style={{ fontFamily: "var(--font-sora, 'Sora', sans-serif)" }}
            >
              Not Sure Which Solution You Need?
            </h2>
            <p className="text-[#94A3B8] text-lg max-w-xl mx-auto mb-8">
              Our applications engineers are happy to discuss your project and recommend the right solution. No obligation.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link href="/contact" className="inline-flex items-center gap-2 h-12 px-7 bg-[#84CC16] text-[#0A0F1E] font-bold text-sm rounded-xl hover:bg-[#78B800] transition-colors">
                Talk to an Engineer →
              </Link>
              <Link href={STORE_URL} className="inline-flex items-center gap-2 h-12 px-7 border border-white/20 text-white font-bold text-sm rounded-xl hover:bg-white/10 transition-colors">
                Browse Products
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
