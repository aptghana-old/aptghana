import { Schema, model, models, type InferSchemaType } from "mongoose";

const MediaSchema = new Schema(
  { url: { type: String, required: true }, alt: { type: String, default: "" }, width: Number, height: Number },
  { _id: false }
);

const DocumentSchema = new Schema(
  {
    type: { type: String, enum: ["datasheet", "manual", "drawing", "certificate", "compliance", "other"], required: true },
    title: { type: String, required: true },
    url: { type: String, required: true },
    language: { type: String, default: "en" },
    fileSize: Number,
  },
  { _id: false }
);

const SeoSchema = new Schema(
  {
    title: { type: String, default: "" },
    description: { type: String, default: "" },
    keywords: [String],
    canonicalUrl: String,
    ogImage: String,
  },
  { _id: false }
);

const SpecAttributeSchema = new Schema(
  { name: { type: String, required: true }, value: { type: String, required: true }, unit: String },
  { _id: false }
);

const SpecGroupSchema = new Schema(
  { group: { type: String, required: true }, attributes: [SpecAttributeSchema] },
  { _id: false }
);

const ProductVariantSchema = new Schema(
  {
    sku: { type: String, required: true },
    options: { type: Map, of: String },
    price: Number,
    inventory: Number,
    mpn: String,
  },
  { _id: false }
);

const CrossRefSchema = new Schema(
  { brand: { type: String, required: true }, mpn: { type: String, required: true }, description: String },
  { _id: false }
);

// Denormalized snapshot of a Group/Category/Subcategory/Range node — avoids a
// Category lookup on every product read. `level` drives catalogue assignment
// display and Meilisearch's hierarchicalCategories facets.
const CategoryRefSchema = new Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    slug: { type: String, required: true },
    level: { type: String, enum: ["group", "category", "subcategory", "range"], required: true },
  },
  { _id: false }
);

const PricingSchema = new Schema(
  {
    currency: { type: String, default: "USD" },
    listPrice: { type: Number, required: true, min: 0 },
    tradePrice: { type: Number, min: 0 },
    minimumOrderQty: { type: Number, default: 1, min: 1 },
    leadTime: String,
    incoterms: String,
  },
  { _id: false }
);

const InventorySchema = new Schema(
  {
    tracked: { type: Boolean, default: true },
    quantity: { type: Number, default: 0, min: 0 },
    reservedQuantity: { type: Number, default: 0, min: 0 },
    reorderPoint: { type: Number, min: 0 },
    warehouseLocation: String,
    odooStockId: Number,
  },
  { _id: false }
);

const ProductSchema = new Schema(
  {
    // Identification
    sku: { type: String, required: true, unique: true, uppercase: true, trim: true },
    mpn: { type: String, required: true, trim: true },
    supplierRef: { type: String, trim: true, index: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },

    // Content
    name: { type: String, required: true, trim: true },
    shortDescription: { type: String, default: "" },
    description: { type: String, default: "" },
    features: [String],
    applications: [String],
    certifications: [String],

    // Classification
    brandId: { type: Schema.Types.ObjectId, ref: "Brand", required: true, index: true },
    brandSlug: { type: String, required: true, index: true },
    manufacturerId: { type: Schema.Types.ObjectId, ref: "Manufacturer" },
    // Full chain (Group..deepest assigned level), each entry tagged with its level.
    categories: { type: [CategoryRefSchema], default: [] },
    // The deepest node in the chain — Range if assigned, else Subcategory, else Category, else Group.
    primaryCategoryId: { type: String, index: true },
    catalogue: {
      path: String,        // "electrical-solutions/circuit-breakers/acti9-circuit-protection/acti9-ic60"
      url: String,         // "/catalog/<path>"
    },
    tags: [{ type: String, index: true }],
    nodeType: String,

    // Media
    images: {
      main: { type: MediaSchema, required: true },
      gallery: [MediaSchema],
    },
    videos: [{ title: String, url: String, thumbnail: String }],
    drawings: [{ title: String, content: String }],

    // Technical
    specifications: [SpecGroupSchema],
    documents: [DocumentSchema],

    // Commerce
    pricing: { type: PricingSchema, required: true },
    inventory: { type: InventorySchema, default: () => ({}) },

    // Variants
    variantOptions: [{ name: String, values: [String] }],
    variants: [ProductVariantSchema],

    // Relationships
    relatedProducts: [{ type: Schema.Types.ObjectId, ref: "Product" }],
    accessories: [{ type: Schema.Types.ObjectId, ref: "Product" }],
    replacements: [{ type: Schema.Types.ObjectId, ref: "Product" }],
    crossReferences: [CrossRefSchema],

    // SEO
    seo: { type: SeoSchema, default: () => ({}) },

    // Status
    status: { type: String, enum: ["active", "inactive", "discontinued", "draft"], default: "active", index: true },
    isNew: { type: Boolean, default: false },
    isFeatured: { type: Boolean, default: false, index: true },
    isClearance: { type: Boolean, default: false, index: true },
    discount: { type: Number, default: 0, min: 0, max: 100 },

    // Analytics
    views: { type: Number, default: 0 },
    salesCount: { type: Number, default: 0 },
    relevanceScore: { type: Number, default: 0 },

    // Sync
    odooProductId: { type: Number, index: true, sparse: true },
    lastSyncedAt: Date,
    createdBy: { type: Schema.Types.ObjectId, ref: "Admin" },
    updatedBy: { type: Schema.Types.ObjectId, ref: "Admin" },
  },
  {
    timestamps: true,
    collection: "products_v2",
    suppressReservedKeysWarning: true,
  }
);

// Compound indexes
ProductSchema.index({ brandSlug: 1, status: 1 });
ProductSchema.index({ "pricing.listPrice": 1, status: 1 });
ProductSchema.index({ isFeatured: 1, status: 1 });
ProductSchema.index({ isClearance: 1, status: 1 });
ProductSchema.index({ "categories.id": 1, status: 1 });
ProductSchema.index({ "categories.slug": 1, status: 1 });
ProductSchema.index({ views: -1 });
ProductSchema.index({ salesCount: -1 });
ProductSchema.index({ createdAt: -1, status: 1 });

// Text search index
ProductSchema.index(
  { name: "text", mpn: "text", sku: "text", shortDescription: "text", "tags": "text" },
  { weights: { name: 10, mpn: 8, sku: 8, shortDescription: 3, tags: 5 }, name: "product_text_search" }
);

export const ProductModel = models.Product ?? model("Product", ProductSchema, "products_v2");

export type ProductDocument = InferSchemaType<typeof ProductSchema>;
