"use client";

import { useActionState, useState, useEffect, useRef } from "react";
import { Eye, EyeOff, Loader2, AlertCircle, Clock, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { loginAction, type LoginState } from "./actions";

const INITIAL: LoginState = null;

const ERROR_MESSAGES: Record<string, string> = {
  INVALID_CREDENTIALS: "Invalid email address or password.",
  ACCOUNT_SUSPENDED:   "This account has been suspended. Contact your administrator.",
  TOO_MANY_ATTEMPTS:   "Too many login attempts. Please wait a few minutes and try again.",
  INVALID_OTP:         "Incorrect verification code. Please check your authenticator app and try again.",
  UNKNOWN:             "Something went wrong. Please try again.",
};

interface Props {
  from: string;
  reason: string | null;
  reset: string | null;
}

export default function LoginForm({ from, reason, reset }: Props) {
  const [state, formAction, pending] = useActionState(loginAction, INITIAL);
  const [step, setStep] = useState<"credentials" | "mfa">("credentials");
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const otpRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state && "needsMfa" in state && state.needsMfa) {
      setStep("mfa");
      setTimeout(() => otpRef.current?.focus(), 50);
    }
  }, [state]);

  const errorMessage =
    state && "error" in state ? ERROR_MESSAGES[state.error] ?? ERROR_MESSAGES.UNKNOWN : null;

  return (
    <div className="w-full max-w-sm animate-fade-in">
      {reason === "idle" && (
        <Notice icon={<Clock size={14} />} color="warning">
          Your session expired due to inactivity. Please sign in again.
        </Notice>
      )}
      {reset === "success" && (
        <Notice icon={<ShieldCheck size={14} />} color="success">
          Password updated successfully. You can now sign in.
        </Notice>
      )}

      <div className="card p-8">
        {step === "credentials" ? (
          <>
            <div className="mb-7">
              <h1 className="text-[22px] font-bold leading-tight mb-1.5" style={{ color: "var(--apt-text-primary)" }}>
                Sign in
              </h1>
              <p className="text-[13px]" style={{ color: "var(--apt-text-muted)" }}>
                Access the APT Ghana admin panel
              </p>
            </div>

            {errorMessage && (
              <ErrorBanner>{errorMessage}</ErrorBanner>
            )}

            <form action={formAction} className="space-y-4">
              <input type="hidden" name="from" value={from} />

              <Field label="Email address" required>
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@aptghana.com"
                  className={INPUT_CLS}
                  style={INPUT_STYLE}
                />
              </Field>

              <Field label="Password" required>
                <div className="relative">
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className={INPUT_CLS + " pr-10"}
                    style={INPUT_STYLE}
                  />
                  <TogglePassword show={showPassword} onToggle={() => setShowPassword((v) => !v)} />
                </div>
              </Field>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input name="rememberMe" type="checkbox" className="w-3.5 h-3.5 rounded accent-[#0057b8]" />
                  <span className="text-[12px]" style={{ color: "var(--apt-text-secondary)" }}>
                    Remember me for 30 days
                  </span>
                </label>
                <Link
                  href="/forgot-password"
                  className="text-[12px] font-medium transition-colors hover:underline"
                  style={{ color: "var(--apt-text-brand)" }}
                >
                  Forgot password?
                </Link>
              </div>

              <SubmitButton pending={pending} label="Sign in" loadingLabel="Signing in…" />
            </form>
          </>
        ) : (
          <>
            <div className="mb-7">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center mb-4"
                style={{ background: "rgba(0,87,184,0.1)" }}
              >
                <ShieldCheck size={18} style={{ color: "#0057b8" }} />
              </div>
              <h1 className="text-[22px] font-bold leading-tight mb-1.5" style={{ color: "var(--apt-text-primary)" }}>
                Two-factor authentication
              </h1>
              <p className="text-[13px]" style={{ color: "var(--apt-text-muted)" }}>
                Enter the 6-digit code from your authenticator app.
              </p>
            </div>

            {errorMessage && <ErrorBanner>{errorMessage}</ErrorBanner>}

            <form action={formAction} className="space-y-5">
              <input type="hidden" name="email"    value={email} />
              <input type="hidden" name="password" value={password} />
              <input type="hidden" name="from"     value={from} />

              <Field label="Verification code" required>
                <input
                  ref={otpRef}
                  name="otp"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  pattern="\d{6}"
                  required
                  placeholder="000000"
                  className="w-full h-12 rounded-md border text-[22px] font-mono tracking-[0.5em] text-center transition-colors placeholder:text-[var(--apt-text-muted)] placeholder:tracking-normal placeholder:text-[14px] focus:outline-none focus:ring-2 focus:ring-[var(--apt-border-focus)]"
                  style={{ background: "var(--apt-bg)", borderColor: "var(--apt-border)", color: "var(--apt-text-primary)" }}
                />
                <p className="text-[11px] mt-1" style={{ color: "var(--apt-text-muted)" }}>
                  Open your authenticator app to view the code for APT Ghana.
                </p>
              </Field>

              <SubmitButton pending={pending} label="Verify & sign in" loadingLabel="Verifying…" />

              <button
                type="button"
                onClick={() => setStep("credentials")}
                className="w-full text-[12px] font-medium transition-colors hover:underline text-center"
                style={{ color: "var(--apt-text-muted)" }}
              >
                ← Use a different account
              </button>
            </form>
          </>
        )}
      </div>

      <p className="text-center text-[11px] mt-6" style={{ color: "var(--apt-text-muted)" }}>
        Access is restricted to authorised personnel only.
        <br />
        Unauthorised access attempts are logged.
      </p>
    </div>
  );
}

// ─── Shared sub-components ────────────────────────────────────────────────────

const INPUT_CLS =
  "w-full h-9 rounded-md border text-[13px] px-3 transition-colors placeholder:text-[var(--apt-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--apt-border-focus)] disabled:opacity-50";

const INPUT_STYLE = {
  background: "var(--apt-bg)",
  borderColor: "var(--apt-border)",
  color: "var(--apt-text-primary)",
};

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[12px] font-medium" style={{ color: "var(--apt-text-primary)" }}>
        {label}
        {required && <span className="ml-0.5" style={{ color: "var(--color-error-600)" }}>*</span>}
      </label>
      {children}
    </div>
  );
}

function ErrorBanner({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex gap-2.5 items-start rounded-md px-3.5 py-3 mb-5 text-[13px]"
      style={{ background: "var(--color-error-50)", border: "1px solid var(--color-error-100)", color: "var(--color-error-700)" }}
    >
      <AlertCircle size={14} className="mt-0.5 shrink-0" />
      {children}
    </div>
  );
}

function TogglePassword({ show, onToggle }: { show: boolean; onToggle(): void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      tabIndex={-1}
      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded transition-colors hover:bg-[var(--apt-bg-raised)]"
      style={{ color: "var(--apt-text-muted)" }}
      aria-label={show ? "Hide password" : "Show password"}
    >
      {show ? <EyeOff size={14} /> : <Eye size={14} />}
    </button>
  );
}

function SubmitButton({ pending, label, loadingLabel }: { pending: boolean; label: string; loadingLabel: string }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full h-10 rounded-md text-[13px] font-semibold text-white transition-colors flex items-center justify-center gap-2 mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
      style={{ background: "#0057b8" }}
    >
      {pending ? <><Loader2 size={14} className="animate-spin" />{loadingLabel}</> : label}
    </button>
  );
}

function Notice({ icon, color, children }: { icon: React.ReactNode; color: "warning" | "success"; children: React.ReactNode }) {
  const styles = {
    warning: { background: "var(--color-warning-50)", border: "1px solid var(--color-warning-100)", color: "var(--color-warning-700)" },
    success: { background: "var(--color-success-50)", border: "1px solid var(--color-success-100)", color: "var(--color-success-700)" },
  };
  return (
    <div className="flex gap-2.5 items-center rounded-md px-3.5 py-3 mb-4 text-[13px]" style={styles[color]}>
      {icon}
      {children}
    </div>
  );
}
