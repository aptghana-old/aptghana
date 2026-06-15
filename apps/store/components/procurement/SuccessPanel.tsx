"use client";

import Link from "next/link";
import { Icon } from "@/components/account/ui";
import { D } from "./icons";

interface SuccessPanelProps {
  title: string;
  description: React.ReactNode;
  refValue: string;
  email: string;
  isAuthenticated: boolean;
  steps: [string, string][];
}

/** Post-submission confirmation shared by the RFA and RFQ workspaces. */
export default function SuccessPanel({
  title, description, refValue, email, isAuthenticated, steps,
}: SuccessPanelProps) {
  return (
    <div className="max-w-2xl mx-auto">
      <div
        className="rounded-2xl border p-8 sm:p-10 text-center"
        style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
      >
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 bg-se-green-light dark:bg-green-900/20">
          <Icon d={D.check} size={30} strokeWidth={2.5} className="text-se-green" />
        </div>
        <h1 className="text-2xl font-bold text-(--text-1) mb-2">{title}</h1>
        <div className="text-sm text-(--text-3) max-w-md mx-auto">{description}</div>

        <div
          className="inline-flex items-center gap-2.5 mt-5 px-4 py-2.5 rounded-xl border"
          style={{ background: "var(--bg-raised)", borderColor: "var(--border)" }}
        >
          <span className="text-xs text-(--text-3)">Reference</span>
          <span className="text-sm font-mono font-bold text-(--text-1)">{refValue}</span>
        </div>

        <ol className="grid sm:grid-cols-4 gap-4 mt-8 text-left">
          {steps.map(([stepTitle, desc], i) => (
            <li key={stepTitle}>
              <span className="w-6 h-6 rounded-full bg-navy-500 text-white text-[11px] font-bold flex items-center justify-center mb-2">
                {i + 1}
              </span>
              <p className="text-[13px] font-semibold text-(--text-1)">{stepTitle}</p>
              <p className="text-[11px] text-(--text-3) leading-relaxed mt-0.5">{desc}</p>
            </li>
          ))}
        </ol>
      </div>

      {/* Guest nudge / next actions */}
      {isAuthenticated ? (
        <div className="flex flex-wrap justify-center gap-3 mt-6">
          <Link
            href="/account/quotes"
            className="inline-flex items-center gap-2 h-11 px-6 bg-navy-500 hover:bg-navy-400 text-white font-bold text-sm rounded-xl transition-colors"
          >
            Track this request
            <Icon d={D.arrow} size={13} strokeWidth={2.5} />
          </Link>
          <Link
            href="/search"
            className="inline-flex items-center gap-2 h-11 px-6 border border-(--border) text-(--text-2) font-semibold text-sm rounded-xl hover:border-navy-400 hover:text-navy-500 transition-colors"
          >
            Continue browsing
          </Link>
        </div>
      ) : (
        <div
          className="rounded-2xl border p-6 mt-6 flex flex-col sm:flex-row items-center gap-5"
          style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
        >
          <div className="w-11 h-11 rounded-xl bg-navy-50 dark:bg-navy-900/40 flex items-center justify-center shrink-0">
            <Icon d={D.user} size={20} className="text-navy-500 dark:text-navy-300" />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-sm font-bold text-(--text-1)">Track this request with an account</h2>
            <p className="text-[13px] text-(--text-3) mt-0.5">
              Create a free account to follow status, message our team, and re-order in one click.
            </p>
          </div>
          <Link
            href={`/account/register?email=${encodeURIComponent(email)}`}
            className="inline-flex items-center gap-2 h-10 px-5 bg-navy-500 hover:bg-navy-400 text-white font-bold text-sm rounded-xl transition-colors shrink-0"
          >
            Create account
            <Icon d={D.arrow} size={13} strokeWidth={2.5} />
          </Link>
        </div>
      )}
    </div>
  );
}
