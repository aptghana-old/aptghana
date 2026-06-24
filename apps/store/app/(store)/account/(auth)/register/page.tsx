"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { AuthCard } from "@/components/auth/AuthCard";
import PasswordInput from "@/components/auth/PasswordInput";

type Status = "idle" | "loading" | "success" | "error";

export default function RegisterPage() {
  const [name,         setName]         = useState("");
  const [email,        setEmail]        = useState("");
  const [password,     setPassword]     = useState("");
  const [accountType,  setAccountType]  = useState<"personal" | "business">("business");
  const [company,      setCompany]      = useState("");
  const [jobTitle,     setJobTitle]     = useState("");
  const [businessType, setBusinessType] = useState("");
  const [status,       setStatus]       = useState<Status>("idle");
  const [message,      setMessage]      = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("loading");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name, email, password, accountType,
          company: accountType === "business" ? company : undefined,
          jobTitle: accountType === "business" ? jobTitle : undefined,
          businessType: accountType === "business" ? businessType : undefined,
        }),
      });
      const data = await res.json();

      if (res.ok) {
        setStatus("success");
        setMessage(data.message);
      } else {
        setStatus("error");
        setMessage(data.error ?? "Registration failed. Please try again.");
      }
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  }

  if (status === "success") {
    return (
      <AuthCard title="Check your email" subtitle="Verification link sent">
        <div className="text-center py-4">
          <div className="w-14 h-14 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="text-se-green" width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
          </div>
          <p className="text-sm text-(--text-2) leading-relaxed mb-5">{message}</p>
          <p className="text-xs text-(--text-3) mb-5">
            Didn&apos;t receive it?{" "}
            <button
              onClick={async () => {
                await fetch("/api/auth/resend-verification", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ email }),
                });
              }}
              className="text-navy-500 font-semibold hover:text-navy-400 transition-colors"
            >
              Resend email
            </button>
          </p>
          <Link href="/account" className="text-sm font-semibold text-navy-500 hover:text-navy-400 transition-colors">
            ← Back to sign in
          </Link>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Create account"
      subtitle="Join APT Ghana for exclusive pricing and order management"
      maxWidth="md"
      footer={
        <>
          Already have an account?{" "}
          <Link href="/account" className="text-navy-500 font-semibold hover:text-navy-400 transition-colors">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {status === "error" && (
          <div className="px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-700 dark:text-red-400">
            {message}
          </div>
        )}

        {/* Account type selector */}
        <div className="grid grid-cols-2 gap-2">
          {(["business", "personal"] as const).map((t) => (
            <button
              key={t} type="button"
              onClick={() => setAccountType(t)}
              className={`h-10 rounded-xl text-sm font-semibold border transition-all ${
                accountType === t
                  ? "border-navy-500 bg-navy-50 text-navy-500 dark:bg-navy-900/30 dark:text-navy-300"
                  : "border-(--border) text-(--text-3) hover:border-navy-300"
              }`}
            >
              {t === "business" ? "🏢 Business" : "👤 Personal"}
            </button>
          ))}
        </div>

        {/* Basic fields */}
        <div className={accountType === "business" ? "grid grid-cols-2 gap-3" : ""}>
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-(--text-2) mb-1.5">Full name</label>
            <input
              id="name" type="text" required autoComplete="name" placeholder="John Mensah"
              value={name} onChange={(e) => setName(e.target.value)}
              className="w-full h-11 px-4 rounded-xl border border-(--border) bg-(--bg-surface) text-(--text-1) text-sm placeholder:text-(--text-4) focus:outline-none focus:border-navy-500 focus:ring-2 focus:ring-navy-500/20 transition-all"
            />
          </div>
          {accountType === "business" && (
            <div>
              <label htmlFor="company" className="block text-sm font-medium text-(--text-2) mb-1.5">Company name</label>
              <input
                id="company" type="text" autoComplete="organization" placeholder="Acme Ltd"
                value={company} onChange={(e) => setCompany(e.target.value)}
                className="w-full h-11 px-4 rounded-xl border border-(--border) bg-(--bg-surface) text-(--text-1) text-sm placeholder:text-(--text-4) focus:outline-none focus:border-navy-500 focus:ring-2 focus:ring-navy-500/20 transition-all"
              />
            </div>
          )}
        </div>

        {accountType === "business" && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="jobTitle" className="block text-sm font-medium text-(--text-2) mb-1.5">Job title</label>
              <input
                id="jobTitle" type="text" placeholder="Project Engineer"
                value={jobTitle} onChange={(e) => setJobTitle(e.target.value)}
                className="w-full h-11 px-4 rounded-xl border border-(--border) bg-(--bg-surface) text-(--text-1) text-sm placeholder:text-(--text-4) focus:outline-none focus:border-navy-500 focus:ring-2 focus:ring-navy-500/20 transition-all"
              />
            </div>
            <div>
              <label htmlFor="bizType" className="block text-sm font-medium text-(--text-2) mb-1.5">Business type</label>
              <select
                id="bizType" value={businessType} onChange={(e) => setBusinessType(e.target.value)}
                className="w-full h-11 px-4 rounded-xl border border-(--border) bg-(--bg-surface) text-(--text-1) text-sm focus:outline-none focus:border-navy-500 focus:ring-2 focus:ring-navy-500/20 transition-all"
              >
                <option value="">Select…</option>
                <option value="contractor">Contractor</option>
                <option value="engineer">Engineer / Consultant</option>
                <option value="procurement">Procurement / Buyer</option>
                <option value="reseller">Reseller / Distributor</option>
                <option value="end-user">End User</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        )}

        <div>
          <label htmlFor="reg-email" className="block text-sm font-medium text-(--text-2) mb-1.5">Work email</label>
          <input
            id="reg-email" type="email" required autoComplete="email" placeholder="you@company.com"
            value={email} onChange={(e) => setEmail(e.target.value)}
            className="w-full h-11 px-4 rounded-xl border border-(--border) bg-(--bg-surface) text-(--text-1) text-sm placeholder:text-(--text-4) focus:outline-none focus:border-navy-500 focus:ring-2 focus:ring-navy-500/20 transition-all"
          />
        </div>

        <PasswordInput
          id="reg-password" name="password" label="Password"
          value={password} onChange={setPassword}
          required autoComplete="new-password" showStrength
          placeholder="Min. 8 characters"
        />

        <p className="text-xs text-(--text-4) leading-relaxed">
          By creating an account you agree to our{" "}
          <Link href="/terms" className="text-navy-500 hover:text-navy-400">Terms of Service</Link>{" "}
          and{" "}
          <Link href="/privacy" className="text-navy-500 hover:text-navy-400">Privacy Policy</Link>.
        </p>

        <button
          type="submit" disabled={status === "loading"}
          className="w-full h-11 bg-navy-500 hover:bg-navy-400 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-sm rounded-xl transition-colors"
        >
          {status === "loading" ? "Creating account…" : "Create Account"}
        </button>
      </form>
    </AuthCard>
  );
}
