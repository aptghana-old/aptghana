/**
 * Odoo <-> APT synchronization layer.
 *
 * Rules:
 * - Odoo is the system of record for: inventory, pricing, customer data, orders, invoices
 * - APT database is the system of record for: product content, SEO, media, categorization
 * - Never expose Odoo IDs or Odoo table structures to the frontend
 */

import { getOdooClient } from "./client";

// ─── Inventory Sync ──────────────────────────────────────────────────────────

interface OdooProduct {
  id: number;
  default_code: string;
  qty_available: number;
  lst_price: number;
}

export async function syncInventoryFromOdoo(skus?: string[]): Promise<Map<string, { qty: number; price: number }>> {
  const client = getOdooClient();
  const domain: unknown[] = skus?.length
    ? [["default_code", "in", skus]]
    : [["sale_ok", "=", true]];

  const products = await client.searchRead<OdooProduct>(
    "product.template",
    domain,
    ["id", "default_code", "qty_available", "lst_price"],
    { limit: 10000 }
  );

  const result = new Map<string, { qty: number; price: number }>();
  for (const p of products) {
    if (p.default_code) {
      result.set(p.default_code, { qty: p.qty_available, price: p.lst_price });
    }
  }
  return result;
}

// ─── Customer Sync ───────────────────────────────────────────────────────────

export async function createOrUpdateOdooCustomer(data: {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  country?: string;
}): Promise<number> {
  const client = getOdooClient();

  const existing = await client.searchRead<{ id: number }>(
    "res.partner",
    [["email", "=", data.email]],
    ["id"],
    { limit: 1 }
  );

  if (existing.length > 0 && existing[0]) {
    await client.write("res.partner", [existing[0].id], {
      name: data.name,
      phone: data.phone ?? false,
      company_name: data.company ?? false,
    });
    return existing[0].id;
  }

  return client.create("res.partner", {
    name: data.name,
    email: data.email,
    phone: data.phone ?? false,
    company_name: data.company ?? false,
    customer_rank: 1,
  });
}

// ─── Order Sync ──────────────────────────────────────────────────────────────

export async function pushOrderToOdoo(order: {
  ref: string;
  odooPartnerId: number;
  items: { odooProdId: number; qty: number; price: number }[];
}): Promise<number> {
  const client = getOdooClient();

  const saleOrderId = await client.create("sale.order", {
    partner_id: order.odooPartnerId,
    client_order_ref: order.ref,
    order_line: order.items.map((item) => [
      0,
      0,
      { product_id: item.odooProdId, product_uom_qty: item.qty, price_unit: item.price },
    ]),
  });

  return saleOrderId;
}
