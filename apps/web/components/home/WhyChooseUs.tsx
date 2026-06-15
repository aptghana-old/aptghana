import Link from "next/link";

const BENEFITS = [
  {
    num: "01",
    title: "Pre-Sales Consulting",
    desc: "Our engineers help you identify the right solution before purchase — reducing risk, improving fit, and avoiding costly over-specification or under-specification.",
  },
  {
    num: "02",
    title: "Full Life-Cycle Support",
    desc: "From installation to scheduled maintenance, we support your operations at every stage. Service contracts, training, and emergency support available.",
  },
  {
    num: "03",
    title: "Certified Quality",
    desc: "All products sourced directly from OEM partners with full traceability and compliance documentation. No grey market, no counterfeits — ever.",
  },
];

const AWARDS = [
  {
    title: "Partner of the Year",
    sub: "Ghana · 2021",
    org: "Schneider Electric",
    img: "/images/awards/partner-of-the-year-ghana.jpg",
  },
  {
    title: "Marketing Excellence Award",
    sub: "Africa · 2024",
    org: "Industrial Association",
    img: "/images/awards/marketing-excellence.jpg",
  },
  {
    title: "Certificate of Recognition",
    sub: "Authorized Distributor",
    org: "Schneider Electric",
    img: "/images/awards/certificate-of-recognition.jpg",
  },
];

export default function WhyChooseUs() {
  return (
    <section className="section-py bg-[#F8FAFC] dark:bg-[#0D1526]">
      <div className="container-apt">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-6 h-[2px] rounded-full bg-[#84CC16]" />
            <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#84CC16]">
              Why Choose APT Ghana?
            </span>
            <div className="w-6 h-[2px] rounded-full bg-[#84CC16]" />
          </div>
          <h2
            className="text-4xl lg:text-5xl font-extrabold tracking-tight text-[#0F172A] dark:text-[#F1F5F9]"
            style={{ fontFamily: "var(--font-sora, 'Sora', sans-serif)" }}
          >
            The Partner That Goes<br />Beyond Supply
          </h2>
        </div>

        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-start mb-12">
          {/* Left — numbered benefits */}
          <div className="space-y-8">
            {BENEFITS.map((b) => (
              <div key={b.num} className="flex items-start gap-5">
                <div
                  className="shrink-0 w-12 h-12 rounded-xl flex items-center justify-center font-extrabold text-sm border border-[#84CC16]/20 bg-[#0A0F1E] text-[#84CC16]"
                  style={{ fontFamily: "var(--font-sora, 'Sora', sans-serif)" }}
                >
                  {b.num}
                </div>
                <div>
                  <h3
                    className="font-bold text-lg text-[#0F172A] dark:text-[#F1F5F9] mb-1.5"
                    style={{ fontFamily: "var(--font-sora, 'Sora', sans-serif)" }}
                  >
                    {b.title}
                  </h3>
                  <p className="text-sm text-[#64748B] dark:text-[#94A3B8] leading-relaxed">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Right — award cards with images */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-6 h-[2px] rounded-full bg-[#84CC16]" />
              <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#84CC16]">
                Awards & Recognitions
              </span>
            </div>
            <p className="text-[#64748B] dark:text-[#94A3B8] text-sm leading-relaxed mb-6">
              Our consistent commitment to innovation, partnership, and excellence has been recognized
              through multiple industry awards from Schneider Electric.
            </p>

            {/* Award images grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
              {AWARDS.map((award) => (
                <div
                  key={award.title}
                  className="bg-white flex sm:flex-col dark:bg-[#111827] rounded-xl border border-[#E2E8F0] dark:border-white/10 overflow-hidden hover:shadow-lg transition-all duration-200"
                >
                  <div className="overflow-hidden bg-[#F8FAFC] dark:bg-[#0A0F1E]">
                    <img
                      src={award.img}
                      alt={award.title}
                      className="w-full h-full object-contain p-2"
                      loading="lazy"
                      style={{ maxHeight: "150px" }}
                    />
                  </div>
                  <div className="p-3 border-t border-[#E2E8F0] dark:border-white/10">
                    <p className="text-xs font-bold text-[#0F172A] dark:text-[#F1F5F9] leading-tight">{award.title}</p>
                    <p className="text-[10px] text-[#84CC16] font-semibold mt-0.5">{award.org}</p>
                    <p className="text-[10px] text-[#94A3B8] mt-0.5">{award.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Callout strip */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-6 rounded-2xl border-2 border-[#84CC16]/25 bg-[#84CC16]/[0.04]">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
            style={{ background: "rgba(132,204,22,0.15)" }}
          >
            <svg
              className="w-5 h-5 text-[#84CC16]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-[#0F172A] dark:text-[#F1F5F9] text-base font-medium leading-relaxed flex-1">
            Honored by Schneider Electric for exceptional partnership and performance — a reflection
            of our team&apos;s dedication and{" "}
            <strong>the trust of our clients across West Africa.</strong>
          </p>
          <Link
            href="/company"
            className="shrink-0 inline-flex items-center gap-1.5 text-sm font-bold text-[#84CC16] hover:text-[#65A30D] transition-colors"
          >
            Learn About Us →
          </Link>
        </div>
      </div>
    </section>
  );
}
