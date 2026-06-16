import type { Metadata } from "next";
import Link from "next/link";
import { STORE_DOMAIN } from "@apt/config";

export const revalidate = 3600;

interface Section { heading: string; body: string }

interface TermsData {
  title: string;
  lastUpdated: string;
  intro: string;
  sections: Section[];
  metaTitle: string;
  metaDescription: string;
}

const STATIC: TermsData = {
  title: "Terms of Service",
  lastUpdated: "1 June 2025",
  intro: `These Terms of Service ("Terms") govern your use of ${STORE_DOMAIN} and all services provided by APT Ghana Limited ("APT Ghana", "we", "us"). By accessing our website or placing an order, you agree to these Terms.`,
  sections: [
    { heading: "1. Acceptance of Terms", body: "By using our website or services, you confirm that you are at least 18 years of age, acting on behalf of a duly registered business or organisation, and authorised to enter into commercial agreements on behalf of that entity." },
    { heading: "2. Use of Website", body: "You agree to use this website only for lawful purposes. You must not use the website to transmit unsolicited communications, attempt to gain unauthorised access to any systems, or misrepresent your identity or affiliation. We reserve the right to restrict access to any user who violates these conditions." },
    { heading: "3. Orders & Quotations", body: "All RFQs and purchase enquiries are subject to acceptance by APT Ghana. A binding order is created only upon receipt and acceptance of a written purchase order or confirmed proforma invoice. Quoted prices are valid for 30 days unless otherwise stated. Availability is subject to change without notice." },
    { heading: "4. Pricing & Payment", body: "All prices on the website are indicative and exclude VAT unless stated otherwise. Final pricing is confirmed on the proforma invoice. Payment terms are as specified on the invoice. APT Ghana reserves the right to withhold delivery until payment is received in full. We accept bank transfer, mobile money, and other payment methods as stated on the invoice." },
    { heading: "5. Delivery", body: "Delivery timelines are estimates and are subject to stock availability and logistics. APT Ghana is not liable for delays caused by circumstances beyond our reasonable control. Risk of loss passes to the buyer upon delivery to the agreed delivery point. Goods must be inspected upon receipt; any damage or shortages must be reported within 48 hours." },
    { heading: "6. Returns & Warranty", body: "All products carry the manufacturer's standard warranty. Warranty claims must be submitted through APT Ghana and are subject to the manufacturer's terms and conditions. Returns of non-defective items are accepted within 14 days of delivery, subject to a restocking fee, provided goods are in original, unopened condition. Custom-ordered or specially imported items are non-returnable." },
    { heading: "7. Limitation of Liability", body: "To the maximum extent permitted by Ghanaian law, APT Ghana's liability for any claim arising from these Terms shall not exceed the value of the goods or services giving rise to the claim. We are not liable for indirect, consequential, or incidental losses, including loss of profit or production downtime." },
    { heading: "8. Governing Law", body: "These Terms are governed by the laws of the Republic of Ghana. Any disputes shall be subject to the exclusive jurisdiction of the courts of Ghana." },
  ],
  metaTitle: "Terms of Service | APT Ghana",
  metaDescription: "Terms and conditions governing the use of APT Ghana's website and purchasing services.",
};

async function getData(): Promise<TermsData> {
  const { getSitePageData } = await import("@apt/db");
  return getSitePageData("terms", STATIC);
}

export async function generateMetadata(): Promise<Metadata> {
  const data = await getData();
  return { title: data.metaTitle, description: data.metaDescription };
}

export default async function TermsPage() {
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
          {/* Nav */}
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

          <div className="bg-white rounded-2xl border border-[#e5e7eb] p-7 sm:p-10 prose prose-sm max-w-none">
            <p className="text-[#6b7280] leading-relaxed">{data.intro}</p>

            {data.sections.map((s) => (
              <div key={s.heading}>
                <h2 id={s.heading.toLowerCase().replace(/[^a-z0-9]+/g, "-")} className="text-[#0a1628] font-bold mt-8 mb-3">{s.heading}</h2>
                <p className="text-[#6b7280]">{s.body}</p>
              </div>
            ))}

            <div className="mt-10 pt-6 border-t border-[#e5e7eb] flex flex-wrap gap-3">
              <Link href="/privacy" className="text-sm text-[#0057b8] hover:text-[#1a73e8] font-medium transition-colors">Privacy Policy →</Link>
              <Link href="/contact" className="text-sm text-[#0057b8] hover:text-[#1a73e8] font-medium transition-colors">Contact Us →</Link>
            </div>
          </div>
        </div>
      </div>
    </main>    </>
  );
}
