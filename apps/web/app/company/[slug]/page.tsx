import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Header from "@/components/navigation/Header";
import Footer from "@/components/navigation/Footer";
import { SITE_URL, EMAIL_CAREERS } from "@apt/config";

export const revalidate = 3600;

interface PageData {
  title: string;
  tagline: string;
  intro: string;
  sections: { heading: string; body: string }[];
  cta: { label: string; href: string };
}

const STATIC_PAGES: Record<string, PageData> = {
  about: {
    title: "About APT Ghana",
    tagline: "15+ Years of Industrial Excellence",
    intro:
      "Automation & Plant Technologies Limited (APT Ghana) was founded in 2009 with a clear vision: to become West Africa's most trusted source of industrial technology. From a small team serving local manufacturers, we have grown into a full-service distributor with deep expertise across automation, electrical, pneumatics, and conveying systems.",
    sections: [
      {
        heading: "Our Mission",
        body: "To empower West Africa's industries with world-class industrial technology, delivered through expert technical support, genuine products, and a commitment to long-term partnership.",
      },
      {
        heading: "Our Values",
        body: "Integrity in every transaction. Technical excellence in every recommendation. Responsiveness to every customer need. We don't just supply products — we build lasting relationships based on trust and performance.",
      },
      {
        heading: "Our Growth",
        body: "From a single-category startup to a multi-brand distributor supplying 6,000+ SKUs, APT Ghana has grown because our customers trust us. We have been recognized by Schneider Electric as Partner of the Year (Ghana 2021) and Marketing Excellence (Africa 2024) — awards that reflect our team's dedication.",
      },
      {
        heading: "Our Location",
        body: "Headquartered at North Industrial Area, Plot 7 Block 5, Dadeban Street, Accra. Our warehouse holds local stock of fast-moving items, enabling rapid delivery to customers across Ghana.",
      },
    ],
    cta: { label: "Contact Our Team", href: "/contact" },
  },
  team: {
    title: "Our Team",
    tagline: "Engineers & Specialists Who Know West Africa",
    intro:
      "APT Ghana's strength is its people. Our team combines deep product knowledge with years of hands-on experience commissioning and maintaining industrial systems in Ghana's unique operating environment.",
    sections: [
      {
        heading: "Technical Sales Engineers",
        body: "Our sales engineers are product-certified specialists who understand the technical requirements of your application before recommending a solution. We don't just quote — we specify.",
      },
      {
        heading: "After-Sales Support",
        body: "From commissioning assistance to fault-finding, our after-sales team is available to support you throughout the product life cycle. Service contracts, training, and emergency support available.",
      },
      {
        heading: "Logistics & Procurement",
        body: "Our procurement team manages relationships with 26+ OEM partners, ensuring genuine products, competitive pricing, and reliable lead times for everything from standard stock items to custom orders.",
      },
      {
        heading: "Training & Development",
        body: "We invest in continuous training for our staff — sending engineers to manufacturer-certified programs in Europe, Asia, and South Africa. This keeps our team current with the latest product developments.",
      },
    ],
    cta: { label: "Get Technical Support", href: "/contact" },
  },
  careers: {
    title: "Careers at APT Ghana",
    tagline: "Join West Africa's Leading Industrial Technology Team",
    intro:
      "APT Ghana is a fast-growing company with ambitious plans to expand our product portfolio and geographic reach across West Africa. We are always looking for talented, passionate people to join our team.",
    sections: [
      {
        heading: "Technical Sales Engineer",
        body: "We look for engineers with backgrounds in electrical, mechanical, or instrumentation engineering who have a passion for customer service and problem-solving. Experience with industrial automation, VFDs, or switchgear is a strong advantage.",
      },
      {
        heading: "Procurement & Logistics Coordinator",
        body: "We need organised, detail-oriented professionals to manage supplier relationships, purchase orders, and inbound logistics. Experience with industrial products and import procedures in Ghana is valuable.",
      },
      {
        heading: "Why APT Ghana",
        body: "We offer competitive salaries, manufacturer-certified training, career growth opportunities, and the chance to work on technically challenging projects across Ghana's most dynamic industries.",
      },
      {
        heading: "How to Apply",
        body: `Send your CV and a brief cover letter to ${EMAIL_CAREERS}. Tell us about your background, what role interests you, and why you want to join APT Ghana. We review all applications and respond to shortlisted candidates within two weeks.`,
      },
    ],
    cta: { label: "Send Your CV", href: `mailto:${EMAIL_CAREERS}` },
  },
  partnerships: {
    title: "Our Partnerships",
    tagline: "Authorized Distributor for 26+ World-Class Brands",
    intro:
      "APT Ghana holds authorized distributor agreements with 26+ world-leading industrial manufacturers. These partnerships are not just commercial agreements — they represent OEM endorsement of our technical competence, customer service standards, and market knowledge.",
    sections: [
      {
        heading: "Schneider Electric — Official Electrical Distributor",
        body: "APT Ghana is Schneider Electric's official certified Electrical Distributor in Ghana. We supply the full Schneider portfolio — from Acti 9 circuit breakers to ATV drives, EcoStruxure systems, and MV switchgear. Recognized with Partner of the Year (2021) and Marketing Excellence (Africa 2024).",
      },
      {
        heading: "WEG — Certified Partner",
        body: "WEG is one of the world's largest electric motor manufacturers. As a certified WEG partner, APT Ghana stocks W22 IE2/IE3 motors, frequency inverters, and soft starters for all industrial applications.",
      },
      {
        heading: "Camozzi — Authorized Distributor",
        body: "Camozzi pneumatics — valves, cylinders, air preparation units, and fittings — are stocked at our Accra warehouse. Camozzi's Italian engineering quality and broad catalogue make them our go-to for pneumatic systems.",
      },
      {
        heading: "Other Partner Brands",
        body: "Our full portfolio includes ABB, Siemens, Legrand, Phoenix Contact, WAGO, Festo, Parker Hannifin, Eaton, Omron, Provulco, EMC, Isenman, Telemecanique, and more. Full partner list available on our brands page.",
      },
    ],
    cta: { label: "View All Brands", href: "/brands" },
  },
  csr: {
    title: "Corporate Social Responsibility",
    tagline: "Investing in Ghana's Industrial Future",
    intro:
      "APT Ghana believes that a successful business has a responsibility to contribute to the communities and economies it operates in. Our CSR activities focus on skills development, technical education, and community investment in Ghana.",
    sections: [
      {
        heading: "Technical Training & Skills Development",
        body: "We partner with technical universities and vocational institutions across Ghana to provide industrial automation training. Our engineers deliver guest lectures, workshops, and hands-on training sessions to students and young professionals.",
      },
      {
        heading: "Apprenticeship Programme",
        body: "APT Ghana runs an apprenticeship programme for engineering graduates, providing practical exposure to industrial products, customer service, and technical sales. Successful graduates often join our permanent team.",
      },
      {
        heading: "Supporting Ghanaian Industry",
        body: "By maintaining local stock and employing Ghanaian engineers, APT Ghana contributes directly to Ghana's industrial capability. We believe that reducing lead times and improving technical support locally strengthens the competitiveness of Ghana's manufacturing sector.",
      },
      {
        heading: "Environmental Commitment",
        body: "We actively promote energy-efficient products — IE3 motors, VFDs, and power quality systems — that help our customers reduce energy consumption. Schneider Electric's EcoDesign philosophy runs throughout our product selection.",
      },
    ],
    cta: { label: "Contact Us", href: "/contact" },
  },
};

async function getDbPage(slug: string): Promise<PageData | null> {
  try {
    const { connectDB, CompanyPageModel } = await import("@apt/db");
    await connectDB();
    const doc = await CompanyPageModel.findOne({ slug, status: "active" }).lean() as Record<string, unknown> | null;
    if (!doc) return null;
    return {
      title:   doc.title   as string,
      tagline: ((doc.tagline  ?? "") as string),
      intro:   ((doc.intro   ?? "") as string),
      sections: Array.isArray(doc.sections)
        ? (doc.sections as { heading: string; body: string }[]).filter((s) => s.heading?.trim())
        : [],
      cta: {
        label: ((doc.ctaLabel ?? "Get in Touch") as string),
        href:  ((doc.ctaHref  ?? "/contact")     as string),
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
    const staticSlugs = Object.keys(STATIC_PAGES).map((slug) => ({ slug }));
    const all = [...staticSlugs];
    for (const s of dbSlugs) {
      if (!all.find((x) => x.slug === s.slug)) all.push(s);
    }
    return all;
  } catch {
    return Object.keys(STATIC_PAGES).map((slug) => ({ slug }));
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const dbPage = await getDbPage(slug);
  const page = dbPage ?? STATIC_PAGES[slug];
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
  const page = dbPage ?? STATIC_PAGES[slug];
  if (!page) notFound();

  return (
    <>
      <Header />
      <main>
        {/* Hero */}
        <section className="bg-[#F8FAFC] dark:bg-[#0A0F1E] pt-32 pb-6">
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
                <div className="w-6 h-[2px] rounded-full bg-[#84CC16]" />
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
                    className="p-7 bg-[#F8FAFC] dark:bg-[#111827] rounded-2xl border border-[#E2E8F0] dark:border-white/10"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-5 h-[2px] rounded-full bg-[#84CC16]" />
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
            <div className="flex gap-3 flex-shrink-0">
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
      <Footer />
    </>
  );
}
