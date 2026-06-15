import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL, STORE_URL, EMAIL_SALES } from "@apt/config";
import Header from "@/components/navigation/Header";
import Footer from "@/components/navigation/Footer";
import ContactForm from "./ContactForm";

export const revalidate = 3600;

interface OfficeHour { day: string; hours: string }

interface ContactData {
  title:        string;
  tagline:      string;
  description:  string;
  address:      string;
  phone:        string;
  email:        string;
  mapsUrl:      string;
  responseTime: string;
  officeHours:  OfficeHour[];
  metaTitle:       string;
  metaDescription: string;
}

const STATIC: ContactData = {
  title:       "Let's Work Together",
  tagline:     "Get In Touch",
  description: "Whether you need a product quote, technical assistance, or want to discuss an engineering project — APT Ghana's experts are ready to help.",
  address:     "North Industrial Area, Plot 7 Block 5, Dadeban Street, Accra, Ghana",
  phone:       "+233 30 396 4346",
  email:       EMAIL_SALES,
  mapsUrl:     "https://maps.google.com/?q=North+Industrial+Area+Accra+Ghana",
  responseTime:"We respond within 1 business day.",
  officeHours: [
    { day: "Monday – Friday", hours: "08:00 – 17:00" },
    { day: "Saturday",        hours: "09:00 – 13:00" },
    { day: "Sunday",          hours: "Closed" },
    { day: "Public Holidays", hours: "Closed" },
  ],
  metaTitle:       "Contact APT Ghana | Industrial Technology Experts",
  metaDescription: "Get in touch with APT Ghana's team of industrial technology experts. Request a product quote, technical support, or discuss your project requirements. Located in Accra, Ghana.",
};

async function getData(): Promise<ContactData> {
  try {
    const { connectDB, SitePageModel } = await import("@apt/db");
    await connectDB();
    const doc = await SitePageModel.findOne({ slug: "contact", status: "published" }).lean() as Record<string, unknown> | null;
    if (!doc) return STATIC;
    return {
      title:        ((doc.title        ?? STATIC.title)        as string),
      tagline:      ((doc.tagline      ?? STATIC.tagline)      as string),
      description:  ((doc.description  ?? STATIC.description)  as string),
      address:      ((doc.address      ?? STATIC.address)      as string),
      phone:        ((doc.phone        ?? STATIC.phone)        as string),
      email:        ((doc.email        ?? STATIC.email)        as string),
      mapsUrl:      ((doc.mapsUrl      ?? STATIC.mapsUrl)      as string),
      responseTime: ((doc.responseTime ?? STATIC.responseTime) as string),
      officeHours:  (Array.isArray(doc.officeHours) && doc.officeHours.length > 0
        ? (doc.officeHours as { day?: string; hours?: string }[]).map((h) => ({ day: h.day ?? "", hours: h.hours ?? "" }))
        : STATIC.officeHours),
      metaTitle:       ((doc.metaTitle       ?? STATIC.metaTitle)       as string),
      metaDescription: ((doc.metaDescription ?? STATIC.metaDescription) as string),
    };
  } catch {
    return STATIC;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const data = await getData();
  return {
    title:       data.metaTitle,
    description: data.metaDescription,
    openGraph: {
      title:       data.metaTitle,
      description: data.metaDescription,
      url:         `${SITE_URL}/contact`,
    },
    alternates: { canonical: `${SITE_URL}/contact` },
  };
}

export default async function ContactPage() {
  const data = await getData();

  const addressLines = data.address.split(",").map((s) => s.trim()).filter(Boolean);

  return (
    <>
      <Header />
      <main>
        {/* Hero */}
        <section className="bg-[#F8FAFC] dark:bg-[#0A0F1E] pt-32 pb-20">
          <div className="container-apt">
            <div className="max-w-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-6 h-[2px] rounded-full bg-[#84CC16]" />
                <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#84CC16]">
                  {data.tagline}
                </span>
              </div>
              <h1
                className="text-4xl lg:text-5xl font-extrabold tracking-tight text-[#0F172A] dark:text-white mb-6"
                style={{ fontFamily: "var(--font-sora, 'Sora', sans-serif)" }}
              >
                {data.title}
              </h1>
              {data.description && (
                <p className="text-[#64748B] dark:text-[#94A3B8] text-lg leading-relaxed max-w-xl">
                  {data.description}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Contact Cards */}
        <section className="bg-[#F8FAFC] dark:bg-[#0D1526] py-14">
          <div className="container-apt">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Visit */}
              <div className="bg-white dark:bg-[#111827] rounded-2xl border border-[#E2E8F0] dark:border-white/10 p-8 flex flex-col gap-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-[#84CC16]/10 border border-[#84CC16]/20">
                  <svg className="w-6 h-6 text-[#84CC16]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-[#0F172A] dark:text-[#F1F5F9] text-lg mb-1" style={{ fontFamily: "var(--font-sora, 'Sora', sans-serif)" }}>
                    Visit Our Office
                  </h3>
                  <p className="text-[#64748B] dark:text-[#94A3B8] text-sm leading-relaxed">
                    {addressLines.map((line, i) => (
                      <span key={i}>{line}{i < addressLines.length - 1 ? <br /> : null}</span>
                    ))}
                  </p>
                </div>
                {data.mapsUrl && (
                  <a
                    href={data.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-semibold text-[#84CC16] hover:underline mt-auto"
                  >
                    View on Google Maps →
                  </a>
                )}
              </div>

              {/* Email */}
              <div className="bg-white dark:bg-[#111827] rounded-2xl border border-[#E2E8F0] dark:border-white/10 p-8 flex flex-col gap-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-[#84CC16]/10 border border-[#84CC16]/20">
                  <svg className="w-6 h-6 text-[#84CC16]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-[#0F172A] dark:text-[#F1F5F9] text-lg mb-1" style={{ fontFamily: "var(--font-sora, 'Sora', sans-serif)" }}>
                    Email Us
                  </h3>
                  <p className="text-[#64748B] dark:text-[#94A3B8] text-sm leading-relaxed mb-2">
                    Sales & product enquiries:
                  </p>
                  {data.email && (
                    <a href={`mailto:${data.email}`} className="text-[#1E3A5F] dark:text-[#84CC16] font-semibold text-sm hover:underline">
                      {data.email}
                    </a>
                  )}
                </div>
                {data.responseTime && (
                  <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-auto">{data.responseTime}</p>
                )}
              </div>

              {/* Phone */}
              <div className="bg-white dark:bg-[#111827] rounded-2xl border border-[#E2E8F0] dark:border-white/10 p-8 flex flex-col gap-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-[#84CC16]/10 border border-[#84CC16]/20">
                  <svg className="w-6 h-6 text-[#84CC16]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-[#0F172A] dark:text-[#F1F5F9] text-lg mb-1" style={{ fontFamily: "var(--font-sora, 'Sora', sans-serif)" }}>
                    Call Us
                  </h3>
                  <p className="text-[#64748B] dark:text-[#94A3B8] text-sm leading-relaxed mb-2">
                    Main switchboard:
                  </p>
                  {data.phone && (
                    <a
                      href={`tel:${data.phone.replace(/\s/g, "")}`}
                      className="text-[#1E3A5F] dark:text-[#84CC16] font-semibold text-sm hover:underline"
                    >
                      {data.phone}
                    </a>
                  )}
                </div>
                {data.officeHours.length > 0 && (
                  <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-auto">
                    {data.officeHours[0].day}, {data.officeHours[0].hours} GMT
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Form + Hours + Map */}
        <section className="section-py bg-white dark:bg-[#0A0F1E]">
          <div className="container-apt">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
              {/* Form */}
              <div className="lg:col-span-3">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-6 h-[2px] rounded-full bg-[#84CC16]" />
                  <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#84CC16]">
                    Send A Message
                  </span>
                </div>
                <h2
                  className="text-3xl font-extrabold tracking-tight text-[#0F172A] dark:text-[#F1F5F9] mb-6"
                  style={{ fontFamily: "var(--font-sora, 'Sora', sans-serif)" }}
                >
                  How Can We Help?
                </h2>
                <ContactForm />
              </div>

              {/* Right col */}
              <div className="lg:col-span-2 flex flex-col gap-6">
                {/* Office Hours */}
                {data.officeHours.length > 0 && (
                  <div className="bg-[#0A0F1E] rounded-2xl p-8 text-white">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-6 h-[2px] rounded-full bg-[#84CC16]" />
                      <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#84CC16]">
                        Office Hours
                      </span>
                    </div>
                    <div className="space-y-3 text-sm">
                      {data.officeHours.map((h) => (
                        <div key={h.day} className="flex items-center justify-between">
                          <span className="text-white/60">{h.day}</span>
                          <span className={h.hours === "Closed" ? "text-white/40" : "font-semibold"}>
                            {h.hours}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-6 pt-5 border-t border-white/10 text-xs text-white/40">
                      All times are Ghana Mean Time (GMT+0). For urgent support outside office hours, email us and we will respond on the next business day.
                    </div>
                  </div>
                )}

                {/* Map Placeholder */}
                <div
                  className="rounded-2xl overflow-hidden border border-[#E2E8F0] dark:border-white/10 relative"
                  style={{ minHeight: "280px" }}
                >
                  <div className="absolute inset-0 bg-[#E8F0F8] dark:bg-[#111827] flex flex-col items-center justify-center gap-4">
                    <div className="flex items-center justify-center w-14 h-14 rounded-full bg-[#1E3A5F]/10 border-2 border-[#1E3A5F]/20">
                      <svg className="w-7 h-7 text-[#1E3A5F]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                      </svg>
                    </div>
                    <div className="text-center px-6">
                      <p className="font-semibold text-[#1E3A5F] dark:text-[#84CC16] text-sm mb-1">
                        {addressLines[0] ?? "APT Ghana"}
                      </p>
                      <p className="text-[#64748B] dark:text-[#94A3B8] text-xs">
                        {addressLines.slice(1).join(", ")}
                      </p>
                    </div>
                    {data.mapsUrl && (
                      <a
                        href={data.mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 h-9 px-5 bg-[#1E3A5F] text-white font-semibold text-xs rounded-lg hover:bg-[#16305e] transition-colors"
                      >
                        Open in Google Maps →
                      </a>
                    )}
                  </div>
                </div>

                {/* Store CTA */}
                <div className="bg-[#F8FAFC] dark:bg-[#111827] rounded-2xl border border-[#E2E8F0] dark:border-white/10 p-6">
                  <p className="text-sm font-semibold text-[#0F172A] dark:text-[#F1F5F9] mb-1">Prefer to shop online?</p>
                  <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mb-4">
                    Browse 6,000+ products on our e-commerce platform with real-time stock availability.
                  </p>
                  <Link
                    href={STORE_URL}
                    className="inline-flex items-center gap-2 h-10 px-5 bg-[#84CC16] text-[#0A0F1E] font-bold text-xs rounded-xl hover:bg-[#78B800] transition-colors"
                  >
                    Visit the Store →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
