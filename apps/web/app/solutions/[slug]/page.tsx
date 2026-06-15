import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { SITE_URL, STORE_URL } from "@apt/config";
import Header from "@/components/navigation/Header";
import Footer from "@/components/navigation/Footer";
import { connectDB, CategoryModel } from "@apt/db";

export const revalidate = 3600;

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChildCategory {
  _id: string;
  slug: string;
  name: string;
  description: string;
  image: { url: string; alt: string };
}

interface DbCategory {
  _id: string;
  slug: string;
  name: string;
  description: string;
  shortDescription: string;
  level: string;
  image: { url: string; alt: string };
  ancestors: { slug: string; name: string; level: string }[];
  children: ChildCategory[];
  benefits: Benefit[];
  bulletPoints: string[];
  products: string[];
  brands: string[];
  applications: string[];
}

interface Benefit {
  title: string;
  value: string;
}

interface SolutionData {
  name: string;
  tagline: string;
  desc: string;
  products: string[];
  brands: string[];
  applications: string[];
  benefits: Benefit[];
  bulletPoints: string[];
}

// ─── Static top-level data (fallback for the 6 main solution pages) ───────────

const solutionData: Record<string, SolutionData> = {
  electrical: {
    name: "Electrical Solutions",
    tagline: "LV/MV Distribution & Protection",
    desc: "Complete electrical distribution systems from circuit protection to energy monitoring. APT Ghana supplies the full range of low and medium voltage products — switchgear, protection devices, wiring accessories, and intelligent energy management solutions — backed by our Schneider Electric, Legrand, ABB, and Eaton partnerships.",
    products: [
      "Modular Circuit Breakers (MCBs)",
      "Residual Current Devices (RCCBs)",
      "Moulded Case Circuit Breakers (MCCBs)",
      "Power Monitoring Systems",
      "Energy Meters",
      "Industrial Sockets",
      "Busway Systems",
      "Surge Protection Devices",
    ],
    brands: ["Schneider Electric", "Legrand", "Eaton", "ABB"],
    applications: ["Industrial facilities", "Commercial buildings", "Data centres", "Mining operations"],
    benefits: [
      { title: "Reduced Downtime", value: "IEC-certified switchgear engineered for maximum fault interruption reliability in demanding industrial environments." },
      { title: "Energy Compliance", value: "Solutions aligned with the Ghana Grid Code and IEC standards ensuring safe, fully compliant electrical installations." },
      { title: "Certified Expertise", value: "Schneider Electric certified engineers providing design, supply, and commissioning support from first drawings to handover." },
      { title: "Single-Source Supply", value: "Complete LV/MV portfolio from circuit protection to energy meters — one supplier, one point of accountability." },
    ],
    bulletPoints: [
      "Authorised Schneider Electric distributor since 2009",
      "Full range of IEC-certified circuit protection devices in stock",
      "Fast delivery of LV/MV switchgear across Ghana",
      "Genuine products with full manufacturer warranty",
      "Energy audit and power quality analysis services",
      "Technical engineering support from certified specialists",
    ],
  },
  automation: {
    name: "Automation & Control",
    tagline: "Smart Industrial Automation",
    desc: "From standalone machine control to integrated plant-wide SCADA systems, APT Ghana's automation engineers design, supply, and commission solutions that maximise throughput and minimise downtime. We are certified on leading PLC platforms and support the complete automation chain from sensing to actuation.",
    products: [
      "Programmable Logic Controllers (PLCs)",
      "Human Machine Interfaces (HMIs)",
      "Variable Frequency Drives (VFDs)",
      "Servo Systems & Motion Control",
      "Industrial Sensors & Switches",
      "SCADA Systems",
      "Safety Controllers",
    ],
    brands: ["Schneider Electric", "Siemens", "Omron", "ABB", "ifm electronic", "Sick AG"],
    applications: ["Manufacturing lines", "Mining conveyors", "Water treatment", "Food & beverage"],
    benefits: [
      { title: "Maximised Throughput", value: "End-to-end automation solutions that boost production efficiency and reduce manual intervention on the plant floor." },
      { title: "Predictive Reliability", value: "Remote monitoring and diagnostic capabilities built into every system we commission reduce unplanned downtime." },
      { title: "Standards Compliance", value: "All systems designed to IEC 61131 and NAMUR standards for interoperability, safety, and ease of future expansion." },
      { title: "Turnkey Delivery", value: "Design, supply, installation, and commissioning managed end-to-end by our certified automation engineers." },
    ],
    bulletPoints: [
      "Certified on Schneider Electric, Siemens, and Omron PLC platforms",
      "Full SCADA system design, integration, and operator training",
      "IO-Link and Industrial Ethernet integration expertise",
      "Safety controller design to SIL 2/3 and PLd/PLe",
      "24/7 technical support and preventive maintenance contracts",
      "On-site commissioning included with every project",
    ],
  },
  pneumatics: {
    name: "Pneumatic Systems",
    tagline: "Precision Pneumatic Components",
    desc: "Pneumatic systems are essential to high-speed, reliable industrial automation. APT Ghana supplies a comprehensive range of pneumatic components from precision Italian and German manufacturers, covering every element of the compressed air circuit from preparation to actuation.",
    products: [
      "Directional Control Valves (5/2, 4/2, 3/2)",
      "Pneumatic Cylinders & Actuators",
      "Air Preparation Units (FRL)",
      "Solenoid Valves",
      "Manifolds & Valve Islands",
      "Pneumatic Fittings & Tubing",
      "Air Grippers",
    ],
    brands: ["Camozzi", "Festo", "Parker Hannifin", "EMC"],
    applications: ["Assembly lines", "Packaging machinery", "Material handling", "Process automation"],
    benefits: [
      { title: "Lower Air Consumption", value: "Energy-efficient valve and FRL technology that reduces compressed air demand by up to 30% versus legacy components." },
      { title: "Faster Cycle Times", value: "High-flow directional valves and precision cylinders engineered for maximum machine speed and responsiveness." },
      { title: "Extended Component Life", value: "Italian-engineered components built to continuous-duty industrial standards, minimising replacement frequency." },
      { title: "Fast Local Supply", value: "Comprehensive local stock of common valves, cylinders, and fittings — minimal lead times across Ghana." },
    ],
    bulletPoints: [
      "Authorised Camozzi pneumatic systems distributor",
      "Full circuit design from air preparation to actuation",
      "IP65+ rated components for harsh environments",
      "Custom manifold and valve island assemblies",
      "Stainless steel and food-grade variants available",
      "On-site troubleshooting and replacement support",
    ],
  },
  power: {
    name: "Power & Energy",
    tagline: "Reliable Power Infrastructure",
    desc: "Power continuity is critical for data centres, healthcare, mining, and industrial processes. APT Ghana delivers complete power protection and energy management infrastructure — from compact UPS systems to large-scale three-phase industrial installations, and from distribution transformers to power quality analysers.",
    products: [
      "UPS Systems (Online/Offline/Line-Interactive)",
      "Power Transformers (LV/MV)",
      "Energy Storage Systems",
      "Power Conditioners",
      "Energy Meters & Analysers",
      "Transfer Switches",
      "Capacitor Banks",
    ],
    brands: ["Schneider Electric", "Socomec", "ABB", "Eaton", "Fluke"],
    applications: ["Data centres", "Healthcare facilities", "Mining operations", "Utilities"],
    benefits: [
      { title: "Zero-Downtime Power", value: "Online double-conversion UPS systems delivering clean, uninterrupted power to critical loads around the clock." },
      { title: "Reduced Energy Costs", value: "Power factor correction and energy storage solutions that cut electricity bills and eliminate utility penalty charges." },
      { title: "Regulatory Compliance", value: "IEC 62040 certified equipment meeting all Ghana Energy Commission standards for safe commercial power installations." },
      { title: "Scalable Architecture", value: "Modular power systems that grow with your facility — from 1 kVA desktop UPS to multi-MW industrial installations." },
    ],
    bulletPoints: [
      "Authorised Socomec UPS and power switching distributor",
      "Three-phase and single-phase UPS solutions in stock",
      "Power quality analysis and harmonic mitigation services",
      "Battery management, testing, and replacement programmes",
      "Transformer selection and sizing support",
      "Emergency response for critical power failures",
    ],
  },
  conveying: {
    name: "Conveying Solutions",
    tagline: "Industrial Material Handling",
    desc: "Conveying systems are the arteries of mining, ports, cement, and agricultural operations. APT Ghana is the authorised distributor for Provulco conveyor belting in West Africa, and stocks a comprehensive range of conveyor accessories to support maintenance and new projects across the region.",
    products: [
      "Conveyor Belts (EP, Fabric, Steel Cord)",
      "Idler Rollers & Frames",
      "Drive Pulleys & Tail Pulleys",
      "Belt Fasteners & Splicing Materials",
      "Weighing Bridges & Scales",
      "Belt Alignment Devices",
      "Cleaning Systems",
    ],
    brands: ["Provulco", "NORD Drivesystems", "Robit", "Isenman"],
    applications: ["Mining & quarries", "Ports & terminals", "Cement plants", "Agricultural processing"],
    benefits: [
      { title: "Maximised Belt Life", value: "Premium EP and steel cord conveyor belts engineered for the abrasive, high-impact conditions of Ghanaian mining operations." },
      { title: "Reduced Maintenance", value: "Precision drive and tensioning systems that minimise belt slippage, idler wear, and unplanned conveyor outages." },
      { title: "West Africa's Fastest Supply", value: "As the only authorised Provulco distributor in West Africa, we hold local belt stock for rapid replacement." },
      { title: "Complete System Support", value: "From belt selection and drive sizing to on-site splicing, our engineers support your entire conveying system." },
    ],
    bulletPoints: [
      "Only authorised Provulco distributor in West Africa",
      "EP textile and steel cord belting held in stock",
      "Custom belt splicing and hot/cold vulcanising support",
      "Full range of idlers, pulleys, and conveyor accessories",
      "Belt tension and drive calculations on request",
      "Site surveys and conveyor condition assessments",
    ],
  },
  safety: {
    name: "Safety Systems",
    tagline: "IEC 62061 & ISO 13849 Compliant",
    desc: "Machine safety is both a legal requirement and a moral responsibility. APT Ghana's safety portfolio enables customers to achieve the required Safety Integrity Level (SIL) or Performance Level (PL) for their machinery — from initial risk assessment through the selection and integration of safety-rated components.",
    products: [
      "Safety Relays & Controllers",
      "Light Curtains & Safety Scanners",
      "Emergency Stop Devices",
      "Safety PLCs",
      "Two-Hand Controls",
      "Safety Gate Switches",
      "Risk Assessment Services",
    ],
    brands: ["Pilz", "Schneider Electric", "ABB", "Sick AG"],
    applications: ["Manufacturing machines", "Robotic cells", "Press & stamping", "Chemical plants"],
    benefits: [
      { title: "Legal Compliance", value: "Achieve required SIL and Performance Level ratings to meet Ghana Labour Act obligations and IEC 62061 machinery directives." },
      { title: "Reduced Incident Risk", value: "Comprehensive safety portfolio from risk assessment through certified component selection to full system validation." },
      { title: "Faster Certification", value: "Pre-validated safety architectures accelerate CE marking and machinery directive compliance timelines." },
      { title: "Expert Safety Engineering", value: "Pilz-certified safety engineers providing complete functional safety lifecycle support on every engagement." },
    ],
    bulletPoints: [
      "Authorised Pilz safety automation distributor",
      "Risk assessment and SISTEMA calculation support",
      "Safety relay and light curtain selection and sizing",
      "Complete safety PLC programming and validation",
      "IEC 62061 and ISO 13849 lifecycle documentation",
      "Annual safety audits and maintenance contracts",
    ],
  },
};

// ─── DB fetch: category + ancestors + children ────────────────────────────────

async function getCategoryFull(slug: string): Promise<DbCategory | null> {
  try {
    await connectDB();

    type RawCat = { _id: unknown; slug: string; name: string; description?: string; shortDescription?: string; image?: { url?: string; alt?: string }; level: string; ancestors?: unknown[]; benefits?: { title?: string; value?: string }[]; bulletPoints?: string[]; products?: string[]; brands?: string[]; applications?: string[] };
    type RawAncestor = { _id: unknown; slug: string; name: string; level: string };
    type RawChild = { _id: unknown; slug: string; name: string; description?: string; shortDescription?: string; image?: { url?: string; alt?: string } };

    const cat = await CategoryModel.findOne({ slug, status: "active" })
      .select("_id slug name description shortDescription image level ancestors benefits bulletPoints")
      .lean() as unknown as RawCat | null;

    if (!cat) return null;

    const [childrenRaw, ancestorsRaw] = await Promise.all([
      CategoryModel.find({ parentId: cat._id, status: "active" })
        .select("slug name description shortDescription image displayOrder")
        .sort({ displayOrder: 1, name: 1 })
        .lean(),
      cat.ancestors?.length
        ? CategoryModel.find({ _id: { $in: cat.ancestors } })
            .select("slug name level")
            .lean()
        : Promise.resolve([]),
    ]);

    // Preserve the original ancestor order using the stored array
    const ancestorMap = new Map(
      (ancestorsRaw as unknown as RawAncestor[]).map((a) => [String(a._id), a])
    );
    const sortedAncestors = (cat.ancestors || [])
      .map((id) => ancestorMap.get(String(id)))
      .filter((a): a is RawAncestor => a != null)
      .map((a) => ({ slug: a.slug, name: a.name, level: a.level }));

    return {
      _id: String(cat._id),
      slug: cat.slug,
      name: cat.name,
      shortDescription: cat.shortDescription || "",
      description: cat.description || cat.shortDescription || "",
      level: cat.level,
      image: {
        url: cat.image?.url || "",
        alt: cat.image?.alt || cat.name,
      },
      ancestors: sortedAncestors,
      benefits: (cat.benefits ?? []).map((b) => ({
        title: b.title ?? "",
        value: b.value ?? "",
      })),
      bulletPoints: cat.bulletPoints ?? [],
      products:     cat.products ?? [],
      brands:       cat.brands ?? [],
      applications: cat.applications ?? [],
      children: (childrenRaw as unknown as RawChild[]).map((c) => ({
        _id: String(c._id),
        slug: c.slug,
        name: c.name,
        description: c.description || c.shortDescription || "",
        image: {
          url: c.image?.url || "",
          alt: c.image?.alt || c.name,
        },
      })),
    };
  } catch {
    return null;
  }
}

// ─── Next.js route config ─────────────────────────────────────────────────────

export async function generateStaticParams() {
  // Static slugs are pre-generated; DB slugs are rendered on-demand (ISR)
  return Object.keys(solutionData).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const solution = solutionData[slug];

  if (solution) {
    return {
      title: `${solution.name} | APT Ghana`,
      description: `${solution.tagline} — ${solution.desc.substring(0, 150)}`,
      openGraph: {
        title: `${solution.name} | APT Ghana`,
        description: solution.tagline,
        url: `${SITE_URL}/solutions/${slug}`,
      },
      alternates: { canonical: `${SITE_URL}/solutions/${slug}` },
    };
  }

  // DB-based category
  const cat = await getCategoryFull(slug);
  if (!cat) return { title: "Not Found | APT Ghana" };

  return {
    title: `${cat.name} | APT Ghana`,
    description: cat.description || `${cat.name} — industrial solutions from APT Ghana.`,
    openGraph: {
      title: `${cat.name} | APT Ghana`,
      description: cat.description,
      url: `${SITE_URL}/solutions/${slug}`,
      ...(cat.image.url ? { images: [{ url: cat.image.url, alt: cat.image.alt }] } : {}),
    },
    alternates: { canonical: `${SITE_URL}/solutions/${slug}` },
  };
}

// ─── Benefits grid ────────────────────────────────────────────────────────────

function BenefitsSection({ benefits, name }: { benefits: Benefit[]; name: string }) {
  if (!benefits.length) return null;
  return (
    <section className="section-py bg-white dark:bg-[#0A0F1E]">
      <div className="container-apt">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-6 h-[2px] rounded-full bg-[#84CC16]" />
          <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#84CC16]">
            Key Benefits
          </span>
        </div>
        <h2
          className="text-3xl font-extrabold tracking-tight text-[#0F172A] dark:text-[#F1F5F9] mb-8"
          style={{ fontFamily: "var(--font-sora, 'Sora', sans-serif)" }}
        >
          Why Choose APT Ghana for {name}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {benefits.map((b) => (
            <div
              key={b.title}
              className="flex gap-5 p-6 bg-[#F8FAFC] dark:bg-[#111827] rounded-2xl border border-[#E2E8F0] dark:border-white/10 hover:border-[#84CC16]/40 transition-colors"
            >
              <span className="flex-shrink-0 mt-0.5 w-8 h-8 rounded-xl bg-[#84CC16]/15 flex items-center justify-center">
                <svg className="w-4 h-4 text-[#84CC16]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </span>
              <div>
                <h3 className="font-bold text-[#0F172A] dark:text-[#F1F5F9] text-[15px] mb-1.5">
                  {b.title}
                </h3>
                <p className="text-sm text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
                  {b.value}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Bullet points checklist ───────────────────────────────────────────────────

function BulletPointsSection({ points }: { points: string[] }) {
  if (!points.length) return null;
  return (
    <div className="bg-[#0A0F1E] rounded-2xl p-7">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-5 h-[2px] rounded-full bg-[#84CC16]" />
        <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#84CC16]">
          Why APT Ghana
        </span>
      </div>
      <ul className="space-y-3">
        {points.map((pt) => (
          <li key={pt} className="flex items-start gap-3">
            <span className="flex-shrink-0 mt-0.5 w-5 h-5 rounded-full bg-[#84CC16]/15 flex items-center justify-center">
              <svg className="w-2.5 h-2.5 text-[#84CC16]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </span>
            <span className="text-sm text-white/75 leading-snug">{pt}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Shared child-category grid ───────────────────────────────────────────────

function ChildrenGrid({ children, heading }: { children: ChildCategory[]; heading: string }) {
  return (
    <section className="section-py bg-[#F8FAFC] dark:bg-[#0D1526]">
      <div className="container-apt">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-6 h-[2px] rounded-full bg-[#84CC16]" />
          <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#84CC16]">
            Product Categories
          </span>
        </div>
        <h2
          className="text-3xl font-extrabold tracking-tight text-[#0F172A] dark:text-[#F1F5F9] mb-8"
          style={{ fontFamily: "var(--font-sora, 'Sora', sans-serif)" }}
        >
          {heading}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {children.map((child) => (
            <Link
              key={child._id}
              href={`/solutions/${child.slug}`}
              className="group bg-white dark:bg-[#111827] rounded-2xl border border-[#E2E8F0] dark:border-white/10 overflow-hidden hover:border-[#84CC16]/50 hover:-translate-y-1 transition-all"
            >
              {child.image.url && (
                <div className="h-44 bg-[#F8FAFC] dark:bg-[#0A0F1E] flex items-center justify-center border-b border-[#E2E8F0] dark:border-white/10 p-5">
                  <Image
                    src={child.image.url}
                    alt={child.image.alt}
                    width={160}
                    height={120}
                    className="h-full w-auto max-w-full object-contain"
                  />
                </div>
              )}
              <div className="p-5">
                <h3
                  className="font-extrabold text-[#0F172A] dark:text-[#F1F5F9] group-hover:text-[#84CC16] transition-colors mb-2 leading-snug"
                  style={{ fontFamily: "var(--font-sora, 'Sora', sans-serif)" }}
                >
                  {child.name}
                </h3>
                {child.description && (
                  <p className="text-xs text-[#64748B] dark:text-[#94A3B8] leading-relaxed line-clamp-3">
                    {child.description}
                  </p>
                )}
                <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-[#84CC16]">
                  <span>Learn more</span>
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Standard dark CTA ─────────────────────────────────────────────────────────

function SolutionCTA({ name }: { name: string }) {
  return (
    <section className="py-16 bg-[#0A0F1E]">
      <div className="container-apt">
        <div className="bg-white/5 rounded-2xl border border-white/10 p-10 lg:p-14 flex flex-col lg:flex-row items-center justify-between gap-8">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-6 h-[2px] rounded-full bg-[#84CC16]" />
              <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#84CC16]">
                Request a Quote
              </span>
            </div>
            <h2
              className="text-3xl font-extrabold tracking-tight text-white mb-3"
              style={{ fontFamily: "var(--font-sora, 'Sora', sans-serif)" }}
            >
              Ready to Discuss Your {name} Project?
            </h2>
            <p className="text-white/60 text-sm max-w-lg">
              Our engineers are ready to review your requirements and provide a detailed
              technical proposal. Contact us today.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 h-12 px-7 bg-[#84CC16] text-[#0A0F1E] font-bold text-sm rounded-xl hover:bg-[#78B800] transition-colors whitespace-nowrap"
            >
              Request a Quote →
            </Link>
            <Link
              href={STORE_URL}
              className="inline-flex items-center gap-2 h-12 px-7 border border-white/20 text-white font-bold text-sm rounded-xl hover:bg-white/10 transition-colors whitespace-nowrap"
            >
              Browse Products
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Breadcrumb ────────────────────────────────────────────────────────────────

function Breadcrumb({
  ancestors,
  current,
}: {
  ancestors: { slug: string; name: string }[];
  current: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 text-xs text-[#0F172A]/40 dark:text-white/40 mb-6">
      <Link href="/solutions" className="hover:text-[#0F172A]/70 dark:hover:text-white/70 transition-colors">
        Solutions
      </Link>
      {ancestors.map((a) => (
        <>
          <span key={`sep-${a.slug}`}>/</span>
          <Link
            key={a.slug}
            href={`/solutions/${a.slug}`}
            className="hover:text-[#0F172A]/70 dark:hover:text-white/70 transition-colors"
          >
            {a.name}
          </Link>
        </>
      ))}
      <span>/</span>
      <span className="text-[#475569] dark:text-white/60">{current}</span>
    </div>
  );
}

// ─── Page component ────────────────────────────────────────────────────────────

export default async function SolutionDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const solution = solutionData[slug];

  // Always fetch from DB — provides children for static pages and full data for dynamic ones
  const dbCategory = await getCategoryFull(slug);

  if (!solution && !dbCategory) notFound();

  // ── Static page (one of the 6 main solutions) ──────────────────────────────
  if (solution) {
    const children = dbCategory?.children ?? [];

    // Prefer DB data when the group has been seeded/edited
    const name         = dbCategory?.name                                   || solution.name;
    const tagline      = dbCategory?.shortDescription                       || solution.tagline;
    const desc         = dbCategory?.description                            || solution.desc;
    const products     = dbCategory?.products?.length     ? dbCategory.products     : solution.products;
    const brands       = dbCategory?.brands?.length       ? dbCategory.brands       : solution.brands;
    const applications = dbCategory?.applications?.length ? dbCategory.applications : solution.applications;
    const benefits     = dbCategory?.benefits?.length     ? dbCategory.benefits     : solution.benefits;
    const bulletPoints = dbCategory?.bulletPoints?.length ? dbCategory.bulletPoints : solution.bulletPoints;

    return (
      <>
        <Header />
        <main>
          {/* Hero */}
          <section className="bg-[#F8FAFC] dark:bg-[#0A0F1E] pt-32 pb-20">
            <div className="container-apt">
              <div className="flex items-center gap-2 text-xs text-[#0F172A]/40 dark:text-white/40 mb-6">
                <Link href="/solutions" className="hover:text-[#0F172A]/60 dark:hover:text-white/70 transition-colors">
                  Solutions
                </Link>
                <span>/</span>
                <span className="text-[#475569] dark:text-white/60">{name}</span>
              </div>
              <div className="max-w-2xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-6 h-[2px] rounded-full bg-[#84CC16]" />
                  <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#84CC16]">
                    {tagline}
                  </span>
                </div>
                <h1
                  className="text-4xl lg:text-5xl font-extrabold tracking-tight text-[#0F172A] dark:text-white mb-6"
                  style={{ fontFamily: "var(--font-sora, 'Sora', sans-serif)" }}
                >
                  {name}
                </h1>
                <p className="text-[#64748B] dark:text-[#94A3B8] text-lg leading-relaxed">{desc}</p>
              </div>
            </div>
          </section>

          <BenefitsSection benefits={benefits} name={name} />

          {/* Products + Applications */}
          <section className="section-py bg-[#F8FAFC] dark:bg-[#0D1526]">
            <div className="container-apt">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Products */}
                <div className="lg:col-span-2">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-6 h-[2px] rounded-full bg-[#84CC16]" />
                    <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#84CC16]">
                      Products & Components
                    </span>
                  </div>
                  <h2
                    className="text-3xl font-extrabold tracking-tight text-[#0F172A] dark:text-[#F1F5F9] mb-8"
                    style={{ fontFamily: "var(--font-sora, 'Sora', sans-serif)" }}
                  >
                    What We Supply
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {products.map((product) => (
                      <div
                        key={product}
                        className="flex items-start gap-3 p-5 bg-white dark:bg-[#111827] rounded-xl border border-[#E2E8F0] dark:border-white/10"
                      >
                        <span className="flex-shrink-0 mt-1 w-5 h-5 rounded-full bg-[#84CC16]/15 flex items-center justify-center">
                          <svg className="w-3 h-3 text-[#84CC16]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                        </span>
                        <span className="text-sm font-medium text-[#0F172A] dark:text-[#F1F5F9] leading-snug">{product}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sidebar */}
                <div className="flex flex-col gap-6">
                  {/* Brands */}
                  <div className="bg-[#0A0F1E] rounded-2xl p-7 text-white">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-5 h-[2px] rounded-full bg-[#84CC16]" />
                      <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#84CC16]">
                        Brand Partners
                      </span>
                    </div>
                    <div className="space-y-3">
                      {brands.map((brand) => (
                        <div key={brand} className="flex items-center gap-3">
                          <span className="w-2 h-2 rounded-full bg-[#84CC16]" />
                          <span className="text-sm font-medium text-white">{brand}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-6 pt-5 border-t border-white/10">
                      <Link href={STORE_URL} className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#84CC16] hover:underline">
                        Browse products on our store →
                      </Link>
                    </div>
                  </div>

                  {/* Applications */}
                  <div className="bg-white dark:bg-[#111827] rounded-2xl border border-[#E2E8F0] dark:border-white/10 p-7">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-5 h-[2px] rounded-full bg-[#84CC16]" />
                      <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#84CC16]">
                        Applications
                      </span>
                    </div>
                    <div className="space-y-3">
                      {applications.map((app) => (
                        <div key={app} className="flex items-center gap-3">
                          <span className="w-2 h-2 rounded-full bg-[#1E3A5F] dark:bg-[#84CC16]" />
                          <span className="text-sm text-[#0F172A] dark:text-[#94A3B8]">{app}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <BulletPointsSection points={bulletPoints} />
                </div>
              </div>
            </div>
          </section>

          {/* DB sub-categories (only when DB has children) */}
          {children.length > 0 && (
            <ChildrenGrid
              children={children}
              heading={`${name} Categories`}
            />
          )}

          <SolutionCTA name={name} />

          {/* Other solutions */}
          <section className="py-14 bg-[#F8FAFC] dark:bg-[#0D1526]">
            <div className="container-apt">
              <div className="flex items-center justify-between mb-8">
                <h3
                  className="text-xl font-bold text-[#0F172A] dark:text-[#F1F5F9]"
                  style={{ fontFamily: "var(--font-sora, 'Sora', sans-serif)" }}
                >
                  Other Solutions
                </h3>
                <Link href="/solutions" className="text-sm font-semibold text-[#84CC16] hover:underline">
                  View all →
                </Link>
              </div>
              <div className="flex flex-wrap gap-3">
                {Object.entries(solutionData)
                  .filter(([s]) => s !== slug)
                  .map(([s, data]) => (
                    <Link
                      key={s}
                      href={`/solutions/${s}`}
                      className="inline-flex items-center gap-2 h-10 px-5 bg-white dark:bg-[#111827] border border-[#E2E8F0] dark:border-white/10 rounded-xl text-sm font-medium text-[#0F172A] dark:text-[#94A3B8] hover:border-[#84CC16]/50 hover:bg-[#84CC16]/5 transition-colors"
                    >
                      {data.name}
                    </Link>
                  ))}
              </div>
            </div>
          </section>
        </main>
        <Footer />
      </>
    );
  }

  // ── Dynamic DB-based category page (any depth: category / subcategory / range) ──

  const cat = dbCategory!;
  const hasChildren = cat.children.length > 0;

  // Find the group ancestor for "Other Solutions" chips
  const groupAncestor = cat.ancestors.find((a) => a.level === "group");

  return (
    <>
      <Header />
      <main>
        {/* Hero */}
        <section className="bg-[#F8FAFC] dark:bg-[#0A0F1E] pt-32 pb-20">
          <div className="container-apt">
            <Breadcrumb ancestors={cat.ancestors} current={cat.name} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
              <div className="max-w-2xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-6 h-[2px] rounded-full bg-[#84CC16]" />
                  <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#84CC16] capitalize">
                    {cat.level}
                  </span>
                </div>
                <h1
                  className="text-4xl lg:text-5xl font-extrabold tracking-tight text-[#0F172A] dark:text-white mb-6"
                  style={{ fontFamily: "var(--font-sora, 'Sora', sans-serif)" }}
                >
                  {cat.name}
                </h1>
                {cat.description && (
                  <p className="text-[#64748B] dark:text-[#94A3B8] text-lg leading-relaxed">
                    {cat.description}
                  </p>
                )}
              </div>

              {/* Hero image if available */}
              {cat.image.url && (
                <div className="hidden lg:flex items-center justify-center h-64 bg-white dark:bg-[#111827] rounded-2xl border border-[#E2E8F0] dark:border-white/10 p-8">
                  <Image
                    src={cat.image.url}
                    alt={cat.image.alt}
                    width={280}
                    height={200}
                    className="h-full w-auto max-w-full object-contain"
                    priority
                  />
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Mobile hero image */}
        {cat.image.url && (
          <div className="lg:hidden bg-[#F8FAFC] dark:bg-[#111827] border-y border-[#E2E8F0] dark:border-white/10 flex items-center justify-center h-52 p-6">
            <Image
              src={cat.image.url}
              alt={cat.image.alt}
              width={200}
              height={150}
              className="h-full w-auto max-w-full object-contain"
            />
          </div>
        )}

        <BenefitsSection benefits={cat.benefits} name={cat.name} />

        {/* Children grid or leaf CTA */}
        {hasChildren ? (
          <ChildrenGrid children={cat.children} heading={`${cat.name} Categories`} />
        ) : (
          /* Leaf node — no sub-categories, direct store link */
          <section className="section-py bg-white dark:bg-[#0A0F1E]">
            <div className="container-apt">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-6 h-[2px] rounded-full bg-[#84CC16]" />
                    <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#84CC16]">
                      Shop Products
                    </span>
                  </div>
                  <h2
                    className="text-3xl font-extrabold tracking-tight text-[#0F172A] dark:text-[#F1F5F9] mb-4"
                    style={{ fontFamily: "var(--font-sora, 'Sora', sans-serif)" }}
                  >
                    Browse {cat.name} Products
                  </h2>
                  <p className="text-[#64748B] dark:text-[#94A3B8] text-base mb-8">
                    Explore our full range of {cat.name} products on our online store.
                    All products are sourced from authorised manufacturers with full warranty support.
                  </p>
                  <Link
                    href={`${STORE_URL}/search?q=${encodeURIComponent(cat.name)}`}
                    className="inline-flex items-center gap-2 h-12 px-8 bg-[#84CC16] text-[#0A0F1E] font-bold text-sm rounded-xl hover:bg-[#78B800] transition-colors"
                  >
                    Shop {cat.name} →
                  </Link>
                </div>
                {cat.bulletPoints.length > 0 && (
                  <div>
                    <BulletPointsSection points={cat.bulletPoints} />
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        <SolutionCTA name={cat.name} />

        {/* Related: siblings from same parent group */}
        {groupAncestor && (
          <section className="py-14 bg-[#F8FAFC] dark:bg-[#0D1526]">
            <div className="container-apt">
              <div className="flex items-center justify-between mb-6">
                <h3
                  className="text-xl font-bold text-[#0F172A] dark:text-[#F1F5F9]"
                  style={{ fontFamily: "var(--font-sora, 'Sora', sans-serif)" }}
                >
                  Back to {groupAncestor.name}
                </h3>
                <Link href={`/solutions/${groupAncestor.slug}`} className="text-sm font-semibold text-[#84CC16] hover:underline">
                  View all →
                </Link>
              </div>
              <div className="flex flex-wrap gap-3">
                {cat.ancestors.map((a) => (
                  <Link
                    key={a.slug}
                    href={`/solutions/${a.slug}`}
                    className="inline-flex items-center gap-2 h-10 px-5 bg-white dark:bg-[#111827] border border-[#E2E8F0] dark:border-white/10 rounded-xl text-sm font-medium text-[#0F172A] dark:text-[#94A3B8] hover:border-[#84CC16]/50 hover:bg-[#84CC16]/5 transition-colors"
                  >
                    {a.name}
                  </Link>
                ))}
                <Link
                  href="/solutions"
                  className="inline-flex items-center gap-2 h-10 px-5 bg-white dark:bg-[#111827] border border-[#E2E8F0] dark:border-white/10 rounded-xl text-sm font-medium text-[#0F172A] dark:text-[#94A3B8] hover:border-[#84CC16]/50 hover:bg-[#84CC16]/5 transition-colors"
                >
                  All Solutions
                </Link>
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
