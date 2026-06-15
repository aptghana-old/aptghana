import * as React from "react";
import { Hr, Section, Text } from "@react-email/components";
import { BRAND, BaseLayout, CtaButton, styles } from "./base";
import { EmailItemsTable, NextSteps, RefHero } from "./parts";
import type { RfqCustomerPayload } from "../types";

export function RfqCustomerTemplate({
  name, company, rfqRef, trackUrl, items, message, currency, kind,
}: RfqCustomerPayload) {
  const isApproval = kind === "approval_request";
  return (
    <BaseLayout preview={`We've received your ${isApproval ? "procurement" : "quotation"} request ${rfqRef} — our team is on it.`}>
      <RefHero
        title={isApproval ? "Procurement Request Received" : "Quotation Request Received"}
        refLabel="Reference"
        refValue={rfqRef}
      />

      <Text style={styles.body1}>
        Hi {name}{company ? ` from ${company}` : ""}, thank you for your{" "}
        {isApproval ? "procurement request" : "request for quotation"}. Our engineering team has
        received it and will respond with {isApproval
          ? "itemized pricing for approval"
          : "a detailed, itemized quotation"} — <strong>same business day</strong> for requests
        submitted before 3 PM Ghana time.
      </Text>

      <Text style={{ ...styles.h2, fontSize: "17px" }}>Requested Products</Text>
      <EmailItemsTable items={items} currency={currency} />

      {message && (
        <Section
          style={{
            backgroundColor: BRAND.gray50,
            border: `1px solid ${BRAND.gray200}`,
            borderRadius: "8px",
            padding: "14px 16px",
          }}
        >
          <Text style={{ ...styles.body2, margin: "0", fontStyle: "italic" }}>“{message}”</Text>
        </Section>
      )}

      <Hr style={styles.hr} />

      <Text style={{ ...styles.h2, fontSize: "17px" }}>What happens next</Text>
      <NextSteps
        steps={isApproval
          ? [
              ["Review", "Our engineers review your list and check stock availability."],
              ["Pricing", "Every line is priced; discounts, tax and delivery are applied."],
              ["Approval", "Your request becomes an order with a secure payment link."],
              ["Delivery", "Pay online and track your order through delivery."],
            ]
          : [
              ["Review", "Our engineers review your requirements and check stock availability."],
              ["Quote", "You receive an itemized quotation with pricing and lead times."],
              ["Approve & pay", "Approve the quotation and pay securely online."],
              ["Delivery", "Products shipped nationwide or ready for collection."],
            ]}
      />

      <CtaButton href={trackUrl} label="Track Your Request" />

      <Hr style={styles.hr} />
      <Text style={styles.body2}>
        Need to add something or have an urgent requirement? Reply to this email or call our
        sales engineers at <a href="tel:+233302000000" style={styles.link}>+233 302 000 000</a>.
      </Text>
    </BaseLayout>
  );
}

export default RfqCustomerTemplate;
