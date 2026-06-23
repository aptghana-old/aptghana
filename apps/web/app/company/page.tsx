import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import Header from "@/components/navigation/Header";
import Footer from "@/components/navigation/Footer";
import { SITE_URL } from "@apt/config";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Company | APT Ghana",
  description:
    "Learn about Automation & Plant Technologies Limited — West Africa's leading industrial technology distributor. Founded in 2009, serving mining, manufacturing, energy, and construction sectors.",
  openGraph: {
    title: "Company | APT Ghana",
    description: "About APT Ghana — 15+ years of industrial technology expertise in West Africa.",
    url: `${SITE_URL}/company`,
  },
  alternates: { canonical: `${SITE_URL}/company` },
};

interface DbPage {
  slug: string;
  title: string;
  tagline: string;
  icon: string;
  cardDescription: string;
  displayOrder: number;
  status: string;
}

interface DbStat {
  value: string;
  label: string;
  displayOrder: number;
  status: string;
}

const STATIC_SECTIONS = [
  {
    slug: "about",
    title: "About APT Ghana",
    desc: "Our story, mission, values, and the journey from a startup to West Africa's premier industrial technology platform.",
    icon: "🏢",
  },
  {
    slug: "team",
    title: "Our Team",
    desc: "Meet the engineers, sales professionals, and operations specialists who power APT Ghana's operations.",
    icon: "👥",
  },
  {
    slug: "careers",
    title: "Careers",
    desc: "Join APT Ghana's growing team. We're looking for passionate people to help us serve West Africa's industries.",
    icon: "💼",
  },
  {
    slug: "partnerships",
    title: "Partnerships",
    desc: "Our certified partnerships with Schneider Electric, WEG, Camozzi, and 26+ world-leading manufacturers.",
    icon: "🤝",
  },
  {
    slug: "csr",
    title: "Corporate Social Responsibility",
    desc: "How APT Ghana contributes to Ghana's industrial development, skills training, and community investment.",
    icon: "🌱",
  },
];

const STATIC_STATS = [
  { value: "2009", label: "Year Founded" },
  { value: "15+",  label: "Years in Business" },
  { value: "26+",  label: "Brand Partnerships" },
  { value: "6,000+", label: "Products Stocked" },
];

async function getDbData(): Promise<{ sections: DbPage[]; stats: DbStat[] }> {
  try {
    const { connectDB, CompanyPageModel, CompanyStatModel } = await import("@apt/db");
    await connectDB();
    const [rawPages, rawStats] = await Promise.all([
      CompanyPageModel.find({ status: "active" })
        .select("slug title tagline icon cardDescription displayOrder status")
        .sort({ displayOrder: 1, title: 1 })
        .lean(),
      CompanyStatModel.find({ status: "active" })
        .select("value label displayOrder status")
        .sort({ displayOrder: 1 })
        .lean(),
    ]);

    type RawPage = { slug: string; title: string; tagline?: string; icon?: string; cardDescription?: string; displayOrder?: number; status?: string };
    const sections: DbPage[] = (rawPages as unknown as RawPage[]).map((d) => ({
      slug:            d.slug,
      title:           d.title,
      tagline:         d.tagline ?? "",
      icon:            d.icon ?? "",
      cardDescription: d.cardDescription ?? "",
      displayOrder:    d.displayOrder ?? 0,
      status:          d.status ?? "active",
    }));

    type RawStat = { value: string; label: string; displayOrder?: number; status?: string };
    const stats: DbStat[] = (rawStats as unknown as RawStat[]).map((d) => ({
      value:        d.value,
      label:        d.label,
      displayOrder: d.displayOrder ?? 0,
      status:       d.status ?? "active",
    }));

    return { sections, stats };
  } catch {
    return { sections: [], stats: [] };
  }
}

export default async function CompanyPage() {
  const db = await getDbData();

  const sections = db.sections.length > 0
    ? db.sections.map((s) => ({ slug: s.slug, title: s.title, desc: s.cardDescription, icon: s.icon }))
    : STATIC_SECTIONS;

  const stats = db.stats.length > 0
    ? db.stats.map((s) => ({ value: s.value, label: s.label }))
    : STATIC_STATS;

  return (
    <>
      <Header />
      <main>
        {/* Hero */}
        <section className="bg-[#F8FAFC] dark:bg-[#0A0F1E] pt-32 pb-20">
          <div className="container-apt">
            <div className="max-w-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-6 h-[2px] rounded-full bg-[#84CC16]" />
                <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#84CC16]">
                  About Us
                </span>
              </div>
              <h1
                className="text-4xl lg:text-5xl font-extrabold tracking-tight text-[#0F172A] dark:text-white mb-6"
                style={{ fontFamily: "var(--font-sora, 'Sora', sans-serif)" }}
              >
                Automation & Plant Technologies Limited
              </h1>
              <p className="text-[#64748B] dark:text-[#94A3B8] text-lg leading-relaxed max-w-xl">
                Founded in 2009, APT Ghana has grown to become West Africa&apos;s most trusted
                industrial technology distributor — delivering world-class products and technical
                expertise to Ghana&apos;s most demanding industries.
              </p>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="bg-[#1E3A5F] py-10">
          <div className="container-apt">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {stats.map((s) => (
                <div key={s.label} className="text-center">
                  <div
                    className="text-4xl font-extrabold text-[#84CC16] mb-1"
                    style={{ fontFamily: "var(--font-sora, 'Sora', sans-serif)" }}
                  >
                    {s.value}
                  </div>
                  <div className="text-sm text-white/60 uppercase tracking-wider">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Company overview */}
        <section className="section-py bg-white dark:bg-[#0A0F1E]">
          <div className="container-apt">
            <div className="grid lg:grid-cols-2 gap-14 items-center mb-16">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-6 h-[2px] rounded-full bg-[#84CC16]" />
                  <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#84CC16]">
                    Our Story
                  </span>
                </div>
                <h2
                  className="text-3xl lg:text-4xl font-extrabold tracking-tight text-[#0F172A] dark:text-[#F1F5F9] mb-5"
                  style={{ fontFamily: "var(--font-sora, 'Sora', sans-serif)" }}
                >
                  Built for West Africa&apos;s Industrial Needs
                </h2>
                <p className="text-[#4B5563] dark:text-[#9CA3AF] text-base leading-relaxed mb-4">
                  APT Ghana was founded with a single mission: to deliver world-class industrial
                  technology to Ghana and West Africa&apos;s growing industries. From the beginning,
                  we invested in deep product knowledge and technical expertise — not just sales.
                </p>
                <p className="text-[#4B5563] dark:text-[#9CA3AF] text-base leading-relaxed mb-4">
                  Today, we are the official Schneider Electric Electrical Distributor for Ghana, a
                  certified WEG partner, and the authorized distributor for 26+ world-leading industrial
                  brands. Our team of engineers and sales professionals serves clients across mining,
                  oil &amp; gas, manufacturing, energy, and construction.
                </p>
                <p className="text-[#4B5563] dark:text-[#9CA3AF] text-base leading-relaxed">
                  Headquartered in Accra&apos;s North Industrial Area, we maintain local stock of
                  fast-moving items and can source specialized equipment within 2–6 weeks.
                </p>
              </div>
              <div className="relative rounded-2xl overflow-hidden shadow-2xl aspect-[4/3]">
                <Image
                  src="/images/about/about-us.jpg"
                  alt="APT Ghana Team"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  loading="lazy"
                />
                <div className="absolute bottom-0 inset-x-0 h-[3px] bg-[#84CC16]" />
              </div>
            </div>

            {/* Section cards */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {sections.map((s) => (
                <Link
                  key={s.slug}
                  href={`/company/${s.slug}`}
                  className="group flex flex-col gap-4 p-7 bg-[#F8FAFC] dark:bg-[#111827] rounded-2xl border border-[#E2E8F0] dark:border-white/10 hover:border-[#84CC16]/40 hover:shadow-lg hover:-translate-y-1 transition-all"
                >
                  <div className="text-3xl">{s.icon}</div>
                  <div>
                    <h3
                      className="font-bold text-[#0F172A] dark:text-[#F1F5F9] text-lg mb-2 group-hover:text-[#1E3A5F] dark:group-hover:text-[#84CC16] transition-colors"
                      style={{ fontFamily: "var(--font-sora, 'Sora', sans-serif)" }}
                    >
                      {s.title}
                    </h3>
                    <p className="text-sm text-[#64748B] dark:text-[#94A3B8] leading-relaxed">{s.desc}</p>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm font-semibold text-[#84CC16] mt-auto group-hover:gap-2.5 transition-all">
                    Learn More
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 bg-[#0A0F1E]">
          <div className="container-apt">
            <div className="bg-white/5 rounded-2xl border border-white/10 p-10 lg:p-14 flex flex-col lg:flex-row items-center justify-between gap-8">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-6 h-[2px] rounded-full bg-[#84CC16]" />
                  <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#84CC16]">
                    Work with Us
                  </span>
                </div>
                <h2
                  className="text-3xl font-extrabold tracking-tight text-white mb-3"
                  style={{ fontFamily: "var(--font-sora, 'Sora', sans-serif)" }}
                >
                  Ready to Partner with APT Ghana?
                </h2>
                <p className="text-white/60 text-sm max-w-lg">
                  Whether you&apos;re a customer, supplier, or prospective employee — we&apos;d love to hear from you.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 h-12 px-7 bg-[#84CC16] text-[#0A0F1E] font-bold text-sm rounded-xl hover:bg-[#78B800] transition-colors whitespace-nowrap"
                >
                  Get in Touch →
                </Link>
                <Link
                  href="/company/careers"
                  className="inline-flex items-center gap-2 h-12 px-7 border border-white/20 text-white font-bold text-sm rounded-xl hover:bg-white/10 transition-colors whitespace-nowrap"
                >
                  View Careers
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
