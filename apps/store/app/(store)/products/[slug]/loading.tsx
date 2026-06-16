export default function ProductDetailLoading() {
  return (
    <div className="container-store py-6 md:py-10 flex-1 animate-pulse">
      <div className="h-4 w-64 bg-[#e5e7eb] rounded-full mb-6" />
      <div className="grid lg:grid-cols-2 gap-8">
        <div className="space-y-3">
          <div className="aspect-square bg-[#f3f4f6] rounded-2xl border border-[#e5e7eb]" />
          <div className="grid grid-cols-5 gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="aspect-square bg-[#f3f4f6] rounded-lg border border-[#e5e7eb]" />
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <div className="h-4 w-24 bg-[#e5e7eb] rounded-full" />
          <div className="h-7 w-3/4 bg-[#e5e7eb] rounded-full" />
          <div className="h-5 w-32 bg-[#e5e7eb] rounded-full" />
          <div className="h-9 w-40 bg-[#e5e7eb] rounded-full mt-2" />
          <div className="h-32 bg-white rounded-2xl border border-[#e5e7eb]" />
          <div className="h-12 bg-[#e5e7eb] rounded-xl" />
        </div>
      </div>
    </div>
  );
}
