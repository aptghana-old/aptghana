/**
 * Bootstrap the first Super Admin account.
 *
 * Usage:
 *   MONGODB_URI=... SEED_ADMIN_EMAIL=admin@aptghana.com SEED_ADMIN_PASSWORD=... \
 *     npm run seed:admin
 *
 * Safe to run multiple times — exits without changes if a super_admin already exists.
 * On production, set MONGODB_URI in your shell (do NOT commit it).
 */
import "dotenv/config";
import mongoose from "mongoose";
import { hashPassword, isPasswordValid } from "../packages/auth/src/crypto";
import { AdminModel, connectDB } from "../packages/db/src";

const REQUIRED_ROLE = "super_admin" as const;

async function main() {
  const uri      = process.env.MONGODB_URI;
  const email    = (process.env.SEED_ADMIN_EMAIL ?? "admin@aptghana.com").trim().toLowerCase();
  const name     = process.env.SEED_ADMIN_NAME ?? "Super Admin";
  const username = process.env.SEED_ADMIN_USERNAME ?? "superadmin";
  const password = process.env.SEED_ADMIN_PASSWORD ?? "";

  if (!uri) {
    console.error("❌  MONGODB_URI is not set.");
    process.exit(1);
  }

  if (!password) {
    console.error("❌  SEED_ADMIN_PASSWORD is not set.");
    process.exit(1);
  }

  if (!isPasswordValid(password)) {
    console.error(
      "❌  Password is too weak.\n" +
      "    Must be at least 8 characters with uppercase, lowercase, and a number.",
    );
    process.exit(1);
  }

  await connectDB();

  // Idempotency check — don't create a second super admin
  const existing = await AdminModel.findOne({ role: REQUIRED_ROLE }).lean();
  if (existing) {
    console.log(`✅  Super admin already exists: ${(existing as { email: string }).email}`);
    await mongoose.disconnect();
    return;
  }

  // Check for email collision with any role
  const collision = await AdminModel.findOne({ email }).lean();
  if (collision) {
    console.error(`❌  An admin with email "${email}" already exists (role: ${(collision as { role: string }).role}).`);
    await mongoose.disconnect();
    process.exit(1);
  }

  const passwordHash = await hashPassword(password);

  await AdminModel.create({
    username,
    email,
    passwordHash,
    name,
    role:        REQUIRED_ROLE,
    permissions: [],
    status:      "active",
  });

  console.log(`\n✅  Super admin created successfully`);
  console.log(`    Email:    ${email}`);
  console.log(`    Name:     ${name}`);
  console.log(`    Role:     ${REQUIRED_ROLE}`);
  console.log(`\n    Sign in at ${process.env.AUTH_URL ?? "https://admin-v2.aptghana.com"}/login\n`);

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("❌  Seed failed:", err.message);
  process.exit(1);
});
