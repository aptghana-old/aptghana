import { NextResponse } from "next/server";
import { connectDB, ProductModel, BrandModel, CategoryModel, SearchConfigModel } from "@apt/db";
import {
  buildProductRecord,
  upsertProductRecord,
  removeProductRecord,
  extractCategoryIds,
  getMeilisearchClient,
  INDEXES,
  initializeSearchIndexes,
  DEFAULT_SETTINGS_BY_INDEX,
  type ProductForIndex,
  type CategoryForIndex,
} from "@apt/search";
import { requirePermission } from "@/lib/auth/require";
import type { MeiliSettings } from "@apt/types";

const BATCH_SIZE = 250;

export async function POST() {
  const deny = await requirePermission("search:edit");
  if (deny) return deny;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      function send(data: object) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      }

      try {
        await connectDB();
        send({ stage: "connecting", message: "Connected to database" });

        // Load active settings from DB; fall back to compiled defaults
        send({ stage: "configuring", message: "Loading active search configuration…" });
        const activeConfig = await SearchConfigModel.findOne({
          index: INDEXES.PRODUCTS,
          isActive: true,
        }).lean();

        const productsSettings = (
          activeConfig?.settings ?? DEFAULT_SETTINGS_BY_INDEX[INDEXES.PRODUCTS]
        ) as MeiliSettings;

        send({ stage: "configuring", message: "Applying index settings and synonyms…" });
        await initializeSearchIndexes(productsSettings);

        // Prefetch all brands and categories for efficient batch processing
        send({ stage: "prefetch", message: "Loading brands and categories…" });

        type BrandRow  = { _id: unknown; name: string; slug: string };
        type CatRow    = { _id: unknown; name: string; slug: string; level?: string };

        const [rawBrands, rawCats] = await Promise.all([
          BrandModel.find({}).select("_id name slug").lean(),
          CategoryModel.find({ status: "active" }).select("_id name slug level").lean(),
        ]);
        const allBrands     = rawBrands as unknown as BrandRow[];
        const allCategories = rawCats   as unknown as CatRow[];

        const brandMap = new Map<string, string>();
        for (const b of allBrands) brandMap.set(String(b._id), b.name);

        const categoryMap = new Map<string, CategoryForIndex>();
        for (const c of allCategories) {
          categoryMap.set(String(c._id), {
            _id:   c._id,
            name:  c.name,
            slug:  c.slug,
            level: c.level as CategoryForIndex["level"],
          });
        }

        const client  = getMeilisearchClient();
        const index   = client.index(INDEXES.PRODUCTS);

        // Count targets
        const [activeCount, inactiveIds] = await Promise.all([
          ProductModel.countDocuments({ status: "active" }),
          ProductModel.find({ status: { $in: ["inactive", "discontinued", "draft", "archived"] } })
            .select("_id").lean() as Promise<{ _id: unknown }[]>,
        ]);

        send({ stage: "counting", message: `Found ${activeCount} active products to index`, total: activeCount });

        // Remove non-active products from the index
        if (inactiveIds.length) {
          await index.deleteDocuments(inactiveIds.map((p) => String(p._id)));
          send({ stage: "cleanup", message: `Removed ${inactiveIds.length} non-active products from index` });
        }

        // Batch index active products
        let indexed = 0;
        let errors  = 0;

        for (let offset = 0; offset < activeCount; offset += BATCH_SIZE) {
          const products = await ProductModel.find({ status: "active" })
            .skip(offset)
            .limit(BATCH_SIZE)
            .lean() as unknown as (ProductForIndex & { brandId?: unknown; categories?: unknown[] })[];

          const records = [];
          for (const product of products) {
            try {
              const brandName = product.brandId
                ? (brandMap.get(String(product.brandId)) ?? "")
                : "";

              const catIds       = extractCategoryIds(product.categories ?? []);
              const resolvedCats = catIds
                .map((cid) => categoryMap.get(cid))
                .filter(Boolean) as CategoryForIndex[];

              records.push(buildProductRecord(product, brandName, resolvedCats));
            } catch {
              errors++;
            }
          }

          if (records.length) {
            await index.addDocuments(records, { primaryKey: "id" });
          }

          indexed += products.length;
          send({
            stage:   "indexing",
            message: `Indexed ${indexed} / ${activeCount}`,
            done:    indexed,
            total:   activeCount,
          });
        }

        send({
          stage:   "complete",
          message: `Reindex complete: ${indexed - errors} indexed, ${errors} errors`,
          indexed: indexed - errors,
          errors,
        });
      } catch (err) {
        send({ stage: "error", message: "Reindex failed" });
      } finally {
        controller.close();
      }
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type":  "text/event-stream",
      "Cache-Control": "no-cache",
      Connection:      "keep-alive",
    },
  });
}

// GET: quick stats on current index state
export async function GET() {
  const deny = await requirePermission("search:view");
  if (deny) return deny;
  try {
    const client = getMeilisearchClient();
    const index  = client.index(INDEXES.PRODUCTS);
    const stats  = await index.getStats();
    return NextResponse.json({ numberOfDocuments: stats.numberOfDocuments, isIndexing: stats.isIndexing });
  } catch (err) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }
}

// DELETE: wipe the products index entirely
export async function DELETE() {
  const deny = await requirePermission("search:edit");
  if (deny) return deny;
  try {
    const client = getMeilisearchClient();
    const index  = client.index(INDEXES.PRODUCTS);
    await index.deleteAllDocuments();
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }
}
