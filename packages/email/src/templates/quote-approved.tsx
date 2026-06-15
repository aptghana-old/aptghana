import * as React from "react";
import { Hr, Section, Text } from "@react-email/components";
import { BRAND, BaseLayout, CtaButton, styles } from "./base";
import { EmailItemsTable, EmailTotals, RefHero, money } from "./parts";
import type { QuoteApprovedPayload } from "../types";

export function QuoteApprovedTemplate({
  name, company, quoteNumber, rfqRef, payUrl, items, totals, validUntil, quoteNote, kind, orderRef,
}: QuoteApprovedPayload) {
  const isApproval = kind === "approval_request" && Boolean(orderRef);
  return (
    <BaseLayout preview={`${isApproval ? `Your order ${orderRef} is approved` : `Your quotation ${quoteNumber} is approved`} — ${money(totals.grandTotal, totals.currency)}. Proceed to payment.`}>
      <RefHero
        title={isApproval ? "Your Order Is Approved" : "Your Quotation Is Approved"}
        refLabel={isApproval ? "Order No." : "Quote No."}
        refValue={isApproval ? (orderRef as string) : quoteNumber}
      />

      <Text style={styles.body1}>
        Hi {name}{company ? ` from ${company}` : ""}, good news — your request{" "}
        <strong>{rfqRef}</strong> has been reviewed and priced by our engineering team.{" "}
        {isApproval
          ? <>It is now order <strong>{orderRef}</strong> (quote {quoteNumber}), awaiting payment.</>
          : "Your quotation is now ready for payment."}
      </Text>

      <Text style={{ ...styles.h2, fontSize: "17px" }}>Quotation Summary</Text>
      <EmailItemsTable items={items} currency={totals.currency} showPrices />
      <EmailTotals totals={totals} />

      <Section
        style={{
          backgroundColor: "#fffbeb",
          border: "1px solid #fcd34d",
          borderRadius: "8px",
          padding: "12px 16px",
        }}
      >
        <Text style={{ color: "#92400e", fontSize: "13px", margin: "0" }}>
          This quotation is valid until <strong>{validUntil}</strong>. Pricing and stock are
          reserved until then.
        </Text>
      </Section>

      {quoteNote && (
        <>
          <Text style={{ ...styles.h2, fontSize: "17px", marginTop: "20px" }}>Note from our team</Text>
          <Text style={styles.body2}>{quoteNote}</Text>
        </>
      )}

      <CtaButton href={payUrl} label="Proceed to Payment" />

      <Text style={{ ...styles.small, textAlign: "center" as const }}>
        Secure payment via card, bank transfer, or mobile money — powered by Paystack.
      </Text>

      <Hr style={styles.hr} />
      <Text style={styles.body2}>
        Questions about this quotation? Reply to this email or call{" "}
        <a href="tel:+233302000000" style={styles.link}>+233 302 000 000</a> and reference{" "}
        <strong style={{ color: BRAND.gray700 }}>{quoteNumber}</strong>.
      </Text>
    </BaseLayout>
  );
}

export default QuoteApprovedTemplate;
