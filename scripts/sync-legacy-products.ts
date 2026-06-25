#!/usr/bin/env tsx
/**
 * sync-legacy-products.ts
 *
 * One-way sync from the legacy MongoDB (Atlas) into aptghana_v2.
 * Populates documents, drawings (as drawing-type docs), and related product
 * ObjectId arrays (relatedProducts + accessories) for every product that can
 * be matched by supplierRef.
 *
 * Safe to run multiple times — uses $set so it overwrites with the same data.
 *
 * Usage:
 *   npx tsx scripts/sync-legacy-products.ts
 *   npx tsx scripts/sync-legacy-products.ts --dry-run   (preview without writing)
 */

import { MongoClient, ObjectId } from "mongodb";

// ── Connection strings ────────────────────────────────────────────────────────
const SOURCE_URI = "mongodb+srv://fbenson185_db_user:rRRSrOQ5YL9La56i@cluster0.d9bnrnt.mongodb.net/database";
const TARGET_URI = "mongodb://aptghana_app:bb66ed9c1753dc0ee22e24ec0203162f8dc5a3da@167.233.36.110:27017/aptghana_v2?authSource=aptghana_v2";

const SOURCE_DB  = "database";
const TARGET_DB  = "aptghana_v2";
const SOURCE_COL = "products";
const TARGET_COL = "products_v2";

const BATCH_SIZE = 150;
const DRY_RUN    = process.argv.includes("--dry-run");

// ── Document type inference ───────────────────────────────────────────────────
function inferDocType(title = ""): string {
  const t = title.toLowerCase();
  if (t.includes("data sheet") || t.includes("datasheet"))                          return "datasheet";
  if (t.includes("instruction") || t.includes("user guide") || t.includes("manual")) return "manual";
  if (t.includes("cad") || t.includes("drawing"))                                   return "drawing";
  if (t.includes("brochure") || t.includes("catalogue") || t.includes("catalog"))  return "catalogue";
  if (t.includes("environmental") || t.includes("compliance") || t.includes("certificate")) return "compliance";
  return "datasheet";
}

// ── Related group label → accessories or relatedProducts ─────────────────────
// "Accessories", "Add-ons", "Auxiliaries", "Spare parts", "Mounting", etc.
// all map to accessories. Main functional variants map to relatedProducts.
const ACCESSORY_LABELS = new Set([
  "accessories", "add-ons", "auxiliaries", "spare parts", "options",
  "mounting", "control mechanisms", "cables", "communication",
  "communication modules", "interface connections", "wireless sensors",
  "end connections", "colour options", "sensors", "actuators", "transformers",
  "boxes", "marking accessories", "protective cover", "covers",
  "remote control auxiliaries", "residual current devices",
  "addons",
  // title-style variants
  "this product is compatible with",
]);

function classifyGroup(group: { label?: string; title?: string }): "accessories" | "relatedProducts" {
  const raw = (group.label ?? group.title ?? "").toLowerCase().replace(/\s+/g, " ").trim();
  return ACCESSORY_LABELS.has(raw) ? "accessories" : "relatedProducts";
}

// ── Extract first absolute img src from HTML ──────────────────────────────────
function extractImgUrl(html: string): string | null {
  const m = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (!m) return null;
  const url = m[1];
  // Skip local/proxied URLs — those images aren't in the new system
  if (!url.startsWith("http")) return null;
  return url;
}

// ── Types matching old DB shape ───────────────────────────────────────────────
interface OldDocument { title?: string; url?: string }
interface OldDrawing  { title?: string; content?: string }
interface OldRelRef   { supplierRef?: string }
interface OldRelGroup { label?: string; title?: string; products?: OldRelRef[] }
interface OldProduct  {
  _id: ObjectId;
  supplierRef?: string;
  documents?:      OldDocument[];
  drawings?:       OldDrawing[];
  relatedProducts?: OldRelGroup[];
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  if (DRY_RUN) console.log("🔍  DRY RUN — no writes will be made\n");

  const srcClient = new MongoClient(SOURCE_URI, { serverSelectionTimeoutMS: 12000 });
  const tgtClient = new MongoClient(TARGET_URI, { serverSelectionTimeoutMS: 12000 });

  try {
    await Promise.all([srcClient.connect(), tgtClient.connect()]);
    console.log("✓ Connected to both databases");

    const srcCol = srcClient.db(SOURCE_DB).collection<OldProduct>(SOURCE_COL);
    const tgtCol = tgtClient.db(TARGET_DB).collection(TARGET_COL);

    // ── Build supplierRef → ObjectId index from new DB ────────────────────
    console.log("\nIndexing new DB products by supplierRef…");
    const newProds = await tgtCol
      .find({}, { projection: { _id: 1, supplierRef: 1 } })
      .toArray();

    const refIdx = new Map<string, ObjectId>();
    for (const p of newProds) {
      const ref = (p as any).supplierRef;
      if (ref) refIdx.set(String(ref).toLowerCase(), p._id);
    }
    console.log(`  → ${refIdx.size} products indexed`);

    // ── Fetch source products that have something to sync ─────────────────
    const query = {
      $or: [
        { "documents.0":  { $exists: true } },
        { "drawings.0":   { $exists: true } },
        { relatedProducts: { $elemMatch: { "products.0": { $exists: true } } } },
      ],
    };

    const total = await srcCol.countDocuments(query);
    console.log(`Found ${total} legacy products to process\n`);

    let processed = 0, updated = 0, skipped = 0, noMatch = 0;
    const stats = { docs: 0, drawings: 0, related: 0, accessories: 0 };

    for (let offset = 0; offset < total; offset += BATCH_SIZE) {
      const batch = await srcCol.find(query).skip(offset).limit(BATCH_SIZE).toArray();
      const ops: Parameters<typeof tgtCol.bulkWrite>[0] = [];

      for (const src of batch) {
        const key      = String(src.supplierRef ?? "").toLowerCase();
        const targetId = refIdx.get(key);
        if (!targetId) { noMatch++; continue; }

        const $set: Record<string, unknown> = {};

        // ── Documents ────────────────────────────────────────────────────
        const docList: object[] = [];

        if (Array.isArray(src.documents)) {
          for (const d of src.documents) {
            if (!d.url?.startsWith("http")) continue;
            docList.push({
              type:     inferDocType(d.title),
              title:    d.title ?? "Document",
              url:      d.url,
              language: "en",
            });
          }
        }

        if (Array.isArray(src.drawings)) {
          for (const drw of src.drawings) {
            const content = typeof drw.content === "string" ? drw.content : "";
            const url = extractImgUrl(content);
            if (!url) continue;
            docList.push({
              type:     "drawing",
              title:    drw.title ?? "Dimensional Drawing",
              url,
              language: "en",
            });
          }
        }

        if (docList.length) {
          $set.documents = docList;
          stats.docs     += docList.filter((d: any) => d.type !== "drawing").length;
          stats.drawings += docList.filter((d: any) => d.type === "drawing").length;
        }

        // ── Related products ──────────────────────────────────────────────
        const relatedIds:   ObjectId[] = [];
        const accessoryIds: ObjectId[] = [];
        const seen = new Set<string>();

        if (Array.isArray(src.relatedProducts)) {
          for (const group of src.relatedProducts) {
            if (!Array.isArray(group.products)) continue;
            const bucket = classifyGroup(group);

            for (const ref of group.products) {
              const rk    = String(ref.supplierRef ?? "").toLowerCase();
              const newId = refIdx.get(rk);
              if (!newId || seen.has(rk)) continue;
              seen.add(rk);

              if (bucket === "accessories") accessoryIds.push(newId);
              else                          relatedIds.push(newId);
            }
          }
        }

        if (relatedIds.length)   { $set.relatedProducts = relatedIds;  stats.related     += relatedIds.length; }
        if (accessoryIds.length) { $set.accessories     = accessoryIds; stats.accessories += accessoryIds.length; }

        if (Object.keys($set).length === 0) { skipped++; continue; }

        ops.push({ updateOne: { filter: { _id: targetId }, update: { $set } } });
      }

      if (ops.length && !DRY_RUN) {
        const result = await tgtCol.bulkWrite(ops, { ordered: false });
        updated += result.modifiedCount;
      } else {
        updated += ops.length; // dry-run: count as "would update"
      }

      processed += batch.length;
      process.stdout.write(
        `\r  ${processed}/${total} processed  |  ${updated} ${DRY_RUN ? "would update" : "updated"}  |  ${noMatch} unmatched`
      );
    }

    console.log("\n");
    console.log("─────────────────────────────────────────");
    console.log(`✓  Sync ${DRY_RUN ? "preview" : "complete"}`);
    console.log(`   Processed  : ${processed}`);
    console.log(`   Updated    : ${updated}${DRY_RUN ? " (dry-run)" : ""}`);
    console.log(`   Skipped    : ${skipped} (no data to set)`);
    console.log(`   Unmatched  : ${noMatch} (supplierRef not found in new DB)`);
    console.log(`   Documents  : ${stats.docs}`);
    console.log(`   Drawings   : ${stats.drawings}`);
    console.log(`   Related    : ${stats.related}`);
    console.log(`   Accessories: ${stats.accessories}`);
    console.log("─────────────────────────────────────────");
  } finally {
    await Promise.all([srcClient.close(), tgtClient.close()]);
  }
}

main().catch((err) => { console.error(err); process.exit(1); });
