import { Schema, model, models, type InferSchemaType } from "mongoose";

const AnalyticsSchema = new Schema(
  {
    sessionId: { type: String, required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", index: true, sparse: true },
    eventType: {
      type: String,
      enum: ["pageview", "product_view", "search", "add_to_cart", "rfq_submit", "order_complete", "brand_view", "category_view", "document_download", "click"],
      required: true,
      index: true,
    },
    path: { type: String, required: true },
    referrer: String,
    utm: {
      source: String,
      medium: String,
      campaign: String,
      term: String,
      content: String,
    },
    properties: { type: Schema.Types.Mixed, default: {} },
    country: { type: String, index: true },
    device: { type: String, enum: ["desktop", "mobile", "tablet"], index: true },
    os: String,
    browser: String,
    hostname: { type: String, index: true },
  },
  { timestamps: true, collection: "analytics_v2" }
);

AnalyticsSchema.index({ eventType: 1, createdAt: -1 });
AnalyticsSchema.index({ hostname: 1, createdAt: -1 });
AnalyticsSchema.index({ createdAt: -1 }, { expireAfterSeconds: 60 * 60 * 24 * 365 });

export const AnalyticsModel = models.Analytics ?? model("Analytics", AnalyticsSchema, "analytics_v2");
export type AnalyticsDocument = InferSchemaType<typeof AnalyticsSchema>;
