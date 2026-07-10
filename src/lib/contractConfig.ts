// Client-side helpers for the Rental Agreement configuration flow.
// Mirrored in supabase/functions/_shared/pricing.ts on the server; keep both
// in sync when pricing or option values change.

export type SaunaTypeId =
  | "indoor_infrared"
  | "outdoor_infrared"
  | "indoor_outdoor_traditional_latest"
  | "outdoor_traditional_latest"
  | "indoor_traditional"
  | "outdoor_traditional_original";

export type Placement = "indoor" | "outdoor";

export interface SaunaTypeInfo {
  id: SaunaTypeId;
  label: string;
  placement: Placement;
  family: "traditional" | "infrared";
  allowsSecondHeater: boolean;
}

export const SAUNA_TYPES: SaunaTypeInfo[] = [
  { id: "indoor_infrared", label: "Indoor Infrared Sauna", placement: "indoor", family: "infrared", allowsSecondHeater: false },
  { id: "outdoor_infrared", label: "Outdoor Infrared Sauna", placement: "outdoor", family: "infrared", allowsSecondHeater: false },
  { id: "indoor_outdoor_traditional_latest", label: "Indoor Traditional Sauna", placement: "indoor", family: "traditional", allowsSecondHeater: true },
  { id: "outdoor_traditional_latest", label: "Outdoor Traditional Sauna", placement: "outdoor", family: "traditional", allowsSecondHeater: true },
  { id: "indoor_traditional", label: "Original Collection Indoor Traditional Sauna", placement: "indoor", family: "traditional", allowsSecondHeater: true },
  { id: "outdoor_traditional_original", label: "Original Collection Outdoor Traditional Sauna", placement: "outdoor", family: "traditional", allowsSecondHeater: true },
];

export const COMMITMENT_MONTHS = [1, 3, 6, 12] as const;
export type CommitmentMonths = typeof COMMITMENT_MONTHS[number];

export const INSURANCE_MONTHLY = 19;
export const SECOND_HEATER_MONTHLY = 209;

// Monthly rental price by sauna type + commitment length. Mirrors
// src/lib/pricingCatalog.ts. Kept as a flat table so the server can use it too.
const PRICING: Record<SaunaTypeId, Record<CommitmentMonths, number>> = {
  indoor_outdoor_traditional_latest: { 1: 1199, 3: 599, 6: 499, 12: 399 },
  outdoor_traditional_latest:        { 1: 1199, 3: 599, 6: 499, 12: 399 },
  indoor_infrared:                   { 1: 549,  3: 399, 6: 299, 12: 199 },
  outdoor_infrared:                  { 1: 599,  3: 399, 6: 349, 12: 299 },
  indoor_traditional:                { 1: 899,  3: 499, 6: 399, 12: 299 },
  outdoor_traditional_original:      { 1: 899,  3: 499, 6: 399, 12: 299 },
};

export function getSaunaTypeInfo(id: string): SaunaTypeInfo | undefined {
  return SAUNA_TYPES.find((s) => s.id === id);
}

export function getMonthlyPrice(saunaTypeId: string, months: number): number | null {
  const table = PRICING[saunaTypeId as SaunaTypeId];
  if (!table) return null;
  return table[months as CommitmentMonths] ?? null;
}

export function getSecurityDeposit(saunaTypeId: string): number {
  const info = getSaunaTypeInfo(saunaTypeId);
  if (!info) return 0;
  return info.family === "infrared" ? 500 : 900;
}

export function isSanFranciscoAddress(address: string | null | undefined): boolean {
  if (!address) return false;
  const s = address.toLowerCase();
  if (/san francisco/.test(s)) return true;
  if (/\bsf\b/.test(s)) return true;
  if (/\b941\d{2}\b/.test(s)) return true;
  return false;
}

export function getDeliveryFee(address: string | null | undefined): number {
  return isSanFranciscoAddress(address) ? 0 : 150;
}

export function formatUSD(dollars: number): string {
  return dollars.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

export function commitmentLabel(m: number): string {
  return m === 1 ? "1 month" : `${m} months`;
}

// Acknowledgment definitions used by the signing UI (phase 3).
export const ACKNOWLEDGMENTS: { key: string; text: string }[] = [
  { key: "reviewed_agreement", text: "I have reviewed and agree to the Rental Summary and the Master Agreement." },
  { key: "commitment_binding", text: "I understand that the Initial Commitment Period is binding and that I am responsible for the rental fees due for the selected term." },
  { key: "cancellation_terms", text: "I understand the cancellation and pre-delivery cancellation terms." },
  { key: "safety_terms", text: "I have reviewed and agree to the Safe Operation and Fire Prevention Requirements." },
  { key: "electronic_signature_consent", text: "I consent to receive, sign, and retain this Agreement electronically, and I intend my typed legal name to serve as my electronic signature." },
];