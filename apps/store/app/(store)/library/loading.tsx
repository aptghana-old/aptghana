export default function LibraryLoading() {
  return (
    <main className="min-h-screen" style={{ background: "var(--bg-base)" }}>
      {/* Hero */}
      <div className="bg-[#0a1628] py-12 sm:py-16">
        <div className="container-store">
          <div className="h-3 w-32 rounded-full bg-white/10 mb-3" />
          <div className="h-8 w-72 rounded-xl bg-white/15 mb-3" />
          <div className="h-4 w-96 max-w-full rounded-full bg-white/10 mb-6" />
          <div className="flex max-w-lg gap-0">
            <div className="flex-1 h-12 rounded-l-xl bg-white/10" />
            <div className="w-24 h-12 rounded-r-xl bg-[#7c3aed]/40" />
          </div>
          {/* Chips */}
          <div className="flex gap-2 mt-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-7 w-20 rounded-full bg-white/10" />
            ))}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="container-store py-10">
        <div className="grid lg:grid-cols-[240px_1fr] gap-8 animate-pulse">
          {/* Sidebar */}
          <div className="space-y-4">
            <div
              className="rounded-2xl p-5 space-y-2"
              style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
            >
              <div className="h-3 w-24 rounded-full mb-4" style={{ background: "var(--bg-raised)" }} />
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="h-9 rounded-xl" style={{ background: "var(--bg-raised)" }} />
              ))}
            </div>
            <div
              className="rounded-2xl p-5 space-y-2"
              style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
            >
              <div className="h-3 w-16 rounded-full mb-4" style={{ background: "var(--bg-raised)" }} />
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-8 rounded-xl" style={{ background: "var(--bg-raised)" }} />
              ))}
            </div>
          </div>

          {/* Content */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="h-5 w-44 rounded-full mb-2" style={{ background: "var(--bg-raised)" }} />
                <div className="h-3 w-28 rounded-full"      style={{ background: "var(--bg-raised)" }} />
              </div>
              <div className="h-10 w-56 rounded-xl" style={{ background: "var(--bg-raised)" }} />
            </div>
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {Array.from({ length: 9 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-2xl overflow-hidden"
                  style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
                >
                  <div className="p-4 flex gap-2">
                    <div className="h-6 w-14 rounded-lg" style={{ background: "var(--bg-raised)" }} />
                  </div>
                  <div className="px-4 space-y-2 pb-4">
                    <div className="h-4 w-full rounded-full"  style={{ background: "var(--bg-raised)" }} />
                    <div className="h-4 w-3/4 rounded-full"   style={{ background: "var(--bg-raised)" }} />
                    <div className="h-3 w-1/2 rounded-full mt-1" style={{ background: "var(--bg-raised)" }} />
                    <div className="flex gap-2 pt-1">
                      <div className="h-5 w-16 rounded-full" style={{ background: "var(--bg-raised)" }} />
                      <div className="h-5 w-12 rounded-full" style={{ background: "var(--bg-raised)" }} />
                    </div>
                  </div>
                  <div className="px-4 pb-4">
                    <div className="h-10 w-full rounded-xl" style={{ background: "var(--bg-raised)" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
