/* Shared payment-method validation/serialization for /api/me/payment-methods. */

export interface PaymentMethodInput {
  type?: string;
  label?: string;
  brand?: string;
  last4?: string;
  expMonth?: number;
  expYear?: number;
  momoNetwork?: string;
  bankName?: string;
  isDefault?: boolean;
}

export interface PaymentMethodSubdoc {
  _id: { toString(): string };
  type: string;
  label?: string;
  brand?: string;
  last4?: string;
  expMonth?: number;
  expYear?: number;
  momoNetwork?: string;
  bankName?: string;
  isDefault?: boolean;
  createdAt?: Date;
}

const TYPES = ["card", "mobile_money", "bank"];
const MOMO_NETWORKS = ["MTN MoMo", "Telecel Cash", "AT Money"];

/**
 * Display metadata only — full card / wallet numbers are never accepted.
 * Returns an error string or the sanitized method.
 */
export function sanitizePaymentMethod(body: PaymentMethodInput):
  | { error: string }
  | { method: Omit<PaymentMethodSubdoc, "_id"> } {
  const type = String(body.type ?? "");
  if (!TYPES.includes(type)) return { error: "Choose a payment method type" };

  const last4 = String(body.last4 ?? "").replace(/\D/g, "");
  if (last4.length !== 4) return { error: "Last 4 digits are required" };

  const str = (v: unknown, max = 60) => (typeof v === "string" ? v.trim().slice(0, max) : "");

  if (type === "card") {
    const month = Math.floor(Number(body.expMonth));
    const year = Math.floor(Number(body.expYear));
    if (!(month >= 1 && month <= 12)) return { error: "Enter a valid expiry month" };
    const now = new Date();
    const fullYear = year < 100 ? 2000 + year : year;
    if (fullYear < now.getFullYear() || fullYear > now.getFullYear() + 25) {
      return { error: "Enter a valid expiry year" };
    }
    if (fullYear === now.getFullYear() && month < now.getMonth() + 1) {
      return { error: "This card has already expired" };
    }
    return {
      method: {
        type, last4,
        label: str(body.label) || `Card •••• ${last4}`,
        brand: str(body.brand, 30) || "Card",
        expMonth: month,
        expYear: fullYear,
        isDefault: Boolean(body.isDefault),
      },
    };
  }

  if (type === "mobile_money") {
    const network = MOMO_NETWORKS.includes(String(body.momoNetwork)) ? String(body.momoNetwork) : "";
    if (!network) return { error: "Choose a mobile money network" };
    return {
      method: {
        type, last4,
        label: str(body.label) || `${network} •••• ${last4}`,
        brand: network,
        momoNetwork: network,
        isDefault: Boolean(body.isDefault),
      },
    };
  }

  // bank
  const bankName = str(body.bankName, 100);
  if (!bankName) return { error: "Bank name is required" };
  return {
    method: {
      type, last4, bankName,
      label: str(body.label) || `${bankName} •••• ${last4}`,
      brand: bankName,
      isDefault: Boolean(body.isDefault),
    },
  };
}

export function serializePaymentMethods(methods: PaymentMethodSubdoc[]) {
  return methods.map((m) => ({
    id: m._id.toString(),
    type: m.type,
    label: m.label ?? "",
    brand: m.brand ?? "",
    last4: m.last4 ?? "",
    expMonth: m.expMonth ?? null,
    expYear: m.expYear ?? null,
    momoNetwork: m.momoNetwork ?? "",
    bankName: m.bankName ?? "",
    isDefault: Boolean(m.isDefault),
    createdAt: m.createdAt ?? null,
  }));
}

export type SerializedPaymentMethod = ReturnType<typeof serializePaymentMethods>[number];
