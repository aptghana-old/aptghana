/**
 * Migrate brands: database.brands → brands_v2
 *
 * Legacy shape:
 *   { slug, name, description, logo: string, isMain: boolean }
 *
 * New shape:
 *   Brand (see @apt/types)
 */

import mongoose from "mongoose";
import "dotenv/config";
import { SITE_URL } from "@apt/config";

const URI = process.env.MONGODB_URI ?? "";

const LegacyBrandSchema = new mongoose.Schema({}, { strict: false });
const NewBrandSchema = new mongoose.Schema(
  {},
  { strict: false, timestamps: true },
);

async function migrateBrands() {
  await mongoose.connect(URI);
  const db = mongoose.connection.useDb("database");

  const LegacyBrand = db.model("LegacyBrand", LegacyBrandSchema, "brands");
  const NewBrand = db.model("NewBrand", NewBrandSchema, "brands_v2");

  const legacyBrands = (await LegacyBrand.find({}).lean()) as Record<
    string,
    unknown
  >[];
  console.log(`Found ${legacyBrands.length} legacy brands`);

  let migrated = 0;
  let skipped = 0;

  for (const brand of legacyBrands) {
    const slug = (brand.slug as string | undefined)?.toLowerCase().trim();
    if (!slug) {
      skipped++;
      continue;
    }

    const exists = await NewBrand.findOne({ slug });
    if (exists) {
      skipped++;
      continue;
    }

    // Normalize logo path
    const rawLogo = (brand.logo as string | undefined) ?? "";
    const logoUrl = rawLogo.startsWith("http")
      ? rawLogo
      : `${SITE_URL}${rawLogo}`;

    const newBrand = {
      slug,
      name: brand.name as string,
      shortDescription: ((brand.description as string | undefined) ?? "").slice(
        0,
        250,
      ),
      description: (brand.description as string) ?? "",
      logo: { url: logoUrl, alt: `${brand.name as string} logo` },
      isPartner: (brand.isMain as boolean | undefined) ?? false,
      isFeatured: (brand.isMain as boolean | undefined) ?? false,
      productCount: 0,
      status: "active",
      seo: {
        title: `${brand.name as string} Products in Ghana | APT Ghana`,
        description: ((brand.description as string | undefined) ?? "").slice(
          0,
          160,
        ),
        keywords: [
          brand.name as string,
          "industrial products Ghana",
          (brand.name as string).toLowerCase(),
        ],
      },
      displayOrder: 0,
    };

    await NewBrand.create(newBrand);
    migrated++;
    console.log(`  ✓ ${brand.name as string}`);
  }

  console.log(
    `\nBrands migration complete: ${migrated} migrated, ${skipped} skipped`,
  );
  await mongoose.disconnect();
}

migrateBrands().catch((err) => {
  console.error(err);
  process.exit(1);
});
