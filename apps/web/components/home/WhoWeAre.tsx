import Link from "next/link";

export default function WhoWeAre() {
  return (
    <section className="section-py bg-white dark:bg-[#0A0F1E]">
      <div className="container-apt">
        <div className="grid lg:grid-cols-2 gap-14 lg:gap-20 items-center">
          {/* Left: content */}
          <div>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-[3px] rounded-full bg-[#84CC16]" />
              <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#84CC16]">
                Who We Are
              </span>
            </div>

            <h2
              className="text-4xl lg:text-[2.75rem] font-extrabold tracking-tight leading-[1.1] text-[#0F172A] dark:text-[#F1F5F9] mb-5"
              style={{ fontFamily: "var(--font-sora, 'Sora', sans-serif)" }}
            >
              Automation & Plant Technologies Limited
            </h2>

            <p className="text-[#475569] text-lg italic font-semibold mb-5 text-[#65A30D]">
              Ghana&apos;s Leading Industrial Technology Company
            </p>

            <p className="text-[#4B5563] dark:text-[#9CA3AF] text-base lg:text-lg leading-relaxed mb-5">
              Founded in 2009, APT Ghana has been serving the manufacturing, mining, quarries, and
              construction industries in Ghana and the West African region for over 15 years.
            </p>
            <p className="text-[#4B5563] dark:text-[#9CA3AF] text-base lg:text-lg leading-relaxed mb-8">
              Priding ourselves on being a fast-growing company, our founders have been actively
              involved in developing different aspects of the business and expanding our product range.
              We invest in training and developing our staff to acquire deep industry know-how and
              serve our customers with the utmost professionalism.
            </p>

            {/* 15+ years badge */}
            <div
              className="flex items-start gap-4 p-5 rounded-2xl border-l-4 mb-8 bg-[#F8FAFC] dark:bg-[#111827]"
              style={{ borderLeftColor: "#84CC16" }}
            >
              <div>
                <p className="text-xl font-extrabold text-[#0F172A] dark:text-[#F1F5F9] leading-none" style={{ fontFamily: "var(--font-sora, 'Sora', sans-serif)" }}>
                  15<span className="text-sm align-top">+</span> Years
                </p>
                <p className="text-xs uppercase tracking-widest text-[#64748B] dark:text-[#94A3B8] font-medium mt-1">
                  of Industry Experience
                </p>
              </div>
              <div className="pl-4 border-l border-[#E2E8F0] dark:border-white/10">
                <p className="text-sm text-[#4B5563] dark:text-[#9CA3AF] leading-relaxed">
                  Serving Ghana and West Africa&apos;s most demanding industrial sectors since 2009.
                </p>
              </div>
            </div>

            <Link
              href="/company/about"
              className="inline-flex items-center gap-2 h-12 px-7 bg-[#84CC16] text-[#0A0F1E] font-bold text-sm rounded-xl hover:bg-[#78B800] transition-colors"
            >
              Our Full Story
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>

          {/* Right: image */}
          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl">
              <img
                src="/images/innovation-center.jpg"
                alt="APT Ghana - Dedicated team and technical expertise"
                className="w-full h-full object-cover"
                loading="lazy"
                style={{ minHeight: "420px", maxHeight: "520px" }}
              />
              {/* Lime overlay stripe */}
              <div className="absolute bottom-0 inset-x-0 h-[3px] bg-[#84CC16]" />
            </div>

            {/* Floating stat card */}
            <div
              className="absolute -bottom-6 -left-6 lg:left-0 p-5 rounded-2xl border border-white/10 shadow-2xl"
              style={{
                background: "#0A0F1E",
                backdropFilter: "blur(16px)",
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: "rgba(132,204,22,0.15)" }}
                >
                  <svg className="w-5 h-5 text-[#84CC16]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                  </svg>
                </div>
                <div>
                  <p className="text-white text-sm font-bold">Schneider Electric</p>
                  <p className="text-white/40 text-[11px]">Official Certified Partner</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
