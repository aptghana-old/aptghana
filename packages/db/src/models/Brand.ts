import { Schema, model, models, type InferSchemaType } from "mongoose";

const MediaSchema = new Schema(
  { url: { type: String, required: true }, alt: { type: String, default: "" }, width: Number, height: Number },
  { _id: false }
);

const SeoSchema = new Schema(
  { title: String, description: String, keywords: [String], canonicalUrl: String, ogImage: String },
  { _id: false }
);

const BrandSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    shortDescription: { type: String, default: "" },
    description: { type: String, default: "" },
    logo: { type: MediaSchema, required: true },
    coverImage: MediaSchema,
    website: String,
    country: String,
    founded: Number,
    specialty: { type: String, default: "" },
    isPartner: { type: Boolean, default: false, index: true },
    isFeatured: { type: Boolean, default: false, index: true },
    productCount: { type: Number, default: 0 },
    seo: { type: SeoSchema, default: () => ({}) },
    status: { type: String, enum: ["active", "inactive"], default: "active", index: true },
    odooId: { type: Number, index: true, sparse: true },
    displayOrder: { type: Number, default: 0 },
  },
  { timestamps: true, collection: "brands_v2" }
);

export const BrandModel = models.Brand ?? model("Brand", BrandSchema, "brands_v2");
export type BrandDocument = InferSchemaType<typeof BrandSchema>;
