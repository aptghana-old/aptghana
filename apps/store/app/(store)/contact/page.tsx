import type { Metadata } from "next";
import { EMAIL_SALES, EMAIL_SUPPORT, CONTACT_PHONE, CONTACT_PHONE_HREF } from "@apt/config";

export const revalidate = 3600;

interface OfficeHour { day: string; hours: string }

interface ContactData {
  title: string;
  tagline: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  officeHours: OfficeHour[];
  metaTitle: string;
  metaDescription: string;
}

const STATIC: ContactData = {
  title: "Contact APT Ghana",
  tagline: "Get in Touch",
  description: "Our sales engineers and technical support team are available Monday–Friday, 8:00 AM – 5:00 PM GMT.",
  address: "Airport City, Accra, Greater Accra Region, Ghana",
  phone: CONTACT_PHONE,
  email: EMAIL_SALES,
  officeHours: [
    { day: "Monday – Friday", hours: "8:00 AM – 5:00 PM" },
    { day: "Saturday", hours: "9:00 AM – 1:00 PM" },
    { day: "Sunday", hours: "Closed" },
  ],
  metaTitle: "Contact Us | APT Ghana",
  metaDescription: "Get in touch with APT Ghana. Sales enquiries, technical support, and general contact details for our Accra office.",
};

async function getData(): Promise<ContactData> {
  const { getSitePageData } = await import("@apt/db");
  return getSitePageData("contact", STATIC);
}

export async function generateMetadata(): Promise<Metadata> {
  const data = await getData();
  return { title: data.metaTitle, description: data.metaDescription };
}

export default async function ContactPage() {
  const data = await getData();
  const phoneHref = data.phone === CONTACT_PHONE ? CONTACT_PHONE_HREF : `tel:${data.phone.replace(/\s+/g, "")}`;

  return (
    <>      <main className="min-h-screen bg-[#f9fafb]">
        <div className="bg-[#0a1628] py-12">
          <div className="container-store">
            <p className="text-xs font-semibold text-[#ff8c33] uppercase tracking-widest mb-2">{data.tagline}</p>
            <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">{data.title}</h1>
            <p className="text-white/50 mt-2">{data.description}</p>
          </div>
        </div>

        <div className="container-store py-10">
          <div className="grid lg:grid-cols-[1fr_380px] gap-8 items-start">

            {/* Contact form */}
            <div className="bg-white rounded-2xl border border-[#e5e7eb] p-7 sm:p-9">
              <h2 className="text-xl font-bold text-[#0a1628] mb-6">Send Us a Message</h2>
              <form action="/api/contact" method="post" className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#374151] mb-1.5" htmlFor="name">Full name *</label>
                    <input id="name" name="name" type="text" required className="w-full h-11 px-4 border border-[#d1d5db] rounded-xl text-sm focus:outline-none focus:border-[#0057b8] focus:ring-1 focus:ring-[#0057b8] transition-colors" placeholder="Kwame Mensah" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#374151] mb-1.5" htmlFor="company">Company</label>
                    <input id="company" name="company" type="text" className="w-full h-11 px-4 border border-[#d1d5db] rounded-xl text-sm focus:outline-none focus:border-[#0057b8] focus:ring-1 focus:ring-[#0057b8] transition-colors" placeholder="Acme Industries Ltd." />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#374151] mb-1.5" htmlFor="email">Email address *</label>
                    <input id="email" name="email" type="email" required className="w-full h-11 px-4 border border-[#d1d5db] rounded-xl text-sm focus:outline-none focus:border-[#0057b8] focus:ring-1 focus:ring-[#0057b8] transition-colors" placeholder="kwame@company.com" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#374151] mb-1.5" htmlFor="phone">Phone number</label>
                    <input id="phone" name="phone" type="tel" className="w-full h-11 px-4 border border-[#d1d5db] rounded-xl text-sm focus:outline-none focus:border-[#0057b8] focus:ring-1 focus:ring-[#0057b8] transition-colors" placeholder="+233 XX XXX XXXX" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#374151] mb-1.5" htmlFor="subject">Subject *</label>
                  <select id="subject" name="subject" required className="w-full h-11 px-4 border border-[#d1d5db] rounded-xl text-sm text-[#111827] focus:outline-none focus:border-[#0057b8] focus:ring-1 focus:ring-[#0057b8] bg-white transition-colors">
                    <option value="">Select a topic…</option>
                    <option value="sales">Sales Enquiry</option>
                    <option value="technical">Technical Support</option>
                    <option value="rfq">Request for Quotation</option>
                    <option value="warranty">Warranty / Returns</option>
                    <option value="delivery">Delivery / Logistics</option>
                    <option value="partnership">Partnership / Distributorship</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#374151] mb-1.5" htmlFor="message">Message *</label>
                  <textarea id="message" name="message" rows={6} required className="w-full px-4 py-3 border border-[#d1d5db] rounded-xl text-sm text-[#111827] focus:outline-none focus:border-[#0057b8] focus:ring-1 focus:ring-[#0057b8] transition-colors resize-y" placeholder="Describe your enquiry in detail…" />
                </div>
                <button type="submit" className="w-full h-12 bg-[#0057b8] hover:bg-[#1a73e8] text-white font-bold text-sm rounded-xl transition-colors">
                  Send Message
                </button>
              </form>
            </div>

            {/* Contact details */}
            <div className="space-y-5">
              {/* Direct contact */}
              <div className="bg-white rounded-2xl border border-[#e5e7eb] p-6 space-y-5">
                <h2 className="font-bold text-[#0a1628]">Direct Contact</h2>
                {[
                  { dept: "Sales", contact: data.phone, sub: "Mon–Fri, 8 AM–5 PM", href: phoneHref, icon: "M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" },
                  { dept: "Sales Email", contact: data.email, sub: "Response within 4 hours", href: `mailto:${data.email}`, icon: "M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" },
                  { dept: "Technical Support", contact: EMAIL_SUPPORT, sub: "Engineering team", href: `mailto:${EMAIL_SUPPORT}`, icon: "M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437 1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008Z" },
                ].map((c) => (
                  <div key={c.dept} className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[#f0f7ff] flex items-center justify-center shrink-0">
                      <svg className="w-4 h-4 text-[#0057b8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d={c.icon} />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[#6b7280] uppercase tracking-wide">{c.dept}</p>
                      <a href={c.href} className="text-sm font-semibold text-[#0057b8] hover:text-[#1a73e8] transition-colors">{c.contact}</a>
                      <p className="text-xs text-[#9ca3af]">{c.sub}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Office */}
              <div className="bg-white rounded-2xl border border-[#e5e7eb] p-6">
                <h2 className="font-bold text-[#0a1628] mb-4">Showroom & Head Office</h2>
                <div className="space-y-1 text-sm text-[#374151]">
                  <p className="font-semibold">APT Ghana Limited</p>
                  <p className="text-[#6b7280]">{data.address}</p>
                </div>
                <div className="mt-4 pt-4 border-t border-[#e5e7eb]">
                  <p className="text-xs font-semibold text-[#6b7280] uppercase tracking-wide mb-1">Business Hours</p>
                  {data.officeHours.map((h) => (
                    <p key={h.day} className={h.hours === "Closed" ? "text-sm text-[#9ca3af]" : "text-sm text-[#374151]"}>{h.day}: {h.hours}</p>
                  ))}
                </div>
              </div>

              {/* Quick RFQ */}
              <div className="bg-[#3DCD58] rounded-2xl p-6 text-white">
                <h2 className="font-bold mb-1.5">Need a Fast Quote?</h2>
                <p className="text-sm text-white/70 mb-4">Use our RFQ form for product enquiries. Same-day response guaranteed before 3 PM.</p>
                <a href="/rfq" className="inline-flex items-center gap-2 h-10 px-5 bg-white text-[#3DCD58] font-bold text-sm rounded-xl hover:bg-white/90 transition-colors">
                  Submit RFQ
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>    </>
  );
}
