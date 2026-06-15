"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { AuthCard } from "@/components/auth/AuthCard";

export default function ForgotPasswordPage() {
  const [email,   setEmail]   = useState("");
  const [loading, setLoading] = useState(false);
  const [sent,    setSent]    = useState(false);
  const [error,   setError]   = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      // Always show success to prevent email enumeration
      setSent(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <AuthCard title="Check your email" subtitle="Password reset link sent">
        <div className="text-center py-4">
          <div className="w-14 h-14 bg-navy-50 dark:bg-navy-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="text-navy-500" width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
          </div>
          <p className="text-sm text-(--text-2) leading-relaxed mb-1">
            If <span className="font-semibold">{email}</span> matches an account, a reset link has been sent.
          </p>
          <p className="text-xs text-(--text-4) mb-6">The link expires in 10 minutes.</p>
          <Link href="/account" className="text-sm font-semibold text-navy-500 hover:text-navy-400 transition-colors">
            ← Back to sign in
          </Link>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Forgot password"
      subtitle="Enter your email and we'll send a reset link"
      footer={
        <Link href="/account" className="text-navy-500 font-semibold hover:text-navy-400 transition-colors">
          ← Back to sign in
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-(--text-2) mb-1.5">Email address</label>
          <input
            id="email" type="email" required autoComplete="email"
            placeholder="you@company.com"
            value={email} onChange={(e) => setEmail(e.target.value)}
            className="w-full h-11 px-4 rounded-xl border border-(--border) bg-(--bg-surface)
              text-(--text-1) text-sm placeholder:text-(--text-4)
              focus:outline-none focus:border-navy-500 focus:ring-2 focus:ring-navy-500/20 transition-all"
          />
        </div>

        <button
          type="submit" disabled={loading}
          className="w-full h-11 bg-navy-500 hover:bg-navy-400 disabled:opacity-60 disabled:cursor-not-allowed
            text-white font-bold text-sm rounded-xl transition-colors"
        >
          {loading ? "Sending…" : "Send Reset Link"}
        </button>
      </form>
    </AuthCard>
  );
}
