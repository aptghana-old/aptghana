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

// ─── Static fallback data ──────────────────────────────────────────────────────

const staticResources: Record<string, ResourcePage> = {
  library: {
    title: "Technical Library", tagline: "Datasheets, Manuals & Engineering Drawings",
    intro: "Access technical documentation for APT Ghana's full product catalogue. Download datasheets, installation manuals, wiring diagrams, and engineering drawings from our partner manufacturers.",
    type: "library",
    items: [
      { title: "Schneider Electric Acti 9 Series", desc: "Complete datasheet and installation guide for the Acti 9 circuit breaker range — iC60, iC60N, iC60H.", meta: "PDF · 4.2 MB" },
      { title: "WEG W22 Motor Technical Catalogue", desc: "Full performance curves, mounting dimensions, efficiency data, and selection guide for W22 IE2/IE3 motors.", meta: "PDF · 8.7 MB" },
      { title: "Camozzi Series 9 Pneumatic Valves", desc: "Technical specifications, flow rates, port configurations, and solenoid options for the Series 9 valve range.", meta: "PDF · 2.1 MB" },
      { title: "Schneider ATV630 Drive Manual", desc: "Programming, commissioning, and troubleshooting guide for the ATV630 variable frequency drive.", meta: "PDF · 12.4 MB" },
      { title: "WEG CFW500 Inverter Guide", desc: "Quick-start guide and full parameter manual for the CFW500 compact frequency inverter.", meta: "PDF · 5.8 MB" },
      { title: "Provulco EP Conveyor Belting Spec", desc: "Technical properties, load ratings, and selection tables for EP multi-ply conveyor belting.", meta: "PDF · 1.9 MB" },
    ],
    cta: { label: "Request Specific Documentation", href: "/contact" },
  },
  "case-studies": {
    title: "Case Studies", tagline: "Real Projects. Measurable Results.",
    intro: "APT Ghana has delivered hundreds of projects across Ghana's industrial sectors. These case studies highlight how we helped our clients solve real operational challenges with the right technology.",
    type: "case-studies",
    items: [
      { title: "Gold Mine Conveyor Drive Upgrade — Ashanti Region", desc: "Replaced ageing DOL motor starters with WEG VFDs on a primary ore conveyor, reducing energy consumption by 22%.", meta: "Mining · 2023" },
      { title: "Water Treatment Plant Automation — Greater Accra", desc: "Supplied and commissioned Schneider Electric PLCs, drives, and SCADA integration for a 50,000 m³/day facility.", meta: "Water & Wastewater · 2022" },
      { title: "FMCG Production Line Modernisation — Tema", desc: "Upgraded a 20-year-old pneumatic control system, increasing OEE from 67% to 84%.", meta: "Manufacturing · 2023" },
      { title: "Tema Port Crane Drive Replacement", desc: "Supplied heavy-duty WEG variable speed drives for container handling cranes at Tema Port.", meta: "Ports & Logistics · 2021" },
      { title: "Brewery Compressed Air Audit & Upgrade", desc: "Performed full compressed air audit, reducing losses by 35% and cutting energy costs.", meta: "Food & Beverage · 2022" },
      { title: "Construction Site Temporary Power — Accra CBD", desc: "Supplied and installed Schneider Electric temporary distribution boards for a 40-storey development.", meta: "Construction · 2023" },
    ],
    cta: { label: "Discuss Your Project", href: "/contact" },
  },
  news: {
    title: "News & Insights", tagline: "Industrial Technology News from West Africa",
    intro: "Stay current with the latest developments in industrial automation, electrical distribution, and manufacturing technology — with a focus on Ghana and West Africa.",
    type: "news",
    items: [
      { title: "Schneider Electric Awards APT Ghana Marketing Excellence 2024", desc: "APT Ghana recognised by Schneider Electric with the Marketing Excellence Award for Africa.", meta: "April 2024" },
      { title: "New WEG W22 IE3 Stock Arrival — Accra Warehouse", desc: "Major consignment of WEG W22 IE3 motors now available from stock for immediate delivery.", meta: "March 2024" },
      { title: "Ghana Mining Week 2024 — APT Ghana Exhibiting", desc: "APT Ghana exhibiting at Ghana Mining Week, showcasing ATEX-rated motor and drive solutions.", meta: "February 2024" },
      { title: "Camozzi Launches New Series 9 Valve Range", desc: "Updated Series 9 directional control valve with improved flow rates and expanded solenoid options.", meta: "January 2024" },
      { title: "Energy Efficiency Drive: APT Ghana IE3 Motor Campaign", desc: "Campaign to help Ghanaian manufacturers upgrade from IE1 to IE3 motors with payback under 24 months.", meta: "December 2023" },
      { title: "APT Ghana Partner of the Year — Schneider Electric Ghana 2021", desc: "Awarded Schneider Electric Partner of the Year for outstanding performance in West Africa.", meta: "January 2022" },
    ],
    cta: { label: "Get in Touch", href: "/contact" },
  },
  training: {
    title: "Product Training", tagline: "Manufacturer-Certified Technical Training in Ghana",
    intro: "APT Ghana offers product training programmes for engineers, maintenance technicians, and operators. Our training is delivered by certified specialists and covers commissioning, operation, and maintenance.",
    type: "training",
    items: [
      { title: "Schneider Electric Drive Commissioning", desc: "Hands-on training covering ATV212, ATV320, and ATV630 drive selection, parameter setting, and fault diagnosis.", meta: "1 Day · Accra" },
      { title: "WEG Motor Maintenance & Selection", desc: "Technical training on IE2/IE3 motor selection, installation, maintenance, and insulation testing.", meta: "Half Day · Accra" },
      { title: "Schneider PLC Programming Basics", desc: "Introduction to Modicon M221/M241 PLC programming using SoMachine Basic software.", meta: "2 Days · Accra" },
      { title: "Camozzi Pneumatic Systems Design", desc: "Pneumatic circuit design, component selection, valve sizing, and air preparation specification.", meta: "1 Day · Accra" },
      { title: "Power Quality & Harmonics Workshop", desc: "Understanding power quality issues — harmonics, power factor, voltage sags — and how to select filtering equipment.", meta: "Half Day · Accra" },
      { title: "ATEX Equipment Training", desc: "ATEX/IECEx certification, zone classification, equipment selection, and installation requirements.", meta: "1 Day · Accra" },
    ],
    cta: { label: "Register for Training", href: "/contact" },
  },
  cad: {
    title: "CAD Downloads", tagline: "Engineering Drawings & 3D Models",
    intro: "Download CAD drawings, 3D models, and dimension sheets for APT Ghana's key product lines. All files are provided in standard formats (DWG, STEP, PDF) for use in your engineering designs.",
    type: "cad",
    items: [
      { title: "Schneider Electric iC60 MCB — DWG & STEP", desc: "2D outline drawing and 3D STEP model for the iC60 miniature circuit breaker range, all pole configurations.", meta: "DWG + STEP · Updated Q1 2024" },
      { title: "WEG W22 Motor Frame Dimensions", desc: "Certified dimension sheets for all W22 IE3 frame sizes from 71 to 355.", meta: "PDF + DWG · All Frame Sizes" },
      { title: "Schneider ATV630 Drive Outline Drawing", desc: "Dimensional drawings for ATV630 drives from 0.75kW to 200kW with panel cutout templates.", meta: "DWG · All Ratings" },
      { title: "Camozzi Manifold Assemblies — STEP Models", desc: "3D STEP models for Series 9 valve manifold assemblies — 2 to 8 station configurations.", meta: "STEP · Series 9" },
      { title: "Schneider Prisma Distribution Board", desc: "3D assembly model and wiring space dimensions for Prisma G/Plus distribution panel ranges.", meta: "STEP + DWG · Prisma Range" },
      { title: "WEG CFW500 Inverter — Panel Integration Drawing", desc: "Outline dimensions, panel cutout template, and recommended clearances for CFW500 compact drive installation.", meta: "PDF + DWG" },
    ],
    cta: { label: "Request Additional Drawings", href: "/contact" },
  },
  certifications: {
    title: "Certifications", tagline: "Our Credentials & Authorizations",
    intro: "APT Ghana holds authorizations and certifications from our OEM partners. These credentials ensure that our customers receive genuine products, valid warranties, and certified technical support.",
    type: "certifications",
    items: [
      { title: "Schneider Electric — Official Electrical Distributor", desc: "APT Ghana is the official certified Electrical Distributor of Schneider Electric in Ghana.", meta: "Current · Ghana" },
      { title: "Schneider Electric Partner of the Year — Ghana 2021", desc: "Awarded by Schneider Electric for outstanding partner performance and channel development.", meta: "2021 · Award" },
      { title: "Schneider Electric Marketing Excellence — Africa 2024", desc: "Recognized for exceptional marketing and customer engagement performance across Africa.", meta: "2024 · Award" },
      { title: "WEG — Certified Partner", desc: "APT Ghana is a certified WEG distributor with full OEM warranty across West Africa.", meta: "Current · West Africa" },
      { title: "Camozzi Automation — Authorized Distributor", desc: "APT Ghana is the authorized Camozzi Automation distributor for Ghana.", meta: "Current · Ghana" },
      { title: "Ghana Standards Authority — Compliant Supplier", desc: "All products comply with applicable Ghana Standards Authority requirements.", meta: "Ongoing Compliance" },
    ],
    cta: { label: "Request Verification", href: "/contact" },
  },
};

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
    return Object.keys(staticResources);
  }
}

export async function generateStaticParams() {
  const dbSlugs = await getAllSlugs();
  const allSlugs = new Set([...Object.keys(staticResources), ...dbSlugs]);
  return Array.from(allSlugs).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const dbPage = await getResource(slug);
  const page = dbPage ?? staticResources[slug];
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
  const dbPage = await getResource(slug);
  const page = dbPage ?? staticResources[slug];

  if (!page) notFound();

  return (
    <>
      <Header />
      <main>
        {/* Hero */}
        <section className="bg-[#F8FAFC] dark:bg-[#0A0F1E] pt-32 pb-20">
          <div className="container-apt">
            <div className="flex items-center gap-2 text-xs text-[#0F172A]/40 dark:text-white/40 mb-6">
              <Link href="/resources" className="hover:text-[#0F172A]/60 dark:hover:text-white/70 transition-colors">Resources</Link>
              <span>/</span>
              <span className="text-[#475569] dark:text-white/60">{page.title}</span>
            </div>
            <div className="max-w-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-6 h-[2px] rounded-full bg-[#84CC16]" />
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
                  className="flex flex-col p-7 bg-[#F8FAFC] dark:bg-[#111827] rounded-2xl border border-[#E2E8F0] dark:border-white/10 hover:border-[#84CC16]/30 hover:shadow-lg transition-all"
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
            <div className="flex gap-3 flex-shrink-0">
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
