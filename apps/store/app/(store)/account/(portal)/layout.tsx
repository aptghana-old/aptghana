import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { auth, signOut } from "@/lib/auth";
import { Icon } from "@/components/account/ui";

/* ─── Navigation definition ──────────────────────────────────────────────── */
const NAV_SECTIONS = [
  {
    items: [
      { href: "/account/dashboard", label: "Overview", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
      { href: "/account/profile", label: "Profile", icon: "M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" },
      { href: "/account/orders", label: "Orders", icon: "M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" },
      { href: "/account/quotes", label: "Quotes", icon: "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25M9 16.5v.75m3-3v3M15 12v5.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" },
      { href: "/account/wishlist", label: "Wishlist", icon: "M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" },
    ],
  },
  {
    items: [
      { href: "/account/addresses", label: "Addresses", icon: "M15 10.5a3 3 0 11-6 0 3 3 0 016 0z M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" },
      { href: "/account/payment", label: "Payment Methods", icon: "M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" },
    ],
  },
  {
    items: [
      { href: "/account/notifications", label: "Notifications", icon: "M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" },
      { href: "/account/security", label: "Security", icon: "M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" },
      { href: "/account/settings", label: "Settings", icon: "M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z M15 12a3 3 0 11-6 0 3 3 0 016 0z" },
    ],
  },
];

/* ─── Sidebar ─────────────────────────────────────────────────────────────── */
function Sidebar({ user }: { user: { name?: string | null; email?: string | null; image?: string | null } }) {
  const initials = (user.name ?? "U").split(" ").map((w) => w[ 0 ]).join("").toUpperCase().slice(0, 2);

  return (
    <aside className="w-64 shrink-0 hidden lg:flex flex-col">
      <div className="sticky top-6 space-y-1">
        {/* User card */}
        <div className="mb-4 px-3 py-4 bg-(--bg-surface) rounded-2xl border border-(--border)">
          <div className="flex items-center gap-3">
            {user.image ? (
              <img src={user.image} alt="" className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-navy-500 to-navy-700 flex items-center justify-center text-sm font-bold text-white shrink-0">
                {initials}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-semibold text-(--text-1) truncate">{user.name ?? "Account"}</p>
              <p className="text-xs text-(--text-4) truncate">{user.email}</p>
            </div>
          </div>
        </div>

        {/* Nav sections */}
        {NAV_SECTIONS.map((section, si) => (
          <div key={si}>
            {si > 0 && <div className="h-px bg-(--border) my-2" />}
            {section.items.map((item) => (
              <NavItem key={item.href} {...item} />
            ))}
          </div>
        ))}

        <div className="h-px bg-(--border) my-2" />

        {/* Store link */}
        <Link href="/catalog" className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-(--text-3) hover:bg-(--bg-raised) hover:text-(--text-1) transition-colors">
          <Icon d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" size={16} strokeWidth={2} className="text-(--text-4) shrink-0" />
          Back to Store
        </Link>

        {/* Sign out */}
        <form action={async () => { "use server"; await signOut({ redirectTo: "/account?signout=1" }); }}>
          <button type="submit" className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500/80 hover:bg-red-50 dark:hover:bg-red-900/10 hover:text-red-600 transition-colors">
            <Icon d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" size={16} strokeWidth={2} className="shrink-0" />
            Sign Out
          </button>
        </form>
      </div>
    </aside>
  );
}

function NavItem({ href, label, icon }: { href: string; label: string; icon: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-(--text-2) hover:bg-(--bg-raised) hover:text-(--text-1) transition-colors group"
    >
      <Icon d={icon} size={16} strokeWidth={2} className="text-(--text-4) shrink-0 group-hover:text-(--text-2) transition-colors" />
      {label}
    </Link>
  );
}

/* ─── Mobile nav bar ──────────────────────────────────────────────────────── */
function MobileNav() {
  const mobileItems = [
    NAV_SECTIONS[ 0 ].items[ 0 ], // Overview
    NAV_SECTIONS[ 0 ].items[ 2 ], // Orders
    NAV_SECTIONS[ 0 ].items[ 3 ], // Quotes
    NAV_SECTIONS[ 0 ].items[ 4 ], // Wishlist
    NAV_SECTIONS[ 2 ].items[ 2 ], // Settings
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-(--bg-surface) border-t border-(--border) safe-area-bottom">
      <div className="flex justify-around py-2">
        {mobileItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center gap-1 px-2 py-1 text-(--text-4) hover:text-navy-500 transition-colors"
          >
            <Icon d={item.icon} size={20} strokeWidth={2} />
            <span className="text-[10px] font-medium">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}

/* ─── Portal layout ───────────────────────────────────────────────────────── */
export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/account");

  const user = session.user;

  return (
    <div className="min-h-screen bg-(--bg-base) pb-20 lg:pb-0">
      {/* Body: sidebar + content */}
      <div className="max-w-screen-xl mx-auto px-5 py-8">
        <div className="flex gap-8">
          <Sidebar user={user} />
          <main className="flex-1 min-w-0">
            {children}
          </main>
        </div>
      </div>

      <MobileNav />
    </div>
  );
}
