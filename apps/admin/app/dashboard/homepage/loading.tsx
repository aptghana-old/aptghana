export default function HomepageLoading() {
  return (
    <div className="flex h-[calc(100vh-56px)] overflow-hidden animate-pulse">
      {/* Sidebar skeleton */}
      <aside className="w-64 xl:w-72 shrink-0 border-r p-4 space-y-2" style={{ borderColor: "var(--apt-border)" }}>
        <div className="h-4 w-24 rounded" style={{ background: "var(--apt-bg-raised)" }} />
        <div className="h-10 rounded-lg" style={{ background: "var(--apt-bg-raised)" }} />
        <div className="border-b my-2" style={{ borderColor: "var(--apt-border)" }} />
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-9 rounded-lg" style={{ background: "var(--apt-bg-raised)" }} />
        ))}
      </aside>

      {/* Editor skeleton */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: "var(--apt-border)" }}>
          <div className="h-5 w-40 rounded" style={{ background: "var(--apt-bg-raised)" }} />
          <div className="flex gap-2">
            <div className="h-8 w-20 rounded-md" style={{ background: "var(--apt-bg-raised)" }} />
            <div className="h-8 w-24 rounded-md" style={{ background: "var(--apt-bg-raised)" }} />
          </div>
        </div>
        <div className="flex-1 p-6">
          <div className="max-w-2xl mx-auto space-y-4">
            <div className="h-8 w-48 rounded" style={{ background: "var(--apt-bg-raised)" }} />
            <div className="h-32 rounded-xl" style={{ background: "var(--apt-bg-raised)" }} />
            <div className="h-20 rounded-xl" style={{ background: "var(--apt-bg-raised)" }} />
          </div>
        </div>
      </main>
    </div>
  );
}
