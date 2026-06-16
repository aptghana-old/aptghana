import { ProductModel, BrandModel } from "@apt/db";
import {
  buildProductRecord, upsertProductRecord, removeProductRecord,
  type CategoryForIndex, type ProductForIndex,
} from "@apt/search";

/** Re-indexes (or de-indexes, if inactive) a product in Meilisearch from its current DB state. */
export async function syncProductToSearch(id: string): Promise<void> {
  type ProductRow = ProductForIndex & {
    brandId?: { toString(): string };
    status?: string;
    categories?: { id: string; name: string; slug: string; level: CategoryForIndex["level"] }[];
  };
  const product = await ProductModel.findById(id).lean() as unknown as ProductRow | null;
  if (!product) return;

  if (product.status !== "active") {
    await removeProductRecord(id);
    return;
  }

  const brandName = product.brandId
    ? ((await BrandModel.findById(product.brandId).select("name").lean()) as { name?: string } | null)?.name ?? ""
    : "";

  const embeddedCats = (product.categories ?? []) as { id: string; name: string; slug: string; level: CategoryForIndex["level"] }[];
  const indexCats: CategoryForIndex[] = embeddedCats.map((c) => ({
    _id: c.id, name: c.name, slug: c.slug, level: c.level,
  }));

  const record = buildProductRecord(product, brandName, indexCats);
  await upsertProductRecord(record);
}
