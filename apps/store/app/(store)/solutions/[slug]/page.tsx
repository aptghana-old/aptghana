import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

const SOLUTIONS: Record<string, {
  name: string; headline: string; desc: string; accent: string;
  challenges: string[]; products: string[]; relatedSlugs: string[];
}> = {
  mining: {
    name: "Mining & Resources", headline: "Reliable Technology for Demanding Environments", accent: "#d97706",
    desc: "APT Ghana supplies explosion-proof enclosures, Ex-rated motors and drives, robust PLCs, and hazardous area switchgear specifically selected for underground and open-cast mining operations across West Africa. We understand the demanding requirements of mining environments — reliability, longevity, and safety are non-negotiable.",
    challenges: [ "Hazardous area classification (Zone 1/2, Zone 21/22)", "High ambient temperature operation (up to 55°C)", "IP65+ dust and moisture protection", "24/7 continuous operation requirements", "Long cable runs and voltage regulation", "ATEX/IECEx certification requirements" ],
    products: [ "Ex-rated Motors & Drives", "Hazardous Area Enclosures", "Zone-rated Push Buttons & Switches", "Cable Glands & Terminations", "Emergency Stop Systems", "Explosion-Proof Lighting", "Intrinsically Safe Instrumentation" ],
    relatedSlugs: [ "manufacturing", "energy" ],
  },
  manufacturing: {
    name: "Manufacturing", headline: "Automation Solutions for Modern Factories", accent: "#0057b8",
    desc: "From conveyor control to full factory automation, APT Ghana provides PLCs, HMIs, variable speed drives, servo systems, and complete panel solutions for manufacturing facilities across Ghana and West Africa. We support both greenfield projects and brownfield upgrades.",
    challenges: [ "Production line downtime and OEE optimisation", "Energy efficiency and utility costs", "Quality control and traceability requirements", "Operator safety and ergonomic design", "Legacy system integration", "Scalable and modular architecture for growth" ],
    products: [ "Programmable Logic Controllers", "Human Machine Interfaces", "Variable Speed Drives", "Servo Systems", "Conveyor Control Systems", "Industrial Sensors & Switches", "Safety PLCs and Light Curtains" ],
    relatedSlugs: [ "food-beverage", "mining" ],
  },
  energy: {
    name: "Energy & Power", headline: "Power Quality and Protection Solutions", accent: "#16a34a",
    desc: "APT Ghana supplies power quality analysers, protection relays, metering equipment, and monitoring systems for generation facilities, transmission infrastructure, and distribution networks including IPPs and the national grid supply chain.",
    challenges: [ "Power quality and harmonics distortion", "Protection relay coordination and grading", "Revenue metering accuracy and tampering", "SCADA/DCS integration", "Renewable energy integration (solar, wind)", "Grid stability and fault management" ],
    products: [ "Power Quality Analysers", "Protection Relays", "Revenue Meters", "Power Factor Correction", "Surge Protection Devices", "Busbar Systems", "Transformer Monitoring" ],
    relatedSlugs: [ "water", "mining" ],
  },
  water: {
    name: "Water & Utilities", headline: "Intelligent Water Management Systems", accent: "#0891b2",
    desc: "Pump control, flow measurement, pressure monitoring, and SCADA-ready automation systems for water treatment plants, pumping stations, and distribution networks operated by Ghana Water and utility companies.",
    challenges: [ "Pump cavitation, wear, and energy optimisation", "Accurate flow and level measurement", "Remote monitoring and telemetry", "Chemical dosing precision and safety", "Wet and corrosive environments", "Redundancy and failsafe requirements" ],
    products: [ "Pump Control Panels", "Electromagnetic Flow Meters", "Level Sensors & Transmitters", "Variable Speed Pump Drives", "SCADA Remote I/O", "Pressure Transducers", "Chemical Resistant Enclosures" ],
    relatedSlugs: [ "energy", "construction" ],
  },
  construction: {
    name: "Construction", headline: "Site Power and Control Solutions", accent: "#7c3aed",
    desc: "Temporary power distribution, portable switchgear, site lighting, and transformer solutions for large-scale construction and infrastructure projects. APT Ghana supports major contractors with project-specific procurement and rapid delivery.",
    challenges: [ "Temporary power distribution and metering", "Site safety compliance (OSHA/GSSI)", "Power at remote or off-grid locations", "Equipment mobility requirements", "Short-term hire vs. purchase decisions", "Project timeline pressures" ],
    products: [ "Site Distribution Boards", "Portable Transformers", "Industrial Site Lighting", "RCDs and MCBs", "Armoured Cable", "Generator Synchronisation", "Earth Leakage Protection" ],
    relatedSlugs: [ "manufacturing", "energy" ],
  },
  "food-beverage": {
    name: "Food & Beverage", headline: "Hygienic Automation for Food Processing", accent: "#dc2626",
    desc: "IP69K-rated equipment, washdown motors, stainless steel enclosures, and food-grade automation components for breweries, food processing plants, bottling lines, and beverage manufacturers across Ghana.",
    challenges: [ "IP69K washdown and high-pressure cleaning", "Food safety and FDA/FSSC 22000 compliance", "Stainless steel material requirements", "CIP/SIP chemical resistance", "Temperature extremes in freezing and baking", "Hygienic design and cleanability" ],
    products: [ "IP69K Motors & Drives", "Stainless Steel Enclosures", "Hygienic Sensors", "Washdown Push Buttons", "Food-Grade Cable Management", "Hygienic Valves and Actuators", "Conveyor Drives" ],
    relatedSlugs: [ "manufacturing", "water" ],
  },
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const sol = SOLUTIONS[ slug ];
  if (!sol) return { title: "Not Found" };
  return {
    title: `${sol.name} Solutions | APT Ghana`,
    description: sol.desc.slice(0, 160),
  };
}

export function generateStaticParams() {
  return Object.keys(SOLUTIONS).map((slug) => ({ slug }));
}

export default async function SolutionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const sol = SOLUTIONS[ slug ];
  if (!sol) notFound();

  return (
    <>      <main className="min-h-screen bg-[#f9fafb]">
      {/* Header */}
      <div className="bg-[#0a1628] pt-6 pb-10 sm:py-14">
        <div className="container-store">
          {/* <Link href="/solutions" className="inline-flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 font-medium mb-5 transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            All Solutions
          </Link> */}
          <div className="flex flex-wrap gap-2 mb-4">
            <div className="w-2 h-10 rounded-full" style={{ backgroundColor: sol.accent }} />
            <div>
              <h1 className="text-3xl sm:text-5xl font-bold text-white tracking-tight mb-3">{sol.name}</h1>
              <p className="text-lg font-semibold" style={{ color: sol.accent }}>{sol.headline}</p>
            </div>
          </div>
          <p className="text-white/50 max-w-2xl leading-relaxed">{sol.desc}</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/rfq" className="inline-flex items-center gap-2 h-11 px-7 bg-[#3DCD58] hover:bg-[#2AA347] text-white font-semibold text-sm rounded-xl transition-colors">
              Request a Quote
            </Link>
            <Link href="/contact" className="inline-flex items-center gap-2 h-11 px-7 border border-white/15 hover:border-white/30 text-white/70 hover:text-white font-semibold text-sm rounded-xl transition-colors">
              Talk to an Engineer
            </Link>
          </div>
        </div>
      </div>

      <div className="container-store py-10">
        <div className="grid lg:grid-cols-2 gap-8 items-start mb-10">
          {/* Challenges */}
          <div className="bg-white rounded-2xl border border-[#e5e7eb] p-7">
            <h2 className="text-lg font-bold text-[#0a1628] mb-5">Industry Challenges We Solve</h2>
            <ul className="space-y-3">
              {sol.challenges.map((c) => (
                <li key={c} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: sol.accent + "20" }}>
                    <svg className="w-3 h-3" style={{ color: sol.accent }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-sm text-[#374151] leading-relaxed">{c}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Products */}
          <div className="bg-white rounded-2xl border border-[#e5e7eb] p-7">
            <h2 className="text-lg font-bold text-[#0a1628] mb-5">Key Product Categories</h2>
            <ul className="space-y-2">
              {sol.products.map((p) => (
                <li key={p}>
                  <Link href={`/search?q=${encodeURIComponent(p)}`} className="flex items-center justify-between p-3 rounded-xl hover:bg-[#f9fafb] border border-transparent hover:border-[#e5e7eb] transition-all group">
                    <span className="text-sm font-medium text-[#374151] group-hover:text-[#0057b8] transition-colors">{p}</span>
                    <svg className="w-3.5 h-3.5 text-[#9ca3af] group-hover:text-[#0057b8] group-hover:translate-x-0.5 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-4 pt-4 border-t border-[#e5e7eb]">
              <Link href={`/search?q=${encodeURIComponent(sol.name)}`} className="inline-flex items-center gap-2 text-sm font-semibold text-[#0057b8] hover:text-[#1a73e8] transition-colors">
                Browse all {sol.name} products
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          </div>
        </div>

        {/* Related solutions */}
        <div>
          <h2 className="text-lg font-bold text-[#0a1628] mb-4">Related Solutions</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {sol.relatedSlugs.map((rs) => {
              const r = SOLUTIONS[ rs ];
              if (!r) return null;
              return (
                <Link key={rs} href={`/solutions/${rs}`} className="group flex items-center gap-4 p-5 bg-white rounded-2xl border border-[#e5e7eb] hover:border-[#0057b8]/30 hover:shadow-md transition-all">
                  <div className="w-3 h-10 rounded-full shrink-0" style={{ backgroundColor: r.accent }} />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-[#0a1628] group-hover:text-[#0057b8] transition-colors">{r.name}</h3>
                    <p className="text-xs text-[#6b7280] mt-0.5">{r.headline}</p>
                  </div>
                  <svg className="w-4 h-4 text-[#9ca3af] group-hover:text-[#0057b8] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </main>    </>
  );
}
