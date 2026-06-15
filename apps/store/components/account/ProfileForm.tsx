"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Alert, FormField, GhostBtn, Modal, PageHeader, PrimaryBtn, SectionCard, inputBase,
} from "@/components/account/ui";
import type { AccountProfile } from "@/lib/account/profile";

type Result = { ok: boolean; msg: string } | null;

/* ─── Avatar ──────────────────────────────────────────────────────────────── */
function AvatarCard({ profile }: { profile: AccountProfile }) {
  const { update } = useSession();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [avatar, setAvatar] = useState(profile.avatar);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result>(null);

  const initials = profile.name.split(/\s+/).map((w) => w[0]).join("").toUpperCase().slice(0, 2);

  async function upload(file: File) {
    if (file.size > 2 * 1024 * 1024) {
      setResult({ ok: false, msg: "Images must be under 2 MB." });
      return;
    }
    setBusy(true);
    setResult(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/me/avatar", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      setAvatar(data.avatar);
      await update({ image: data.avatar });
      router.refresh();
    } catch (err) {
      setResult({ ok: false, msg: err instanceof Error ? err.message : "Upload failed." });
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function remove() {
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch("/api/me/avatar", { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to remove photo");
      setAvatar(null);
      await update({ image: null });
      router.refresh();
    } catch (err) {
      setResult({ ok: false, msg: err instanceof Error ? err.message : "Failed to remove photo." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <SectionCard title="Profile Photo" description="Shown across your account and on quotations.">
      {result && <div className="mb-4"><Alert type={result.ok ? "success" : "error"} message={result.msg} /></div>}
      <div className="flex items-center gap-5">
        {avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatar} alt="Profile photo" className="w-20 h-20 rounded-full object-cover ring-4 ring-(--border)" />
        ) : (
          <div className="w-20 h-20 rounded-full bg-linear-to-br from-navy-400 to-navy-700 flex items-center justify-center text-2xl font-bold text-white ring-4 ring-(--border) select-none">
            {initials}
          </div>
        )}
        <div>
          <p className="text-sm font-semibold text-(--text-1) mb-1">{profile.name}</p>
          <p className="text-xs text-(--text-4) mb-3">PNG, JPG or WEBP — up to 2 MB.</p>
          <div className="flex gap-2">
            <GhostBtn type="button" onClick={() => inputRef.current?.click()} className="text-xs h-8 px-3">
              {busy ? "Working…" : avatar ? "Change Photo" : "Upload Photo"}
            </GhostBtn>
            {avatar && (
              <GhostBtn type="button" onClick={remove} className="text-xs h-8 px-3 hover:border-red-300 hover:text-red-500">
                Remove
              </GhostBtn>
            )}
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            aria-label="Upload profile photo"
            onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
          />
        </div>
      </div>
    </SectionCard>
  );
}

/* ─── Personal info ───────────────────────────────────────────────────────── */
function PersonalInfoCard({ profile }: { profile: AccountProfile }) {
  const { update } = useSession();
  const router = useRouter();
  const [firstName, setFirstName] = useState(profile.firstName);
  const [lastName, setLastName] = useState(profile.lastName);
  const [phone, setPhone] = useState(profile.phone);
  const [company, setCompany] = useState(profile.company);
  const [jobTitle, setJobTitle] = useState(profile.jobTitle);
  const [result, setResult] = useState<Result>(null);
  const [isPending, startTransition] = useTransition();

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setResult(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/me", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            phone: phone.trim(),
            company: company.trim(),
            jobTitle: jobTitle.trim(),
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Update failed");
        await update({ name: data.name });
        setResult({ ok: true, msg: "Profile updated successfully." });
        router.refresh();
      } catch (err) {
        setResult({ ok: false, msg: err instanceof Error ? err.message : "Something went wrong." });
      }
    });
  };

  return (
    <form onSubmit={handleSave}>
      <SectionCard
        title="Personal Information"
        action={<PrimaryBtn type="submit" loading={isPending} variant="navy">Save Changes</PrimaryBtn>}
      >
        {result && <div className="mb-4"><Alert type={result.ok ? "success" : "error"} message={result.msg} /></div>}
        <div className="space-y-5">
          <div className="grid sm:grid-cols-2 gap-5">
            <FormField label="First Name">
              <input value={firstName} onChange={(e) => setFirstName(e.target.value)} required
                autoComplete="given-name" className={inputBase} />
            </FormField>
            <FormField label="Last Name">
              <input value={lastName} onChange={(e) => setLastName(e.target.value)}
                autoComplete="family-name" className={inputBase} />
            </FormField>
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            <FormField label="Phone Number">
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                placeholder="+233 XX XXX XXXX" autoComplete="tel" className={inputBase} />
            </FormField>
            <FormField label="Job Title">
              <input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g. Procurement Manager" autoComplete="organization-title" className={inputBase} />
            </FormField>
          </div>
          <FormField label="Company / Organisation">
            <input value={company} onChange={(e) => setCompany(e.target.value)}
              placeholder="Your organisation (optional)" autoComplete="organization" className={inputBase} />
          </FormField>
        </div>
      </SectionCard>
    </form>
  );
}

/* ─── Email ───────────────────────────────────────────────────────────────── */
function EmailCard({ profile }: { profile: AccountProfile }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pendingEmail, setPendingEmail] = useState(profile.pendingEmail);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result>(null);

  async function submitChange(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch("/api/me/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newEmail: newEmail.trim(), currentPassword: password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to start email change");
      setPendingEmail(data.pendingEmail);
      setResult({ ok: true, msg: data.message });
      setOpen(false);
      setNewEmail("");
      setPassword("");
      router.refresh();
    } catch (err) {
      setResult({ ok: false, msg: err instanceof Error ? err.message : "Something went wrong." });
    } finally {
      setBusy(false);
    }
  }

  async function cancelPending() {
    setBusy(true);
    try {
      await fetch("/api/me/email", { method: "DELETE" });
      setPendingEmail(null);
      setResult({ ok: true, msg: "Email change cancelled." });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <SectionCard
      title="Email Address"
      description="Used for sign-in, order updates, and quotations."
      action={<GhostBtn type="button" onClick={() => { setResult(null); setOpen(true); }}>Change Email</GhostBtn>}
    >
      {result && <div className="mb-4"><Alert type={result.ok ? "success" : "error"} message={result.msg} /></div>}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="text-sm font-semibold text-(--text-1)">{profile.email}</p>
          <p className="text-xs text-(--text-4) mt-0.5">
            {profile.emailVerified ? "Verified" : "Not verified"}
          </p>
        </div>
      </div>
      {pendingEmail && (
        <div className="mt-4 flex items-center justify-between gap-3 flex-wrap p-3 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-700">
          <p className="text-xs text-amber-800 dark:text-amber-300">
            Pending change to <strong>{pendingEmail}</strong> — check that inbox for the
            verification link. Your current email stays active until confirmed.
          </p>
          <button type="button" onClick={cancelPending} disabled={busy}
            className="text-xs font-bold text-amber-800 dark:text-amber-300 hover:underline shrink-0">
            Cancel change
          </button>
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Change email address"
        description="We'll send a verification link to the new address. Nothing changes until you confirm it."
      >
        <form onSubmit={submitChange} className="space-y-4">
          <FormField label="New email address">
            <input type="email" required value={newEmail} onChange={(e) => setNewEmail(e.target.value)}
              placeholder="new@company.com" className={inputBase} autoComplete="email" />
          </FormField>
          <FormField label="Current password" hint="Required to confirm it's you.">
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              className={inputBase} autoComplete="current-password" />
          </FormField>
          <div className="flex justify-end gap-3 pt-2">
            <GhostBtn type="button" onClick={() => setOpen(false)}>Cancel</GhostBtn>
            <PrimaryBtn type="submit" loading={busy} variant="navy">Send Verification</PrimaryBtn>
          </div>
        </form>
      </Modal>
    </SectionCard>
  );
}

/* ─── Page ────────────────────────────────────────────────────────────────── */
export default function ProfileForm({ profile }: { profile: AccountProfile }) {
  return (
    <div className="space-y-8 max-w-2xl">
      <PageHeader title="Profile" subtitle="Manage your personal information." />
      <AvatarCard profile={profile} />
      <PersonalInfoCard profile={profile} />
      <EmailCard profile={profile} />
    </div>
  );
}
