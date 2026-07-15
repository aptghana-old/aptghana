import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { connectDB, UserModel } from "@apt/db";
import { serializeAddresses, type AddressSubdoc } from "@/lib/account/addresses";
import AddressBook from "@/components/account/AddressBook";

export const metadata: Metadata = { title: "Addresses" };

export default async function AddressesPage() {
  const session = await auth();
  await connectDB();
  const user = await UserModel.findById(session!.user.id)
    .select("addresses")
    .lean<{ addresses?: AddressSubdoc[] }>();

  return <AddressBook initial={serializeAddresses(user?.addresses ?? [])} />;
}
