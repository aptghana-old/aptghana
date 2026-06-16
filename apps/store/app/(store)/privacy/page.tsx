import type { Metadata } from "next";
import Link from "next/link";
import { STORE_DOMAIN, EMAIL_PRIVACY, CONTACT_PHONE, CONTACT_PHONE_HREF } from "@apt/config";

export const revalidate = 3600;

interface Section { heading: string; body: string }

interface PrivacyData {
  title: string;
  lastUpdated: string;
  intro: string;
  sections: Section[];
  contactBlockName: string;
  contactBlockEmail: string;
  contactBlockAddress: string;
  metaTitle: string;
  metaDescription: string;
}

const STATIC: PrivacyData = {
  title: "Privacy Policy",
  lastUpdated: "1 June 2025",
  intro: `APT Ghana Limited ("APT Ghana", "we", "us", or "our") operates ${STORE_DOMAIN} and related digital services. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or use our services.`,
  sections: [
    { heading: "1. Information We Collect", body: "Information you provide directly: When you submit a Request for Quotation, create an account, contact us, or subscribe to our newsletter, we collect your name, business name, email address, phone number, delivery address, and the content of your enquiry.\n\nInformation collected automatically: When you visit our website, we automatically collect technical information including your IP address, browser type, operating system, pages visited, time and date of visits, and referring URLs. We use this information for analytics and website improvement." },
    { heading: "2. How We Use Your Information", body: "•To process and respond to RFQs and sales enquiries\n•To send you quotations, invoices, and order confirmations\n•To provide technical support and after-sales service\n•To send marketing communications where you have consented\n•To improve our website and services through analytics\n•To comply with legal and regulatory obligations" },
    { heading: "3. Sharing Your Information", body: "We do not sell your personal information to third parties. We may share your information with our logistics and delivery partners to fulfil orders, with IT service providers who support our operations, and with legal or regulatory authorities where required by law." },
    { heading: "4. Cookies", body: "We use cookies and similar tracking technologies to operate our website, understand how it is used, and improve your experience. Essential cookies are required for the website to function. Analytics cookies help us understand traffic patterns. You can control non-essential cookies through your browser settings." },
    { heading: "5. Data Security", body: "We implement appropriate technical and organisational measures to protect your personal information against unauthorised access, alteration, disclosure, or destruction. All data is transmitted over HTTPS. We retain your information only for as long as necessary to fulfil the purposes described in this policy or as required by law." },
    { heading: "6. Your Rights", body: "Subject to applicable law, you have the right to access, correct, or delete your personal information, to object to or restrict its processing, and to withdraw consent where processing is based on consent. To exercise these rights, contact us using the details below." },
  ],
  contactBlockName: "APT Ghana Limited",
  contactBlockEmail: EMAIL_PRIVACY,
  contactBlockAddress: "Airport City, Accra, Ghana",
  metaTitle: "Privacy Policy | APT Ghana",
  metaDescription: "How APT Ghana collects, uses, and protects your personal information when you use our website and services.",
};

async function getData(): Promise<PrivacyData> {
  const { getSitePageData } = await import("@apt/db");
  return getSitePageData("privacy", STATIC);
}

export async function generateMetadata(): Promise<Metadata> {
  const data = await getData();
  return { title: data.metaTitle, description: data.metaDescription };
}

function renderBody(text: string) {
  return text.split(/\n\n+/).map((para, i) => {
    if (para.startsWith("•") || para.includes("\n•")) {
      const lines = para.split("\n").filter(Boolean);
      return (
        <ul key={i} className="text-[#6b7280] space-y-1.5">
          {lines.map((line, j) => <li key={j}>{line.replace(/^•/, "")}</li>)}
        </ul>
      );
    }
    return <p key={i} className="text-[#6b7280] mt-3 first:mt-0">{para}</p>;
  });
}

export default async function PrivacyPage() {
  const data = await getData();

  return (
    <>      <main className="min-h-screen bg-[#f9fafb]">
      <div className="bg-[#0a1628] py-12">
        <div className="container-store">
          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">{data.title}</h1>
          <p className="text-white/40 mt-2 text-sm">Last updated: {data.lastUpdated}</p>
        </div>
      </div>

      <div className="container-store py-10">
        <div className="grid lg:grid-cols-[220px_1fr] gap-8 items-start">
          {/* Navigation */}
          <nav className="hidden lg:block sticky top-6 bg-white rounded-2xl border border-[#e5e7eb] p-4">
            <p className="text-xs font-bold text-[#0a1628] uppercase tracking-widest mb-3">Contents</p>
            <ul className="space-y-1">
              {data.sections.map((s) => (
                <li key={s.heading}>
                  <a href={`#${s.heading.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`} className="text-xs text-[#6b7280] hover:text-[#0057b8] transition-colors block py-1">
                    {s.heading}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Content */}
          <div className="bg-white rounded-2xl border border-[#e5e7eb] p-7 sm:p-10 prose prose-sm max-w-none">
            <p className="text-[#6b7280] leading-relaxed">{data.intro}</p>

            {data.sections.map((s) => (
              <div key={s.heading}>
                <h2 id={s.heading.toLowerCase().replace(/[^a-z0-9]+/g, "-")} className="text-[#0a1628] font-bold mt-8 mb-3">{s.heading}</h2>
                {renderBody(s.body)}
              </div>
            ))}

            <h2 className="text-[#0a1628] font-bold mt-8 mb-3">Contact Us</h2>
            <p className="text-[#6b7280]">For privacy enquiries or to exercise your rights, contact us at:</p>
            <address className="text-[#374151] not-italic mt-2 space-y-0.5 text-sm">
              <p><strong>{data.contactBlockName}</strong></p>
              <p>{data.contactBlockAddress}</p>
              <p>Email: <a href={`mailto:${data.contactBlockEmail}`} className="text-[#0057b8] hover:text-[#1a73e8]">{data.contactBlockEmail}</a></p>
              <p>Phone: <a href={CONTACT_PHONE_HREF} className="text-[#0057b8] hover:text-[#1a73e8]">{CONTACT_PHONE}</a></p>
            </address>

            <div className="mt-10 pt-6 border-t border-[#e5e7eb] flex flex-wrap gap-3">
              <Link href="/terms" className="text-sm text-[#0057b8] hover:text-[#1a73e8] font-medium transition-colors">Terms of Service →</Link>
              <Link href="/contact" className="text-sm text-[#0057b8] hover:text-[#1a73e8] font-medium transition-colors">Contact Us →</Link>
            </div>
          </div>
        </div>
      </div>
    </main>    </>
  );
}
