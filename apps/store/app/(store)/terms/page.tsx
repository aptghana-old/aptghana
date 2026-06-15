import type { Metadata } from "next";
import Link from "next/link";
import { STORE_DOMAIN } from "@apt/config";

export const metadata: Metadata = {
  title: "Terms of Service | APT Ghana",
  description: "Terms and conditions governing the use of APT Ghana's website and purchasing services.",
};

const LAST_UPDATED = "1 June 2025";

export default function TermsPage() {
  return (
    <>      <main className="min-h-screen bg-[#f9fafb]">
      <div className="bg-[#0a1628] py-12">
        <div className="container-store">
          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">Terms of Service</h1>
          <p className="text-white/40 mt-2 text-sm">Last updated: {LAST_UPDATED}</p>
        </div>
      </div>

      <div className="container-store py-10">
        <div className="grid lg:grid-cols-[220px_1fr] gap-8 items-start">
          {/* Nav */}
          <nav className="hidden lg:block sticky top-6 bg-white rounded-2xl border border-[#e5e7eb] p-4">
            <p className="text-xs font-bold text-[#0a1628] uppercase tracking-widest mb-3">Contents</p>
            <ul className="space-y-1">
              {[ "Acceptance", "Use of Website", "Orders & Quotations", "Pricing & Payment", "Delivery", "Returns & Warranty", "Limitation of Liability", "Governing Law" ].map((item) => (
                <li key={item}>
                  <a href={`#${item.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`} className="text-xs text-[#6b7280] hover:text-[#0057b8] transition-colors block py-1">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="bg-white rounded-2xl border border-[#e5e7eb] p-7 sm:p-10 prose prose-sm max-w-none">
            <p className="text-[#6b7280] leading-relaxed">
              These Terms of Service (&quot;Terms&quot;) govern your use of <strong>{STORE_DOMAIN}</strong> and all services provided by APT Ghana Limited (&quot;APT Ghana&quot;, &quot;we&quot;, &quot;us&quot;). By accessing our website or placing an order, you agree to these Terms.
            </p>

            <h2 id="acceptance" className="text-[#0a1628] font-bold mt-8 mb-3">1. Acceptance of Terms</h2>
            <p className="text-[#6b7280]">By using our website or services, you confirm that you are at least 18 years of age, acting on behalf of a duly registered business or organisation, and authorised to enter into commercial agreements on behalf of that entity.</p>

            <h2 id="use-of-website" className="text-[#0a1628] font-bold mt-8 mb-3">2. Use of Website</h2>
            <p className="text-[#6b7280]">You agree to use this website only for lawful purposes. You must not use the website to transmit unsolicited communications, attempt to gain unauthorised access to any systems, or misrepresent your identity or affiliation. We reserve the right to restrict access to any user who violates these conditions.</p>

            <h2 id="orders-quotations" className="text-[#0a1628] font-bold mt-8 mb-3">3. Orders & Quotations</h2>
            <p className="text-[#6b7280]">All RFQs and purchase enquiries are subject to acceptance by APT Ghana. A binding order is created only upon receipt and acceptance of a written purchase order or confirmed proforma invoice. Quoted prices are valid for 30 days unless otherwise stated. Availability is subject to change without notice.</p>

            <h2 id="pricing-payment" className="text-[#0a1628] font-bold mt-8 mb-3">4. Pricing & Payment</h2>
            <p className="text-[#6b7280]">All prices on the website are indicative and exclude VAT unless stated otherwise. Final pricing is confirmed on the proforma invoice. Payment terms are as specified on the invoice. APT Ghana reserves the right to withhold delivery until payment is received in full. We accept bank transfer, mobile money, and other payment methods as stated on the invoice.</p>

            <h2 id="delivery" className="text-[#0a1628] font-bold mt-8 mb-3">5. Delivery</h2>
            <p className="text-[#6b7280]">Delivery timelines are estimates and are subject to stock availability and logistics. APT Ghana is not liable for delays caused by circumstances beyond our reasonable control. Risk of loss passes to the buyer upon delivery to the agreed delivery point. Goods must be inspected upon receipt; any damage or shortages must be reported within 48 hours.</p>

            <h2 id="returns-warranty" className="text-[#0a1628] font-bold mt-8 mb-3" >6. Returns & Warranty</h2>
            <p className="text-[#6b7280]">All products carry the manufacturer&apos;s standard warranty. Warranty claims must be submitted through APT Ghana and are subject to the manufacturer&apos;s terms and conditions. Returns of non-defective items are accepted within 14 days of delivery, subject to a restocking fee, provided goods are in original, unopened condition. Custom-ordered or specially imported items are non-returnable.</p>

            <h2 id="limitation-of-liability" className="text-[#0a1628] font-bold mt-8 mb-3">7. Limitation of Liability</h2>
            <p className="text-[#6b7280]">To the maximum extent permitted by Ghanaian law, APT Ghana&apos;s liability for any claim arising from these Terms shall not exceed the value of the goods or services giving rise to the claim. We are not liable for indirect, consequential, or incidental losses, including loss of profit or production downtime.</p>

            <h2 id="governing-law" className="text-[#0a1628] font-bold mt-8 mb-3">8. Governing Law</h2>
            <p className="text-[#6b7280]">These Terms are governed by the laws of the Republic of Ghana. Any disputes shall be subject to the exclusive jurisdiction of the courts of Ghana.</p>

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
