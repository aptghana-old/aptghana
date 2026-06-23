import type { Metadata } from "next";
import Link from "next/link";
import { connectDB, ProductModel } from "@apt/db";

export const metadata: Metadata = {
  title: "Clearance Sale | APT Ghana",
  description: "Genuine industrial products at reduced prices. Limited stock — first come, first served. All clearance items carry full manufacturer warranty.",
};

export const revalidate = 1800;

interface Product { _id: string; name: string; slug: string; brand: string; price?: number; images?: string[]; stock?: number; sku?: string; }

async function getClearanceProducts(): Promise<Product[]> {
  try {
    await connectDB();
    const products = await ProductModel.find({ status: "active", clearance: true })
      .sort({ createdAt: -1 })
      .select("name slug brand price images stock sku")
      .lean();
    return products as unknown as Product[];
  } catch {
    return [];
  }
}

function fmtBrand(slug?: string) {
  if (!slug) return "";
  return slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

export default async function ClearancePage() {
  const products = await getClearanceProducts();

  return (
    <>      <main className="min-h-screen bg-[#f9fafb]">
      {/* Header */}
      <div className="bg-[#0a1628] py-12">
        <div className="container-store">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#3DCD58] rounded-full text-white text-[10px] font-bold uppercase tracking-widest mb-3">
            Limited Stock
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">Clearance Sale</h1>
          <p className="text-white/50 mt-2 max-w-xl">
            Genuine industrial products at significantly reduced prices. All items carry full manufacturer warranty. Stock is limited — order promptly.
          </p>
        </div>
      </div>

      <div className="container-store py-10">
        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-2xl border border-[#e5e7eb]">
            <svg className="w-12 h-12 text-[#d1d5db] mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 14.25l6-6m4.5-3.493V21.75l-3.75-1.5-3.75 1.5-3.75-1.5-3.75 1.5V4.757c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0c1.1.128 1.907 1.077 1.907 2.185Z" />
            </svg>
            <h2 className="text-xl font-bold text-[#0a1628] mb-2">No Clearance Items Right Now</h2>
            <p className="text-[#6b7280] max-w-md mb-6">There are no clearance products available at the moment. Check back soon, or browse our full product catalogue.</p>
            <Link href="/catalog" className="inline-flex items-center gap-2 h-11 px-7 bg-[#0057b8] hover:bg-[#1a73e8] text-white font-semibold text-sm rounded-xl transition-colors">
              Browse All Products
            </Link>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-[#6b7280]"><span className="font-semibold text-[#0a1628]">{products.length}</span> clearance items available</p>
              <Link href="/rfq" className="text-sm font-semibold text-[#0057b8] hover:text-[#1a73e8] transition-colors">Need a bulk quote?</Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map((product) => (
                <Link
                  key={String(product._id)}
                  href={`/products/${product.slug}`}
                  className="group card-product relative flex flex-col"
                >
                  <div className="relative aspect-square bg-[#f9fafb] rounded-t-[0.75rem] overflow-hidden">
                    {product.images?.[ 0 ] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={product.images[ 0 ]} alt={product.name} loading="lazy" className="w-full h-full object-contain p-3 group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <svg className="w-12 h-12 text-[#d1d5db]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                        </svg>
                      </div>
                    )}
                    <span className="absolute top-2 left-2 bg-[#3DCD58] text-white text-[10px] font-bold px-2 py-0.5 rounded-md">CLEARANCE</span>
                  </div>
                  <div className="p-4 flex flex-col flex-1">
                    <p className="text-[10px] font-bold text-[#0057b8] uppercase tracking-wider mb-1">{fmtBrand(product.brand)}</p>
                    <h3 className="text-sm font-semibold text-[#111827] leading-snug mb-3 line-clamp-2 flex-1">{product.name}</h3>
                    <div className="flex items-center justify-between">
                      {product.price ? (
                        <p className="text-base font-bold text-[#dc2626]">GH₵ {product.price.toLocaleString("en-GH", { minimumFractionDigits: 2 })}</p>
                      ) : (
                        <p className="text-sm font-semibold text-[#0057b8]">Call for price</p>
                      )}
                      {product.stock != null && (
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${product.stock > 0 ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-600 border border-red-200"}`}>
                          {product.stock > 0 ? `${product.stock} left` : "Sold out"}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </main>    </>
  );
}
