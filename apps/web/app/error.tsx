"use client";

import { useEffect } from "react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log error to console in development; production should use an error reporting service
    console.error("[APT Ghana] Application error:", error);
  }, [ error ]);

  return (
    <div className="min-h-screen bg-[#0A0F1E] flex items-center justify-center px-6">
      <div className="text-center max-w-lg mx-auto">
        {/* Icon */}
        <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 mx-auto mb-6">
          <svg
            className="w-8 h-8 text-red-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
            />
          </svg>
        </div>

        {/* Eyebrow */}
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-6 h-0.5 rounded-full bg-[#84CC16]" />
          <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#84CC16]">
            Something Went Wrong
          </span>
          <div className="w-6 h-0.5 rounded-full bg-[#84CC16]" />
        </div>

        {/* Heading */}
        <h1
          className="text-3xl font-extrabold tracking-tight text-white mb-4"
          style={{ fontFamily: "var(--font-sora, 'Sora', sans-serif)" }}
        >
          An unexpected error occurred
        </h1>

        {/* Description */}
        <p className="text-[#94A3B8] text-base leading-relaxed mb-8">
          We&apos;re sorry for the inconvenience. Our team has been notified. Please try
          again, or contact us if the problem persists.
        </p>

        {/* Error digest */}
        {error.digest && (
          <p className="text-xs text-white/20 mb-6 font-mono">
            Error ID: {error.digest}
          </p>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 h-12 px-7 bg-[#84CC16] text-[#0A0F1E] font-bold text-sm rounded-xl hover:bg-[#78B800] transition-colors"
          >
            Try Again →
          </button>
          <a
            href="/"
            className="inline-flex items-center gap-2 h-12 px-7 bg-white/10 text-white font-bold text-sm rounded-xl hover:bg-white/20 transition-colors border border-white/10"
          >
            ← Go Home
          </a>
        </div>

        {/* Support link */}
        <p className="mt-8 text-sm text-[#64748B]">
          Need help?{" "}
          <a href="/contact" className="text-[#84CC16] hover:underline">
            Contact APT Ghana support
          </a>
        </p>
      </div>
    </div>
  );
}
