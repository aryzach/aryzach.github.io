// Server mirror of src/lib/contractConfig.ts. Keep them in sync.

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
export const INSURANCE_MONTHLY = 19;
export const SECOND_HEATER_MONTHLY = 209;

const PRICING: Record<SaunaTypeId, Record<number, number>> = {
  indoor_outdoor_traditional_latest: { 1: 1300, 3: 700, 6: 600, 12: 400 },
  outdoor_traditional_latest:        { 1: 1300, 3: 700, 6: 600, 12: 400 },
  indoor_infrared:                   { 1: 500,  3: 400, 6: 300, 12: 200 },
  outdoor_infrared:                  { 1: 600,  3: 500, 6: 400, 12: 300 },
  indoor_traditional:                { 1: 900,  3: 500, 6: 400, 12: 300 },
  outdoor_traditional_original:      { 1: 900,  3: 500, 6: 400, 12: 300 },
};

export function getSaunaTypeInfo(id: string): SaunaTypeInfo | undefined {
  return SAUNA_TYPES.find((s) => s.id === id);
}

export function getMonthlyPrice(saunaTypeId: string, months: number): number | null {
  const table = PRICING[saunaTypeId as SaunaTypeId];
  if (!table) return null;
  return table[months] ?? null;
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

export function isSanFranciscoCity(city: string | null | undefined): boolean {
  if (!city) return false;
  const s = city.trim().toLowerCase();
  if (!s) return false;
  if (s === "sf" || s === "s.f." || s === "s.f") return true;
  if (/san\s*francisco/.test(s)) return true;
  return false;
}

export function getDeliveryFee(cityOrAddress: string | null | undefined): number {
  if (isSanFranciscoCity(cityOrAddress)) return 0;
  return isSanFranciscoAddress(cityOrAddress) ? 0 : 150;
}