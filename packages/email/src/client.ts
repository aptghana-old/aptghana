import { Resend } from "resend";
import { EMAIL_NOREPLY, STORE_URL } from "@apt/config";

let _client: Resend | null = null;

export function getResendClient(): Resend {
  if (!_client) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error(
        "[apt/email] RESEND_API_KEY is not set. " +
        "Add it to your .env.local file. " +
        "In development, emails will still log to console as a fallback."
      );
    }
    _client = new Resend(apiKey);
  }
  return _client;
}

export const DEFAULT_FROM =
  process.env.EMAIL_FROM ??
  process.env.SMTP_FROM ??
  `APT Ghana <${EMAIL_NOREPLY}>`;

export const BASE_URL =
  process.env.AUTH_URL ??
  process.env.NEXTAUTH_URL ??
  process.env.NEXT_PUBLIC_APP_URL ??
  STORE_URL;
