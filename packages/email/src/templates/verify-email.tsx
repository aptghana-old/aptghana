import * as React from "react";
import { Text } from "@react-email/components";
import { AlertBanner, BaseLayout, CtaButton, styles } from "./base";
import type { VerifyEmailPayload } from "../types";

export function VerifyEmailTemplate({ name, verificationUrl }: VerifyEmailPayload) {
  return (
    <BaseLayout preview="Verify your email address to activate your APT Ghana account">
      <Text style={styles.h1}>Verify your email address</Text>
      <Text style={styles.body1}>
        Hi {name}, thanks for creating an account with APT Ghana. Please verify your email address to activate your account and get access to our full product catalogue.
      </Text>
      <CtaButton href={verificationUrl} label="Verify Email Address" />
      <AlertBanner type="warning" message="This link expires in 24 hours. If you didn't create this account, you can safely ignore this email." />
      <Text style={styles.body2}>
        If the button above doesn't work, copy and paste this URL into your browser:
      </Text>
      <Text style={{ ...styles.body2, wordBreak: "break-all" as const, color: "#1a7a4a" }}>
        {verificationUrl}
      </Text>
    </BaseLayout>
  );
}

export default VerifyEmailTemplate;
