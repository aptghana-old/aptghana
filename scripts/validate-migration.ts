#!/usr/bin/env tsx
/**
 * Validate the migration by comparing source and destination MongoDB instances
 * and checking asset URLs are reachable.
 *
 * Usage:
 *   ATLAS_URI="..." SELF_HOSTED_URI="..." tsx scripts/validate-migration.ts
 */

import "dotenv/config";
import { MongoClient } from "mongodb";

const ATLAS_URI = process.env.ATLAS_URI ?? "";
const SELF_URI  = process.env.SELF_HOSTED_URI ?? "";
const CHECK_URLS = process.argv.includes("--check-urls");

const COLLECTIONS = [
  "products_v2", "brands_v2", "categories_v2", "users_v2",
  "orders_v2", "quotes_v2", "attachments_v2",
] as const;

interface ValidationResult {
  collection: string;
  sourceCount:  number;
  destCount:    number;
  match:        boolean;
  missing:      number;
}

async function validateCounts(
  sourceDb: ReturnType<MongoClient["db"]>,
  destDb:   ReturnType<MongoClient["db"]>,
): Promise<ValidationResult[]> {
  const results: ValidationResult[] = [];

  for (const col of COLLECTIONS) {
    const [sourceCount, destCount] = await Promise.all([
      sourceDb.collection(col).countDocuments(),
      destDb.collection(col).countDocuments(),
    ]);

    results.push({
      collection:  col,
      sourceCount,
      destCount,
      match:       sourceCount === destCount,
      missing:     Math.max(0, sourceCount - destCount),
    });
  }

  return results;
}

async function checkAttachmentMigration(db: ReturnType<MongoClient["db"]>): Promise<void> {
  const coll = db.collection("attachments_v2");
  const withBuffer     = await coll.countDocuments({ data: { $exists: true } });
  const withStorageKey = await coll.countDocuments({ storageKey: { $exists: true } });
  const total          = await coll.countDocuments();

  console.log("\n  Attachment storage migration:");
  console.log(`    Total attachments:     ${total}`);
  console.log(`    With Buffer (legacy):  ${withBuffer} ${withBuffer > 0 ? "⚠ (run migrate-assets-to-minio --only-attachments)" : "✓"}`);
  console.log(`    With MinIO key:        ${withStorageKey}`);
}

async function sampleUrlCheck(db: ReturnType<MongoClient["db"]>): Promise<void> {
  if (!CHECK_URLS) return;
  console.log("\n  Sampling asset URLs (first 5 products with images)...");

  const products = await db.collection("products_v2")
    .find({ "images.main.url": { $exists: true, $ne: "" } }, { projection: { "images.main.url": 1, name: 1 } })
    .limit(5)
    .toArray();

  for (const p of products) {
    const url = ((p as Record<string, Record<string, { url?: string }>>).images?.main)?.url ?? "";
    if (!url) continue;
    try {
      const res = await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(5000) });
      const status = res.ok ? "✓" : `⚠ HTTP ${res.status}`;
      console.log(`    ${status} ${url.slice(0, 80)}`);
    } catch (err) {
      console.log(`    ✗ FAIL ${url.slice(0, 80)} — ${(err as Error).message}`);
    }
  }
}

async function main() {
  if (!SELF_URI) throw new Error("SELF_HOSTED_URI required");

  console.log("╔══════════════════════════════════════════════════════════╗");
  console.log("║   APT Ghana — Migration Validation                       ║");
  console.log("╚══════════════════════════════════════════════════════════╝");

  const clients: MongoClient[] = [];
  let sourceDb: ReturnType<MongoClient["db"]> | null = null;

  const destClient = await MongoClient.connect(SELF_URI);
  clients.push(destClient);
  const destDb = destClient.db("aptghana_v2");

  if (ATLAS_URI) {
    const sourceClient = await MongoClient.connect(ATLAS_URI);
    clients.push(sourceClient);
    sourceDb = sourceClient.db("aptghana_v2");
  }

  try {
    if (sourceDb) {
      console.log("\n  Document count comparison:");
      const results = await validateCounts(sourceDb, destDb);

      let allMatch = true;
      console.log(`\n  ${"Collection".padEnd(28)} ${"Atlas".padStart(8)} ${"Self".padStart(8)} ${"Status".padStart(8)}`);
      console.log("  " + "─".repeat(54));

      for (const r of results) {
        const status = r.match ? "✓ OK" : `⚠ -${r.missing}`;
        if (!r.match) allMatch = false;
        console.log(`  ${r.collection.padEnd(28)} ${String(r.sourceCount).padStart(8)} ${String(r.destCount).padStart(8)} ${status.padStart(8)}`);
      }

      if (allMatch) {
        console.log("\n  ✓ All collection counts match");
      } else {
        console.log("\n  ⚠ Some collections are missing documents — rerun migration");
      }
    }

    await checkAttachmentMigration(destDb);
    await sampleUrlCheck(destDb);

    // Index check
    console.log("\n  Checking indexes...");
    const productIndexes  = await destDb.collection("products_v2").indexes();
    const requiredIndexes = ["sku_unique", "slug_unique", "brand_idx", "status_idx"];
    const existingNames   = productIndexes.map((i) => i.name ?? "");
    for (const name of requiredIndexes) {
      const exists = existingNames.includes(name);
      console.log(`    ${exists ? "✓" : "✗"} ${name}`);
    }

  } finally {
    await Promise.all(clients.map((c) => c.close()));
  }

  console.log("\n✓ Validation complete");
}

main().catch((err) => {
  console.error("Validation failed:", err);
  process.exit(1);
});
