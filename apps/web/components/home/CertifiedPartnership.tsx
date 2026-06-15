import Link from "next/link";
import { STORE_URL } from "@apt/config";

export default function CertifiedPartnership() {
  return (
    <section className="section-py bg-[#F8FAFC] dark:bg-[#0D1526]">
      <div className="container-apt">
        <div className="grid lg:grid-cols-2 gap-14 lg:gap-20 items-center">
          {/* Left: Certificate visual */}
          <div className="relative order-2 lg:order-1">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl">
              <img
                src="/images/APT_SE-general-distributor.-certificate.jpg"
                alt="Schneider Electric Partnership — APT Ghana Authorized Distributor"
                className="w-full object-cover"
                loading="lazy"
                style={{ minHeight: "400px", maxHeight: "500px" }}
              />
              {/* Dark overlay with text */}
              <div
                className="absolute inset-0 flex flex-col justify-end p-6"
                style={{ background: "linear-gradient(to top, rgba(10,15,30,0.9) 0%, rgba(10,15,30,0.4) 60%, transparent 100%)" }}
              >
                <div
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border mb-3 w-fit"
                  style={{ borderColor: "rgba(132,204,22,0.4)", background: "rgba(132,204,22,0.15)" }}
                >
                  <svg className="w-3.5 h-3.5 text-[#84CC16]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-[#84CC16] text-[11px] font-bold uppercase tracking-widest">Verified Partner</span>
                </div>
                <p className="text-white font-bold text-xl leading-tight" style={{ fontFamily: "var(--font-sora, 'Sora', sans-serif)" }}>
                  Schneider Electric<br />Electrical Distributor
                </p>
                <p className="text-white/50 text-xs mt-1">West Africa · Since 2009</p>
              </div>
            </div>
          </div>

          {/* Right: content */}
          <div className="order-1 lg:order-2">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-[3px] rounded-full bg-[#84CC16]" />
              <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#84CC16]">
                Certified Partnership
              </span>
            </div>

            <h2
              className="text-4xl lg:text-[2.75rem] font-extrabold tracking-tight leading-[1.1] text-[#0F172A] dark:text-[#F1F5F9] mb-4"
              style={{ fontFamily: "var(--font-sora, 'Sora', sans-serif)" }}
            >
              Official Schneider Electric Electrical Distributor
            </h2>

            <p className="text-[#65A30D] text-lg italic font-semibold mb-5">
              Authorized for the full Schneider Electric product portfolio
            </p>

            <p className="text-[#4B5563] dark:text-[#9CA3AF] text-base lg:text-lg leading-relaxed mb-5">
              As an officially certified <strong>Schneider Electric Electrical Distributor</strong>, APT Ghana delivers reliable, energy-efficient electrical products and industrial automation solutions.
            </p>

            <p className="text-[#4B5563] dark:text-[#9CA3AF] text-base lg:text-lg leading-relaxed mb-8">
              Our partnership ensures access to innovative technologies, expert support, and tailored solutions that meet global standards.
            </p>

            {/* Trust statement */}
            <div
              className="p-5 rounded-2xl border-l-4 mb-8 bg-white dark:bg-[#111827]"
              style={{ borderLeftColor: "#84CC16", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}
            >
              <p className="font-semibold text-[#0F172A] dark:text-[#F1F5F9] leading-snug mb-1">
                Trusted by industry leaders across West Africa.
              </p>
              <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">
                Backed by Schneider Electric&apos;s global reputation and APT&apos;s proven local expertise.
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              <Link
                href={`${STORE_URL}/brands/schneider-electric`}
                className="inline-flex items-center gap-2 h-12 px-7 bg-[#84CC16] text-[#0A0F1E] font-bold text-sm rounded-xl hover:bg-[#78B800] transition-colors"
              >
                Shop Schneider Products
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              <Link
                href="/company/partnerships"
                className="inline-flex items-center gap-2 h-12 px-7 border-2 border-[#0A0F1E] dark:border-white/20 text-[#0F172A] dark:text-white font-bold text-sm rounded-xl hover:bg-[#0A0F1E] hover:text-white transition-all"
              >
                Our Partnerships
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
