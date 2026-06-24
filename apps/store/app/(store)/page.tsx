import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { connectDB, ProductModel, BrandModel, CategoryModel, IndustryModel } from "@apt/db";
import { STORE_URL, CONTACT_PHONE, SOCIAL_LINKS } from "@apt/config";
import { safeJsonLd } from "@apt/auth";
import type {
  HpSlide, HpSidePanel,
  ServicesBarConfig, PromoBannersConfig,
  FeaturedProductsConfig, FullWidthBannerConfig, BrandsTickerConfig,
  IndustriesConfig, WhyChooseConfig, StatsConfig, ResourcesConfig, CTAConfig,
} from "@apt/db";
import HeroCarousel, { type HeroSlide } from "@/components/home/HeroCarousel";
import { getPublishedHomepageConfig } from "@/lib/homepage";
import ProductCard, { ProductCardData } from "@/components/products/ProductCard";

export const metadata: Metadata = {
  title: "APT Ghana Store | Industrial Technology Platform",
  description:
    "Ghana's premier industrial technology platform. 6,000+ electrical, automation, pneumatic, and power products from 26 global brands. Free technical support with every order.",
  openGraph: {
    title: "APT Ghana Store | Industrial Technology Platform",
    description:
      "6,000+ industrial products from 26 global brands. Serving mining, manufacturing, energy, and utilities across West Africa since 1999.",
    url: STORE_URL,
    type: "website",
  },
};

export const revalidate = 3600;

/* ─── Types ───────────────────────────────────────────────────────────────── */

interface Brand { _id: string; name: string; slug: string; }
interface DBCategory { _id: string; name: string; slug: string; shortDescription?: string; }
interface DBIndustry { _id: string; name: string; slug: string; shortDescription?: string; accentColor?: string; }

/* Static brand fallback removed — brands section shows empty when DB has none */

const INDUSTRY_ICONS: Record<string, string> = {
  "mining": "M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 2.625c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125m16.5 5.625c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125",
  "manufacturing": "M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437 1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008Z",
  "energy": "M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z",
  "water": "M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z",
  "construction": "M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z",
  "food-beverage": "M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0 1 12 15a9.065 9.065 0 0 1-6.23-.693L5 14.5m14.8.8 1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0 1 12 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5",
};
const FALLBACK_ICON = INDUSTRY_ICONS[ "mining" ];

/* ─── Data fetching ───────────────────────────────────────────────────────── */
async function getHomeData() {
  try {
    await connectDB();

    const [ featuredProducts, dbIndustries ] =
      await Promise.all([
        ProductModel.find({
          status: "active",
        })
          .sort({ createdAt: -1 })
          .limit(8)
          .select("_id name slug sku mpn shortDescription brandSlug images.main pricing inventory.quantity inventory.reservedQuantity isClearance isNew isFeatured discount")
          .lean(),

        (IndustryModel as any)
          .find({ status: "active" })
          .sort({ displayOrder: 1 })
          .select("name slug shortDescription accentColor")
          .lean(),
      ]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const products: ProductCardData[] = featuredProducts.map((p: any) => ({
      id: String(p._id),
      name: p.name,
      slug: p.slug,
      sku: p.sku,
      mpn: p.mpn,
      brandSlug: p.brandSlug ?? "",
      shortDescription: p.shortDescription,
      image: { url: p.images?.main?.url ?? "", alt: p.images?.main?.alt ?? p.name },
      pricing: {
        listPrice: p.pricing?.listPrice ?? 0,
        tradePrice: p.pricing?.tradePrice,
        currency: p.pricing?.currency ?? "USD",
        minimumOrderQty: p.pricing?.minimumOrderQty,
      },
      inStock: (p.inventory?.quantity ?? 0) > (p.inventory?.reservedQuantity ?? 0),
      isClearance: p.isClearance ?? false,
      isNew: p.isNew ?? false,
      isFeatured: p.isFeatured ?? false,
      discount: p.discount ?? 0,
    }));

    return {
      products,
      dbIndustries: JSON.parse(
        JSON.stringify(dbIndustries)
      ) as DBIndustry[],
    };
  } catch {
    return {
      products: [],
      dbIndustries: [],
    };
  }
}

/* ─── Page ────────────────────────────────────────────────────────────────── */
export default async function StorePage() {
  const [ { products, dbIndustries }, hpConfig ] = await Promise.all([
    getHomeData(),
    getPublishedHomepageConfig(),
  ]);

  /* Map carousel data from config */
  const now = new Date();
  const carouselSlides: HeroSlide[] = hpConfig.carousel.slides
    .filter((s: HpSlide) => {
      if (!s.enabled) return false;
      if (s.startAt && new Date(s.startAt) > now) return false;
      if (s.endAt && new Date(s.endAt) < now) return false;
      return true;
    })
    .sort((a: HpSlide, b: HpSlide) => a.order - b.order)
    .map((s: HpSlide) => ({
      title: s.title, subtitle: s.subtitle, badge: s.badge, align: s.align,
      cta: { label: s.ctaLabel, href: s.ctaHref },
      ctaSecondary: s.ctaSecondaryLabel ? { label: s.ctaSecondaryLabel, href: s.ctaSecondaryHref } : undefined,
      desktopSrc: s.desktopImage, mobileSrc: s.mobileImage,
    }));

  const sidePanels = hpConfig.carousel.sidePanels
    .sort((a: HpSidePanel, b: HpSidePanel) => a.order - b.order)
    .map((p: HpSidePanel) => ({ title: p.title, desc: p.desc, href: p.href, image: p.image, badge: p.badge }));

  /* Ordered visible sections */
  const sections = [ ...hpConfig.sections ]
    .filter((s) => s.enabled)
    .sort((a, b) => a.order - b.order);

  const organizationLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "APT Ghana",
    url: STORE_URL,
    logo: `${STORE_URL}/logo.png`,
    contactPoint: {
      "@type": "ContactPoint",
      telephone: CONTACT_PHONE,
      contactType: "sales",
      areaServed: "GH",
    },
    sameAs: [ SOCIAL_LINKS.linkedin, SOCIAL_LINKS.twitter, SOCIAL_LINKS.youtube ],
  };

  return (
    <main className="flex-1">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(organizationLd) }} />
      {/* Hero */}
      <section className="bg-theme-surface pt-4 pb-4 sm:pt-5 sm:pb-5">
        <div className="container-store">
          <HeroCarousel slides={carouselSlides.length > 0 ? carouselSlides : []} sidePanels={sidePanels} />
        </div>
      </section>

      {/* Render sections in config order */}
      {sections.map((section) => {
        const cfg = section.config as unknown;
        switch (section.type) {
          case "services_bar":
            return <ServicesBar key={section.id} cfg={cfg as ServicesBarConfig} />;
          case "quick_access":
            return <QuickAccessBar key={section.id} />;
          case "promo_banners":
            return <PromoBannersSection key={section.id} cfg={cfg as PromoBannersConfig} />
          case "featured_products":
            return products.length > 0 ? (
              <FeaturedProductsSection
                key={section.id}
                products={products}
                cfg={cfg as FeaturedProductsConfig}
              />
            ) : null;
          case "full_width_banner":
            return <FullWidthPromoBanner key={section.id} cfg={cfg as FullWidthBannerConfig} />;
          case "industries":
            return (
              <IndustriesSection
                key={section.id}
                dbIndustries={dbIndustries}
                cfg={cfg as IndustriesConfig}
              />
            );
          case "why_choose":
            return <WhyChooseSection key={section.id} cfg={cfg as WhyChooseConfig} />;
          case "stats":
            return <StatsSection key={section.id} cfg={cfg as StatsConfig} />;
          case "resources":
            return <ResourcesSection key={section.id} cfg={cfg as ResourcesConfig} />;
          case "cta":
            return <CTASection key={section.id} cfg={cfg as CTAConfig} />;
          default:
            return null;
        }
      })}
    </main>
  );
}

/* ─── Services bar ────────────────────────────────────────────────────────── */
function ServicesBar({ cfg }: { cfg?: ServicesBarConfig }) {
  const items = cfg?.items?.length
    ? cfg.items.sort((a, b) => a.order - b.order)
    : [
      { id: "1", order: 0, title: "6,000+ Products", desc: "Available for immediate order", accent: "#0057b8", iconPath: "M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" },
      { id: "2", order: 1, title: "Fast Nationwide Delivery", desc: "VIP Bus · Courier · Carriers", color: "#0891b2", iconPath: "M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" },
      { id: "3", order: 2, title: "Warehouse Pickup", desc: "Collect same day in Accra", color: "#d97706", iconPath: "M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016 2.993 2.993 0 0 0 2.25-1.016 3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z" },
      { id: "4", order: 3, title: "Dedicated Technical Support", desc: "Engineers on call Mon–Fri", color: "#7c3aed", iconPath: "M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" },
    ];

  return (
    <div className="bg-theme-surface border-y border-theme">
      <div className="container-store">
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-theme">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-3 py-4 px-5">
              <div className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: item.color + "14" }}>
                {item.iconPath && (
                  <svg className="w-[18px] h-[18px]" style={{ color: item.color }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={item.iconPath} />
                  </svg>
                )}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-theme-1 text-sm leading-snug truncate">{item.title}</p>
                <p className="text-xs text-theme-3 mt-0.5 truncate">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Quick access ────────────────────────────────────────────────────────── */
function QuickAccessBar() {
  const links = [
    { label: "My Orders", href: "/account?tab=orders", d: "M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" },
    { label: "Favourites", href: "/account?tab=wishlist", d: "M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" },
    { label: "Order Status", href: "/account?tab=orders", d: "M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" },
    { label: "My Quotes", href: "/account?tab=quotes", d: "M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" },
    { label: "Contact Support", href: "/contact", d: "M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" },
  ];

  return (
    <div className="bg-theme-base border-b border-theme">
      <div className="container-store py-4">
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <div className="grid grid-cols-5 gap-2 px-4 sm:px-0 min-w-[320px]">
            {links.map((link) => (
              <Link
                key={link.href + link.label}
                href={link.href}
                className="group flex flex-col items-center gap-2 py-3.5 px-2 bg-theme-surface border border-theme rounded-2xl hover:border-navy-500/30 hover:shadow-md transition-all duration-150"
              >
                <div className="w-8 h-8 rounded-lg bg-theme-raised flex items-center justify-center group-hover:bg-navy-50 dark:group-hover:bg-navy-900/30 transition-colors">
                  <svg className="w-4 h-4 text-theme-3 group-hover:text-navy-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={link.d} />
                  </svg>
                </div>
                <span className="text-[11px] sm:text-xs font-semibold text-theme-2 group-hover:text-navy-500 transition-colors text-center leading-snug">
                  {link.label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── 3-column promotional strip ─────────────────────────────────────────── */
function PromoBannersSection({ cfg }: { cfg?: PromoBannersConfig }) {
  const banners = cfg?.banners?.length
    ? cfg.banners
    : [
      { id: "1", headline: "Clearance Sale", sub: "Genuine products at reduced prices — limited stock available", cta: "Shop Clearance", href: "/clearance", image: "/images/home/Production-Line-WM.jpg", badge: "Up to 40% Off", badgeColor: "#dc2626" },
      { id: "2", headline: "New Arrivals", sub: "Latest additions from Schneider Electric, WEG and Camozzi", cta: "See What's New", href: "/catalog?sort=newest", image: "/images/home/SE_APM_Drive_Hero_image.jpg", badge: "Just In", badgeColor: "#0057b8" },
      { id: "3", headline: "Submit an RFQ", sub: "Can't find what you need? Our team sources it. Same-day quotes.", cta: "Request Quote", href: "/rfq", image: "/images/home/dedicated-team-and-technical.jpg", badge: "Free Service", badgeColor: "#3DCD58" },
    ];

  return (
    <section className="py-6 bg-theme-base border-b border-theme">
      <div className="container-store">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {banners.map((b) => (
            <Link key={b.id} href={b.href} className="group relative h-40 sm:h-44 rounded-2xl overflow-hidden shadow">
              <Image src={b.image} alt={b.headline} fill loading="lazy" sizes="(max-width: 640px) 100vw, 33vw"
                className="object-cover object-center group-hover:scale-105 transition-transform duration-700" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/40 to-transparent" />
              <div className="absolute inset-0 p-5 flex flex-col justify-center">
                <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mb-2 w-fit"
                  style={{ background: b.badgeColor + "22", color: b.badgeColor, border: `1px solid ${b.badgeColor}40` }}>
                  {b.badge}
                </span>
                <h3 className="text-base font-bold text-white leading-snug">{b.headline}</h3>
                <p className="text-[11px] text-white/65 mt-1 leading-relaxed line-clamp-2">{b.sub}</p>
                <span className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-bold text-white/90 group-hover:text-white transition-colors">
                  {b.cta}
                  <svg className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Featured products ───────────────────────────────────────────────────── */
function FeaturedProductsSection({ products, cfg }: { products: ProductCardData[]; cfg?: FeaturedProductsConfig }) {
  return (
    <section className="py-14 sm:py-16 bg-theme-base border-t border-theme">
      <div className="container-store">
        <div className="flex items-end justify-between mb-8 gap-4">
          <div>
            <p className="text-xs font-bold text-navy-500 uppercase tracking-widest mb-1">{cfg?.label ?? "Popular This Week"}</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-theme-1 tracking-tight">{cfg?.title ?? "Featured Products"}</h2>
            {cfg?.subtitle && <p className="text-theme-3 mt-2">{cfg.subtitle}</p>}
          </div>
          <Link href="/catalog" className="shrink-0 hidden sm:inline-flex items-center gap-1.5 text-sm font-bold text-navy-500 hover:text-navy-400 transition-colors">
            Browse All
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} layout="grid" />
          ))}
        </div>
        <div className="mt-8 flex flex-wrap gap-3 justify-center">
          <Link href="/catalog" className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-navy-500 hover:bg-navy-400 text-white font-bold text-sm transition-colors">
            Browse All Products
          </Link>
          <Link href="/clearance" className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl border border-theme bg-theme-surface hover:border-navy-500/30 text-theme-2 hover:text-navy-500 font-semibold text-sm transition-all">
            View Clearance Items
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ─── Full-width promo banner ─────────────────────────────────────────────── */
function FullWidthPromoBanner({ cfg }: { cfg?: FullWidthBannerConfig }) {
  const desktop = cfg?.desktopImage || "/images/home/TeSys_100_-_Desktop_-_1920_448.jpg";
  const mobile = cfg?.mobileImage || "/images/home/TeSys_100_-_Mobile_-_375_245.jpg";
  const href = cfg?.href || "/search/contactors-and-protection-relays";
  const alt = cfg?.altText || "TeSys 100 — Next-Generation Motor Control";
  const aspectD = cfg?.aspectDesktop?.replace("/", "/") || "1920/448";
  const aspectM = cfg?.aspectMobile?.replace("/", "/") || "375/245";

  return (
    <section className="py-6 bg-theme-surface border-t border-theme">
      <div className="container-store">
        <Link href={href} className="group block relative w-full overflow-hidden rounded-2xl shadow-lg">
          <div className="hidden sm:block relative w-full" style={{ aspectRatio: aspectD }}>
            <Image src={desktop} alt={alt} fill loading="lazy" sizes="(max-width: 1440px) 100vw, 1440px"
              className="object-cover object-center group-hover:scale-[1.01] transition-transform duration-700" />
          </div>
          <div className="sm:hidden relative w-full" style={{ aspectRatio: aspectM }}>
            <Image src={mobile} alt={alt} fill loading="lazy" sizes="100vw"
              className="object-cover object-center group-hover:scale-[1.01] transition-transform duration-700" />
          </div>
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-2xl" />
          <span className="absolute bottom-4 right-4 inline-flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-sm text-navy-900 font-bold text-xs rounded-xl shadow opacity-0 group-hover:opacity-100 transition-all translate-y-1 group-hover:translate-y-0 duration-200">
            Shop Now
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </span>
        </Link>
      </div>
    </section>
  );
}

/* ─── Brands ticker ───────────────────────────────────────────────────────── */
function BrandsSection({ brands, cfg }: { brands: Brand[]; cfg?: BrandsTickerConfig }) {
  const tileWidth = 150;
  return (
    <section className="py-14 sm:py-16 bg-navy-950 border-y border-white/[0.05] overflow-hidden">
      <div className="container-store mb-10">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <p className="text-xs font-bold text-navy-300 uppercase tracking-widest mb-1">Authorized Distributor</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">{cfg?.title ?? "Global Brand Partners"}</h2>
            {cfg?.subtitle && <p className="text-white/35 mt-2 text-sm max-w-lg">{cfg.subtitle}</p>}
          </div>
          {(cfg?.showViewAll ?? true) && (
            <Link href="/brands" className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/10 hover:border-white/25 text-sm font-semibold text-white/50 hover:text-white transition-all">
              All Brands <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
            </Link>
          )}
        </div>
      </div>
      <div className="relative overflow-hidden">
        <div className="flex animate-marquee" style={{ width: "max-content" }}>
          {[ ...brands, ...brands ].map((brand, i) => (
            <a key={`${brand._id}-${i}`} href={`/brands/${brand.slug}`}
              className="group flex items-center justify-center shrink-0 mx-2 h-14 px-5 bg-white/[0.04] border border-white/[0.07] rounded-xl hover:bg-white/[0.09] hover:border-white/20 transition-all duration-200"
              style={{ minWidth: `${tileWidth}px` }}>
              <span className="text-[11px] font-bold text-white/40 group-hover:text-white/80 transition-colors text-center leading-tight whitespace-nowrap">
                {brand.name}
              </span>
            </a>
          ))}
        </div>
        <div className="absolute left-0 top-0 bottom-0 w-24 pointer-events-none" style={{ background: "linear-gradient(to right, #050d1a, transparent)" }} />
        <div className="absolute right-0 top-0 bottom-0 w-24 pointer-events-none" style={{ background: "linear-gradient(to left, #050d1a, transparent)" }} />
      </div>
    </section>
  );
}

/* ─── Industries ──────────────────────────────────────────────────────────── */
function IndustriesSection({ dbIndustries, cfg }: { dbIndustries: DBIndustry[]; cfg?: IndustriesConfig }) {
  const displayIndustries = dbIndustries.map((ind) => ({
    name: ind.name, desc: ind.shortDescription ?? "",
    href: `/solutions/${ind.slug}`, accent: ind.accentColor ?? "#0057b8",
    icon: INDUSTRY_ICONS[ ind.slug ] ?? FALLBACK_ICON,
  }));

  if (displayIndustries.length === 0) return null;

  return (
    <section className="py-14 sm:py-16 bg-theme-base border-t border-theme">
      <div className="container-store">
        <div className="flex items-end justify-between mb-8 gap-4">
          <div>
            <p className="text-xs font-bold text-se-green uppercase tracking-widest mb-1">{cfg?.label ?? "Industry Solutions"}</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-theme-1 tracking-tight">{cfg?.title ?? "We Serve Every Sector"}</h2>
            {cfg?.subtitle && <p className="text-theme-3 mt-2">{cfg.subtitle}</p>}
          </div>
          <Link href="/solutions" className="shrink-0 hidden sm:inline-flex items-center gap-1.5 text-sm font-bold text-navy-500 hover:text-navy-400 transition-colors">
            All Solutions <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayIndustries.map((ind) => (
            <Link key={ind.href} href={ind.href}
              className="group flex flex-col gap-3 p-6 bg-theme-surface rounded-2xl border border-theme hover:border-navy-500/25 hover:shadow-lg transition-all duration-200">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105" style={{ background: ind.accent + "14" }}>
                <svg className="w-5 h-5" style={{ color: ind.accent }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={ind.icon} />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-theme-1 group-hover:text-navy-500 text-base mb-1.5 transition-colors">{ind.name}</h3>
                <p className="text-sm text-theme-3 leading-relaxed">{ind.desc}</p>
              </div>
              <div className="flex items-center gap-1 text-xs font-bold" style={{ color: ind.accent }}>
                View Solutions
                <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Why choose ──────────────────────────────────────────────────────────── */
function WhyChooseSection({ cfg }: { cfg?: WhyChooseConfig }) {
  const FALLBACK_ITEMS: import("@apt/db").WhyChooseItem[] = [
    { id: "1", title: "25+ Years of Excellence", accent: "#0057b8", desc: "Founded in 1999, APT Ghana has built unparalleled expertise in industrial technology for West African industry.", iconPath: "M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" },
    { id: "2", title: "Genuine Products Only", accent: "#16a34a", desc: "Every product is sourced directly from the manufacturer or an authorized distributor. Certificates of authenticity on request.", iconPath: "M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" },
    { id: "3", title: "Free Engineering Support", accent: "#7c3aed", desc: "Our qualified engineers help with product selection, compatibility checks, and commissioning at no extra cost.", iconPath: "M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437 1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008Z" },
    { id: "4", title: "Same-Day Quotation", accent: "#d97706", desc: "Submit an RFQ before 3 PM and receive a detailed, itemized quotation the same business day — no waiting, no chasing.", iconPath: "M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" },
    { id: "5", title: "Nationwide Delivery", accent: "#0891b2", desc: "Fast and reliable delivery to Accra, Kumasi, Takoradi, Tamale, and all major cities across Ghana within 1–3 business days.", iconPath: "M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" },
    { id: "6", title: "After-Sales Support", accent: "#dc2626", desc: "Warranty processing, returns management, and ongoing technical assistance throughout the full product lifecycle.", iconPath: "M16.712 4.33a9.027 9.027 0 0 1 1.652 1.306c.51.51.944 1.064 1.306 1.652M16.712 4.33l-3.448 4.138m3.448-4.138a9.014 9.014 0 0 0-9.424 0M19.67 7.288l-4.138 3.448m4.138-3.448a9.014 9.014 0 0 1 0 9.424m-4.138-5.976a3.736 3.736 0 0 0-.88-1.388 3.737 3.737 0 0 0-1.388-.88m2.268 2.268a3.765 3.765 0 0 1 0 2.528m-2.268-4.796a3.765 3.765 0 0 0-2.528 0m4.796 4.796c-.181.506-.475.982-.88 1.388a3.736 3.736 0 0 1-1.388.88m2.268-2.268 4.138 3.448m0 0a9.027 9.027 0 0 1-1.306 1.652c-.51.51-1.064.944-1.652 1.306m0 0-3.448-4.138m3.448 4.138a9.014 9.014 0 0 1-9.424 0m5.976-4.138a3.765 3.765 0 0 1-2.528 0m0 0a3.736 3.736 0 0 1-1.388-.88 3.737 3.737 0 0 1-.88-1.388m2.268 2.268L7.288 19.67m0 0a9.024 9.024 0 0 1-1.652-1.306 9.027 9.027 0 0 1-1.306-1.652m0 0 4.138-3.448M4.33 16.712a9.014 9.014 0 0 1 0-9.424m4.138 5.976a3.765 3.765 0 0 1 0-2.528m0 2.528c.181.506.475.982.88 1.388a3.736 3.736 0 0 0 1.388.88m-2.268-2.268L4.33 7.288m6.406 1.18L7.288 4.33m0 0a9.024 9.024 0 0 0-1.652 1.306A9.025 9.025 0 0 0 4.33 7.288" },
  ];

  const items = cfg?.items?.length ? cfg.items : FALLBACK_ITEMS;

  return (
    <section className="py-14 sm:py-16 bg-theme-surface border-t border-theme">
      <div className="container-store">
        <div className="text-center mb-10">
          <p className="text-xs font-bold text-navy-500 uppercase tracking-widest mb-1">Our Commitment</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-theme-1 tracking-tight">{cfg?.title ?? "Why Industry Leaders Choose APT Ghana"}</h2>
          {cfg?.subtitle && <p className="text-theme-3 mt-2 max-w-xl mx-auto">{cfg.subtitle}</p>}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((item) => (
            <div key={item.id} className="card-action p-6 rounded-2xl">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ background: item.accent + "12" }}>
                {item.iconPath && (
                  <svg className="w-5 h-5" style={{ color: item.accent }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={item.iconPath} />
                  </svg>
                )}
              </div>
              <h3 className="text-base font-bold text-theme-1 mb-2">{item.title}</h3>
              <p className="text-sm text-theme-3 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Stats ───────────────────────────────────────────────────────────────── */
function StatsSection({ cfg }: { cfg?: StatsConfig }) {
  const FALLBACK_STATS = [
    { id: "1", value: "25+", label: "Years in Operation", desc: "Serving West Africa since 1999" },
    { id: "2", value: "6,000+", label: "Product Lines", desc: "Across 6 major categories" },
    { id: "3", value: "26", label: "Global Brand Partners", desc: "All manufacturer-authorized" },
    { id: "4", value: "500+", label: "Projects Delivered", desc: "Mining, manufacturing & energy" },
  ];
  const FALLBACK_FOOTNOTES = [ "ISO 9001 Certified", "GSA Registered", "Authorized Manufacturer Distributor" ];

  const stats = cfg?.items?.length ? cfg.items : FALLBACK_STATS;
  const footnotes = cfg?.footnotes?.length ? cfg.footnotes : FALLBACK_FOOTNOTES;

  return (
    <section className="py-14 sm:py-16 relative overflow-hidden" style={{ background: "linear-gradient(135deg, #0057b8 0%, #0a2d5c 55%, #0a1628 100%)" }}>
      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.03) 1px, transparent 0)", backgroundSize: "24px 24px" }} />
      <div className="container-store relative">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {stats.map((s) => (
            <div key={s.id} className="text-center lg:text-left">
              <div className="text-4xl sm:text-5xl font-bold text-white tracking-tight">{s.value}</div>
              <div className="text-sm font-bold text-navy-200 mt-1">{s.label}</div>
              <div className="text-xs text-white/30 mt-0.5">{s.desc}</div>
            </div>
          ))}
        </div>
        {footnotes.length > 0 && (
          <div className="mt-12 pt-8 border-t border-white/[0.08] flex flex-wrap items-center justify-center lg:justify-start gap-8 text-xs text-white/25 font-bold uppercase tracking-widest">
            {footnotes.map((fn, i) => (
              <span key={i}>{fn}</span>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/* ─── Resources ───────────────────────────────────────────────────────────── */
function ResourcesSection({ cfg }: { cfg?: ResourcesConfig }) {
  const FALLBACK_RESOURCES = [
    { id: "1", title: "Technical Datasheets", desc: "Product specifications, electrical diagrams, and dimensional drawings.", href: "/library?type=datasheets", iconPath: "M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" },
    { id: "2", title: "Installation Manuals", desc: "Step-by-step installation guides and wiring diagrams for all categories.", href: "/library?type=manuals", iconPath: "M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" },
    { id: "3", title: "Application Guides", desc: "Industry-specific notes for mining, manufacturing, energy, and utilities.", href: "/library?type=guides", iconPath: "M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" },
    { id: "4", title: "Product Videos", desc: "Commissioning tutorials, product demonstrations, and technical training.", href: "/library?type=videos", iconPath: "m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" },
  ];

  const resources = cfg?.items?.length ? cfg.items : FALLBACK_RESOURCES;

  return (
    <section className="py-14 sm:py-16 bg-theme-base border-t border-theme">
      <div className="container-store">
        <div className="flex items-end justify-between mb-8 gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "#7c3aed" }}>{cfg?.label ?? "Technical Library"}</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-theme-1 tracking-tight">{cfg?.title ?? "Technical Resources"}</h2>
            {cfg?.subtitle && <p className="text-theme-3 mt-2">{cfg.subtitle}</p>}
          </div>
          <Link href="/library" className="shrink-0 hidden sm:inline-flex items-center gap-1.5 text-sm font-bold text-navy-500 hover:text-navy-400 transition-colors">
            Browse Library <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {resources.map((res) => (
            <Link key={res.id} href={res.href} className="group card-action p-5 rounded-2xl">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-all group-hover:scale-105" style={{ background: "#7c3aed14" }}>
                {res.iconPath && (
                  <svg className="w-5 h-5" style={{ color: "#7c3aed" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={res.iconPath} />
                  </svg>
                )}
              </div>
              <h3 className="font-bold text-theme-1 mb-1.5 text-sm group-hover:text-navy-500 transition-colors">{res.title}</h3>
              <p className="text-xs text-theme-3 leading-relaxed">{res.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── CTA ─────────────────────────────────────────────────────────────────── */
function CTASection({ cfg }: { cfg?: CTAConfig }) {
  return (
    <section className="relative overflow-hidden py-16 sm:py-20 border-t border-white/[0.06]" style={{ background: "linear-gradient(135deg, #0a1628 0%, #0e2040 40%, #0a1628 100%)" }}>
      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.025) 1px, transparent 0)", backgroundSize: "32px 32px" }} />
      <div className="absolute top-0 left-1/2 w-96 h-96 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none opacity-[0.07]" style={{ background: "radial-gradient(circle, #3DCD58, transparent)" }} />
      <div className="container-store relative">
        <div className="max-w-3xl mx-auto text-center">
          {cfg?.badge && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-se-green/20 bg-se-green/[0.07] text-[11px] font-bold text-se-green uppercase tracking-widest mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-se-green animate-pulse-dot" />
              {cfg.badge}
            </div>
          )}
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight mb-4">
            {(cfg?.title ?? "Ready to Power\nYour Operations?").split("\n").map((line, i, arr) => (
              <span key={i}>{line}{i < arr.length - 1 && <br />}</span>
            ))}
          </h2>
          {cfg?.subtitle && (
            <p className="text-lg text-white/45 mb-8 max-w-lg mx-auto leading-relaxed">{cfg.subtitle}</p>
          )}
          <div className="flex flex-wrap justify-center gap-3 mb-10">
            <Link href={cfg?.primaryHref ?? "/rfq"} className="inline-flex items-center gap-2 h-12 px-8 bg-se-green hover:bg-se-green-hover text-white font-bold text-sm rounded-xl transition-colors shadow-lg shadow-green-900/30">
              {cfg?.primaryLabel ?? "Request a Quote"}
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
            </Link>
            {cfg?.secondaryLabel && (
              <Link href={cfg.secondaryHref ?? "catalog"} className="inline-flex items-center gap-2 h-12 px-8 bg-navy-500 hover:bg-navy-400 text-white font-semibold text-sm rounded-xl transition-colors">
                {cfg.secondaryLabel}
              </Link>
            )}
            {cfg?.phone && (
              <a href={`tel:${cfg.phone}`} className="inline-flex items-center gap-2 h-12 px-8 border border-white/12 hover:border-white/25 text-white/60 hover:text-white font-semibold text-sm rounded-xl transition-all">
                Call Sales Team
              </a>
            )}
          </div>
          {cfg?.footnotes?.length ? (
            <div className="flex flex-wrap justify-center gap-8 text-xs text-white/25 font-semibold uppercase tracking-widest">
              {cfg.footnotes.map((fn, i) => <span key={i}>{fn}</span>)}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
