import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Header from "@/components/navigation/Header";
import Footer from "@/components/navigation/Footer";
import { SITE_URL, STORE_URL } from "@apt/config";
import { connectDB, IndustryModel } from "@apt/db";

export const revalidate = 3600;

interface IndustryData {
  name: string;
  tagline: string;
  shortDescription: string;
  challenge: string;
  solutions: string[];
  brands: string[];
  clients: string;
  icon: string;
  accentColor: string;
  stats: { label: string; value: string }[];
}

// ─── Static fallback data ──────────────────────────────────────────────────────

const staticIndustryData: Record<string, IndustryData> = {
  mining: {
    name: "Mining & Minerals",
    tagline: "Powering Ghana's Mining Industry",
    shortDescription: "ATEX-rated equipment and conveyor systems for gold, bauxite, and manganese operations.",
    challenge: "Mining operations demand ruggedized equipment that performs in harsh environments — extreme heat, dust, vibration, and potentially explosive atmospheres. Standard industrial equipment often fails within months; only purpose-rated components survive the demands of a working mine.",
    solutions: [ "ATEX/IECEx explosion-proof motors", "Heavy-duty variable frequency drives", "Mining conveyor systems & belts", "Protection relays & switchgear", "Mine shaft hoisting controls", "Dewatering pump drives" ],
    brands: [ "WEG", "Schneider Electric", "Provulco", "ABB" ],
    clients: "Active in Ghana's gold, bauxite, and manganese sectors",
    icon: "⛏", accentColor: "#F59E0B", stats: [],
  },
  "oil-gas": {
    name: "Oil & Gas",
    tagline: "Instrumentation for Upstream & Downstream",
    shortDescription: "Intrinsically safe instruments and ATEX/IECEx certified equipment for oil & gas operations.",
    challenge: "Offshore and onshore oil & gas facilities require intrinsically safe and explosion-proof certified equipment meeting ATEX and IECEx standards. Non-compliant equipment in hazardous areas creates serious risk of ignition and places operations outside regulatory requirements.",
    solutions: [ "Intrinsically safe instruments", "Ex-rated motors & drives", "Process control valves", "Pipeline monitoring systems", "Emergency shutdown systems", "SCADA integration" ],
    brands: [ "Schneider Electric", "ABB", "ifm electronic", "Endress+Hauser" ],
    clients: "Supporting West Africa's upstream and downstream operations",
    icon: "🛢", accentColor: "#6366F1", stats: [],
  },
  manufacturing: {
    name: "Manufacturing",
    tagline: "Automation for Modern Production",
    shortDescription: "PLC automation, VFDs, and energy management for production plants.",
    challenge: "Manufacturers in Ghana face pressure to increase throughput, reduce waste, and maintain quality while controlling energy costs. Many production lines operate on manual processes or ageing electromechanical controls that limit productivity.",
    solutions: [ "PLC-based production line control", "Variable speed conveyor drives", "Pneumatic pick-and-place systems", "Quality inspection sensors", "Energy management systems", "Compressed air optimization" ],
    brands: [ "Schneider Electric", "Camozzi", "Omron", "Festo", "Sick AG" ],
    clients: "Serving FMCG, textile, plastics and food processing plants",
    icon: "🏭", accentColor: "#0EA5E9", stats: [],
  },
  energy: {
    name: "Power & Energy",
    tagline: "Grid Protection & Power Quality",
    shortDescription: "MV/LV switchgear, protection relays, and power quality solutions for utilities and IPPs.",
    challenge: "Ghana's energy sector requires reliable switchgear, monitoring systems, and protection equipment for generation, transmission, and distribution assets. Grid instability and ageing infrastructure create significant operational and safety challenges.",
    solutions: [ "MV/LV switchgear & panelboards", "Protection relays & IEDs", "Power quality analysers", "Capacitor banks for PF correction", "Energy monitoring systems", "UPS for critical loads" ],
    brands: [ "Schneider Electric", "ABB", "Socomec", "Eaton" ],
    clients: "Supporting power utilities, IPPs, and large industrials",
    icon: "⚡", accentColor: "#84CC16", stats: [],
  },
  water: {
    name: "Water & Wastewater",
    tagline: "SCADA-Ready Water Solutions",
    shortDescription: "Variable speed pump drives, dosing controls, and SCADA for water treatment facilities.",
    challenge: "Water utilities need reliable variable speed drives, chemical dosing systems, and remote monitoring to manage treatment plants efficiently. Manual operation leads to inconsistent water quality and high energy consumption.",
    solutions: [ "Pump variable frequency drives", "Chemical dosing pump controls", "SCADA & telemetry systems", "Level & flow instrumentation", "Water quality sensors", "Remote monitoring panels" ],
    brands: [ "Schneider Electric", "Omron", "ifm electronic", "Endress+Hauser", "WAGO" ],
    clients: "Supporting municipal and industrial water treatment facilities",
    icon: "💧", accentColor: "#06B6D4", stats: [],
  },
  ports: {
    name: "Ports & Logistics",
    tagline: "Heavy-Duty Port Electrification",
    shortDescription: "Container crane drives, conveyor controls, and port electrical infrastructure.",
    challenge: "Port operations require heavy-duty crane drives, reliable conveyor systems, and robust electrical infrastructure for 24/7 operations. Equipment failures cause vessel delays, demurrage costs, and supply chain disruption.",
    solutions: [ "Container crane hoist & travel drives", "Ship-to-shore crane electrics", "Conveyor & stacker drives", "Vessel power supply systems", "Port lighting systems", "Maintenance & predictive monitoring" ],
    brands: [ "WEG", "ABB", "Schneider Electric", "NORD Drivesystems" ],
    clients: "Active at Tema Port and Takoradi Port",
    icon: "🚢", accentColor: "#8B5CF6", stats: [],
  },
  "food-beverage": {
    name: "Food & Beverage",
    tagline: "Hygienic Automation Solutions",
    shortDescription: "IP69K-rated components, washdown sensors, and CIP automation for food processing.",
    challenge: "Food processing demands IP69K-rated hygienic components, clean-in-place compatibility, and compliance with food safety standards. Standard industrial equipment harbours bacteria and fails under high-pressure washdown conditions.",
    solutions: [ "IP69K-rated drives & motors", "Stainless steel pneumatic cylinders", "Hygienic valve manifolds", "Clean-in-place automation", "Temperature & flow monitoring", "Washdown-rated sensors" ],
    brands: [ "Festo", "Camozzi", "WEG", "ifm electronic", "Sick AG" ],
    clients: "Serving Ghana's FMCG and food processing sector",
    icon: "🍶", accentColor: "#EC4899", stats: [],
  },
  construction: {
    name: "Construction & Infrastructure",
    tagline: "Power for Large-Scale Projects",
    shortDescription: "Temporary power distribution, tower crane electrification, and site safety.",
    challenge: "Construction projects need flexible temporary power distribution, robust site safety systems, and reliable electrical infrastructure. Inadequate site power leads to project delays and safety incidents.",
    solutions: [ "Temporary power distribution boards", "Site power generation & distribution", "Tower crane electrification", "Portable switchgear & transformers", "Site lighting systems", "Earthing & surge protection" ],
    brands: [ "Schneider Electric", "Legrand", "Eaton", "Rittal" ],
    clients: "Supporting major infrastructure and real estate projects in Ghana",
    icon: "🏗", accentColor: "#F97316", stats: [],
  },
};

// ─── DB fetch ─────────────────────────────────────────────────────────────────

async function getIndustry(slug: string): Promise<IndustryData | null> {
  try {
    await connectDB();
    type RawIndustry = { name: string; tagline?: string; shortDescription?: string; challenge?: string; solutions?: string[]; brands?: string[]; clients?: string; icon?: string; accentColor?: string; stats?: { label: string; value: string }[] };
    const doc = await IndustryModel.findOne({ slug, status: "active" }).lean() as unknown as RawIndustry | null;
    if (!doc) return null;
    return {
      name: doc.name,
      tagline: doc.tagline || "",
      shortDescription: doc.shortDescription || "",
      challenge: doc.challenge || "",
      solutions: doc.solutions || [],
      brands: doc.brands || [],
      clients: doc.clients || "",
      icon: doc.icon || "🏭",
      accentColor: doc.accentColor || "#84CC16",
      stats: doc.stats || [],
    };
  } catch {
    return null;
  }
}

async function getAllSlugs(): Promise<string[]> {
  try {
    await connectDB();
    const docs = await IndustryModel.find({ status: "active" }).select("slug").lean() as unknown as { slug: string }[];
    return docs.map((d) => d.slug);
  } catch {
    return Object.keys(staticIndustryData);
  }
}

export async function generateStaticParams() {
  const dbSlugs = await getAllSlugs();
  const allSlugs = new Set([ ...Object.keys(staticIndustryData), ...dbSlugs ]);
  return Array.from(allSlugs).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const dbIndustry = await getIndustry(slug);
  const industry = dbIndustry ?? staticIndustryData[ slug ];
  if (!industry) return { title: "Industry Not Found | APT Ghana" };
  return {
    title: `${industry.name} Solutions | APT Ghana`,
    description: `${industry.tagline} — APT Ghana supplies specialised industrial technology for ${industry.name.toLowerCase()} operations across West Africa.`,
    openGraph: {
      title: `${industry.name} Solutions | APT Ghana`,
      description: industry.tagline,
      url: `${SITE_URL}/industries/${slug}`,
    },
    alternates: { canonical: `${SITE_URL}/industries/${slug}` },
  };
}

export default async function IndustryDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const dbIndustry = await getIndustry(slug);
  const industry = dbIndustry ?? staticIndustryData[ slug ];

  if (!industry) notFound();

  const allSlugs = await getAllSlugs();
  const otherSlugs = allSlugs.filter((s) => s !== slug);
  const allStaticEntries = Object.entries(staticIndustryData).filter(([ s ]) => s !== slug);

  return (
    <>
      <Header />
      <main>
        {/* Hero */}
        <section className="bg-[#F8FAFC] dark:bg-[#0A0F1E] pt-32 pb-20">
          <div className="container-apt">
            <div className="flex items-center gap-2 text-xs text-[#0F172A]/40 dark:text-white/40 mb-6">
              <Link href="/industries" className="hover:text-[#0F172A]/60 dark:hover:text-white/70 transition-colors">
                Industries
              </Link>
              <span>/</span>
              <span className="text-[#475569] dark:text-white/60">{industry.name}</span>
            </div>
            <div className="max-w-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-6 h-[2px] rounded-full bg-[#84CC16]" />
                <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#84CC16]">
                  {industry.tagline}
                </span>
              </div>
              <h1
                className="text-4xl lg:text-5xl font-extrabold tracking-tight text-[#0F172A] dark:text-white mb-4"
                style={{ fontFamily: "var(--font-sora, 'Sora', sans-serif)" }}
              >
                {industry.name}
              </h1>
              {industry.clients && (
                <p className="text-[#475569] dark:text-[#94A3B8] text-sm italic border-l-2 border-[#84CC16] pl-4 leading-relaxed">
                  {industry.clients}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Stats (if DB has them) */}
        {industry.stats && industry.stats.length > 0 && (
          <section className="bg-[#1E3A5F] py-10">
            <div className="container-apt">
              <div className={`grid gap-6 ${industry.stats.length <= 2 ? "grid-cols-2" : industry.stats.length === 3 ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-2 md:grid-cols-4"}`}>
                {industry.stats.map((stat) => (
                  <div key={stat.label} className="text-center">
                    <div className="text-3xl font-extrabold text-[#84CC16] mb-1" style={{ fontFamily: "var(--font-sora, 'Sora', sans-serif)" }}>
                      {stat.value}
                    </div>
                    <div className="text-sm text-white/60 uppercase tracking-wider">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Challenge */}
        {industry.challenge && (
          <section className="py-14 bg-[#F8FAFC] dark:bg-[#0D1526]">
            <div className="container-apt max-w-3xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-6 h-[2px] rounded-full bg-[#84CC16]" />
                <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#84CC16]">
                  The Challenge
                </span>
              </div>
              <p className="text-[#0F172A] dark:text-[#94A3B8] text-lg leading-relaxed">{industry.challenge}</p>
            </div>
          </section>
        )}

        {/* Solutions + Brands */}
        <section className="section-py bg-white dark:bg-[#0A0F1E]">
          <div className="container-apt">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              {/* Solutions grid */}
              <div className="lg:col-span-2">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-6 h-[2px] rounded-full bg-[#84CC16]" />
                  <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#84CC16]">What We Provide</span>
                </div>
                <h2
                  className="text-3xl font-extrabold tracking-tight text-[#0F172A] dark:text-[#F1F5F9] mb-8"
                  style={{ fontFamily: "var(--font-sora, 'Sora', sans-serif)" }}
                >
                  Solutions for {industry.name}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {industry.solutions.map((sol) => (
                    <div key={sol} className="flex items-start gap-3 p-5 bg-[#F8FAFC] dark:bg-[#111827] rounded-xl border border-[#E2E8F0] dark:border-white/10">
                      <span className="flex-shrink-0 mt-1 w-5 h-5 rounded-full bg-[#84CC16]/15 flex items-center justify-center">
                        <svg className="w-3 h-3 text-[#84CC16]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      </span>
                      <span className="text-sm font-medium text-[#0F172A] dark:text-[#F1F5F9] leading-snug">{sol}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sidebar */}
              <div className="flex flex-col gap-6">
                {industry.brands.length > 0 && (
                  <div className="bg-[#0A0F1E] rounded-2xl p-7 text-white">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-5 h-[2px] rounded-full bg-[#84CC16]" />
                      <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#84CC16]">Key Brands</span>
                    </div>
                    <div className="space-y-3">
                      {industry.brands.map((brand) => (
                        <div key={brand} className="flex items-center gap-3">
                          <span className="w-2 h-2 rounded-full bg-[#84CC16]" />
                          <span className="text-sm font-medium text-white">{brand}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-6 pt-5 border-t border-white/10">
                      <Link href="/brands" className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#84CC16] hover:underline">
                        View all 26+ brands →
                      </Link>
                    </div>
                  </div>
                )}

                <div className="bg-[#84CC16] rounded-2xl p-7">
                  <h3
                    className="font-extrabold text-[#0A0F1E] text-lg mb-3"
                    style={{ fontFamily: "var(--font-sora, 'Sora', sans-serif)" }}
                  >
                    Request a Quote
                  </h3>
                  <p className="text-[#0A0F1E]/70 text-sm mb-5 leading-relaxed">
                    Tell us about your {industry.name.toLowerCase()} project and we&apos;ll
                    provide a detailed technical proposal.
                  </p>
                  <Link
                    href="/contact"
                    className="inline-flex items-center gap-2 h-10 px-5 bg-[#0A0F1E] text-white font-bold text-sm rounded-xl hover:bg-[#1E3A5F] transition-colors"
                  >
                    Contact Us →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Banner */}
        <section className="py-16 bg-[#0A0F1E]">
          <div className="container-apt">
            <div className="bg-white/5 rounded-2xl border border-white/10 p-10 lg:p-14 flex flex-col lg:flex-row items-center justify-between gap-8">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-6 h-[2px] rounded-full bg-[#84CC16]" />
                  <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#84CC16]">Get Started</span>
                </div>
                <h2 className="text-3xl font-extrabold tracking-tight text-white mb-3" style={{ fontFamily: "var(--font-sora, 'Sora', sans-serif)" }}>
                  Ready to Work with APT Ghana?
                </h2>
                <p className="text-white/60 text-sm max-w-lg">
                  Our {industry.name} specialists are available to discuss your requirements and deliver the right solution.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
                <Link href={STORE_URL + "/rfq"} className="inline-flex items-center gap-2 h-12 px-7 bg-[#84CC16] text-[#0A0F1E] font-bold text-sm rounded-xl hover:bg-[#78B800] transition-colors whitespace-nowrap">
                  Request a Quote →
                </Link>
                <Link href="/solutions" className="inline-flex items-center gap-2 h-12 px-7 border border-white/20 text-white font-bold text-sm rounded-xl hover:bg-white/10 transition-colors whitespace-nowrap">
                  View All Solutions
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Other industries */}
        <section className="py-14 bg-[#F8FAFC] dark:bg-[#0D1526]">
          <div className="container-apt">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold text-[#0F172A] dark:text-[#F1F5F9]" style={{ fontFamily: "var(--font-sora, 'Sora', sans-serif)" }}>
                Other Industries
              </h3>
              <Link href="/industries" className="text-sm font-semibold text-[#84CC16] hover:underline">View all →</Link>
            </div>
            <div className="flex flex-wrap gap-3">
              {(otherSlugs.length > 0 ? otherSlugs : allStaticEntries.map(([ s ]) => s)).map((s) => {
                const label = staticIndustryData[ s ]?.name ?? s;
                return (
                  <Link
                    key={s}
                    href={`/industries/${s}`}
                    className="inline-flex items-center gap-2 h-10 px-5 bg-white dark:bg-[#111827] border border-[#E2E8F0] dark:border-white/10 rounded-xl text-sm font-medium text-[#0F172A] dark:text-[#94A3B8] hover:border-[#84CC16]/50 hover:bg-[#84CC16]/5 transition-colors"
                  >
                    {label}
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
