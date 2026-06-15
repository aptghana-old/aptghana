import { Schema, model, models, type InferSchemaType } from "mongoose";

const MediaSchema = new Schema(
  { url: String, alt: { type: String, default: "" } },
  { _id: false }
);

const ResourceItemSchema = new Schema(
  {
    title:       { type: String, required: true },
    description: { type: String, default: "" },
    meta:        { type: String, default: "" },
    downloadUrl: { type: String, default: "" },
    externalUrl: { type: String, default: "" },
    publishedAt: { type: Date },
    tags:        [String],
    displayOrder:{ type: Number, default: 0 },
  },
  { _id: true }
);

const ResourceSchema = new Schema(
  {
    slug:         { type: String, required: true, unique: true, lowercase: true, trim: true },
    type:         { type: String, enum: ["library", "case-studies", "news", "training", "cad", "certifications", "projects", "other"], required: true },
    title:        { type: String, required: true, trim: true },
    tagline:      { type: String, default: "" },
    intro:        { type: String, default: "" },
    badge:        { type: String, default: "" },
    items:        [ResourceItemSchema],
    cta: {
      label: { type: String, default: "Get in Touch" },
      href:  { type: String, default: "/contact" },
      _id:   false,
    },
    image:        MediaSchema,
    isFeatured:   { type: Boolean, default: false, index: true },
    displayOrder: { type: Number, default: 0, index: true },
    status:       { type: String, enum: ["active", "inactive"], default: "active", index: true },
  },
  { timestamps: true, collection: "resources" }
);

ResourceSchema.index({ type: 1, status: 1 });
ResourceSchema.index({ displayOrder: 1, type: 1 });

export const ResourceModel = models.Resource ?? model("Resource", ResourceSchema, "resources");
export type ResourceDocument = InferSchemaType<typeof ResourceSchema>;
