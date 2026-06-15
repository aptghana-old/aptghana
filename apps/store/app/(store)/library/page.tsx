import type { Metadata }    from "next";
import { connectDB, AssetModel } from "@apt/db";
import { STORE_URL }            from "@apt/config";
import {
  LibraryBrowser,
  type LibraryAsset,
  type ResourceType,
} from "@/components/library/LibraryBrowser";
import {
  FileText, BookOpen, Lightbulb, Film,
  HelpCircle, Code2, Award,
} from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title:       "Technical Library | APT Ghana",
  description: "Free access to datasheets, installation manuals, application guides, and product videos for all industrial products distributed by APT Ghana.",
  alternates:  { canonical: `${STORE_URL}/library` },
};

// ─────────────────────────────────────────────────────────────────────────────
// Resource type definitions (static — counts come from DB)
// ─────────────────────────────────────────────────────────────────────────────

const RESOURCE_TYPES: ResourceType[] = [
  {
    id:      "datasheets",
    title:   "Technical Datasheets",
    desc:    "Product specifications, electrical characteristics, dimensional drawings, and certifications.",
    count:   0,
    icon:    <FileText   size={20} strokeWidth={1.75} />,
    color:   "#0057b8",
    bgColor: "#f0f7ff",
  },
  {
    id:      "manuals",
    title:   "Installation Manuals",
    desc:    "Step-by-step commissioning and installation procedures, wiring diagrams, and configuration guides.",
    count:   0,
    icon:    <BookOpen   size={20} strokeWidth={1.75} />,
    color:   "#7c3aed",
    bgColor: "#f5f3ff",
  },
  {
    id:      "guides",
    title:   "Application Guides",
    desc:    "Industry-specific design notes, selection guides, and engineering recommendations.",
    count:   0,
    icon:    <Lightbulb  size={20} strokeWidth={1.75} />,
    color:   "#d97706",
    bgColor: "#fffbeb",
  },
  {
    id:      "videos",
    title:   "Product Videos",
    desc:    "Commissioning tutorials, product demonstrations, maintenance procedures, and training recordings.",
    count:   0,
    icon:    <Film       size={20} strokeWidth={1.75} />,
    color:   "#dc2626",
    bgColor: "#fef2f2",
  },
  {
    id:      "certificates",
    title:   "Certificates & Compliance",
    desc:    "Quality certifications, CE declarations, test reports, and regulatory compliance documents.",
    count:   0,
    icon:    <Award      size={20} strokeWidth={1.75} />,
    color:   "#0891b2",
    bgColor: "#ecfeff",
  },
  {
    id:      "software",
    title:   "Software & Firmware",
    desc:    "Configuration software, firmware updates, and programming tools for PLCs, drives, and smart devices.",
    count:   0,
    icon:    <Code2      size={20} strokeWidth={1.75} />,
    color:   "#16a34a",
    bgColor: "#f0fdf4",
  },
  {
    id:      "guides",
    title:   "FAQs & Knowledge Base",
    desc:    "Answers to common technical questions about products, compatibility, ordering, and warranty.",
    count:   0,
    icon:    <HelpCircle size={20} strokeWidth={1.75} />,
    color:   "#0891b2",
    bgColor: "#ecfeff",
  },
];

// Deduplicate by id
const UNIQUE_RESOURCE_TYPES = RESOURCE_TYPES.filter(
  (rt, idx, arr) => arr.findIndex((r) => r.id === rt.id) === idx,
);

const POPULAR_BRANDS = [
  "Schneider Electric", "WEG", "Camozzi", "ABB",
  "Siemens", "Legrand", "Phoenix Contact", "WAGO",
];

// ─────────────────────────────────────────────────────────────────────────────
// Data fetching
// ─────────────────────────────────────────────────────────────────────────────

interface LibraryData {
  assets:  LibraryAsset[];
  total:   number;
  counts:  Record<string, number>;
}

function buildTypeQuery(type: string): Record<string, unknown> {
  switch (type) {
    case "datasheets":
      return {
        $or: [
          { folder: { $regex: "^datasheets", $options: "i" } },
          { mimetype: "application/pdf", folder: { $not: /^(manuals|guides|certificates)/i } },
        ],
      };
    case "manuals":      return { folder: { $regex: "^manuals",      $options: "i" } };
    case "guides":       return { folder: { $regex: "^guides",       $options: "i" } };
    case "videos":       return { mimetype: { $regex: "^video/",     $options: "i" } };
    case "software":     return { folder: { $regex: "^software",     $options: "i" } };
    case "certificates": return { folder: { $regex: "^certificates", $options: "i" } };
    default:             return {};
  }
}

async function getLibraryData(
  type: string,
  q: string,
  brand: string,
): Promise<LibraryData> {
  try {
    await connectDB();

    // Base query: only active public assets
    const base: Record<string, unknown> = { status: "active" };

    const typeFilter = buildTypeQuery(type);
    if (Object.keys(typeFilter).length) Object.assign(base, typeFilter);

    if (brand) {
      const brandRx = { $regex: brand, $options: "i" };
      base.$or = [
        { tags:        brandRx },
        { filename:    brandRx },
        { description: brandRx },
        { altText:     brandRx },
      ];
    }

    if (q) {
      const qRx = { $regex: q, $options: "i" };
      base.$or = [
        { filename:    qRx },
        { originalName: qRx },
        { description: qRx },
        { altText:     qRx },
        { tags:        qRx },
      ];
    }

    const [rawAssets, total, byType] = await Promise.all([
      AssetModel.find(base)
        .sort({ createdAt: -1 })
        .limit(24)
        .select(
          "_id key url filename originalName mimetype size folder tags altText description createdAt updatedAt downloadCount viewCount",
        )
        .lean(),
      AssetModel.countDocuments(base),
      AssetModel.aggregate([
        { $match: { status: "active" } },
        {
          $group: {
            _id: {
              $switch: {
                branches: [
                  {
                    case: { $regexMatch: { input: "$mimetype", regex: "^video/" } },
                    then: "videos",
                  },
                  {
                    case: { $regexMatch: { input: "$folder", regex: "^manuals", options: "i" } },
                    then: "manuals",
                  },
                  {
                    case: { $regexMatch: { input: "$folder", regex: "^guides", options: "i" } },
                    then: "guides",
                  },
                  {
                    case: { $regexMatch: { input: "$folder", regex: "^software", options: "i" } },
                    then: "software",
                  },
                  {
                    case: { $regexMatch: { input: "$folder", regex: "^certificates", options: "i" } },
                    then: "certificates",
                  },
                  {
                    case: { $regexMatch: { input: "$folder", regex: "^datasheets", options: "i" } },
                    then: "datasheets",
                  },
                  {
                    case: { $eq: ["$mimetype", "application/pdf"] },
                    then: "datasheets",
                  },
                ],
                default: "other",
              },
            },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const counts = Object.fromEntries(
      byType.map((b: { _id: string; count: number }) => [b._id, b.count]),
    );

    const assets: LibraryAsset[] = rawAssets.map((a) => {
      const doc = a as unknown as { _id: { toString(): string } };
      return { ...JSON.parse(JSON.stringify(a)), _id: doc._id.toString() };
    });

    return { assets, total, counts };
  } catch (err) {
    console.error("[LibraryPage] data fetch error:", err);
    return { assets: [], total: 0, counts: {} };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; q?: string; brand?: string }>;
}) {
  const { type = "", q = "", brand = "" } = await searchParams;
  const { assets, total, counts }         = await getLibraryData(type, q, brand);

  const totalAll = Object.values(counts)
    .filter((_, i, arr) => i === arr.indexOf(_)) // dedupe values
    .reduce((a, b) => a + b, 0);

  return (
    <main className="min-h-screen" style={{ background: "var(--bg-base)" }}>
      {/* ── Hero banner ───────────────────────────────────────────────── */}
      <div style={{ background: "#0a1628" }} className="py-12 sm:py-16">
        <div className="container-store">
          <p className="text-[10px] font-bold text-[#a78bfa] uppercase tracking-widest mb-2">
            Technical Resources
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Technical Library
          </h1>
          <p className="text-white/50 mt-2 max-w-xl text-[14px]">
            Free access to {totalAll > 0 ? `${totalAll.toLocaleString()}+` : "thousands of"} technical
            documents, manuals, and guides for all products distributed by APT Ghana.
          </p>

          {/* Search bar */}
          <form action="/library" className="mt-6 flex max-w-lg gap-0">
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="Search documents, part numbers, or product names…"
              className="flex-1 h-12 px-4 bg-white rounded-l-xl text-[13px] text-[#111827] placeholder-[#9ca3af] focus:outline-none"
            />
            {type && <input type="hidden" name="type" value={type} />}
            <button
              type="submit"
              className="h-12 px-5 bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-semibold text-[13px] rounded-r-xl transition-colors"
            >
              Search
            </button>
          </form>

          {/* Quick type chips below search */}
          <div className="flex flex-wrap gap-2 mt-4">
            {UNIQUE_RESOURCE_TYPES.map((rt) => (
              <a
                key={rt.id}
                href={`/library?type=${rt.id}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all hover:opacity-90"
                style={{
                  background: type === rt.id ? rt.color    : "rgba(255,255,255,0.1)",
                  color:      type === rt.id ? "#ffffff"   : "rgba(255,255,255,0.75)",
                  border:     type === rt.id ? "none"      : "1px solid rgba(255,255,255,0.15)",
                }}
              >
                {rt.title.split(" ")[0]}
                {(counts[rt.id] ?? 0) > 0 && (
                  <span
                    className="px-1.5 py-0.5 rounded-full text-[9px] font-bold"
                    style={{
                      background: type === rt.id ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.15)",
                      color:      "#ffffff",
                    }}
                  >
                    {counts[rt.id]}
                  </span>
                )}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* ── Body ──────────────────────────────────────────────────────── */}
      <div className="container-store py-10">
        <LibraryBrowser
          initialAssets={assets}
          initialTotal={total}
          counts={counts}
          resourceTypes={UNIQUE_RESOURCE_TYPES}
          popularBrands={POPULAR_BRANDS}
          activeType={type}
          activeQuery={q}
          activeBrand={brand}
        />
      </div>
    </main>
  );
}
