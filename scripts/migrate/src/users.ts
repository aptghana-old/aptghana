/**
 * Migrate users: database.users → users_v2
 *
 * Legacy shape:
 *   { email, name, phone, company, businessType, accountType,
 *     address: string, password (bcrypt hash), favorites[], quotes[], orders[] }
 */

import mongoose from "mongoose";
import "dotenv/config";

const URI = process.env.MONGODB_URI ?? "";

const LegacySchema = new mongoose.Schema({}, { strict: false });
const NewSchema = new mongoose.Schema({}, { strict: false, timestamps: true });

async function migrateUsers() {
  await mongoose.connect(URI);
  const db = mongoose.connection.useDb("database");

  const Legacy = db.model("LegacyUser", LegacySchema, "users");
  const New = db.model("NewUser", NewSchema, "users_v2");

  const legacy = await Legacy.find({}).lean() as Record<string, unknown>[];
  console.log(`Found ${legacy.length} legacy users`);

  let migrated = 0;
  let skipped = 0;

  for (const user of legacy) {
    const email = (user.email as string | undefined)?.toLowerCase().trim();
    if (!email) { skipped++; continue; }

    const exists = await New.findOne({ email });
    if (exists) { skipped++; continue; }

    const rawAddress = (user.address as string | undefined) ?? "";
    const addressParts = rawAddress.split("\n").map((s) => s.trim()).filter(Boolean);

    const newUser = {
      email,
      passwordHash: user.password as string ?? "$2a$10$placeholder",
      emailVerified: !!(user.emailVerified),
      name: user.name as string ?? email,
      phone: user.phone as string | undefined,
      accountType: user.accountType as string ?? "personal",
      company: user.company as string | undefined,
      businessType: (user.businessType as string | undefined)?.toLowerCase().replace(/\s+/g, "-"),
      addresses: rawAddress
        ? [{
            label: "Primary",
            line1: addressParts[0] ?? rawAddress,
            city: "Accra",
            country: "GH",
            isDefault: true,
          }]
        : [],
      favorites: [],
      orderIds: [],
      quoteIds: [],
      status: "active",
      mfaEnabled: false,
    };

    await New.create(newUser);
    migrated++;
    console.log(`  ✓ ${email}`);
  }

  console.log(`\nUsers migration complete: ${migrated} migrated, ${skipped} skipped`);
  await mongoose.disconnect();
}

migrateUsers().catch((err) => { console.error(err); process.exit(1); });
