import Link from "next/link";

const SUGGESTIONS = [
  { label: "Browse all products", href: "/products" },
  { label: "View clearance items", href: "/clearance" },
  { label: "Contact our team", href: "/contact" },
  { label: "Browse by category", href: "/products" },
];

const TIPS = [
  "Check your spelling or try different keywords",
  "Use a part number or SKU instead of product name",
  "Try a broader search term",
  "Search by brand name",
];

export default function ZeroResults({ query }: { query: string }) {
  return (
    <div className="py-12 max-w-lg mx-auto text-center">
      {/* Icon */}
      <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{ background: "var(--bg-raised)" }}>
        <svg width={36} height={36} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="text-(--text-4)" aria-hidden>
          <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
        </svg>
      </div>

      <h2 className="text-xl font-bold text-(--text-1) mb-2">
        No results for &ldquo;{query}&rdquo;
      </h2>
      <p className="text-[14px] text-(--text-3) leading-relaxed mb-8">
        We couldn&apos;t find any products matching your search. Try adjusting your query or explore our catalogue.
      </p>

      {/* Tips */}
      <div className="text-left rounded-xl p-4 mb-8" style={{ background: "var(--bg-raised)", border: "1px solid var(--border)" }}>
        <p className="text-[12px] font-bold uppercase tracking-wider text-(--text-4) mb-3">Search tips</p>
        <ul className="space-y-1.5">
          {TIPS.map((tip) => (
            <li key={tip} className="flex items-start gap-2 text-[13px] text-(--text-2)">
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="text-se-green mt-0.5 shrink-0" aria-hidden>
                <path d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              {tip}
            </li>
          ))}
        </ul>
      </div>

      {/* Suggestion links */}
      <div className="grid grid-cols-2 gap-2">
        {SUGGESTIONS.map((s) => (
          <Link
            key={s.href + s.label}
            href={s.href}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-[13px] font-medium border transition-colors hover:border-navy-500/40 hover:text-navy-500"
            style={{ borderColor: "var(--border)", background: "var(--bg-surface)", color: "var(--text-2)" }}
          >
            {s.label}
          </Link>
        ))}
      </div>

      {/* CTA */}
      <div className="mt-8 p-5 rounded-2xl" style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}>
        <p className="text-[13px] font-semibold text-(--text-1) mb-1">Can&apos;t find what you need?</p>
        <p className="text-[12px] text-(--text-3) mb-4">
          Our product specialists can source items not listed in our catalogue.
        </p>
        <Link
          href="/rfq"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold text-white bg-navy-500 hover:bg-navy-400 transition-colors"
        >
          Submit a Request for Quote
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
