"use client";

import { useState } from "react";
import type { QuoteKind, RfqSource, RfqSubmission } from "@apt/types";
import type { DraftAttachment, DraftItem } from "@/lib/store/request-draft";
import type { ContactValues } from "./ContactCard";

export interface SubmissionSuccess {
  ref: string;
  email: string;
}

/**
 * Shared submit pipeline for both procurement workspaces: builds the
 * RfqSubmission payload, POSTs it, and exposes submitting/error/success
 * state. The caller decides what to clear on success.
 */
export function useRequestSubmission(kind: QuoteKind) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<SubmissionSuccess | null>(null);

  async function submit(args: {
    source: RfqSource;
    contact: ContactValues;
    items: DraftItem[];
    attachments?: DraftAttachment[];
    message: string;
    onSuccess?: () => void;
  }): Promise<void> {
    const { source, contact, items, attachments, message, onSuccess } = args;
    if (!items.length || submitting) return;

    setSubmitting(true);
    setError(null);

    const payload: RfqSubmission = {
      kind,
      source,
      contact: {
        firstName: contact.firstName.trim(),
        lastName:  contact.lastName.trim(),
        email:     contact.email.trim(),
        phone:     contact.phone.trim(),
        company:   contact.company.trim() || undefined,
        country:   contact.country.trim() || undefined,
        address:   contact.address.trim() || undefined,
      },
      items: items.map((i) => ({
        productId: i.custom ? undefined : i.productId,
        sku:       i.sku,
        name:      i.name,
        brand:     i.brandName,
        imageUrl:  i.imageUrl || undefined,
        quantity:  i.qty,
        notes:     i.notes.trim() || undefined,
        custom:    i.custom || undefined,
      })),
      attachmentIds: attachments?.length ? attachments.map((a) => a.id) : undefined,
      message: message.trim() || undefined,
    };

    try {
      const res  = await fetch("/api/rfq", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      });
      const data = (await res.json()) as { ok?: boolean; ref?: string; error?: string };

      if (!res.ok || !data.ok || !data.ref) {
        setError(data.error ?? "Failed to submit request. Please try again.");
        return;
      }

      setSuccess({ ref: data.ref, email: payload.contact.email });
      onSuccess?.();
      window.scrollTo({ top: 0 });
    } catch {
      setError("Network error — please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return { submit, submitting, error, success };
}
