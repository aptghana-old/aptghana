"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#f9fafb] flex items-center justify-center">
      <div className="text-center max-w-md px-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-50 border border-red-100 mb-6">
          <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-[#0a1628] mb-2">Something went wrong</h1>
        <p className="text-[#6b7280] text-sm mb-6 leading-relaxed">
          An unexpected error occurred. This has been logged. You can try again or contact our support team if the problem persists.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 h-10 px-6 bg-[#0057b8] hover:bg-[#1a73e8] text-white font-semibold text-sm rounded-xl transition-colors"
          >
            Try Again
          </button>
          <Link href="/" className="inline-flex items-center gap-2 h-10 px-6 border border-[#d1d5db] text-[#374151] font-semibold text-sm rounded-xl hover:border-[#0057b8] hover:text-[#0057b8] transition-colors">
            Go Home
          </Link>
          <Link href="/contact" className="inline-flex items-center gap-2 h-10 px-6 border border-[#d1d5db] text-[#374151] font-semibold text-sm rounded-xl hover:border-[#374151] transition-colors">
            Contact Support
          </Link>
        </div>
      </div>
    </div>
  );
}
