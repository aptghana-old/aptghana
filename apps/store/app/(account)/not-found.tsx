import Link from "next/link";

export default function NotFound() {
  return (
    <>      <main className="min-h-screen bg-[#f9fafb] flex items-center">
      <div className="container-store py-20 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-[#0a1628] text-white font-black text-2xl mb-8">
          404
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-[#0a1628] tracking-tight mb-4">Page Not Found</h1>
        <p className="text-[#6b7280] text-lg max-w-md mx-auto mb-8 leading-relaxed">
          The page you&apos;re looking for doesn&apos;t exist or has been moved. Try searching our product catalogue instead.
        </p>

        <div className="max-w-xl mx-auto mb-10">
          <form action="/search" className="flex shadow-lg">
            <input
              type="text"
              name="q"
              placeholder="Search 6,000+ industrial products…"
              className="flex-1 h-12 px-4 bg-white border border-[#d1d5db] rounded-l-xl text-sm focus:outline-none focus:border-[#0057b8]"
            />
            <button type="submit" className="h-12 px-5 bg-[#3DCD58] hover:bg-[#2AA347] text-white font-semibold text-sm rounded-r-xl transition-colors">
              Search
            </button>
          </form>
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/" className="inline-flex items-center gap-2 h-11 px-6 bg-navy-500 hover:bg-navy-400 text-white font-semibold text-sm rounded-xl transition-colors">
            Go Home
          </Link>
          <Link href="/catalog" className="inline-flex items-center gap-2 h-11 px-6 border border-[#d1d5db] hover:border-[#0057b8] text-[#374151] hover:text-[#0057b8] font-semibold text-sm rounded-xl transition-colors">
            Browse Catalogue
          </Link>
          <Link href="/rfq" className="inline-flex items-center gap-2 h-11 px-6 border border-[#d1d5db] hover:border-[#3DCD58] text-[#374151] hover:text-[#3DCD58] font-semibold text-sm rounded-xl transition-colors">
            Request a Quote
          </Link>
          <Link href="/contact" className="inline-flex items-center gap-2 h-11 px-6 border border-[#d1d5db] text-[#374151] font-semibold text-sm rounded-xl transition-colors hover:border-[#374151]">
            Contact Us
          </Link>
        </div>
      </div>
    </main>    </>
  );
}
