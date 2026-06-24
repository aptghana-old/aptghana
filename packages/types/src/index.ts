// ─── Primitives ──────────────────────────────────────────────────────────────

export type ObjectId = string;

export interface Timestamps {
  createdAt: Date;
  updatedAt: Date;
}

export interface SeoMeta {
  title: string;
  description: string;
  keywords: string[];
  canonicalUrl?: string;
  ogImage?: string;
}

export interface Media {
  url: string;
  alt: string;
  width?: number;
  height?: number;
}

export interface Document {
  type: "datasheet" | "manual" | "drawing" | "certificate" | "compliance" | "other";
  title: string;
  url: string;
  language: string;
  fileSize?: number;
}

// ─── Product ──────────────────────────────────────────────────────────────────

export interface SpecAttribute {
  name: string;
  value: string;
  unit?: string;
}

export interface SpecGroup {
  group: string;
  attributes: SpecAttribute[];
}

export interface ProductVariant {
  sku: string;
  options: Record<string, string>;
  price?: number;
  inventory?: number;
  mpn?: string;
}

export interface CrossReference {
  brand: string;
  mpn: string;
  description?: string;
}

export interface ProductPricing {
  currency: string;
  listPrice: number;
  tradePrice?: number;
  minimumOrderQty: number;
  leadTime?: string;
  incoterms?: string;
}

export interface ProductInventory {
  tracked: boolean;
  quantity: number;
  reservedQuantity: number;
  reorderPoint?: number;
  warehouseLocation?: string;
  odooStockId?: number;
}

export interface Product extends Timestamps {
  _id: ObjectId;

  // Identification
  sku: string;
  mpn: string;
  supplierRef?: string;
  slug: string;

  // Content
  name: string;
  shortDescription: string;
  description: string;
  features: string[];
  applications: string[];
  certifications: string[];

  // Classification
  brandId: ObjectId;
  brandSlug: string;
  manufacturerId?: ObjectId;
  categories: ObjectId[];
  primaryCategoryId: ObjectId;
  tags: string[];
  nodeType?: string;

  // Media
  images: {
    main: Media;
    gallery: Media[];
  };
  videos: { title: string; url: string; thumbnail?: string }[];
  drawings: { title: string; content: string }[];

  // Technical
  specifications: SpecGroup[];
  documents: Document[];

  // Commerce
  pricing: ProductPricing;
  inventory: ProductInventory;

  // Variants
  variantOptions: { name: string; values: string[] }[];
  variants: ProductVariant[];

  // Relationships
  relatedProducts: ObjectId[];
  accessories: ObjectId[];
  replacements: ObjectId[];
  crossReferences: CrossReference[];

  // SEO
  seo: SeoMeta;

  // Status
  status: "active" | "inactive" | "discontinued" | "draft";
  isNew: boolean;
  isFeatured: boolean;
  isClearance: boolean;
  discount: number;

  // Analytics
  views: number;
  salesCount: number;
  relevanceScore: number;

  // Sync
  odooProductId?: number;
  lastSyncedAt?: Date;
  createdBy?: ObjectId;
  updatedBy?: ObjectId;
}

// ─── Brand ────────────────────────────────────────────────────────────────────

export interface Brand extends Timestamps {
  _id: ObjectId;
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  logo: Media;
  coverImage?: Media;
  website?: string;
  country?: string;
  founded?: number;
  isPartner: boolean;
  isFeatured: boolean;
  productCount: number;
  seo: SeoMeta;
  status: "active" | "inactive";
  odooId?: number;
}

// ─── Category ─────────────────────────────────────────────────────────────────

export type CategoryLevel = "group" | "category" | "subcategory" | "range";

export interface Category extends Timestamps {
  _id: ObjectId;
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  level: CategoryLevel;
  parentId?: ObjectId;
  ancestors: ObjectId[];
  path: string;
  image?: Media;
  icon?: string;
  documents: Document[];
  benefits: { title: string; value: string }[];
  bulletPoints: string[];
  productCount: number;
  isFeatured: boolean;
  displayOrder: number;
  seo: SeoMeta;
  status: "active" | "inactive";
}

// ─── Manufacturer ─────────────────────────────────────────────────────────────

export interface Manufacturer extends Timestamps {
  _id: ObjectId;
  slug: string;
  name: string;
  description: string;
  logo?: Media;
  country?: string;
  website?: string;
  status: "active" | "inactive";
}

// ─── User ─────────────────────────────────────────────────────────────────────

export type AccountType = "personal" | "business";
export type BusinessType = "contractor" | "engineer" | "procurement" | "reseller" | "end-user" | "other";

export interface UserAddress {
  label: string;
  line1: string;
  line2?: string;
  city: string;
  region?: string;
  country: string;
  postalCode?: string;
  isDefault: boolean;
}

export interface User extends Timestamps {
  _id: ObjectId;
  email: string;
  emailVerified: boolean;
  name: string;
  phone?: string;
  accountType: AccountType;
  company?: string;
  jobTitle?: string;
  businessType?: BusinessType;
  addresses: UserAddress[];
  favorites: ObjectId[];
  orderIds: ObjectId[];
  quoteIds: ObjectId[];
  saleIds: string[];
  mfaEnabled: boolean;
  status: "active" | "suspended" | "pending";
  odooPartnerId?: number;
  lastLoginAt?: Date;
}

// ─── Order ────────────────────────────────────────────────────────────────────

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

export interface OrderItem {
  productId: ObjectId;
  sku: string;
  name: string;
  mpn: string;
  brandSlug: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  currency: string;
  image?: string;
}

export interface Order extends Timestamps {
  _id: ObjectId;
  ref: string;
  userId?: ObjectId;
  guest?: { name: string; email: string; phone: string };
  items: OrderItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  currency: string;
  status: OrderStatus;
  shippingAddress: UserAddress;
  billingAddress?: UserAddress;
  notes?: string;
  odooSaleId?: number;
  odooInvoiceId?: number;
  trackingNumber?: string;
  trackingUrl?: string;
  paymentRef?: string;
  paymentMethod?: string;
}

// ─── Quote / RFQ ─────────────────────────────────────────────────────────────

/**
 * Full B2B procurement lifecycle. "approved" doubles as "awaiting payment" —
 * the paymentStatus field carries the payment sub-state.
 */
export type QuoteStatus =
  | "draft"
  | "pending"            // Pending Review
  | "reviewing"          // Under Review
  | "waiting_customer"   // Waiting for Customer
  | "approved"           // Approved · Awaiting Payment
  | "paid"
  | "processing"
  | "ready_for_delivery"
  | "shipped"
  | "delivered"
  | "completed"
  | "cancelled"
  | "expired"
  // Legacy values kept for pre-workflow documents
  | "quoted" | "accepted" | "declined";

export type QuotePaymentStatus = "none" | "awaiting" | "paid" | "failed" | "refunded";

export const QUOTE_STATUS_LABELS: Record<QuoteStatus, string> = {
  draft: "Draft",
  pending: "Pending Review",
  reviewing: "Under Review",
  waiting_customer: "Waiting for Customer",
  approved: "Approved · Awaiting Payment",
  paid: "Paid",
  processing: "Processing",
  ready_for_delivery: "Ready for Delivery",
  shipped: "Shipped",
  delivered: "Delivered",
  completed: "Completed",
  cancelled: "Cancelled",
  expired: "Expired",
  quoted: "Quoted",
  accepted: "Accepted",
  declined: "Declined",
};

/**
 * Request intake channel:
 * - "cart" — procurement basket submitted as a Request for Approval
 * - "single_product" — RFQ for one catalogue product
 * - "custom" — RFQ including products not listed on the website
 */
export type RfqSource = "single_product" | "cart" | "custom";

/**
 * Request kind: cart-based Requests for Approval become Orders on approval;
 * RFQs cover single/unlisted products.
 */
export type QuoteKind = "approval_request" | "rfq";

export interface QuoteAttachment {
  name: string;
  url: string;
  size: number;
  contentType: string;
}

export interface QuoteItem {
  productId?: ObjectId;
  sku?: string;
  name?: string;
  brand?: string;
  description: string;
  quantity: number;
  notes?: string;
  unitPrice?: number;
  lineTotal?: number;
  targetPrice?: number;
  quotedPrice?: number;
  image?: string;
}

export interface QuoteTotals {
  subtotal: number;
  discount: number;
  taxRate: number;
  taxAmount: number;
  shipping: number;
  grandTotal: number;
  currency: string;
}

export interface QuoteClient {
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone: string;
  company?: string;
  country?: string;
  address?: string;
}

export interface Quote extends Timestamps {
  _id: ObjectId;
  ref: string;
  quoteNumber?: string;
  userId?: ObjectId;
  kind?: QuoteKind;
  source?: RfqSource;
  client: QuoteClient;
  items: QuoteItem[];
  attachments?: QuoteAttachment[];
  orderId?: ObjectId;
  orderRef?: string;
  status: QuoteStatus;
  paymentStatus?: QuotePaymentStatus;
  totals?: QuoteTotals;
  pricingLocked?: boolean;
  payToken?: string;
  note?: string;
  internalNote?: string;
  quoteNote?: string;
  expiresAt?: Date;
  approvedAt?: Date;
  approvedBy?: ObjectId;
  respondedAt?: Date;
  respondedBy?: ObjectId;
  payment?: {
    reference?: string;
    channel?: string;
    paidAt?: Date;
    amount?: number;
    transactionId?: ObjectId;
  };
  odooQuoteId?: number;
}

/* ─── Payments ────────────────────────────────────────────────────────────── */

export type PaymentIntentStatus = "initialized" | "success" | "failed" | "abandoned";

export interface PaymentRecord extends Timestamps {
  _id: ObjectId;
  reference: string;
  provider: string;
  quoteId: ObjectId;
  quoteRef: string;
  quoteNumber?: string;
  email: string;
  amount: number;
  currency: string;
  status: PaymentIntentStatus;
  channel?: string;
  authorizationUrl?: string;
  paidAt?: Date;
  gatewayResponse?: string;
}

export interface TransactionRecord extends Timestamps {
  _id: ObjectId;
  reference: string;
  paymentId?: ObjectId;
  quoteId?: ObjectId;
  provider: string;
  type: "charge" | "refund";
  status: string;
  amount: number;
  currency: string;
  channel?: string;
  paidAt?: Date;
  gatewayResponse?: string;
  raw?: Record<string, unknown>;
}

/* ─── Audit log ───────────────────────────────────────────────────────────── */

export type AuditActorType = "customer" | "sales" | "system";

export interface AuditLogEntry extends Timestamps {
  _id: ObjectId;
  entityType: string;
  entityId: ObjectId;
  ref?: string;
  action: string;
  fromStatus?: string;
  toStatus?: string;
  actor: { type: AuditActorType; id?: ObjectId; name?: string };
  message?: string;
  meta?: Record<string, unknown>;
}

/** Payload submitted by the store procurement workspaces to POST /api/rfq. */
export interface RfqSubmission {
  kind: QuoteKind;
  source: RfqSource;
  contact: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    company?: string;
    country?: string;
    address?: string;
  };
  items: {
    productId?: string;
    sku?: string;
    name: string;
    brand?: string;
    imageUrl?: string;
    quantity: number;
    notes?: string;
    /** Product not listed on the website — details provided manually */
    custom?: boolean;
  }[];
  /** Pre-uploaded supporting document ids (from POST /api/rfq/attachments) */
  attachmentIds?: string[];
  message?: string;
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export type AdminRole = "super_admin" | "manager" | "editor" | "viewer" | "support";

export interface Admin extends Timestamps {
  _id: ObjectId;
  username: string;
  email: string;
  name: string;
  role: AdminRole;
  permissions: string[];
  mfaEnabled: boolean;
  lastLoginAt?: Date;
  status: "active" | "suspended";
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export type AnalyticsEventType =
  | "pageview"
  | "product_view"
  | "search"
  | "add_to_cart"
  | "rfq_submit"
  | "order_complete"
  | "brand_view"
  | "category_view"
  | "document_download"
  | "click";

export interface AnalyticsEvent extends Timestamps {
  _id: ObjectId;
  sessionId: string;
  userId?: ObjectId;
  eventType: AnalyticsEventType;
  path: string;
  referrer?: string;
  utm: {
    source?: string;
    medium?: string;
    campaign?: string;
    term?: string;
    content?: string;
  };
  properties: Record<string, unknown>;
  country?: string;
  device: "desktop" | "mobile" | "tablet";
  os?: string;
  browser?: string;
  hostname: string;
}

// ─── Meilisearch Settings ─────────────────────────────────────────────────────

export interface MeiliTypoTolerance {
  enabled: boolean;
  minWordSizeForTypos: { oneTypo: number; twoTypos: number };
  disableOnWords?: string[];
  disableOnAttributes?: string[];
}

export interface MeiliSettings {
  searchableAttributes: string[];
  filterableAttributes: string[];
  sortableAttributes: string[];
  rankingRules: string[];
  synonyms: Record<string, string[]>;
  stopWords: string[];
  distinctAttribute: string | null;
  typoTolerance: MeiliTypoTolerance;
  faceting: { maxValuesPerFacet: number };
  pagination: { maxTotalHits: number };
  dictionary: string[];
  separatorTokens: string[];
  nonSeparatorTokens: string[];
}

export interface SearchConfigVersion {
  _id: string;
  index: string;
  version: number;
  note: string;
  isActive: boolean;
  appliedAt: string | null;
  appliedBy: string | null;
  settings: MeiliSettings;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export type SearchIndexName = "products" | "assets" | "brands" | "categories" | "articles" | "documents";

export const SEARCH_INDEX_LABELS: Record<SearchIndexName, string> = {
  products:   "Products",
  assets:     "Media Assets",
  brands:     "Brands",
  categories: "Categories",
  articles:   "Articles",
  documents:  "Documents",
};

// ─── Search ───────────────────────────────────────────────────────────────────

export interface SearchProductRecord {
  id: string;
  sku: string;
  mpn: string;
  name: string;
  shortDescription: string;
  brandSlug: string;
  brandName: string;
  categories: string[];
  hierarchicalCategories: {
    lvl0?: string;
    lvl1?: string;
    lvl2?: string;
    lvl3?: string;
  };
  tags: string[];
  filterTags: string[];
  /** Spec key-value pairs in "Spec Name::value" format for dynamic faceted filtering */
  specValues: string[];
  imageUrl: string;
  listPrice: number;
  currency: string;
  inStock: boolean;
  isNew: boolean;
  isFeatured: boolean;
  isClearance: boolean;
  discount: number;
  relevanceScore: number;
  views: number;
  salesCount: number;
  status: "active" | "inactive" | "discontinued" | "draft";
}

export interface SearchFilters {
  brands?: string[];
  categories?: string[];
  priceMin?: number;
  priceMax?: number;
  inStock?: boolean;
  isClearance?: boolean;
  tags?: string[];
  /** Spec filter values in "Spec Name::value" format */
  specs?: string[];
  [key: string]: unknown;
}

export interface SearchResult<T> {
  hits: T[];
  totalHits: number;
  page: number;
  totalPages: number;
  processingTimeMs: number;
  query: string;
  facets?: Record<string, Record<string, number>>;
}

// ─── CMS / Content ───────────────────────────────────────────────────────────

export interface Article extends Timestamps {
  _id: ObjectId;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  coverImage?: Media;
  author: { name: string; avatar?: string; title?: string };
  category: string;
  tags: string[];
  publishedAt?: Date;
  status: "draft" | "published" | "archived";
  seo: SeoMeta;
}

export interface Solution extends Timestamps {
  _id: ObjectId;
  slug: string;
  title: string;
  tagline: string;
  description: string;
  coverImage?: Media;
  icon?: string;
  industries: string[];
  products: ObjectId[];
  documents: Document[];
  seo: SeoMeta;
  status: "active" | "inactive";
}

export interface Industry extends Timestamps {
  _id: ObjectId;
  slug: string;
  name: string;
  description: string;
  coverImage?: Media;
  icon?: string;
  solutions: ObjectId[];
  seo: SeoMeta;
  status: "active" | "inactive";
}

// ─── Odoo Integration ────────────────────────────────────────────────────────

export interface OdooSyncStatus {
  entityType: "product" | "customer" | "order" | "invoice" | "inventory";
  entityId: ObjectId;
  odooId: number;
  lastSyncedAt: Date;
  syncStatus: "synced" | "pending" | "error";
  errorMessage?: string;
}

// ─── API Responses ───────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── Quote workflow (pure, client-safe helpers) ─────────────────────────────

export * from "./quote-workflow";

// ─── Shared utilities ────────────────────────────────────────────────────────

export * from "./slugify";

// ─── Validation (zod schemas for API request bodies) ───────────────────────

export * from "./validation";
