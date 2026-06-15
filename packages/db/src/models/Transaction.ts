import { Schema, model, models, type InferSchemaType } from "mongoose";

/**
 * A gateway transaction event (verified charge, refund). Stores the raw
 * provider payload for reconciliation; one record per gateway-confirmed event.
 */
const TransactionSchema = new Schema(
  {
    reference: { type: String, required: true, index: true },
    paymentId: { type: Schema.Types.ObjectId, ref: "Payment", index: true, sparse: true },
    quoteId: { type: Schema.Types.ObjectId, ref: "Quote", index: true, sparse: true },
    provider: { type: String, required: true, default: "paystack" },
    type: { type: String, enum: ["charge", "refund"], default: "charge" },
    status: { type: String, required: true },
    amount: { type: Number, required: true },
    currency: { type: String, required: true },
    channel: String,
    paidAt: Date,
    gatewayResponse: String,
    raw: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true, collection: "transactions_v2" }
);

// One charge transaction per reference — enforces idempotent finalization
TransactionSchema.index({ reference: 1, type: 1 }, { unique: true });

export const TransactionModel =
  models.Transaction ?? model("Transaction", TransactionSchema, "transactions_v2");
export type TransactionDocument = InferSchemaType<typeof TransactionSchema>;
