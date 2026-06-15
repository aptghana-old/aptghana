export default function ProductsLoading() {
  return (
    <div className="min-h-screen bg-[#f9fafb] animate-pulse">
      <div className="h-[120px] bg-[#0a1628]" />
      <div className="bg-[#0e1e38] h-40 w-full" />
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-[260px_1fr] gap-6">
          {/* Sidebar */}
          <div className="space-y-3">
            <div className="h-80 bg-white rounded-2xl border border-[#e5e7eb]" />
            <div className="h-48 bg-white rounded-2xl border border-[#e5e7eb]" />
          </div>
          {/* Grid */}
          <div>
            <div className="flex items-center justify-between mb-5">
              <div className="h-5 w-32 bg-[#e5e7eb] rounded-full" />
              <div className="h-9 w-40 bg-[#e5e7eb] rounded-xl" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-[#e5e7eb] overflow-hidden">
                  <div className="aspect-square bg-[#f3f4f6]" />
                  <div className="p-4 space-y-2">
                    <div className="h-3 w-20 bg-[#e5e7eb] rounded-full" />
                    <div className="h-4 w-full bg-[#e5e7eb] rounded-full" />
                    <div className="h-4 w-3/4 bg-[#e5e7eb] rounded-full" />
                    <div className="h-5 w-24 bg-[#e5e7eb] rounded-full mt-3" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
