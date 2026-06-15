import Link from "next/link";
import { EMAIL_SALES } from "@apt/config";

const CONTACT_CARDS = [
  {
    title: "Visit Us",
    value: "North Industrial Area, Plot 7 Block 5, Dadeban Street, Accra",
    href: "https://maps.app.goo.gl/LMRsubkr2LvArW1E6",
    action: "Get Directions",
    external: true,
    Icon: MapPinIcon,
  },
  {
    title: "Email Us",
    value: EMAIL_SALES,
    href: `mailto:${EMAIL_SALES}`,
    action: "Send Email",
    external: false,
    Icon: EmailIcon,
  },
  {
    title: "Call Us",
    value: "+233 30 396 4346",
    href: "tel:+233303964346",
    action: "Call Now",
    external: false,
    Icon: PhoneIcon,
  },
];

export default function ContactSection() {
  return (
    <section className="section-py bg-white dark:bg-[#0A0F1E] border-t border-[#E2E8F0] dark:border-white/10">
      <div className="container-apt">
        {/* Header */}
        <div className="max-w-2xl mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-6 h-[2px] rounded-full bg-[#84CC16]" />
            <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#84CC16]">
              Contact
            </span>
          </div>
          <h2
            className="text-4xl lg:text-5xl font-extrabold tracking-tight text-[#0F172A] dark:text-[#F1F5F9] mb-4"
            style={{ fontFamily: "var(--font-sora, 'Sora', sans-serif)" }}
          >
            Get in Touch
          </h2>
          <p className="text-lg leading-relaxed text-[#64748B] dark:text-[#94A3B8]">
            Whether you need product specifications, bulk procurement, or technical consultation — our team is ready to help.
          </p>
        </div>

        {/* Contact cards */}
        <div className="grid sm:grid-cols-3 gap-5 mb-10">
          {CONTACT_CARDS.map((card) => (
            <a
              key={card.title}
              href={card.href}
              target={card.external ? "_blank" : undefined}
              rel={card.external ? "noopener noreferrer" : undefined}
              className="group flex flex-col p-7 bg-white dark:bg-[#111827] rounded-2xl border border-[#E2E8F0] dark:border-white/10 hover:border-[#84CC16]/40 hover:shadow-xl transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-[#84CC16]/10 flex items-center justify-center mb-5 group-hover:bg-[#84CC16]/20 transition-colors">
                <card.Icon />
              </div>
              <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest mb-2">
                {card.title}
              </p>
              <p className="font-semibold text-[#0F172A] dark:text-[#F1F5F9] text-base leading-snug mb-4 flex-1">
                {card.value}
              </p>
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#84CC16] group-hover:gap-2.5 transition-all">
                {card.action}
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </span>
            </a>
          ))}
        </div>

        {/* CTA banner */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 p-7 sm:p-8 rounded-2xl bg-[#0A0F1E]">
          <div>
            <h3
              className="text-white text-xl font-bold mb-1"
              style={{ fontFamily: "var(--font-sora, 'Sora', sans-serif)" }}
            >
              Ready to start a project?
            </h3>
            <p className="text-white/40 text-sm">Our sales engineers respond within 4 business hours.</p>
          </div>
          <Link
            href="/contact"
            className="shrink-0 inline-flex items-center gap-2 h-12 px-8 bg-[#84CC16] text-[#0A0F1E] font-bold text-sm rounded-xl hover:bg-[#78B800] transition-colors"
          >
            Request a Quote
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}

function MapPinIcon() {
  return (
    <svg className="w-6 h-6 text-[#84CC16]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
    </svg>
  );
}

function EmailIcon() {
  return (
    <svg className="w-6 h-6 text-[#84CC16]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg className="w-6 h-6 text-[#84CC16]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
    </svg>
  );
}
