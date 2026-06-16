"use client";

import { useActionState, useEffect, useState } from "react";
import { CheckCircle2, AlertCircle, User, Shield, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  updateProfileAction,
  changePasswordAction,
  type ProfileState,
  type PasswordState,
} from "./actions";

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  manager: "Manager",
  sales: "Sales",
  account: "Account",
};

const PROFILE_ERROR_MESSAGES: Record<string, string> = {
  UNAUTHORIZED: "Your session has expired. Please sign in again.",
  NAME_REQUIRED: "Name cannot be empty.",
  UNKNOWN: "Something went wrong. Please try again.",
};

const PASSWORD_ERROR_MESSAGES: Record<string, string> = {
  UNAUTHORIZED: "Your session has expired. Please sign in again.",
  WRONG_PASSWORD: "Current password is incorrect.",
  WEAK_PASSWORD: "New password does not meet the strength requirements.",
  MISMATCH: "New password and confirmation do not match.",
  UNKNOWN: "Something went wrong. Please try again.",
};

function SettingRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-6 py-5" style={{ borderBottom: "1px solid var(--apt-border)" }}>
      <div className="w-48 shrink-0">
        <div className="text-[13px] font-medium" style={{ color: "var(--apt-text-primary)" }}>{label}</div>
        {description && <div className="text-[11px] mt-0.5" style={{ color: "var(--apt-text-muted)" }}>{description}</div>}
      </div>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}

function StatusBanner({ kind, message }: { kind: "success" | "error"; message: string }) {
  return (
    <div
      className="flex items-center gap-2 px-4 py-2.5 rounded-md text-[12px] mb-4"
      style={{
        background: kind === "success" ? "rgba(34,197,94,0.1)" : "rgba(220,38,38,0.08)",
        color: kind === "success" ? "#16a34a" : "#dc2626",
      }}
    >
      {kind === "success" ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
      {message}
    </div>
  );
}

interface ProfileFormProps {
  name: string;
  email: string;
  username: string;
  role: string;
  mfaEnabled: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export default function ProfileForm({ name, email, username, role, mfaEnabled, lastLoginAt, createdAt }: ProfileFormProps) {
  const [profileState, profileFormAction, profilePending] = useActionState<ProfileState, FormData>(updateProfileAction, null);
  const [passwordState, passwordFormAction, passwordPending] = useActionState<PasswordState, FormData>(changePasswordAction, null);
  const [passwordKey, setPasswordKey] = useState(0);

  useEffect(() => {
    if (passwordState && "ok" in passwordState) {
      setPasswordKey((k) => k + 1);
    }
  }, [passwordState]);

  return (
    <div className="space-y-6">
      <div className="card p-0 overflow-hidden">
        <div className="card-header flex items-center gap-2">
          <User size={14} style={{ color: "var(--apt-text-muted)" }} />
          <h2 className="text-[14px] font-semibold" style={{ color: "var(--apt-text-primary)" }}>Account Details</h2>
        </div>
        <div className="px-6">
          {profileState && "error" in profileState && (
            <div className="pt-4"><StatusBanner kind="error" message={PROFILE_ERROR_MESSAGES[profileState.error]} /></div>
          )}
          {profileState && "ok" in profileState && (
            <div className="pt-4"><StatusBanner kind="success" message="Profile updated successfully." /></div>
          )}
          <form action={profileFormAction}>
            <SettingRow label="Full Name" description="Displayed across the admin interface.">
              <Input name="name" defaultValue={name} required maxLength={120} />
            </SettingRow>
            <SettingRow label="Email Address" description="Used to sign in. Contact a super admin to change this.">
              <Input value={email} disabled />
            </SettingRow>
            <SettingRow label="Username" description="Contact a super admin to change this.">
              <Input value={username} disabled />
            </SettingRow>
            <SettingRow label="Role">
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[12px] font-medium"
                style={{ background: "var(--apt-bg-raised)", color: "var(--apt-text-primary)" }}
              >
                <Shield size={12} />
                {ROLE_LABELS[role] ?? role}
              </span>
            </SettingRow>
            <div className="py-5 flex justify-end">
              <Button type="submit" variant="primary" size="sm" loading={profilePending}>
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="card-header flex items-center gap-2">
          <KeyRound size={14} style={{ color: "var(--apt-text-muted)" }} />
          <h2 className="text-[14px] font-semibold" style={{ color: "var(--apt-text-primary)" }}>Change Password</h2>
        </div>
        <div className="px-6">
          {passwordState && "error" in passwordState && (
            <div className="pt-4"><StatusBanner kind="error" message={PASSWORD_ERROR_MESSAGES[passwordState.error]} /></div>
          )}
          {passwordState && "ok" in passwordState && (
            <div className="pt-4"><StatusBanner kind="success" message="Password changed successfully." /></div>
          )}
          <form action={passwordFormAction} key={passwordKey}>
            <SettingRow label="Current Password">
              <Input name="currentPassword" type="password" required autoComplete="current-password" />
            </SettingRow>
            <SettingRow label="New Password" description="Minimum 8 characters, with a mix of letters, numbers, and symbols.">
              <Input name="newPassword" type="password" required autoComplete="new-password" />
            </SettingRow>
            <SettingRow label="Confirm New Password">
              <Input name="confirmPassword" type="password" required autoComplete="new-password" />
            </SettingRow>
            <div className="py-5 flex justify-end">
              <Button type="submit" variant="primary" size="sm" loading={passwordPending}>
                Update Password
              </Button>
            </div>
          </form>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="card-header">
          <h2 className="text-[14px] font-semibold" style={{ color: "var(--apt-text-primary)" }}>Account Activity</h2>
        </div>
        <div className="px-6">
          <SettingRow label="Two-Factor Authentication">
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[12px] font-medium"
              style={{
                background: mfaEnabled ? "rgba(34,197,94,0.1)" : "var(--apt-bg-raised)",
                color: mfaEnabled ? "#16a34a" : "var(--apt-text-muted)",
              }}
            >
              {mfaEnabled ? "Enabled" : "Not Enabled"}
            </span>
          </SettingRow>
          <SettingRow label="Last Login">
            <span className="text-[13px]" style={{ color: "var(--apt-text-primary)" }}>
              {lastLoginAt ? new Date(lastLoginAt).toLocaleString() : "—"}
            </span>
          </SettingRow>
          <SettingRow label="Account Created">
            <span className="text-[13px]" style={{ color: "var(--apt-text-primary)" }}>
              {new Date(createdAt).toLocaleDateString()}
            </span>
          </SettingRow>
        </div>
      </div>
    </div>
  );
}
