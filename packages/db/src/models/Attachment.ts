import { Schema, model, models, type InferSchemaType } from "mongoose";

/**
 * RFQ supporting documents.
 *
 * Storage strategy:
 *  - storageKey: object key in MinIO (e.g. "rfq-attachments/id-filename.pdf") — preferred
 *  - data: legacy Buffer stored in MongoDB; present only on documents not yet migrated.
 *    Run `scripts/migrate-assets-to-minio.ts --only-attachments` to move them to MinIO.
 *
 * Uploads start unlinked with a 30-day TTL; submitting the RFQ links them to the
 * quote and clears `expiresAt` so they are kept permanently.
 */
const AttachmentSchema = new Schema(
  {
    name:        { type: String, required: true },
    contentType: { type: String, required: true },
    size:        { type: Number, required: true, min: 0 },
    /** MinIO object key — primary storage location */
    storageKey:  { type: String, select: true },
    /** Legacy: binary stored in MongoDB. Null once migrated to MinIO. */
    data:        { type: Buffer, required: false, select: false },
    scope:       { type: String, default: "rfq" },
    quoteId:     { type: Schema.Types.ObjectId, ref: "Quote", index: true, sparse: true },
    uploadedBy:  { type: Schema.Types.ObjectId, ref: "User", sparse: true },
    expiresAt:   { type: Date },
  },
  { timestamps: true, collection: "attachments_v2" }
);

AttachmentSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const AttachmentModel =
  models.Attachment ?? model("Attachment", AttachmentSchema, "attachments_v2");
export type AttachmentDocument = InferSchemaType<typeof AttachmentSchema>;
