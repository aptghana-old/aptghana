import { generateSecret, verify as totpVerify, generateURI } from "otplib";

export function generateMfaSecret(): string {
  return generateSecret();
}

export function generateMfaUri(
  issuer: string,
  label: string,
  secret: string,
): string {
  return generateURI({ issuer, label, secret });
}

export async function verifyMfaOtp(
  token: string,
  secret: string,
): Promise<boolean> {
  try {
    const result = await totpVerify({ token: token.trim(), secret });
    return result.valid;
  } catch {
    return false;
  }
}
