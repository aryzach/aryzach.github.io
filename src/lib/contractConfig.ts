import { installationOffer } from "../../supabase/functions/_shared/installationOffers.ts";
import { currentRentalTier } from "../../supabase/functions/_shared/currentRentalRates.ts";
import { LEGACY_RENTAL_TIERS } from "../../supabase/functions/_shared/legacyRentalPricing.ts";
import { standardTraditionalTier } from "./rentalTerms";
// Client-side helpers for the Rental Agreement configuration flow.
// Pricing values come from src/lib/generatedPricing.ts (synced from Lovable
// Cloud). The server mirror is supabase/functions/_shared/pricing.ts.

import {
  PRICING_TIERS,
  INSURANCE_MONTHLY as GEN_INSURANCE_MONTHLY,
  SECOND_HEATER_MONTHLY as GEN_SECOND_HEATER_MONTHLY,
  SECURITY_DEPOSIT_INFRARED,
  SECURITY_DEPOSIT_TRADITIONAL,
  DELIVERY_FEE_OUTSIDE_SF,
  type SaunaTypeId as GenSaunaTypeId,
  type CommitmentMonths as GenCommitmentMonths,
} from "./generatedPricing";

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
  { id: "indoor_infrared_standard", label: "Indoor Infrared Sauna", placement: "indoor", family: "infrared", allowsSecondHeater: false },
  { id: "outdoor_infrared_standard", label: "Outdoor Infrared Sauna", placement: "outdoor", family: "infrared", allowsSecondHeater: false },
  { id: "indoor_traditional_standard", label: "Indoor Traditional Sauna", placement: "indoor", family: "traditional", allowsSecondHeater: true },
  { id: "outdoor_traditional_standard", label: "Outdoor Traditional Sauna", placement: "outdoor", family: "traditional", allowsSecondHeater: true },
  { id: "indoor_traditional_original", label: "Original Collection Indoor Traditional Sauna", placement: "indoor", family: "traditional", allowsSecondHeater: true },
  { id: "outdoor_traditional_original", label: "Original Collection Outdoor Traditional Sauna", placement: "outdoor", family: "traditional", allowsSecondHeater: true },
];

export const COMMITMENT_MONTHS = [1, 3, 6, 12, 24, 36] as const;
export type CommitmentMonths = GenCommitmentMonths;

export const INSURANCE_MONTHLY = GEN_INSURANCE_MONTHLY;
export const SECOND_HEATER_MONTHLY = GEN_SECOND_HEATER_MONTHLY;

export function getSaunaTypeInfo(id: string): SaunaTypeInfo | undefined {
  return SAUNA_TYPES.find((s) => s.id === id);
}

export function getMonthlyPrice(saunaTypeId: string, months: number, policyVersion = 2, frozen?: Record<string, any> | null): number | null {
  const offer = installationOffer(saunaTypeId, months, null);
  if (offer) return offer.monthly;
  const revised = getSaunaTypeInfo(saunaTypeId) ? currentRentalTier(months) : null;
  if (revised) return revised.monthly;
  if (policyVersion < 2) return frozen?.[saunaTypeId]?.[months]?.monthly ?? LEGACY_RENTAL_TIERS[saunaTypeId]?.[months]?.monthly ?? null;
  const current = standardTraditionalTier(saunaTypeId, months);
  if (current) return current.monthly;
  const table = PRICING_TIERS[saunaTypeId as SaunaTypeId];
  if (!table) return null;
  const row = table[months as CommitmentMonths];
  return row ? row.monthly : null;
}

export function getInstallFee(saunaTypeId: string, months: number, policyVersion = 2, frozen?: Record<string, any> | null): number | null {
  const offer = installationOffer(saunaTypeId, months, null);
  if (offer) return offer.installFee;
  const revised = getSaunaTypeInfo(saunaTypeId) ? currentRentalTier(months) : null;
  if (revised) return revised.installFee;
  if (policyVersion < 2) return frozen?.[saunaTypeId]?.[months]?.installFee ?? LEGACY_RENTAL_TIERS[saunaTypeId]?.[months]?.installFee ?? null;
  const current = standardTraditionalTier(saunaTypeId, months);
  if (current) return current.installFee;
  const table = PRICING_TIERS[saunaTypeId as SaunaTypeId];
  if (!table) return null;
  const row = table[months as CommitmentMonths];
  return row ? row.installFee : null;
}

export function getSecurityDeposit(saunaTypeId: string, customDeposit?: number | null): number {
  const info = getSaunaTypeInfo(saunaTypeId);
  if (!info) return 0;
  return info.family === "traditional" ? SECURITY_DEPOSIT_TRADITIONAL : customDeposit ?? SECURITY_DEPOSIT_INFRARED;
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
  if (/^san\s+francisco(?:\s*,.*)?$/.test(s)) return true;
  return false;
}

export function getDeliveryFee(cityOrAddress: string | null | undefined): number {
  if (isSanFranciscoCity(cityOrAddress)) return 0;
  return DELIVERY_FEE_OUTSIDE_SF;
}

export function formatUSD(dollars: number): string {
  return dollars.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 2 });
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