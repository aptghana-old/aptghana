import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/navigation/Header";
import Footer from "@/components/navigation/Footer";
import { connectDB, ResourceModel } from "@apt/db";
import { SITE_URL } from "@apt/config";
import { EmptyState, ErrorState } from "@apt/ui";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Technical Resources | APT Ghana",
  description:
    "Access APT Ghana's technical library, case studies, news & insights, product training, CAD downloads, and certifications. Engineering resources for industrial professionals.",
  openGraph: {
    title: "Technical Resources | APT Ghana",
    description: "Technical datasheets, case studies, training materials, and certifications from APT Ghana.",
    url: `${SITE_URL}/resources`,
  },
  alternates: { canonical: `${SITE_URL}/resources` },
};

interface ResourceCard {
  slug: string;
  title: string;
  tagline: string;
  badge: string;
  type: string;
  displayOrder: number;
}

const typeIcons: Record<string, React.ReactNode> = {
  library: (
    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
    </svg>
  ),
  "case-studies": (
    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" />
    </svg>
  ),
  news: (
    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6v-3z" />
    </svg>
  ),
  training: (
    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
    </svg>
  ),
  cad: (
    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
  ),
  certifications: (
    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
    </svg>
  ),
};

const defaultIcon = (
  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
  </svg>
);

async function getResources(): Promise<{ resources: ResourceCard[]; error: boolean }> {
  try {
    await connectDB();
    const docs = await ResourceModel.find({ status: "active" })
      .select("slug title tagline badge type displayOrder")
      .sort({ displayOrder: 1, title: 1 })
      .lean();

    type RawResource = { slug: string; title: string; tagline?: string; badge?: string; type: string; displayOrder?: number };
    return {
      resources: (docs as unknown as RawResource[]).map((d) => ({
        slug: d.slug,
        title: d.title,
        tagline: d.tagline || "",
        badge: d.badge || d.type || "",
        type: d.type,
        displayOrder: d.displayOrder ?? 0,
      })),
      error: false,
    };
  } catch (err) {
    console.error("[resources] Failed to load resources:", err);
    return { resources: [], error: true };
  }
}

export default async function ResourcesPage() {
  const { resources, error } = await getResources();

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
                  Technical Resources
                </span>
              </div>
              <h1
                className="text-4xl lg:text-5xl font-extrabold tracking-tight text-[#0F172A] mb-6"
                style={{ fontFamily: "var(--font-sora, 'Sora', sans-serif)" }}
              >
                Engineering Resources Hub
              </h1>
              <p className="text-[#64748B] text-lg leading-relaxed max-w-xl">
                Everything you need to specify, design, commission, and maintain industrial
                equipment from APT Ghana&apos;s portfolio — all in one place.
              </p>
            </div>
          </div>
        </section>

        {/* Resource Cards */}
        <section className="section-py bg-[#F8FAFC]">
          <div className="container-apt">
            {error ? (
              <ErrorState
                title="Unable to load resources"
                description="We could not retrieve the resources library at this time. Please refresh the page or contact us."
                action={
                  <Link href="/contact" className="inline-flex items-center gap-2 h-10 px-5 bg-navy-500 text-white text-sm font-semibold rounded-lg hover:bg-navy-400 transition-colors">
                    Contact Us
                  </Link>
                }
                fill
              />
            ) : resources.length === 0 ? (
              <EmptyState
                title="Resources coming soon"
                description="Our technical resources library is currently being populated. Contact our team for specific documentation or technical support."
                action={
                  <Link href="/contact" className="inline-flex items-center gap-2 h-10 px-5 bg-navy-500 text-white text-sm font-semibold rounded-lg hover:bg-navy-400 transition-colors">
                    Request Documentation
                  </Link>
                }
                fill
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {resources.map((res) => (
                  <Link
                    key={res.slug}
                    href={`/resources/${res.slug}`}
                    className="group bg-white rounded-2xl border border-[#E2E8F0] p-8 flex flex-col gap-5 hover:border-[#84CC16]/40 hover:shadow-lg hover:-translate-y-1 transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-[#0A0F1E] text-[#84CC16]">
                        {typeIcons[ res.type ] ?? defaultIcon}
                      </div>
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#84CC16]/10 text-[10px] font-bold text-[#84CC16] uppercase tracking-wider">
                        {res.badge}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h2
                        className="text-xl font-extrabold text-[#0F172A] mb-3 group-hover:text-[#1E3A5F] transition-colors"
                        style={{ fontFamily: "var(--font-sora, 'Sora', sans-serif)" }}
                      >
                        {res.title}
                      </h2>
                      <p className="text-[#64748B] text-sm leading-relaxed">{res.tagline}</p>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm font-semibold text-[#84CC16] group-hover:gap-3 transition-all">
                      <span>Access now</span>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 bg-[#0A0F1E]">
          <div className="container-apt text-center">
            <h2 className="text-3xl font-extrabold text-white mb-4" style={{ fontFamily: "var(--font-sora, 'Sora', sans-serif)" }}>
              Need Technical Support?
            </h2>
            <p className="text-[#94A3B8] text-base mb-8 max-w-lg mx-auto">
              Can&apos;t find what you&apos;re looking for? Our technical team can source specific documentation or provide direct engineering assistance.
            </p>
            <Link href="/contact" className="inline-flex items-center gap-2 h-12 px-7 bg-[#84CC16] text-[#0A0F1E] font-bold text-sm rounded-xl hover:bg-[#78B800] transition-colors">
              Contact Our Technical Team →
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
