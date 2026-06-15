/* Shared address sanitization/serialization for the /api/me/addresses routes. */

export interface AddressInput {
  label?: string;
  line1?: string;
  line2?: string;
  city?: string;
  region?: string;
  country?: string;
  postalCode?: string;
  phone?: string;
  isDefaultShipping?: boolean;
  isDefaultBilling?: boolean;
}

export interface AddressSubdoc {
  _id: { toString(): string };
  label?: string;
  line1?: string;
  line2?: string;
  city?: string;
  region?: string;
  country?: string;
  postalCode?: string;
  phone?: string;
  isDefaultShipping?: boolean;
  isDefaultBilling?: boolean;
  isDefault?: boolean;
  toObject?: () => Record<string, unknown>;
}

export function sanitizeAddress(body: AddressInput) {
  const str = (v: unknown, max = 200) => (typeof v === "string" ? v.trim().slice(0, max) : "");
  return {
    label: str(body.label, 60) || "Address",
    line1: str(body.line1, 200),
    line2: str(body.line2, 200) || undefined,
    city: str(body.city, 100),
    region: str(body.region, 100) || undefined,
    country: str(body.country, 60) || "GH",
    postalCode: str(body.postalCode, 30) || undefined,
    phone: str(body.phone, 50) || undefined,
  };
}

export function serializeAddresses(addresses: AddressSubdoc[]) {
  return addresses.map((a) => ({
    id: a._id.toString(),
    label: a.label ?? "Address",
    line1: a.line1 ?? "",
    line2: a.line2 ?? "",
    city: a.city ?? "",
    region: a.region ?? "",
    country: a.country ?? "GH",
    postalCode: a.postalCode ?? "",
    phone: a.phone ?? "",
    // Legacy single default counts as the shipping default
    isDefaultShipping: Boolean(a.isDefaultShipping || a.isDefault),
    isDefaultBilling: Boolean(a.isDefaultBilling),
  }));
}

export type SerializedAddress = ReturnType<typeof serializeAddresses>[number];
