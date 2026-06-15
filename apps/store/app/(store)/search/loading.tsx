export default function SearchLoading() {
  return (
    <main className="container-store py-6 md:py-8 flex-1">
      {/* Breadcrumb skeleton */}
      <div className="flex items-center gap-2 mb-4">
        {[48, 12, 64, 12, 80].map((w, i) => (
          <div key={i} className="h-3 rounded animate-pulse" style={{ width: w, background: "var(--bg-raised)" }} />
        ))}
      </div>

      <div className="flex gap-8 items-start">
        {/* Sidebar skeleton */}
        <aside className="hidden lg:block w-64 xl:w-72 shrink-0">
          <div className="rounded-2xl p-4 space-y-5" style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}>
            <div className="h-4 w-16 rounded animate-pulse" style={{ background: "var(--bg-raised)" }} />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2.5 pt-4" style={{ borderTop: "1px solid var(--border)" }}>
                <div className="h-3 w-20 rounded animate-pulse" style={{ background: "var(--bg-raised)" }} />
                {Array.from({ length: 4 }).map((_, j) => (
                  <div key={j} className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded shrink-0 animate-pulse" style={{ background: "var(--bg-raised)" }} />
                    <div className="h-3 rounded animate-pulse" style={{ background: "var(--bg-raised)", width: `${55 + j * 12}%` }} />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </aside>

        {/* Results skeleton */}
        <div className="flex-1 min-w-0">
          {/* Sort bar skeleton */}
          <div className="flex items-center gap-3 mb-5">
            <div className="h-4 w-40 rounded animate-pulse" style={{ background: "var(--bg-raised)" }} />
            <div className="ml-auto flex gap-2">
              <div className="h-8 w-32 rounded-lg animate-pulse" style={{ background: "var(--bg-raised)" }} />
              <div className="h-8 w-20 rounded-lg animate-pulse" style={{ background: "var(--bg-raised)" }} />
              <div className="h-8 w-[66px] rounded-lg animate-pulse" style={{ background: "var(--bg-raised)" }} />
            </div>
          </div>

          {/* Grid skeleton */}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="rounded-2xl overflow-hidden" style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}>
                <div className="aspect-square animate-pulse" style={{ background: "var(--bg-raised)" }} />
                <div className="p-3 space-y-2">
                  <div className="h-3 w-16 rounded animate-pulse" style={{ background: "var(--bg-raised)" }} />
                  <div className="h-4 rounded animate-pulse" style={{ background: "var(--bg-raised)" }} />
                  <div className="h-3 rounded animate-pulse" style={{ background: "var(--bg-raised)", width: "75%" }} />
                  <div className="h-5 w-20 rounded animate-pulse mt-1" style={{ background: "var(--bg-raised)" }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
