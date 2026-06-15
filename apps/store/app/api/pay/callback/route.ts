import { NextRequest, NextResponse } from "next/server";
import { finalizePayment } from "@/lib/payments/finalize";

/**
 * Browser return URL from the Paystack checkout. Verifies the charge
 * server-side (never trusts the redirect alone) and bounces to the portal
 * with a status flag. The webhook performs the same finalization — whichever
 * lands first wins; the other becomes a no-op.
 */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token") ?? "";
  const reference =
    req.nextUrl.searchParams.get("reference") ??
    req.nextUrl.searchParams.get("trxref") ??
    "";

  const portal = new URL(`/pay/${token}`, req.nextUrl.origin);

  if (!token || !reference) {
    portal.searchParams.set("status", "invalid");
    return NextResponse.redirect(portal);
  }

  try {
    const result = await finalizePayment(reference);
    portal.searchParams.set(
      "status",
      result.ok ? "success" : result.status === "failed" ? "failed" : "error",
    );
  } catch (err) {
    console.error("[pay callback]", err);
    portal.searchParams.set("status", "error");
  }

  return NextResponse.redirect(portal);
}
