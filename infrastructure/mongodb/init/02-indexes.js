// Create all production indexes for aptghana_v2.
// Idempotent: MongoDB ignores createIndex calls for already-existing indexes.

const db = db.getSiblingDB(process.env.MONGO_INITDB_DATABASE || "aptghana_v2");

// ─── products_v2 ──────────────────────────────────────────────────────────────
const products = db.getCollection("products_v2");
products.createIndex({ sku: 1 },       { unique: true, name: "sku_unique" });
products.createIndex({ mpn: 1 },       { sparse: true, name: "mpn_idx" });
products.createIndex({ slug: 1 },      { unique: true, name: "slug_unique" });
products.createIndex({ brandSlug: 1 }, { name: "brand_idx" });
products.createIndex({ status: 1 },    { name: "status_idx" });
products.createIndex({ "categories.id": 1 }, { name: "categories_idx" });
products.createIndex({ isFeatured: 1, status: 1 }, { name: "featured_active_idx" });
products.createIndex({ isClearance: 1, status: 1 }, { name: "clearance_active_idx" });
products.createIndex({ updatedAt: 1 }, { name: "updated_at_idx" });
products.createIndex({ "pricing.listPrice": 1 }, { name: "price_idx" });

// ─── brands_v2 ────────────────────────────────────────────────────────────────
const brands = db.getCollection("brands_v2");
brands.createIndex({ slug: 1 },       { unique: true, name: "slug_unique" });
brands.createIndex({ status: 1 },     { name: "status_idx" });
brands.createIndex({ isFeatured: 1 }, { name: "featured_idx" });
brands.createIndex({ isPartner: 1 },  { name: "partner_idx" });

// ─── categories_v2 ────────────────────────────────────────────────────────────
const categories = db.getCollection("categories_v2");
categories.createIndex({ slug: 1 },     { unique: true, name: "slug_unique" });
categories.createIndex({ level: 1 },    { name: "level_idx" });
categories.createIndex({ parentId: 1 }, { sparse: true, name: "parent_idx" });
categories.createIndex({ status: 1 },   { name: "status_idx" });

// ─── users_v2 ─────────────────────────────────────────────────────────────────
const users = db.getCollection("users_v2");
users.createIndex({ email: 1 }, { unique: true, name: "email_unique" });
users.createIndex({ createdAt: 1 }, { name: "created_at_idx" });

// ─── admins_v2 ────────────────────────────────────────────────────────────────
const admins = db.getCollection("admins_v2");
admins.createIndex({ email: 1 }, { unique: true, name: "email_unique" });

// ─── orders_v2 ────────────────────────────────────────────────────────────────
const orders = db.getCollection("orders_v2");
orders.createIndex({ userId: 1 }, { name: "user_idx" });
orders.createIndex({ status: 1 }, { name: "status_idx" });
orders.createIndex({ createdAt: -1 }, { name: "created_at_desc" });
orders.createIndex({ "payment.reference": 1 }, { sparse: true, name: "payment_ref_idx" });

// ─── quotes_v2 ────────────────────────────────────────────────────────────────
const quotes = db.getCollection("quotes_v2");
quotes.createIndex({ userId: 1 }, { name: "user_idx" });
quotes.createIndex({ status: 1 }, { name: "status_idx" });
quotes.createIndex({ ref: 1 },    { unique: true, sparse: true, name: "ref_unique" });
quotes.createIndex({ createdAt: -1 }, { name: "created_at_desc" });

// ─── attachments_v2 ───────────────────────────────────────────────────────────
const attachments = db.getCollection("attachments_v2");
attachments.createIndex({ quoteId: 1 }, { sparse: true, name: "quote_idx" });
attachments.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0, name: "ttl_idx" });
attachments.createIndex({ storageKey: 1 }, { sparse: true, name: "storage_key_idx" });

// ─── analytics_v2 ────────────────────────────────────────────────────────────
const analytics = db.getCollection("analytics_v2");
analytics.createIndex({ timestamp: -1 }, { name: "timestamp_desc" });
analytics.createIndex({ path: 1, timestamp: -1 }, { name: "path_time_idx" });

// ─── homepage_configs ────────────────────────────────────────────────────────
const homepageConfigs = db.getCollection("homepage_configs");
homepageConfigs.createIndex({ isActive: 1 }, { name: "active_idx" });
homepageConfigs.createIndex({ publishedAt: -1 }, { name: "published_at_desc" });

print("All indexes created successfully");
