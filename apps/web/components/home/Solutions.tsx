import Link from "next/link";

const CARDS = [
  {
    num: "01",
    title: "Pre-Sales Consulting",
    desc: "Our expert sales engineers identify the most suitable solution for your operational needs before you commit — reducing risk and ensuring fit.",
    href: "/solutions",
    Icon: ShieldIcon,
  },
  {
    num: "02",
    title: "Technical Assistance & Training",
    desc: "After-sales support, product training, and repair services throughout the entire product life cycle — from commissioning to decommissioning.",
    href: "/services",
    Icon: WrenchIcon,
  },
  {
    num: "03",
    title: "Customized Assembly",
    desc: "End-to-end product assembly with rigorous quality control, tailored to your exact specification and operational requirements.",
    href: "/services",
    Icon: LayersIcon,
  },
];

const PILLARS = [
  {
    title: "Reliable & Scalable Solutions",
    desc: "Industrial-grade systems built to perform across the toughest West African environments — heat, humidity, and hazardous areas included.",
    href: "/solutions",
  },
  {
    title: "Upgrading Obsolete Systems",
    desc: "We help you modernize legacy infrastructure with minimal disruption to ongoing operations, extending asset life and improving efficiency.",
    href: "/services",
  },
  {
    title: "Strategic OEM Partnerships",
    desc: "Direct manufacturer partnerships guarantee product authenticity, regulatory compliance, and technical depth beyond grey-market suppliers.",
    href: "/brands",
  },
];

export default function Solutions() {
  return (
    <section className="section-py bg-[#F8FAFC] dark:bg-[#0D1526]">
      <div className="container-apt">
        {/* Header */}
        <div className="max-w-2xl mb-14">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-6 h-[2px] rounded-full bg-[#84CC16]" />
            <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#84CC16]">
              Our Capabilities
            </span>
          </div>
          <h2
            className="text-4xl lg:text-5xl font-extrabold tracking-tight mb-4 text-[#0F172A] dark:text-[#F1F5F9]"
            style={{ fontFamily: "var(--font-sora, 'Sora', sans-serif)" }}
          >
            End-to-End Industrial Solutions
          </h2>
          <p className="text-lg leading-relaxed text-[#64748B] dark:text-[#94A3B8]">
            From pre-sales consulting to after-sales support, we deliver the complete solution lifecycle.
          </p>
        </div>

        {/* 3 feature cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-14">
          {CARDS.map((card) => (
            <Link
              key={card.title}
              href={card.href}
              className="group relative flex flex-col p-8 bg-white dark:bg-[#111827] rounded-2xl border border-[#E2E8F0] dark:border-white/10 hover:border-[#84CC16]/40 dark:hover:border-[#84CC16]/40 hover:shadow-xl transition-all duration-300"
            >
              {/* Top reveal line */}
              <div className="absolute top-0 left-8 right-8 h-[2px] rounded-full bg-[#84CC16] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 bg-[#84CC16]/10 group-hover:bg-[#84CC16]/20 transition-colors">
                <card.Icon />
              </div>

              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#84CC16] mb-3">
                {card.num}
              </div>
              <h3
                className="text-xl font-bold mb-3 text-[#0F172A] dark:text-[#F1F5F9] group-hover:text-[#1E3A5F] dark:group-hover:text-[#84CC16] transition-colors"
                style={{ fontFamily: "var(--font-sora, 'Sora', sans-serif)" }}
              >
                {card.title}
              </h3>
              <p className="text-sm leading-relaxed flex-1 text-[#64748B] dark:text-[#94A3B8]">{card.desc}</p>

              <div className="flex items-center gap-2 mt-5 text-sm font-semibold text-[#84CC16] group-hover:gap-3 transition-all">
                Learn More
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </Link>
          ))}
        </div>

        {/* Service pillars */}
        <div className="border-t border-[#E2E8F0] dark:border-white/10 pt-12 grid md:grid-cols-3 gap-8 lg:gap-12">
          {PILLARS.map((p) => (
            <div key={p.title} className="flex gap-4">
              <div className="shrink-0 w-[3px] self-stretch rounded-full bg-[#84CC16]" />
              <div>
                <h3 className="font-bold text-base text-[#0F172A] dark:text-[#F1F5F9] mb-2">{p.title}</h3>
                <p className="text-sm leading-relaxed text-[#64748B] dark:text-[#94A3B8] mb-3">{p.desc}</p>
                <Link
                  href={p.href}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#84CC16] hover:text-[#65A30D] transition-colors"
                >
                  Learn More →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ShieldIcon() {
  return (
    <svg className="w-6 h-6 text-[#84CC16]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  );
}
function WrenchIcon() {
  return (
    <svg className="w-6 h-6 text-[#84CC16]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
    </svg>
  );
}
function LayersIcon() {
  return (
    <svg className="w-6 h-6 text-[#84CC16]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L21.75 12l-4.179 2.25m0 0l4.179 2.25L12 21.75 2.25 16.5l4.179-2.25m11.142 0l-5.571 3-5.571-3" />
    </svg>
  );
}
