"use client";

import { useState } from "react";
import { X, UserPlus, Copy, Check, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import type { AdminRole, AdminUser } from "./types";
import { ROLE_META, ALL_ROLES } from "./types";

interface Props {
  open: boolean;
  onClose(): void;
  currentUserRole: AdminRole;
  onCreated(user: AdminUser): void;
}

const ALLOWED_ROLES: Record<AdminRole, AdminRole[]> = {
  super_admin: ALL_ROLES,
  manager: ["sales", "account"],
  sales: [],
  account: [],
};

export default function CreateUserModal({ open, onClose, currentUserRole, onCreated }: Props) {
  const [form, setForm] = useState({ name: "", email: "", username: "", role: "sales" as AdminRole });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const allowedRoles = ALLOWED_ROLES[currentUserRole] ?? [];

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
    setError(null);
  }

  function autoUsername() {
    if (!form.username && form.name.trim()) {
      const u = form.name.trim().toLowerCase().replace(/\s+/g, ".").replace(/[^a-z0-9.]/g, "");
      set("username", u);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.username.trim()) {
      setError("All fields are required");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to create user");
        return;
      }
      setResetToken(data.resetToken);
      onCreated({ ...form, _id: data.id, permissions: [], mfaEnabled: false, status: "active", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    } catch {
      setError("Network error — please try again");
    } finally {
      setSaving(false);
    }
  }

  async function copyToken() {
    if (!resetToken) return;
    await navigator.clipboard.writeText(resetToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleClose() {
    setForm({ name: "", email: "", username: "", role: "sales" });
    setError(null);
    setResetToken(null);
    setCopied(false);
    onClose();
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "var(--apt-bg-overlay)" }}
      onMouseDown={(e) => { if (e.target === e.currentTarget && !resetToken) handleClose(); }}
    >
      <div
        className="w-full max-w-md rounded-xl overflow-hidden"
        style={{ background: "var(--apt-bg)", border: "1px solid var(--apt-border-strong)", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: "1px solid var(--apt-border)" }}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--apt-brand-bg)" }}>
              <UserPlus size={15} style={{ color: "var(--apt-text-brand)" }} />
            </div>
            <div>
              <h2 className="text-[14px] font-semibold" style={{ color: "var(--apt-text-primary)" }}>
                {resetToken ? "User Created" : "Create Admin User"}
              </h2>
              <p className="text-[11px]" style={{ color: "var(--apt-text-muted)" }}>
                {resetToken ? "Share the setup link with the new user" : "Add a new team member"}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded flex items-center justify-center hover:bg-[var(--apt-bg-raised)]"
            style={{ color: "var(--apt-text-muted)" }}
          >
            <X size={15} />
          </button>
        </div>

        {resetToken ? (
          /* Success state — show reset token */
          <div className="p-6 space-y-4">
            <div
              className="rounded-lg p-4 text-center"
              style={{ background: "var(--apt-bg-raised)", border: "1px solid var(--apt-border)" }}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-3"
                style={{ background: "#f0fdf4" }}
              >
                <Check size={18} className="text-green-600" />
              </div>
              <p className="text-[13px] font-medium mb-1" style={{ color: "var(--apt-text-primary)" }}>
                {form.name} has been created
              </p>
              <p className="text-[12px]" style={{ color: "var(--apt-text-muted)" }}>
                Share the one-time setup token below. It expires in 24 hours.
              </p>
            </div>

            <div>
              <label className="text-[11px] font-medium block mb-1.5" style={{ color: "var(--apt-text-muted)" }}>
                SETUP TOKEN
              </label>
              <div
                className="flex items-center gap-2 rounded-lg px-3 py-2.5"
                style={{ background: "var(--apt-bg-raised)", border: "1px solid var(--apt-border)" }}
              >
                <code
                  className="flex-1 text-[11px] truncate select-all"
                  style={{ color: "var(--apt-text-primary)", fontFamily: "monospace" }}
                >
                  {resetToken}
                </code>
                <button
                  onClick={copyToken}
                  className="shrink-0 p-1.5 rounded hover:bg-[var(--apt-bg)]"
                  style={{ color: copied ? "#16a34a" : "var(--apt-text-muted)" }}
                  title="Copy token"
                >
                  {copied ? <Check size={13} /> : <Copy size={13} />}
                </button>
              </div>
            </div>

            <p className="text-[11px] px-1" style={{ color: "var(--apt-text-muted)" }}>
              The user can use this token at the password reset page to set their own password. This token is shown only once.
            </p>

            <Button variant="primary" size="sm" className="w-full" onClick={handleClose}>
              Done
            </Button>
          </div>
        ) : (
          /* Create form */
          <form onSubmit={submit} className="p-6 space-y-4">
            <Input
              label="Full Name"
              placeholder="Kofi Mensah"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              onBlur={autoUsername}
              required
            />
            <Input
              label="Email Address"
              type="email"
              placeholder="kofi@aptghana.com"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              required
            />
            <Input
              label="Username"
              placeholder="kofi.mensah"
              value={form.username}
              onChange={(e) => set("username", e.target.value.toLowerCase().replace(/\s+/g, "."))}
              required
            />
            <div>
              <label className="text-[12px] font-medium block mb-1.5" style={{ color: "var(--apt-text-primary)" }}>
                Role
              </label>
              <div className="grid grid-cols-2 gap-2">
                {allowedRoles.map((role) => {
                  const meta = ROLE_META[role];
                  const selected = form.role === role;
                  return (
                    <button
                      key={role}
                      type="button"
                      onClick={() => set("role", role)}
                      className="p-3 rounded-lg text-left transition-all"
                      style={{
                        border: `2px solid ${selected ? meta.textColor : "var(--apt-border)"}`,
                        background: selected ? meta.color : "var(--apt-bg)",
                      }}
                    >
                      <div
                        className="text-[12px] font-semibold mb-0.5"
                        style={{ color: selected ? meta.textColor : "var(--apt-text-primary)" }}
                      >
                        {meta.label}
                      </div>
                      <div
                        className="text-[10px]"
                        style={{ color: selected ? meta.textColor : "var(--apt-text-muted)", opacity: 0.85 }}
                      >
                        {meta.description}
                      </div>
                    </button>
                  );
                })}
              </div>
              {allowedRoles.length === 0 && (
                <p className="text-[12px] mt-1" style={{ color: "var(--apt-text-muted)" }}>
                  Your role does not permit creating new users.
                </p>
              )}
            </div>

            {error && (
              <div className="rounded-lg px-3 py-2 text-[12px]" style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}>
                {error}
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <Button type="button" variant="ghost" size="sm" className="flex-1" onClick={handleClose} disabled={saving}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" className="flex-1" loading={saving} disabled={allowedRoles.length === 0}>
                Create User
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
