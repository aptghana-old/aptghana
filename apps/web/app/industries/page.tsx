import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/navigation/Header";
import Footer from "@/components/navigation/Footer";
import { connectDB, IndustryModel } from "@apt/db";
import { SITE_URL } from "@apt/config";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Industries We Serve | APT Ghana",
  description:
    "APT Ghana serves 8 major industrial sectors across West Africa including mining, oil & gas, manufacturing, energy, water, ports, food & beverage, and construction.",
  openGraph: {
    title: "Industries We Serve | APT Ghana",
    description: "Industrial technology solutions specialised for West Africa's most demanding sectors.",
    url: `${SITE_URL}/industries`,
  },
  alternates: { canonical: `${SITE_URL}/industries` },
};

interface IndustryCard {
  slug: string;
  name: string;
  tagline: string;
  shortDescription: string;
  icon: string;
  accentColor: string;
  displayOrder: number;
}

const staticIndustries: IndustryCard[] = [
  { slug: "mining",         name: "Mining & Minerals",          tagline: "Powering Ghana's Mining Industry",         shortDescription: "ATEX-rated equipment, heavy-duty conveyor systems, and explosion-proof drives for gold, bauxite, and manganese operations.", icon: "⛏", accentColor: "#F59E0B", displayOrder: 1 },
  { slug: "oil-gas",        name: "Oil & Gas",                  tagline: "Instrumentation for Upstream & Downstream", shortDescription: "Intrinsically safe instruments, ATEX/IECEx certified equipment, and emergency shutdown systems for upstream and downstream operations.", icon: "🛢", accentColor: "#6366F1", displayOrder: 2 },
  { slug: "manufacturing",  name: "Manufacturing",              tagline: "Automation for Modern Production",          shortDescription: "PLC-based production line automation, variable speed drives, pneumatic systems, and energy management for processing plants.", icon: "🏭", accentColor: "#0EA5E9", displayOrder: 3 },
  { slug: "energy",         name: "Power & Energy",             tagline: "Grid Protection & Power Quality",           shortDescription: "MV/LV switchgear, protection relays, power quality analysers, and capacitor banks for utilities and large industrials.", icon: "⚡", accentColor: "#84CC16", displayOrder: 4 },
  { slug: "water",          name: "Water & Wastewater",         tagline: "SCADA-Ready Water Solutions",              shortDescription: "Variable speed pump drives, chemical dosing controls, SCADA systems, and flow instrumentation for water treatment facilities.", icon: "💧", accentColor: "#06B6D4", displayOrder: 5 },
  { slug: "ports",          name: "Ports & Logistics",          tagline: "Heavy-Duty Port Electrification",          shortDescription: "Container crane drives, shore power systems, conveyor & stacker controls, and port lighting infrastructure.", icon: "🚢", accentColor: "#8B5CF6", displayOrder: 6 },
  { slug: "food-beverage",  name: "Food & Beverage",            tagline: "Hygienic Automation Solutions",            shortDescription: "IP69K-rated components, hygienic pneumatic systems, washdown sensors, and clean-in-place automation.", icon: "🍶", accentColor: "#EC4899", displayOrder: 7 },
  { slug: "construction",   name: "Construction & Infrastructure", tagline: "Power for Large-Scale Projects",        shortDescription: "Temporary power distribution, tower crane electrification, site safety systems, and robust electrical infrastructure.", icon: "🏗", accentColor: "#F97316", displayOrder: 8 },
];

async function getIndustries(): Promise<IndustryCard[]> {
  try {
    await connectDB();
    const docs = await IndustryModel.find({ status: "active" })
      .select("slug name tagline shortDescription icon accentColor displayOrder")
      .sort({ displayOrder: 1, name: 1 })
      .lean();

    if (!docs.length) return staticIndustries;

    type RawIndustry = { slug: string; name: string; tagline?: string; shortDescription?: string; icon?: string; accentColor?: string; displayOrder?: number };
    return (docs as unknown as RawIndustry[]).map((d) => ({
      slug: d.slug,
      name: d.name,
      tagline: d.tagline || "",
      shortDescription: d.shortDescription || "",
      icon: d.icon || "🏭",
      accentColor: d.accentColor || "#84CC16",
      displayOrder: d.displayOrder ?? 0,
    }));
  } catch {
    return staticIndustries;
  }
}

const stats = [
  { value: "8+", label: "Industry sectors served" },
  { value: "15+", label: "Years in West Africa" },
  { value: "500+", label: "Projects delivered" },
  { value: "Ghana", label: "HQ & primary market" },
];

export default async function IndustriesPage() {
  const industries = await getIndustries();

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
                  Industries We Serve
                </span>
              </div>
              <h1
                className="text-4xl lg:text-5xl font-extrabold tracking-tight text-[#0F172A] dark:text-white mb-6"
                style={{ fontFamily: "var(--font-sora, 'Sora', sans-serif)" }}
              >
                Specialized for West Africa&apos;s Industrial Sectors
              </h1>
              <p className="text-[#64748B] dark:text-[#94A3B8] text-lg leading-relaxed max-w-xl">
                From gold mines in the Ashanti Region to food processing plants in Greater
                Accra, APT Ghana engineers understand the unique challenges of operating
                industrial equipment in West Africa&apos;s climate, infrastructure, and
                regulatory environment.
              </p>
            </div>
          </div>
        </section>

        {/* Stats Strip */}
        <section className="bg-[#1E3A5F] py-10">
          <div className="container-apt">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div
                    className="text-4xl font-extrabold text-[#84CC16] mb-1"
                    style={{ fontFamily: "var(--font-sora, 'Sora', sans-serif)" }}
                  >
                    {stat.value}
                  </div>
                  <div className="text-sm text-white/60 uppercase tracking-wider">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Industry Cards */}
        <section className="section-py bg-[#F8FAFC] dark:bg-[#0A0F1E]">
          <div className="container-apt">
            <div className="max-w-2xl mb-12">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-6 h-[2px] rounded-full bg-[#84CC16]" />
                <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#84CC16]">
                  Sector Expertise
                </span>
              </div>
              <h2
                className="text-4xl lg:text-5xl font-extrabold tracking-tight text-[#0F172A] dark:text-[#F1F5F9]"
                style={{ fontFamily: "var(--font-sora, 'Sora', sans-serif)" }}
              >
                Deep Knowledge Across {industries.length} Sectors
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {industries.map((ind) => (
                <Link
                  key={ind.slug}
                  href={`/industries/${ind.slug}`}
                  className="group bg-white dark:bg-[#111827] rounded-2xl border border-[#E2E8F0] dark:border-white/10 p-7 flex flex-col gap-4 hover:border-[#84CC16]/40 hover:shadow-lg hover:-translate-y-1 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-3xl">{ind.icon}</span>
                    <svg
                      className="w-4 h-4 text-[#94A3B8] group-hover:text-[#84CC16] transition-colors"
                      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </div>
                  <div>
                    <h3
                      className="font-extrabold text-[#0F172A] dark:text-[#F1F5F9] text-lg mb-1 group-hover:text-[#1E3A5F] dark:group-hover:text-[#84CC16] transition-colors"
                      style={{ fontFamily: "var(--font-sora, 'Sora', sans-serif)" }}
                    >
                      {ind.name}
                    </h3>
                    <p className="text-xs font-semibold text-[#84CC16] uppercase tracking-wider mb-3">
                      {ind.tagline}
                    </p>
                    <p className="text-[#64748B] dark:text-[#94A3B8] text-sm leading-relaxed line-clamp-3">
                      {ind.shortDescription}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Why West Africa */}
        <section className="section-py bg-[#0A0F1E]">
          <div className="container-apt">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-6 h-[2px] rounded-full bg-[#84CC16]" />
                  <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#84CC16]">
                    Why APT Ghana
                  </span>
                </div>
                <h2
                  className="text-4xl lg:text-5xl font-extrabold tracking-tight text-white mb-6"
                  style={{ fontFamily: "var(--font-sora, 'Sora', sans-serif)" }}
                >
                  Specialized for West Africa&apos;s Conditions
                </h2>
                <p className="text-white/70 text-base leading-relaxed mb-6">
                  Importing equipment designed for European or North American conditions into
                  Ghana&apos;s industrial environment often results in premature failure. APT Ghana
                  engineers specify products that are rated for tropical temperatures (up to
                  55°C), high humidity, dusty environments, and Ghana&apos;s power supply
                  characteristics.
                </p>
                <p className="text-white/70 text-base leading-relaxed">
                  Our team has 15+ years of experience selecting and commissioning industrial
                  equipment in West Africa — knowledge that no online configurator can replicate.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { title: "Climate-Rated", detail: "Products specified for Ghana's temperature and humidity extremes." },
                  { title: "Local Support", detail: "On-site engineers available across Greater Accra and beyond." },
                  { title: "Spare Parts Stock", detail: "Critical spares held locally to minimise repair lead times." },
                  { title: "Regulatory Aware", detail: "Familiar with Ghana Standards Authority and sector-specific requirements." },
                ].map((item) => (
                  <div key={item.title} className="bg-white/5 rounded-2xl border border-white/10 p-6">
                    <div className="w-6 h-[3px] rounded-full bg-[#84CC16] mb-4" />
                    <h4 className="font-bold text-white text-base mb-2" style={{ fontFamily: "var(--font-sora, 'Sora', sans-serif)" }}>
                      {item.title}
                    </h4>
                    <p className="text-white/50 text-xs leading-relaxed">{item.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 bg-[#F8FAFC] dark:bg-[#0D1526]">
          <div className="container-apt text-center">
            <h2
              className="text-3xl font-extrabold text-[#0F172A] dark:text-[#F1F5F9] mb-4"
              style={{ fontFamily: "var(--font-sora, 'Sora', sans-serif)" }}
            >
              Working in One of These Sectors?
            </h2>
            <p className="text-[#64748B] dark:text-[#94A3B8] text-base mb-8 max-w-lg mx-auto">
              Tell us about your project and let APT Ghana&apos;s specialists recommend the right solution.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 h-12 px-7 bg-[#84CC16] text-[#0A0F1E] font-bold text-sm rounded-xl hover:bg-[#78B800] transition-colors"
            >
              Discuss Your Project →
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
