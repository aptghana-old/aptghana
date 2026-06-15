import { Schema, model, models, type InferSchemaType } from "mongoose";

/**
 * A payment intent — one per gateway initialization. The unique `reference`
 * is what makes payment processing idempotent: webhooks and callback
 * verification both resolve to the same record.
 */
const PaymentSchema = new Schema(
  {
    reference: { type: String, required: true, unique: true },
    provider: { type: String, required: true, default: "paystack" },
    quoteId: { type: Schema.Types.ObjectId, ref: "Quote", required: true, index: true },
    quoteRef: { type: String, required: true },
    quoteNumber: String,
    email: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, default: "GHS" },
    status: {
      type: String,
      enum: ["initialized", "success", "failed", "abandoned"],
      default: "initialized",
      index: true,
    },
    channel: String,
    authorizationUrl: String,
    accessCode: String,
    paidAt: Date,
    gatewayResponse: String,
  },
  { timestamps: true, collection: "payments_v2" }
);

PaymentSchema.index({ quoteId: 1, status: 1 });

export const PaymentModel = models.Payment ?? model("Payment", PaymentSchema, "payments_v2");
export type PaymentDocument = InferSchemaType<typeof PaymentSchema>;
