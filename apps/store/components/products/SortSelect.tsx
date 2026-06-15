"use client";

export default function SortSelect({ value }: { value: string }) {
  return (
    <select
      className="text-sm border border-[#e5e7eb] rounded-lg px-3 py-1.5 text-[#374151] bg-white focus:outline-none focus:border-[#0057b8]"
      defaultValue={value}
      onChange={(e) => {
        const url = new URL(window.location.href);
        url.searchParams.set("sort", e.target.value);
        window.location.href = url.toString();
      }}
    >
      <option value="relevance">Most Relevant</option>
      <option value="popular">Most Popular</option>
      <option value="newest">Newest First</option>
      <option value="price-asc">Price: Low to High</option>
      <option value="price-desc">Price: High to Low</option>
    </select>
  );
}
