import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Database } from "lucide-react";
import { connectDB, SearchConfigModel } from "@apt/db";
import { DEFAULT_SETTINGS_BY_INDEX, INDEXES } from "@apt/search";
import { SearchSettingsEditor } from "@/components/search/SearchSettingsEditor";
import type { SearchIndexName } from "@apt/types";
import { SEARCH_INDEX_LABELS } from "@apt/types";

export const metadata: Metadata = { title: "Search Settings" };

const VALID_INDEXES = Object.values(INDEXES) as string[];

interface Props {
  searchParams: Promise<{ index?: string }>;
}

export default async function SearchSettingsPage({ searchParams }: Props) {
  const { index: indexParam } = await searchParams;
  const indexName = (indexParam && VALID_INDEXES.includes(indexParam)
    ? indexParam
    : INDEXES.PRODUCTS) as SearchIndexName;

  await connectDB();

  // Load active DB config; seed defaults if none exist
  let activeVersion = await SearchConfigModel.findOne({
    index: indexName,
    isActive: true,
  }).lean();

  let versionCount = await SearchConfigModel.countDocuments({ index: indexName });

  // Auto-seed defaults if this index has never been configured
  if (!activeVersion) {
    const defaults = DEFAULT_SETTINGS_BY_INDEX[indexName];
    if (defaults) {
      const seeded = await SearchConfigModel.create({
        index:     indexName,
        version:   1,
        isActive:  true,
        appliedAt: null,
        appliedBy: null,
        settings:  defaults,
        note:      "Auto-seeded from platform defaults",
        createdBy: "system",
      });
      // Re-query to get lean doc
      activeVersion = await SearchConfigModel.findById(seeded._id).lean();
      versionCount  = 1;
    }
  }

  if (!activeVersion) {
    redirect("/dashboard/search");
  }

  const initialSettings = activeVersion!.settings as (typeof DEFAULT_SETTINGS_BY_INDEX)[SearchIndexName];

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Breadcrumb */}
      <div
        className="flex items-center gap-3 px-6 py-3 shrink-0"
        style={{ borderBottom: "1px solid var(--apt-border)", background: "var(--apt-bg)" }}
      >
        <Link
          href="/dashboard/search"
          className="flex items-center gap-1.5 text-[12px] font-medium transition-colors hover:opacity-70"
          style={{ color: "var(--apt-text-secondary)" }}
        >
          <ChevronLeft size={13} /> Search
        </Link>
        <span style={{ color: "var(--apt-border)" }}>/</span>
        <span className="text-[12px] font-medium" style={{ color: "var(--apt-text-primary)" }}>
          Settings
        </span>
        <span style={{ color: "var(--apt-border)" }}>/</span>

        {/* Index selector */}
        <div className="flex items-center gap-1.5 ml-1">
          {(Object.entries(SEARCH_INDEX_LABELS) as [SearchIndexName, string][]).map(
            ([key, label]) => (
              <Link
                key={key}
                href={`/dashboard/search/settings?index=${key}`}
                className="px-3 py-1 rounded-full text-[11px] font-medium transition-colors"
                style={{
                  background: indexName === key ? "#0057b8"            : "var(--apt-bg-raised)",
                  color:      indexName === key ? "#fff"               : "var(--apt-text-secondary)",
                }}
              >
                {label}
              </Link>
            ),
          )}
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-1.5 text-[11px]" style={{ color: "var(--apt-text-muted)" }}>
          <Database size={11} />
          v{activeVersion!.version}
          {activeVersion!.appliedAt
            ? ` · Applied ${new Date(activeVersion!.appliedAt as string).toLocaleDateString()}`
            : " · Draft (not applied)"}
        </div>
      </div>

      {/* Editor fills remaining height */}
      <div className="flex-1 overflow-hidden">
        <SearchSettingsEditor
          index={indexName}
          initialSettings={initialSettings!}
          activeVersionId={String(activeVersion!._id)}
          versionCount={versionCount}
        />
      </div>
    </div>
  );
}
