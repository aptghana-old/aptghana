/**
 * Run full migration in order:
 *   1. Brands (needed by products for brandId lookup)
 *   2. Categories (needed by products for categoryId lookup)
 *   3. Products (references brands + categories)
 *   4. Users
 *
 * Usage: tsx scripts/migrate/src/index.ts
 * Requires: MONGODB_URI env var
 */

import { execSync } from "child_process";
import path from "path";

const scripts = [
  { name: "brands", file: "brands.ts" },
  { name: "categories", file: "categories.ts" },
  { name: "products", file: "products.ts" },
  { name: "users", file: "users.ts" },
];

const dir = path.dirname(new URL(import.meta.url).pathname);

for (const script of scripts) {
  console.log(`\n${"=".repeat(50)}`);
  console.log(`🚀 Starting: ${script.name}`);
  console.log("=".repeat(50));

  try {
    execSync(`tsx ${path.join(dir, script.file)}`, { stdio: "inherit" });
    console.log(`✅ ${script.name} complete`);
  } catch (err) {
    console.error(`❌ ${script.name} failed:`, err);
    process.exit(1);
  }
}

console.log("\n🎉 Full migration complete!");
console.log("\nNext steps:");
console.log("  1. Run: tsx scripts/migrate/src/search-index.ts  (push products to Meilisearch)");
console.log("  2. Run: npm run dev --workspace=apps/web");
console.log("  3. Run: npm run dev --workspace=apps/store");
console.log("  4. Run: npm run dev --workspace=apps/admin");
