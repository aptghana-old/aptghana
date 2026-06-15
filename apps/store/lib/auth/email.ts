import { emailService, type SendOptions } from "@apt/email";

const BASE_URL =
  process.env.AUTH_URL ??
  "http://localhost:3001";

export async function sendVerificationEmail(
  to: string,
  token: string,
  name: string,
  opts?: Pick<SendOptions, "userId">
) {
  return emailService.send(
    to,
    {
      kind: "verify-email",
      payload: {
        name,
        verificationUrl: `${BASE_URL}/api/auth/verify-email?token=${token}`,
      },
    },
    opts
  );
}

export async function sendPasswordResetEmail(
  to: string,
  token: string,
  name: string,
  opts?: Pick<SendOptions, "userId">
) {
  return emailService.send(
    to,
    {
      kind: "password-reset",
      payload: {
        name,
        resetUrl: `${BASE_URL}/account/reset-password?token=${token}`,
        expiresInMinutes: 10,
      },
    },
    opts
  );
}

export async function sendWelcomeEmail(
  to: string,
  name: string,
  accountType: "personal" | "business" = "personal",
  opts?: Pick<SendOptions, "userId" | "meta"> & { company?: string }
) {
  return emailService.send(
    to,
    {
      kind: "welcome",
      payload: {
        name,
        accountType,
        company: opts?.company,
        loginUrl: `${BASE_URL}/account`,
      },
    },
    { userId: opts?.userId, meta: opts?.meta }
  );
}

export async function sendOTPEmail(
  to: string,
  name: string,
  otp: string,
  purpose: string,
  opts?: Pick<SendOptions, "userId">
) {
  return emailService.send(
    to,
    {
      kind: "otp",
      payload: { name, otp, purpose, expiresInMinutes: 10 },
    },
    opts
  );
}

export async function sendSignInAlert(
  to: string,
  name: string,
  details: { device?: string; location?: string; ip?: string },
  opts?: Pick<SendOptions, "userId">
) {
  const timestamp = new Intl.DateTimeFormat("en-GB", {
    weekday: "short", day: "numeric", month: "long",
    hour: "2-digit", minute: "2-digit", timeZone: "UTC", timeZoneName: "short",
  }).format(new Date());

  return emailService.send(
    to,
    {
      kind: "signin-alert",
      payload: {
        name,
        timestamp,
        ...details,
        settingsUrl: `${BASE_URL}/account/settings`,
      },
    },
    opts
  );
}

export async function sendTwoFAAlert(
  to: string,
  name: string,
  action: "enabled" | "disabled",
  opts?: Pick<SendOptions, "userId">
) {
  const timestamp = new Intl.DateTimeFormat("en-GB", {
    weekday: "short", day: "numeric", month: "long",
    hour: "2-digit", minute: "2-digit", timeZone: "UTC", timeZoneName: "short",
  }).format(new Date());

  return emailService.send(
    to,
    {
      kind: "two-fa-alert",
      payload: {
        name,
        action,
        timestamp,
        settingsUrl: `${BASE_URL}/account/settings`,
      },
    },
    opts
  );
}
