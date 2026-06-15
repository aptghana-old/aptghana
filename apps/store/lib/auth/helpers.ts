/**
 * Re-exports from @apt/auth so store API routes have a stable local import path.
 * All actual implementation lives in packages/auth/src/crypto.ts — do not
 * duplicate logic here. Any security changes (e.g. bcrypt rounds increase) only
 * need to be made in the shared package.
 */
export {
  hashPassword,
  verifyPassword,
  generateToken,
  hashToken,
  generateNumericOTP,
  passwordStrength,
  isPasswordValid,
} from "@apt/auth";
