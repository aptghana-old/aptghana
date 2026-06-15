import * as React from "react";
import { Hr, Text } from "@react-email/components";
import { AlertBanner, BaseLayout, CtaButton, styles } from "./base";
import type { TwoFAAlertPayload } from "../types";
import { EMAIL_SUPPORT } from "@apt/config";

export function TwoFAAlertTemplate({ name, action, timestamp, settingsUrl }: TwoFAAlertPayload) {
  const isEnabled = action === "enabled";

  return (
    <BaseLayout preview={`Two-factor authentication ${action} on your APT Ghana account`}>
      <Text style={styles.h1}>
        Two-factor authentication {isEnabled ? "enabled" : "disabled"}
      </Text>
      <Text style={styles.body1}>
        Hi {name}, two-factor authentication (2FA) was{" "}
        <strong>{action}</strong> on your APT Ghana account on{" "}
        <strong>{timestamp}</strong>.
      </Text>

      {isEnabled ? (
        <AlertBanner
          type="success"
          message="Great! Your account is now protected with an additional layer of security. You'll need your authenticator app each time you sign in."
        />
      ) : (
        <AlertBanner
          type="warning"
          message="Your account is now less secure. If you did not make this change, re-enable 2FA immediately and change your password."
        />
      )}

      <CtaButton
        href={settingsUrl}
        label={isEnabled ? "View Security Settings" : "Re-enable 2FA"}
        variant={isEnabled ? "primary" : "danger"}
      />

      <Hr style={styles.hr} />
      <Text style={styles.body2}>
        If you didn't make this change, secure your account immediately. Contact{" "}
        <a href={`mailto:${EMAIL_SUPPORT}`} style={styles.link}>{EMAIL_SUPPORT}</a> if you need help.
      </Text>
    </BaseLayout>
  );
}

export default TwoFAAlertTemplate;
