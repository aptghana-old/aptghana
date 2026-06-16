import type { ExportColumn, ExportRow } from "../types";

/**
 * Dataset definitions shared by every export format (CSV/XLSX/PDF) and by
 * both apps — columns and row mapping live here once.
 */

export type DatasetKey = "quotes" | "orders" | "sales" | "customers" | "payments" | "search_queries";

export interface DatasetDef {
  label: string;
  columns: ExportColumn[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  map: (doc: any) => ExportRow;
}

const d = (v: Date | string | undefined | null) =>
  v ? new Date(v).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "";

const num = (v: unknown) => (typeof v === "number" ? Math.round(v * 100) / 100 : null);

export const DATASETS: Record<DatasetKey, DatasetDef> = {
  quotes: {
    label: "Quotes & RFQs",
    columns: [
      { key: "ref", header: "Reference", width: 18 },
      { key: "quoteNumber", header: "Quote No.", width: 18 },
      { key: "kind", header: "Type", width: 16 },
      { key: "customer", header: "Customer", width: 24 },
      { key: "company", header: "Company", width: 20 },
      { key: "email", header: "Email", width: 26 },
      { key: "items", header: "Lines", width: 8, align: "right" },
      { key: "total", header: "Total", width: 14, money: true },
      { key: "currency", header: "Cur.", width: 7 },
      { key: "status", header: "Status", width: 16 },
      { key: "orderRef", header: "Order", width: 18 },
      { key: "created", header: "Submitted", width: 13 },
    ],
    map: (q) => ({
      ref: q.ref ?? "",
      quoteNumber: q.quoteNumber ?? "",
      kind: q.kind === "approval_request" ? "Approval Request" : "RFQ",
      customer: q.client?.name ?? "",
      company: q.client?.company ?? "",
      email: q.client?.email ?? "",
      items: q.items?.length ?? 0,
      total: num(q.totals?.grandTotal),
      currency: q.totals?.currency ?? "",
      status: q.status ?? "",
      orderRef: q.orderRef ?? "",
      created: d(q.createdAt),
    }),
  },

  orders: {
    label: "Orders",
    columns: [
      { key: "ref", header: "Order No.", width: 18 },
      { key: "quoteNumber", header: "Quote No.", width: 18 },
      { key: "customer", header: "Customer", width: 24 },
      { key: "email", header: "Email", width: 26 },
      { key: "items", header: "Lines", width: 8, align: "right" },
      { key: "subtotal", header: "Subtotal", width: 13, money: true },
      { key: "tax", header: "Tax", width: 11, money: true },
      { key: "shipping", header: "Shipping", width: 11, money: true },
      { key: "total", header: "Total", width: 14, money: true },
      { key: "currency", header: "Cur.", width: 7 },
      { key: "status", header: "Status", width: 14 },
      { key: "paymentRef", header: "Payment Ref", width: 20 },
      { key: "created", header: "Created", width: 13 },
    ],
    map: (o) => ({
      ref: o.ref ?? "",
      quoteNumber: o.quoteNumber ?? "",
      customer: o.guest?.name ?? "",
      email: o.guest?.email ?? "",
      items: o.items?.length ?? 0,
      subtotal: num(o.subtotal),
      tax: num(o.tax),
      shipping: num(o.shipping),
      total: num(o.total),
      currency: o.currency ?? "",
      status: o.status ?? "",
      paymentRef: o.paymentRef ?? "",
      created: d(o.createdAt),
    }),
  },

  // Sales = revenue view of paid/fulfilled orders
  sales: {
    label: "Sales",
    columns: [
      { key: "ref", header: "Order No.", width: 18 },
      { key: "customer", header: "Customer", width: 24 },
      { key: "total", header: "Revenue", width: 14, money: true },
      { key: "tax", header: "Tax", width: 11, money: true },
      { key: "currency", header: "Cur.", width: 7 },
      { key: "paymentRef", header: "Payment Ref", width: 20 },
      { key: "method", header: "Method", width: 14 },
      { key: "status", header: "Status", width: 14 },
      { key: "created", header: "Date", width: 13 },
    ],
    map: (o) => ({
      ref: o.ref ?? "",
      customer: o.guest?.name ?? "",
      total: num(o.total),
      tax: num(o.tax),
      currency: o.currency ?? "",
      paymentRef: o.paymentRef ?? "",
      method: (o.paymentMethod ?? "").replace(/_/g, " "),
      status: o.status ?? "",
      created: d(o.createdAt),
    }),
  },

  customers: {
    label: "Customers",
    columns: [
      { key: "name", header: "Name", width: 24 },
      { key: "email", header: "Email", width: 28 },
      { key: "phone", header: "Phone", width: 16 },
      { key: "company", header: "Company", width: 22 },
      { key: "industry", header: "Industry", width: 18 },
      { key: "type", header: "Type", width: 10 },
      { key: "status", header: "Status", width: 10 },
      { key: "rep", header: "Sales Rep", width: 18 },
      { key: "orders", header: "Orders", width: 8, align: "right" },
      { key: "quotes", header: "Quotes", width: 8, align: "right" },
      { key: "joined", header: "Joined", width: 13 },
      { key: "lastLogin", header: "Last Sign-In", width: 13 },
    ],
    map: (u) => ({
      name: u.name ?? "",
      email: u.email ?? "",
      phone: u.phone ?? "",
      company: u.company ?? "",
      industry: u.industry ?? "",
      type: u.accountType ?? "",
      status: u.status ?? "",
      rep: u.assignedSalesRepName ?? "",
      orders: u.orderIds?.length ?? 0,
      quotes: u.quoteIds?.length ?? 0,
      joined: d(u.createdAt),
      lastLogin: d(u.lastLoginAt),
    }),
  },

  payments: {
    label: "Payments",
    columns: [
      { key: "reference", header: "Reference", width: 22 },
      { key: "quoteRef", header: "Request", width: 18 },
      { key: "quoteNumber", header: "Quote No.", width: 18 },
      { key: "email", header: "Customer Email", width: 26 },
      { key: "amount", header: "Amount", width: 14, money: true },
      { key: "currency", header: "Cur.", width: 7 },
      { key: "status", header: "Status", width: 12 },
      { key: "channel", header: "Channel", width: 14 },
      { key: "provider", header: "Provider", width: 11 },
      { key: "paidAt", header: "Paid", width: 13 },
      { key: "created", header: "Initiated", width: 13 },
    ],
    map: (p) => ({
      reference: p.reference ?? "",
      quoteRef: p.quoteRef ?? "",
      quoteNumber: p.quoteNumber ?? "",
      email: p.email ?? "",
      amount: num(p.amount),
      currency: p.currency ?? "",
      status: p.status ?? "",
      channel: (p.channel ?? "").replace(/_/g, " "),
      provider: p.provider ?? "",
      paidAt: d(p.paidAt),
      created: d(p.createdAt),
    }),
  },

  search_queries: {
    label: "Search Queries",
    columns: [
      { key: "query", header: "Query", width: 28 },
      { key: "searches", header: "Searches", width: 10, align: "right" },
      { key: "avgResults", header: "Avg. Results", width: 12, align: "right" },
      { key: "clicks", header: "Clicks", width: 10, align: "right" },
      { key: "ctr", header: "CTR", width: 10, align: "right" },
      { key: "lastSearched", header: "Last Searched", width: 14 },
    ],
    map: (q) => ({
      query: q.query ?? "",
      searches: q.searches ?? 0,
      avgResults: q.avgResults != null ? num(q.avgResults) : "",
      clicks: q.clicks ?? 0,
      ctr: q.ctr != null ? `${(q.ctr * 100).toFixed(1)}%` : "",
      lastSearched: d(q.lastSearched),
    }),
  },
};
