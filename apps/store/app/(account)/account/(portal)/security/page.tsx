"use client";

import { useEffect, useState, useTransition } from "react";
import { signOut, useSession } from "next-auth/react";
import { ConfirmDialog, PageHeader, SectionCard, FormField, inputBase, PrimaryBtn, GhostBtn, Alert } from "@/components/account/ui";

function PasswordForm() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (next !== confirm) { setResult({ ok: false, msg: "New passwords do not match." }); return; }
    if (next.length < 8)  { setResult({ ok: false, msg: "Password must be at least 8 characters." }); return; }
    setResult(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/auth/change-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ currentPassword: current, newPassword: next }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to change password");
        setResult({ ok: true, msg: "Password updated successfully." });
        setCurrent(""); setNext(""); setConfirm("");
      } catch (err: unknown) {
        setResult({ ok: false, msg: err instanceof Error ? err.message : "Something went wrong." });
      }
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <SectionCard title="Password" description="Use a strong, unique password you don't use anywhere else."
        action={<PrimaryBtn type="submit" loading={isPending} variant="navy">Update Password</PrimaryBtn>}
      >
        {result && <Alert type={result.ok ? "success" : "error"} message={result.msg} />}
        <div className="space-y-5 mt-4">
          <FormField label="Current Password">
            <input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} className={inputBase} required />
          </FormField>
          <div className="grid sm:grid-cols-2 gap-5">
            <FormField label="New Password" hint="Minimum 8 characters.">
              <input type="password" value={next} onChange={(e) => setNext(e.target.value)} className={inputBase} minLength={8} required />
            </FormField>
            <FormField label="Confirm New Password">
              <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={inputBase} minLength={8} required />
            </FormField>
          </div>
        </div>
      </SectionCard>
    </form>
  );
}

function TwoFACard() {
  const { data: session } = useSession();
  const mfaEnabled = (session?.user as { mfaEnabled?: boolean })?.mfaEnabled ?? false;
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const [otpUri, setOtpUri] = useState<string | null>(null);
  const [otpSecret, setOtpSecret] = useState<string | null>(null);
  const [token, setToken] = useState("");
  const [step, setStep] = useState<"idle" | "setup" | "confirm">("idle");

  const startSetup = () => {
    setResult(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/auth/setup-2fa", { method: "GET" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setOtpUri(data.otpUri);
        setOtpSecret(data.secret);
        setStep("setup");
      } catch (err: unknown) {
        setResult({ ok: false, msg: err instanceof Error ? err.message : "Failed to start 2FA setup." });
      }
    });
  };

  const confirmSetup = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        const res = await fetch("/api/auth/setup-2fa", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, secret: otpSecret }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setResult({ ok: true, msg: "Two-factor authentication enabled." });
        setStep("idle");
      } catch (err: unknown) {
        setResult({ ok: false, msg: err instanceof Error ? err.message : "Invalid code." });
      }
    });
  };

  const disable2FA = () => {
    startTransition(async () => {
      try {
        const res = await fetch("/api/auth/setup-2fa", { method: "DELETE" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setResult({ ok: true, msg: "Two-factor authentication disabled." });
      } catch (err: unknown) {
        setResult({ ok: false, msg: err instanceof Error ? err.message : "Failed to disable 2FA." });
      }
    });
  };

  return (
    <SectionCard
      title="Two-Factor Authentication"
      description="Add an extra layer of security using a one-time code from your authenticator app."
      badge={
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold ${mfaEnabled ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400" : "bg-(--bg-raised) text-(--text-4)"}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${mfaEnabled ? "bg-green-500" : "bg-(--text-4)"}`} />
          {mfaEnabled ? "Enabled" : "Disabled"}
        </span>
      }
    >
      {result && <Alert type={result.ok ? "success" : "error"} message={result.msg} />}

      {!mfaEnabled && step === "idle" && (
        <div className="mt-4">
          <p className="text-sm text-(--text-3) mb-4">
            Use Google Authenticator, Authy, or any TOTP-compatible app to generate time-based verification codes.
          </p>
          <PrimaryBtn type="button" onClick={startSetup} loading={isPending} variant="navy">
            Enable 2FA
          </PrimaryBtn>
        </div>
      )}

      {step === "setup" && otpUri && (
        <div className="mt-4 space-y-5">
          <p className="text-sm text-(--text-2)">
            Scan the QR code with your authenticator app, then enter the 6-digit code to confirm.
          </p>
          <div className="p-4 bg-white rounded-xl inline-block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(otpUri)}`}
              alt="2FA QR code"
              width={180}
              height={180}
            />
          </div>
          {otpSecret && (
            <p className="text-xs text-(--text-3)">
              Manual key: <code className="font-mono bg-(--bg-raised) px-2 py-0.5 rounded-lg text-(--text-1)">{otpSecret}</code>
            </p>
          )}
          <form onSubmit={confirmSetup} className="flex items-end gap-3">
            <FormField label="Enter 6-digit code">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className={`${inputBase} max-w-[180px] font-mono tracking-widest`}
                placeholder="000000"
                required
              />
            </FormField>
            <PrimaryBtn type="submit" loading={isPending} variant="green">Confirm</PrimaryBtn>
          </form>
        </div>
      )}

      {mfaEnabled && (
        <div className="mt-4">
          <p className="text-sm text-(--text-3) mb-4">
            Two-factor authentication is active. Disabling it will reduce the security of your account.
          </p>
          <PrimaryBtn type="button" onClick={disable2FA} loading={isPending} variant="danger">
            Disable 2FA
          </PrimaryBtn>
        </div>
      )}
    </SectionCard>
  );
}

/* ─── Sessions & login history ────────────────────────────────────────────── */
interface LoginEvent { at: string; ip: string; userAgent: string }

function describeAgent(ua: string): string {
  if (!ua) return "Unknown device";
  const browser =
    ua.includes("Edg/") ? "Edge"
    : ua.includes("OPR/") ? "Opera"
    : ua.includes("Chrome/") ? "Chrome"
    : ua.includes("Firefox/") ? "Firefox"
    : ua.includes("Safari/") ? "Safari"
    : "Browser";
  const os =
    ua.includes("Windows") ? "Windows"
    : ua.includes("Mac OS X") ? "macOS"
    : ua.includes("Android") ? "Android"
    : ua.includes("iPhone") || ua.includes("iPad") ? "iOS"
    : ua.includes("Linux") ? "Linux"
    : "";
  return os ? `${browser} on ${os}` : browser;
}

function SessionsCard() {
  const [history, setHistory] = useState<LoginEvent[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [revoking, setRevoking] = useState(false);

  useEffect(() => {
    fetch("/api/me/security")
      .then((r) => r.json())
      .then((data: { loginHistory?: LoginEvent[]; error?: string }) => {
        if (data.error) throw new Error(data.error);
        setHistory(data.loginHistory ?? []);
      })
      .catch(() => setError("Could not load sign-in history."));
  }, []);

  async function signOutEverywhere() {
    setRevoking(true);
    try {
      const res = await fetch("/api/me/security", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "signout-all" }),
      });
      if (!res.ok) throw new Error("Failed to revoke sessions");
      // This session is revoked too — sign out cleanly
      await signOut({ callbackUrl: "/account" });
    } catch {
      setError("Could not sign out other devices. Please try again.");
      setRevoking(false);
      setConfirmOpen(false);
    }
  }

  return (
    <SectionCard
      title="Sessions & Sign-In History"
      description="Recent sign-ins to your account. Revoke every session if anything looks unfamiliar."
      action={
        <GhostBtn type="button" onClick={() => setConfirmOpen(true)} className="hover:border-red-300 hover:text-red-500">
          Sign out everywhere
        </GhostBtn>
      }
    >
      {error && <Alert type="error" message={error} />}

      {history === null && !error && (
        <div className="space-y-3 animate-pulse">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-10 rounded-xl bg-(--bg-raised)" />
          ))}
        </div>
      )}

      {history !== null && history.length === 0 && (
        <p className="text-sm text-(--text-3)">No sign-in history recorded yet — it starts with your next sign-in.</p>
      )}

      {history !== null && history.length > 0 && (
        <ul className="divide-y divide-(--border)">
          {history.slice(0, 10).map((e, i) => (
            <li key={i} className="flex items-center justify-between gap-3 py-2.5">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-(--text-1)">
                  {describeAgent(e.userAgent)}
                  {i === 0 && (
                    <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                      Most recent
                    </span>
                  )}
                </p>
                <p className="text-xs text-(--text-4) mt-0.5">
                  {new Date(e.at).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  {e.ip ? ` · ${e.ip}` : ""}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={signOutEverywhere}
        title="Sign out everywhere"
        message="This revokes every active session on all devices — including this one. You'll need to sign in again."
        confirmLabel="Sign out all devices"
        danger
        loading={revoking}
      />
    </SectionCard>
  );
}

export default function SecurityPage() {
  return (
    <div className="space-y-8 max-w-2xl">
      <PageHeader title="Security" subtitle="Manage your password, two-factor authentication, and sessions." />
      <PasswordForm />
      <TwoFACard />
      <SessionsCard />
    </div>
  );
}
