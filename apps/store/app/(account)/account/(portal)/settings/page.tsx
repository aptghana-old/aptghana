"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { PageHeader, SectionCard, PrimaryBtn, GhostBtn, Alert } from "@/components/account/ui";

export default function SettingsPage() {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (deleteInput !== "DELETE") return;
    setIsPending(true);
    try {
      const res = await fetch("/api/auth/delete-account", { method: "DELETE" });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Failed to delete account");
      }
      await signOut({ callbackUrl: "/" });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setIsPending(false);
    }
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <PageHeader title="Settings" subtitle="Account preferences and data management." />

      {/* Preferences */}
      <SectionCard title="Preferences" description="Regional and display settings.">
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-(--text-1)">Currency</p>
              <p className="text-xs text-(--text-3) mt-0.5">Prices are displayed in Ghanaian Cedi (GHS).</p>
            </div>
            <span className="text-sm font-bold text-(--text-1) bg-(--bg-raised) border border-(--border) px-3 py-1.5 rounded-lg">GHS (₵)</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-(--text-1)">Language</p>
              <p className="text-xs text-(--text-3) mt-0.5">Platform language and date formats.</p>
            </div>
            <span className="text-sm font-bold text-(--text-1) bg-(--bg-raised) border border-(--border) px-3 py-1.5 rounded-lg">English (Ghana)</span>
          </div>
        </div>
      </SectionCard>

      {/* Data export */}
      <SectionCard title="Your Data" description="Download or request a copy of your account data.">
        <div className="space-y-3">
          <p className="text-sm text-(--text-3)">
            You can request a full export of your account data including profile information, order history, and quotes. The export will be delivered to your registered email address within 24 hours.
          </p>
          <GhostBtn type="button">Request Data Export</GhostBtn>
        </div>
      </SectionCard>

      {/* Danger zone */}
      <SectionCard
        title="Danger Zone"
        description="Irreversible and destructive actions."
        badge={<span className="text-[10px] font-bold text-red-500 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-full">Destructive</span>}
      >
        {error && <Alert type="error" message={error} />}
        {!showDeleteConfirm ? (
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-(--text-1)">Delete Account</p>
              <p className="text-xs text-(--text-3) mt-0.5">
                Permanently delete your account and all associated data. This cannot be undone.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="shrink-0 text-xs font-bold text-red-500 hover:text-red-400 border border-red-200 dark:border-red-800 hover:border-red-400 px-3 py-2 rounded-xl transition-colors"
            >
              Delete Account
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-(--text-2)">
              This will permanently delete your account, all orders, addresses, and personal data.
              Type <strong className="text-red-500">DELETE</strong> to confirm.
            </p>
            <input
              type="text"
              value={deleteInput}
              onChange={(e) => setDeleteInput(e.target.value)}
              placeholder="Type DELETE to confirm"
              className="w-full h-11 px-4 rounded-xl border border-red-200 dark:border-red-800 bg-(--bg-surface) text-(--text-1) text-sm font-mono focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all"
            />
            <div className="flex gap-3">
              <PrimaryBtn
                type="button"
                variant="danger"
                disabled={deleteInput !== "DELETE" || isPending}
                loading={isPending}
                onClick={handleDelete}
              >
                Permanently Delete Account
              </PrimaryBtn>
              <GhostBtn type="button" onClick={() => { setShowDeleteConfirm(false); setDeleteInput(""); }}>
                Cancel
              </GhostBtn>
            </div>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
