import { Schema, model, models, type InferSchemaType } from "mongoose";

const EmailLogSchema = new Schema(
  {
    to:         { type: String, required: true },
    subject:    { type: String, required: true },
    template:   { type: String, required: true },
    status:     { type: String, enum: ["sent", "failed", "retrying"], required: true },
    messageId:  { type: String, default: null },
    error:      { type: String, default: null },
    retries:    { type: Number, default: 0 },
    userId:     { type: Schema.Types.ObjectId, ref: "User", default: null },
    metadata:   { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

EmailLogSchema.index({ to: 1, createdAt: -1 });
EmailLogSchema.index({ template: 1, status: 1 });
EmailLogSchema.index({ userId: 1, createdAt: -1 }, { sparse: true });

export type EmailLogType = InferSchemaType<typeof EmailLogSchema>;
export const EmailLogModel = models.EmailLog ?? model("EmailLog", EmailLogSchema);
