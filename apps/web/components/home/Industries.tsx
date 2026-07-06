import Link from "next/link";
import Image from "next/image";

const INDUSTRIES = [
  {
    name: "Mining & Resources",
    tag: "ATEX | Zone 1/2",
    desc: "Explosion-proof controls, hazardous-area electrical, and heavy-duty drives for West Africa's gold, bauxite, and manganese operations.",
    href: "/industries/mining",
    accent: "#D97706",
    img: "/images/home/an-extensive-range-of-industrial.jpg",
  },
  {
    name: "Oil, Gas & Energy",
    tag: "High Voltage | SCADA",
    desc: "Intrinsically safe instrumentation, power quality solutions, and process automation for upstream and downstream operations.",
    href: "/industries/energy",
    accent: "#16A34A",
    img: "/images/home/SE_APM_Drive_Hero_image.jpg",
  },
  {
    name: "Manufacturing",
    tag: "Automation | IIoT",
    desc: "PLCs, HMIs, servo drives, and conveyor systems for FMCG, textile, plastics, and discrete manufacturing plants.",
    href: "/industries/manufacturing",
    accent: "#0057B8",
    img: "/images/home/Production-Line-WM.jpg",
  },
  {
    name: "Construction & Infrastructure",
    tag: "LV Distribution | Safety",
    desc: "Temporary power distribution, site lighting, and robust switchgear for large-scale infrastructure and commercial projects.",
    href: "/industries/construction",
    accent: "#7C3AED",
    img: "/images/home/help_desktop_view.jpg",
  },
  {
    name: "Water & Wastewater",
    tag: "SCADA | Pump Drives",
    desc: "Variable speed drives, monitoring systems, and chemical dosing controls for municipal and industrial water treatment.",
    href: "/industries/water",
    accent: "#0891B2",
    img: "/images/home/cust-proof-point.jpg",
  },
  {
    name: "Ports & Logistics",
    tag: "Heavy-Duty | Certified",
    desc: "Material handling, crane electrics, and conveying systems for Tema Port and Ghana's growing logistics hubs.",
    href: "/industries/ports",
    accent: "#64748B",
    img: "/images/home/carousel/hero/Home page - Conveying Solutions.jpg",
  },
];

export default function Industries() {
  return (
    <section className="section-py bg-white dark:bg-[#0A0F1E]">
      <div className="container-apt">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-14">
          <div className="max-w-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-6 h-0.5 rounded-full bg-[#84CC16]" />
              <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#84CC16]">
                Sectors We Serve
              </span>
            </div>
            <h2
              className="text-4xl lg:text-5xl font-extrabold tracking-tight text-[#0F172A] dark:text-[#F1F5F9]"
              style={{ fontFamily: "var(--font-sora, 'Sora', sans-serif)" }}
            >
              Industries That Trust APT
            </h2>
          </div>
          <Link
            href="/industries"
            className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-[#0A0F1E] dark:border-white/20 text-sm font-bold text-[#0F172A] dark:text-white hover:bg-[#0A0F1E] hover:text-white transition-all duration-200"
          >
            All Industries
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>

        {/* Industry cards grid with real images */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {INDUSTRIES.map((ind) => (
            <Link
              key={ind.name}
              href={ind.href}
              className="group relative flex flex-col justify-end overflow-hidden rounded-2xl min-h-[280px] hover:shadow-2xl transition-all duration-300"
            >
              {/* Background image */}
              <Image
                src={ind.img}
                alt={ind.name}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                loading="lazy"
              />
              {/* Dark gradient overlay */}
              <div
                className="absolute inset-0"
                style={{
                  background: "linear-gradient(to top, rgba(10,15,30,0.95) 0%, rgba(10,15,30,0.6) 50%, rgba(10,15,30,0.2) 100%)",
                }}
              />
              {/* Accent top bar */}
              <div className="absolute top-0 inset-x-0 h-[3px]" style={{ background: ind.accent }} />

              {/* Content */}
              <div className="relative p-6">
                <span
                  className="inline-block text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full mb-3 border"
                  style={{
                    color: ind.accent,
                    borderColor: ind.accent + "50",
                    background: ind.accent + "20",
                  }}
                >
                  {ind.tag}
                </span>
                <h3
                  className="text-xl font-bold text-white mb-2"
                  style={{ fontFamily: "var(--font-sora, 'Sora', sans-serif)" }}
                >
                  {ind.name}
                </h3>
                <p className="text-white/55 text-sm leading-relaxed mb-4">{ind.desc}</p>
                <div
                  className="flex items-center gap-2 text-sm font-semibold group-hover:gap-3 transition-all"
                  style={{ color: ind.accent }}
                >
                  Explore Solutions
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
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
