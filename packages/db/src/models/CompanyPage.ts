import { Schema, model, models, type InferSchemaType } from "mongoose";

const SectionSchema = new Schema(
  { heading: { type: String, required: true }, body: { type: String, default: "" } },
  { _id: false }
);

const CompanyPageSchema = new Schema(
  {
    slug:             { type: String, required: true, unique: true, lowercase: true, trim: true },
    title:            { type: String, required: true, trim: true },
    tagline:          { type: String, default: "" },

    // Shown on the /company index card
    icon:             { type: String, default: "" },       // emoji
    cardDescription:  { type: String, default: "" },       // short card text

    // Sub-page content
    intro:            { type: String, default: "" },
    sections:         { type: [SectionSchema], default: [] },
    ctaLabel:         { type: String, default: "Get in Touch" },
    ctaHref:          { type: String, default: "/contact" },

    displayOrder:     { type: Number, default: 0 },
    status:           { type: String, enum: ["active", "inactive"], default: "active", index: true },
  },
  { timestamps: true, collection: "company_pages" }
);

export const CompanyPageModel =
  models.CompanyPage ?? model("CompanyPage", CompanyPageSchema, "company_pages");
export type CompanyPageDocument = InferSchemaType<typeof CompanyPageSchema>;
