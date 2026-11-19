// Owner-directed pricing for unsigned and future agreements. Signed agreements
// use their stored summary, never this lookup.
export const RENTAL_RATE_REVISION = 2026111802;
export const limitedRentalFamily = (type: string) => /infrared|_original$/.test(type);
export const isInfraredRental = (type: string) => /infrared/.test(type);
export function currentRentalTier(months: number, type = "") : { monthly: number; installFee: number } | null {
  if (limitedRentalFamily(type)) {
    const index = [6,12,24].indexOf(months);
    if (index < 0) return null;
    const rates = type === 'indoor_infrared_standard' ? [300,200,150] : [400,300,200];
    return {monthly: rates[index],installFee:0};
  }
  if (months === 6) return { monthly: 600, installFee: 500 };
  if (months === 12) return { monthly: 500, installFee: 0 };
  if (months === 24) return { monthly: 350, installFee: 0 };
  return null;
}
