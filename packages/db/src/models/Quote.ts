import { Schema, model, models, type InferSchemaType } from "mongoose";

export const QUOTE_STATUSES = [
  "draft",
  "pending",
  "reviewing",
  "waiting_customer",
  "approved",
  "paid",
  "processing",
  "ready_for_delivery",
  "shipped",
  "delivered",
  "completed",
  "cancelled",
  "expired",
  // Legacy values — pre-workflow documents
  "quoted",
  "accepted",
  "declined",
] as const;

const QuoteItemSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product" },
    sku: String,
    name: String,
    brand: String,
    description: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    notes: String,
    unitPrice: { type: Number, min: 0 },
    lineTotal: { type: Number, min: 0 },
    targetPrice: Number,
    quotedPrice: Number,
    image: String,
  },
  { _id: false }
);

const QuoteTotalsSchema = new Schema(
  {
    subtotal: { type: Number, default: 0, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    taxRate: { type: Number, default: 0, min: 0 },
    taxAmount: { type: Number, default: 0, min: 0 },
    shipping: { type: Number, default: 0, min: 0 },
    grandTotal: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: "GHS" },
  },
  { _id: false }
);

const QuoteAttachmentSchema = new Schema(
  {
    name: { type: String, required: true },
    url: { type: String, required: true },
    size: { type: Number, default: 0 },
    contentType: { type: String, default: "application/octet-stream" },
  },
  { _id: false }
);

const QuoteSchema = new Schema(
  {
    ref: { type: String, required: true, unique: true },
    quoteNumber: { type: String, unique: true, sparse: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", index: true, sparse: true },
    // approval_request = cart procurement (becomes an Order on approval); rfq = single/custom products
    kind: { type: String, enum: ["approval_request", "rfq"], default: "rfq", index: true },
    source: { type: String, enum: ["single_product", "cart", "custom"] },
    attachments: [QuoteAttachmentSchema],
    orderId: { type: Schema.Types.ObjectId, ref: "Order", sparse: true },
    orderRef: String,
    client: {
      name: { type: String, required: true },
      firstName: String,
      lastName: String,
      email: { type: String, required: true },
      phone: String,
      company: String,
      country: String,
      address: String,
    },
    items: [QuoteItemSchema],
    status: {
      type: String,
      enum: QUOTE_STATUSES,
      default: "pending",
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ["none", "awaiting", "paid", "failed", "refunded"],
      default: "none",
    },
    totals: { type: QuoteTotalsSchema, default: undefined },
    // Once approved, item/total pricing is immutable through the normal edit path
    pricingLocked: { type: Boolean, default: false },
    // Secret token gating the public payment portal URL
    payToken: { type: String, unique: true, sparse: true },
    note: String,           // customer's message at submission
    internalNote: String,   // sales-only note
    quoteNote: String,      // sales note shown to the customer on the quote
    expiresAt: Date,        // quote validity (valid-until)
    approvedAt: Date,
    approvedBy: { type: Schema.Types.ObjectId, ref: "Admin" },
    respondedAt: Date,
    respondedBy: { type: Schema.Types.ObjectId, ref: "Admin" },
    payment: {
      reference: String,
      channel: String,
      paidAt: Date,
      amount: Number,
      transactionId: { type: Schema.Types.ObjectId, ref: "Transaction" },
    },
    odooQuoteId: { type: Number, index: true, sparse: true },
    // Creation origin (storefront vs admin-initiated). Absent on quotes
    // predating this field — treated as "unknown" in filters/analytics.
    originChannel: { type: String, enum: ["web", "store", "admin", "api"], index: true, sparse: true },
  },
  { timestamps: true, collection: "quotes_v2" }
);

QuoteSchema.index({ "client.email": 1 });
QuoteSchema.index({ status: 1, createdAt: -1 });
QuoteSchema.index({ createdAt: -1 });
QuoteSchema.index({ expiresAt: 1 });
QuoteSchema.index({ respondedBy: 1 });
QuoteSchema.index({ "client.company": 1 });
QuoteSchema.index({ "items.brand": 1 });
QuoteSchema.index({ "items.productId": 1 });

export const QuoteModel = models.Quote ?? model("Quote", QuoteSchema, "quotes_v2");
export type QuoteDocument = InferSchemaType<typeof QuoteSchema>;
