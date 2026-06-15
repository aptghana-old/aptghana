import { Schema, model, models, type InferSchemaType } from "mongoose";

const CompanyStatSchema = new Schema(
  {
    value:        { type: String, required: true },
    label:        { type: String, required: true },
    displayOrder: { type: Number, default: 0 },
    status:       { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true, collection: "company_stats" }
);

export const CompanyStatModel =
  models.CompanyStat ?? model("CompanyStat", CompanyStatSchema, "company_stats");
export type CompanyStatDocument = InferSchemaType<typeof CompanyStatSchema>;
