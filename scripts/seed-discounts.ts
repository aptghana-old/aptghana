#!/usr/bin/env tsx
/**
 * Seed discounts across a varied spread of active products.
 *
 * Tiers:
 *   10%  — entry-level accessories & wiring devices (listPrice < 500)
 *   15%  — mid-range protection & control gear (listPrice 500–5 000)
 *   20%  — drive & soft-starter range (listPrice 5 000–50 000)
 *   25%  — clearance: high-value discontinued / slow-moving items
 *   30%  — deep clearance: flagged isClearance = true
 *
 * After updating MongoDB, call the reindex script to sync Meilisearch.
 */

import "dotenv/config";
import { MongoClient, ObjectId } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI ?? "";
const DB_NAME     = "aptghana_v2";
const COLL        = "products_v2";

interface DiscountRule {
  label:    string;
  filter:   Record<string, unknown>;
  limit:    number;
  discount: number;
  clearance?: boolean;
}

const RULES: DiscountRule[] = [
  {
    label:    "10% — accessories & wiring devices (listPrice < 500)",
    filter:   { "pricing.listPrice": { $gt: 0, $lt: 500 } },
    limit:    180,
    discount: 10,
  },
  {
    label:    "15% — protection & control gear (listPrice 500–5 000)",
    filter:   { "pricing.listPrice": { $gte: 500, $lt: 5000 } },
    limit:    120,
    discount: 15,
  },
  {
    label:    "20% — drive & soft-starter range (listPrice 5 000–50 000)",
    filter:   { "pricing.listPrice": { $gte: 5000, $lt: 50000 } },
    limit:    60,
    discount: 20,
  },
  {
    label:    "25% — high-value clearance lines (listPrice ≥ 50 000)",
    filter:   { "pricing.listPrice": { $gte: 50000 } },
    limit:    20,
    discount: 25,
    clearance: true,
  },
  {
    label:    "30% — deep clearance: brevini hydraulics (slow-moving stock)",
    filter:   { brandSlug: "brevini" },
    limit:    40,
    discount: 30,
    clearance: true,
  },
];

async function main() {
  if (!MONGODB_URI) throw new Error("MONGODB_URI is not set");

  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const coll = client.db(DB_NAME).collection(COLL);

  console.log("╔══════════════════════════════════════════════════════════╗");
  console.log("║   APT Ghana — Seeding Product Discounts                  ║");
  console.log("╚══════════════════════════════════════════════════════════╝\n");

  let totalUpdated = 0;

  for (const rule of RULES) {
    // Find IDs matching this tier that don't already have a discount set
    const docs = await coll
      .find(
        { status: "active", discount: { $eq: 0 }, ...rule.filter },
        { projection: { _id: 1 } }
      )
      .limit(rule.limit)
      .toArray();

    if (docs.length === 0) {
      console.log(`  [skip] ${rule.label} — no matching products`);
      continue;
    }

    const ids = docs.map((d) => d._id as ObjectId);

    const updateDoc: Record<string, unknown> = {
      $set: { discount: rule.discount, updatedAt: new Date() },
    };
    if (rule.clearance) {
      (updateDoc.$set as Record<string, unknown>).isClearance = true;
    }

    const result = await coll.updateMany({ _id: { $in: ids } }, updateDoc);
    totalUpdated += result.modifiedCount;

    console.log(`  ✓ ${String(result.modifiedCount).padStart(3)} products  ${rule.label}`);
  }

  console.log(`\n  Total updated: ${totalUpdated} products`);
  await client.close();
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
