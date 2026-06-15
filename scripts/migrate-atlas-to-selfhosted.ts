#!/usr/bin/env tsx
/**
 * Migrate all collections from MongoDB Atlas to self-hosted MongoDB.
 *
 * Usage:
 *   ATLAS_URI="mongodb+srv://..." SELF_HOSTED_URI="mongodb://..." tsx scripts/migrate-atlas-to-selfhosted.ts
 *
 * Flags:
 *   --dry-run      Print counts only, do not write
 *   --collection   Migrate a single collection (e.g. --collection=products_v2)
 *   --drop         Drop destination collection before inserting (default: upsert)
 */

import "dotenv/config";
import { MongoClient, type Db } from "mongodb";

const ATLAS_URI = process.env.ATLAS_URI ?? process.env.MONGODB_URI ?? "";
const SELF_URI  = process.env.SELF_HOSTED_URI ?? "";

const DRY_RUN    = process.argv.includes("--dry-run");
const DROP_FIRST = process.argv.includes("--drop");
const SINGLE_COL = process.argv.find((a) => a.startsWith("--collection="))?.split("=")[1];

const COLLECTIONS = [
  "products_v2",
  "brands_v2",
  "categories_v2",
  "users_v2",
  "admins_v2",
  "orders_v2",
  "quotes_v2",
  "payments_v2",
  "transactions_v2",
  "attachments_v2",
  "audit_logs",
  "analytics_v2",
  "emaillogs",
  "industries",
  "resources",
  "services",
  "company_pages",
  "company_stats",
  "site_pages",
  "homepage_configs",
  "homepage_history",
] as const;

const BATCH_SIZE = 500;

interface MigrationReport {
  collection: string;
  source: number;
  inserted: number;
  skipped: number;
  errors: number;
  durationMs: number;
}

async function migrateCollection(
  sourceDb: Db,
  destDb: Db,
  collectionName: string,
): Promise<MigrationReport> {
  const start = Date.now();
  const sourceColl = sourceDb.collection(collectionName);
  const destColl   = destDb.collection(collectionName);

  const totalSource = await sourceColl.countDocuments();
  console.log(`\n  ${collectionName}: ${totalSource} documents`);

  if (DRY_RUN) {
    return { collection: collectionName, source: totalSource, inserted: 0, skipped: 0, errors: 0, durationMs: 0 };
  }

  if (DROP_FIRST) {
    await destColl.drop().catch(() => {}); // ignore if doesn't exist
    console.log(`    Dropped existing ${collectionName}`);
  }

  let inserted = 0;
  let skipped  = 0;
  let errors   = 0;
  let processed = 0;

  const cursor = sourceColl.find({});

  while (await cursor.hasNext()) {
    const batch: Document[] = [];
    while (batch.length < BATCH_SIZE && await cursor.hasNext()) {
      const doc = await cursor.next();
      if (doc) batch.push(doc as unknown as Document);
    }
    if (batch.length === 0) break;

    try {
      const ops = batch.map((doc) => ({
        replaceOne: {
          filter: { _id: (doc as Record<string, unknown>)._id },
          replacement: doc,
          upsert: true,
        },
      }));

      const result = await destColl.bulkWrite(ops as Parameters<typeof destColl.bulkWrite>[0], {
        ordered: false,
      });

      inserted += (result.upsertedCount ?? 0) + (result.modifiedCount ?? 0);
      skipped  += result.matchedCount ?? 0;
    } catch (err) {
      console.error(`    Error in batch (${collectionName}):`, err);
      errors += batch.length;
    }

    processed += batch.length;
    const pct = Math.round((processed / totalSource) * 100);
    process.stdout.write(`\r    Progress: ${processed}/${totalSource} (${pct}%)   `);
  }

  console.log(`\n    Done: ${inserted} inserted/updated, ${skipped} unchanged, ${errors} errors`);

  return {
    collection: collectionName,
    source: totalSource,
    inserted,
    skipped,
    errors,
    durationMs: Date.now() - start,
  };
}

async function main() {
  if (!ATLAS_URI) throw new Error("ATLAS_URI or MONGODB_URI environment variable required");
  if (!SELF_URI)  throw new Error("SELF_HOSTED_URI environment variable required");

  console.log("╔══════════════════════════════════════════════════════════╗");
  console.log("║   APT Ghana — MongoDB Atlas → Self-Hosted Migration      ║");
  console.log("╚══════════════════════════════════════════════════════════╝");
  console.log(`Mode: ${DRY_RUN ? "DRY RUN" : DROP_FIRST ? "DROP + INSERT" : "UPSERT"}`);
  if (SINGLE_COL) console.log(`Collection filter: ${SINGLE_COL}`);

  const [sourceClient, destClient] = await Promise.all([
    MongoClient.connect(ATLAS_URI),
    MongoClient.connect(SELF_URI),
  ]);

  try {
    const sourceDb = sourceClient.db("aptghana_v2");
    const destDb   = destClient.db("aptghana_v2");

    const collections = SINGLE_COL
      ? COLLECTIONS.filter((c) => c === SINGLE_COL)
      : [...COLLECTIONS];

    if (collections.length === 0) {
      throw new Error(`Unknown collection: ${SINGLE_COL}. Valid: ${COLLECTIONS.join(", ")}`);
    }

    const startTime = Date.now();
    const reports: MigrationReport[] = [];

    for (const col of collections) {
      const report = await migrateCollection(sourceDb, destDb, col);
      reports.push(report);
    }

    const totalMs = Date.now() - startTime;

    console.log("\n\n════════════════════════════════════════════════════════════");
    console.log("MIGRATION SUMMARY");
    console.log("════════════════════════════════════════════════════════════");
    console.log(`${"Collection".padEnd(30)} ${"Source".padStart(8)} ${"Written".padStart(8)} ${"Errors".padStart(7)}`);
    console.log("─".repeat(56));

    let totalSource  = 0;
    let totalWritten = 0;
    let totalErrors  = 0;

    for (const r of reports) {
      totalSource  += r.source;
      totalWritten += r.inserted;
      totalErrors  += r.errors;
      const status = r.errors > 0 ? "⚠" : "✓";
      console.log(
        `${status} ${r.collection.padEnd(29)} ${String(r.source).padStart(8)} ${String(r.inserted).padStart(8)} ${String(r.errors).padStart(7)}`
      );
    }

    console.log("─".repeat(56));
    console.log(`  ${"TOTAL".padEnd(29)} ${String(totalSource).padStart(8)} ${String(totalWritten).padStart(8)} ${String(totalErrors).padStart(7)}`);
    console.log(`\nCompleted in ${(totalMs / 1000).toFixed(1)}s`);

    if (totalErrors > 0) {
      console.warn(`\n⚠  ${totalErrors} errors occurred. Review logs above.`);
      process.exit(1);
    }

    console.log("\n✓ Migration complete");
  } finally {
    await Promise.all([sourceClient.close(), destClient.close()]);
  }
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
