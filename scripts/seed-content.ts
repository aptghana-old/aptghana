/**
 * Seed industries and resources collections.
 * Run: tsx scripts/seed-content.ts
 * Safe to re-run: uses upsert on slug.
 */

import mongoose from "mongoose";
import "dotenv/config";

const URI = process.env.MONGODB_URI ?? "";
if (!URI) { console.error("MONGODB_URI not set"); process.exit(1); }

// ─── Minimal schemas (no @apt/db import to avoid TS path issues in plain tsx) ─

const MediaSchema = new mongoose.Schema({ url: String, alt: String }, { _id: false });
const SeoSchema = new mongoose.Schema({ title: String, description: String, keywords: [String] }, { _id: false });

const IndustrySchema = new mongoose.Schema({
  slug: String, name: String, tagline: String, shortDescription: String,
  challenge: String, solutions: [String], brands: [String], clients: String,
  image: MediaSchema, icon: String, accentColor: String,
  stats: [{ label: String, value: String, _id: false }],
  keyProducts: [String], isFeatured: Boolean, displayOrder: Number,
  status: String, seo: SeoSchema,
}, { timestamps: true, collection: "industries" });

const ResourceItemSchema = new mongoose.Schema({
  title: String, description: String, meta: String,
  downloadUrl: String, externalUrl: String, publishedAt: Date,
  tags: [String], displayOrder: Number,
});

const ResourceSchema = new mongoose.Schema({
  slug: String, type: String, title: String, tagline: String, intro: String,
  badge: String, items: [ResourceItemSchema],
  cta: { label: String, href: String, _id: false },
  image: MediaSchema, isFeatured: Boolean, displayOrder: Number, status: String,
}, { timestamps: true, collection: "resources" });

const Industry = mongoose.models.Industry ?? mongoose.model("Industry", IndustrySchema, "industries");
const Resource = mongoose.models.Resource ?? mongoose.model("Resource", ResourceSchema, "resources");

// ─── Industry seed data ────────────────────────────────────────────────────────

const industries = [
  {
    slug: "mining",
    name: "Mining & Minerals",
    tagline: "Powering Ghana's Mining Industry",
    shortDescription: "ATEX-rated equipment and conveyor systems for gold, bauxite, and manganese operations.",
    challenge: "Mining operations demand ruggedized equipment that performs in harsh environments — extreme heat, dust, vibration, and potentially explosive atmospheres. Standard industrial equipment often fails within months; only purpose-rated components survive the demands of a working mine. APT Ghana's engineers specify ATEX/IECEx certified equipment that meets the specific requirements of Ghana's gold, bauxite, and manganese sectors.",
    solutions: [
      "ATEX/IECEx explosion-proof motors",
      "Heavy-duty variable frequency drives",
      "Mining conveyor systems & belts",
      "Protection relays & switchgear",
      "Mine shaft hoisting controls",
      "Dewatering pump drives",
      "Predictive maintenance systems",
      "Hazardous area instrumentation",
    ],
    brands: ["WEG", "Schneider Electric", "Provulco", "ABB", "ifm electronic"],
    clients: "Active in Ghana's gold, bauxite, and manganese sectors — including operations in the Ashanti Region, Brong-Ahafo, and the Western Region.",
    icon: "⛏",
    accentColor: "#F59E0B",
    displayOrder: 1,
    isFeatured: true,
    status: "active",
    keyProducts: ["ATEX Motors", "VFDs", "Conveyor Belts", "Mining Switchgear"],
    stats: [
      { label: "Projects delivered", value: "80+" },
      { label: "Mine operations served", value: "12+" },
    ],
  },
  {
    slug: "oil-gas",
    name: "Oil & Gas",
    tagline: "Instrumentation for Upstream & Downstream",
    shortDescription: "Intrinsically safe instruments and ATEX/IECEx certified equipment for upstream and downstream operations.",
    challenge: "Offshore and onshore oil & gas facilities require intrinsically safe and explosion-proof certified equipment meeting ATEX and IECEx standards. Non-compliant equipment in hazardous areas creates serious risk of ignition and places operations outside regulatory requirements. APT Ghana supplies from manufacturers with certified Ex documentation and full traceability.",
    solutions: [
      "Intrinsically safe field instruments",
      "Ex-rated motors & variable speed drives",
      "Process control valves & positioners",
      "Pipeline monitoring & leak detection",
      "Emergency shutdown systems (ESD)",
      "SCADA & DCS integration",
      "Gas detection systems",
      "Hazardous area panel building",
    ],
    brands: ["Schneider Electric", "ABB", "ifm electronic", "Endress+Hauser", "WEG"],
    clients: "Supporting West Africa's upstream and downstream operations, including Ghana's offshore gas sector and refinery infrastructure.",
    icon: "🛢",
    accentColor: "#6366F1",
    displayOrder: 2,
    isFeatured: true,
    status: "active",
    keyProducts: ["Ex-rated Instruments", "ESD Systems", "SCADA", "Ex Motors"],
    stats: [
      { label: "ATEX-certified products", value: "500+" },
      { label: "Years in hazardous areas", value: "12+" },
    ],
  },
  {
    slug: "manufacturing",
    name: "Manufacturing",
    tagline: "Automation for Modern Production",
    shortDescription: "PLC automation, VFDs, pneumatic systems, and energy management for production plants.",
    challenge: "Manufacturers in Ghana face pressure to increase throughput, reduce waste, and maintain quality while controlling energy costs. Many production lines operate on manual processes or ageing electromechanical controls that limit productivity and create quality inconsistency. APT Ghana's automation engineers design and commission control systems that transform production performance.",
    solutions: [
      "PLC-based production line control",
      "Variable speed conveyor drives",
      "Pneumatic pick-and-place systems",
      "Quality inspection & machine vision",
      "Energy management systems",
      "Compressed air optimization",
      "Machine safety systems",
      "Production data & OEE monitoring",
    ],
    brands: ["Schneider Electric", "Camozzi", "Omron", "Festo", "Sick AG", "WAGO"],
    clients: "Serving FMCG, textile, plastics, and food processing plants across Greater Accra, Tema, and Kumasi.",
    icon: "🏭",
    accentColor: "#0EA5E9",
    displayOrder: 3,
    isFeatured: true,
    status: "active",
    keyProducts: ["PLCs", "VFDs", "Pneumatic Systems", "HMIs", "Safety Systems"],
    stats: [
      { label: "Production lines automated", value: "60+" },
      { label: "Average OEE improvement", value: "18%" },
    ],
  },
  {
    slug: "energy",
    name: "Power & Energy",
    tagline: "Grid Protection & Power Quality",
    shortDescription: "MV/LV switchgear, protection relays, and power quality solutions for utilities and IPPs.",
    challenge: "Ghana's energy sector requires reliable switchgear, monitoring systems, and protection equipment for generation, transmission, and distribution assets. Grid instability, harmonic distortion, and ageing infrastructure create significant operational and safety challenges that require specialist electrical engineering knowledge.",
    solutions: [
      "MV/LV switchgear & panelboards",
      "Protection relays & intelligent IEDs",
      "Power quality analysers & metering",
      "Capacitor banks for PF correction",
      "Harmonic filtering systems",
      "Energy monitoring & reporting",
      "UPS systems for critical loads",
      "Substation automation (SCADA)",
    ],
    brands: ["Schneider Electric", "ABB", "Socomec", "Eaton", "Fluke"],
    clients: "Supporting power utilities, independent power producers (IPPs), and large industrial power consumers across Ghana.",
    icon: "⚡",
    accentColor: "#84CC16",
    displayOrder: 4,
    isFeatured: false,
    status: "active",
    keyProducts: ["Protection Relays", "Switchgear", "Power Analysers", "Capacitor Banks"],
    stats: [
      { label: "Substations equipped", value: "25+" },
      { label: "Energy saved for clients", value: "GHS 12M+" },
    ],
  },
  {
    slug: "water",
    name: "Water & Wastewater",
    tagline: "SCADA-Ready Water Solutions",
    shortDescription: "Variable speed pump drives, dosing controls, and SCADA for water treatment facilities.",
    challenge: "Water utilities need reliable variable speed drives, chemical dosing systems, and remote monitoring to manage treatment plants efficiently. Manual operation of pump stations and dosing systems leads to inconsistent water quality and high energy consumption. APT Ghana delivers turnkey control solutions for municipal and industrial water treatment.",
    solutions: [
      "Pump variable frequency drives",
      "Chemical dosing pump controls",
      "SCADA & remote telemetry systems",
      "Level, flow & pressure instrumentation",
      "Water quality sensors & analysers",
      "Aeration control systems",
      "Energy management for pumping",
      "Remote monitoring panels",
    ],
    brands: ["Schneider Electric", "Omron", "ifm electronic", "Endress+Hauser", "WAGO"],
    clients: "Supporting GWCL, district water authorities, and industrial water treatment facilities across Ghana.",
    icon: "💧",
    accentColor: "#06B6D4",
    displayOrder: 5,
    isFeatured: false,
    status: "active",
    keyProducts: ["Pump VFDs", "SCADA", "Water Quality Sensors", "Dosing Controls"],
    stats: [
      { label: "Water plants served", value: "18+" },
      { label: "Daily capacity managed", value: "500,000 m³" },
    ],
  },
  {
    slug: "ports",
    name: "Ports & Logistics",
    tagline: "Heavy-Duty Port Electrification",
    shortDescription: "Container crane drives, conveyor controls, and port electrical infrastructure for 24/7 operations.",
    challenge: "Port operations require heavy-duty crane drives, reliable conveyor systems, and robust electrical infrastructure for 24/7 operations. Equipment failures cause vessel delays, demurrage costs, and supply chain disruption — making reliability non-negotiable. APT Ghana supplies and commissions port-grade electrical and automation equipment with rapid local support.",
    solutions: [
      "Container crane hoist & travel drives",
      "Ship-to-shore crane electrification",
      "Conveyor & stacker drive systems",
      "Port vessel power supply (OPS)",
      "Port lighting & control systems",
      "Predictive maintenance & monitoring",
      "Port safety & access control",
      "Emergency power systems",
    ],
    brands: ["WEG", "ABB", "Schneider Electric", "NORD Drivesystems", "Socomec"],
    clients: "Active at Tema Port (GPHA), Takoradi Port, and private logistics terminals across Ghana.",
    icon: "🚢",
    accentColor: "#8B5CF6",
    displayOrder: 6,
    isFeatured: false,
    status: "active",
    keyProducts: ["Crane Drives", "Port Conveyors", "Shore Power", "Port Lighting"],
    stats: [
      { label: "Cranes electrified", value: "40+" },
      { label: "Ports served in West Africa", value: "4" },
    ],
  },
  {
    slug: "food-beverage",
    name: "Food & Beverage",
    tagline: "Hygienic Automation Solutions",
    shortDescription: "IP69K-rated components, washdown sensors, and clean-in-place automation for food processing.",
    challenge: "Food processing demands IP69K-rated hygienic components, clean-in-place compatibility, and compliance with food safety standards. Standard industrial equipment harbours bacteria and fails under high-pressure washdown conditions, creating hygiene and safety risks. APT Ghana specifies only food-grade rated components for processing environments.",
    solutions: [
      "IP69K-rated drives & motors",
      "Stainless steel pneumatic cylinders",
      "Hygienic valve manifolds & fittings",
      "Clean-in-place (CIP) automation",
      "Temperature & flow monitoring",
      "Washdown-rated sensors & switches",
      "Conveyor systems for food lines",
      "Refrigeration & cold room controls",
    ],
    brands: ["Festo", "Camozzi", "WEG", "ifm electronic", "Sick AG", "WAGO"],
    clients: "Serving Ghana's FMCG manufacturers, beverage producers, dairy processors, and agro-industrial facilities.",
    icon: "🍶",
    accentColor: "#EC4899",
    displayOrder: 7,
    isFeatured: false,
    status: "active",
    keyProducts: ["IP69K Drives", "Hygienic Pneumatics", "CIP Automation", "Washdown Sensors"],
    stats: [
      { label: "Food factories automated", value: "30+" },
      { label: "Compliance standards met", value: "ISO 22000, GMP" },
    ],
  },
  {
    slug: "construction",
    name: "Construction & Infrastructure",
    tagline: "Power for Large-Scale Projects",
    shortDescription: "Temporary power distribution, tower crane electrification, and site safety for construction projects.",
    challenge: "Construction projects need flexible temporary power distribution, robust site safety systems, and reliable electrical infrastructure. Inadequate site power leads to project delays, equipment damage, and safety incidents on Ghana's fast-growing construction sites. APT Ghana supplies everything from temporary distribution boards to permanent building electrical infrastructure.",
    solutions: [
      "Temporary power distribution boards",
      "Site power generation & distribution",
      "Tower crane electrification & control",
      "Portable switchgear & transformers",
      "Site lighting systems",
      "Earthing, bonding & surge protection",
      "Building management system (BMS)",
      "Permanent LV distribution systems",
    ],
    brands: ["Schneider Electric", "Legrand", "Eaton", "Rittal", "ABB"],
    clients: "Supporting major infrastructure projects, commercial real estate, and hospitality developments across Ghana.",
    icon: "🏗",
    accentColor: "#F97316",
    displayOrder: 8,
    isFeatured: false,
    status: "active",
    keyProducts: ["Temporary Distribution", "Crane Electrification", "Site Switchgear", "BMS"],
    stats: [
      { label: "Projects powered", value: "120+" },
      { label: "MW of site capacity managed", value: "85+" },
    ],
  },
];

// ─── Resource seed data ────────────────────────────────────────────────────────

const resources = [
  {
    slug: "library",
    type: "library",
    title: "Technical Library",
    tagline: "Datasheets, Manuals & Engineering Drawings",
    badge: "Datasheets & Manuals",
    intro: "Access technical documentation for APT Ghana's full product catalogue. Download datasheets, installation manuals, wiring diagrams, and engineering drawings from our partner manufacturers. Our technical library is maintained by our applications engineering team and updated whenever manufacturers release new documentation.",
    items: [
      {
        title: "Schneider Electric Acti 9 Series — Full Range Datasheet",
        description: "Complete datasheet and installation guide for the Acti 9 circuit breaker and RCCB range — iC60, iC60N, iC60H, iDPN, iRN. Includes tripping curves, selectivity tables, and accessories listing.",
        meta: "PDF · 4.2 MB · Updated Q1 2024",
        tags: ["Schneider Electric", "Circuit Breakers", "LV Protection"],
        displayOrder: 1,
      },
      {
        title: "WEG W22 Motor Technical Catalogue",
        description: "Full performance curves, mounting dimensions, efficiency data (IE2/IE3/IE4), and motor selection guide for the W22 NEMA/IEC frame motor range from 0.18 kW to 375 kW.",
        meta: "PDF · 8.7 MB · Full Range",
        tags: ["WEG", "Motors", "IE3"],
        displayOrder: 2,
      },
      {
        title: "Camozzi Series 9 Pneumatic Valves — Technical Reference",
        description: "Technical specifications, flow rates (Kv values), port configurations, solenoid options, and manifold assembly guide for the Series 9 directional control valve range.",
        meta: "PDF · 2.1 MB · Series 9",
        tags: ["Camozzi", "Pneumatics", "Valves"],
        displayOrder: 3,
      },
      {
        title: "Schneider ATV630 Variable Drive — Programming Manual",
        description: "Complete programming, commissioning, and troubleshooting guide for the ATV630 variable frequency drive. Includes parameter tables, application functions, and communication bus wiring.",
        meta: "PDF · 12.4 MB · v2.0",
        tags: ["Schneider Electric", "VFD", "Drives"],
        displayOrder: 4,
      },
      {
        title: "WEG CFW500 Compact Inverter — User Guide",
        description: "Quick-start guide and full parameter manual for the CFW500 compact frequency inverter. Covers HMI operation, communication modules, and application examples.",
        meta: "PDF · 5.8 MB · All Variants",
        tags: ["WEG", "VFD", "Compact Drives"],
        displayOrder: 5,
      },
      {
        title: "Provulco EP Conveyor Belting — Technical Specification",
        description: "Technical properties, load ratings, tensile strength data, and selection tables for EP multi-ply conveyor belting. Includes cover grades (M, N, S) and application suitability guide.",
        meta: "PDF · 1.9 MB · EP Range",
        tags: ["Provulco", "Conveyor", "Mining"],
        displayOrder: 6,
      },
    ],
    cta: { label: "Request Specific Documentation", href: "/contact" },
    displayOrder: 1,
    isFeatured: true,
    status: "active",
  },
  {
    slug: "case-studies",
    type: "case-studies",
    title: "Case Studies",
    tagline: "Real Projects. Measurable Results.",
    badge: "Project Outcomes",
    intro: "APT Ghana has delivered hundreds of projects across Ghana's industrial sectors since 2009. These case studies highlight how we helped our clients solve real operational challenges with the right technology — from gold mine conveyor upgrades to water treatment automation and food processing modernisation.",
    items: [
      {
        title: "Gold Mine Conveyor Drive Upgrade — Ashanti Region",
        description: "Replaced ageing direct-on-line motor starters with WEG VFDs on a primary ore conveyor at a major gold mine in the Ashanti Region. The VFD upgrade eliminated belt slip on startup, reduced peak current demand, and cut energy consumption by 22%, delivering a 14-month payback period.",
        meta: "Mining · 2023 · ROI 14 months",
        tags: ["Mining", "VFD", "Energy Saving", "WEG"],
        displayOrder: 1,
      },
      {
        title: "Water Treatment Plant SCADA Automation — Greater Accra",
        description: "Supplied and commissioned Schneider Electric M340 PLCs, ATV drives, and InTouch SCADA for a 50,000 m³/day municipal water treatment facility. The project automated dosing, aeration, and pump station control, replacing a fully manual operation and reducing chemical waste by 30%.",
        meta: "Water & Wastewater · 2022",
        tags: ["Water", "SCADA", "Schneider Electric", "Automation"],
        displayOrder: 2,
      },
      {
        title: "FMCG Production Line Modernisation — Tema Industrial Area",
        description: "Upgraded a 20-year-old pneumatic control system on a packaging line with Camozzi Series 9 manifold valves and a Schneider M241 PLC/HMI system. The project increased Overall Equipment Effectiveness (OEE) from 67% to 84% and reduced maintenance calls by 60%.",
        meta: "Manufacturing · 2023 · OEE +17%",
        tags: ["Manufacturing", "Camozzi", "Pneumatics", "PLC"],
        displayOrder: 3,
      },
      {
        title: "Tema Port Container Crane Drive Replacement",
        description: "Supplied and commissioned heavy-duty WEG CFW11 variable speed drives for container handling crane hoist and gantry motions at Tema Port. The project improved energy efficiency, eliminated mechanical shock loads from direct starts, and reduced crane maintenance downtime by 45%.",
        meta: "Ports & Logistics · 2021",
        tags: ["Ports", "Crane Drives", "WEG", "Energy"],
        displayOrder: 4,
      },
      {
        title: "Brewery Compressed Air Audit & Upgrade",
        description: "Performed a full compressed air system audit at a major Ghanaian brewery and installed Camozzi FRL units, leak detection system, and optimised manifold layouts. The project reduced compressed air losses by 35%, cutting the compressor's annual energy bill by GHS 180,000.",
        meta: "Food & Beverage · 2022 · GHS 180k annual saving",
        tags: ["Food & Beverage", "Compressed Air", "Camozzi", "Energy Audit"],
        displayOrder: 5,
      },
      {
        title: "Construction Site Temporary Power Distribution — Accra CBD",
        description: "Supplied and installed Schneider Electric temporary distribution boards, RCDs, and site protection equipment for a 40-storey commercial development in central Accra. The project involved three phases of temporary power through the construction programme, serving up to 85 sub-contractors simultaneously.",
        meta: "Construction · 2023",
        tags: ["Construction", "Temporary Power", "Schneider Electric"],
        displayOrder: 6,
      },
    ],
    cta: { label: "Discuss Your Project", href: "/contact" },
    displayOrder: 2,
    isFeatured: true,
    status: "active",
  },
  {
    slug: "news",
    type: "news",
    title: "News & Insights",
    tagline: "Industrial Technology News from West Africa",
    badge: "News & Articles",
    intro: "Stay current with the latest developments in industrial automation, electrical distribution, and manufacturing technology — with a focus on Ghana and West Africa. APT Ghana's team publishes technical insights, product updates, and industry news relevant to engineers and procurement managers in our region.",
    items: [
      {
        title: "Schneider Electric Awards APT Ghana Marketing Excellence 2024",
        description: "APT Ghana has been recognised by Schneider Electric with the Marketing Excellence Award for Africa, acknowledging outstanding customer engagement and channel development across West Africa. The award was presented at Schneider Electric's annual partner conference.",
        meta: "April 2024",
        tags: ["Awards", "Schneider Electric", "Partnership"],
        publishedAt: new Date("2024-04-15"),
        displayOrder: 1,
      },
      {
        title: "New WEG W22 IE3 Stock Arrival — Accra Warehouse",
        description: "APT Ghana has taken delivery of a major consignment of WEG W22 IE3 premium efficiency motors in frame sizes from 71 to 200, now available from stock for immediate delivery. IE3 motors offer 15–25% energy savings versus IE1 equivalents at equivalent price points.",
        meta: "March 2024",
        tags: ["WEG", "Motors", "Stock", "IE3"],
        publishedAt: new Date("2024-03-10"),
        displayOrder: 2,
      },
      {
        title: "Ghana Mining Week 2024 — APT Ghana Exhibiting",
        description: "APT Ghana will be exhibiting at Ghana Mining Week in Accra, showcasing our ATEX-rated motor and drive solutions for the mining sector. Visit our stand to discuss your ATEX equipment requirements and see live demonstrations of WEG Ex-rated motors and Schneider mining drives.",
        meta: "February 2024",
        tags: ["Events", "Mining", "ATEX", "Exhibition"],
        publishedAt: new Date("2024-02-05"),
        displayOrder: 3,
      },
      {
        title: "Camozzi Launches Updated Series 9 Valve Range",
        description: "Camozzi Automation has released the updated Series 9 directional control valve with improved Kv flow rates (+12%), expanded solenoid options, and enhanced manifold connectivity. APT Ghana holds full local stock of the new series and can ship within 24 hours of confirmed order.",
        meta: "January 2024",
        tags: ["Camozzi", "Pneumatics", "Product Launch"],
        publishedAt: new Date("2024-01-20"),
        displayOrder: 4,
      },
      {
        title: "Energy Efficiency Drive: APT Ghana IE3 Motor Campaign",
        description: "APT Ghana is running a structured campaign to help Ghanaian manufacturers upgrade from IE1 to IE3 motors. Based on actual in-market electricity tariffs, IE3 motor payback periods are typically 18–24 months for continuously-running applications. Our team can perform an energy audit and produce a business case for your facility.",
        meta: "December 2023",
        tags: ["Energy Efficiency", "Motors", "IE3", "Campaign"],
        publishedAt: new Date("2023-12-01"),
        displayOrder: 5,
      },
      {
        title: "APT Ghana Partner of the Year — Schneider Electric Ghana 2021",
        description: "APT Ghana was awarded Schneider Electric Partner of the Year for Ghana in 2021, recognising outstanding performance in growing the Schneider Electric portfolio across West Africa. This award reflects our technical competency, customer service levels, and commitment to Schneider's channel excellence programme.",
        meta: "January 2022",
        tags: ["Awards", "Schneider Electric", "Partnership"],
        publishedAt: new Date("2022-01-15"),
        displayOrder: 6,
      },
    ],
    cta: { label: "Subscribe to Updates", href: "/contact" },
    displayOrder: 3,
    isFeatured: false,
    status: "active",
  },
  {
    slug: "training",
    type: "training",
    title: "Product Training",
    tagline: "Manufacturer-Certified Technical Training in Ghana",
    badge: "Webinars & Certifications",
    intro: "APT Ghana offers manufacturer-certified product training programmes for engineers, maintenance technicians, and operators. Our training is delivered by certified specialists and covers commissioning, operation, and maintenance of industrial equipment. All programmes are available at our Accra training facility and can be arranged on-site for larger groups.",
    items: [
      {
        title: "Schneider Electric Variable Drive Commissioning",
        description: "Hands-on training covering ATV212, ATV320, and ATV630 drive selection, parameter setting, and fault diagnosis. Participants leave with the skills to commission drives independently. Suitable for maintenance engineers and automation technicians. Includes Schneider Electric attendance certificate.",
        meta: "1 Day · Accra · Max 8 participants",
        tags: ["Drives", "Schneider Electric", "VFD", "Commissioning"],
        displayOrder: 1,
      },
      {
        title: "WEG Motor Selection, Installation & Maintenance",
        description: "Technical training on IE2/IE3/IE4 motor selection, correct installation practices, routine maintenance schedules, and insulation resistance testing. Includes practical sessions with motors at our workshop. Suitable for electrical maintenance engineers and plant electricians.",
        meta: "Half Day · Accra · Max 12 participants",
        tags: ["WEG", "Motors", "Maintenance", "IE3"],
        displayOrder: 2,
      },
      {
        title: "Schneider Electric PLC Programming — Modicon M221/M241",
        description: "Introduction to Schneider Modicon M221 and M241 PLC programming using EcoStruxure Machine Expert Basic. Covers ladder logic, function blocks, digital/analogue I/O, and simple HMI configuration. Suitable for engineers new to PLC programming.",
        meta: "2 Days · Accra · Max 6 participants",
        tags: ["PLC", "Schneider Electric", "Automation", "Programming"],
        displayOrder: 3,
      },
      {
        title: "Camozzi Pneumatic Systems Design & Selection",
        description: "Pneumatic circuit design principles, component selection (valve, actuator, FRL sizing), valve island configuration, and air preparation system specification. Includes hands-on circuit assembly exercises using Camozzi Series 9 components. Suitable for mechanical and automation engineers.",
        meta: "1 Day · Accra · Max 10 participants",
        tags: ["Camozzi", "Pneumatics", "Design", "Selection"],
        displayOrder: 4,
      },
      {
        title: "Power Quality & Harmonic Distortion Workshop",
        description: "Understanding power quality issues — total harmonic distortion (THD), voltage sags and swells, power factor, and transient overvoltages — and how to select appropriate filtering, power factor correction, and UPS equipment. Suitable for electrical engineers and energy managers.",
        meta: "Half Day · Accra · Max 15 participants",
        tags: ["Power Quality", "Harmonics", "Energy Management"],
        displayOrder: 5,
      },
      {
        title: "ATEX/IECEx Hazardous Area Equipment Training",
        description: "Understanding ATEX zones and EPLs, IECEx certification, protection concepts (Ex d, Ex e, Ex ia), equipment selection, installation requirements, and inspection protocols for hazardous area applications in mining and oil & gas. Includes ATEX documentation review exercises.",
        meta: "1 Day · Accra · Max 12 participants",
        tags: ["ATEX", "IECEx", "Hazardous Area", "Mining", "Oil & Gas"],
        displayOrder: 6,
      },
    ],
    cta: { label: "Register for Training", href: "/contact" },
    displayOrder: 4,
    isFeatured: false,
    status: "active",
  },
  {
    slug: "cad",
    type: "cad",
    title: "CAD Downloads",
    tagline: "Engineering Drawings & 3D Models",
    badge: "2D & 3D Models",
    intro: "Download CAD drawings, 3D models, and dimension sheets for APT Ghana's key product lines. All files are provided in standard formats (DWG, STEP, PDF) for use in your engineering designs. Files are sourced directly from manufacturers and checked by our applications engineering team. Request additional drawings using the link below.",
    items: [
      {
        title: "Schneider Electric iC60 MCB — DWG & STEP",
        description: "2D outline drawing and 3D STEP model for the iC60 miniature circuit breaker range, covering 1P, 2P, 3P, and 4P configurations in all current ratings. Includes DIN rail mounting dimensions and terminal clearances.",
        meta: "DWG + STEP · Updated Q1 2024",
        tags: ["Schneider Electric", "MCB", "LV Protection", "DWG"],
        displayOrder: 1,
      },
      {
        title: "WEG W22 Motor Frame Dimensions — Full Range",
        description: "Certified IEC/NEMA dimension sheets for all W22 IE3 frame sizes from 71 to 355. Includes shaft end details (D/E/F dimensions), mounting hole positions, conduit entry dimensions, and weight tables.",
        meta: "PDF + DWG · All Frame Sizes",
        tags: ["WEG", "Motors", "Dimensions", "DWG"],
        displayOrder: 2,
      },
      {
        title: "Schneider ATV630 Drive — Outline & Panel Drawings",
        description: "Dimensional drawings for ATV630 drives from 0.75 kW to 200 kW. Includes panel cutout templates, cable entry details, and minimum clearance diagrams for panel installation.",
        meta: "DWG · 0.75–200 kW Range",
        tags: ["Schneider Electric", "ATV630", "VFD", "Panel Layout"],
        displayOrder: 3,
      },
      {
        title: "Camozzi Series 9 Manifold Assemblies — STEP Models",
        description: "3D STEP models for Series 9 valve manifold assemblies in 2 to 8-station configurations, including sub-base types (individual outlets, common supply) and all standard solenoid orientations.",
        meta: "STEP · 2–8 Station Configurations",
        tags: ["Camozzi", "Pneumatics", "Manifolds", "STEP"],
        displayOrder: 4,
      },
      {
        title: "Schneider Prisma G/Plus Distribution Board",
        description: "3D assembly models, wiring space dimensions, and busbar configuration drawings for Prisma G and Prisma Plus distribution panel ranges from 250 A to 6300 A.",
        meta: "STEP + DWG · Full Prisma Range",
        tags: ["Schneider Electric", "Prisma", "Switchboard", "LV"],
        displayOrder: 5,
      },
      {
        title: "WEG CFW500 Inverter — Panel Integration Drawing",
        description: "Outline dimensions, panel cutout template, and recommended installation clearances for CFW500 compact drive. Available for all frame sizes (B, C, D, E). Includes option module positions.",
        meta: "PDF + DWG · All Frame Sizes",
        tags: ["WEG", "CFW500", "VFD", "Panel Integration"],
        displayOrder: 6,
      },
    ],
    cta: { label: "Request Additional Drawings", href: "/contact" },
    displayOrder: 5,
    isFeatured: false,
    status: "active",
  },
  {
    slug: "certifications",
    type: "certifications",
    title: "Certifications",
    tagline: "Our Credentials & Authorizations",
    badge: "Official Documents",
    intro: "APT Ghana holds official authorizations and certifications from our OEM partners and regulatory bodies. These credentials ensure that our customers receive genuine products, valid manufacturer warranties, and certified technical support. The following documentation is available for verification by procurement teams, project owners, and regulatory authorities.",
    items: [
      {
        title: "Schneider Electric — Official Certified Electrical Distributor",
        description: "APT Ghana is the official Certified Electrical Distributor of Schneider Electric in Ghana, authorised to supply the full Schneider Electric portfolio with OEM warranty and local technical support. This authorisation covers all Schneider product lines including LV/MV switchgear, automation, and home & distribution.",
        meta: "Current · Republic of Ghana",
        tags: ["Schneider Electric", "Official Distributor", "Certification"],
        displayOrder: 1,
      },
      {
        title: "Schneider Electric Partner of the Year — Ghana 2021",
        description: "Awarded by Schneider Electric for outstanding partner performance, technical competency, and channel development in Ghana. This award is presented annually to the top-performing partner in each country across Schneider Electric's global partner ecosystem.",
        meta: "2021 · Award · Schneider Electric Africa",
        tags: ["Schneider Electric", "Award", "Partner of the Year"],
        displayOrder: 2,
      },
      {
        title: "Schneider Electric Marketing Excellence Award — Africa 2024",
        description: "Recognised by Schneider Electric for exceptional marketing strategy, customer engagement, and brand representation across Africa. The Marketing Excellence Award acknowledges partners who have delivered measurable business impact through customer education and channel activation.",
        meta: "2024 · Award · Schneider Electric Africa",
        tags: ["Schneider Electric", "Award", "Marketing Excellence"],
        displayOrder: 3,
      },
      {
        title: "WEG — Certified Authorised Distributor",
        description: "APT Ghana is a WEG Certified Authorised Distributor, authorised to supply WEG motors, variable speed drives, and electrical equipment with full OEM warranty across Ghana and West Africa. Our technical staff hold WEG product training certifications.",
        meta: "Current · West Africa",
        tags: ["WEG", "Authorised Distributor", "Certification"],
        displayOrder: 4,
      },
      {
        title: "Camozzi Automation — Authorized Distributor",
        description: "APT Ghana is the authorized Camozzi Automation distributor for Ghana, supplying genuine Camozzi pneumatic components, valves, and systems with full technical support and OEM warranty. We hold comprehensive stock of Camozzi products in our Accra warehouse.",
        meta: "Current · Republic of Ghana",
        tags: ["Camozzi", "Pneumatics", "Authorised Distributor"],
        displayOrder: 5,
      },
      {
        title: "Ghana Standards Authority — Registered Supplier",
        description: "APT Ghana operates as a GSA-registered supplier and ensures all products supplied comply with applicable Ghana Standards Authority requirements and relevant international standards (IEC, CENELEC, CE, UL, ATEX, IECEx). We maintain up-to-date compliance documentation for all product categories.",
        meta: "Ongoing Compliance · Ghana Standards Authority",
        tags: ["GSA", "Ghana Standards", "Compliance", "IEC", "CE"],
        displayOrder: 6,
      },
    ],
    cta: { label: "Request Verification", href: "/contact" },
    displayOrder: 6,
    isFeatured: false,
    status: "active",
  },
];

// ─── Run ────────────────────────────────────────────────────────────────────────

async function main() {
  console.log("Connecting to MongoDB…");
  await mongoose.connect(URI);
  console.log("Connected.\n");

  // Seed industries
  let industryUpserted = 0;
  for (const data of industries) {
    await Industry.findOneAndUpdate({ slug: data.slug }, data, { upsert: true, new: true });
    industryUpserted++;
    console.log(`  ✓ Industry: ${data.name}`);
  }
  console.log(`\nIndustries: ${industryUpserted} upserted.\n`);

  // Seed resources
  let resourceUpserted = 0;
  for (const data of resources) {
    await Resource.findOneAndUpdate({ slug: data.slug }, data, { upsert: true, new: true });
    resourceUpserted++;
    console.log(`  ✓ Resource: ${data.title}`);
  }
  console.log(`\nResources: ${resourceUpserted} upserted.\n`);

  await mongoose.disconnect();
  console.log("Done.");
}

main().catch((err) => { console.error(err); process.exit(1); });
