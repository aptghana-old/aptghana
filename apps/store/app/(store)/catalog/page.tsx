import type { Metadata } from "next";
import { connectDB, CategoryModel } from "@apt/db";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Product Catalogue — APT Ghana",
  description:
    "Browse 6,000+ industrial automation products organised by category. Electrical, pneumatic, conveying, and more.",
};

export const revalidate = 3600;

export default async function CatalogIndexPage() {
  let groups: {
    name: string;
    slug: string;
    description: string;
    image: string;
    productCount: number;
  }[] = [];

  try {
    await connectDB();
    const raw = await (CategoryModel as any)
      .find({ level: "group", status: "active" })
      .select("name slug shortDescription description image productCount")
      .sort({ displayOrder: 1 })
      .lean();
    groups = (raw as any[]).map((g: any) => ({
      name: g.name,
      slug: g.slug,
      description: g.shortDescription || g.description || "",
      image: g.image?.url ?? "",
      productCount: g.productCount ?? 0,
    }));
  } catch {
    /* show empty state */
  }

  return (
    <>
      {/* Hero */}
      <div className="bg-navy-900 text-white">
        <div className="container-store pt-10 pb-8">
          <nav
            className="flex items-center gap-1.5 text-[11px] text-white/40 mb-4"
            aria-label="Breadcrumb"
          >
            <Link href="/" className="hover:text-white/70 transition-colors">
              Home
            </Link>
            <span className="text-white/20">/</span>
            <span className="text-white/70 font-medium" aria-current="page">
              Catalogue
            </span>
          </nav>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
            Product Catalogue
          </h1>
          <p className="text-white/50 max-w-2xl text-sm leading-relaxed">
            Browse 6,000+ industrial automation products from 26 global brands, organised by
            product group.
          </p>
        </div>
      </div>

      {/* Group grid */}
      <main className="container-store py-8 flex-1">
        {groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center px-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
              style={{ background: "var(--bg-raised)" }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--text-4)" }}>
                <path d="M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" />
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
              </svg>
            </div>
            <p className="text-[15px] font-semibold mb-2" style={{ color: "var(--text-1)" }}>
              No catalogue groups configured yet
            </p>
            <p className="text-[13px] leading-relaxed max-w-xs" style={{ color: "var(--text-3)" }}>
              Products are being organised. Contact us to enquire about specific items.
            </p>
            <a
              href="/rfq"
              className="mt-5 inline-flex items-center gap-2 h-10 px-5 bg-apt-orange hover:bg-apt-orange-hover text-white text-sm font-semibold rounded-xl transition-colors"
            >
              Request a Quote
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {groups.map((group) => (
              <Link
                key={group.slug}
                href={`/catalog/${group.slug}`}
                className="group flex gap-4 p-5 rounded-2xl border transition-all hover:shadow-[var(--shadow-2)] hover:border-[var(--border-hi)]"
                style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
              >
                <div
                  className="w-16 h-16 rounded-xl overflow-hidden shrink-0 flex items-center justify-center"
                  style={{ background: "var(--bg-raised)" }}
                >
                  {group.image ? (
                    <img
                      src={group.image}
                      alt={group.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-[#3DCD58]/20" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h2
                    className="text-[15px] font-bold leading-snug mb-1 group-hover:text-navy-500 dark:group-hover:text-navy-300 transition-colors"
                    style={{ color: "var(--text-1)" }}
                  >
                    {group.name}
                  </h2>
                  {group.description && (
                    <p
                      className="text-[12px] line-clamp-2 leading-relaxed"
                      style={{ color: "var(--text-3)" }}
                    >
                      {group.description}
                    </p>
                  )}
                  {group.productCount > 0 && (
                    <p
                      className="text-[11px] font-semibold uppercase tracking-wide mt-1.5"
                      style={{ color: "var(--text-4)" }}
                    >
                      {group.productCount.toLocaleString()} products
                    </p>
                  )}
                </div>
                <svg
                  className="w-4 h-4 shrink-0 mt-0.5 group-hover:translate-x-0.5 transition-transform"
                  style={{ color: "var(--text-4)" }}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
