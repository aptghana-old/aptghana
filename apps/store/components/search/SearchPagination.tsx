"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

interface Props {
  totalPages: number;
  currentPage: number;
  basePath?: string;
}

export default function SearchPagination({ totalPages, currentPage, basePath = "/search" }: Props) {
  const searchParams = useSearchParams();

  function pageHref(page: number): string {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    return `${basePath ?? "/search"}?${params.toString()}`;
  }

  if (totalPages <= 1) return null;

  // Build page range with ellipses
  const pages: (number | "...")[] = [];
  const delta = 2;
  const left = currentPage - delta;
  const right = currentPage + delta;

  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= left && i <= right)) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "...") {
      pages.push("...");
    }
  }

  return (
    <nav className="flex items-center justify-center gap-1.5 mt-8" aria-label="Pagination">
      {currentPage > 1 && (
        <Link
          href={pageHref(currentPage - 1)}
          className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
          style={{ background: "var(--bg-surface)", color: "var(--text-2)", border: "1px solid var(--border)" }}
          aria-label="Previous page"
        >
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Prev
        </Link>
      )}

      {pages.map((page, i) =>
        page === "..." ? (
          <span key={`ellipsis-${i}`} className="px-2 text-sm" style={{ color: "var(--text-4)" }}>
            …
          </span>
        ) : (
          <Link
            key={page}
            href={pageHref(page)}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-sm font-medium transition-colors"
            style={
              page === currentPage
                ? { background: "#3DCD58", color: "#fff" }
                : { background: "var(--bg-surface)", color: "var(--text-2)", border: "1px solid var(--border)" }
            }
            aria-label={`Page ${page}`}
            aria-current={page === currentPage ? "page" : undefined}
          >
            {page}
          </Link>
        )
      )}

      {currentPage < totalPages && (
        <Link
          href={pageHref(currentPage + 1)}
          className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
          style={{ background: "var(--bg-surface)", color: "var(--text-2)", border: "1px solid var(--border)" }}
          aria-label="Next page"
        >
          Next
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </Link>
      )}
    </nav>
  );
}
