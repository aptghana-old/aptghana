"use client";

import { useActionState } from "react";
import { AlertCircle, CheckCircle2, Loader2, Mail } from "lucide-react";
import Link from "next/link";
import { forgotPasswordAction, type ForgotPasswordState } from "./actions";

const INITIAL: ForgotPasswordState = null;

export default function ForgotPasswordPage() {
  const [state, formAction, pending] = useActionState(forgotPasswordAction, INITIAL);

  if (state && "success" in state) {
    return (
      <div className="w-full max-w-sm animate-fade-in">
        <div className="card p-8 text-center">
          <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: "var(--color-success-50)" }}>
            <CheckCircle2 size={22} style={{ color: "var(--color-success-600)" }} />
          </div>
          <h1 className="text-[20px] font-bold mb-2" style={{ color: "var(--apt-text-primary)" }}>
            Check your email
          </h1>
          <p className="text-[13px] leading-relaxed mb-6" style={{ color: "var(--apt-text-muted)" }}>
            If an account with that email exists, we've sent password reset instructions.
            The link expires in 1 hour.
          </p>
          <Link href="/login"
            className="inline-flex items-center justify-center h-9 px-4 rounded-md text-[13px] font-medium transition-colors"
            style={{ background: "var(--apt-bg-raised)", border: "1px solid var(--apt-border)", color: "var(--apt-text-primary)" }}>
            Back to sign in
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
            <Mail size={18} style={{ color: "#0057b8" }} />
          </div>
          <h1 className="text-[22px] font-bold leading-tight mb-1.5" style={{ color: "var(--apt-text-primary)" }}>
            Forgot your password?
          </h1>
          <p className="text-[13px]" style={{ color: "var(--apt-text-muted)" }}>
            Enter the email address associated with your admin account and we'll send you a reset link.
          </p>
        </div>

        {state && "error" in state && state.error === "TOO_MANY_ATTEMPTS" && (
          <div className="flex gap-2.5 items-center rounded-md px-3.5 py-3 mb-5 text-[13px]"
            style={{ background: "var(--color-error-50)", border: "1px solid var(--color-error-100)", color: "var(--color-error-700)" }}>
            <AlertCircle size={14} className="shrink-0" />
            Too many requests. Please wait a few minutes before trying again.
          </div>
        )}

        <form action={formAction} className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-medium" style={{ color: "var(--apt-text-primary)" }}>
              Email address <span style={{ color: "var(--color-error-600)" }}>*</span>
            </label>
            <input
              name="email" type="email" autoComplete="email" autoFocus required
              placeholder="you@aptghana.com"
              className="w-full h-9 rounded-md border text-[13px] px-3 transition-colors placeholder:text-(--apt-text-muted) focus:outline-none focus:ring-2 focus:ring-(--apt-border-focus) disabled:opacity-50"
              style={{ background: "var(--apt-bg)", borderColor: "var(--apt-border)", color: "var(--apt-text-primary)" }}
            />
          </div>

          <button type="submit" disabled={pending}
            className="w-full h-10 rounded-md text-[13px] font-semibold text-white transition-colors flex items-center justify-center gap-2 mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ background: "#0057b8" }}>
            {pending ? <><Loader2 size={14} className="animate-spin" />Sending reset link…</> : "Send reset link"}
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
