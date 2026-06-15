/**
 * Seed script: admins, customers (users), orders, quotes
 *
 * Idempotent — skips documents that already exist (keyed by email / ref).
 *
 * Run:
 *   set -a && source apps/admin/.env.local && set +a
 *   tsx scripts/migrate/src/seed.ts
 */

import mongoose, { Types } from "mongoose";
import crypto from "crypto";
import "dotenv/config";

const URI = process.env.MONGODB_URI!;
if (!URI) throw new Error("MONGODB_URI not set");

/* ─── Schemas (minimal, strict:false keeps it flexible) ────────────────────── */
const S = (collection: string) =>
  mongoose.model(collection, new mongoose.Schema({}, { strict: false, timestamps: true }), collection);

/* ─── Helpers ────────────────────────────────────────────────────────────────── */

/** Deterministic bcrypt-like hash using PBKDF2 — no native binding needed */
function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 100_000, 64, "sha512").toString("hex");
  return `pbkdf2:${salt}:${hash}`;
}

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function daysAgo(n: number) {
  return new Date(Date.now() - n * 86_400_000);
}

/* ─── Reference product pool (sampled from products_v2) ───────────────────── */
type ProductRef = {
  id: string; sku: string; name: string; mpn: string;
  brand: string; price: number; currency: string; img?: string;
};

const PRODUCTS: ProductRef[] = [
  { id: "6a23eb6ee3922eaccd8e6a23", sku: "CMZ-358-955",             name: "MECHANICAL OP. VALVE LEVER 5/2 MONOSTABLE 1/8",  mpn: "CMZ-358-955",             brand: "camozzi",  price: 739.20,   currency: "USD" },
  { id: "6a23eb70e3922eaccd8e6a2c", sku: "CMZ-953-000-P11-23",      name: "SOLENOID VALVE 5/2 BISTABLE ISO 3",               mpn: "CMZ-953-000-P11-23",      brand: "camozzi",  price: 3276.00,  currency: "USD" },
  { id: "6a23eb71e3922eaccd8e6a35", sku: "CMZ-CST-232",             name: "REED SWITCH 3 WIRES 5-30V AC/DC PNP",             mpn: "CMZ-CST-232",             brand: "camozzi",  price: 512.40,   currency: "USD" },
  { id: "6a23eb73e3922eaccd8e6a3e", sku: "FIT-MCF-23-S",            name: "MINOR COUPLER PLUG FEMALE ZNDC 3/8",              mpn: "FIT-MCF-23-S",            brand: "sang-a",   price: 12.45,    currency: "USD" },
  { id: "6a23eb74e3922eaccd8e6a47", sku: "CMZ-MPL-12",              name: "TUBE CHANNEL MOUNT (BLUE) 12",                    mpn: "CMZ-MPL-12",              brand: "camozzi",  price: 66.87,    currency: "USD" },
  { id: "6a23eb75e3922eaccd8e6a50", sku: "FIT-PC-06-G01",           name: "MALE STRAIGHT FITTING 6MM 1/8",                  mpn: "FIT-PC-06-G01",           brand: "sang-a",   price: 16.95,    currency: "USD" },
  { id: "6a23eb77e3922eaccd8e6a59", sku: "FIT-PL-04-G02",           name: "MALE ELBOW FITTING 4MM 1/4",                     mpn: "FIT-PL-04-G02",           brand: "sang-a",   price: 27.00,    currency: "USD" },
  { id: "6a23eb78e3922eaccd8e6a62", sku: "FIT-PUC-06",              name: "UNION STRAIGHT FITTING 6MM",                     mpn: "FIT-PUC-06",              brand: "sang-a",   price: 15.75,    currency: "USD" },
  { id: "6a23eb7be3922eaccd8e6a74", sku: "CMZ-338-035",             name: "PNEUMATIC CTL VALVE 2.5BAR 3/2 MONOSTABLE 1/8",  mpn: "CMZ-338-035",             brand: "camozzi",  price: 666.96,   currency: "USD" },
  { id: "6a23eb82e3922eaccd8e6a9f", sku: "CMZ-63MP2C040A0160",      name: "CYLINDER BORE 40 STROKE 160MM 1/4",              mpn: "CMZ-63MP2C040A0160",      brand: "camozzi",  price: 2329.83,  currency: "USD" },
  { id: "6a23eb83e3922eaccd8e6aa7", sku: "CMZ-63MP2C063A0250",      name: "CYLINDER BORE 63 STROKE 250MM 3/8",              mpn: "CMZ-63MP2C063A0250",      brand: "camozzi",  price: 3693.48,  currency: "USD" },
  { id: "6a23eb86e3922eaccd8e6ab8", sku: "CMZ-G7K",                 name: "SOLENOID COIL 110VAC 50/60Hz",                   mpn: "CMZ-G7K",                 brand: "camozzi",  price: 241.58,   currency: "USD" },
  { id: "6a23eb87e3922eaccd8e6ac1", sku: "FIT-MHF-24-S",            name: "MINOR COUPLER SOCKET FEMALE ZNDC 1/2",           mpn: "FIT-MHF-24-S",            brand: "sang-a",   price: 74.25,    currency: "USD" },
  { id: "6a23eb89e3922eaccd8e6ac9", sku: "CMZ-MC202-R00",           name: "PRESSURE REGULATOR MC SERIES 1/2",               mpn: "CMZ-MC202-R00",           brand: "camozzi",  price: 1051.18,  currency: "USD" },
  { id: "6a23eb7ce3922eaccd8e6a7d", sku: "FIT-PL-10-G02",           name: "MALE ELBOW FITTING 10MM 1/4",                    mpn: "FIT-PL-10-G02",           brand: "sang-a",   price: 31.50,    currency: "USD" },
  { id: "6a23eb7ee3922eaccd8e6a86", sku: "FIT-PC-12-G02",           name: "MALE STRAIGHT FITTING 12MM 1/4",                 mpn: "FIT-PC-12-G02",           brand: "sang-a",   price: 33.75,    currency: "USD" },
];

/* ─── Ghanaian seed data ──────────────────────────────────────────────────── */
const GH_CITIES   = ["Accra", "Kumasi", "Takoradi", "Tamale", "Cape Coast", "Tema", "Sunyani", "Koforidua"];
const GH_REGIONS  = ["Greater Accra", "Ashanti", "Western", "Northern", "Central", "Eastern", "Brong-Ahafo"];
const COMPANIES   = [
  "Ghana National Petroleum Corp", "Volta River Authority", "Anglogold Ashanti",
  "Goldfields Ghana", "Abosso Goldfields", "Newmont Ghana", "Ghana Bauxite Co",
  "Tema Oil Refinery", "GRIDCO Ghana", "Accra Breweries",
  "PZ Cussons Ghana", "Nestlé Ghana", "Unilever Ghana", "Fan Milk Ghana",
  "Tullow Oil Ghana", "Chirano Gold Mines", "Ghana Manganese Co",
];
const FIRST_NAMES = ["Kwame","Kofi","Ama","Abena","Yaw","Kwesi","Akosua","Adwoa","Kwabena","Efua","Nana","Adjoa","Kojo","Esi","Fiifi","Akua","Yaa","Kweku","Aba","Kobby","Afua","Serwaa"];
const LAST_NAMES  = ["Asante","Mensah","Boateng","Owusu","Acheampong","Darko","Appiah","Asamoah","Frimpong","Opoku","Wiredu","Antwi","Poku","Twum","Agyei","Baffour","Kusi","Sarkodie","Amoako","Nyarko"];

function ghName() {
  return `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
}
function ghEmail(name: string, suffix = "") {
  return `${name.toLowerCase().replace(/\s+/g, ".")}${suffix}@${pick(["gmail.com","yahoo.com","hotmail.com","outlook.com"])}`;
}
function ghAddress(city?: string) {
  const c = city ?? pick(GH_CITIES);
  return {
    label: "Primary",
    line1: `${randInt(1, 99)} ${pick(["Industrial Area", "Ring Road", "Liberation Ave", "Spintex Road", "Tema Motorway", "Graphic Road", "Kokomlemle"])}`,
    city: c,
    region: pick(GH_REGIONS),
    country: "GH",
    isDefault: true,
  };
}

/* ─── Order item builder ──────────────────────────────────────────────────── */
function makeOrderItems(count: number) {
  const pool = [...PRODUCTS].sort(() => Math.random() - 0.5).slice(0, count);
  return pool.map((p) => {
    const qty = randInt(1, 5);
    const unit = parseFloat(p.price.toFixed(2));
    return {
      productId: new Types.ObjectId(p.id),
      sku: p.sku, name: p.name, mpn: p.mpn,
      brandSlug: p.brand,
      quantity: qty,
      unitPrice: unit,
      totalPrice: parseFloat((unit * qty).toFixed(2)),
      currency: p.currency,
    };
  });
}

function orderTotals(items: ReturnType<typeof makeOrderItems>) {
  const subtotal = parseFloat(items.reduce((s, i) => s + i.totalPrice, 0).toFixed(2));
  const tax      = parseFloat((subtotal * 0.125).toFixed(2));
  const shipping = subtotal > 1000 ? 0 : parseFloat((subtotal * 0.03 + 50).toFixed(2));
  const total    = parseFloat((subtotal + tax + shipping).toFixed(2));
  return { subtotal, tax, shipping, total };
}

/* ─── Main ───────────────────────────────────────────────────────────────── */
async function main() {
  await mongoose.connect(URI);
  console.log("Connected to MongoDB\n");

  const Admins  = S("admins_v2");
  const Users   = S("users_v2");
  const Orders  = S("orders_v2");
  const Quotes  = S("quotes_v2");

  /* ── 1. Admin users ──────────────────────────────────────────────────── */
  console.log("── Seeding admin users ──────────────────────────");
  const ADMINS = [
    { username: "admin",   email: "admin@aptghana.com",      name: "APT Admin",         role: "super_admin" },
    { username: "manager", email: "manager@aptghana.com",    name: "Kwame Boateng",      role: "manager" },
    { username: "sales1",  email: "sales1@aptghana.com",     name: "Ama Mensah",         role: "editor" },
    { username: "sales2",  email: "sales2@aptghana.com",     name: "Kofi Asante",        role: "editor" },
    { username: "support", email: "support@aptghana.com",    name: "Abena Owusu",        role: "support" },
    { username: "viewer",  email: "viewer@aptghana.com",     name: "Yaw Acheampong",     role: "viewer" },
  ];
  for (const a of ADMINS) {
    const exists = await Admins.findOne({ email: a.email }).lean();
    if (exists) { console.log(`  skip  ${a.email}`); continue; }
    await Admins.create({ ...a, passwordHash: hashPassword("Admin1234!"), status: "active", mfaEnabled: false });
    console.log(`  ✓     ${a.email} (${a.role})`);
  }

  /* ── 2. Customers (users_v2) ─────────────────────────────────────────── */
  console.log("\n── Seeding customers ────────────────────────────");
  const customerDefs = [
    // Named accounts — procurement / engineering at real Ghanaian companies
    { name: "Emmanuel Darko",    email: "e.darko@vra.gov.gh",         company: "Volta River Authority",        businessType: "engineer",     accountType: "business" },
    { name: "Akosua Frimpong",   email: "a.frimpong@gnpcghana.com",   company: "Ghana National Petroleum Corp",businessType: "procurement",  accountType: "business" },
    { name: "Kwabena Appiah",    email: "k.appiah@newmontgh.com",     company: "Newmont Ghana",                businessType: "engineer",     accountType: "business" },
    { name: "Esi Asamoah",       email: "esi.asamoah@goldfields.com", company: "Goldfields Ghana",             businessType: "procurement",  accountType: "business" },
    { name: "Nana Wiredu",       email: "n.wiredu@anglogold.com",     company: "Anglogold Ashanti",            businessType: "procurement",  accountType: "business" },
    { name: "Adwoa Opoku",       email: "adwoa.opoku@tor.com.gh",     company: "Tema Oil Refinery",            businessType: "engineer",     accountType: "business" },
    { name: "Fiifi Twum",        email: "f.twum@gridco.com.gh",       company: "GRIDCO Ghana",                 businessType: "engineer",     accountType: "business" },
    { name: "Yaa Sarkodie",      email: "yaa.sarkodie@gmail.com",     company: undefined,                      businessType: "contractor",   accountType: "personal" },
    { name: "Kojo Antwi",        email: "kojo.antwi@hotmail.com",     company: undefined,                      businessType: "end-user",     accountType: "personal" },
    { name: "Adjoa Baffour",     email: "adjoa.baffour@yahoo.com",    company: "Accra Breweries",              businessType: "engineer",     accountType: "business" },
    { name: "Kobby Poku",        email: "k.poku@abosso.com",          company: "Abosso Goldfields",            businessType: "procurement",  accountType: "business" },
    { name: "Afua Kusi",         email: "afua.kusi@outlook.com",      company: undefined,                      businessType: "reseller",     accountType: "personal" },
  ];

  // Plus 8 randomised walk-in customers
  for (let i = 0; i < 8; i++) {
    const n = ghName();
    customerDefs.push({
      name: n,
      email: ghEmail(n, `_${i}`),
      company: Math.random() > 0.5 ? pick(COMPANIES) : undefined,
      businessType: pick(["contractor","engineer","procurement","reseller","end-user"]),
      accountType: Math.random() > 0.4 ? "business" : "personal",
    });
  }

  const createdUsers: Array<{ _id: Types.ObjectId; email: string; name: string }> = [];
  for (const u of customerDefs) {
    let doc = await Users.findOne({ email: u.email }).lean() as { _id: Types.ObjectId } | null;
    if (doc) {
      console.log(`  skip  ${u.email}`);
      createdUsers.push({ _id: doc._id, email: u.email, name: u.name });
      continue;
    }
    const created = await Users.create({
      email: u.email,
      passwordHash: hashPassword("Customer1234!"),
      emailVerified: Math.random() > 0.3,
      name: u.name,
      phone: `+23320${randInt(1000000, 9999999)}`,
      accountType: u.accountType,
      company: u.company,
      businessType: u.businessType,
      addresses: [ghAddress()],
      favorites: [],
      orderIds: [],
      quoteIds: [],
      status: "active",
      mfaEnabled: false,
    });
    createdUsers.push({ _id: created._id as Types.ObjectId, email: u.email, name: u.name });
    console.log(`  ✓     ${u.email}`);
  }

  /* ── 3. Orders ───────────────────────────────────────────────────────── */
  console.log("\n── Seeding orders ───────────────────────────────");

  const ORDER_STATUSES = ["pending","confirmed","processing","shipped","delivered","delivered","delivered","cancelled"] as const;

  let orderCounter = 1;
  // Count existing orders to offset ref counter
  const existingCount = await Orders.countDocuments({});
  orderCounter = existingCount + 1;

  const ordersToCreate = 30;
  let created = 0;

  for (let i = 0; i < ordersToCreate; i++) {
    const ref = `APT-ORD-${String(orderCounter).padStart(5, "0")}`;
    const exists = await Orders.findOne({ ref }).lean();
    if (exists) { orderCounter++; continue; }

    const user = pick(createdUsers);
    const items = makeOrderItems(randInt(1, 4));
    const { subtotal, tax, shipping, total } = orderTotals(items);
    const status = pick(ORDER_STATUSES);
    const createdAt = daysAgo(randInt(0, 90));

    const order: Record<string, unknown> = {
      ref,
      userId: user._id,
      guest: { name: user.name, email: user.email, phone: `+23320${randInt(1000000, 9999999)}` },
      items,
      subtotal, tax, shipping, total,
      currency: "USD",
      status,
      shippingAddress: ghAddress(),
      paymentRef: `PAY-${crypto.randomBytes(8).toString("hex").toUpperCase()}`,
      paymentMethod: pick(["card", "mobile_money", "bank_transfer"]),
      createdAt,
      updatedAt: new Date(createdAt.getTime() + randInt(0, 3) * 86_400_000),
    };

    if (status === "shipped" || status === "delivered") {
      order.trackingNumber = `GH${randInt(100000000, 999999999)}`;
    }

    await Orders.create(order);
    console.log(`  ✓  ${ref}  ${status.padEnd(12)}  ${user.name}`);
    orderCounter++;
    created++;
  }
  console.log(`  → ${created} orders created`);

  /* ── 4. Quotes ───────────────────────────────────────────────────────── */
  console.log("\n── Seeding quotes ───────────────────────────────");

  const QUOTE_STATUSES = ["pending","pending","reviewing","quoted","accepted","accepted","declined","expired"] as const;

  let quoteCounter = 1;
  const existingQuotes = await Quotes.countDocuments({});
  quoteCounter = existingQuotes + 1;

  const quotesToCreate = 20;
  let quotesCreated = 0;

  for (let i = 0; i < quotesToCreate; i++) {
    const ref = `APT-RFQ-${String(quoteCounter).padStart(5, "0")}`;
    const exists = await Quotes.findOne({ ref }).lean();
    if (exists) { quoteCounter++; continue; }

    const user = pick(createdUsers);
    const status = pick(QUOTE_STATUSES);
    const itemCount = randInt(2, 6);
    const pool = [...PRODUCTS].sort(() => Math.random() - 0.5).slice(0, itemCount);
    const createdAt = daysAgo(randInt(0, 120));
    const expiresAt = new Date(createdAt.getTime() + 30 * 86_400_000);

    const quoteItems = pool.map((p) => ({
      productId: new Types.ObjectId(p.id),
      sku: p.sku,
      description: p.name,
      quantity: randInt(1, 10),
      targetPrice: status !== "pending" ? parseFloat((p.price * 0.9).toFixed(2)) : undefined,
      quotedPrice: (status === "quoted" || status === "accepted") ? parseFloat((p.price * 0.95).toFixed(2)) : undefined,
    }));

    const notes = [
      "Urgently required for plant maintenance shutdown.",
      "Please confirm lead time before quoting.",
      "We need a formal quotation for tender submission.",
      "Request for best price on bulk order.",
      "Replacement parts needed ASAP — production halted.",
      "Annual procurement — please provide pricing and availability.",
      "We are comparing multiple suppliers. Best price wins.",
    ];

    await Quotes.create({
      ref,
      userId: user._id,
      client: {
        name: user.name,
        email: user.email,
        phone: `+23320${randInt(1000000, 9999999)}`,
        company: pick(COMPANIES),
        address: `${randInt(1,99)} Industrial Area, ${pick(GH_CITIES)}, Ghana`,
      },
      items: quoteItems,
      status,
      note: pick(notes),
      internalNote: status === "reviewing" || status === "quoted" ? "Follow up with supplier for lead time confirmation." : undefined,
      expiresAt,
      respondedAt: (status === "quoted" || status === "accepted" || status === "declined")
        ? new Date(createdAt.getTime() + randInt(1, 5) * 86_400_000)
        : undefined,
      createdAt,
      updatedAt: new Date(createdAt.getTime() + randInt(0, 2) * 86_400_000),
    });

    console.log(`  ✓  ${ref}  ${status.padEnd(12)}  ${user.name}`);
    quoteCounter++;
    quotesCreated++;
  }
  console.log(`  → ${quotesCreated} quotes created`);

  /* ── Summary ─────────────────────────────────────────────────────────── */
  console.log("\n── Counts after seed ────────────────────────────");
  for (const [label, col] of [["admins_v2", Admins], ["users_v2", Users], ["orders_v2", Orders], ["quotes_v2", Quotes]] as const) {
    console.log(`  ${label}: ${await (col as ReturnType<typeof S>).countDocuments({})}`);
  }

  await mongoose.disconnect();
  console.log("\nDone.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
