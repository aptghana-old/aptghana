import type { Metadata } from "next";
import Link from "next/link";
import {
  ChevronLeft, CheckCircle2, Clock, Copy, Trash2, Zap, FileText,
} from "lucide-react";
import { connectDB, SearchConfigModel } from "@apt/db";
import { INDEXES } from "@apt/search";
import { Button } from "@/components/ui/Button";
import { ApplyVersionButton } from "@/components/search/ApplyVersionButton";
import { DuplicateVersionButton } from "@/components/search/DuplicateVersionButton";
import type { SearchIndexName } from "@apt/types";
import { SEARCH_INDEX_LABELS } from "@apt/types";

export const metadata: Metadata = { title: "Search Config History" };

const VALID_INDEXES = Object.values(INDEXES) as string[];
const PAGE_SIZE = 20;

interface Props {
  searchParams: Promise<{ index?: string; page?: string }>;
}

export default async function SearchHistoryPage({ searchParams }: Props) {
  const { index: indexParam, page: pageParam } = await searchParams;
  const indexName = (indexParam && VALID_INDEXES.includes(indexParam)
    ? indexParam
    : INDEXES.PRODUCTS) as SearchIndexName;

  const page = Math.max(1, parseInt(pageParam ?? "1") || 1);
  const skip = (page - 1) * PAGE_SIZE;

  await connectDB();

  const [ versions, total ] = await Promise.all([
    SearchConfigModel.find({ index: indexName })
      .select("-settings")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(PAGE_SIZE)
      .lean(),
    SearchConfigModel.countDocuments({ index: indexName }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div>
      {/* Header */}
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
          Config History
        </span>

        <div className="flex-1" />

        {/* Index selector */}
        <div className="flex items-center gap-1.5">
          {(Object.entries(SEARCH_INDEX_LABELS) as [ SearchIndexName, string ][]).map(
            ([ key, label ]) => (
              <Link
                key={key}
                href={`/dashboard/search/history?index=${key}`}
                className="px-3 py-1 rounded-full text-[11px] font-medium transition-colors"
                style={{
                  background: indexName === key ? "#0057b8" : "var(--apt-bg-raised)",
                  color: indexName === key ? "#fff" : "var(--apt-text-secondary)",
                }}
              >
                {label}
              </Link>
            ),
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-5">
          <p className="text-[13px]" style={{ color: "var(--apt-text-muted)" }}>
            {total} version{total !== 1 ? "s" : ""} for{" "}
            <span className="font-semibold" style={{ color: "var(--apt-text-primary)" }}>
              {SEARCH_INDEX_LABELS[ indexName ]}
            </span>
          </p>
          <Link href={`/dashboard/search/settings?index=${indexName}`}>
            <Button variant="primary" size="sm" icon={<FileText size={12} />}>
              Edit Settings
            </Button>
          </Link>
        </div>

        {versions.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-20 rounded-xl border"
            style={{ borderColor: "var(--apt-border)", color: "var(--apt-text-muted)" }}
          >
            <Clock size={28} className="mb-3 opacity-40" />
            <p className="text-[14px] font-medium mb-1">No config history yet</p>
            <p className="text-[12px]">Save your first config version to start tracking changes.</p>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Version</th>
                  <th>Note</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Applied</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {versions.map((v) => (
                  <tr key={String(v._id)}>
                    <td>
                      <span
                        className="font-mono font-semibold text-[12px] px-2 py-0.5 rounded"
                        style={{ background: "#eff6ff", color: "#0057b8" }}
                      >
                        v{v.version}
                      </span>
                    </td>
                    <td>
                      <span className="text-[12px]" style={{ color: "var(--apt-text-primary)" }}>
                        {v.note || <em style={{ color: "var(--apt-text-muted)" }}>No note</em>}
                      </span>
                    </td>
                    <td>
                      {v.isActive ? (
                        <span className="flex items-center gap-1.5 text-[11px] font-semibold" style={{ color: "#16a34a" }}>
                          <CheckCircle2 size={12} />
                          Active
                        </span>
                      ) : (
                        <span className="text-[11px]" style={{ color: "var(--apt-text-muted)" }}>
                          Draft
                        </span>
                      )}
                    </td>
                    <td>
                      <span className="text-[12px]" style={{ color: "var(--apt-text-muted)" }}>
                        {new Date(v.createdAt as unknown as string).toLocaleDateString("en-GB", {
                          day: "numeric", month: "short", year: "numeric",
                        })}
                      </span>
                    </td>
                    <td>
                      <span className="text-[12px]" style={{ color: "var(--apt-text-muted)" }}>
                        {v.appliedAt
                          ? new Date(v.appliedAt as string).toLocaleDateString("en-GB", {
                            day: "numeric", month: "short", year: "numeric",
                          })
                          : "—"}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5 justify-end">
                        <DuplicateVersionButton
                          index={indexName}
                          versionId={String(v._id)}
                          versionNumber={v.version as number}
                        />
                        {!v.isActive && (
                          <ApplyVersionButton
                            index={indexName}
                            versionId={String(v._id)}
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-5">
            <p className="text-[12px]" style={{ color: "var(--apt-text-muted)" }}>
              Page {page} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              {page > 1 && (
                <Link href={`/dashboard/search/history?index=${indexName}&page=${page - 1}`}>
                  <Button variant="secondary" size="sm">Previous</Button>
                </Link>
              )}
              {page < totalPages && (
                <Link href={`/dashboard/search/history?index=${indexName}&page=${page + 1}`}>
                  <Button variant="secondary" size="sm">Next</Button>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
