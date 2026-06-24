import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Industry Solutions | APT Ghana",
  description: "Tailored industrial technology solutions for mining, manufacturing, energy, water, construction, and food & beverage sectors across West Africa.",
};

const SOLUTIONS = [
  {
    slug: "mining",
    name: "Mining & Resources",
    headline: "Reliable Technology for Demanding Environments",
    desc: "APT Ghana supplies explosion-proof enclosures, Ex-rated motors and drives, robust PLCs, and hazardous area switchgear specifically selected for underground and open-cast mining operations in West Africa.",
    accent: "#d97706",
    challenges: [ "Hazardous area classification (Zone 1/2, Zone 21/22)", "High ambient temperature operation", "Dust and moisture ingress protection", "24/7 continuous operation requirements", "Long cable runs and voltage drop" ],
    products: [ "Ex-rated Motors & Drives", "Hazardous Area Enclosures", "Zone-rated Push Buttons & Switches", "Cable Glands & Terminations", "Emergency Stop Systems" ],
  },
  {
    slug: "manufacturing",
    name: "Manufacturing",
    headline: "Automation Solutions for Modern Factories",
    desc: "From conveyor control to full factory automation, APT Ghana provides PLCs, HMIs, variable speed drives, servo systems, and complete panel solutions for manufacturing facilities across Ghana and West Africa.",
    accent: "#0057b8",
    challenges: [ "Production line downtime costs", "Energy efficiency requirements", "Quality control and traceability", "Operator safety and ergonomics", "Scalable and modular architecture" ],
    products: [ "Programmable Logic Controllers", "Human Machine Interfaces", "Variable Speed Drives", "Conveyor Control Systems", "Industrial Sensors & Switches" ],
  },
  {
    slug: "energy",
    name: "Energy & Power",
    headline: "Power Quality and Protection Solutions",
    desc: "APT Ghana supplies power quality analysers, protection relays, metering equipment, and monitoring systems for generation facilities, transmission infrastructure, and distribution networks.",
    accent: "#16a34a",
    challenges: [ "Power quality and harmonics", "Protection relay coordination", "Revenue metering accuracy", "SCADA integration", "Renewable energy integration" ],
    products: [ "Power Quality Analysers", "Protection Relays", "Energy Meters", "Power Factor Correction", "Surge Protection Devices" ],
  },
  {
    slug: "water",
    name: "Water & Utilities",
    headline: "Intelligent Water Management Systems",
    desc: "Pump control, flow measurement, pressure monitoring, and SCADA-ready automation systems for water treatment plants, pumping stations, and distribution networks.",
    accent: "#0891b2",
    challenges: [ "Pump cavitation and wear", "Accurate flow and level measurement", "Remote monitoring and control", "Chemical dosing precision", "Energy optimisation" ],
    products: [ "Pump Control Panels", "Flow Meters & Transmitters", "Level Sensors", "Variable Speed Pump Drives", "SCADA Remote I/O" ],
  },
  {
    slug: "construction",
    name: "Construction",
    headline: "Site Power and Control Solutions",
    desc: "Temporary power distribution, portable switchgear, site lighting, and transformer solutions for large-scale construction and infrastructure projects across West Africa.",
    accent: "#7c3aed",
    challenges: [ "Temporary power distribution", "Site safety compliance", "Power at remote locations", "Equipment mobility requirements", "Short-term project needs" ],
    products: [ "Site Distribution Boards", "Portable Transformers", "Industrial Lighting", "RCDs and MCBs", "Cable Management Systems" ],
  },
  {
    slug: "food-beverage",
    name: "Food & Beverage",
    headline: "Hygienic Automation for Food Processing",
    desc: "IP69K-rated equipment, washdown motors, stainless steel enclosures, and food-grade automation components for breweries, food processing plants, and beverage manufacturers.",
    accent: "#dc2626",
    challenges: [ "Washdown and hygiene requirements", "Food safety compliance", "Stainless steel material requirements", "CIP/SIP compatibility", "Temperature extremes" ],
    products: [ "IP69K Motors & Drives", "Stainless Steel Enclosures", "Hygienic Sensors", "Washdown Push Buttons", "Food-Grade Cable Management" ],
  },
];

export default function SolutionsPage() {
  return (
    <>      <main className="min-h-screen bg-[#f9fafb]">
      <div className="bg-[#0a1628] py-12">
        <div className="container-store">
          <p className="text-xs font-semibold text-[#ff8c33] uppercase tracking-widest mb-2">By Industry</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">Industry Solutions</h1>
          <p className="text-white/50 mt-2 max-w-xl">
            APT Ghana goes beyond product supply. Our engineers bring industry-specific expertise to every project — from initial design to commissioning and after-sales support.
          </p>
        </div>
      </div>

      <div className="container-store py-10 space-y-5">
        {SOLUTIONS.map((sol) => (
          <Link
            key={sol.slug}
            href={`/solutions/${sol.slug}`}
            className="group block bg-white rounded-2xl border border-[#e5e7eb] p-6 sm:p-8 hover:border-[#0057b8]/30 hover:shadow-lg transition-all duration-200"
          >
            <div className="grid sm:grid-cols-[1fr_auto] gap-4 items-start">
              <div>
                <div className="flex flex-wrap gap-2 mb-2">
                  <div className="w-2 h-8 rounded-full inline-block" style={{ backgroundColor: sol.accent }} />
                  <div className="">
                    <h2 className="text-xl font-bold text-[#0a1628] group-hover:text-[#0057b8] transition-colors mb-1">{sol.name}</h2>
                    <p className="text-sm font-semibold" style={{ color: sol.accent }}>{sol.headline}</p>
                  </div>
                </div>
                <p className="text-sm text-[#6b7280] leading-relaxed max-w-2xl">{sol.desc}</p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {sol.products.slice(0, 4).map((p) => (
                    <span key={p} className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-[#f3f4f6] text-[#374151]">{p}</span>
                  ))}
                  {sol.products.length > 4 && (
                    <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-[#f3f4f6] text-[#6b7280]">+{sol.products.length - 4} more</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm font-semibold text-[#0057b8] group-hover:translate-x-1 transition-transform shrink-0">
                View Solution
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* CTA */}
      <div className="container-store pb-12">
        <div className="bg-[#0a1628] rounded-2xl p-8 sm:p-12 text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Don&apos;t see your industry?</h2>
          <p className="text-white/50 mb-6 max-w-lg mx-auto">Our engineers have experience across a wide range of industrial sectors. Contact us with your specific requirements.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/contact" className="inline-flex items-center gap-2 h-11 px-7 bg-[#3DCD58] hover:bg-[#2AA347] text-white font-semibold text-sm rounded-xl transition-colors">
              Talk to an Engineer
            </Link>
            <Link href="/rfq" className="inline-flex items-center gap-2 h-11 px-7 border border-white/20 hover:border-white/40 text-white/70 hover:text-white font-semibold text-sm rounded-xl transition-colors">
              Request a Quote
            </Link>
          </div>
        </div>
      </div>
    </main >    </>
  );
}
