import {limitedRentalFamily,currentRentalTier} from "./currentRentalRates.ts";
// Traditional-sauna offers for unsigned and future agreements. Signed snapshots
// remain authoritative. Keep offer identifiers stable in contract snapshots.
export const FEBRUARY_INSTALLATION = "february_2027";
export const FAST_INSTALLATION_LABEL = "Installation within 1 week";
export const FEBRUARY_INSTALLATION_LABEL = "February installation";
export function isTraditional(type: string) { return /traditional/.test(type) && !limitedRentalFamily(type); }
export function installationOffer(type: string, months: number, variant: string | null) {
  if (limitedRentalFamily(type)) return variant === null ? currentRentalTier(months,type) : null;
  if (!isTraditional(type)) return null;
  if (variant === FEBRUARY_INSTALLATION) {
    if (months === 12) return { monthly: 400, installFee: 0 };
    if (months === 24) return { monthly: 300, installFee: 0 };
    return null;
  }
  return months === 36 && variant === null ? { monthly: 300, installFee: 0 } : null;
}
export function installationLabel(type: string, variant: string | null) {
  if (!isTraditional(type)) return null;
  return variant === FEBRUARY_INSTALLATION ? `${FEBRUARY_INSTALLATION_LABEL} 2027` : FAST_INSTALLATION_LABEL;
}
export function installationOfferError(type: string, months: number, variant: string | null, date: string) {
  if (variant !== FEBRUARY_INSTALLATION) return null;
  if (!installationOffer(type, months, variant)) return "Choose a valid February installation term.";
  if (!/^2027-02-(0[1-9]|1[0-9]|2[0-8])$/.test(date)) return "February pricing requires an installation date in February 2027.";
  return null;
}
