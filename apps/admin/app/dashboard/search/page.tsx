import type { Metadata } from "next";
import Link from "next/link";
import {
  TrendingUp, AlertCircle, Settings2, ArrowRight,
  CheckCircle2, Clock, RefreshCw, History,
} from "lucide-react";
import { connectDB, SearchConfigModel } from "@apt/db";
import { getMeilisearchClient, INDEXES } from "@apt/search";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { ReindexButton } from "@/components/search/ReindexButton";
import type { SearchIndexName } from "@apt/types";
import { SEARCH_INDEX_LABELS } from "@apt/types";

export const metadata: Metadata = { title: "Search" };

async function getIndexSummaries() {
  await connectDB();
  const client = getMeilisearchClient();
  const allIndexes = Object.values(INDEXES) as SearchIndexName[];

  return Promise.all(
    allIndexes.map(async (indexName) => {
      const [active, total, liveStats] = await Promise.all([
        SearchConfigModel.findOne({ index: indexName, isActive: true })
          .select("_id version note appliedAt createdAt")
          .lean(),
        SearchConfigModel.countDocuments({ index: indexName }),
        client
          .index(indexName)
          .getStats()
          .catch(() => null),
      ]);
      return {
        indexName,
        label:      SEARCH_INDEX_LABELS[indexName],
        active,
        total,
        docCount:   liveStats?.numberOfDocuments ?? null,
        isIndexing: liveStats?.isIndexing         ?? false,
      };
    }),
  );
}

export default async function SearchPage() {
  const summaries = await getIndexSummaries();
  const products  = summaries.find((s) => s.indexName === INDEXES.PRODUCTS);

  return (
    <div>
      <PageHeader
        title="Search Management"
        description="Database-driven Meilisearch configuration — every change is versioned and auditable."
        actions={<ReindexButton />}
      />

      <div className="p-6 space-y-6">
        {/* ── Index cards ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-4">
          {summaries.map((s) => (
            <Link
              key={s.indexName}
              href={`/dashboard/search/settings?index=${s.indexName}`}
              className="card p-5 hover:shadow-md transition-shadow group block"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-[14px] font-semibold" style={{ color: "var(--apt-text-primary)" }}>
                    {s.label}
                  </h3>
                  <p className="text-[11px] mt-0.5 font-mono" style={{ color: "var(--apt-text-muted)" }}>
                    {s.indexName}
                  </p>
                </div>
                <ArrowRight
                  size={14}
                  className="opacity-0 group-hover:opacity-100 transition-opacity mt-0.5 shrink-0"
                  style={{ color: "var(--apt-text-muted)" }}
                />
              </div>

              <div className="flex flex-col gap-2">
                {/* Version badge */}
                {s.active ? (
                  <div className="flex items-center gap-1.5 text-[12px]" style={{ color: "#166534" }}>
                    <CheckCircle2 size={12} />
                    v{s.active.version} active
                    {s.active.appliedAt
                      ? ` · Applied ${new Date(s.active.appliedAt as string).toLocaleDateString()}`
                      : " · Not applied to Meilisearch"}
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-[12px]" style={{ color: "#d97706" }}>
                    <AlertCircle size={12} />
                    No active config
                  </div>
                )}

                {/* Live doc count */}
                {s.docCount !== null && (
                  <div className="flex items-center gap-1.5 text-[12px]" style={{ color: "var(--apt-text-muted)" }}>
                    {s.isIndexing && <RefreshCw size={11} className="animate-spin" />}
                    {s.docCount.toLocaleString()} documents in index
                  </div>
                )}

                {/* Version count */}
                <div className="flex items-center gap-1.5 text-[11px]" style={{ color: "var(--apt-text-muted)" }}>
                  <History size={10} />
                  {s.total} config version{s.total !== 1 ? "s" : ""}
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* ── Quick links ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-4">
          <Link
            href="/dashboard/search/settings"
            className="card p-5 hover:shadow-md transition-shadow group block"
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: "#eff6ff" }}>
              <Settings2 size={18} style={{ color: "#0057b8" }} />
            </div>
            <h3 className="text-[13px] font-semibold mb-1" style={{ color: "var(--apt-text-primary)" }}>
              Settings Editor
            </h3>
            <p className="text-[12px]" style={{ color: "var(--apt-text-muted)" }}>
              Configure attributes, synonyms, ranking rules, typo tolerance, and more.
            </p>
          </Link>

          <Link
            href="/dashboard/search/history"
            className="card p-5 hover:shadow-md transition-shadow group block"
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: "#f0fdf4" }}>
              <History size={18} style={{ color: "#16a34a" }} />
            </div>
            <h3 className="text-[13px] font-semibold mb-1" style={{ color: "var(--apt-text-primary)" }}>
              Config History
            </h3>
            <p className="text-[12px]" style={{ color: "var(--apt-text-muted)" }}>
              Browse, compare, and restore any previous configuration version.
            </p>
          </Link>

          <Link
            href="/dashboard/search/analytics"
            className="card p-5 hover:shadow-md transition-shadow group block"
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: "#fdf4ff" }}>
              <TrendingUp size={18} style={{ color: "#9333ea" }} />
            </div>
            <h3 className="text-[13px] font-semibold mb-1" style={{ color: "var(--apt-text-primary)" }}>
              Search Analytics
            </h3>
            <p className="text-[12px]" style={{ color: "var(--apt-text-muted)" }}>
              Trending searches, zero-result queries, click-through rates.
            </p>
          </Link>
        </div>

        {/* ── Active synonyms preview (products index) ─────────────────── */}
        {products?.active && (
          <div className="card overflow-hidden">
            <div className="card-header">
              <div>
                <h2 className="text-[14px] font-semibold" style={{ color: "var(--apt-text-primary)" }}>
                  Active Synonyms
                </h2>
                <p className="text-[12px] mt-0.5" style={{ color: "var(--apt-text-muted)" }}>
                  Products index · v{products.active.version}
                </p>
              </div>
              <Link href="/dashboard/search/settings?index=products">
                <Button variant="ghost" size="xs" iconRight={<ArrowRight size={11} />}>
                  Manage
                </Button>
              </Link>
            </div>
            <SynonymsPreview indexName={INDEXES.PRODUCTS} />
          </div>
        )}
      </div>
    </div>
  );
}

// Server component — fetches synonyms from the active config
async function SynonymsPreview({ indexName }: { indexName: string }) {
  const active = await SearchConfigModel.findOne({ index: indexName, isActive: true })
    .select("settings.synonyms")
    .lean();

  const synonyms = active?.settings?.synonyms as Record<string, string[]> | undefined;

  if (!synonyms || Object.keys(synonyms).length === 0) {
    return (
      <p className="px-5 py-4 text-[12px]" style={{ color: "var(--apt-text-muted)" }}>
        No synonyms configured. Open Settings Editor to add them.
      </p>
    );
  }

  const entries = Object.entries(synonyms).slice(0, 12);

  return (
    <table className="data-table">
      <thead>
        <tr>
          <th>Search Term</th>
          <th>Also matches</th>
        </tr>
      </thead>
      <tbody>
        {entries.map(([term, matches]) => (
          <tr key={term}>
            <td>
              <span
                className="font-mono font-semibold text-[12px] px-2 py-0.5 rounded"
                style={{ background: "#eff6ff", color: "#0057b8" }}
              >
                {term}
              </span>
            </td>
            <td>
              <div className="flex flex-wrap gap-1.5">
                {matches.map((m) => (
                  <span
                    key={m}
                    className="text-[11px] px-2 py-0.5 rounded font-mono"
                    style={{ background: "var(--apt-bg-raised)", color: "var(--apt-text-secondary)" }}
                  >
                    {m}
                  </span>
                ))}
              </div>
            </td>
          </tr>
        ))}
        {Object.keys(synonyms).length > 12 && (
          <tr>
            <td colSpan={2}>
              <Link
                href="/dashboard/search/settings?index=products"
                className="text-[12px] underline"
                style={{ color: "#0057b8" }}
              >
                +{Object.keys(synonyms).length - 12} more — view all in Settings Editor
              </Link>
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}
