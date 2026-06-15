import * as React from "react";
import { Hr, Section, Text } from "@react-email/components";
import { BRAND, BaseLayout, CtaButton, InfoRow, styles } from "./base";
import { NextSteps, RefHero, money } from "./parts";
import type { PaymentCustomerPayload } from "../types";

export function PaymentCustomerTemplate({
  name, quoteNumber, amount, currency, paymentReference, channel, paidAt, orderUrl,
}: PaymentCustomerPayload) {
  return (
    <BaseLayout preview={`Payment received for ${quoteNumber} — ${money(amount, currency)}. Thank you!`}>
      <RefHero title="Payment Received" refLabel="Quote No." refValue={quoteNumber} />

      <Text style={styles.body1}>
        Hi {name}, we've received your payment — thank you. This email is your receipt; please
        keep it for your records.
      </Text>

      {/* Receipt */}
      <Section
        style={{
          border: `1px solid ${BRAND.gray200}`,
          borderRadius: "8px",
          margin: "16px 0",
          padding: "20px 24px",
        }}
      >
        <Text
          style={{
            color: BRAND.greenDark,
            fontSize: "28px",
            fontWeight: "700",
            margin: "0 0 14px",
            textAlign: "center" as const,
          }}
        >
          {money(amount, currency)}
        </Text>
        <InfoRow label="Transaction reference" value={paymentReference} />
        <InfoRow label="Quote" value={quoteNumber} />
        {channel && <InfoRow label="Payment method" value={channel} />}
        <InfoRow label="Date" value={paidAt} />
      </Section>

      <Text style={{ ...styles.h2, fontSize: "17px" }}>What happens next</Text>
      <NextSteps
        steps={[
          ["Order confirmed", "Your order has entered processing with our fulfilment team."],
          ["Preparation", "Items are picked, tested where applicable, and packed."],
          ["Delivery", "We'll notify you when your order ships or is ready for collection."],
        ]}
      />

      <CtaButton href={orderUrl} label="View Your Order" />

      <Hr style={styles.hr} />
      <Text style={styles.body2}>
        Need help with this payment? Reply to this email or call{" "}
        <a href="tel:+233302000000" style={styles.link}>+233 302 000 000</a>.
      </Text>
    </BaseLayout>
  );
}

export default PaymentCustomerTemplate;
