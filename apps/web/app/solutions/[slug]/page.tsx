import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { SITE_URL, STORE_URL } from "@apt/config";
import Header from "@/components/navigation/Header";
import Footer from "@/components/navigation/Footer";
import { connectDB, CategoryModel } from "@apt/db";

export const revalidate = 3600;

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChildCategory {
  _id: string;
  slug: string;
  name: string;
  description: string;
  image: { url: string; alt: string };
}

interface DbCategory {
  _id: string;
  slug: string;
  name: string;
  description: string;
  shortDescription: string;
  level: string;
  image: { url: string; alt: string };
  ancestors: { slug: string; name: string; level: string }[];
  children: ChildCategory[];
  benefits: Benefit[];
  bulletPoints: string[];
  products: string[];
  brands: string[];
  applications: string[];
}

interface Benefit {
  title: string;
  value: string;
}

// ─── Static top-level data (fallback for the 6 main solution pages) ───────────

// ─── DB fetch: category + ancestors + children ────────────────────────────────

async function getCategoryFull(slug: string): Promise<DbCategory | null> {
  try {
    await connectDB();

    type RawCat = { _id: unknown; slug: string; name: string; description?: string; shortDescription?: string; image?: { url?: string; alt?: string }; level: string; ancestors?: unknown[]; benefits?: { title?: string; value?: string }[]; bulletPoints?: string[]; products?: string[]; brands?: string[]; applications?: string[] };
    type RawAncestor = { _id: unknown; slug: string; name: string; level: string };
    type RawChild = { _id: unknown; slug: string; name: string; description?: string; shortDescription?: string; image?: { url?: string; alt?: string } };

    const cat = await CategoryModel.findOne({ slug, status: "active" })
      .select("_id slug name description shortDescription image level ancestors benefits bulletPoints")
      .lean() as unknown as RawCat | null;

    if (!cat) return null;

    const [ childrenRaw, ancestorsRaw ] = await Promise.all([
      CategoryModel.find({ parentId: cat._id, status: "active" })
        .select("slug name description shortDescription image displayOrder")
        .sort({ displayOrder: 1, name: 1 })
        .lean(),
      cat.ancestors?.length
        ? CategoryModel.find({ _id: { $in: cat.ancestors } })
          .select("slug name level")
          .lean()
        : Promise.resolve([]),
    ]);

    // Preserve the original ancestor order using the stored array
    const ancestorMap = new Map(
      (ancestorsRaw as unknown as RawAncestor[]).map((a) => [ String(a._id), a ])
    );
    const sortedAncestors = (cat.ancestors || [])
      .map((id) => ancestorMap.get(String(id)))
      .filter((a): a is RawAncestor => a != null)
      .map((a) => ({ slug: a.slug, name: a.name, level: a.level }));

    return {
      _id: String(cat._id),
      slug: cat.slug,
      name: cat.name,
      shortDescription: cat.shortDescription || "",
      description: cat.description || cat.shortDescription || "",
      level: cat.level,
      image: {
        url: cat.image?.url || "",
        alt: cat.image?.alt || cat.name,
      },
      ancestors: sortedAncestors,
      benefits: (cat.benefits ?? []).map((b) => ({
        title: b.title ?? "",
        value: b.value ?? "",
      })),
      bulletPoints: cat.bulletPoints ?? [],
      products: cat.products ?? [],
      brands: cat.brands ?? [],
      applications: cat.applications ?? [],
      children: (childrenRaw as unknown as RawChild[]).map((c) => ({
        _id: String(c._id),
        slug: c.slug,
        name: c.name,
        description: c.description || c.shortDescription || "",
        image: {
          url: c.image?.url || "",
          alt: c.image?.alt || c.name,
        },
      })),
    };
  } catch {
    return null;
  }
}

// ─── Next.js route config ─────────────────────────────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  // DB-based category
  const cat = await getCategoryFull(slug);
  if (!cat) return { title: "Not Found | APT Ghana" };

  return {
    title: `${cat.name} | APT Ghana`,
    description: cat.description || `${cat.name} — industrial solutions from APT Ghana.`,
    openGraph: {
      title: `${cat.name} | APT Ghana`,
      description: cat.description,
      url: `${SITE_URL}/solutions/${slug}`,
      ...(cat.image.url ? { images: [ { url: cat.image.url, alt: cat.image.alt } ] } : {}),
    },
    alternates: { canonical: `${SITE_URL}/solutions/${slug}` },
  };
}

// ─── Benefits grid ────────────────────────────────────────────────────────────

function BenefitsSection({ benefits, name }: { benefits: Benefit[]; name: string }) {
  if (!benefits.length) return null;
  return (
    <section className="section-py bg-white dark:bg-[#0A0F1E]">
      <div className="container-apt">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-6 h-0.5 rounded-full bg-[#84CC16]" />
          <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#84CC16]">
            Key Benefits
          </span>
        </div>
        <h2
          className="text-3xl font-extrabold tracking-tight text-[#0F172A] dark:text-[#F1F5F9] mb-8"
          style={{ fontFamily: "var(--font-sora, 'Sora', sans-serif)" }}
        >
          Why Choose APT Ghana for {name}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {benefits.map((b) => (
            <div
              key={b.title}
              className="flex gap-5 p-6 bg-[#F8FAFC] dark:bg-surface-900 rounded-2xl border border-[#E2E8F0] dark:border-white/10 hover:border-[#84CC16]/40 transition-colors"
            >
              <span className="shrink-0 mt-0.5 w-8 h-8 rounded-xl bg-[#84CC16]/15 flex items-center justify-center">
                <svg className="w-4 h-4 text-[#84CC16]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </span>
              <div>
                <h3 className="font-bold text-[#0F172A] dark:text-[#F1F5F9] text-[15px] mb-1.5">
                  {b.title}
                </h3>
                <p className="text-sm text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
                  {b.value}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Bullet points checklist ───────────────────────────────────────────────────

function BulletPointsSection({ points }: { points: string[] }) {
  if (!points.length) return null;
  return (
    <div className="bg-[#0A0F1E] rounded-2xl p-7">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-5 h-0.5 rounded-full bg-[#84CC16]" />
        <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#84CC16]">
          Why APT Ghana
        </span>
      </div>
      <ul className="space-y-3">
        {points.map((pt) => (
          <li key={pt} className="flex items-start gap-3">
            <span className="shrink-0 mt-0.5 w-5 h-5 rounded-full bg-[#84CC16]/15 flex items-center justify-center">
              <svg className="w-2.5 h-2.5 text-[#84CC16]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </span>
            <span className="text-sm text-white/75 leading-snug">{pt}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Shared child-category grid ───────────────────────────────────────────────

function ChildrenGrid({ children, heading }: { children: ChildCategory[]; heading: string }) {
  return (
    <section className="section-py bg-[#F8FAFC] dark:bg-[#0D1526]">
      <div className="container-apt">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-6 h-0.5 rounded-full bg-[#84CC16]" />
          <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#84CC16]">
            Product Categories
          </span>
        </div>
        <h2
          className="text-3xl font-extrabold tracking-tight text-[#0F172A] dark:text-[#F1F5F9] mb-8"
          style={{ fontFamily: "var(--font-sora, 'Sora', sans-serif)" }}
        >
          {heading}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {children.map((child) => (
            <Link
              key={child._id}
              href={`/solutions/${child.slug}`}
              className="group bg-white dark:bg-surface-900 rounded-2xl border border-[#E2E8F0] dark:border-white/10 overflow-hidden hover:border-[#84CC16]/50 hover:-translate-y-1 transition-all"
            >
              {child.image.url && (
                <div className="h-44 bg-[#F8FAFC] dark:bg-[#0A0F1E] flex items-center justify-center border-b border-[#E2E8F0] dark:border-white/10 p-5">
                  <Image
                    src={child.image.url}
                    alt={child.image.alt}
                    width={160}
                    height={120}
                    className="h-full w-auto max-w-full object-contain"
                  />
                </div>
              )}
              <div className="p-5">
                <h3
                  className="font-extrabold text-[#0F172A] dark:text-[#F1F5F9] group-hover:text-[#84CC16] transition-colors mb-2 leading-snug"
                  style={{ fontFamily: "var(--font-sora, 'Sora', sans-serif)" }}
                >
                  {child.name}
                </h3>
                {child.description && (
                  <p className="text-xs text-[#64748B] dark:text-[#94A3B8] leading-relaxed line-clamp-3">
                    {child.description}
                  </p>
                )}
                <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-[#84CC16]">
                  <span>Learn more</span>
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Standard dark CTA ─────────────────────────────────────────────────────────

function SolutionCTA({ name }: { name: string }) {
  return (
    <section className="py-16 bg-[#0A0F1E]">
      <div className="container-apt">
        <div className="bg-white/5 rounded-2xl border border-white/10 p-10 lg:p-14 flex flex-col lg:flex-row items-center justify-between gap-8">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-6 h-0.5 rounded-full bg-[#84CC16]" />
              <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#84CC16]">
                Request a Quote
              </span>
            </div>
            <h2
              className="text-3xl font-extrabold tracking-tight text-white mb-3"
              style={{ fontFamily: "var(--font-sora, 'Sora', sans-serif)" }}
            >
              Ready to Discuss Your {name} Project?
            </h2>
            <p className="text-white/60 text-sm max-w-lg">
              Our engineers are ready to review your requirements and provide a detailed
              technical proposal. Contact us today.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <Link
              href={STORE_URL + "/rfq"}
              className="inline-flex items-center gap-2 h-12 px-7 bg-[#84CC16] text-[#0A0F1E] font-bold text-sm rounded-xl hover:bg-[#78B800] transition-colors whitespace-nowrap"
            >
              Request a Quote →
            </Link>
            <Link
              href={STORE_URL}
              className="inline-flex items-center gap-2 h-12 px-7 border border-white/20 text-white font-bold text-sm rounded-xl hover:bg-white/10 transition-colors whitespace-nowrap"
            >
              Browse Products
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Breadcrumb ────────────────────────────────────────────────────────────────

function Breadcrumb({
  ancestors,
  current,
}: {
  ancestors: { slug: string; name: string }[];
  current: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 text-xs text-[#0F172A]/40 dark:text-white/40 mb-6">
      <Link href="/solutions" className="hover:text-[#0F172A]/70 dark:hover:text-white/70 transition-colors">
        Solutions
      </Link>
      {ancestors.map((a) => (
        <>
          <span key={`sep-${a.slug}`}>/</span>
          <Link
            key={a.slug}
            href={`/solutions/${a.slug}`}
            className="hover:text-[#0F172A]/70 dark:hover:text-white/70 transition-colors"
          >
            {a.name}
          </Link>
        </>
      ))}
      <span>/</span>
      <span className="text-[#475569] dark:text-white/60">{current}</span>
    </div>
  );
}

// ─── Page component ────────────────────────────────────────────────────────────

export default async function SolutionDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Always fetch from DB — provides children for static pages and full data for dynamic ones
  const dbCategory = await getCategoryFull(slug);
  if (!dbCategory) notFound();

  // ── Dynamic DB-based category page (any depth: category / subcategory / range) ──

  const cat = dbCategory;
  const hasChildren = cat.children.length > 0;

  // Find the group ancestor for "Other Solutions" chips
  const groupAncestor = cat.ancestors.find((a) => a.level === "group");

  return (
    <>
      <Header />
      <main>
        {/* Hero */}
        <section className="bg-[#F8FAFC] dark:bg-[#0A0F1E] py-20">
          <div className="container-apt">
            <Breadcrumb ancestors={cat.ancestors} current={cat.name} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
              <div className="max-w-2xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-6 h-0.5 rounded-full bg-[#84CC16]" />
                  <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#84CC16]">
                    {cat.level}
                  </span>
                </div>
                <h1
                  className="text-4xl lg:text-5xl font-extrabold tracking-tight text-[#0F172A] dark:text-white mb-6"
                  style={{ fontFamily: "var(--font-sora, 'Sora', sans-serif)" }}
                >
                  {cat.name}
                </h1>
                {cat.description && (
                  <p className="text-[#64748B] dark:text-[#94A3B8] text-lg leading-relaxed">
                    {cat.description}
                  </p>
                )}
              </div>

              {/* Hero image if available */}
              {cat.image.url && (
                <div className="hidden lg:flex items-center justify-center h-64 bg-white dark:bg-surface-900 rounded-2xl border border-[#E2E8F0] dark:border-white/10 p-8">
                  <Image
                    src={cat.image.url}
                    alt={cat.image.alt}
                    width={280}
                    height={200}
                    className="h-full w-auto max-w-full object-contain"
                    priority
                  />
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Mobile hero image */}
        {cat.image.url && (
          <div className="lg:hidden bg-[#F8FAFC] dark:bg-surface-900 border-y border-[#E2E8F0] dark:border-white/10 flex items-center justify-center h-52 p-6">
            <Image
              src={cat.image.url}
              alt={cat.image.alt}
              width={200}
              height={150}
              className="h-full w-auto max-w-full object-contain"
            />
          </div>
        )}

        <BenefitsSection benefits={cat.benefits} name={cat.name} />

        {/* Children grid or leaf CTA */}
        {hasChildren ? (
          // eslint-disable-next-line react/no-children-prop
          <ChildrenGrid children={cat.children} heading={`${cat.name} Categories`} />
        ) : (
          /* Leaf node — no sub-categories, direct store link */
          <section className="section-py bg-white dark:bg-[#0A0F1E]">
            <div className="container-apt">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-6 h-0.5 rounded-full bg-[#84CC16]" />
                    <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#84CC16]">
                      Shop Products
                    </span>
                  </div>
                  <h2
                    className="text-3xl font-extrabold tracking-tight text-[#0F172A] dark:text-[#F1F5F9] mb-4"
                    style={{ fontFamily: "var(--font-sora, 'Sora', sans-serif)" }}
                  >
                    Browse {cat.name} Products
                  </h2>
                  <p className="text-[#64748B] dark:text-[#94A3B8] text-base mb-8">
                    Explore our full range of {cat.name} products on our online store.
                    All products are sourced from authorised manufacturers with full warranty support.
                  </p>
                  <Link
                    href={`${STORE_URL}/search?q=${encodeURIComponent(cat.name)}`}
                    className="inline-flex items-center gap-2 h-12 px-8 bg-[#84CC16] text-[#0A0F1E] font-bold text-sm rounded-xl hover:bg-[#78B800] transition-colors"
                  >
                    Shop {cat.name} →
                  </Link>
                </div>
                {cat.bulletPoints.length > 0 && (
                  <div>
                    <BulletPointsSection points={cat.bulletPoints} />
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        <SolutionCTA name={cat.name} />

        {/* Related: siblings from same parent group */}
        {groupAncestor && (
          <section className="py-14 bg-[#F8FAFC] dark:bg-[#0D1526]">
            <div className="container-apt">
              <div className="flex items-center justify-between mb-6">
                <h3
                  className="text-xl font-bold text-[#0F172A] dark:text-[#F1F5F9]"
                  style={{ fontFamily: "var(--font-sora, 'Sora', sans-serif)" }}
                >
                  Back to {groupAncestor.name}
                </h3>
                <Link href={`/solutions/${groupAncestor.slug}`} className="text-sm font-semibold text-[#84CC16] hover:underline">
                  View all →
                </Link>
              </div>
              <div className="flex flex-wrap gap-3">
                {cat.ancestors.map((a) => (
                  <Link
                    key={a.slug}
                    href={`/solutions/${a.slug}`}
                    className="inline-flex items-center gap-2 h-10 px-5 bg-white dark:bg-surface-900 border border-[#E2E8F0] dark:border-white/10 rounded-xl text-sm font-medium text-[#0F172A] dark:text-[#94A3B8] hover:border-[#84CC16]/50 hover:bg-[#84CC16]/5 transition-colors"
                  >
                    {a.name}
                  </Link>
                ))}
                <Link
                  href="/solutions"
                  className="inline-flex items-center gap-2 h-10 px-5 bg-white dark:bg-surface-900 border border-[#E2E8F0] dark:border-white/10 rounded-xl text-sm font-medium text-[#0F172A] dark:text-[#94A3B8] hover:border-[#84CC16]/50 hover:bg-[#84CC16]/5 transition-colors"
                >
                  All Solutions
                </Link>
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
