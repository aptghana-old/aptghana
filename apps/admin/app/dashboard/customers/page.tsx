import type { Metadata } from "next";
import Link from "next/link";
import { connectDB, UserModel } from "@apt/db";
import { Users, Mail, Phone, MapPin, Plus } from "lucide-react";
import { Badge, statusVariant } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import ExportMenu from "@/components/exports/ExportMenu";

export const metadata: Metadata = { title: "Customers" };
export const revalidate = 60;

interface Props {
  searchParams: Promise<{ q?: string; page?: string }>;
}

async function getCustomers(q?: string, page = 1) {
  try {
    await connectDB();
    const query: Record<string, unknown> = {};
    if (q) query.$or = [
      { name: { $regex: q, $options: "i" } },
      { email: { $regex: q, $options: "i" } },
      { "company.name": { $regex: q, $options: "i" } },
    ];
    const [users, total] = await Promise.all([
      UserModel.find(query).sort({ createdAt: -1 }).skip((page - 1) * 40).limit(40).lean(),
      UserModel.countDocuments(query),
    ]);
    return { users, total };
  } catch {
    return { users: [], total: 0 };
  }
}

export default async function CustomersPage({ searchParams }: Props) {
  const { q, page: pageStr } = await searchParams;
  const page = Math.max(1, parseInt(pageStr ?? "1", 10));
  const { users, total } = await getCustomers(q, page);

  return (
    <div>
      <PageHeader
        title="Customers"
        description={`${total.toLocaleString()} registered customer${total !== 1 ? "s" : ""}`}
        actions={
          <div className="flex items-center gap-2">
            <ExportMenu datasets={[{ key: "customers", label: "Customers" }]} />
            <Button variant="primary" size="sm" icon={<Plus size={13} />}>
              Add Customer
            </Button>
          </div>
        }
      />

      <div
        className="flex items-center gap-3 px-6 py-3"
        style={{ borderBottom: "1px solid var(--apt-border)", background: "var(--apt-bg)" }}
      >
        <input
          defaultValue={q}
          placeholder="Search by name, email, or company…"
          className="flex-1 max-w-xs h-8 px-3 rounded-md text-[13px] border focus:outline-none focus:ring-2"
          style={{ background: "var(--apt-bg-subtle)", border: "1px solid var(--apt-border)", color: "var(--apt-text-primary)" }}
        />
      </div>

      <div className="p-6">
        {users.length === 0 ? (
          <div className="card">
            <EmptyState
              icon={<Users size={22} />}
              title="No customers yet"
              description="Customers who register on the store or are added manually appear here."
            />
          </div>
        ) : (
          <div className="card overflow-hidden">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Company</th>
                  <th>Contact</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th className="w-px" />
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const user = u as unknown as {
                    _id: { toString(): string };
                    name: string;
                    email: string;
                    phone?: string;
                    company?: { name?: string };
                    address?: { city?: string; country?: string };
                    status: string;
                    createdAt: Date;
                  };
                  return (
                    <tr key={user._id.toString()}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold text-white shrink-0"
                            style={{ background: "#1e4278" }}
                          >
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-[13px] font-medium" style={{ color: "var(--apt-text-primary)" }}>{user.name}</div>
                            <div className="flex items-center gap-1 text-[11px]" style={{ color: "var(--apt-text-muted)" }}>
                              <Mail size={10} />{user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="text-[13px]" style={{ color: "var(--apt-text-secondary)" }}>
                          {user.company?.name ?? "—"}
                        </span>
                      </td>
                      <td>
                        {user.phone ? (
                          <div className="flex items-center gap-1 text-[12px]" style={{ color: "var(--apt-text-muted)" }}>
                            <Phone size={11} />{user.phone}
                          </div>
                        ) : <span style={{ color: "var(--apt-text-disabled)" }}>—</span>}
                      </td>
                      <td>
                        {(user.address?.city || user.address?.country) ? (
                          <div className="flex items-center gap-1 text-[12px]" style={{ color: "var(--apt-text-muted)" }}>
                            <MapPin size={11} />
                            {[user.address?.city, user.address?.country].filter(Boolean).join(", ")}
                          </div>
                        ) : <span style={{ color: "var(--apt-text-disabled)" }}>—</span>}
                      </td>
                      <td><Badge variant={statusVariant(user.status)} dot>{user.status}</Badge></td>
                      <td>
                        <span className="text-[12px]" style={{ color: "var(--apt-text-muted)" }}>
                          {new Date(user.createdAt).toLocaleDateString("en-GH", { month: "short", year: "numeric" })}
                        </span>
                      </td>
                      <td>
                        <Button variant="ghost" size="xs">View</Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
