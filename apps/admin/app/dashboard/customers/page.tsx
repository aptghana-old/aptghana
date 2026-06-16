import type { Metadata } from "next";
import Link from "next/link";
import { connectDB, UserModel } from "@apt/db";
import { hasPermission, type AdminRole } from "@apt/auth";
import { Users, Plus, ChevronLeft, ChevronRight, ArrowUp, ArrowDown } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import ExportMenu from "@/components/exports/ExportMenu";
import { auth } from "@/lib/auth";
import { getSalesReps } from "@/lib/customers";
import CustomerFilters from "@/components/customers/CustomerFilters";
import CustomerTable, { type CustomerRow } from "@/components/customers/CustomerTable";

export const metadata: Metadata = { title: "Customers" };

const PAGE_SIZE = 40;

interface Props {
  searchParams: Promise<{
    q?: string; type?: string; status?: string; industry?: string; country?: string;
    rep?: string; from?: string; to?: string; sort?: string; dir?: string; page?: string;
  }>;
}

const SORT_FIELDS: Record<string, string> = {
  name: "name",
  createdAt: "createdAt",
  ltv: "ltv",
  totalOrders: "totalOrders",
  lastOrderDate: "lastOrderDate",
};

async function getCustomers(sp: Awaited<Props["searchParams"]>) {
  await connectDB();

  const match: Record<string, unknown> = {};
  if (sp.q) {
    const safe = sp.q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    match.$or = [
      { name: { $regex: safe, $options: "i" } },
      { email: { $regex: safe, $options: "i" } },
      { company: { $regex: safe, $options: "i" } },
    ];
  }
  if (sp.type) match.accountType = sp.type;
  if (sp.status) match.status = sp.status;
  if (sp.industry) match.industry = sp.industry;
  if (sp.country) match["addresses.country"] = sp.country;
  if (sp.rep) match.assignedSalesRep = sp.rep;
  if (sp.from || sp.to) {
    match.createdAt = {
      ...(sp.from ? { $gte: new Date(`${sp.from}T00:00:00`) } : {}),
      ...(sp.to ? { $lte: new Date(`${sp.to}T23:59:59.999`) } : {}),
    };
  }

  const page = Math.max(1, parseInt(sp.page ?? "1", 10));
  const sortField = SORT_FIELDS[sp.sort ?? ""] ?? "createdAt";
  const sortDir = sp.dir === "asc" ? 1 : -1;

  const pipeline = [
    { $match: match },
    { $lookup: { from: "orders_v2", localField: "_id", foreignField: "userId", as: "orders" } },
    { $lookup: { from: "quotes_v2", localField: "_id", foreignField: "userId", as: "quotes" } },
    {
      $addFields: {
        totalOrders: { $size: "$orders" },
        ltv: { $sum: "$orders.total" },
        lastOrderDate: { $max: "$orders.createdAt" },
        totalQuotes: {
          $size: { $filter: { input: "$quotes", as: "q", cond: { $eq: ["$$q.kind", "approval_request"] } } },
        },
        totalRfqs: {
          $size: { $filter: { input: "$quotes", as: "q", cond: { $ne: ["$$q.kind", "approval_request"] } } },
        },
      },
    },
    {
      $project: {
        name: 1, email: 1, phone: 1, company: 1, accountType: 1, status: 1, industry: 1,
        tags: 1, assignedSalesRepName: 1, createdAt: 1, lastLoginAt: 1, addresses: 1,
        totalOrders: 1, totalQuotes: 1, totalRfqs: 1, ltv: 1, lastOrderDate: 1,
      },
    },
    { $sort: { [sortField]: sortDir } },
    {
      $facet: {
        data: [{ $skip: (page - 1) * PAGE_SIZE }, { $limit: PAGE_SIZE }],
        totalCount: [{ $count: "count" }],
      },
    },
  ];

  try {
    const [result] = await UserModel.aggregate(pipeline as Parameters<typeof UserModel.aggregate>[0]);
    const total = result?.totalCount?.[0]?.count ?? 0;
    return { rows: result?.data ?? [], total, page };
  } catch (err) {
    console.error("[customers list]", err);
    return { rows: [], total: 0, page };
  }
}

async function getFilterOptions() {
  try {
    await connectDB();
    const [industries, countries, salesReps] = await Promise.all([
      UserModel.distinct("industry", { industry: { $nin: [null, ""] } }),
      UserModel.distinct("addresses.country", { "addresses.country": { $nin: [null, ""] } }),
      getSalesReps(),
    ]);
    return {
      industries: (industries as string[]).sort().map((v) => ({ value: v, label: v })),
      countries: (countries as string[]).sort().map((v) => ({ value: v, label: v })),
      salesReps,
    };
  } catch {
    return { industries: [], countries: [], salesReps: [] };
  }
}

function sortLink(base: URLSearchParams, field: string, current?: string, dir?: string) {
  const next = new URLSearchParams(base.toString());
  const nextDir = current === field && dir !== "asc" ? "asc" : "desc";
  next.set("sort", field);
  next.set("dir", nextDir);
  next.delete("page");
  return `?${next.toString()}`;
}

export default async function CustomersPage({ searchParams }: Props) {
  const sp = await searchParams;
  const session = await auth();
  const role = (session?.user as { role?: AdminRole } | undefined)?.role ?? "sales";
  const overrides = (session?.user as { permissions?: string[] } | undefined)?.permissions ?? [];
  const canEdit = hasPermission(role, overrides, "customers:edit");
  const canExport = hasPermission(role, overrides, "exports:run");

  const [{ rows: rawRows, total, page }, filterOptions] = await Promise.all([
    getCustomers(sp),
    getFilterOptions(),
  ]);

  const rows: CustomerRow[] = (rawRows as unknown as Array<{
    _id: { toString(): string };
    name: string; email: string; phone?: string; company?: string; accountType: string; status: string;
    industry?: string; tags?: string[]; assignedSalesRepName?: string; createdAt: Date; lastLoginAt?: Date;
    addresses?: { country?: string; isDefaultBilling?: boolean }[];
    totalOrders: number; totalQuotes: number; totalRfqs: number; ltv: number; lastOrderDate?: Date;
  }>).map((u) => {
    const address = u.addresses?.find((a) => a.isDefaultBilling) ?? u.addresses?.[0];
    return {
      id: u._id.toString(),
      name: u.name,
      email: u.email,
      phone: u.phone,
      company: u.company,
      accountType: u.accountType,
      status: u.status,
      industry: u.industry,
      country: address?.country,
      tags: u.tags ?? [],
      assignedSalesRepName: u.assignedSalesRepName,
      createdAt: u.createdAt instanceof Date ? u.createdAt.toISOString() : String(u.createdAt),
      lastLoginAt: u.lastLoginAt ? new Date(u.lastLoginAt).toISOString() : undefined,
      totalOrders: u.totalOrders ?? 0,
      totalQuotes: u.totalQuotes ?? 0,
      totalRfqs: u.totalRfqs ?? 0,
      ltv: u.ltv ?? 0,
      lastOrderDate: u.lastOrderDate ? new Date(u.lastOrderDate).toISOString() : undefined,
    };
  });

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const baseParams = new URLSearchParams(
    Object.entries(sp).filter(([k, v]) => k !== "page" && v) as [string, string][]
  );

  const SORT_COLS: { key: string; label: string }[] = [
    { key: "name", label: "Name" },
    { key: "createdAt", label: "Joined" },
    { key: "ltv", label: "LTV" },
    { key: "totalOrders", label: "Orders" },
    { key: "lastOrderDate", label: "Last Order" },
  ];

  return (
    <div>
      <PageHeader
        title="Customers"
        description={`${total.toLocaleString()} registered customer${total !== 1 ? "s" : ""}`}
        actions={
          <div className="flex items-center gap-2">
            {canExport && <ExportMenu datasets={[{ key: "customers", label: "Customers" }]} inheritParams={["status", "q", "type"]} />}
            {canEdit && (
              <Link href="/dashboard/customers/new">
                <Button variant="primary" size="sm" icon={<Plus size={13} />}>Add Customer</Button>
              </Link>
            )}
          </div>
        }
      />

      <CustomerFilters {...filterOptions} />

      {rows.length > 0 && (
        <div className="flex items-center gap-1 px-4 sm:px-6 pt-3 overflow-x-auto" style={{ background: "var(--apt-bg)" }}>
          <span className="text-[11px] uppercase tracking-wide font-semibold mr-2" style={{ color: "var(--apt-text-muted)" }}>Sort:</span>
          {SORT_COLS.map((s) => (
            <Link
              key={s.key}
              href={sortLink(baseParams, s.key, sp.sort, sp.dir)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[12px] font-medium whitespace-nowrap transition-colors"
              style={{
                background: sp.sort === s.key ? "var(--apt-bg-raised)" : "transparent",
                color: sp.sort === s.key ? "var(--apt-text-primary)" : "var(--apt-text-muted)",
              }}
            >
              {s.label}
              {sp.sort === s.key && (sp.dir === "asc" ? <ArrowUp size={11} /> : <ArrowDown size={11} />)}
            </Link>
          ))}
        </div>
      )}

      <div className="p-4 sm:p-6">
        {rows.length === 0 ? (
          <div className="card">
            <EmptyState
              icon={<Users size={22} />}
              title={sp.q || sp.status || sp.type ? "No customers match your filters" : "No customers yet"}
              description="Customers who register on the store or are added manually appear here."
              action={canEdit ? (
                <Link href="/dashboard/customers/new">
                  <Button variant="primary" size="sm" icon={<Plus size={13} />}>Add Customer</Button>
                </Link>
              ) : undefined}
            />
          </div>
        ) : (
          <>
            <CustomerTable rows={rows} canEdit={canEdit} canExport={canExport} salesReps={filterOptions.salesReps} />

            {pages > 1 && (
              <div className="flex items-center justify-between mt-4 px-1">
                <span className="text-[12px]" style={{ color: "var(--apt-text-muted)" }}>
                  {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total.toLocaleString()}
                </span>
                <div className="flex items-center gap-2">
                  <Link href={`?${new URLSearchParams({ ...Object.fromEntries(baseParams), page: String(Math.max(1, page - 1)) }).toString()}`}>
                    <Button variant="outline" size="xs" icon={<ChevronLeft size={12} />} disabled={page <= 1}>Prev</Button>
                  </Link>
                  <span className="text-[12px]" style={{ color: "var(--apt-text-muted)" }}>Page {page} of {pages}</span>
                  <Link href={`?${new URLSearchParams({ ...Object.fromEntries(baseParams), page: String(Math.min(pages, page + 1)) }).toString()}`}>
                    <Button variant="outline" size="xs" iconRight={<ChevronRight size={12} />} disabled={page >= pages}>Next</Button>
                  </Link>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
