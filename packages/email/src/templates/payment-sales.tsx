import * as React from "react";
import { Hr, Section, Text } from "@react-email/components";
import { BRAND, BaseLayout, CtaButton, InfoRow, styles } from "./base";
import { RefHero, money } from "./parts";
import type { PaymentSalesPayload } from "../types";

export function PaymentSalesTemplate({
  quoteNumber, rfqRef, customerName, customerEmail, company, amount, currency,
  paymentReference, channel, paidAt, adminUrl,
}: PaymentSalesPayload) {
  return (
    <BaseLayout preview={`Quote ${quoteNumber} paid — ${money(amount, currency)} by ${customerName}.`}>
      <RefHero title="Quote Paid" refLabel="Quote No." refValue={quoteNumber} />

      <Text style={styles.body1}>
        Payment confirmed for quotation <strong>{quoteNumber}</strong> ({rfqRef}). The order is
        ready for fulfilment.
      </Text>

      <Section
        style={{
          border: `1px solid ${BRAND.gray200}`,
          borderRadius: "8px",
          margin: "16px 0",
          padding: "20px 24px",
        }}
      >
        <InfoRow label="Customer" value={`${customerName}${company ? ` — ${company}` : ""}`} />
        <InfoRow label="Email" value={customerEmail} />
        <InfoRow label="Amount" value={money(amount, currency)} />
        <InfoRow label="Payment reference" value={paymentReference} />
        {channel && <InfoRow label="Channel" value={channel} />}
        <InfoRow label="Paid at" value={paidAt} />
      </Section>

      <CtaButton href={adminUrl} label="Open Order in Admin" />

      <Hr style={styles.hr} />
      <Text style={styles.small}>
        This is an automated notification from the APT Ghana procurement workflow.
      </Text>
    </BaseLayout>
  );
}

export default PaymentSalesTemplate;
