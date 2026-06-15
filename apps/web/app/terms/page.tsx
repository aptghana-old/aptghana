import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/navigation/Header";
import Footer from "@/components/navigation/Footer";
import { SITE_URL, EMAIL_SALES } from "@apt/config";

export const revalidate = 3600;

interface Section { heading: string; body: string }

interface TermsData {
  title:        string;
  tagline:      string;
  lastUpdated:  string;
  intro:        string;
  sections:     Section[];
  contactBlockName:     string;
  contactBlockEmail:    string;
  contactBlockAddress:  string;
  contactBlockFootnote: string;
  metaTitle:       string;
  metaDescription: string;
}

const STATIC: TermsData = {
  title:       "Terms of Service",
  tagline:     "Legal",
  lastUpdated: "1 June 2025",
  intro: "These Terms of Service (\"Terms\") govern the supply of products and engineering services by APT Ghana Limited (\"APT Ghana\") to customers. By placing an order or entering into any business relationship with APT Ghana, you agree to be bound by these Terms.",
  sections: [
    { heading: "1. Acceptance of Terms",   body: "By submitting a purchase order or proceeding with a transaction, you confirm you are authorised to enter contracts, are at least 18 years of age, and have read and agreed to these Terms." },
    { heading: "2. Products & Pricing",    body: "Product descriptions are provided for informational purposes. Prices are in GHS or USD, exclusive of VAT. Quotations are valid for 30 days." },
    { heading: "3. Payment Terms",         body: "Payment is due within 30 days of invoice for approved credit customers. New customers pay in full prior to despatch. Late balances accrue 2% interest per month." },
    { heading: "4. Delivery",              body: "Stocked items are dispatched within 2–3 business days. Non-stocked items are subject to lead times quoted individually." },
    { heading: "5. Returns & Warranty",    body: "Stocked items may be returned within 14 days in original unopened packaging. A 15% restocking fee applies. Special-order items are non-returnable unless defective." },
    { heading: "6. Limitation of Liability", body: "APT Ghana's total liability shall not exceed the purchase price of the relevant goods. We are not liable for indirect, consequential, or punitive losses." },
    { heading: "7. Governing Law",         body: "These Terms are governed by the laws of the Republic of Ghana. Disputes shall be resolved in the courts of Ghana, with mediation attempted first." },
  ],
  contactBlockName:     "APT Ghana Limited",
  contactBlockEmail:    EMAIL_SALES,
  contactBlockAddress:  "North Industrial Area, Plot 7 Block 5, Dadeban Street, Accra, Ghana",
  contactBlockFootnote: "These Terms were last updated on 1 June 2025. APT Ghana reserves the right to update these Terms at any time.",
  metaTitle:       "Terms of Service | APT Ghana",
  metaDescription: "APT Ghana Limited's terms and conditions governing the supply of industrial products and engineering services. Policies on pricing, payment, delivery, returns, and warranty.",
};

async function getData(): Promise<TermsData> {
  try {
    const { connectDB, SitePageModel } = await import("@apt/db");
    await connectDB();
    const doc = await SitePageModel.findOne({ slug: "terms", status: "published" }).lean() as Record<string, unknown> | null;
    if (!doc) return STATIC;
    return {
      title:        ((doc.title        ?? STATIC.title)        as string),
      tagline:      ((doc.tagline      ?? STATIC.tagline)      as string),
      lastUpdated:  ((doc.lastUpdated  ?? STATIC.lastUpdated)  as string),
      intro:        ((doc.intro        ?? STATIC.intro)        as string),
      sections:     (Array.isArray(doc.sections) && doc.sections.length > 0
        ? (doc.sections as { heading?: string; body?: string }[]).map((s) => ({ heading: s.heading ?? "", body: s.body ?? "" }))
        : STATIC.sections),
      contactBlockName:     ((doc.contactBlockName     ?? STATIC.contactBlockName)     as string),
      contactBlockEmail:    ((doc.contactBlockEmail    ?? STATIC.contactBlockEmail)    as string),
      contactBlockAddress:  ((doc.contactBlockAddress  ?? STATIC.contactBlockAddress)  as string),
      contactBlockFootnote: ((doc.contactBlockFootnote ?? STATIC.contactBlockFootnote) as string),
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
    openGraph:   { title: data.metaTitle, url: `${SITE_URL}/terms` },
    alternates:  { canonical: `${SITE_URL}/terms` },
  };
}

function renderBody(text: string) {
  const paragraphs = text.split(/\n\n+/);
  return paragraphs.map((para, i) => {
    if (para.startsWith("•") || para.includes("\n•")) {
      const lines = para.split("\n").filter(Boolean);
      return (
        <ul key={i} className="space-y-2 mt-3">
          {lines.map((line, j) => (
            <li key={j} className="flex items-start gap-3 text-sm text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
              <span className="shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-[#84CC16]" />
              <span>{line.replace(/^•\s*/, "")}</span>
            </li>
          ))}
        </ul>
      );
    }
    const parts = para.split(/(\*\*[^*]+\*\*)/).filter(Boolean);
    return (
      <p key={i} className="text-[#64748B] dark:text-[#94A3B8] text-sm leading-relaxed mt-3 first:mt-0">
        {parts.map((part, j) =>
          part.startsWith("**") && part.endsWith("**")
            ? <strong key={j} className="text-[#0F172A] dark:text-[#F1F5F9]">{part.slice(2, -2)}</strong>
            : <span key={j}>{part}</span>
        )}
      </p>
    );
  });
}

export default async function TermsPage() {
  const data = await getData();

  return (
    <>
      <Header />
      <main>
        {/* Hero */}
        <section className="bg-[#F8FAFC] dark:bg-[#0A0F1E] pt-32 pb-16">
          <div className="container-apt max-w-3xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-6 h-[2px] rounded-full bg-[#84CC16]" />
              <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#84CC16]">
                {data.tagline}
              </span>
            </div>
            <h1
              className="text-4xl lg:text-5xl font-extrabold tracking-tight text-[#0F172A] dark:text-white mb-4"
              style={{ fontFamily: "var(--font-sora, 'Sora', sans-serif)" }}
            >
              {data.title}
            </h1>
            {data.lastUpdated && (
              <p className="text-[#64748B] text-sm">Last updated: {data.lastUpdated}</p>
            )}
          </div>
        </section>

        {/* Content */}
        <section className="section-py bg-white dark:bg-[#0A0F1E]">
          <div className="container-apt max-w-3xl">
            <div className="space-y-12">

              {/* Intro */}
              {data.intro && (
                <div>
                  {data.intro.split(/\n\n+/).map((p, i) => (
                    <p key={i} className="text-[#64748B] dark:text-[#94A3B8] text-base leading-relaxed mt-4 first:mt-0">
                      {p}
                    </p>
                  ))}
                </div>
              )}

              {/* Sections */}
              {data.sections.map((sec) => (
                <div key={sec.heading}>
                  <h2
                    className="text-2xl font-extrabold text-[#0F172A] dark:text-[#F1F5F9] mb-4"
                    style={{ fontFamily: "var(--font-sora, 'Sora', sans-serif)" }}
                  >
                    {sec.heading}
                  </h2>
                  {renderBody(sec.body)}
                </div>
              ))}

              {/* Contact / governing law block */}
              {(data.contactBlockName || data.contactBlockFootnote) && (
                <div className="bg-[#0A0F1E] rounded-2xl p-8 text-white">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-6 h-[2px] rounded-full bg-[#84CC16]" />
                    <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#84CC16]">
                      Contact
                    </span>
                  </div>
                  <div className="space-y-2 text-sm text-white/70">
                    {data.contactBlockName    && <p className="font-semibold text-white">{data.contactBlockName}</p>}
                    {data.contactBlockAddress && <p>{data.contactBlockAddress}</p>}
                    {data.contactBlockEmail   && (
                      <p>Email: <a href={`mailto:${data.contactBlockEmail}`} className="text-[#84CC16] hover:underline">{data.contactBlockEmail}</a></p>
                    )}
                  </div>
                  {data.contactBlockFootnote && (
                    <div className="mt-6 pt-5 border-t border-white/10 text-xs text-white/40">
                      {data.contactBlockFootnote}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="mt-10 flex gap-4 text-sm">
              <Link href="/privacy" className="text-[#84CC16] hover:underline">Privacy Policy →</Link>
              <Link href="/contact" className="text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white">Contact Us</Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
