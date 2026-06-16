import { Schema, model, models, type InferSchemaType } from "mongoose";

const OrderItemSchema = new Schema(
  {
    // Optional: procurement orders may contain custom (unlisted) products
    productId: { type: Schema.Types.ObjectId, ref: "Product" },
    sku: String,
    name: { type: String, required: true },
    mpn: String,
    brandSlug: String,
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    totalPrice: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "USD" },
    image: String,
    notes: String,
  },
  { _id: false }
);

const AddressSchema = new Schema(
  {
    label: String,
    line1: String,
    line2: String,
    city: String,
    region: String,
    country: { type: String, default: "GH" },
    postalCode: String,
  },
  { _id: false }
);

const OrderSchema = new Schema(
  {
    ref: { type: String, required: true, unique: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", index: true, sparse: true },
    guest: { name: String, email: String, phone: String },

    items: [OrderItemSchema],
    subtotal: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    tax: { type: Number, default: 0, min: 0 },
    shipping: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "USD" },

    // Procurement linkage: orders created from approved quotes
    quoteId: { type: Schema.Types.ObjectId, ref: "Quote", index: true, sparse: true },
    quoteNumber: String,
    // Copied from the quote so the account portal can link straight to /pay/[token]
    payToken: String,

    status: {
      type: String,
      enum: ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "refunded"],
      default: "pending",
      index: true,
    },
    // Set "unpaid" at creation; flipped to "paid" by the payment finalize handler,
    // independent of fulfillment `status` so the two can be filtered separately.
    paymentStatus: {
      type: String,
      enum: ["unpaid", "paid", "refunded", "failed"],
      default: "unpaid",
      index: true,
    },
    // Where the originating quote/order was created — copied from the source
    // Quote at approval time. Absent on orders predating this field.
    originChannel: { type: String, enum: ["web", "store", "admin", "api"], index: true, sparse: true },

    shippingAddress: AddressSchema,
    billingAddress: AddressSchema,
    notes: String,
    internalNote: String,

    odooSaleId: { type: Number, index: true, sparse: true },
    odooInvoiceId: { type: Number, sparse: true },
    trackingNumber: String,
    trackingUrl: String,
    paymentRef: String,
    paymentMethod: String,
  },
  { timestamps: true, collection: "orders_v2" }
);

OrderSchema.index({ userId: 1, createdAt: -1 });
OrderSchema.index({ status: 1, createdAt: -1 });
OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ paymentStatus: 1, createdAt: -1 });
OrderSchema.index({ "items.brandSlug": 1 });
OrderSchema.index({ "items.productId": 1 });

export const OrderModel = models.Order ?? model("Order", OrderSchema, "orders_v2");
export type OrderDocument = InferSchemaType<typeof OrderSchema>;
