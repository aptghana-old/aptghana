import crypto from "crypto";
import type { AuditActorType } from "@apt/types";
import { AuditLogModel } from "../models/AuditLog";

/* Pure workflow rules live in @apt/types (client-safe); re-exported here so
   server code keeps a single import surface via @apt/db. */
export {
  QUOTE_TRANSITIONS,
  EDITABLE_STATUSES,
  APPROVABLE_STATUSES,
  QuoteWorkflowError,
  canTransition,
  assertTransition,
  computeQuoteTotals,
  allItemsPriced,
} from "@apt/types";

/* ─── Reference generation ────────────────────────────────────────────────── */

/** RFA-250612-7F3A / RFQ-… / QT-… / ORD-… / PAY-…  */
export function generateWorkflowRef(prefix: "RFA" | "RFQ" | "QT" | "ORD" | "PAY"): string {
  const d = new Date();
  const date = [
    String(d.getFullYear()).slice(2),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("");
  // PAY references use 8 bytes (2^64 ≈ 1.8×10^19 combinations) to prevent collision risk.
  // Other prefixes use 4 bytes (upgraded from 2 for better uniqueness).
  const entropy = prefix === "PAY" ? 8 : 4;
  return `${prefix}-${date}-${crypto.randomBytes(entropy).toString("hex").toUpperCase()}`;
}

/** Secret token for the public payment portal URL. */
export function generatePayToken(): string {
  return crypto.randomBytes(24).toString("hex");
}

/* ─── Audit trail ─────────────────────────────────────────────────────────── */

export interface AuditInput {
  entityType: "quote" | "payment" | "user" | "admin" | "product";
  entityId: unknown;
  ref?: string;
  action: string;
  fromStatus?: string;
  toStatus?: string;
  actor: { type: AuditActorType; id?: unknown; name?: string };
  message?: string;
  meta?: Record<string, unknown>;
}

/** Append an audit entry. Never throws — auditing must not break the workflow. */
export async function recordAudit(entry: AuditInput): Promise<void> {
  try {
    await AuditLogModel.create(entry);
  } catch (err) {
    console.error("[apt/db] audit write failed:", err);
  }
}
