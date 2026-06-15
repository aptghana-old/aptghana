import * as React from "react";
import { Hr, Section, Text } from "@react-email/components";
import { BRAND, AlertBanner, BaseLayout, CtaButton, InfoRow, styles } from "./base";
import type { SignInAlertPayload } from "../types";

export function SignInAlertTemplate({ name, timestamp, device, location, ip, settingsUrl }: SignInAlertPayload) {
  return (
    <BaseLayout preview={`New sign-in to your APT Ghana account on ${timestamp}`}>
      <Text style={styles.h1}>New sign-in detected</Text>
      <Text style={styles.body1}>
        Hi {name}, we noticed a new sign-in to your APT Ghana account. If this was you, no action is needed.
      </Text>

      <Section
        style={{
          backgroundColor: BRAND.gray50,
          border: `1px solid ${BRAND.gray200}`,
          borderRadius: "8px",
          margin: "20px 0",
          padding: "20px 24px",
        }}
      >
        <InfoRow label="Time" value={timestamp} />
        {device   && <InfoRow label="Device"   value={device} />}
        {location && <InfoRow label="Location" value={location} />}
        {ip       && <InfoRow label="IP Address" value={ip} />}
      </Section>

      <AlertBanner
        type="alert"
        message="If you don't recognise this sign-in, secure your account immediately by changing your password and enabling two-factor authentication."
      />

      <CtaButton href={settingsUrl} label="Review Account Security" variant="danger" />

      <Hr style={styles.hr} />
      <Text style={styles.body2}>
        You can manage your sign-in alerts and security settings at any time from your{" "}
        <a href={settingsUrl} style={styles.link}>account settings</a>.
      </Text>
    </BaseLayout>
  );
}

export default SignInAlertTemplate;
