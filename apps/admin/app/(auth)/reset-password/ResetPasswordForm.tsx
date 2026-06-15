"use client";

import { useActionState, useState } from "react";
import { AlertCircle, Eye, EyeOff, KeyRound, Loader2 } from "lucide-react";
import Link from "next/link";
import { resetPasswordAction, type ResetPasswordState } from "./actions";

const INITIAL: ResetPasswordState = null;

const ERROR_MESSAGES: Record<string, string> = {
  INVALID_TOKEN:      "This reset link is invalid. Please request a new one.",
  EXPIRED_TOKEN:      "This reset link has expired. Please request a new one.",
  WEAK_PASSWORD:      "Password must be at least 8 characters and include uppercase, lowercase, and a number.",
  PASSWORDS_MISMATCH: "Passwords do not match.",
  UNKNOWN:            "Something went wrong. Please try again.",
};

function PasswordStrengthBar({ password }: { password: string }) {
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[a-z]/.test(password),
    /\d/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  const score = checks.filter(Boolean).length;
  const colors = ["", "#dc2626", "#f59e0b", "#f59e0b", "#22c55e", "#16a34a"];
  const labels = ["", "Very weak", "Weak", "Fair", "Strong", "Very strong"];
  if (!password) return null;
  return (
    <div className="space-y-1.5">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-1 flex-1 rounded-full transition-colors"
            style={{ background: i <= score ? colors[score] : "var(--apt-border)" }} />
        ))}
      </div>
      <p className="text-[11px]" style={{ color: score < 3 ? "#dc2626" : score < 4 ? "#d97706" : "#16a34a" }}>
        {labels[score]}
      </p>
    </div>
  );
}

export default function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(resetPasswordAction, INITIAL);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm]   = useState(false);
  const [password, setPassword]         = useState("");

  const error = state && "error" in state ? state.error : null;
  const errorMessage = error ? ERROR_MESSAGES[error] ?? ERROR_MESSAGES.UNKNOWN : null;

  if (!token) {
    return (
      <div className="w-full max-w-sm animate-fade-in">
        <div className="card p-8 text-center">
          <AlertCircle size={32} className="mx-auto mb-4" style={{ color: "#dc2626" }} />
          <h1 className="text-[18px] font-bold mb-2" style={{ color: "var(--apt-text-primary)" }}>
            Invalid reset link
          </h1>
          <p className="text-[13px] mb-5" style={{ color: "var(--apt-text-muted)" }}>
            This link is missing a reset token. Please request a new password reset.
          </p>
          <Link href="/forgot-password" className="text-[13px] font-medium hover:underline"
            style={{ color: "var(--apt-text-brand)" }}>
            Request a new link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm animate-fade-in">
      <div className="card p-8">
        <div className="mb-7">
          <div className="w-10 h-10 rounded-full flex items-center justify-center mb-4"
            style={{ background: "rgba(0,87,184,0.1)" }}>
            <KeyRound size={18} style={{ color: "#0057b8" }} />
          </div>
          <h1 className="text-[22px] font-bold leading-tight mb-1.5" style={{ color: "var(--apt-text-primary)" }}>
            Choose a new password
          </h1>
          <p className="text-[13px]" style={{ color: "var(--apt-text-muted)" }}>
            Must be at least 8 characters with uppercase, lowercase, and a number.
          </p>
        </div>

        {errorMessage && (
          <div className="flex gap-2.5 items-start rounded-md px-3.5 py-3 mb-5 text-[13px]"
            style={{ background: "var(--color-error-50)", border: "1px solid var(--color-error-100)", color: "var(--color-error-700)" }}>
            <AlertCircle size={14} className="mt-0.5 shrink-0" />
            <div>
              {errorMessage}
              {(error === "INVALID_TOKEN" || error === "EXPIRED_TOKEN") && (
                <span> <Link href="/forgot-password" className="underline font-medium">Request a new link</Link></span>
              )}
            </div>
          </div>
        )}

        <form action={formAction} className="space-y-4">
          <input type="hidden" name="token" value={token} />

          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-medium" style={{ color: "var(--apt-text-primary)" }}>
              New password <span style={{ color: "var(--color-error-600)" }}>*</span>
            </label>
            <div className="relative">
              <input
                name="password" type={showPassword ? "text" : "password"}
                autoComplete="new-password" autoFocus required minLength={8}
                value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="w-full h-9 rounded-md border text-[13px] pl-3 pr-10 transition-colors placeholder:text-[var(--apt-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--apt-border-focus)] disabled:opacity-50"
                style={{ background: "var(--apt-bg)", borderColor: "var(--apt-border)", color: "var(--apt-text-primary)" }}
              />
              <button type="button" tabIndex={-1} onClick={() => setShowPassword((v) => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-[var(--apt-bg-raised)] transition-colors"
                style={{ color: "var(--apt-text-muted)" }} aria-label={showPassword ? "Hide" : "Show"}>
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            <PasswordStrengthBar password={password} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-medium" style={{ color: "var(--apt-text-primary)" }}>
              Confirm password <span style={{ color: "var(--color-error-600)" }}>*</span>
            </label>
            <div className="relative">
              <input
                name="confirmPassword" type={showConfirm ? "text" : "password"}
                autoComplete="new-password" required placeholder="Repeat your new password"
                className="w-full h-9 rounded-md border text-[13px] pl-3 pr-10 transition-colors placeholder:text-[var(--apt-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--apt-border-focus)] disabled:opacity-50"
                style={{ background: "var(--apt-bg)", borderColor: "var(--apt-border)", color: "var(--apt-text-primary)" }}
              />
              <button type="button" tabIndex={-1} onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-[var(--apt-bg-raised)] transition-colors"
                style={{ color: "var(--apt-text-muted)" }} aria-label={showConfirm ? "Hide" : "Show"}>
                {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={pending}
            className="w-full h-10 rounded-md text-[13px] font-semibold text-white transition-colors flex items-center justify-center gap-2 mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ background: "#0057b8" }}>
            {pending ? <><Loader2 size={14} className="animate-spin" />Updating password…</> : "Set new password"}
          </button>
        </form>

        <div className="mt-5 pt-5" style={{ borderTop: "1px solid var(--apt-border)" }}>
          <Link href="/login" className="text-[12px] font-medium transition-colors hover:underline"
            style={{ color: "var(--apt-text-muted)" }}>
            ← Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
