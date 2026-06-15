"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useCart } from "@/lib/store/cart";
import { useApprovalDraft } from "@/lib/store/request-draft";
import { Alert, Icon } from "@/components/account/ui";
import RequestItemsCard from "./RequestItemsCard";
import ContactCard, { type ContactValues } from "./ContactCard";
import ProjectCard from "./ProjectCard";
import SuccessPanel from "./SuccessPanel";
import { SummaryAside, MobileActionBar } from "./RequestSummary";
import { useRequestSubmission } from "./useRequestSubmission";
import { D } from "./icons";

interface ApprovalWorkspaceProps {
  prefill: ContactValues;
  isAuthenticated: boolean;
}

/**
 * Request for Approval — cart-based enterprise procurement. The whole basket
 * is submitted together for pricing; once Sales approves, the request becomes
 * an Order awaiting payment.
 */
export default function ApprovalWorkspace({ prefill, isAuthenticated }: ApprovalWorkspaceProps) {
  const cart  = useCart();
  const draft = useApprovalDraft();

  const [contact, setContact] = useState(prefill);
  const { submit, submitting, error, success } = useRequestSubmission("approval_request");

  /* Import the procurement basket (waits for cart hydration; never duplicates) */
  const cartImported = useRef(false);
  useEffect(() => {
    if (!draft.hydrated || cartImported.current || cart.items.length === 0) return;
    cartImported.current = true;
    draft.addItems(
      cart.items.map((i) => ({
        productId: i.productId,
        sku:       i.sku,
        name:      i.name,
        imageUrl:  i.imageUrl,
        qty:       i.qty,
        minQty:    i.minQty,
      })),
      "cart",
    );
  }, [draft, cart.items]);

  const totalUnits = draft.items.reduce((n, i) => n + i.qty, 0);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    void submit({
      source: "cart",
      contact,
      items: draft.items,
      message: draft.message,
      onSuccess: () => {
        draft.clear();
        cart.clear();
      },
    });
  }

  const showEmpty = draft.hydrated && draft.items.length === 0;

  return (
    <main className="flex-1" style={{ background: "var(--bg-base)" }}>
      {/* Hero */}
      <div className="bg-navy-900 py-10">
        <div className="container-store">
          <p className="text-xs font-semibold text-se-green uppercase tracking-widest mb-2">Procurement</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">Request for Approval</h1>
          <p className="text-white/50 mt-2 text-sm max-w-xl">
            Submit your procurement list for pricing and approval. Once approved, it becomes an
            order ready for payment — no checkout guesswork.
          </p>
        </div>
      </div>

      <div className="container-store py-8 md:py-12 pb-28 lg:pb-12">
        {success ? (
          <SuccessPanel
            title="Request submitted for approval"
            description={
              <p>
                Your procurement request has been received. Our team will price every line and
                respond to <span className="font-semibold text-(--text-1)">{success.email}</span> —
                same business day for requests before 3 PM. Once approved, you&apos;ll receive an
                order with a secure payment link.
              </p>
            }
            refValue={success.ref}
            email={success.email}
            isAuthenticated={isAuthenticated}
            steps={[
              ["Review",   "Our engineers review your list and check stock availability."],
              ["Pricing",  "Every line is priced; discounts, tax and delivery are applied."],
              ["Approval", "You receive the approved order with a secure payment link."],
              ["Delivery", "Pay online and track your order through delivery."],
            ]}
          />
        ) : (
          <form onSubmit={handleSubmit}>
            {error && (
              <div className="mb-6">
                <Alert type="error" message={error} />
              </div>
            )}

            {showEmpty ? (
              <div
                className="max-w-2xl mx-auto rounded-2xl border p-12 text-center"
                style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
              >
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 bg-(--bg-raised)">
                  <Icon d={D.cart} size={28} strokeWidth={1.25} className="text-(--text-4)" />
                </div>
                <h2 className="text-xl font-bold text-(--text-1) mb-2">Your procurement list is empty</h2>
                <p className="text-sm text-(--text-3) max-w-md mx-auto mb-7">
                  Add products to your cart, then submit the whole basket here for pricing and
                  approval. Looking for a single product or something not listed?{" "}
                  <Link href="/rfq" className="text-navy-500 font-semibold hover:underline">Request a quotation</Link> instead.
                </p>
                <Link
                  href="/search"
                  className="inline-flex items-center gap-2 h-10 px-6 bg-navy-500 hover:bg-navy-400 text-white font-semibold text-sm rounded-xl transition-colors"
                >
                  Browse Products
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-8 items-start">
                <div className="space-y-6 min-w-0">
                  <RequestItemsCard
                    title={`Procurement List${draft.hydrated ? ` (${draft.items.length})` : ""}`}
                    subtitle="Quantities and notes are saved automatically while you browse."
                    action={
                      <Link
                        href="/search"
                        className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-bold border border-(--border) text-(--text-2) hover:border-navy-400 hover:text-navy-500 transition-colors"
                      >
                        <Icon d={D.plus} size={12} strokeWidth={2.5} />
                        Add products
                      </Link>
                    }
                    items={draft.items}
                    hydrated={draft.hydrated}
                    onSetQty={draft.setQty}
                    onSetNote={draft.setNote}
                    onRemove={draft.remove}
                  />

                  <ProjectCard
                    value={draft.message}
                    onChange={draft.setMessage}
                    title="Project Details"
                    subtitle="Project, delivery location, required dates, budget codes, or technical requirements."
                  />

                  <ContactCard
                    contact={contact}
                    onChange={(field, value) => setContact((c) => ({ ...c, [field]: value }))}
                    isAuthenticated={isAuthenticated}
                  />
                </div>

                <SummaryAside
                  title="Approval Summary"
                  lineCount={draft.items.length}
                  totalUnits={totalUnits}
                  sourceLabel="Procurement cart"
                  submitLabel="Submit for Approval"
                  submitting={submitting}
                  disabled={!draft.items.length}
                >
                  <div
                    className="flex items-start gap-2.5 p-3 rounded-xl mb-4 text-[12px] leading-relaxed"
                    style={{ background: "var(--bg-raised)", color: "var(--text-3)" }}
                  >
                    <Icon d={D.check} size={14} strokeWidth={2} className="shrink-0 mt-0.5 text-se-green" />
                    On approval this request becomes an order — you&apos;ll get a secure payment
                    link by email and in your account.
                  </div>
                </SummaryAside>

                <MobileActionBar
                  lineCount={draft.items.length}
                  totalUnits={totalUnits}
                  submitLabel="Submit for Approval"
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
