import type { Metadata } from "next";
import Link from "next/link";
import {
  Shield, RefreshCw, Globe2, Wrench, Settings2, BarChart3,
  GraduationCap, Clock, Bell, Zap, Package, CheckCircle2,
  Cpu, Activity, AlertCircle, Users, FileText, type LucideIcon,
} from "lucide-react";
import Header from "@/components/navigation/Header";
import Footer from "@/components/navigation/Footer";
import { connectDB, ServiceModel } from "@apt/db";
import { SITE_URL } from "@apt/config";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Engineering Services | APT Ghana",
  description:
    "APT Ghana delivers professional engineering services including pre-sales consulting, technical training, after-sales support, and customised assembly solutions for industrial clients across West Africa.",
  openGraph: {
    title: "Engineering Services | APT Ghana",
    description:
      "Pre-sales consulting, technical training, after-sales support, and customised assembly services for industrial clients.",
    url: `${SITE_URL}/services`,
  },
  alternates: { canonical: `${SITE_URL}/services` },
};

// ─── Icon registry ─────────────────────────────────────────────────────────────

const ICONS: Record<string, LucideIcon> = {
  Shield, RefreshCw, Globe2, Wrench, Settings2, BarChart3,
  GraduationCap, Clock, Bell, Zap, Package, CheckCircle2,
  Cpu, Activity, AlertCircle, Users, FileText,
};

function ServiceIcon({ name, className = "w-6 h-6" }: { name: string; className?: string }) {
  const Icon = ICONS[name];
  if (!Icon) return null;
  return <Icon className={className} strokeWidth={1.5} />;
}

// ─── Types ─────────────────────────────────────────────────────────────────────

interface ServiceItem {
  _id: string;
  title: string;
  description: string;
  section: string;
  iconName: string;
  displayOrder: number;
}

// ─── Static fallbacks (used if DB is unreachable) ──────────────────────────────

const fallbackPillars = [
  { title: "Reliable & Scalable Solutions", description: "We design systems that grow with your operation. From a single motor drive replacement to a full process automation overhaul, our engineers ensure scalability is built in from day one.", iconName: "Shield" },
  { title: "Upgrading Obsolete Systems", description: "Many facilities across West Africa operate on ageing equipment. APT Ghana specialises in modernising legacy systems — replacing end-of-life PLCs, drives, and switchgear with current-generation equivalents while minimising downtime.", iconName: "RefreshCw" },
  { title: "Strategic OEM Partnerships", description: "As an authorised distributor for Schneider Electric, WEG, Camozzi, and 23+ other global OEMs, we provide clients with direct access to manufacturer technical resources, warranty support, and genuine spare parts.", iconName: "Globe2" },
];

const fallbackTechnical = [
  { title: "Commissioning & Start-Up", description: "APT Ghana engineers attend site to commission new equipment, configure parameters, and verify correct operation against specification.", iconName: "Wrench" },
  { title: "Repair & Overhaul", description: "Authorised repair services for drives, motors, and control systems. We use genuine OEM parts and return equipment to factory specification.", iconName: "Settings2" },
  { title: "Lifecycle Management", description: "End-of-life planning for critical equipment. We map your installed base, identify obsolescence risks, and develop phased replacement plans that avoid emergency shutdowns.", iconName: "BarChart3" },
  { title: "Operator Training", description: "On-site and facility-based training for your operations team. We cover equipment operation, safe working procedures, and first-line fault-finding.", iconName: "GraduationCap" },
  { title: "Preventive Maintenance", description: "Scheduled maintenance contracts to keep critical equipment in peak condition. Our engineers visit your site on agreed intervals, reducing unplanned downtime.", iconName: "Clock" },
  { title: "Emergency Breakdown Support", description: "When production stops, every hour counts. APT Ghana provides priority breakdown support with fast response times and on-site engineer dispatch across Greater Accra.", iconName: "Bell" },
];

const fallbackWhatWeOffer = [
  { title: "Tailor-Made Industrial Solutions", description: "No two projects are the same. Our applications engineers work alongside your team to engineer solutions precisely matched to your operational requirements, site conditions, and budget." },
  { title: "Maintenance, Troubleshooting & After-Sales", description: "Our relationship with clients extends beyond the point of sale. APT Ghana provides scheduled maintenance visits, emergency breakdown support, and long-term service agreements." },
  { title: "Original Spare Parts Supply", description: "Genuine, certified spare parts from all our brand partners. Fast lead times from our Accra warehouse, and global order capability for specialist items not held in stock." },
];

const fallbackPreSales = [
  "Site surveys and load calculations",
  "Technology selection and comparative analysis",
  "Bill of materials preparation",
  "Energy efficiency assessments",
  "Regulatory and standards compliance guidance",
];

const fallbackAssembly = [
  { title: "Quality Control",    description: "IEC-compliant assembly and testing at our Accra facility before delivery." },
  { title: "Short Lead Times",   description: "Local assembly reduces lead times vs importing pre-built panels from Europe." },
  { title: "Made for Ghana",     description: "Panels are designed and rated for Ghana's specific voltage and climate conditions." },
  { title: "Full Documentation", description: "Every assembly ships with complete wiring diagrams, component lists, and test records." },
];

// ─── DB fetch ──────────────────────────────────────────────────────────────────

async function getServices() {
  try {
    await connectDB();
    const docs = await ServiceModel.find({ status: "active" })
      .select("_id title description section iconName displayOrder")
      .sort({ section: 1, displayOrder: 1 })
      .lean();

    type RawService = { _id: unknown; title: string; description?: string; section: string; iconName?: string; displayOrder?: number };
    const items = (docs as unknown as RawService[]).map((d) => ({
      _id:          String(d._id),
      title:        d.title,
      description:  d.description ?? "",
      section:      d.section,
      iconName:     d.iconName ?? "",
      displayOrder: d.displayOrder ?? 0,
    }));

    const bySection = (section: string) => items.filter((i) => i.section === section);

    return {
      pillars:    bySection("pillars"),
      technical:  bySection("technical"),
      whatWeOffer:bySection("what-we-offer"),
      preSales:   bySection("pre-sales"),
      assembly:   bySection("assembly"),
    };
  } catch {
    return null;
  }
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default async function ServicesPage() {
  const db = await getServices();

  const pillars     = db?.pillars.length     ? db.pillars     : fallbackPillars;
  const technical   = db?.technical.length   ? db.technical   : fallbackTechnical;
  const whatWeOffer = db?.whatWeOffer.length  ? db.whatWeOffer : fallbackWhatWeOffer;
  const preSalesBullets = db?.preSales.length ? db.preSales.map((i) => i.title) : fallbackPreSales;
  const assembly    = db?.assembly.length     ? db.assembly    : fallbackAssembly;

  return (
    <>
      <Header />
      <main>
        {/* ── Hero ── */}
        <section className="bg-[#F8FAFC] dark:bg-[#0A0F1E] pt-32 pb-20">
          <div className="container-apt">
            <div className="max-w-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-6 h-[2px] rounded-full bg-[#84CC16]" />
                <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#84CC16]">
                  Engineering Services
                </span>
              </div>
              <h1
                className="text-4xl lg:text-5xl font-extrabold tracking-tight text-[#0F172A] dark:text-white mb-6"
                style={{ fontFamily: "var(--font-sora, 'Sora', sans-serif)" }}
              >
                Engineering Services for West Africa&apos;s Industry
              </h1>
              <p className="text-[#64748B] dark:text-[#94A3B8] text-lg leading-relaxed max-w-xl">
                APT Ghana is more than a distributor. Our technical teams provide end-to-end
                engineering support — from the first site survey to commissioning and long-term
                after-sales care.
              </p>
            </div>
          </div>
        </section>

        {/* ── Pre-Sales Consulting ── */}
        <section className="section-py bg-[#F8FAFC] dark:bg-[#0D1526]">
          <div className="container-apt">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-6 h-[2px] rounded-full bg-[#84CC16]" />
                  <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#84CC16]">
                    Pre-Sales Consulting
                  </span>
                </div>
                <h2
                  className="text-4xl lg:text-5xl font-extrabold tracking-tight text-[#0F172A] dark:text-[#F1F5F9] mb-6"
                  style={{ fontFamily: "var(--font-sora, 'Sora', sans-serif)" }}
                >
                  Start Every Project Right
                </h2>
                <p className="text-[#64748B] dark:text-[#94A3B8] text-base leading-relaxed mb-5">
                  Before any equipment is purchased, APT Ghana&apos;s applications engineers work
                  with you to understand your process, your constraints, and your goals. We
                  translate your operational requirements into a technically sound bill of
                  materials — ensuring what you buy is exactly what you need.
                </p>
                <p className="text-[#64748B] dark:text-[#94A3B8] text-base leading-relaxed mb-5">
                  Our pre-sales consulting service is available at no additional cost for
                  qualified projects. We draw on our 15+ years of experience in the Ghanaian
                  and West African industrial landscape to provide context-relevant guidance
                  that imported catalogues simply cannot replicate.
                </p>
                <ul className="space-y-3">
                  {preSalesBullets.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-[#0F172A] dark:text-[#94A3B8]">
                      <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-[#84CC16]/15 flex items-center justify-center">
                        <svg className="w-3 h-3 text-[#84CC16]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-[#0A0F1E] rounded-2xl p-10 text-white">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-[#84CC16]/15 flex items-center justify-center">
                    <svg className="w-5 h-5 text-[#84CC16]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.355a14.998 14.998 0 01-4.5 0M12 3v1.5m0 0a9 9 0 110 13.5m0-13.5a9 9 0 000 13.5" />
                    </svg>
                  </div>
                  <span className="font-bold text-lg" style={{ fontFamily: "var(--font-sora, 'Sora', sans-serif)" }}>
                    Why pre-sales matters
                  </span>
                </div>
                <p className="text-white/70 text-sm leading-relaxed mb-6">
                  The cost of selecting the wrong equipment — in terms of rework, downtime,
                  and re-procurement — far exceeds the time invested in proper front-end
                  engineering. Our clients consistently report that thorough pre-sales
                  consultation reduces total project costs by 10–20%.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { value: "15+", label: "Years experience" },
                    { value: "500+", label: "Projects completed" },
                    { value: "26+", label: "OEM partnerships" },
                    { value: "6,000+", label: "Products available" },
                  ].map((stat) => (
                    <div key={stat.label} className="bg-white/5 rounded-xl p-4">
                      <div className="text-2xl font-extrabold text-[#84CC16]" style={{ fontFamily: "var(--font-sora, 'Sora', sans-serif)" }}>
                        {stat.value}
                      </div>
                      <div className="text-xs text-white/50 mt-1">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Technical Assistance & Training ── */}
        <section className="section-py bg-white dark:bg-[#0A0F1E]">
          <div className="container-apt">
            <div className="max-w-3xl mx-auto text-center mb-14">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="w-6 h-[2px] rounded-full bg-[#84CC16]" />
                <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#84CC16]">
                  Technical Assistance & Training
                </span>
                <div className="w-6 h-[2px] rounded-full bg-[#84CC16]" />
              </div>
              <h2
                className="text-4xl lg:text-5xl font-extrabold tracking-tight text-[#0F172A] dark:text-[#F1F5F9] mb-5"
                style={{ fontFamily: "var(--font-sora, 'Sora', sans-serif)" }}
              >
                Support That Extends Beyond the Sale
              </h2>
              <p className="text-[#64748B] dark:text-[#94A3B8] text-base leading-relaxed">
                Our after-sales team provides hands-on technical support across Ghana.
                From equipment commissioning to end-of-life lifecycle management, we keep
                your operations running.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {technical.map((item) => (
                <div key={item.title} className="bg-[#F8FAFC] dark:bg-[#111827] rounded-2xl border border-[#E2E8F0] dark:border-white/10 p-7 hover:border-[#84CC16]/40 transition-colors">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-[#84CC16]/10 text-[#84CC16] mb-5">
                    <ServiceIcon name={item.iconName} />
                  </div>
                  <h3 className="font-bold text-[#0F172A] dark:text-[#F1F5F9] text-lg mb-3" style={{ fontFamily: "var(--font-sora, 'Sora', sans-serif)" }}>
                    {item.title}
                  </h3>
                  <p className="text-[#64748B] dark:text-[#94A3B8] text-sm leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Customised Assembly ── */}
        <section className="section-py bg-[#F8FAFC] dark:bg-[#0D1526]">
          <div className="container-apt">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
              <div className="bg-[#0A0F1E] rounded-2xl p-10 text-white order-2 lg:order-1">
                <div className="space-y-6">
                  {assembly.map((item) => (
                    <div key={item.title} className="flex items-start gap-4">
                      <span className="flex-shrink-0 mt-1 w-5 h-5 rounded-full bg-[#84CC16]/20 flex items-center justify-center">
                        <svg className="w-3 h-3 text-[#84CC16]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      </span>
                      <div>
                        <p className="font-semibold text-white text-sm mb-0.5">{item.title}</p>
                        <p className="text-white/60 text-xs leading-relaxed">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="order-1 lg:order-2">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-6 h-[2px] rounded-full bg-[#84CC16]" />
                  <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#84CC16]">
                    Customised Assembly
                  </span>
                </div>
                <h2
                  className="text-4xl lg:text-5xl font-extrabold tracking-tight text-[#0F172A] dark:text-[#F1F5F9] mb-6"
                  style={{ fontFamily: "var(--font-sora, 'Sora', sans-serif)" }}
                >
                  Bespoke Panels Built for Your Process
                </h2>
                <p className="text-[#64748B] dark:text-[#94A3B8] text-base leading-relaxed mb-5">
                  APT Ghana assembles custom electrical control panels, motor control centres,
                  and distribution boards at our Accra facility. We source components from our
                  authorised brand portfolio and build to your exact specification.
                </p>
                <p className="text-[#64748B] dark:text-[#94A3B8] text-base leading-relaxed">
                  Each panel undergoes rigorous quality control testing prior to dispatch,
                  including insulation resistance testing, continuity checks, and functional
                  verification against the design schematic. We supply full as-built
                  documentation with every assembly.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Three Pillars ── */}
        <section className="section-py bg-white dark:bg-[#0A0F1E]">
          <div className="container-apt">
            <div className="max-w-2xl mx-auto text-center mb-12">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="w-6 h-[2px] rounded-full bg-[#84CC16]" />
                <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#84CC16]">
                  Our Approach
                </span>
                <div className="w-6 h-[2px] rounded-full bg-[#84CC16]" />
              </div>
              <h2
                className="text-4xl font-extrabold tracking-tight text-[#0F172A] dark:text-[#F1F5F9]"
                style={{ fontFamily: "var(--font-sora, 'Sora', sans-serif)" }}
              >
                Three Pillars of Service Excellence
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {pillars.map((card) => (
                <div key={card.title} className="bg-[#F8FAFC] dark:bg-[#111827] rounded-2xl border border-[#E2E8F0] dark:border-white/10 p-8">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-[#1E3A5F]/10 dark:bg-[#84CC16]/10 text-[#1E3A5F] dark:text-[#84CC16] mb-5">
                    <ServiceIcon name={card.iconName} />
                  </div>
                  <h3 className="font-bold text-[#0F172A] dark:text-[#F1F5F9] text-xl mb-3" style={{ fontFamily: "var(--font-sora, 'Sora', sans-serif)" }}>
                    {card.title}
                  </h3>
                  <p className="text-[#64748B] dark:text-[#94A3B8] text-sm leading-relaxed">{card.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── What We Offer ── */}
        <section className="section-py bg-[#0A0F1E]">
          <div className="container-apt">
            <div className="max-w-3xl mx-auto text-center mb-12">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="w-6 h-[2px] rounded-full bg-[#84CC16]" />
                <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#84CC16]">
                  What We Offer
                </span>
                <div className="w-6 h-[2px] rounded-full bg-[#84CC16]" />
              </div>
              <h2
                className="text-4xl lg:text-5xl font-extrabold tracking-tight text-white"
                style={{ fontFamily: "var(--font-sora, 'Sora', sans-serif)" }}
              >
                The Full Service Promise
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              {whatWeOffer.map((item) => (
                <div key={item.title} className="bg-white/5 rounded-2xl border border-white/10 p-8">
                  <div className="w-8 h-[3px] rounded-full bg-[#84CC16] mb-6" />
                  <h3
                    className="font-bold text-white text-xl mb-3"
                    style={{ fontFamily: "var(--font-sora, 'Sora', sans-serif)" }}
                  >
                    {item.title}
                  </h3>
                  <p className="text-white/60 text-sm leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>
            <div className="text-center">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 h-12 px-7 bg-[#84CC16] text-[#0A0F1E] font-bold text-sm rounded-xl hover:bg-[#78B800] transition-colors"
              >
                Request a Service Consultation →
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
