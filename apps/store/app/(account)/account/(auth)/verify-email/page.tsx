"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AuthCard } from "@/components/auth/AuthCard";

export default function VerifyEmailPage() {
  const params  = useSearchParams();
  const success = params.get("success") === "true";
  const error   = params.get("error");
  const [resendEmail, setResendEmail] = useState("");
  const [resent, setResent] = useState(false);

  const errorMessages: Record<string, string> = {
    missing: "Verification link is missing. Please check your email.",
    invalid: "This verification link is invalid or has already been used.",
    server:  "Something went wrong. Please try again.",
  };

  async function handleResend() {
    if (!resendEmail) return;
    await fetch("/api/auth/resend-verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: resendEmail }),
    });
    setResent(true);
  }

  return (
    <AuthCard title="Email Verification" subtitle="Activate your APT Ghana account">
      {success && (
        <div className="text-center py-4">
          <div className="w-14 h-14 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="text-se-green" width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-(--text-1) mb-2">Account verified!</h2>
          <p className="text-sm text-(--text-3) mb-6">
            Your email has been verified. You can now sign in to your account.
          </p>
          <Link
            href="/account"
            className="inline-flex items-center justify-center h-11 px-8 bg-navy-500 hover:bg-navy-400 text-white font-bold text-sm rounded-xl transition-colors"
          >
            Sign In
          </Link>
        </div>
      )}

      {error && (
        <div className="space-y-5">
          <div className="text-center py-2">
            <div className="w-14 h-14 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="text-red-500" width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            </div>
            <p className="text-sm text-(--text-2)">{errorMessages[error] ?? "Verification failed."}</p>
          </div>

          {/* Resend form */}
          {!resent ? (
            <div className="pt-2 border-t border-(--border)">
              <p className="text-sm text-(--text-3) mb-3">Request a new verification link:</p>
              <div className="flex gap-2">
                <input
                  type="email" placeholder="your@email.com"
                  value={resendEmail} onChange={(e) => setResendEmail(e.target.value)}
                  className="flex-1 h-10 px-3 rounded-xl border border-(--border) bg-(--bg-surface) text-(--text-1) text-sm focus:outline-none focus:border-navy-500 focus:ring-2 focus:ring-navy-500/20 transition-all"
                />
                <button
                  onClick={handleResend} disabled={!resendEmail}
                  className="h-10 px-4 bg-navy-500 hover:bg-navy-400 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-colors"
                >
                  Resend
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-se-green text-center font-semibold">
              ✓ A new verification email has been sent.
            </p>
          )}

          <div className="text-center">
            <Link href="/account" className="text-sm text-navy-500 hover:text-navy-400 transition-colors font-semibold">
              ← Back to sign in
            </Link>
          </div>
        </div>
      )}

      {!success && !error && (
        <div className="text-center py-4">
          <p className="text-sm text-(--text-3)">
            Check your inbox for a verification link. If you don&apos;t see it, check your spam folder.
          </p>
          <Link href="/account" className="mt-4 inline-block text-sm font-semibold text-navy-500 hover:text-navy-400 transition-colors">
            ← Back to sign in
          </Link>
        </div>
      )}
    </AuthCard>
  );
}
