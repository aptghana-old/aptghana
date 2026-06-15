/**
 * Seed company pages and stats into MongoDB.
 * Run: tsx scripts/seed-company.ts
 * Safe to re-run: uses upsert on slug / value+label.
 */

import mongoose from "mongoose";
import "dotenv/config";
import { EMAIL_CAREERS } from "@apt/config";

const URI = process.env.MONGODB_URI ?? "";
if (!URI) { console.error("MONGODB_URI not set"); process.exit(1); }

const SectionSchema = new mongoose.Schema(
  { heading: String, body: String },
  { _id: false }
);

const CompanyPageSchema = new mongoose.Schema(
  {
    slug: String, title: String, tagline: String,
    icon: String, cardDescription: String,
    intro: String,
    sections: [SectionSchema],
    ctaLabel: String, ctaHref: String,
    displayOrder: Number, status: String,
  },
  { timestamps: true, collection: "company_pages" }
);

const CompanyStatSchema = new mongoose.Schema(
  { value: String, label: String, displayOrder: Number, status: String },
  { timestamps: true, collection: "company_stats" }
);

const Page = mongoose.models.CompanyPage ?? mongoose.model("CompanyPage", CompanyPageSchema, "company_pages");
const Stat = mongoose.models.CompanyStat ?? mongoose.model("CompanyStat", CompanyStatSchema, "company_stats");

// ─── Pages ────────────────────────────────────────────────────────────────────

const pages = [
  {
    slug: "about",
    title: "About APT Ghana",
    tagline: "15+ Years of Industrial Excellence",
    icon: "🏢",
    cardDescription: "Our story, mission, values, and the journey from a startup to West Africa's premier industrial technology platform.",
    intro: "Automation & Plant Technologies Limited (APT Ghana) was founded in 2009 with a clear vision: to become West Africa's most trusted source of industrial technology. From a small team serving local manufacturers, we have grown into a full-service distributor with deep expertise across automation, electrical, pneumatics, and conveying systems.",
    sections: [
      { heading: "Our Mission", body: "To empower West Africa's industries with world-class industrial technology, delivered through expert technical support, genuine products, and a commitment to long-term partnership." },
      { heading: "Our Values", body: "Integrity in every transaction. Technical excellence in every recommendation. Responsiveness to every customer need. We don't just supply products — we build lasting relationships based on trust and performance." },
      { heading: "Our Growth", body: "From a single-category startup to a multi-brand distributor supplying 6,000+ SKUs, APT Ghana has grown because our customers trust us. We have been recognized by Schneider Electric as Partner of the Year (Ghana 2021) and Marketing Excellence (Africa 2024) — awards that reflect our team's dedication." },
      { heading: "Our Location", body: "Headquartered at North Industrial Area, Plot 7 Block 5, Dadeban Street, Accra. Our warehouse holds local stock of fast-moving items, enabling rapid delivery to customers across Ghana." },
    ],
    ctaLabel: "Contact Our Team",
    ctaHref: "/contact",
    displayOrder: 1,
    status: "active",
  },
  {
    slug: "team",
    title: "Our Team",
    tagline: "Engineers & Specialists Who Know West Africa",
    icon: "👥",
    cardDescription: "Meet the engineers, sales professionals, and operations specialists who power APT Ghana's operations.",
    intro: "APT Ghana's strength is its people. Our team combines deep product knowledge with years of hands-on experience commissioning and maintaining industrial systems in Ghana's unique operating environment.",
    sections: [
      { heading: "Technical Sales Engineers", body: "Our sales engineers are product-certified specialists who understand the technical requirements of your application before recommending a solution. We don't just quote — we specify." },
      { heading: "After-Sales Support", body: "From commissioning assistance to fault-finding, our after-sales team is available to support you throughout the product life cycle. Service contracts, training, and emergency support available." },
      { heading: "Logistics & Procurement", body: "Our procurement team manages relationships with 26+ OEM partners, ensuring genuine products, competitive pricing, and reliable lead times for everything from standard stock items to custom orders." },
      { heading: "Training & Development", body: "We invest in continuous training for our staff — sending engineers to manufacturer-certified programs in Europe, Asia, and South Africa. This keeps our team current with the latest product developments." },
    ],
    ctaLabel: "Get Technical Support",
    ctaHref: "/contact",
    displayOrder: 2,
    status: "active",
  },
  {
    slug: "careers",
    title: "Careers at APT Ghana",
    tagline: "Join West Africa's Leading Industrial Technology Team",
    icon: "💼",
    cardDescription: "Join APT Ghana's growing team. We're looking for passionate people to help us serve West Africa's industries.",
    intro: "APT Ghana is a fast-growing company with ambitious plans to expand our product portfolio and geographic reach across West Africa. We are always looking for talented, passionate people to join our team.",
    sections: [
      { heading: "Technical Sales Engineer", body: "We look for engineers with backgrounds in electrical, mechanical, or instrumentation engineering who have a passion for customer service and problem-solving. Experience with industrial automation, VFDs, or switchgear is a strong advantage." },
      { heading: "Procurement & Logistics Coordinator", body: "We need organised, detail-oriented professionals to manage supplier relationships, purchase orders, and inbound logistics. Experience with industrial products and import procedures in Ghana is valuable." },
      { heading: "Why APT Ghana", body: "We offer competitive salaries, manufacturer-certified training, career growth opportunities, and the chance to work on technically challenging projects across Ghana's most dynamic industries." },
      { heading: "How to Apply", body: `Send your CV and a brief cover letter to ${EMAIL_CAREERS}. Tell us about your background, what role interests you, and why you want to join APT Ghana. We review all applications and respond to shortlisted candidates within two weeks.` },
    ],
    ctaLabel: "Send Your CV",
    ctaHref: `mailto:${EMAIL_CAREERS}`,
    displayOrder: 3,
    status: "active",
  },
  {
    slug: "partnerships",
    title: "Our Partnerships",
    tagline: "Authorized Distributor for 26+ World-Class Brands",
    icon: "🤝",
    cardDescription: "Our certified partnerships with Schneider Electric, WEG, Camozzi, and 26+ world-leading manufacturers.",
    intro: "APT Ghana holds authorized distributor agreements with 26+ world-leading industrial manufacturers. These partnerships are not just commercial agreements — they represent OEM endorsement of our technical competence, customer service standards, and market knowledge.",
    sections: [
      { heading: "Schneider Electric — Official Electrical Distributor", body: "APT Ghana is Schneider Electric's official certified Electrical Distributor in Ghana. We supply the full Schneider portfolio — from Acti 9 circuit breakers to ATV drives, EcoStruxure systems, and MV switchgear. Recognized with Partner of the Year (2021) and Marketing Excellence (Africa 2024)." },
      { heading: "WEG — Certified Partner", body: "WEG is one of the world's largest electric motor manufacturers. As a certified WEG partner, APT Ghana stocks W22 IE2/IE3 motors, frequency inverters, and soft starters for all industrial applications." },
      { heading: "Camozzi — Authorized Distributor", body: "Camozzi pneumatics — valves, cylinders, air preparation units, and fittings — are stocked at our Accra warehouse. Camozzi's Italian engineering quality and broad catalogue make them our go-to for pneumatic systems." },
      { heading: "Other Partner Brands", body: "Our full portfolio includes ABB, Siemens, Legrand, Phoenix Contact, WAGO, Festo, Parker Hannifin, Eaton, Omron, Provulco, EMC, Isenman, Telemecanique, and more. Full partner list available on our brands page." },
    ],
    ctaLabel: "View All Brands",
    ctaHref: "/brands",
    displayOrder: 4,
    status: "active",
  },
  {
    slug: "csr",
    title: "Corporate Social Responsibility",
    tagline: "Investing in Ghana's Industrial Future",
    icon: "🌱",
    cardDescription: "How APT Ghana contributes to Ghana's industrial development, skills training, and community investment.",
    intro: "APT Ghana believes that a successful business has a responsibility to contribute to the communities and economies it operates in. Our CSR activities focus on skills development, technical education, and community investment in Ghana.",
    sections: [
      { heading: "Technical Training & Skills Development", body: "We partner with technical universities and vocational institutions across Ghana to provide industrial automation training. Our engineers deliver guest lectures, workshops, and hands-on training sessions to students and young professionals." },
      { heading: "Apprenticeship Programme", body: "APT Ghana runs an apprenticeship programme for engineering graduates, providing practical exposure to industrial products, customer service, and technical sales. Successful graduates often join our permanent team." },
      { heading: "Supporting Ghanaian Industry", body: "By maintaining local stock and employing Ghanaian engineers, APT Ghana contributes directly to Ghana's industrial capability. We believe that reducing lead times and improving technical support locally strengthens the competitiveness of Ghana's manufacturing sector." },
      { heading: "Environmental Commitment", body: "We actively promote energy-efficient products — IE3 motors, VFDs, and power quality systems — that help our customers reduce energy consumption. Schneider Electric's EcoDesign philosophy runs throughout our product selection." },
    ],
    ctaLabel: "Contact Us",
    ctaHref: "/contact",
    displayOrder: 5,
    status: "active",
  },
];

// ─── Stats ─────────────────────────────────────────────────────────────────────

const stats = [
  { value: "2009",   label: "Year Founded",       displayOrder: 1, status: "active" },
  { value: "15+",    label: "Years in Business",   displayOrder: 2, status: "active" },
  { value: "26+",    label: "Brand Partnerships",  displayOrder: 3, status: "active" },
  { value: "6,000+", label: "Products Stocked",    displayOrder: 4, status: "active" },
];

async function run() {
  await mongoose.connect(URI);
  console.log("Connected to MongoDB");

  let pCreated = 0, pUpdated = 0;
  for (const page of pages) {
    const r = await Page.updateOne({ slug: page.slug }, { $set: page }, { upsert: true });
    if (r.upsertedCount) pCreated++; else pUpdated++;
    console.log(`  ${r.upsertedCount ? "created" : "updated"}: ${page.title}`);
  }

  let sCreated = 0, sUpdated = 0;
  for (const stat of stats) {
    const r = await Stat.updateOne(
      { label: stat.label },
      { $set: stat },
      { upsert: true }
    );
    if (r.upsertedCount) sCreated++; else sUpdated++;
  }

  console.log(`\nPages:  ${pCreated} created, ${pUpdated} updated`);
  console.log(`Stats:  ${sCreated} created, ${sUpdated} updated`);
  console.log("Done.");
  await mongoose.disconnect();
}

run().catch((err) => { console.error(err); process.exit(1); });
