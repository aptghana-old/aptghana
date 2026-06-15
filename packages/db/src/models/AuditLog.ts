import { Schema, model, models, type InferSchemaType } from "mongoose";

/**
 * Append-only audit trail. Every workflow transition (RFQ submitted, quote
 * edited, approved, paid, shipped…) writes one entry.
 */
const AuditLogSchema = new Schema(
  {
    entityType: { type: String, required: true, index: true },
    entityId: { type: Schema.Types.ObjectId, required: true, index: true },
    ref: String,
    action: { type: String, required: true },
    fromStatus: String,
    toStatus: String,
    actor: {
      type: { type: String, enum: ["customer", "sales", "system"], required: true },
      id: { type: Schema.Types.ObjectId },
      name: String,
    },
    message: String,
    meta: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: "audit_logs" }
);

AuditLogSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });
AuditLogSchema.index({ createdAt: -1 });

export const AuditLogModel = models.AuditLog ?? model("AuditLog", AuditLogSchema, "audit_logs");
export type AuditLogDocument = InferSchemaType<typeof AuditLogSchema>;
