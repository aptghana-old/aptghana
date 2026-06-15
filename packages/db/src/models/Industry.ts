import { Schema, model, models, type InferSchemaType } from "mongoose";

const MediaSchema = new Schema(
  { url: String, alt: { type: String, default: "" } },
  { _id: false }
);

const SeoSchema = new Schema(
  { title: String, description: String, keywords: [String], canonicalUrl: String },
  { _id: false }
);

const IndustrySchema = new Schema(
  {
    slug:             { type: String, required: true, unique: true, lowercase: true, trim: true },
    name:             { type: String, required: true, trim: true },
    tagline:          { type: String, default: "" },
    shortDescription: { type: String, default: "" },
    challenge:        { type: String, default: "" },
    solutions:        [String],
    brands:           [String],
    clients:          { type: String, default: "" },
    image:            MediaSchema,
    icon:             { type: String, default: "" },
    accentColor:      { type: String, default: "#84CC16" },
    stats:            [{ label: String, value: String, _id: false }],
    keyProducts:      [String],
    isFeatured:       { type: Boolean, default: false, index: true },
    displayOrder:     { type: Number, default: 0, index: true },
    status:           { type: String, enum: ["active", "inactive"], default: "active", index: true },
    seo:              { type: SeoSchema, default: () => ({}) },
  },
  { timestamps: true, collection: "industries" }
);

IndustrySchema.index({ isFeatured: 1, status: 1 });
IndustrySchema.index({ displayOrder: 1, name: 1 });

export const IndustryModel = models.Industry ?? model("Industry", IndustrySchema, "industries");
export type IndustryDocument = InferSchemaType<typeof IndustrySchema>;
