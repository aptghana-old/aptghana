import { Schema, model, models, type InferSchemaType } from "mongoose";

const AdminSchema = new Schema(
  {
    username: { type: String, required: true, unique: true, lowercase: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    name: { type: String, required: true },
    role: {
      type: String,
      enum: ["super_admin", "manager", "sales", "account"],
      default: "sales",
      index: true,
    },
    permissions: [String],
    mfaEnabled: { type: Boolean, default: false },
    mfaSecret: { type: String, select: false },
    status: { type: String, enum: ["active", "suspended"], default: "active", index: true },
    lastLoginAt: Date,
    lastLoginIp: String,
    avatar: String,
    passwordResetToken: { type: String, select: false },
    passwordResetExpiry: { type: Date, select: false },
    // Security fields
    passwordChangedAt: Date,
    mustChangePassword: { type: Boolean, default: false },
    failedLoginAttempts: { type: Number, default: 0 },
    lockedUntil: Date,
    // Soft delete
    deletedAt: Date,
    // Provenance
    createdBy: { type: Schema.Types.ObjectId, ref: "Admin" },
    updatedBy: { type: Schema.Types.ObjectId, ref: "Admin" },
  },
  { timestamps: true, collection: "admins_v2" }
);

AdminSchema.index({ deletedAt: 1 });
AdminSchema.index({ role: 1, status: 1 });

export const AdminModel = models.Admin ?? model("Admin", AdminSchema, "admins_v2");
export type AdminDocument = InferSchemaType<typeof AdminSchema>;
