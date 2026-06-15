import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { connectDB, UserModel } from "@apt/db";
import { serializePaymentMethods, type PaymentMethodSubdoc } from "@/lib/account/payment-methods";
import PaymentMethods from "@/components/account/PaymentMethods";

export const metadata: Metadata = { title: "Payment Methods" };

export default async function PaymentPage() {
  const session = await auth();
  await connectDB();
  const user = await UserModel.findById(session!.user.id)
    .select("paymentMethods")
    .lean<{ paymentMethods?: PaymentMethodSubdoc[] }>();

  return <PaymentMethods initial={serializePaymentMethods(user?.paymentMethods ?? [])} />;
}
