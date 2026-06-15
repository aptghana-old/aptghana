"use client";

import { useState } from "react";

export default function PayButton({ token, amountLabel }: { token: string; amountLabel: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startPayment() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/pay/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = (await res.json()) as { authorizationUrl?: string; error?: string };
      if (!res.ok || !data.authorizationUrl) {
        setError(data.error ?? "Could not start payment. Please try again.");
        setLoading(false);
        return;
      }
      window.location.assign(data.authorizationUrl);
    } catch {
      setError("Network error — please check your connection and try again.");
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={startPayment}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 h-12 rounded-xl text-sm font-bold text-white bg-se-green hover:bg-se-green-hover disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? (
          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
          </svg>
        )}
        {loading ? "Connecting to secure checkout…" : `Pay ${amountLabel}`}
      </button>
      <p className="text-center text-[11px] text-(--text-4) mt-2.5">
        Card · Bank Transfer · Mobile Money — secured by Paystack
      </p>
      {error && (
        <p className="text-center text-[12px] mt-2 text-red-600 dark:text-red-400" role="alert">{error}</p>
      )}
    </div>
  );
}
