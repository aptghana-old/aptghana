import * as React from "react";
import { Hr, Section, Text } from "@react-email/components";
import { BRAND, BaseLayout, CtaButton, styles } from "./base";
import type { QuoteRequestPayload, QuoteItem } from "../types";

function QuoteLineItem({ item, currency }: { item: QuoteItem; currency: string }) {
  return (
    <Section
      style={{
        borderBottom: `1px solid ${BRAND.gray200}`,
        padding: "12px 0",
      }}
    >
      <Text style={{ color: BRAND.gray900, fontSize: "14px", fontWeight: "600", margin: "0 0 2px" }}>
        {item.description}
        {item.sku && <span style={{ color: BRAND.gray400, fontWeight: "400" }}> · SKU: {item.sku}</span>}
      </Text>
      <Text style={{ color: BRAND.gray500, fontSize: "13px", margin: "0" }}>
        Qty: {item.quantity}
        {item.targetPrice &&
          ` · Target: ${new Intl.NumberFormat("en-GH", { style: "currency", currency }).format(item.targetPrice)}`
        }
      </Text>
    </Section>
  );
}

export function QuoteRequestTemplate({ name, company, quoteRef, quoteUrl, items, message, currency }: QuoteRequestPayload) {
  return (
    <BaseLayout preview={`Your RFQ has been received — ${quoteRef}. We'll respond within 24 hours.`}>
      {/* Hero */}
      <Section
        style={{
          backgroundColor: BRAND.navy,
          borderRadius: "8px",
          margin: "0 0 24px",
          padding: "20px 24px",
        }}
      >
        <Text style={{ color: BRAND.white, fontSize: "20px", fontWeight: "700", margin: "0 0 4px" }}>
          Quote Request Received
        </Text>
        <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: "13px", margin: "0" }}>
          Reference: <strong style={{ color: BRAND.white }}>{quoteRef}</strong>
        </Text>
      </Section>

      <Text style={styles.body1}>
        Hi {name}{company ? ` from ${company}` : ""}, thank you for your enquiry. We've received your request for quotation and our team will respond within <strong>24 business hours</strong>.
      </Text>

      <Text style={{ ...styles.h2, fontSize: "17px" }}>Items Requested</Text>
      {items.map((item, i) => (
        <QuoteLineItem key={i} item={item} currency={currency} />
      ))}

      {message && (
        <>
          <Hr style={styles.hr} />
          <Text style={{ ...styles.h2, fontSize: "17px" }}>Your Message</Text>
          <Section
            style={{
              backgroundColor: BRAND.gray50,
              border: `1px solid ${BRAND.gray200}`,
              borderRadius: "8px",
              padding: "16px",
            }}
          >
            <Text style={{ ...styles.body2, margin: "0", fontStyle: "italic" }}>
              "{message}"
            </Text>
          </Section>
        </>
      )}

      <CtaButton href={quoteUrl} label="View Quote Request" />

      <Hr style={styles.hr} />
      <Text style={styles.body2}>
        Our sales team will prepare a detailed quote with pricing, availability, and lead times. For urgent requirements, call us at{" "}
        <a href="tel:+233302000000" style={styles.link}>+233 302 000 000</a>.
      </Text>
    </BaseLayout>
  );
}

export default QuoteRequestTemplate;
