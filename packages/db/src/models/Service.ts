import { Schema, model, models, type InferSchemaType } from "mongoose";

const ServiceSchema = new Schema(
  {
    slug:        { type: String, required: true, unique: true, lowercase: true, trim: true },
    title:       { type: String, required: true, trim: true },
    description: { type: String, default: "" },

    // Which section of the services page this item belongs to
    section: {
      type: String,
      enum: ["pillars", "technical", "what-we-offer", "pre-sales", "assembly"],
      required: true,
      index: true,
    },

    // Lucide icon name (e.g. "Shield", "Wrench") — optional, used for card sections
    iconName: { type: String, default: "" },

    displayOrder: { type: Number, default: 0 },
    status:       { type: String, enum: ["active", "inactive"], default: "active", index: true },
  },
  { timestamps: true, collection: "services" }
);

ServiceSchema.index({ section: 1, displayOrder: 1 });

export const ServiceModel = models.Service ?? model("Service", ServiceSchema, "services");
export type ServiceDocument = InferSchemaType<typeof ServiceSchema>;
