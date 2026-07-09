"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRfqDraft } from "@/lib/store/request-draft";
import { Alert, Icon } from "@/components/account/ui";
import type { RequestSeedItem } from "@/lib/workflow/prefill";
import RequestItemsCard from "./RequestItemsCard";
import ContactCard, { type ContactValues } from "./ContactCard";
import ProjectCard from "./ProjectCard";
import SuccessPanel from "./SuccessPanel";
import AttachmentUploader from "./AttachmentUploader";
import CustomItemForm from "./CustomItemForm";
import { SummaryAside, MobileActionBar } from "./RequestSummary";
import { useRequestSubmission } from "./useRequestSubmission";
import { D } from "./icons";

interface RfqWorkspaceProps {
  seedItem: RequestSeedItem | null;
  seedNotFound: boolean;
  prefill: ContactValues;
  isAuthenticated: boolean;
}

/**
 * Request for Quotation — single catalogue products (especially unpriced
 * ones) and products not listed on the website, with supporting documents.
 * Cart-based procurement lives at /request-approval.
 */
export default function RfqWorkspace({
  seedItem, seedNotFound, prefill, isAuthenticated,
}: RfqWorkspaceProps) {
  const draft = useRfqDraft();

  const [ contact, setContact ] = useState(prefill);
  const [ customFormOpen, setCustomFormOpen ] = useState(false);
  const { submit, submitting, error, success } = useRequestSubmission("rfq");

  /* Seed a single product from ?product= / ?sku= (idempotent, additive) */
  const seedApplied = useRef(false);
  useEffect(() => {
    if (!draft.hydrated || !seedItem || seedApplied.current) return;
    seedApplied.current = true;
    const wasEmpty = draft.items.length === 0;
    draft.addItems(
      [ { ...seedItem, qty: seedItem.minQty } ],
      wasEmpty ? "single_product" : undefined,
    );
  }, [ draft, seedItem ]);

  const totalUnits = draft.items.reduce((n, i) => n + i.qty, 0);
  const hasCustom = draft.items.some((i) => i.custom);
  const source = hasCustom ? "custom" : draft.items.length === 1 ? "single_product" : draft.source;

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    void submit({
      source,
      contact,
      items: draft.items,
      attachments: draft.attachments,
      message: draft.message,
      onSuccess: () => draft.clear(),
    });
  }

  const showEmpty = draft.hydrated && draft.items.length === 0;

  const addCustomButton = (
    <button
      type="button"
      onClick={() => setCustomFormOpen(true)}
      className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-bold border border-(--border) text-(--text-2) hover:border-navy-400 hover:text-navy-500 transition-colors"
    >
      <Icon d={D.wrench} size={12} strokeWidth={2} />
      Add unlisted product
    </button>
  );

  return (
    <main className="flex-1" style={{ background: "var(--bg-base)" }}>
      {/* Hero */}
      <div className="bg-navy-300 py-10">
        <div className="container-store">
          <p className="text-xs font-semibold text-se-green uppercase tracking-widest mb-2">Quotation</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">Request for Quotation</h1>
          <p className="text-white/50 mt-2 text-sm max-w-xl">
            Get pricing for individual products — including items without a listed price and
            products not yet on our website. Attach datasheets or drawings to speed things up.
          </p>
        </div>
      </div>

      <div className="container-store py-8 md:py-12 pb-28 lg:pb-12">
        {success ? (
          <SuccessPanel
            title="RFQ submitted"
            description={
              <p>
                Your request has been received. Our team will respond to{" "}
                <span className="font-semibold text-(--text-1)">{success.email}</span> — same
                business day for requests before 3 PM.
              </p>
            }
            refValue={success.ref}
            email={success.email}
            isAuthenticated={isAuthenticated}
            steps={[
              [ "Review", "Our engineers review your requirements and check availability." ],
              [ "Quote", "You receive an itemized quotation with pricing and lead times." ],
              [ "Confirm", "Approve the quote and pay securely online." ],
              [ "Delivery", "Products shipped nationwide or ready for collection." ],
            ]}
          />
        ) : (
          <form onSubmit={handleSubmit}>
            {seedNotFound && (
              <div className="mb-6">
                <Alert type="warning" message="We couldn't find that product. Browse the catalogue or describe it as an unlisted product below." />
              </div>
            )}
            {error && (
              <div className="mb-6">
                <Alert type="error" message={error} />
              </div>
            )}

            {showEmpty && !customFormOpen ? (
              <div
                className="max-w-2xl mx-auto rounded-2xl border p-12 text-center"
                style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
              >
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 bg-(--bg-raised)">
                  <Icon d={D.rfq} size={28} strokeWidth={1.25} className="text-(--text-4)" />
                </div>
                <h2 className="text-xl font-bold text-(--text-1) mb-2">Request a quotation</h2>
                <p className="text-sm text-(--text-3) max-w-md mx-auto mb-7">
                  Use <strong>Request Quote</strong> on any product page, or describe a product we
                  don&apos;t list yet. Buying a full list?{" "}
                  <Link href="/cart" className="text-navy-500 font-semibold hover:underline">
                    Build your cart
                  </Link>{" "}
                  and submit it for approval instead.
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  <Link
                    href="/search"
                    className="inline-flex items-center gap-2 h-10 px-6 bg-navy-500 hover:bg-navy-400 text-white font-semibold text-sm rounded-xl transition-colors"
                  >
                    Browse Products
                  </Link>
                  <button
                    type="button"
                    onClick={() => setCustomFormOpen(true)}
                    className="inline-flex items-center gap-2 h-10 px-6 bg-se-green hover:bg-se-green-hover text-white font-semibold text-sm rounded-xl transition-colors"
                  >
                    <Icon d={D.wrench} size={15} strokeWidth={2} />
                    Describe an unlisted product
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-8 items-start">
                <div className="space-y-6 min-w-0">
                  <RequestItemsCard
                    title={`Requested Products${draft.hydrated ? ` (${draft.items.length})` : ""}`}
                    subtitle="Quantities and notes are saved automatically while you browse."
                    action={addCustomButton}
                    items={draft.items}
                    hydrated={draft.hydrated}
                    onSetQty={draft.setQty}
                    onSetNote={draft.setNote}
                    onRemove={draft.remove}
                    footer={customFormOpen ? (
                      <CustomItemForm
                        onAdd={(item) => draft.addItems([ item ], "custom")}
                        onClose={() => setCustomFormOpen(false)}
                      />
                    ) : null}
                  />

                  <AttachmentUploader
                    attachments={draft.attachments}
                    onAdd={draft.addAttachment}
                    onRemove={draft.removeAttachment}
                  />

                  <ProjectCard
                    value={draft.message}
                    onChange={draft.setMessage}
                  />

                  <ContactCard
                    contact={contact}
                    onChange={(field, value) => setContact((c) => ({ ...c, [ field ]: value }))}
                    isAuthenticated={isAuthenticated}
                  />
                </div>

                <SummaryAside
                  title="Quotation Summary"
                  lineCount={draft.items.length}
                  totalUnits={totalUnits}
                  sourceLabel={
                    hasCustom ? "Includes unlisted products"
                      : draft.items.length === 1 ? "Single product" : "Multiple products"
                  }
                  submitLabel="Submit RFQ"
                  submitting={submitting}
                  disabled={!draft.items.length}
                >
                  {draft.attachments.length > 0 && (
                    <div className="flex justify-between text-sm mb-4 -mt-1">
                      <span className="text-(--text-3)">Documents</span>
                      <span className="font-semibold text-(--text-1)">{draft.attachments.length}</span>
                    </div>
                  )}
                </SummaryAside>

                <MobileActionBar
                  lineCount={draft.items.length}
                  totalUnits={totalUnits}
                  submitLabel="Submit RFQ"
                  submitting={submitting}
                  disabled={!draft.items.length}
                />
              </div>
            )}
          </form>
        )}
      </div>
    </main>
  );
}
