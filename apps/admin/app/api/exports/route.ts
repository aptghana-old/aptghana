import { NextRequest, NextResponse } from "next/server";
import {
  connectDB, OrderModel, PaymentModel, QuoteModel, UserModel,
} from "@apt/db";
import {
  DATASETS,
  buildCsv,
  buildXlsx,
  renderTableReport,
  type DatasetKey,
  type ExportData,
} from "@apt/documents";
import { requirePermission } from "@/lib/auth/require";

const MAX_ROWS = 5000;
const SALES_STATUSES = ["confirmed", "processing", "shipped", "delivered"];

/**
 * Bulk export: ?dataset=quotes|orders|sales|customers|payments
 *              &format=csv|xlsx|pdf
 *              &from=YYYY-MM-DD&to=YYYY-MM-DD&status=…&q=<customer search>
 */
export async function GET(req: NextRequest) {
  // M-08: Exports contain PII and financial data — requires exports:run permission
  const deny = await requirePermission("exports:run");
  if (deny) return deny;
  const sp = req.nextUrl.searchParams;
  const dataset = sp.get("dataset") as DatasetKey | null;
  const format = sp.get("format") ?? "csv";

  if (!dataset || !(dataset in DATASETS)) {
    return NextResponse.json({ error: "Unknown dataset" }, { status: 400 });
  }
  if (!["csv", "xlsx", "pdf"].includes(format)) {
    return NextResponse.json({ error: "Unknown format" }, { status: 400 });
  }

  // Filters
  const filters: string[] = [];
  const query: Record<string, unknown> = {};

  const from = sp.get("from") ? new Date(`${sp.get("from")}T00:00:00`) : null;
  const to = sp.get("to") ? new Date(`${sp.get("to")}T23:59:59.999`) : null;
  if (from || to) {
    query.createdAt = { ...(from ? { $gte: from } : {}), ...(to ? { $lte: to } : {}) };
    filters.push(`${from ? from.toLocaleDateString("en-GB") : "…"} – ${to ? to.toLocaleDateString("en-GB") : "…"}`);
  }

  const status = sp.get("status")?.trim();
  if (status) {
    query.status = status;
    filters.push(`Status: ${status}`);
  }

  const q = sp.get("q")?.trim();
  const safe = q ? q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") : "";
  if (q) filters.push(`Search: "${q}"`);

  try {
    await connectDB();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let docs: any[] = [];

    switch (dataset) {
      case "quotes":
        if (safe) {
          query.$or = [
            { "client.name": { $regex: safe, $options: "i" } },
            { "client.email": { $regex: safe, $options: "i" } },
            { "client.company": { $regex: safe, $options: "i" } },
            { ref: { $regex: safe, $options: "i" } },
            { quoteNumber: { $regex: safe, $options: "i" } },
          ];
        }
        docs = await QuoteModel.find(query).sort({ createdAt: -1 }).limit(MAX_ROWS).lean();
        break;

      case "orders":
      case "sales":
        if (dataset === "sales" && !status) {
          query.status = { $in: SALES_STATUSES };
          filters.push("Paid & fulfilled orders");
        }
        if (safe) {
          query.$or = [
            { "guest.name": { $regex: safe, $options: "i" } },
            { "guest.email": { $regex: safe, $options: "i" } },
            { ref: { $regex: safe, $options: "i" } },
            { quoteNumber: { $regex: safe, $options: "i" } },
          ];
        }
        docs = await OrderModel.find(query).sort({ createdAt: -1 }).limit(MAX_ROWS).lean();
        break;

      case "customers":
        if (safe) {
          query.$or = [
            { name: { $regex: safe, $options: "i" } },
            { email: { $regex: safe, $options: "i" } },
            { company: { $regex: safe, $options: "i" } },
          ];
        }
        docs = await UserModel.find(query).sort({ createdAt: -1 }).limit(MAX_ROWS)
          .select("name email phone company industry accountType status assignedSalesRepName orderIds quoteIds createdAt lastLoginAt")
          .lean();
        break;

      case "payments":
        if (safe) {
          query.$or = [
            { email: { $regex: safe, $options: "i" } },
            { reference: { $regex: safe, $options: "i" } },
            { quoteRef: { $regex: safe, $options: "i" } },
            { quoteNumber: { $regex: safe, $options: "i" } },
          ];
        }
        docs = await PaymentModel.find(query).sort({ createdAt: -1 }).limit(MAX_ROWS).lean();
        break;
    }

    const def = DATASETS[dataset];
    const data: ExportData = {
      title: def.label,
      subtitle: filters.length ? filters.join(" · ") : "All records",
      columns: def.columns,
      rows: docs.map(def.map),
    };

    const stamp = new Date().toISOString().slice(0, 10);
    const filename = `apt-${dataset}-${stamp}`;

    if (format === "csv") {
      return new NextResponse(new Uint8Array(buildCsv(data)), {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}.csv"`,
        },
      });
    }
    if (format === "xlsx") {
      return new NextResponse(new Uint8Array(await buildXlsx(data)), {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="${filename}.xlsx"`,
        },
      });
    }
    return new NextResponse(new Uint8Array(await renderTableReport(data)), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}.pdf"`,
      },
    });
  } catch (err) {
    console.error("[admin exports]", err);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
