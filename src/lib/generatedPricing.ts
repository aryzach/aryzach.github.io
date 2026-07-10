// AUTO-GENERATED — DO NOT EDIT BY HAND.
// Regenerate with `npm run pricing:sync` (reads from the pricing_tiers +
// pricing_config tables in Lovable Cloud). Committed to git so the app can
// build/prerender even when the database is unreachable.

export type SaunaTypeId =
  | "indoor_infrared"
  | "outdoor_infrared"
  | "indoor_outdoor_traditional_latest"
  | "outdoor_traditional_latest"
  | "indoor_traditional"
  | "outdoor_traditional_original";

export type CommitmentMonths = 1 | 3 | 6 | 12;

export interface PricingTierRow {
  monthly: number;
  installFee: number;
  badge?: "Most Popular" | "Best Value";
}

export const PRICING_TIERS: Record<SaunaTypeId, Record<CommitmentMonths, PricingTierRow>> = {
  indoor_infrared: {
    1: { monthly: 500, installFee: 200 },
    3: { monthly: 400, installFee: 200 },
    6: { monthly: 300, installFee: 0, badge: "Most Popular" },
    12: { monthly: 200, installFee: 0, badge: "Best Value" },
  },
  outdoor_infrared: {
    1: { monthly: 600, installFee: 200 },
    3: { monthly: 500, installFee: 200 },
    6: { monthly: 400, installFee: 0, badge: "Most Popular" },
    12: { monthly: 300, installFee: 0, badge: "Best Value" },
  },
  indoor_outdoor_traditional_latest: {
    1: { monthly: 1300, installFee: 500 },
    3: { monthly: 700, installFee: 500 },
    6: { monthly: 600, installFee: 0, badge: "Most Popular" },
    12: { monthly: 400, installFee: 0, badge: "Best Value" },
  },
  outdoor_traditional_latest: {
    1: { monthly: 1300, installFee: 500 },
    3: { monthly: 700, installFee: 500 },
    6: { monthly: 600, installFee: 0, badge: "Most Popular" },
    12: { monthly: 400, installFee: 0, badge: "Best Value" },
  },
  indoor_traditional: {
    1: { monthly: 900, installFee: 500 },
    3: { monthly: 500, installFee: 500 },
    6: { monthly: 400, installFee: 0, badge: "Most Popular" },
    12: { monthly: 300, installFee: 0, badge: "Best Value" },
  },
  outdoor_traditional_original: {
    1: { monthly: 900, installFee: 500 },
    3: { monthly: 500, installFee: 500 },
    6: { monthly: 400, installFee: 0, badge: "Most Popular" },
    12: { monthly: 300, installFee: 0, badge: "Best Value" },
  },
};

export const INSURANCE_MONTHLY = 19;
export const SECOND_HEATER_MONTHLY = 209;
export const DELIVERY_FEE_OUTSIDE_SF = 150;
export const RESERVATION_DEPOSIT_INFRARED = 200;
export const RESERVATION_DEPOSIT_TRADITIONAL = 500;
export const SECURITY_DEPOSIT_INFRARED = 500;
export const SECURITY_DEPOSIT_TRADITIONAL = 900;