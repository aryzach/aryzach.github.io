// Frozen fallback for bookings made before rental terms v2. Never regenerated.
export const LEGACY_RENTAL_TIERS: Record<string, Record<number, {monthly: number; installFee: number; badge?: string}>> = {
  indoor_infrared_standard: {
    1: { monthly: 500, installFee: 200 },
    3: { monthly: 400, installFee: 200 },
    6: { monthly: 300, installFee: 0, badge: "Most Popular" },
    12: { monthly: 200, installFee: 0, badge: "Best Value" },
  },
  outdoor_infrared_standard: {
    1: { monthly: 600, installFee: 200 },
    3: { monthly: 500, installFee: 200 },
    6: { monthly: 400, installFee: 0, badge: "Most Popular" },
    12: { monthly: 300, installFee: 0, badge: "Best Value" },
  },
  indoor_traditional_standard: {
    1: { monthly: 1200, installFee: 500 },
    3: { monthly: 800, installFee: 500 },
    6: { monthly: 600, installFee: 0, badge: "Most Popular" },
    12: { monthly: 400, installFee: 0, badge: "Best Value" },
    24: { monthly: 300, installFee: 0 },
  },
  outdoor_traditional_standard: {
    1: { monthly: 1200, installFee: 500 },
    3: { monthly: 800, installFee: 500 },
    6: { monthly: 600, installFee: 0, badge: "Most Popular" },
    12: { monthly: 400, installFee: 0, badge: "Best Value" },
    24: { monthly: 300, installFee: 0 },
  },
  indoor_traditional_original: {
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
