import bcrypt from "bcryptjs";
import crypto from "crypto";

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/** Returns a URL-safe random hex token (default 64 chars = 32 bytes) */
export function generateToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString("hex");
}

/** SHA-256 hash of a token — stored in DB; raw token is sent via email */
export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/** 6-digit numeric OTP for email verification flows */
export function generateNumericOTP(): string {
  return String(crypto.randomInt(100_000, 999_999));
}

const MIN_LEN = 8;
const HAS_UPPER = /[A-Z]/;
const HAS_LOWER = /[a-z]/;
const HAS_DIGIT = /\d/;
const HAS_SPECIAL = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/;

export function passwordStrength(password: string): {
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
  color: string;
} {
  let score = 0;
  if (password.length >= MIN_LEN) score++;
  if (HAS_UPPER.test(password) && HAS_LOWER.test(password)) score++;
  if (HAS_DIGIT.test(password)) score++;
  if (HAS_SPECIAL.test(password)) score++;

  const levels = [
    { label: "Too short", color: "bg-red-500" },
    { label: "Weak",      color: "bg-red-400" },
    { label: "Fair",      color: "bg-amber-400" },
    { label: "Good",      color: "bg-green-500" },
    { label: "Strong",    color: "bg-green-600" },
  ] as const;

  return { score: score as 0 | 1 | 2 | 3 | 4, ...levels[score] };
}

export function isPasswordValid(password: string): boolean {
  return (
    password.length >= MIN_LEN &&
    HAS_UPPER.test(password) &&
    HAS_LOWER.test(password) &&
    HAS_DIGIT.test(password)
  );
}
