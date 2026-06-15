/**
 * Seed all static services content into MongoDB.
 * Run: tsx scripts/seed-services.ts
 * Safe to re-run: uses upsert on slug.
 */

import mongoose from "mongoose";
import "dotenv/config";

const URI = process.env.MONGODB_URI ?? "";
if (!URI) { console.error("MONGODB_URI not set"); process.exit(1); }

const ServiceSchema = new mongoose.Schema(
  {
    slug:        { type: String, required: true, unique: true },
    title:       { type: String, required: true },
    description: { type: String, default: "" },
    section:     { type: String, required: true },
    iconName:    { type: String, default: "" },
    displayOrder:{ type: Number, default: 0 },
    status:      { type: String, default: "active" },
  },
  { timestamps: true, collection: "services" }
);

const Service = mongoose.models.Service ?? mongoose.model("Service", ServiceSchema, "services");

function slugify(t: string) {
  return t.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").trim();
}

const services = [
  // ── Pillars (Three Pillars of Service Excellence) ──────────────────────────
  {
    title: "Reliable & Scalable Solutions",
    description: "We design systems that grow with your operation. From a single motor drive replacement to a full process automation overhaul, our engineers ensure scalability is built in from day one.",
    section: "pillars",
    iconName: "Shield",
    displayOrder: 1,
  },
  {
    title: "Upgrading Obsolete Systems",
    description: "Many facilities across West Africa operate on ageing equipment. APT Ghana specialises in modernising legacy systems — replacing end-of-life PLCs, drives, and switchgear with current-generation equivalents while minimising downtime.",
    section: "pillars",
    iconName: "RefreshCw",
    displayOrder: 2,
  },
  {
    title: "Strategic OEM Partnerships",
    description: "As an authorised distributor for Schneider Electric, WEG, Camozzi, and 23+ other global OEMs, we provide clients with direct access to manufacturer technical resources, warranty support, and genuine spare parts.",
    section: "pillars",
    iconName: "Globe2",
    displayOrder: 3,
  },

  // ── Technical Assistance & Training ────────────────────────────────────────
  {
    title: "Commissioning & Start-Up",
    description: "APT Ghana engineers attend site to commission new equipment, configure parameters, and verify correct operation against specification.",
    section: "technical",
    iconName: "Wrench",
    displayOrder: 1,
  },
  {
    title: "Repair & Overhaul",
    description: "Authorised repair services for drives, motors, and control systems. We use genuine OEM parts and return equipment to factory specification.",
    section: "technical",
    iconName: "Settings2",
    displayOrder: 2,
  },
  {
    title: "Lifecycle Management",
    description: "End-of-life planning for critical equipment. We map your installed base, identify obsolescence risks, and develop phased replacement plans that avoid emergency shutdowns.",
    section: "technical",
    iconName: "BarChart3",
    displayOrder: 3,
  },
  {
    title: "Operator Training",
    description: "On-site and facility-based training for your operations team. We cover equipment operation, safe working procedures, and first-line fault-finding.",
    section: "technical",
    iconName: "GraduationCap",
    displayOrder: 4,
  },
  {
    title: "Preventive Maintenance",
    description: "Scheduled maintenance contracts to keep critical equipment in peak condition. Our engineers visit your site on agreed intervals, reducing unplanned downtime.",
    section: "technical",
    iconName: "Clock",
    displayOrder: 5,
  },
  {
    title: "Emergency Breakdown Support",
    description: "When production stops, every hour counts. APT Ghana provides priority breakdown support with fast response times and on-site engineer dispatch across Greater Accra.",
    section: "technical",
    iconName: "Bell",
    displayOrder: 6,
  },

  // ── What We Offer (The Full Service Promise) ────────────────────────────────
  {
    title: "Tailor-Made Industrial Solutions",
    description: "No two projects are the same. Our applications engineers work alongside your team to engineer solutions precisely matched to your operational requirements, site conditions, and budget.",
    section: "what-we-offer",
    iconName: "",
    displayOrder: 1,
  },
  {
    title: "Maintenance, Troubleshooting & After-Sales",
    description: "Our relationship with clients extends beyond the point of sale. APT Ghana provides scheduled maintenance visits, emergency breakdown support, and long-term service agreements.",
    section: "what-we-offer",
    iconName: "",
    displayOrder: 2,
  },
  {
    title: "Original Spare Parts Supply",
    description: "Genuine, certified spare parts from all our brand partners. Fast lead times from our Accra warehouse, and global order capability for specialist items not held in stock.",
    section: "what-we-offer",
    iconName: "",
    displayOrder: 3,
  },

  // ── Pre-Sales Consulting (bullet points) ───────────────────────────────────
  {
    title: "Site surveys and load calculations",
    description: "",
    section: "pre-sales",
    iconName: "",
    displayOrder: 1,
  },
  {
    title: "Technology selection and comparative analysis",
    description: "",
    section: "pre-sales",
    iconName: "",
    displayOrder: 2,
  },
  {
    title: "Bill of materials preparation",
    description: "",
    section: "pre-sales",
    iconName: "",
    displayOrder: 3,
  },
  {
    title: "Energy efficiency assessments",
    description: "",
    section: "pre-sales",
    iconName: "",
    displayOrder: 4,
  },
  {
    title: "Regulatory and standards compliance guidance",
    description: "",
    section: "pre-sales",
    iconName: "",
    displayOrder: 5,
  },

  // ── Customised Assembly (features) ─────────────────────────────────────────
  {
    title: "Quality Control",
    description: "IEC-compliant assembly and testing at our Accra facility before delivery.",
    section: "assembly",
    iconName: "",
    displayOrder: 1,
  },
  {
    title: "Short Lead Times",
    description: "Local assembly reduces lead times vs importing pre-built panels from Europe.",
    section: "assembly",
    iconName: "",
    displayOrder: 2,
  },
  {
    title: "Made for Ghana",
    description: "Panels are designed and rated for Ghana's specific voltage and climate conditions.",
    section: "assembly",
    iconName: "",
    displayOrder: 3,
  },
  {
    title: "Full Documentation",
    description: "Every assembly ships with complete wiring diagrams, component lists, and test records.",
    section: "assembly",
    iconName: "",
    displayOrder: 4,
  },
].map((s) => ({ ...s, slug: slugify(s.title) }));

async function run() {
  await mongoose.connect(URI);
  console.log("Connected to MongoDB");

  let created = 0, updated = 0;
  for (const svc of services) {
    const result = await Service.updateOne({ slug: svc.slug }, { $set: svc }, { upsert: true });
    if (result.upsertedCount) created++;
    else updated++;
  }

  console.log(`\nDone — ${created} created, ${updated} updated (${services.length} total).`);
  await mongoose.disconnect();
}

run().catch((err) => { console.error(err); process.exit(1); });
