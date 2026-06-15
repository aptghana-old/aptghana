import * as React from "react";
import { Column, Hr, Row, Section, Text } from "@react-email/components";
import { BRAND, BaseLayout, CtaButton, InfoRow, styles } from "./base";
import { EmailItemsTable, RefHero } from "./parts";
import type { RfqSalesPayload } from "../types";

export function RfqSalesTemplate({
  rfqRef, reviewUrl, customer, items, message, source, currency, kind,
}: RfqSalesPayload) {
  const isApproval = kind === "approval_request";
  const sourceLabel =
    source === "single_product" ? "product page"
    : source === "custom" ? "RFQ form (includes unlisted products)"
    : "procurement cart";
  return (
    <BaseLayout preview={`New ${isApproval ? "procurement request" : "RFQ"} ${rfqRef} from ${customer.name}${customer.company ? ` (${customer.company})` : ""} — ${items.length} line item(s).`}>
      <RefHero
        title={isApproval ? "New Procurement Request" : "New RFQ Received"}
        refLabel="Reference"
        refValue={rfqRef}
      />

      <Text style={styles.body1}>
        A new {isApproval ? "request for approval" : "request for quotation"} was submitted via
        the {sourceLabel}. Review and price it in the admin dashboard
        {isApproval ? " — approving it creates an order awaiting payment." : "."}
      </Text>

      <Text style={{ ...styles.h2, fontSize: "17px" }}>Customer</Text>
      <Section
        style={{
          border: `1px solid ${BRAND.gray200}`,
          borderRadius: "8px",
          margin: "8px 0 16px",
          padding: "16px 20px",
        }}
      >
        <Row>
          <Column style={{ verticalAlign: "top" }}>
            <InfoRow label="Name" value={customer.name} />
            {customer.company && <InfoRow label="Company" value={customer.company} />}
            {customer.country && <InfoRow label="Country" value={customer.country} />}
          </Column>
          <Column style={{ verticalAlign: "top" }}>
            <InfoRow label="Email" value={customer.email} />
            {customer.phone && <InfoRow label="Phone" value={customer.phone} />}
            {customer.address && <InfoRow label="Address" value={customer.address} />}
          </Column>
        </Row>
      </Section>

      <Text style={{ ...styles.h2, fontSize: "17px" }}>Requested Products</Text>
      <EmailItemsTable items={items} currency={currency} />

      {message && (
        <>
          <Text style={{ ...styles.h2, fontSize: "17px" }}>Project Notes</Text>
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
        </>
      )}

      <CtaButton href={reviewUrl} label={isApproval ? "Review Request" : "Review RFQ"} />

      <Hr style={styles.hr} />
      <Text style={styles.small}>
        Same-day response target applies to RFQs received before 3:00 PM Ghana time.
      </Text>
    </BaseLayout>
  );
}

export default RfqSalesTemplate;
