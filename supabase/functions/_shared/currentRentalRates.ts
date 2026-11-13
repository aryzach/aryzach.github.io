// Owner-directed reset of unsigned and future rental prices on November 12, 2026.
// Signed agreements use their stored summary, never this lookup.
export const RENTAL_RATE_REVISION = 20261112;
export function currentRentalTier(months: number): { monthly: number; installFee: number } | null {
  if (months === 6) return { monthly: 600, installFee: 500 };
  if (months === 12) return { monthly: 500, installFee: 0 };
  if (months === 24) return { monthly: 350, installFee: 0 };
  return null;
}
