import { Schema, model, models, type InferSchemaType } from "mongoose";
import crypto from "crypto";

// Subdocs keep _id so the account portal can address them individually
const AddressSchema = new Schema({
  label: { type: String, default: "Primary" },
  line1: { type: String, required: true },
  line2: String,
  city: { type: String, required: true },
  region: String,
  country: { type: String, default: "GH" },
  postalCode: String,
  phone: String,
  isDefault: { type: Boolean, default: false },          // legacy single default
  isDefaultShipping: { type: Boolean, default: false },
  isDefaultBilling: { type: Boolean, default: false },
});

/**
 * Saved payment methods hold display metadata only — never full card
 * numbers. `paystackAuthCode` is reserved for future Paystack tokenization
 * (charge_authorization) and is excluded from queries by default.
 */
const PaymentMethodSchema = new Schema({
  type: { type: String, enum: ["card", "mobile_money", "bank"], required: true },
  label: { type: String, default: "" },
  brand: String,          // visa / mastercard / MTN MoMo / …
  last4: String,
  expMonth: Number,
  expYear: Number,
  momoNetwork: String,
  bankName: String,
  paystackAuthCode: { type: String, select: false },
  isDefault: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

const CompareItemSchema = new Schema(
  {
    productId: { type: String, required: true },
    name: String,
    slug: String,
    imageUrl: String,
    brandName: String,
  },
  { _id: false }
);

const LoginEventSchema = new Schema(
  {
    at: { type: Date, default: Date.now },
    ip: String,
    userAgent: String,
  },
  { _id: false }
);

const UserSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    emailVerified: { type: Boolean, default: false },
    emailVerifyToken: { type: String, select: false },
    // Email-change flow: the new address stays pending until verified,
    // so the account is never locked out by a failed change
    pendingEmail: { type: String, lowercase: true, trim: true },
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
    mfaSecret: { type: String, select: false },
    mfaEnabled: { type: Boolean, default: false },
    // P-06: OTP brute-force protection — locked after 5 consecutive failures
    otpFailedAttempts: { type: Number, default: 0 },
    otpLockedUntil: { type: Date },
    // Bumping this invalidates every issued JWT ("sign out all devices")
    sessionVersion: { type: Number, default: 0 },
    loginHistory: { type: [LoginEventSchema], default: [], select: false },

    name: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    accountType: { type: String, enum: ["personal", "business"], default: "personal" },
    company: { type: String, trim: true },
    jobTitle: String,
    businessType: {
      type: String,
      enum: ["contractor", "engineer", "procurement", "reseller", "end-user", "other"],
    },
    avatar: String,

    addresses: [AddressSchema],
    paymentMethods: [PaymentMethodSchema],
    favorites: [{ type: Schema.Types.ObjectId, ref: "Product" }],
    compareList: { type: [CompareItemSchema], default: [] },
    notificationPrefs: { type: Schema.Types.Mixed, default: {} },
    orderIds: [{ type: Schema.Types.ObjectId, ref: "Order" }],
    quoteIds: [{ type: Schema.Types.ObjectId, ref: "Quote" }],

    status: { type: String, enum: ["active", "suspended", "pending"], default: "pending", index: true },
    odooPartnerId: { type: Number, index: true, sparse: true },
    lastLoginAt: Date,
  },
  { timestamps: true, collection: "users_v2" }
);

UserSchema.methods.createPasswordResetToken = function () {
  const token = crypto.randomBytes(32).toString("hex");
  this.passwordResetToken = crypto.createHash("sha256").update(token).digest("hex");
  this.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000);
  return token;
};

export const UserModel = models.User ?? model("User", UserSchema, "users_v2");
export type UserDocument = InferSchemaType<typeof UserSchema>;
