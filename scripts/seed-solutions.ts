/**
 * Seed the 6 end-to-end industrial solution groups into the DB.
 * Run: tsx scripts/seed-solutions.ts
 * Safe to re-run: uses upsert on slug.
 */

import mongoose from "mongoose";
import "dotenv/config";

const URI = process.env.MONGODB_URI ?? "";
if (!URI) { console.error("MONGODB_URI not set"); process.exit(1); }

const CategorySchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    shortDescription: { type: String, default: "" },
    description: { type: String, default: "" },
    level: { type: String, enum: ["group", "category", "subcategory", "range"], required: true },
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: "Category", sparse: true },
    ancestors: [{ type: mongoose.Schema.Types.ObjectId, ref: "Category" }],
    image: { url: String, alt: { type: String, default: "" } },
    benefits: [{ title: String, value: String, _id: false }],
    bulletPoints: [String],
    products: [String],
    brands: [String],
    applications: [String],
    isFeatured: { type: Boolean, default: false },
    displayOrder: { type: Number, default: 0 },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true, collection: "categories_v2" }
);

const Category = mongoose.models.Category ?? mongoose.model("Category", CategorySchema, "categories_v2");

const solutions = [
  {
    slug: "electrical",
    name: "Electrical Solutions",
    shortDescription: "LV/MV Distribution & Protection",
    description:
      "Complete electrical distribution systems from circuit protection to energy monitoring. APT Ghana supplies the full range of low and medium voltage products — switchgear, protection devices, wiring accessories, and intelligent energy management solutions — backed by our Schneider Electric, Legrand, ABB, and Eaton partnerships.",
    level: "group",
    displayOrder: 1,
    isFeatured: true,
    status: "active",
    products: [
      "Modular Circuit Breakers (MCBs)",
      "Residual Current Devices (RCCBs)",
      "Moulded Case Circuit Breakers (MCCBs)",
      "Power Monitoring Systems",
      "Energy Meters",
      "Industrial Sockets",
      "Busway Systems",
      "Surge Protection Devices",
    ],
    brands: ["Schneider Electric", "Legrand", "Eaton", "ABB"],
    applications: ["Industrial facilities", "Commercial buildings", "Data centres", "Mining operations"],
    benefits: [
      { title: "Reduced Downtime", value: "IEC-certified switchgear engineered for maximum fault interruption reliability in demanding industrial environments." },
      { title: "Energy Compliance", value: "Solutions aligned with the Ghana Grid Code and IEC standards ensuring safe, fully compliant electrical installations." },
      { title: "Certified Expertise", value: "Schneider Electric certified engineers providing design, supply, and commissioning support from first drawings to handover." },
      { title: "Single-Source Supply", value: "Complete LV/MV portfolio from circuit protection to energy meters — one supplier, one point of accountability." },
    ],
    bulletPoints: [
      "Authorised Schneider Electric distributor since 2009",
      "Full range of IEC-certified circuit protection devices in stock",
      "Fast delivery of LV/MV switchgear across Ghana",
      "Genuine products with full manufacturer warranty",
      "Energy audit and power quality analysis services",
      "Technical engineering support from certified specialists",
    ],
  },
  {
    slug: "automation",
    name: "Automation & Control",
    shortDescription: "Smart Industrial Automation",
    description:
      "From standalone machine control to integrated plant-wide SCADA systems, APT Ghana's automation engineers design, supply, and commission solutions that maximise throughput and minimise downtime. We are certified on leading PLC platforms and support the complete automation chain from sensing to actuation.",
    level: "group",
    displayOrder: 2,
    isFeatured: true,
    status: "active",
    products: [
      "Programmable Logic Controllers (PLCs)",
      "Human Machine Interfaces (HMIs)",
      "Variable Frequency Drives (VFDs)",
      "Servo Systems & Motion Control",
      "Industrial Sensors & Switches",
      "SCADA Systems",
      "Safety Controllers",
    ],
    brands: ["Schneider Electric", "Siemens", "Omron", "ABB", "ifm electronic", "Sick AG"],
    applications: ["Manufacturing lines", "Mining conveyors", "Water treatment", "Food & beverage"],
    benefits: [
      { title: "Maximised Throughput", value: "End-to-end automation solutions that boost production efficiency and reduce manual intervention on the plant floor." },
      { title: "Predictive Reliability", value: "Remote monitoring and diagnostic capabilities built into every system we commission reduce unplanned downtime." },
      { title: "Standards Compliance", value: "All systems designed to IEC 61131 and NAMUR standards for interoperability, safety, and ease of future expansion." },
      { title: "Turnkey Delivery", value: "Design, supply, installation, and commissioning managed end-to-end by our certified automation engineers." },
    ],
    bulletPoints: [
      "Certified on Schneider Electric, Siemens, and Omron PLC platforms",
      "Full SCADA system design, integration, and operator training",
      "IO-Link and Industrial Ethernet integration expertise",
      "Safety controller design to SIL 2/3 and PLd/PLe",
      "24/7 technical support and preventive maintenance contracts",
      "On-site commissioning included with every project",
    ],
  },
  {
    slug: "pneumatics",
    name: "Pneumatic Systems",
    shortDescription: "Precision Pneumatic Components",
    description:
      "Pneumatic systems are essential to high-speed, reliable industrial automation. APT Ghana supplies a comprehensive range of pneumatic components from precision Italian and German manufacturers, covering every element of the compressed air circuit from preparation to actuation.",
    level: "group",
    displayOrder: 3,
    isFeatured: true,
    status: "active",
    products: [
      "Directional Control Valves (5/2, 4/2, 3/2)",
      "Pneumatic Cylinders & Actuators",
      "Air Preparation Units (FRL)",
      "Solenoid Valves",
      "Manifolds & Valve Islands",
      "Pneumatic Fittings & Tubing",
      "Air Grippers",
    ],
    brands: ["Camozzi", "Festo", "Parker Hannifin", "EMC"],
    applications: ["Assembly lines", "Packaging machinery", "Material handling", "Process automation"],
    benefits: [
      { title: "Lower Air Consumption", value: "Energy-efficient valve and FRL technology that reduces compressed air demand by up to 30% versus legacy components." },
      { title: "Faster Cycle Times", value: "High-flow directional valves and precision cylinders engineered for maximum machine speed and responsiveness." },
      { title: "Extended Component Life", value: "Italian-engineered components built to continuous-duty industrial standards, minimising replacement frequency." },
      { title: "Fast Local Supply", value: "Comprehensive local stock of common valves, cylinders, and fittings — minimal lead times across Ghana." },
    ],
    bulletPoints: [
      "Authorised Camozzi pneumatic systems distributor",
      "Full circuit design from air preparation to actuation",
      "IP65+ rated components for harsh environments",
      "Custom manifold and valve island assemblies",
      "Stainless steel and food-grade variants available",
      "On-site troubleshooting and replacement support",
    ],
  },
  {
    slug: "power",
    name: "Power & Energy",
    shortDescription: "Reliable Power Infrastructure",
    description:
      "Power continuity is critical for data centres, healthcare, mining, and industrial processes. APT Ghana delivers complete power protection and energy management infrastructure — from compact UPS systems to large-scale three-phase industrial installations, and from distribution transformers to power quality analysers.",
    level: "group",
    displayOrder: 4,
    isFeatured: true,
    status: "active",
    products: [
      "UPS Systems (Online/Offline/Line-Interactive)",
      "Power Transformers (LV/MV)",
      "Energy Storage Systems",
      "Power Conditioners",
      "Energy Meters & Analysers",
      "Transfer Switches",
      "Capacitor Banks",
    ],
    brands: ["Schneider Electric", "Socomec", "ABB", "Eaton", "Fluke"],
    applications: ["Data centres", "Healthcare facilities", "Mining operations", "Utilities"],
    benefits: [
      { title: "Zero-Downtime Power", value: "Online double-conversion UPS systems delivering clean, uninterrupted power to critical loads around the clock." },
      { title: "Reduced Energy Costs", value: "Power factor correction and energy storage solutions that cut electricity bills and eliminate utility penalty charges." },
      { title: "Regulatory Compliance", value: "IEC 62040 certified equipment meeting all Ghana Energy Commission standards for safe commercial power installations." },
      { title: "Scalable Architecture", value: "Modular power systems that grow with your facility — from 1 kVA desktop UPS to multi-MW industrial installations." },
    ],
    bulletPoints: [
      "Authorised Socomec UPS and power switching distributor",
      "Three-phase and single-phase UPS solutions in stock",
      "Power quality analysis and harmonic mitigation services",
      "Battery management, testing, and replacement programmes",
      "Transformer selection and sizing support",
      "Emergency response for critical power failures",
    ],
  },
  {
    slug: "conveying",
    name: "Conveying Solutions",
    shortDescription: "Industrial Material Handling",
    description:
      "Conveying systems are the arteries of mining, ports, cement, and agricultural operations. APT Ghana is the authorised distributor for Provulco conveyor belting in West Africa, and stocks a comprehensive range of conveyor accessories to support maintenance and new projects across the region.",
    level: "group",
    displayOrder: 5,
    isFeatured: true,
    status: "active",
    products: [
      "Conveyor Belts (EP, Fabric, Steel Cord)",
      "Idler Rollers & Frames",
      "Drive Pulleys & Tail Pulleys",
      "Belt Fasteners & Splicing Materials",
      "Weighing Bridges & Scales",
      "Belt Alignment Devices",
      "Cleaning Systems",
    ],
    brands: ["Provulco", "NORD Drivesystems", "Robit", "Isenman"],
    applications: ["Mining & quarries", "Ports & terminals", "Cement plants", "Agricultural processing"],
    benefits: [
      { title: "Maximised Belt Life", value: "Premium EP and steel cord conveyor belts engineered for the abrasive, high-impact conditions of Ghanaian mining operations." },
      { title: "Reduced Maintenance", value: "Precision drive and tensioning systems that minimise belt slippage, idler wear, and unplanned conveyor outages." },
      { title: "West Africa's Fastest Supply", value: "As the only authorised Provulco distributor in West Africa, we hold local belt stock for rapid replacement." },
      { title: "Complete System Support", value: "From belt selection and drive sizing to on-site splicing, our engineers support your entire conveying system." },
    ],
    bulletPoints: [
      "Only authorised Provulco distributor in West Africa",
      "EP textile and steel cord belting held in stock",
      "Custom belt splicing and hot/cold vulcanising support",
      "Full range of idlers, pulleys, and conveyor accessories",
      "Belt tension and drive calculations on request",
      "Site surveys and conveyor condition assessments",
    ],
  },
  {
    slug: "safety",
    name: "Safety Systems",
    shortDescription: "IEC 62061 & ISO 13849 Compliant",
    description:
      "Machine safety is both a legal requirement and a moral responsibility. APT Ghana's safety portfolio enables customers to achieve the required Safety Integrity Level (SIL) or Performance Level (PL) for their machinery — from initial risk assessment through the selection and integration of safety-rated components.",
    level: "group",
    displayOrder: 6,
    isFeatured: true,
    status: "active",
    products: [
      "Safety Relays & Controllers",
      "Light Curtains & Safety Scanners",
      "Emergency Stop Devices",
      "Safety PLCs",
      "Two-Hand Controls",
      "Safety Gate Switches",
      "Risk Assessment Services",
    ],
    brands: ["Pilz", "Schneider Electric", "ABB", "Sick AG"],
    applications: ["Manufacturing machines", "Robotic cells", "Press & stamping", "Chemical plants"],
    benefits: [
      { title: "Legal Compliance", value: "Achieve required SIL and Performance Level ratings to meet Ghana Labour Act obligations and IEC 62061 machinery directives." },
      { title: "Reduced Incident Risk", value: "Comprehensive safety portfolio from risk assessment through certified component selection to full system validation." },
      { title: "Faster Certification", value: "Pre-validated safety architectures accelerate CE marking and machinery directive compliance timelines." },
      { title: "Expert Safety Engineering", value: "Pilz-certified safety engineers providing complete functional safety lifecycle support on every engagement." },
    ],
    bulletPoints: [
      "Authorised Pilz safety automation distributor",
      "Risk assessment and SISTEMA calculation support",
      "Safety relay and light curtain selection and sizing",
      "Complete safety PLC programming and validation",
      "IEC 62061 and ISO 13849 lifecycle documentation",
      "Annual safety audits and maintenance contracts",
    ],
  },
];

async function run() {
  await mongoose.connect(URI);
  console.log("Connected to MongoDB");

  for (const sol of solutions) {
    const result = await Category.updateOne(
      { slug: sol.slug },
      { $set: sol },
      { upsert: true }
    );
    const status = result.upsertedCount ? "created" : "updated";
    console.log(`  ${status}: ${sol.name} (${sol.slug})`);
  }

  console.log(`\nDone — ${solutions.length} solution groups seeded.`);
  await mongoose.disconnect();
}

run().catch((err) => { console.error(err); process.exit(1); });
