import type { DealFilterOptions, DealKind } from "@/lib/dealFilters";

export interface DealFilterFormState {
  preset: string;
  from: string;
  to: string;
  status: string;
  customer: string;
  company: string;
  country: string;
  currency: string;
  salesRep: string;
  assignedUser: string;
  brand: string;
  categoryId: string;
  categoryLabel: string;
  minValue: string;
  maxValue: string;
  channel: string;
  paymentStatus: string;
  expiring: string;
}

export const DATE_PRESETS: { value: string; label: string }[] = [
  { value: "7d", label: "Last 7 Days" },
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "30d", label: "Last 30 Days" },
  { value: "this_month", label: "This Month" },
  { value: "last_month", label: "Last Month" },
  { value: "this_quarter", label: "This Quarter" },
  { value: "this_year", label: "This Year" },
  { value: "all", label: "All Time" },
  { value: "custom", label: "Custom Range" },
];

export function emptyFormState(sp: Record<string, string | undefined>): DealFilterFormState {
  return {
    preset: sp.preset ?? "30d",
    from: sp.from ?? "",
    to: sp.to ?? "",
    status: sp.status ?? "",
    customer: sp.customer ?? "",
    company: sp.company ?? "",
    country: sp.country ?? "",
    currency: sp.currency ?? "",
    salesRep: sp.salesRep ?? "",
    assignedUser: sp.assignedUser ?? "",
    brand: sp.brand ?? "",
    categoryId: sp.categoryId ?? "",
    categoryLabel: sp.categoryLabel ?? "",
    minValue: sp.minValue ?? "",
    maxValue: sp.maxValue ?? "",
    channel: sp.channel ?? "",
    paymentStatus: sp.paymentStatus ?? "",
    expiring: sp.expiring ?? "",
  };
}

/** Builds the querystring (drops empty values + the UI-only categoryLabel field). */
export function formStateToParams(state: DealFilterFormState): URLSearchParams {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(state)) {
    if (key === "categoryLabel") continue;
    if (value) qs.set(key, value);
  }
  return qs;
}

export interface ChipDef { key: keyof DealFilterFormState; label: string }

export function buildChips(state: DealFilterFormState, options: DealFilterOptions, kind: DealKind): { key: string; label: string }[] {
  const chips: { key: string; label: string }[] = [];
  if (state.preset && state.preset !== "30d") {
    const preset = DATE_PRESETS.find((p) => p.value === state.preset);
    chips.push({ key: "preset", label: preset?.label ?? state.preset });
  }
  if (state.status) chips.push({ key: "status", label: `Status: ${state.status.replace(/_/g, " ")}` });
  if (state.customer) chips.push({ key: "customer", label: `Customer: ${state.customer}` });
  if (state.company) chips.push({ key: "company", label: `Company: ${state.company}` });
  if (state.country) chips.push({ key: "country", label: `Country: ${state.country}` });
  if (state.currency) chips.push({ key: "currency", label: `Currency: ${state.currency}` });
  if (state.salesRep) chips.push({ key: "salesRep", label: `Rep: ${options.salesReps.find((r) => r.value === state.salesRep)?.label ?? state.salesRep}` });
  if (state.assignedUser) chips.push({ key: "assignedUser", label: `Assigned: ${options.salesReps.find((r) => r.value === state.assignedUser)?.label ?? state.assignedUser}` });
  if (state.brand) chips.push({ key: "brand", label: `Brand: ${options.brands.find((b) => b.value === state.brand)?.label ?? state.brand}` });
  if (state.categoryId) chips.push({ key: "categoryId", label: `Category: ${state.categoryLabel || state.categoryId}` });
  if (state.minValue || state.maxValue) chips.push({ key: "minValue", label: `Value: ${state.minValue || "0"}–${state.maxValue || "∞"}` });
  if (state.channel) chips.push({ key: "channel", label: `Channel: ${state.channel}` });
  if (kind === "order" && state.paymentStatus) chips.push({ key: "paymentStatus", label: `Payment: ${state.paymentStatus}` });
  if (kind === "quote" && state.expiring) chips.push({ key: "expiring", label: state.expiring === "expired" ? "Expired" : "Expiring soon" });
  return chips;
}
