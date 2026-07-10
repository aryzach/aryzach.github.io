// Server mirror of src/lib/contractConfig.ts. Sources numeric pricing from
// the auto-generated file that is synced from the database at build time.
//
// Deno edge functions import the .ts source directly.

import {
  PRICING_TIERS,
  INSURANCE_MONTHLY as GEN_INSURANCE_MONTHLY,
  SECOND_HEATER_MONTHLY as GEN_SECOND_HEATER_MONTHLY,
  SECURITY_DEPOSIT_INFRARED,
  SECURITY_DEPOSIT_TRADITIONAL,
  DELIVERY_FEE_OUTSIDE_SF,
  type SaunaTypeId as GenSaunaTypeId,
} from "../../../src/lib/generatedPricing.ts";

export type SaunaTypeId = GenSaunaTypeId;

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
export const INSURANCE_MONTHLY = GEN_INSURANCE_MONTHLY;
export const SECOND_HEATER_MONTHLY = GEN_SECOND_HEATER_MONTHLY;

export function getSaunaTypeInfo(id: string): SaunaTypeInfo | undefined {
  return SAUNA_TYPES.find((s) => s.id === id);
}

export function getMonthlyPrice(saunaTypeId: string, months: number): number | null {
  const table = PRICING_TIERS[saunaTypeId as SaunaTypeId];
  if (!table) return null;
  const row = table[months as 1 | 3 | 6 | 12];
  return row ? row.monthly : null;
}

export function getSecurityDeposit(saunaTypeId: string): number {
  const info = getSaunaTypeInfo(saunaTypeId);
  if (!info) return 0;
  return info.family === "infrared" ? SECURITY_DEPOSIT_INFRARED : SECURITY_DEPOSIT_TRADITIONAL;
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
  return isSanFranciscoAddress(cityOrAddress) ? 0 : DELIVERY_FEE_OUTSIDE_SF;
}