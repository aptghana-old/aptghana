/**
 * Seeds the Industries and Resources collections with data that drives the
 * header mega-menus on aptghana.com.
 * Run: tsx scripts/seed-navigation.ts
 * Safe to re-run: upserts on slug.
 */

import mongoose from "mongoose";
import "dotenv/config";

const URI = process.env.MONGODB_URI ?? "";
if (!URI) { console.error("MONGODB_URI not set"); process.exit(1); }

// ─── Inline schemas (avoids circular imports) ─────────────────────────────────

const IndustrySchema = new mongoose.Schema(
  {
    slug:             { type: String, required: true, unique: true },
    name:             { type: String, required: true },
    tagline:          { type: String, default: "" },
    shortDescription: { type: String, default: "" },
    challenge:        { type: String, default: "" },
    solutions:        [String],
    brands:           [String],
    clients:          { type: String, default: "" },
    icon:             { type: String, default: "" },
    accentColor:      { type: String, default: "#84CC16" },
    stats:            [{ label: String, value: String, _id: false }],
    keyProducts:      [String],
    isFeatured:       { type: Boolean, default: false },
    displayOrder:     { type: Number, default: 0 },
    status:           { type: String, default: "active" },
    seo:              { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
  },
  { timestamps: true, collection: "industries" }
);

const ResourceSchema = new mongoose.Schema(
  {
    slug:         { type: String, required: true, unique: true },
    type:         { type: String, required: true },
    title:        { type: String, required: true },
    tagline:      { type: String, default: "" },
    intro:        { type: String, default: "" },
    badge:        { type: String, default: "" },
    items:        { type: [mongoose.Schema.Types.Mixed], default: [] },
    cta:          { label: { type: String, default: "Get in Touch" }, href: { type: String, default: "/contact" }, _id: false },
    isFeatured:   { type: Boolean, default: false },
    displayOrder: { type: Number, default: 0 },
    status:       { type: String, default: "active" },
  },
  { timestamps: true, collection: "resources" }
);

// ─── Data ─────────────────────────────────────────────────────────────────────

const INDUSTRIES = [
  { slug: "mining",        name: "Mining & Minerals",  tagline: "Deep-level extraction & processing",          shortDescription: "Motor control, protection & drives for deep-level operations",            accentColor: "#F59E0B", displayOrder: 1 },
  { slug: "oil-gas",       name: "Oil & Gas",           tagline: "Process & safety critical environments",      shortDescription: "ATEX-rated equipment & process instrumentation",                         accentColor: "#F97316", displayOrder: 2 },
  { slug: "manufacturing", name: "Manufacturing",       tagline: "Assembly lines & production control",         shortDescription: "Assembly automation, quality & production control",                       accentColor: "#3B82F6", displayOrder: 3 },
  { slug: "energy",        name: "Power & Energy",      tagline: "Generation, transmission & distribution",     shortDescription: "HV/MV switchgear, transformers & power quality",                         accentColor: "#EAB308", displayOrder: 4 },
  { slug: "water",         name: "Water & Wastewater",  tagline: "Treatment, pumping & SCADA",                  shortDescription: "SCADA, level control & pump protection systems",                          accentColor: "#06B6D4", displayOrder: 5 },
  { slug: "ports",         name: "Ports & Logistics",   tagline: "Crane, conveying & bulk handling",            shortDescription: "Variable speed drives, conveying & crane systems",                        accentColor: "#6366F1", displayOrder: 6 },
  { slug: "food-beverage", name: "Food & Beverage",     tagline: "Hygienic processing & packaging",             shortDescription: "Hygienic motors, process & packaging automation",                         accentColor: "#22C55E", displayOrder: 7 },
  { slug: "construction",  name: "Construction",        tagline: "Temporary power & site electrical",           shortDescription: "Temporary power, distribution boards & site electrical",                   accentColor: "#64748B", displayOrder: 8 },
];

const RESOURCES = [
  { slug: "library",         type: "library",      title: "Datasheets & Manuals",  tagline: "Official specs, installation guides & compliance docs",  displayOrder: 1 },
  { slug: "training",        type: "training",     title: "Product Training",       tagline: "Webinars, certification paths & e-learning modules",     displayOrder: 2 },
  { slug: "cad",             type: "cad",          title: "Technical Drawings",     tagline: "CAD files, wiring diagrams & dimensional drawings",      displayOrder: 3 },
  { slug: "case-studies",    type: "case-studies", title: "Case Studies",           tagline: "Proven project outcomes across West Africa",             displayOrder: 4 },
  { slug: "news",            type: "news",         title: "News & Insights",        tagline: "Industry trends, product launches & company news",       displayOrder: 5 },
  { slug: "project-gallery", type: "projects",     title: "Project Gallery",        tagline: "Completed installations from our engineering team",      displayOrder: 6 },
];

// ─── Seed ─────────────────────────────────────────────────────────────────────

async function seed() {
  await mongoose.connect(URI);
  console.log("Connected to MongoDB");

  const Industry = mongoose.models.Industry ?? mongoose.model("Industry", IndustrySchema);
  const Resource  = mongoose.models.Resource  ?? mongoose.model("Resource",  ResourceSchema);

  let indCreated = 0, indUpdated = 0;
  for (const item of INDUSTRIES) {
    const result = await Industry.updateOne(
      { slug: item.slug },
      { $set: { ...item, status: "active" } },
      { upsert: true }
    );
    if (result.upsertedCount) indCreated++;
    else if (result.modifiedCount) indUpdated++;
  }

  let resCreated = 0, resUpdated = 0;
  for (const item of RESOURCES) {
    const result = await Resource.updateOne(
      { slug: item.slug },
      { $set: { ...item, status: "active" } },
      { upsert: true }
    );
    if (result.upsertedCount) resCreated++;
    else if (result.modifiedCount) resUpdated++;
  }

  console.log(`Industries: ${indCreated} created, ${indUpdated} updated`);
  console.log(`Resources:  ${resCreated} created, ${resUpdated} updated`);

  await mongoose.disconnect();
  console.log("Done.");
}

seed().catch((err) => { console.error(err); process.exit(1); });
