import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getProfile } from "@/lib/account/profile";
import ProfileForm from "@/components/account/ProfileForm";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const session = await auth();
  const profile = await getProfile(session!.user.id);
  if (!profile) notFound();

  return <ProfileForm profile={profile} />;
}
