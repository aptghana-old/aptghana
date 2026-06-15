import type { EmailKind } from "./types";

export interface LogPayload {
  to:        string;
  subject:   string;
  template:  EmailKind;
  status:    "sent" | "failed" | "retrying";
  messageId: string | null;
  error:     string | null;
  retries:   number;
  userId?:   string;
  meta?:     Record<string, unknown>;
}

/**
 * Writes an email audit record to MongoDB.
 * Uses a dynamic import so the email package doesn't hard-depend on @apt/db
 * at the module level — this keeps it usable in edge-adjacent contexts.
 */
export async function logEmail(payload: LogPayload): Promise<void> {
  try {
    const { connectDB, EmailLogModel } = await import("@apt/db");
    await connectDB();
    await EmailLogModel.create({
      to:        payload.to,
      subject:   payload.subject,
      template:  payload.template,
      status:    payload.status,
      messageId: payload.messageId,
      error:     payload.error,
      retries:   payload.retries,
      userId:    payload.userId ?? null,
      metadata:  payload.meta ?? {},
    });
  } catch (err) {
    // Logging failure must never crash the email send path
    console.error("[apt/email] Failed to write email log:", err);
  }
}
