import mongoose, { Document, Schema } from "mongoose";

export interface OfficeHour {
  day:   string;
  hours: string;
}

export interface LegalSection {
  _id?:    string;
  heading: string;
  body:    string;
}

export interface SitePageDocument extends Document {
  slug:           string;
  pageType:       "legal" | "contact";

  // Page copy
  title:          string;
  tagline:        string;
  description:    string;

  // Legal only
  lastUpdated:    string;
  intro:          string;
  sections:       LegalSection[];

  // Legal — DPO / contact block at bottom
  contactBlockName:     string;
  contactBlockEmail:    string;
  contactBlockAddress:  string;
  contactBlockFootnote: string;

  // Contact page
  address:      string;
  phone:        string;
  email:        string;
  mapsUrl:      string;
  responseTime: string;
  officeHours:  OfficeHour[];

  // Meta & publishing
  metaTitle:       string;
  metaDescription: string;
  status:          "published" | "draft";

  updatedAt: Date;
}

const LegalSectionSchema = new Schema<LegalSection>(
  { heading: String, body: String },
  { _id: true }
);

const OfficeHourSchema = new Schema<OfficeHour>(
  { day: String, hours: String },
  { _id: false }
);

const SitePageSchema = new Schema<SitePageDocument>(
  {
    slug:     { type: String, required: true, unique: true },
    pageType: { type: String, enum: ["legal", "contact"], required: true },

    title:       { type: String, default: "" },
    tagline:     { type: String, default: "" },
    description: { type: String, default: "" },

    lastUpdated: { type: String, default: "" },
    intro:       { type: String, default: "" },
    sections:    { type: [LegalSectionSchema], default: [] },

    contactBlockName:     { type: String, default: "" },
    contactBlockEmail:    { type: String, default: "" },
    contactBlockAddress:  { type: String, default: "" },
    contactBlockFootnote: { type: String, default: "" },

    address:      { type: String, default: "" },
    phone:        { type: String, default: "" },
    email:        { type: String, default: "" },
    mapsUrl:      { type: String, default: "" },
    responseTime: { type: String, default: "" },
    officeHours:  { type: [OfficeHourSchema], default: [] },

    metaTitle:       { type: String, default: "" },
    metaDescription: { type: String, default: "" },
    status:          { type: String, enum: ["published", "draft"], default: "published" },
  },
  { collection: "site_pages", timestamps: true }
);

export const SitePageModel =
  mongoose.models.SitePage ??
  mongoose.model<SitePageDocument>("SitePage", SitePageSchema);
