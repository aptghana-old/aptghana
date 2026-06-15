"use client";

interface Brand { slug: string; name: string }
interface Category { _id: string; slug: string; name: string; level: string }

interface FilterPanelProps {
  brands: Brand[];
  categories: Category[];
  currentBrand?: string;
  currentCategory?: string;
}

export default function FilterPanel({ brands, categories, currentBrand, currentCategory }: FilterPanelProps) {
  const updateFilter = (key: string, value: string | null) => {
    const url = new URL(window.location.href);
    if (value === null) {
      url.searchParams.delete(key);
    } else {
      url.searchParams.set(key, value);
    }
    url.searchParams.delete("page");
    window.location.href = url.toString();
  };

  return (
    <div className="space-y-6">
      {/* Availability */}
      <div>
        <h3 className="text-sm font-bold text-[#0a1628] mb-3">Availability</h3>
        <div className="space-y-2">
          {[
            { label: "In Stock", key: "inStock", value: "true" },
            { label: "Clearance", key: "clearance", value: "true" },
          ].map((f) => (
            <label key={f.key} className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-[#d1d5db] text-[#0057b8] focus:ring-[#0057b8]"
                onChange={(e) => updateFilter(f.key, e.target.checked ? f.value : null)}
              />
              <span className="text-sm text-[#374151] group-hover:text-[#0057b8] transition-colors">{f.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Brands */}
      <div>
        <h3 className="text-sm font-bold text-[#0a1628] mb-3">Brand</h3>
        <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
          <button
            className={`w-full text-left text-sm px-2 py-1.5 rounded-lg transition-colors ${
              !currentBrand ? "bg-[#0057b8]/10 text-[#0057b8] font-medium" : "text-[#374151] hover:bg-[#f3f4f6]"
            }`}
            onClick={() => updateFilter("brand", null)}
          >
            All Brands
          </button>
          {brands.map((brand) => (
            <button
              key={brand.slug}
              className={`w-full text-left text-sm px-2 py-1.5 rounded-lg transition-colors ${
                currentBrand === brand.slug ? "bg-[#0057b8]/10 text-[#0057b8] font-medium" : "text-[#374151] hover:bg-[#f3f4f6]"
              }`}
              onClick={() => updateFilter("brand", brand.slug)}
            >
              {brand.name}
            </button>
          ))}
        </div>
      </div>

      {/* Categories */}
      <div>
        <h3 className="text-sm font-bold text-[#0a1628] mb-3">Category</h3>
        <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
          <button
            className={`w-full text-left text-sm px-2 py-1.5 rounded-lg transition-colors ${
              !currentCategory ? "bg-[#0057b8]/10 text-[#0057b8] font-medium" : "text-[#374151] hover:bg-[#f3f4f6]"
            }`}
            onClick={() => updateFilter("category", null)}
          >
            All Categories
          </button>
          {categories.slice(0, 20).map((cat) => (
            <button
              key={cat._id}
              className={`w-full text-left text-sm px-2 py-1.5 rounded-lg transition-colors ${
                currentCategory === cat.slug ? "bg-[#0057b8]/10 text-[#0057b8] font-medium" : "text-[#374151] hover:bg-[#f3f4f6]"
              }`}
              onClick={() => updateFilter("category", cat.slug)}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Clear filters */}
      <button
        className="w-full py-2 text-sm font-medium text-[#6b7280] border border-[#e5e7eb] rounded-lg hover:border-[#0057b8] hover:text-[#0057b8] transition-colors"
        onClick={() => { window.location.href = "/products"; }}
      >
        Clear All Filters
      </button>
    </div>
  );
}
