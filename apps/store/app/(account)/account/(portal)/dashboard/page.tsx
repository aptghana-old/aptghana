import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { connectDB, UserModel, OrderModel, QuoteModel } from "@apt/db";
import { Icon, StatCard, Alert } from "@/components/account/ui";

export const metadata: Metadata = { title: "Account Overview" };

async function getStats(userId: string) {
  await connectDB();
  const [ user, orderCount, quoteCount, awaitingPayment ] = await Promise.all([
    UserModel.findById(userId).select("name email accountType company mfaEnabled createdAt favorites").lean<{
      name?: string; email?: string; accountType?: string; company?: string;
      mfaEnabled?: boolean; createdAt?: Date; favorites?: unknown[];
    }>(),
    OrderModel.countDocuments({ userId }).catch(() => 0),
    QuoteModel.countDocuments({ userId }).catch(() => 0),
    OrderModel.countDocuments({ userId, status: "pending" }).catch(() => 0),
  ]);
  return { user, orderCount, quoteCount, awaitingPayment, wishlistCount: user?.favorites?.length ?? 0 };
}

const QUICK_ACTIONS = [
  { label: "Browse Products", href: "/catalog", icon: "M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" },
  { label: "Request a Quote", href: "/rfq", icon: "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25M9 16.5v.75m3-3v3M15 12v5.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" },
  { label: "Track Orders", href: "/account/orders", icon: "M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" },
  { label: "View Wishlist", href: "/account/wishlist", icon: "M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" },
  { label: "Manage Addresses", href: "/account/addresses", icon: "M15 10.5a3 3 0 11-6 0 3 3 0 016 0z M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" },
  { label: "Account Security", href: "/account/security", icon: "M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" },
];

export default async function DashboardPage() {
  const session = await auth();
  const { user, orderCount, quoteCount, awaitingPayment, wishlistCount } = await getStats(session!.user.id);
  const firstName = (user?.name ?? "there").split(" ")[ 0 ];
  const memberSince = user?.createdAt
    ? new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric" }).format(new Date(user.createdAt))
    : null;

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-(--text-1) tracking-tight">
          Welcome back, {firstName}
        </h1>
        <p className="text-sm text-(--text-3) mt-1">
          {user?.accountType === "business" && user.company ? `${user.company} · ` : ""}
          {memberSince ? `Member since ${memberSince}` : "Your APT Ghana account"}
        </p>
      </div>

      {/* Security nudge */}
      {!user?.mfaEnabled && (
        <Alert type="warning" message="Secure your account with two-factor authentication for an extra layer of protection." />
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          label="Total Orders"
          value={orderCount}
          sub={awaitingPayment > 0 ? `${awaitingPayment} awaiting payment` : "All time"}
          href="/account/orders"
          icon="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4"
        />
        <StatCard
          label="Quotes & RFQs"
          value={quoteCount}
          sub="Submitted requests"
          href="/account/quotes"
          icon="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25M9 16.5v.75m3-3v3M15 12v5.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
        />
        <StatCard
          label="Security"
          value={user?.mfaEnabled ? "2FA Active" : "Standard"}
          sub={user?.mfaEnabled ? "Account secured" : "Enable 2FA"}
          href="/account/security"
          icon="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
        />
        <StatCard
          label="Saved Items"
          value={wishlistCount}
          sub="In wishlist"
          href="/account/wishlist"
          icon="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
        />
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-xs font-bold text-(--text-4) uppercase tracking-widest mb-4">Quick Actions</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {QUICK_ACTIONS.map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className="flex items-center gap-3 p-4 bg-(--bg-surface) border border-(--border) rounded-2xl hover:border-navy-500/30 hover:shadow-[0_2px_12px_rgba(0,0,0,0.06)] hover:bg-(--bg-raised) transition-all group"
            >
              <div className="w-9 h-9 bg-(--bg-raised) group-hover:bg-navy-50 dark:group-hover:bg-navy-900/30 rounded-xl flex items-center justify-center text-(--text-4) group-hover:text-navy-500 shrink-0 transition-colors">
                <Icon d={a.icon} size={18} strokeWidth={1.75} />
              </div>
              <span className="text-sm font-semibold text-(--text-1)">{a.label}</span>
              <Icon d="M8.25 4.5l7.5 7.5-7.5 7.5" size={14} strokeWidth={2.5} className="ml-auto text-(--text-4) group-hover:text-navy-500 transition-colors" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
