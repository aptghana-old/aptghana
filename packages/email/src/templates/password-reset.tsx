import * as React from "react";
import { Text } from "@react-email/components";
import { AlertBanner, BaseLayout, CtaButton, styles } from "./base";
import type { PasswordResetPayload } from "../types";
import { STORE_URL } from "@apt/config";

export function PasswordResetTemplate({ name, resetUrl, expiresInMinutes }: PasswordResetPayload) {
  return (
    <BaseLayout preview="Reset your APT Ghana account password">
      <Text style={styles.h1}>Reset your password</Text>
      <Text style={styles.body1}>
        Hi {name}, we received a request to reset the password for your APT Ghana account. Click the button below to choose a new password.
      </Text>

      <CtaButton href={resetUrl} label="Reset Password" variant="primary" />

      <AlertBanner
        type="warning"
        message={`This link expires in ${expiresInMinutes} minutes. If you didn't request a password reset, you can safely ignore this email — your password will not be changed.`}
      />

      <Text style={styles.body2}>
        If the button above doesn't work, copy and paste this URL into your browser:
      </Text>
      <Text style={{ ...styles.body2, wordBreak: "break-all" as const, color: "#1a7a4a" }}>
        {resetUrl}
      </Text>

      <Text style={styles.body2}>
        For security, this link can only be used once. If you need to reset your password again, please visit the{" "}
        <a href={`${STORE_URL}/account/forgot-password`} style={styles.link}>forgot password</a> page.
      </Text>
    </BaseLayout>
  );
}

export default PasswordResetTemplate;
