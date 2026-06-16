export default function CatalogLoading() {
  return (
    <div className="animate-pulse">
      <div className="bg-[#0e1e38] h-40 w-full" />
      <div className="container-store py-6 md:py-8">
        <div className="grid lg:grid-cols-[260px_1fr] gap-6">
          <div className="space-y-3">
            <div className="h-80 bg-white rounded-2xl border border-[#e5e7eb]" />
            <div className="h-48 bg-white rounded-2xl border border-[#e5e7eb]" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-5">
              <div className="h-5 w-32 bg-[#e5e7eb] rounded-full" />
              <div className="h-9 w-40 bg-[#e5e7eb] rounded-xl" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-[#e5e7eb] overflow-hidden">
                  <div className="aspect-square bg-[#f3f4f6]" />
                  <div className="p-4 space-y-2">
                    <div className="h-3 w-20 bg-[#e5e7eb] rounded-full" />
                    <div className="h-4 w-full bg-[#e5e7eb] rounded-full" />
                    <div className="h-4 w-3/4 bg-[#e5e7eb] rounded-full" />
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
