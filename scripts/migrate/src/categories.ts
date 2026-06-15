/**
 * Migrate categories: database.categories → categories_v2
 *
 * Legacy shape:
 *   { id, name, description, longDescription, image, parent: ObjectId,
 *     categoryType: "Group"|"Category"|"Subcategory"|"Range", url, benefits, bulletPoints }
 *
 * New shape: Category (see @apt/types)
 */

import mongoose from "mongoose";
import "dotenv/config";
import { STORE_URL } from "@apt/config";

const URI = process.env.MONGODB_URI ?? "";

const LegacySchema = new mongoose.Schema({}, { strict: false });
const NewSchema = new mongoose.Schema({}, { strict: false, timestamps: true });

const levelMap: Record<string, string> = {
  Group:      "group",
  Category:   "category",
  Subcategory: "subcategory",
  Range:      "range",
};

async function migrateCategories() {
  await mongoose.connect(URI);
  const db = mongoose.connection.useDb("database");

  const Legacy = db.model("LegacyCat", LegacySchema, "categories");
  const New = db.model("NewCat", NewSchema, "categories_v2");

  const legacy = await Legacy.find({}).lean() as Record<string, unknown>[];
  console.log(`Found ${legacy.length} legacy categories`);

  // Build a map from legacy _id to new _id for parent resolution
  const idMap = new Map<string, mongoose.Types.ObjectId>();
  let migrated = 0;

  // First pass: create all categories without ancestors
  for (const cat of legacy) {
    const legacyId = cat._id as { toString(): string };
    const rawId = (cat.id as string | undefined) ?? "";
    const slug = rawId.toLowerCase().trim() || (cat.name as string).toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

    const exists = await New.findOne({ slug });
    if (exists) {
      idMap.set(legacyId.toString(), exists._id as mongoose.Types.ObjectId);
      continue;
    }

    const doc = await New.create({
      slug,
      legacyId: rawId,
      name: cat.name as string,
      shortDescription: (cat.description as string | undefined) ?? "",
      description: (cat.longDescription as string | undefined) ?? (cat.description as string | undefined) ?? "",
      level: levelMap[(cat.categoryType as string | undefined) ?? "Group"] ?? "group",
      image: cat.image
        ? { url: (cat.image as { preview?: string }).preview ?? "", alt: cat.name as string }
        : undefined,
      benefits: (cat.benefits as { title: string; value: string }[] | undefined) ?? [],
      bulletPoints: (cat.bulletPoints as string[] | undefined) ?? [],
      isFeatured: (cat.special as boolean | undefined) ?? false,
      productCount: 0,
      status: "active",
      seo: {
        title: `${cat.name as string} | APT Ghana`,
        description: (cat.description as string | undefined) ?? "",
        keywords: [(cat.name as string).toLowerCase()],
        canonicalUrl: `${STORE_URL}${(cat.url as string | undefined) ?? ""}`,
      },
    });

    idMap.set(legacyId.toString(), doc._id as mongoose.Types.ObjectId);
    migrated++;
  }

  // Second pass: set parent and ancestors
  for (const cat of legacy) {
    if (!cat.parent) continue;
    const legacyId = (cat._id as { toString(): string }).toString();
    const parentLegacyId = (cat.parent as { toString(): string }).toString();
    const newId = idMap.get(legacyId);
    const parentNewId = idMap.get(parentLegacyId);
    if (!newId || !parentNewId) continue;

    await New.updateOne({ _id: newId }, {
      $set: { parentId: parentNewId, ancestors: [parentNewId] },
    });
  }

  console.log(`\nCategories migration complete: ${migrated} migrated`);
  await mongoose.disconnect();
}

migrateCategories().catch((err) => { console.error(err); process.exit(1); });
