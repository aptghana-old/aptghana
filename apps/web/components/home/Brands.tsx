import Link from "next/link";
import { connectDB, BrandModel, ProductModel } from "@apt/db";
import { STORE_URL } from "@apt/config";

/* ─────────────────────────────────────────────
   Data fetching
───────────────────────────────────────────── */

type Brand = {
  _id: string;
  name: string;
  slug: string;
  shortDescription?: string;
  description?: string;
  logo?: { url: string; alt?: string };
  isPartner: boolean;
  isFeatured?: boolean;
  country?: string;
  website?: string;
  status: string;
  productCount: number;
};

async function getFeaturedBrands(): Promise<Brand[]> {
  try {
    await connectDB();
    const brands = await BrandModel.find({
      status: { $ne: "deleted" },
      isFeatured: true,
    })
      .sort({ name: 1 })
      .lean();

    const slugs = brands.map((b) => (b as unknown as { slug: string }).slug);
    const counts = await ProductModel.aggregate([
      { $match: { brandSlug: { $in: slugs }, status: "active" } },
      { $group: { _id: "$brandSlug", count: { $sum: 1 } } },
    ]);

    const countMap = Object.fromEntries(counts.map((c) => [ c._id, c.count ]));

    return brands.map((b) => {
      const brand = b as unknown as Omit<Brand, "_id" | "productCount"> & {
        _id: { toString(): string };
      };
      return {
        ...brand,
        _id: brand._id.toString(),
        productCount: countMap[ brand.slug ] ?? 0,
      };
    });
  } catch {
    return [];
  }
}

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */

function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[ 0 ])
    .slice(0, 3)
    .join("")
    .toUpperCase();
}

/* ─────────────────────────────────────────────
   Sub-components
───────────────────────────────────────────── */

function LogoMark({
  logo,
  name,
  size = "md",
}: {
  logo?: { url: string; alt?: string };
  name: string;
  size?: "sm" | "md" | "lg";
}) {
  const dims = { sm: "w-10 h-10 rounded-[9px]", md: "w-13 h-13 rounded-[12px]", lg: "w-[60px] h-[60px] rounded-[14px]" }[ size ];
  const textSize = { sm: "text-[11px]", md: "text-[13px]", lg: "text-[17px]" }[ size ];
  const imgSize = { sm: "max-w-[28px] max-h-[28px]", md: "max-w-[34px] max-h-[34px]", lg: "max-w-[40px] max-h-[40px]" }[ size ];

  return (
    <div
      className={`${dims} bg-[#F8FAFC] dark:bg-[#1F2937] border border-[#E2E8F0] dark:border-white/10 flex items-center justify-center overflow-hidden shrink-0`}
    >
      {logo?.url ? (
        <img
          src={logo.url}
          alt={logo.alt || name}
          className={`${imgSize} object-contain`}
        />
      ) : (
        <span
          className={`font-black ${textSize} text-[#1E3A5F] dark:text-white tracking-tight font-sora`}
        >
          {initials(name)}
        </span>
      )}
    </div>
  );
}

function PartnerBadge({ small = false }: { small?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border border-[#84CC16]/30 bg-[#84CC16]/10 font-bold uppercase tracking-wider text-[#3E7000] dark:text-[#9FD040] ${small ? "px-2 py-0.5 text-[9px]" : "px-2.5 py-1 text-[10px]"
        }`}
    >
      ✓ Partner
    </span>
  );
}

/* ─────────────────────────────────────────────
   Flagship Card — Schneider Electric
   Separate hardcoded card for the anchor brand
───────────────────────────────────────────── */

function FlagshipCard() {
  return (
    <Link
      href={`${STORE_URL}/brands/schneider-electric`}
      className="group relative block mb-3 rounded-2xl bg-[#0A0F1E] border border-white/[0.07] overflow-hidden transition-all duration-300 hover:border-[#84CC16]/25 hover:-translate-y-0.5"
      aria-label="Schneider Electric — Official Certified Distributor. Shop now."
    >
      {/* Atmospheric glows */}
      <div
        className="pointer-events-none absolute -top-24 -right-12 w-72 h-72 rounded-full opacity-[0.12]"
        style={{ background: "radial-gradient(circle, #84CC16 0%, transparent 65%)" }}
      />
      <div
        className="pointer-events-none absolute -bottom-16 left-10 w-48 h-48 rounded-full opacity-[0.25]"
        style={{ background: "radial-gradient(circle, #1E3A5F 0%, transparent 70%)" }}
      />

      {/* Partnership depth bar */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/[0.04]">
        <div
          className="h-full transition-all duration-700 group-hover:opacity-100 opacity-70"
          style={{
            width: "78%",
            background: "linear-gradient(90deg, #84CC16 0%, rgba(132,204,22,0.15) 100%)",
          }}
        />
      </div>

      <div className="relative p-7 sm:p-9 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        {/* Identity */}
        <div className="flex items-center gap-5">
          <div className="w-[60px] h-[60px] rounded-[14px] bg-white/[0.06] border border-white/10 flex items-center justify-center shrink-0">
            <span className="font-black text-[17px] text-white tracking-tight font-sora leading-none">
              SE
            </span>
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
              <span className="font-sora text-[21px] font-bold text-white tracking-tight leading-none">
                Schneider Electric
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-[#84CC16]/30 bg-[#84CC16]/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#84CC16]">
                ✓ Official Certified Distributor
              </span>
            </div>
            <p className="text-[12.5px] text-white/35 leading-relaxed">
              Authorized partner since 2009 · Full product portfolio · Local Accra stock · France
            </p>
          </div>
        </div>

        {/* Stats + CTA */}
        <div className="flex items-center gap-6 shrink-0">
          <div className="hidden lg:flex items-center gap-5">
            <div>
              <p className="font-sora text-[22px] font-black text-white tracking-tight leading-none">15+</p>
              <p className="text-[11px] text-white/30 mt-1">Years active</p>
            </div>
            <div className="w-px h-8 bg-white/[0.08]" />
            <div>
              <p className="font-sora text-[22px] font-black text-white tracking-tight leading-none">400+</p>
              <p className="text-[11px] text-white/30 mt-1">Products</p>
            </div>
            <div className="w-px h-8 bg-white/[0.08]" />
          </div>

          <span className="inline-flex items-center gap-2 h-11 px-6 bg-[#84CC16] text-[#0A0F1E] font-bold text-[13px] rounded-[10px] transition-all duration-200 group-hover:bg-[#78B800] group-hover:translate-x-0.5">
            Shop Schneider
            <svg
              className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </span>
        </div>
      </div>
    </Link>
  );
}

/* ─────────────────────────────────────────────
   Featured Brand Card (editorial, larger)
───────────────────────────────────────────── */

function FeaturedCard({ brand }: { brand: Brand }) {
  return (
    <Link
      href={`${STORE_URL}/brands/${brand.slug}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-[#E2E8F0] dark:border-white/[0.08] bg-white dark:bg-[#111827] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[#84CC16]/40 hover:shadow-[0_16px_48px_rgba(0,0,0,0.10)] dark:hover:shadow-[0_16px_48px_rgba(0,0,0,0.4)]"
      aria-label={`Explore ${brand.name} — ${brand.productCount} products`}
    >
      {/* Hover gradient overlay */}
      <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-[#84CC16]/[0.04] via-transparent to-[#1E3A5F]/[0.03]" />

      {/* Partnership depth bar */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#E2E8F0] dark:bg-white/[0.06]">
        <div
          className="h-full bg-[#84CC16] opacity-50 group-hover:opacity-100 transition-opacity duration-300"
          style={{ width: brand.isPartner ? "70%" : "40%" }}
        />
      </div>

      <div className="relative flex flex-col h-full">
        {/* Top row: logo + partner badge */}
        <div className="flex items-start justify-between mb-4">
          <LogoMark logo={brand.logo} name={brand.name} size="md" />
          {brand.isPartner && <PartnerBadge />}
        </div>

        {/* Name + country */}
        <h3 className="font-sora text-[16px] font-bold text-[#0F172A] dark:text-[#F8FAFC] tracking-tight leading-tight mb-0.5">
          {brand.name}
        </h3>
        {brand.country && (
          <p className="text-[12px] text-[#94A3B8] dark:text-[#64748B]">{brand.country}</p>
        )}

        {/* Short description */}
        {brand.shortDescription && (
          <p className="mt-3 text-[13px] leading-[1.6] text-[#64748B] dark:text-[#94A3B8] line-clamp-3 flex-1">
            {brand.shortDescription}
          </p>
        )}

        {/* Footer */}
        <div className="mt-auto pt-4 border-t border-[#E2E8F0] dark:border-white/[0.08] flex items-center justify-between">
          <span className="text-[12px] font-semibold text-[#84CC16]">
            {brand.productCount} Products
          </span>
          <span className="text-[12px] font-semibold text-[#0F172A] dark:text-[#F1F5F9] flex items-center gap-1 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-250">
            Explore
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </span>
        </div>
      </div>
    </Link>
  );
}

/* ─────────────────────────────────────────────
   Compact Brand Card (grid fill)
───────────────────────────────────────────── */

function CompactCard({ brand }: { brand: Brand }) {
  return (
    <Link
      href={`${STORE_URL}/brands/${brand.slug}`}
      className="group relative flex flex-col overflow-hidden rounded-[14px] border border-[#E2E8F0] dark:border-white/[0.08] bg-white dark:bg-[#111827] p-4 transition-all duration-250 hover:-translate-y-1 hover:border-[#84CC16]/40 hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_8px_24px_rgba(0,0,0,0.35)]"
      aria-label={`Explore ${brand.name}`}
    >
      {/* Hover fill */}
      <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-b from-[#84CC16]/[0.03] to-transparent" />

      {/* Partner dot indicator */}
      {brand.isPartner && (
        <div
          className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full bg-[#84CC16]"
          title="Official partner"
          aria-label="Official partner"
        />
      )}

      <div className="relative">
        <LogoMark logo={brand.logo} name={brand.name} size="sm" />

        <h3 className="mt-3 font-sora text-[12.5px] font-bold text-[#0F172A] dark:text-[#F1F5F9] tracking-tight leading-snug line-clamp-2">
          {brand.name}
        </h3>

        {brand.country && (
          <p className="mt-0.5 text-[11px] text-[#94A3B8]">{brand.country}</p>
        )}

        <div className="mt-3 flex items-center justify-between">
          <span className="text-[11px] font-semibold text-[#84CC16]">
            {brand.productCount}
          </span>
          <span className="text-[11px] font-semibold text-[#64748B] dark:text-[#94A3B8] opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            →
          </span>
        </div>
      </div>
    </Link>
  );
}

/* ─────────────────────────────────────────────
   Value Proposition Strip
───────────────────────────────────────────── */

const VALUE_PROPS = [
  {
    title: "Genuine Products",
    desc: "Sourced directly from manufacturers. Full traceability, no counterfeits.",
    icon: (
      <svg className="w-4 h-4 text-[#84CC16]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  {
    title: "Technical Support",
    desc: "Factory-trained engineers for selection, installation, and commissioning.",
    icon: (
      <svg className="w-4 h-4 text-[#84CC16]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    title: "Local Availability",
    desc: "Fast-moving items stocked in Accra. Custom orders fulfilled in 2–6 weeks.",
    icon: (
      <svg className="w-4 h-4 text-[#84CC16]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
];

/* ─────────────────────────────────────────────
   Main Section
───────────────────────────────────────────── */

export default async function Brands() {
  const brands = await getFeaturedBrands();

  // Partition: first 2 non-Schneider featured brands get the editorial treatment,
  // the rest fill the compact grid
  const featured = brands.filter((b) => b.slug !== "schneider-electric").slice(0, 4);
  const compact = brands.filter((b) => b.slug !== "schneider-electric").slice(4);

  return (
    <section
      className="section-py bg-[#F8FAFC] dark:bg-[#0D1526]"
      aria-labelledby="brands-heading"
    >
      <div className="container-apt">

        {/* ── Header ──────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 max-w-none mb-12">
          <div className="max-w-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-5 h-[2px] rounded-full bg-[#84CC16]" aria-hidden="true" />
              <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#84CC16]">
                Official Partnerships
              </span>
            </div>
            <h2
              id="brands-heading"
              className="font-sora text-[38px] lg:text-[48px] font-extrabold tracking-[-0.03em] text-[#0F172A] dark:text-[#F1F5F9] leading-[1.05] mb-4"
            >
              Global Brands.<br />Local Expertise.
            </h2>
            <p className="text-[16px] leading-relaxed text-[#64748B] dark:text-[#94A3B8]">
              Authorized distributor for 26+ world-leading industrial manufacturers in West Africa — genuine products, full warranty, local stock.
            </p>
          </div>

          {/* Partner count pill */}
          <div className="shrink-0 inline-flex items-center gap-2 self-start sm:self-auto px-4 py-2.5 rounded-full border border-[#E2E8F0] dark:border-white/10 bg-white dark:bg-[#111827]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#84CC16]" aria-hidden="true" />
            <span className="text-[12.5px] font-medium text-[#64748B] dark:text-[#94A3B8]">
              26 Manufacturing Partners
            </span>
          </div>
        </div>

        {/* ── Flagship: Schneider Electric ───────── */}
        <FlagshipCard />

        {/* ── Featured editorial grid ─────────────
            2-col on md, 4-col on lg
        ─────────────────────────────────────────── */}
        {featured.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
            {featured.map((brand) => (
              <FeaturedCard key={brand.slug} brand={brand} />
            ))}
          </div>
        )}

        {/* ── Compact brand mosaic ─────────────────
            Remaining brands in a dense grid
        ─────────────────────────────────────────── */}
        {compact.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2.5 mb-8">
            {compact.map((brand) => (
              <CompactCard key={brand.slug} brand={brand} />
            ))}
          </div>
        )}

        {/* ── Value propositions ──────────────────── */}
        <div className="mt-4 grid sm:grid-cols-3 gap-0 rounded-2xl border border-[#E2E8F0] dark:border-white/10 overflow-hidden">
          {VALUE_PROPS.map((item, i) => (
            <div
              key={item.title}
              className={`flex items-start gap-3.5 p-6 bg-white dark:bg-[#111827] ${i < VALUE_PROPS.length - 1
                ? "border-b sm:border-b-0 sm:border-r border-[#E2E8F0] dark:border-white/10"
                : ""
                }`}
            >
              <div className="w-8 h-8 rounded-lg bg-[#84CC16]/10 flex items-center justify-center shrink-0">
                {item.icon}
              </div>
              <div>
                <h4 className="font-bold text-[13.5px] text-[#0F172A] dark:text-[#F1F5F9] mb-1">
                  {item.title}
                </h4>
                <p className="text-[12.5px] text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}