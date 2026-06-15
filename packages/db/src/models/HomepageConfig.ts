import { Schema, model, models } from "mongoose";

/* ─── Carousel sub-schemas ────────────────────────────────────────────────── */
const SlideSchema = new Schema({
  id:                  { type: String, required: true },
  title:               { type: String, default: "" },
  subtitle:            { type: String, default: "" },
  badge:               { type: String, default: "" },
  desktopImage:        { type: String, default: "" },
  mobileImage:         { type: String, default: "" },
  ctaLabel:            { type: String, default: "" },
  ctaHref:             { type: String, default: "" },
  ctaSecondaryLabel:   { type: String, default: "" },
  ctaSecondaryHref:    { type: String, default: "" },
  align:               { type: String, enum: ["left", "right", "center"], default: "left" },
  enabled:             { type: Boolean, default: true },
  startAt:             { type: String, default: null },
  endAt:               { type: String, default: null },
  order:               { type: Number, default: 0 },
}, { _id: false });

const SidePanelSchema = new Schema({
  id:    { type: String, required: true },
  title: { type: String, default: "" },
  desc:  { type: String, default: "" },
  href:  { type: String, default: "" },
  image: { type: String, default: "" },
  badge: { type: String, default: "" },
  order: { type: Number, default: 0 },
}, { _id: false });

const CarouselSchema = new Schema({
  autoplayInterval: { type: Number, default: 5000 },
  slides:           { type: [SlideSchema], default: [] },
  sidePanels:       { type: [SidePanelSchema], default: [] },
}, { _id: false });

/* ─── Section sub-schema (flexible config) ────────────────────────────────── */
const SectionSchema = new Schema({
  id:      { type: String, required: true },
  type:    { type: String, required: true },
  label:   { type: String, default: "" },
  enabled: { type: Boolean, default: true },
  order:   { type: Number, default: 0 },
  config:  { type: Schema.Types.Mixed, default: {} },
}, { _id: false });

/* ─── Main config schema ──────────────────────────────────────────────────── */
const HomepageConfigSchema = new Schema(
  {
    status:      { type: String, enum: ["draft", "published"], required: true, index: true },
    version:     { type: Number, default: 0 },
    publishedAt: { type: Date,   default: null },
    publishedBy: { type: String, default: null },
    carousel:    { type: CarouselSchema, default: () => ({}) },
    sections:    { type: [SectionSchema], default: [] },
  },
  { timestamps: true, collection: "homepage_configs" }
);

HomepageConfigSchema.index({ status: 1 }, { unique: true });

/* ─── History schema (snapshots of published versions) ───────────────────── */
const HomepageHistorySchema = new Schema(
  {
    version:     { type: Number, required: true },
    publishedAt: { type: Date, required: true },
    publishedBy: { type: String, default: "" },
    snapshot:    { type: Schema.Types.Mixed, required: true },
  },
  { timestamps: true, collection: "homepage_history" }
);

export const HomepageConfigModel =
  models.HomepageConfig ?? model("HomepageConfig", HomepageConfigSchema, "homepage_configs");

export const HomepageHistoryModel =
  models.HomepageHistory ?? model("HomepageHistory", HomepageHistorySchema, "homepage_history");

/* ─── TypeScript interfaces ───────────────────────────────────────────────── */
export interface HpSlide {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  desktopImage: string;
  mobileImage: string;
  ctaLabel: string;
  ctaHref: string;
  ctaSecondaryLabel: string;
  ctaSecondaryHref: string;
  align: "left" | "right" | "center";
  enabled: boolean;
  startAt: string | null;
  endAt: string | null;
  order: number;
}

export interface HpSidePanel {
  id: string;
  title: string;
  desc: string;
  href: string;
  image: string;
  badge: string;
  order: number;
}

export interface HpCarousel {
  autoplayInterval: number;
  slides: HpSlide[];
  sidePanels: HpSidePanel[];
}

export type HpSectionType =
  | "services_bar"
  | "quick_access"
  | "promo_banners"
  | "categories"
  | "featured_products"
  | "full_width_banner"
  | "brands_ticker"
  | "industries"
  | "why_choose"
  | "stats"
  | "resources"
  | "cta";

export interface HpSection {
  id: string;
  type: HpSectionType;
  label: string;
  enabled: boolean;
  order: number;
  config: object;
}

export interface HomepageConfigData {
  status: "draft" | "published";
  version: number;
  publishedAt: string | null;
  publishedBy: string | null;
  carousel: HpCarousel;
  sections: HpSection[];
}

export interface HomepageHistoryEntry {
  _id: string;
  version: number;
  publishedAt: string;
  publishedBy: string;
}

/* ─── Section config interfaces ───────────────────────────────────────────── */
export interface ServicesBarConfig {
  items: Array<{ id: string; title: string; desc: string; color: string; iconPath: string; order: number }>;
}

export interface QuickAccessConfig {
  links: Array<{ id: string; label: string; href: string; iconPath: string }>;
}

export interface PromoBannerItem {
  id: string; headline: string; sub: string; cta: string;
  href: string; image: string; badge: string; badgeColor: string;
  enabled: boolean; order: number;
}
export interface PromoBannersConfig { banners: PromoBannerItem[] }

export interface CategoriesConfig {
  title: string; subtitle: string; label: string; showViewAll: boolean; limit: number;
}

export interface FeaturedProductsConfig {
  title: string; subtitle: string; label: string;
  sort: "newest" | "featured" | "clearance"; limit: number;
  brandSlug: string; categorySlug: string;
}

export interface FullWidthBannerConfig {
  desktopImage: string; mobileImage: string;
  href: string; altText: string;
  aspectDesktop: string; aspectMobile: string;
}

export interface BrandsTickerConfig {
  title: string; subtitle: string; showViewAll: boolean;
}

export interface IndustriesConfig {
  title: string; subtitle: string; label: string;
}

export interface WhyChooseItem {
  id: string; title: string; desc: string; accent: string; iconPath: string;
}
export interface WhyChooseConfig {
  title: string; subtitle: string; items: WhyChooseItem[];
}

export interface StatItem { id: string; value: string; label: string; desc: string }
export interface StatsConfig { items: StatItem[]; footnotes: string[] }

export interface ResourceItem {
  id: string; title: string; desc: string; href: string; iconPath: string;
}
export interface ResourcesConfig {
  title: string; subtitle: string; label: string; items: ResourceItem[];
}

export interface CTAConfig {
  badge: string; title: string; subtitle: string;
  primaryLabel: string; primaryHref: string;
  secondaryLabel: string; secondaryHref: string;
  phone: string; footnotes: string[];
}

/* ─── Default configuration ───────────────────────────────────────────────── */
export const DEFAULT_HOMEPAGE_CONFIG: Omit<HomepageConfigData, "status" | "version" | "publishedAt" | "publishedBy"> = {
  carousel: {
    autoplayInterval: 5000,
    slides: [
      {
        id: "slide-1", order: 0, enabled: true, align: "left",
        title: "TeSys 100 — Next-Generation Motor Control",
        subtitle: "The all-in-one motor starter with built-in protection, monitoring and connectivity for Industry 4.0.",
        badge: "New Arrival",
        desktopImage: "/images/home/TeSys_100_-_Desktop_-_1920_448.jpg",
        mobileImage: "/images/home/TeSys_100_-_Mobile_-_375_245.jpg",
        ctaLabel: "Explore TeSys 100", ctaHref: "/search?q=tesys+100",
        ctaSecondaryLabel: "Request Quote", ctaSecondaryHref: "/rfq",
        startAt: null, endAt: null,
      },
      {
        id: "slide-2", order: 1, enabled: true, align: "left",
        title: "Acti 9 — Complete Low-Voltage Protection",
        subtitle: "Modular circuit breakers, RCDs and surge protection for residential and commercial applications.",
        badge: "",
        desktopImage: "/images/home/Acti_9_Desktop.jpg",
        mobileImage: "/images/home/Acti_9_Mobile.jpg",
        ctaLabel: "Shop Acti 9", ctaHref: "/search?q=acti+9",
        ctaSecondaryLabel: "View Catalogue", ctaSecondaryHref: "/library",
        startAt: null, endAt: null,
      },
      {
        id: "slide-3", order: 2, enabled: true, align: "left",
        title: "TeSys Deca Contactors",
        subtitle: "High-performance contactors designed for demanding industrial environments across all power ratings.",
        badge: "",
        desktopImage: "/images/home/Tesys_Deca_Desktop.jpg",
        mobileImage: "/images/home/Tesys_Deca_Mobile.jpg",
        ctaLabel: "Shop Contactors", ctaHref: "/search/contactors-and-protection-relays",
        ctaSecondaryLabel: "", ctaSecondaryHref: "",
        startAt: null, endAt: null,
      },
      {
        id: "slide-4", order: 3, enabled: true, align: "left",
        title: "AvatarOn — Smart Wiring Devices",
        subtitle: "Premium switches, sockets and home automation devices combining elegant design with smart technology.",
        badge: "Featured",
        desktopImage: "/images/home/AvatarOn-desktop.webp",
        mobileImage: "/images/home/AvatarOn-mobile.jpg",
        ctaLabel: "Browse AvatarOn", ctaHref: "/search?q=avataon",
        ctaSecondaryLabel: "", ctaSecondaryHref: "",
        startAt: null, endAt: null,
      },
      {
        id: "slide-5", order: 4, enabled: true, align: "left",
        title: "WEG Electric Motors",
        subtitle: "World-class IE2 and IE3 motors for pumps, compressors, fans and industrial drives across all frame sizes.",
        badge: "",
        desktopImage: "/images/home/WEG_Hero image.jpg",
        mobileImage: "",
        ctaLabel: "Shop WEG Motors", ctaHref: "/search?q=weg+motor",
        ctaSecondaryLabel: "View WEG Brand", ctaSecondaryHref: "/brands/weg",
        startAt: null, endAt: null,
      },
    ],
    sidePanels: [
      {
        id: "panel-1", order: 0,
        title: "Schneider Electric — Authorized Partner",
        desc: "Complete range of electrical distribution and automation products",
        href: "/brands/schneider-electric",
        image: "/images/home/carousel/hero/Home page - Schneider.jpg",
        badge: "Authorized Partner",
      },
      {
        id: "panel-2", order: 1,
        title: "EV Charging Solutions",
        desc: "Accelerating sustainable mobility across Ghana",
        href: "/search?q=ev+charger",
        image: "/images/home/ev-charger.jpeg",
        badge: "New Category",
      },
    ],
  },
  sections: [
    {
      id: "sec-services", type: "services_bar", label: "Services Bar", enabled: true, order: 0,
      config: {
        items: [
          { id: "s1", order: 0, title: "6,000+ Products", desc: "Available for immediate order", color: "#0057b8", iconPath: "M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" },
          { id: "s2", order: 1, title: "Fast Nationwide Delivery", desc: "VIP Bus · Courier · Carriers", color: "#0891b2", iconPath: "M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" },
          { id: "s3", order: 2, title: "Warehouse Pickup", desc: "Collect same day in Accra", color: "#d97706", iconPath: "M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016 2.993 2.993 0 0 0 2.25-1.016 3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z" },
          { id: "s4", order: 3, title: "Dedicated Technical Support", desc: "Engineers on call Mon–Fri", color: "#7c3aed", iconPath: "M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" },
        ],
      } as ServicesBarConfig,
    },
    {
      id: "sec-quick", type: "quick_access", label: "Quick Access", enabled: true, order: 1,
      config: {
        links: [
          { id: "q1", label: "My Orders", href: "/account?tab=orders", iconPath: "M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" },
          { id: "q2", label: "Favourites", href: "/account?tab=wishlist", iconPath: "M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" },
          { id: "q3", label: "Order Status", href: "/account?tab=orders", iconPath: "M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" },
          { id: "q4", label: "My Quotes", href: "/account?tab=quotes", iconPath: "M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" },
          { id: "q5", label: "Contact Support", href: "/contact", iconPath: "M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" },
        ],
      } as QuickAccessConfig,
    },
    {
      id: "sec-promo", type: "promo_banners", label: "Promo Banners", enabled: true, order: 2,
      config: {
        banners: [
          { id: "b1", order: 0, enabled: true, headline: "Clearance Sale", sub: "Genuine products at reduced prices — limited stock available", cta: "Shop Clearance", href: "/clearance", image: "/images/home/Production-Line-WM.jpg", badge: "Up to 40% Off", badgeColor: "#dc2626" },
          { id: "b2", order: 1, enabled: true, headline: "New Arrivals", sub: "Latest additions from Schneider Electric, WEG and Camozzi", cta: "See What's New", href: "/products?sort=newest", image: "/images/home/SE_APM_Drive_Hero_image.jpg", badge: "Just In", badgeColor: "#0057b8" },
          { id: "b3", order: 2, enabled: true, headline: "Submit an RFQ", sub: "Can't find what you need? Our team sources it. Same-day quotes.", cta: "Request Quote", href: "/rfq", image: "/images/home/dedicated-team-and-technical.jpg", badge: "Free Service", badgeColor: "#3DCD58" },
        ],
      } as PromoBannersConfig,
    },
    {
      id: "sec-categories", type: "categories", label: "Shop by Category", enabled: true, order: 3,
      config: { title: "Shop by Category", subtitle: "6,000+ products organized across our major solution areas", label: "Browse the Catalogue", showViewAll: true, limit: 8 } as CategoriesConfig,
    },
    {
      id: "sec-products", type: "featured_products", label: "Featured Products", enabled: true, order: 4,
      config: { title: "Featured Products", subtitle: "Top-selling industrial products available for immediate order", label: "Popular This Week", sort: "newest", limit: 8, brandSlug: "", categorySlug: "" } as FeaturedProductsConfig,
    },
    {
      id: "sec-banner", type: "full_width_banner", label: "Full-Width Banner", enabled: true, order: 5,
      config: { desktopImage: "/images/home/TeSys_100_-_Desktop_-_1920_448.jpg", mobileImage: "/images/home/TeSys_100_-_Mobile_-_375_245.jpg", href: "/search/contactors-and-protection-relays", altText: "TeSys 100 — Next-Generation Motor Control", aspectDesktop: "1920/448", aspectMobile: "375/245" } as FullWidthBannerConfig,
    },
    {
      id: "sec-brands", type: "brands_ticker", label: "Brands", enabled: true, order: 6,
      config: { title: "Global Brand Partners", subtitle: "Official authorized distributor for 26 leading global manufacturers of industrial technology", showViewAll: true } as BrandsTickerConfig,
    },
    {
      id: "sec-industries", type: "industries", label: "Industries", enabled: true, order: 7,
      config: { title: "We Serve Every Sector", subtitle: "Specialized solutions for the industries that drive West Africa's economy", label: "Industry Solutions" } as IndustriesConfig,
    },
    {
      id: "sec-why", type: "why_choose", label: "Why Choose APT", enabled: true, order: 8,
      config: {
        title: "Why Industry Leaders Choose APT Ghana",
        subtitle: "Six core commitments that set us apart as West Africa's most trusted industrial technology partner",
        items: [
          { id: "w1", title: "25+ Years of Excellence", desc: "Founded in 1999, APT Ghana has built unparalleled expertise in industrial technology for West African industry.", accent: "#0057b8", iconPath: "M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" },
          { id: "w2", title: "Genuine Products Only", desc: "Every product is sourced directly from the manufacturer or an authorized distributor. Certificates of authenticity on request.", accent: "#16a34a", iconPath: "M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" },
          { id: "w3", title: "Free Engineering Support", desc: "Our qualified engineers help with product selection, compatibility checks, and commissioning at no extra cost.", accent: "#7c3aed", iconPath: "M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437 1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008Z" },
          { id: "w4", title: "Same-Day Quotation", desc: "Submit an RFQ before 3 PM and receive a detailed, itemised quotation the same business day.", accent: "#d97706", iconPath: "M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" },
          { id: "w5", title: "Nationwide Delivery", desc: "Fast and reliable delivery to Accra, Kumasi, Takoradi, Tamale, and all major cities across Ghana within 1–3 business days.", accent: "#0891b2", iconPath: "M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" },
          { id: "w6", title: "After-Sales Support", desc: "Warranty processing, returns management, and ongoing technical assistance throughout the full product lifecycle.", accent: "#dc2626", iconPath: "M16.712 4.33a9.027 9.027 0 0 1 1.652 1.306c.51.51.944 1.064 1.306 1.652M16.712 4.33l-3.448 4.138m3.448-4.138a9.014 9.014 0 0 0-9.424 0M19.67 7.288l-4.138 3.448m4.138-3.448a9.014 9.014 0 0 1 0 9.424m-4.138-5.976a3.736 3.736 0 0 0-.88-1.388 3.737 3.737 0 0 0-1.388-.88m2.268 2.268a3.765 3.765 0 0 1 0 2.528m-2.268-4.796a3.765 3.765 0 0 0-2.528 0m4.796 4.796c-.181.506-.475.982-.88 1.388a3.736 3.736 0 0 1-1.388.88m2.268-2.268 4.138 3.448m0 0a9.027 9.027 0 0 1-1.306 1.652c-.51.51-1.064.944-1.652 1.306m0 0-3.448-4.138m3.448 4.138a9.014 9.014 0 0 1-9.424 0m5.976-4.138a3.765 3.765 0 0 1-2.528 0m0 0a3.736 3.736 0 0 1-1.388-.88 3.737 3.737 0 0 1-.88-1.388m2.268 2.268L7.288 19.67m0 0a9.024 9.024 0 0 1-1.652-1.306 9.027 9.027 0 0 1-1.306-1.652m0 0 4.138-3.448M4.33 16.712a9.014 9.014 0 0 1 0-9.424m4.138 5.976a3.765 3.765 0 0 1 0-2.528m0 2.528c.181.506.475.982.88 1.388a3.736 3.736 0 0 0 1.388.88m-2.268-2.268L4.33 7.288m6.406 1.18L7.288 4.33m0 0a9.024 9.024 0 0 0-1.652 1.306A9.025 9.025 0 0 0 4.33 7.288" },
        ],
      } as WhyChooseConfig,
    },
    {
      id: "sec-stats", type: "stats", label: "Stats", enabled: true, order: 9,
      config: {
        items: [
          { id: "st1", value: "25+", label: "Years in Operation", desc: "Serving West Africa since 1999" },
          { id: "st2", value: "6,000+", label: "Product Lines", desc: "Across 6 major categories" },
          { id: "st3", value: "26", label: "Global Brand Partners", desc: "All manufacturer-authorized" },
          { id: "st4", value: "500+", label: "Projects Delivered", desc: "Mining, manufacturing & energy" },
        ],
        footnotes: ["ISO 9001 Certified", "GSA Registered", "Authorized Manufacturer Distributor"],
      } as StatsConfig,
    },
    {
      id: "sec-resources", type: "resources", label: "Resources", enabled: true, order: 10,
      config: {
        title: "Technical Resources",
        subtitle: "APT Ghana is more than a store — we're a knowledge platform for industrial professionals",
        label: "Technical Library",
        items: [
          { id: "r1", title: "Technical Datasheets", desc: "Product specifications, electrical diagrams, and dimensional drawings.", href: "/library?type=datasheets", iconPath: "M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" },
          { id: "r2", title: "Installation Manuals", desc: "Step-by-step installation guides and wiring diagrams for all categories.", href: "/library?type=manuals", iconPath: "M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" },
          { id: "r3", title: "Application Guides", desc: "Industry-specific notes for mining, manufacturing, energy, and utilities.", href: "/library?type=guides", iconPath: "M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" },
          { id: "r4", title: "Product Videos", desc: "Commissioning tutorials, product demonstrations, and technical training.", href: "/library?type=videos", iconPath: "m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" },
        ],
      } as ResourcesConfig,
    },
    {
      id: "sec-cta", type: "cta", label: "CTA Banner", enabled: true, order: 11,
      config: {
        badge: "Ready to Partner With Us?",
        title: "Ready to Power\nYour Operations?",
        subtitle: "Talk to our engineers. Submit an RFQ. Browse 6,000+ products. APT Ghana is ready to support your next project.",
        primaryLabel: "Request a Quote", primaryHref: "/rfq",
        secondaryLabel: "Browse Products", secondaryHref: "/products",
        phone: "+233302123456",
        footnotes: ["ISO 9001 Quality Management", "Authorized Manufacturer Distributor", "Ghana Standards Authority Registered"],
      } as CTAConfig,
    },
  ],
};
