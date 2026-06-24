"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { AuthCard } from "@/components/auth/AuthCard";
import PasswordInput from "@/components/auth/PasswordInput";
import OTPInput from "@/components/auth/OTPInput";

type Step = "credentials" | "mfa";

export default function SignInPage() {
  const params     = useSearchParams();
  const router     = useRouter();
  const callbackUrl = params.get("from") ?? "/account/dashboard";

  const [step,        setStep]        = useState<Step>("credentials");
  const [email,       setEmail]       = useState("");
  const [password,    setPassword]    = useState("");
  const [otp,         setOtp]         = useState("");
  const [rememberMe,  setRememberMe]  = useState(true);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState("");

  /* ─── Step 1: check credentials + MFA requirement ─── */
  async function handleCredentials(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/pre-signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.error === "EMAIL_NOT_VERIFIED") {
          setError("Please verify your email before signing in.");
        } else if (data.error === "ACCOUNT_SUSPENDED") {
          setError("Your account has been suspended. Contact support.");
        } else {
          setError(data.error ?? "Invalid email or password.");
        }
        return;
      }

      if (data.requiresMFA) {
        setStep("mfa");
      } else {
        await finalSignIn();
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  /* ─── Final sign-in (with or without OTP) ─── */
  async function finalSignIn(mfaOtp?: string) {
    setLoading(true);
    setError("");
    try {
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
        otp: mfaOtp ?? otp,
        rememberMe: String(rememberMe),
      });

      if (res?.error) {
        const msg: Record<string, string> = {
          INVALID_OTP:        "Incorrect authentication code. Try again.",
          CredentialsSignin:  "Sign-in failed. Please try again.",
        };
        setError(msg[res.error] ?? "Sign-in failed. Please try again.");
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  /* ─── Step 2: submit MFA OTP ─── */
  async function handleMFA(e: FormEvent) {
    e.preventDefault();
    await finalSignIn(otp);
  }

  const errorBanner = error ? (
    <div className="mb-4 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800
      rounded-xl text-sm text-red-700 dark:text-red-400 flex items-start gap-2">
      <span className="shrink-0 mt-0.5">⚠</span>
      <span>{error}</span>
    </div>
  ) : null;

  return (
    <AuthCard
      title={step === "mfa" ? "Two-Factor Authentication" : "Sign in"}
      subtitle={
        step === "mfa"
          ? `Enter the 6-digit code from your authenticator app`
          : "Use your business email to access your account"
      }
      footer={
        step === "credentials" ? (
          <>
            Don&apos;t have an account?{" "}
            <Link href="/account/register" className="text-navy-500 font-semibold hover:text-navy-400 transition-colors">
              Create one
            </Link>
          </>
        ) : (
          <button onClick={() => { setStep("credentials"); setOtp(""); }} className="text-navy-500 font-semibold hover:text-navy-400 transition-colors">
            ← Back to sign in
          </button>
        )
      }
    >
      {/* Credentials step */}
      {step === "credentials" && (
        <form onSubmit={handleCredentials} className="space-y-4">
          {errorBanner}

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

          <PasswordInput
            id="password" name="password" label="Password"
            value={password} onChange={setPassword}
            required autoComplete="current-password"
          />

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-(--border) accent-navy-500"
              />
              <span className="text-sm text-(--text-2)">Remember me for 30 days</span>
            </label>
            <Link href="/account/forgot-password" className="text-sm text-navy-500 hover:text-navy-400 transition-colors">
              Forgot password?
            </Link>
          </div>

          <button
            type="submit" disabled={loading}
            className="w-full h-11 bg-navy-500 hover:bg-navy-400 disabled:opacity-60 disabled:cursor-not-allowed
              text-white font-bold text-sm rounded-xl transition-colors mt-1"
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>

          {/* Divider */}
          <div className="relative flex items-center gap-3 py-1">
            <div className="flex-1 h-px bg-(--border)" />
            <span className="text-xs text-(--text-4)">or</span>
            <div className="flex-1 h-px bg-(--border)" />
          </div>

          <Link
            href="/rfq"
            className="flex items-center justify-center gap-2 w-full h-11 rounded-xl border border-(--border)
              text-sm font-semibold text-(--text-2) hover:border-se-green hover:text-se-green transition-colors"
          >
            Continue as Guest (RFQ only)
          </Link>
        </form>
      )}

      {/* MFA step */}
      {step === "mfa" && (
        <form onSubmit={handleMFA} className="space-y-6">
          {errorBanner}

          <OTPInput value={otp} onChange={setOtp} autoFocus disabled={loading} />

          <button
            type="submit" disabled={loading || otp.length < 6}
            className="w-full h-11 bg-navy-500 hover:bg-navy-400 disabled:opacity-60 disabled:cursor-not-allowed
              text-white font-bold text-sm rounded-xl transition-colors"
          >
            {loading ? "Verifying…" : "Verify & Sign In"}
          </button>
        </form>
      )}
    </AuthCard>
  );
}
