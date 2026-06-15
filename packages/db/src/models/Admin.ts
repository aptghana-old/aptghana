import { Schema, model, models, type InferSchemaType } from "mongoose";

const AdminSchema = new Schema(
  {
    username: { type: String, required: true, unique: true, lowercase: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    name: { type: String, required: true },
    role: {
      type: String,
      enum: ["super_admin", "manager", "editor", "viewer", "support"],
      default: "viewer",
      index: true,
    },
    permissions: [String],
    mfaEnabled: { type: Boolean, default: false },
    mfaSecret: { type: String, select: false },
    status: { type: String, enum: ["active", "suspended"], default: "active", index: true },
    lastLoginAt: Date,
    avatar: String,
    passwordResetToken: { type: String, select: false },
    passwordResetExpiry: { type: Date, select: false },
  },
  { timestamps: true, collection: "admins_v2" }
);

export const AdminModel = models.Admin ?? model("Admin", AdminSchema, "admins_v2");
export type AdminDocument = InferSchemaType<typeof AdminSchema>;
