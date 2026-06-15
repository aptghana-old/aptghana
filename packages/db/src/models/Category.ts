import { Schema, model, models, type InferSchemaType } from "mongoose";

const MediaSchema = new Schema(
  { url: String, alt: { type: String, default: "" } },
  { _id: false }
);

const SeoSchema = new Schema(
  { title: String, description: String, keywords: [String], canonicalUrl: String },
  { _id: false }
);

const CategorySchema = new Schema(
  {
    // Identity
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    legacyId: { type: String, index: true },
    name: { type: String, required: true, trim: true },
    shortDescription: { type: String, default: "" },
    description: { type: String, default: "" },

    // Hierarchy
    level: { type: String, enum: ["group", "category", "subcategory", "range"], required: true, index: true },
    parentId: { type: Schema.Types.ObjectId, ref: "Category", index: true, sparse: true },
    ancestors: [{ type: Schema.Types.ObjectId, ref: "Category" }],
    path: { type: String, index: true },

    // Media
    image: MediaSchema,
    icon: String,

    // Content
    documents: [
      {
        type: { type: String },
        title: String,
        url: String,
        language: { type: String, default: "en" },
      },
    ],
    benefits: [{ title: String, value: String }],
    bulletPoints: [String],
    products: [String],
    brands: [String],
    applications: [String],

    // Commerce
    productCount: { type: Number, default: 0 },
    isFeatured: { type: Boolean, default: false, index: true },
    displayOrder: { type: Number, default: 0 },

    // SEO
    seo: { type: SeoSchema, default: () => ({}) },
    status: { type: String, enum: ["active", "inactive"], default: "active", index: true },
  },
  { timestamps: true, collection: "categories_v2" }
);

CategorySchema.index({ parentId: 1, level: 1 });
CategorySchema.index({ ancestors: 1 });
CategorySchema.index({ isFeatured: 1, status: 1 });

export const CategoryModel = models.Category ?? model("Category", CategorySchema, "categories_v2");
export type CategoryDocument = InferSchemaType<typeof CategorySchema>;
