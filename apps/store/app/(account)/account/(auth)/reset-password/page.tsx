"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AuthCard } from "@/components/auth/AuthCard";
import PasswordInput from "@/components/auth/PasswordInput";

type Status = "idle" | "loading" | "success" | "error";

export default function ResetPasswordPage() {
  const params   = useSearchParams();
  const token    = params.get("token") ?? "";
  const [password,  setPassword]  = useState("");
  const [confirm,   setConfirm]   = useState("");
  const [status,    setStatus]    = useState<Status>("idle");
  const [message,   setMessage]   = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setStatus("error");
      setMessage("Passwords do not match.");
      return;
    }

    setStatus("loading");
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();

      if (res.ok) {
        setStatus("success");
        setMessage(data.message);
      } else {
        setStatus("error");
        setMessage(data.error ?? "Failed to reset password. Please try again.");
      }
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  }

  if (!token) {
    return (
      <AuthCard title="Invalid Link" subtitle="This reset link is missing or malformed.">
        <div className="text-center py-4">
          <Link href="/account/forgot-password" className="text-sm font-semibold text-navy-500 hover:text-navy-400 transition-colors">
            Request a new reset link →
          </Link>
        </div>
      </AuthCard>
    );
  }

  if (status === "success") {
    return (
      <AuthCard title="Password updated" subtitle="You can now sign in with your new password">
        <div className="text-center py-4">
          <div className="w-14 h-14 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="text-se-green" width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-sm text-(--text-3) mb-6">{message}</p>
          <Link
            href="/account"
            className="inline-flex items-center justify-center h-11 px-8 bg-navy-500 hover:bg-navy-400 text-white font-bold text-sm rounded-xl transition-colors"
          >
            Sign In
          </Link>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Set new password" subtitle="Choose a strong password for your account">
      <form onSubmit={handleSubmit} className="space-y-4">
        {status === "error" && (
          <div className="px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-700 dark:text-red-400">
            {message}
          </div>
        )}

        <PasswordInput
          id="new-password" name="password" label="New password"
          value={password} onChange={setPassword}
          required autoComplete="new-password" showStrength
          placeholder="Min. 8 characters"
          disabled={status === "loading"}
        />

        <PasswordInput
          id="confirm-password" name="confirmPassword" label="Confirm password"
          value={confirm} onChange={setConfirm}
          required autoComplete="new-password"
          placeholder="Repeat your password"
          disabled={status === "loading"}
        />

        <button
          type="submit" disabled={status === "loading" || !password || !confirm}
          className="w-full h-11 bg-navy-500 hover:bg-navy-400 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-sm rounded-xl transition-colors"
        >
          {status === "loading" ? "Saving…" : "Update Password"}
        </button>
      </form>
    </AuthCard>
  );
}
