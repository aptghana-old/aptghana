import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/navigation/Header";
import Footer from "@/components/navigation/Footer";
import { SITE_URL, EMAIL_PRIVACY, SITE_DOMAIN, STORE_DOMAIN } from "@apt/config";

export const revalidate = 3600;

interface Section { heading: string; body: string }

interface PrivacyData {
  title: string;
  tagline: string;
  lastUpdated: string;
  intro: string;
  sections: Section[];
  contactBlockName: string;
  contactBlockEmail: string;
  contactBlockAddress: string;
  contactBlockFootnote: string;
  metaTitle: string;
  metaDescription: string;
}

const STATIC: PrivacyData = {
  title: "Privacy Policy",
  tagline: "Legal",
  lastUpdated: "1 June 2025",
  intro: `APT Ghana Limited (\"APT Ghana\", \"we\", \"us\", or \"our\") is committed to protecting the personal information of individuals who interact with our business. This Privacy Policy explains what data we collect, why we collect it, how we use it, and the rights available to you. It applies to our website at ${SITE_DOMAIN}, our online store at ${STORE_DOMAIN}, and all other digital and offline interactions you have with us.\n\nWe operate in compliance with Ghana's Data Protection Act 2012 (Act 843) and are registered with the Data Protection Commission of Ghana.`,
  sections: [
    { heading: "1. Data We Collect", body: "We collect Identity Data, Contact Data, Transaction Data, Technical Data, Usage Data, and Communications Data. We do not collect special categories of personal data." },
    { heading: "2. How We Use Your Information", body: "We use your data to process orders, respond to enquiries, send marketing (with consent), improve our services, comply with legal obligations, and detect fraud." },
    { heading: "3. Third Parties & Disclosure", body: "We share data only with service providers, brand partners (on request), logistics partners, professional advisers, and regulatory authorities where required by law." },
    { heading: "4. Data Security", body: "We use TLS encryption, access controls, regular security assessments, and data retention policies to protect your information." },
    { heading: "5. Your Rights", body: "Under Ghana's Data Protection Act 2012, you have rights of access, rectification, erasure, objection, consent withdrawal, and to complain to the Data Protection Commission." },
    { heading: "6. Cookies", body: "Our websites use strictly necessary, analytical, and marketing cookies. You can manage preferences through your browser settings at any time." },
  ],
  contactBlockName: "Data Protection Officer, APT Ghana Limited",
  contactBlockEmail: EMAIL_PRIVACY,
  contactBlockAddress: "North Industrial Area, Plot 7 Block 5, Dadeban Street, Accra, Ghana",
  contactBlockFootnote: "This policy was last updated on 1 June 2025. APT Ghana reserves the right to update this policy at any time.",
  metaTitle: "Privacy Policy | APT Ghana",
  metaDescription: "APT Ghana's privacy policy explains how we collect, use, and protect your personal information in accordance with Ghana's Data Protection Act 2012 (Act 843).",
};

async function getData(): Promise<PrivacyData> {
  const { getSitePageData } = await import("@apt/db");
  return getSitePageData("privacy", STATIC);
}

export async function generateMetadata(): Promise<Metadata> {
  const data = await getData();
  return {
    title: data.metaTitle,
    description: data.metaDescription,
    openGraph: { title: data.metaTitle, url: `${SITE_URL}/privacy` },
    alternates: { canonical: `${SITE_URL}/privacy` },
  };
}

function renderBody(text: string) {
  const paragraphs = text.split(/\n\n+/);
  return paragraphs.map((para, i) => {
    if (para.startsWith("•") || para.includes("\n•")) {
      const lines = para.split("\n").filter(Boolean);
      return (
        <ul key={i} className="space-y-3 mt-3">
          {lines.map((line, j) => (
            <li key={j} className="flex items-start gap-3 text-sm text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
              <span className="shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-[#84CC16]" />
              <span>{line.replace(/^•\s*/, "")}</span>
            </li>
          ))}
        </ul>
      );
    }
    return (
      <p key={i} className="text-[#64748B] dark:text-[#94A3B8] text-base leading-relaxed mt-3 first:mt-0">
        {para}
      </p>
    );
  });
}

export default async function PrivacyPage() {
  const data = await getData();

  return (
    <>
      <Header />
      <main>
        {/* Hero */}
        <section className="bg-[#F8FAFC] dark:bg-[#0A0F1E] pt-20 pb-16">
          <div className="container-apt max-w-3xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-6 h-0.5 rounded-full bg-[#84CC16]" />
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
              {data.intro && <div>{renderBody(data.intro)}</div>}

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

              {/* DPO contact block */}
              {(data.contactBlockName || data.contactBlockEmail) && (
                <div className="bg-[#0A0F1E] rounded-2xl p-8 text-white">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-6 h-0.5 rounded-full bg-[#84CC16]" />
                    <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#84CC16]">
                      Contact Our DPO
                    </span>
                  </div>
                  <h2 className="text-2xl font-extrabold text-white mb-3" style={{ fontFamily: "var(--font-sora, 'Sora', sans-serif)" }}>
                    Data Protection Officer
                  </h2>
                  <p className="text-white/60 text-sm leading-relaxed mb-6">
                    For all data protection enquiries, rights requests, or privacy concerns, please contact our Data Protection Officer:
                  </p>
                  <div className="space-y-3 text-sm">
                    {data.contactBlockName && (
                      <div>
                        <span className="text-white/40 text-xs uppercase tracking-widest block mb-0.5">Name</span>
                        <span className="text-white">{data.contactBlockName}</span>
                      </div>
                    )}
                    {data.contactBlockEmail && (
                      <div>
                        <span className="text-white/40 text-xs uppercase tracking-widest block mb-0.5">Email</span>
                        <a href={`mailto:${data.contactBlockEmail}`} className="text-[#84CC16] hover:underline">
                          {data.contactBlockEmail}
                        </a>
                      </div>
                    )}
                    {data.contactBlockAddress && (
                      <div>
                        <span className="text-white/40 text-xs uppercase tracking-widest block mb-0.5">Address</span>
                        <span className="text-white/70">{data.contactBlockAddress}</span>
                      </div>
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
              <Link href="/terms" className="text-[#84CC16] hover:underline">Terms of Service →</Link>
              <Link href="/contact" className="text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white">Contact Us</Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
