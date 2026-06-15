import * as React from "react";
import { Text } from "@react-email/components";
import { AlertBanner, BaseLayout, CtaButton, styles } from "./base";
import type { AccountNotificationPayload } from "../types";
import { EMAIL_SUPPORT } from "@apt/config";

export function AccountNotificationTemplate({ name, title, body, ctaLabel, ctaUrl, type }: AccountNotificationPayload) {
  return (
    <BaseLayout preview={`${title} — APT Ghana Account`}>
      <Text style={styles.h1}>{title}</Text>
      <Text style={styles.body1}>Hi {name},</Text>

      <AlertBanner type={type} message={body} />

      {ctaUrl && ctaLabel && (
        <CtaButton
          href={ctaUrl}
          label={ctaLabel}
          variant={type === "alert" ? "danger" : type === "warning" ? "secondary" : "primary"}
        />
      )}

      <Text style={styles.body2}>
        If you have questions, contact us at{" "}
        <a href={`mailto:${EMAIL_SUPPORT}`} style={styles.link}>{EMAIL_SUPPORT}</a>.
      </Text>
    </BaseLayout>
  );
}

export default AccountNotificationTemplate;
