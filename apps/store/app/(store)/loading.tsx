export default function Loading() {
  return (
    <div className="min-h-screen bg-[#f9fafb] animate-pulse">
      {/* Placeholder header height */}
      <div className="h-[120px] bg-[#0a1628]" />
      {/* Hero placeholder */}
      <div className="bg-[#0e1e38] h-72 w-full" />
      {/* Services bar */}
      <div className="bg-white border-b border-[#e5e7eb] h-16" />
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        {/* Section heading */}
        <div className="space-y-2">
          <div className="h-3 w-24 bg-[#e5e7eb] rounded-full" />
          <div className="h-8 w-72 bg-[#e5e7eb] rounded-xl" />
          <div className="h-4 w-52 bg-[#e5e7eb] rounded-full" />
        </div>
        {/* Card grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-36 bg-white rounded-2xl border border-[#e5e7eb]" />
          ))}
        </div>
      </div>
    </div>
  );
}
