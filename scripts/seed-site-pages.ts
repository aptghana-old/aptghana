/**
 * Seed privacy, terms, and contact page content into site_pages collection.
 * Run: MONGODB_URI=... npx tsx scripts/seed-site-pages.ts
 * Safe to re-run (upsert on slug).
 */

import mongoose from "mongoose";
import "dotenv/config";
import {
  EMAIL_PRIVACY,
  EMAIL_SALES,
  SITE_DOMAIN,
  STORE_DOMAIN,
} from "@apt/config";

const URI = process.env.MONGODB_URI ?? "";
if (!URI) {
  console.error("MONGODB_URI not set");
  process.exit(1);
}

const LegalSectionSchema = new mongoose.Schema(
  { heading: String, body: String },
  { _id: true },
);
const OfficeHourSchema = new mongoose.Schema(
  { day: String, hours: String },
  { _id: false },
);
const SitePageSchema = new mongoose.Schema(
  {
    slug: String,
    pageType: String,
    title: String,
    tagline: String,
    description: String,
    lastUpdated: String,
    intro: String,
    sections: [LegalSectionSchema],
    contactBlockName: String,
    contactBlockEmail: String,
    contactBlockAddress: String,
    contactBlockFootnote: String,
    address: String,
    phone: String,
    email: String,
    mapsUrl: String,
    responseTime: String,
    officeHours: [OfficeHourSchema],
    metaTitle: String,
    metaDescription: String,
    status: String,
  },
  { timestamps: true, collection: "site_pages" },
);

const SitePage =
  mongoose.models.SitePage ?? mongoose.model("SitePage", SitePageSchema);

const PAGES = [
  {
    slug: "privacy",
    pageType: "legal",
    title: "Privacy Policy",
    tagline: "Legal",
    description: "",
    lastUpdated: "1 June 2025",
    intro: `APT Ghana Limited (\"APT Ghana\", \"we\", \"us\", or \"our\") is committed to protecting the personal information of individuals who interact with our business. This Privacy Policy explains what data we collect, why we collect it, how we use it, and the rights available to you. It applies to our website at ${SITE_DOMAIN}, our online store at ${STORE_DOMAIN}, and all other digital and offline interactions you have with us.\n\nWe operate in compliance with Ghana's Data Protection Act 2012 (Act 843) and are registered with the Data Protection Commission of Ghana.`,
    sections: [
      {
        heading: "1. Data We Collect",
        body: "We collect information in the following categories:\n\n• Identity Data — First name, last name, title, job function, and company name provided when you request a quote, register for training, or contact us.\n\n• Contact Data — Email address, telephone number, and business address.\n\n• Transaction Data — Details of products and services you have purchased from us, including order history, invoices, and delivery records.\n\n• Technical Data — IP address, browser type and version, time zone, browser plug-in types, operating system, and platform, and other technology on devices you use to access our website.\n\n• Usage Data — Information about how you use our websites and online store, including pages visited and search queries.\n\n• Communications Data — Preferences in receiving marketing materials from us, and your communication preferences.\n\nWe do not collect any special categories of personal data (such as racial or ethnic origin, health data, or biometric data).",
      },
      {
        heading: "2. How We Use Your Information",
        body: "We use personal data for the following purposes:\n\n• Process and fulfil orders — Contractual necessity\n• Respond to enquiries and quote requests — Legitimate interests\n• Send product updates and marketing (with consent) — Consent\n• Improve our website and services — Legitimate interests\n• Comply with legal obligations — Legal obligation\n• Detect and prevent fraud — Legitimate interests\n• Manage our supplier and partner relationships — Contractual necessity",
      },
      {
        heading: "3. Third Parties & Disclosure",
        body: "We share personal data only where necessary and with appropriate safeguards:\n\n• Service providers who process data on our behalf (e.g., email marketing platforms, website hosting, analytics providers) under strict data processing agreements.\n• Our brand partners and OEM manufacturers, where you have specifically requested product support, warranty claims, or technical assistance from that manufacturer.\n• Logistics and freight partners for the purpose of delivering your orders.\n• Professional advisers (lawyers, accountants, auditors) who are bound by confidentiality obligations.\n• Regulatory authorities and law enforcement where required by Ghanaian law or a valid court order.\n\nWe do not sell, rent, or trade your personal data to third parties for their own marketing purposes.",
      },
      {
        heading: "4. Data Security",
        body: "We have implemented appropriate technical and organisational security measures to protect your personal information against accidental loss, unauthorised access, alteration, and disclosure. These measures include:\n\n• TLS encryption for all data transmitted between your browser and our servers.\n• Access controls limiting personal data access to employees who need it to perform their roles.\n• Regular security assessments of our systems and third-party service providers.\n• Data retention policies ensuring we do not hold personal data longer than necessary.\n\nRetention: We retain customer transaction records for 7 years in compliance with Ghanaian accounting regulations. Marketing data is retained until you withdraw consent. Website analytics data is retained for 26 months.",
      },
      {
        heading: "5. Your Rights",
        body: "Under Ghana's Data Protection Act 2012, you have the following rights:\n\n• Right of Access — Request a copy of the personal data we hold about you.\n• Right to Rectification — Request correction of inaccurate or incomplete data.\n• Right to Erasure — Request deletion of your data in certain circumstances.\n• Right to Object — Object to processing based on legitimate interests or for direct marketing.\n• Right to Withdraw Consent — Withdraw marketing consent at any time without affecting prior processing.\n• Right to Complain — Lodge a complaint with Ghana's Data Protection Commission.\n\nTo exercise any of these rights, please contact our Data Protection Officer using the details below. We will respond within 30 days.",
      },
      {
        heading: "6. Cookies",
        body: "Our websites use cookies and similar tracking technologies to improve your browsing experience, analyse site traffic, and for marketing purposes. We use strictly necessary cookies (required for the site to function), analytical cookies (to understand usage), and marketing cookies (with your consent). You can manage cookie preferences through your browser settings at any time.",
      },
    ],
    contactBlockName: "Data Protection Officer, APT Ghana Limited",
    contactBlockEmail: EMAIL_PRIVACY,
    contactBlockAddress:
      "North Industrial Area, Plot 7 Block 5, Dadeban Street, Accra, Ghana",
    contactBlockFootnote:
      "This policy was last updated on 1 June 2025. APT Ghana reserves the right to update this policy at any time. Material changes will be communicated via email or a prominent notice on our website.",
    metaTitle: "Privacy Policy | APT Ghana",
    metaDescription:
      "APT Ghana's privacy policy explains how we collect, use, and protect your personal information in accordance with Ghana's Data Protection Act 2012 (Act 843).",
    status: "published",
  },
  {
    slug: "terms",
    pageType: "legal",
    title: "Terms of Service",
    tagline: "Legal",
    description: "",
    lastUpdated: "1 June 2025",
    intro:
      'These Terms of Service ("Terms") govern the supply of products and engineering services by APT Ghana Limited ("APT Ghana", "Company", "we", "us") to customers ("you", "Customer"). By placing an order or entering into any business relationship with APT Ghana, you agree to be bound by these Terms. These Terms apply to all sales channels including our online store, direct sales, and any written purchase orders.\n\nWhere any conflict arises between these Terms and any purchase order issued by the Customer, these Terms shall prevail unless expressly varied in writing and signed by a duly authorised representative of APT Ghana.',
    sections: [
      {
        heading: "1. Acceptance of Terms",
        body: "By submitting a purchase order, accepting a quotation, or proceeding with a transaction via store-v2.aptghana.com, you confirm that:\n\n• You are authorised to enter into binding contracts on behalf of yourself or your organisation.\n• You are at least 18 years of age.\n• You have read, understood, and agree to these Terms in their entirety.\n• The information you have provided is accurate and complete.",
      },
      {
        heading: "2. Products & Pricing",
        body: "Product Descriptions: All product descriptions, specifications, and imagery on our platforms are provided for informational purposes. APT Ghana does not warrant that product descriptions are error-free or complete. In the event of discrepancy, the manufacturer's official datasheet shall prevail.\n\nPricing: All prices are quoted in Ghana Cedis (GHS) or US Dollars (USD) as indicated, and are exclusive of VAT (levied at the standard rate applicable in Ghana) unless expressly stated. Prices are subject to change without notice prior to order confirmation.\n\nQuotations: Written quotations are valid for 30 calendar days from the date of issue unless otherwise stated. Price and availability are subject to confirmation at the time of order placement.\n\nImport & Customs Duties: Where products are sourced internationally, any applicable import duties, customs fees, port charges, or clearing charges will be communicated at quotation stage and are the responsibility of the Customer unless agreed otherwise in writing.",
      },
      {
        heading: "3. Payment Terms",
        body: "Standard Terms: Payment is due within 30 days of invoice date for approved credit account customers. New customers are required to pay in full prior to despatch unless a credit account has been approved in writing.\n\nAccepted Methods: Bank transfer (GHS or USD), mobile money (MTN MoMo, Vodafone Cash, AirtelTigo Money), and confirmed cheque. Online store payments are processed via our secure payment gateway. We do not accept cash payments for orders above GHS 1,000.\n\nLate Payment: Overdue balances will accrue interest at 2% per month on the outstanding amount. APT Ghana reserves the right to suspend deliveries on accounts with outstanding balances.\n\nRetention of Title: All goods supplied remain the property of APT Ghana until full payment has been received. Risk in goods passes to the Customer upon delivery.",
      },
      {
        heading: "4. Delivery",
        body: "Delivery Times: APT Ghana will endeavour to dispatch stocked items within 2–3 business days of confirmed payment. Non-stocked and imported items are subject to lead times provided at quotation stage, typically 4–12 weeks.\n\nDelivery Risk: APT Ghana is not liable for delays caused by circumstances beyond our reasonable control, including port congestion, international shipping delays, customs clearance, or force majeure events.\n\nDelivery Address: The Customer is responsible for ensuring the delivery address is accurate. Re-delivery costs resulting from incorrect or inaccessible delivery addresses are chargeable to the Customer.\n\nInspection: The Customer must inspect all goods upon delivery and notify APT Ghana of any shortages, damage, or discrepancies within 48 hours of receipt.",
      },
      {
        heading: "5. Returns & Warranty",
        body: "Warranty: All products carry the manufacturer's warranty. Typical warranty periods range from 12 months (standard electrical components) to 24 months (motors and drives), subject to the individual manufacturer's terms. Warranty claims must be submitted to APT Ghana in writing with proof of purchase and a full description of the defect.\n\nReturn Policy: Stocked items may be returned within 14 days of delivery in their original, unopened packaging for a credit or exchange. A restocking fee of 15% applies to all returns except those resulting from APT Ghana's error. Special-order, non-stocked, and imported items are non-returnable unless defective.\n\nWarranty Exclusions: Warranties do not cover damage resulting from improper installation, misuse, modification, operation outside specified parameters, acts of God, or failure to follow manufacturer installation guidelines.",
      },
      {
        heading: "6. Limitation of Liability",
        body: "To the fullest extent permitted by Ghanaian law, APT Ghana's total liability to the Customer arising out of or in connection with any order shall not exceed the purchase price paid for the specific goods or services giving rise to the claim.\n\nAPT Ghana shall not be liable for any indirect, consequential, special, or punitive loss including, but not limited to, loss of production, loss of profit, loss of revenue, or loss of data, whether arising in contract, tort, negligence, or otherwise.\n\nNothing in these Terms limits or excludes liability for death or personal injury caused by negligence, fraud, or any other liability that cannot be limited by applicable law.",
      },
      {
        heading: "7. Governing Law",
        body: "These Terms and any dispute arising from or in connection with them shall be governed by and construed in accordance with the laws of the Republic of Ghana. The parties submit to the exclusive jurisdiction of the courts of Ghana.\n\nAny disputes not resolved through good-faith negotiation shall be referred to mediation under the rules of the Ghana Arbitration Centre before proceedings are initiated in the courts.",
      },
      {
        heading: "8. Contact",
        body: `For all legal and contractual enquiries, please contact us at:\n\nAPT Ghana Limited\nNorth Industrial Area, Plot 7 Block 5, Dadeban Street, Accra, Ghana\nEmail: ${EMAIL_SALES}\nPhone: +233 30 396 4346`,
      },
    ],
    contactBlockName: "APT Ghana Limited",
    contactBlockEmail: EMAIL_SALES,
    contactBlockAddress:
      "North Industrial Area, Plot 7 Block 5, Dadeban Street, Accra, Ghana",
    contactBlockFootnote:
      "These Terms were last updated on 1 June 2025. APT Ghana reserves the right to update these Terms at any time. Continued use of our services after an update constitutes acceptance of the revised Terms.",
    metaTitle: "Terms of Service | APT Ghana",
    metaDescription:
      "APT Ghana Limited's terms and conditions governing the supply of industrial products and engineering services. Read our policies on pricing, payment, delivery, returns, and warranty.",
    status: "published",
  },
  {
    slug: "contact",
    pageType: "contact",
    title: "Let's Work Together",
    tagline: "Get In Touch",
    description:
      "Whether you need a product quote, technical assistance, or want to discuss an engineering project — APT Ghana's experts are ready to help.",
    address:
      "North Industrial Area, Plot 7 Block 5, Dadeban Street, Accra, Ghana",
    phone: "+233 30 396 4346",
    email: EMAIL_SALES,
    mapsUrl: "https://maps.google.com/?q=North+Industrial+Area+Accra+Ghana",
    responseTime: "We respond within 1 business day.",
    officeHours: [
      { day: "Monday – Friday", hours: "08:00 – 17:00" },
      { day: "Saturday", hours: "09:00 – 13:00" },
      { day: "Sunday", hours: "Closed" },
      { day: "Public Holidays", hours: "Closed" },
    ],
    metaTitle: "Contact APT Ghana | Industrial Technology Experts",
    metaDescription:
      "Get in touch with APT Ghana's team of industrial technology experts. Request a product quote, technical support, or discuss your project requirements. Located in Accra, Ghana.",
    status: "published",
  },
];

async function main() {
  await mongoose.connect(URI);
  console.log("Connected to MongoDB");

  let created = 0,
    updated = 0;

  for (const page of PAGES) {
    const exists = await SitePage.findOne({ slug: page.slug });
    if (exists) {
      await SitePage.updateOne({ slug: page.slug }, { $set: page });
      console.log(`  updated: ${page.title}`);
      updated++;
    } else {
      await SitePage.create(page);
      console.log(`  created: ${page.title}`);
      created++;
    }
  }

  console.log(`\nSite Pages: ${created} created, ${updated} updated`);
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
