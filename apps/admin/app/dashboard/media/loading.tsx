export default function MediaLoading() {
  return (
    <div className="flex flex-col h-full animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "var(--apt-border)" }}>
        <div>
          <div className="h-5 w-32 rounded-md mb-2" style={{ background: "var(--apt-bg-raised)" }} />
          <div className="h-3 w-56 rounded" style={{ background: "var(--apt-bg-raised)" }} />
        </div>
        <div className="flex gap-2">
          <div className="h-8 w-28 rounded-md" style={{ background: "var(--apt-bg-raised)" }} />
          <div className="h-8 w-8 rounded-md"  style={{ background: "var(--apt-bg-raised)" }} />
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 px-6 py-4 border-b" style={{ borderColor: "var(--apt-border)" }}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="rounded-lg p-3" style={{ background: "var(--apt-bg-subtle)" }}>
            <div className="h-3 w-12 rounded mb-2" style={{ background: "var(--apt-bg-raised)" }} />
            <div className="h-5 w-8 rounded"  style={{ background: "var(--apt-bg-raised)" }} />
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-56 border-r p-4 space-y-3 shrink-0" style={{ borderColor: "var(--apt-border)" }}>
          <div className="h-8 rounded-md" style={{ background: "var(--apt-bg-raised)" }} />
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-7 rounded-md" style={{ background: "var(--apt-bg-raised)", width: `${70 + i * 5}%` }} />
          ))}
        </div>

        {/* Grid */}
        <div className="flex-1 p-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {Array.from({ length: 18 }).map((_, i) => (
            <div key={i} className="rounded-lg overflow-hidden aspect-square" style={{ background: "var(--apt-bg-raised)" }} />
          ))}
        </div>
      </div>
    </div>
  );
}
