import type { Metadata } from "next";
import Link from "next/link";
import { STORE_DOMAIN, EMAIL_PRIVACY } from "@apt/config";

export const metadata: Metadata = {
  title: "Privacy Policy | APT Ghana",
  description: "How APT Ghana collects, uses, and protects your personal information when you use our website and services.",
};

const LAST_UPDATED = "1 June 2025";

export default function PrivacyPage() {
  return (
    <>      <main className="min-h-screen bg-[#f9fafb]">
      <div className="bg-[#0a1628] py-12">
        <div className="container-store">
          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">Privacy Policy</h1>
          <p className="text-white/40 mt-2 text-sm">Last updated: {LAST_UPDATED}</p>
        </div>
      </div>

      <div className="container-store py-10">
        <div className="grid lg:grid-cols-[220px_1fr] gap-8 items-start">
          {/* Navigation */}
          <nav className="hidden lg:block sticky top-6 bg-white rounded-2xl border border-[#e5e7eb] p-4">
            <p className="text-xs font-bold text-[#0a1628] uppercase tracking-widest mb-3">Contents</p>
            <ul className="space-y-1">
              {[ "Information We Collect", "How We Use Your Information", "Sharing Your Information", "Cookies", "Data Security", "Your Rights", "Contact Us" ].map((item) => (
                <li key={item}>
                  <a href={`#${item.toLowerCase().replace(/\s+/g, "-")}`} className="text-xs text-[#6b7280] hover:text-[#0057b8] transition-colors block py-1">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Content */}
          <div className="bg-white rounded-2xl border border-[#e5e7eb] p-7 sm:p-10 prose prose-sm max-w-none">
            <p className="text-[#6b7280] leading-relaxed">
              APT Ghana Limited (&quot;APT Ghana&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) operates <strong>{STORE_DOMAIN}</strong> and related digital services. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or use our services.
            </p>

            <h2 id="information-we-collect" className="text-[#0a1628] font-bold mt-8 mb-3">1. Information We Collect</h2>
            <p className="text-[#6b7280]"><strong className="text-[#374151]">Information you provide directly:</strong> When you submit a Request for Quotation, create an account, contact us, or subscribe to our newsletter, we collect your name, business name, email address, phone number, delivery address, and the content of your enquiry.</p>
            <p className="text-[#6b7280] mt-3"><strong className="text-[#374151]">Information collected automatically:</strong> When you visit our website, we automatically collect technical information including your IP address, browser type, operating system, pages visited, time and date of visits, and referring URLs. We use this information for analytics and website improvement.</p>

            <h2 id="how-we-use-your-information" className="text-[#0a1628] font-bold mt-8 mb-3">2. How We Use Your Information</h2>
            <ul className="text-[#6b7280] space-y-1.5">
              <li>To process and respond to RFQs and sales enquiries</li>
              <li>To send you quotations, invoices, and order confirmations</li>
              <li>To provide technical support and after-sales service</li>
              <li>To send marketing communications where you have consented</li>
              <li>To improve our website and services through analytics</li>
              <li>To comply with legal and regulatory obligations</li>
            </ul>

            <h2 id="sharing-your-information" className="text-[#0a1628] font-bold mt-8 mb-3">3. Sharing Your Information</h2>
            <p className="text-[#6b7280]">We do not sell your personal information to third parties. We may share your information with our logistics and delivery partners to fulfil orders, with IT service providers who support our operations, and with legal or regulatory authorities where required by law.</p>

            <h2 id="cookies" className="text-[#0a1628] font-bold mt-8 mb-3">4. Cookies</h2>
            <p className="text-[#6b7280]">We use cookies and similar tracking technologies to operate our website, understand how it is used, and improve your experience. Essential cookies are required for the website to function. Analytics cookies help us understand traffic patterns. You can control non-essential cookies through your browser settings.</p>

            <h2 id="data-security" className="text-[#0a1628] font-bold mt-8 mb-3">5. Data Security</h2>
            <p className="text-[#6b7280]">We implement appropriate technical and organisational measures to protect your personal information against unauthorised access, alteration, disclosure, or destruction. All data is transmitted over HTTPS. We retain your information only for as long as necessary to fulfil the purposes described in this policy or as required by law.</p>

            <h2 id="your-rights" className="text-[#0a1628] font-bold mt-8 mb-3">6. Your Rights</h2>
            <p className="text-[#6b7280]">Subject to applicable law, you have the right to access, correct, or delete your personal information, to object to or restrict its processing, and to withdraw consent where processing is based on consent. To exercise these rights, contact us using the details below.</p>

            <h2 id="contact-us" className="text-[#0a1628] font-bold mt-8 mb-3">7. Contact Us</h2>
            <p className="text-[#6b7280]">For privacy enquiries or to exercise your rights, contact us at:</p>
            <address className="text-[#374151] not-italic mt-2 space-y-0.5 text-sm">
              <p><strong>APT Ghana Limited</strong></p>
              <p>Airport City, Accra, Ghana</p>
              <p>Email: <a href={`mailto:${EMAIL_PRIVACY}`} className="text-[#0057b8] hover:text-[#1a73e8]">{EMAIL_PRIVACY}</a></p>
              <p>Phone: <a href="tel:+233302123456" className="text-[#0057b8] hover:text-[#1a73e8]">+233 30 212 3456</a></p>
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
