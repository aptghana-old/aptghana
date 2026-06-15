import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getProfile } from "@/lib/account/profile";
import NotificationsForm from "@/components/account/NotificationsForm";

export const metadata: Metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const session = await auth();
  const profile = await getProfile(session!.user.id);
  if (!profile) notFound();

  return <NotificationsForm initial={profile.notificationPrefs} />;
}
