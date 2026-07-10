// Placeholder external URLs for reservation flow.
// Replace with real Stripe Payment Link and Cal.com scheduling URLs when live.
export const RESERVATION_STRIPE_PAYMENT_LINK = "RESERVATION_STRIPE_PAYMENT_LINK";
export const CALCOM_VIDEO_CONSULT_LINK = "https://cal.com/sfsaunarental/sf-sauna-video-consultation?overlayCalendar=true";
export const CALCOM_INSTALLATION_LINK = "https://cal.com/sfsaunarental/sf-sauna-delivery-installation?overlayCalendar=true";

// Kept for backward-compat imports; both resolve to the single reservation link.
export const INFRARED_STRIPE_PAYMENT_LINK = RESERVATION_STRIPE_PAYMENT_LINK;
export const TRADITIONAL_STRIPE_PAYMENT_LINK = RESERVATION_STRIPE_PAYMENT_LINK;

export function resolveStripeLink(_url: string): string {
  return RESERVATION_STRIPE_PAYMENT_LINK;
}

export function buildStripeCheckoutUrl(reservationId: string): string {
  const base = RESERVATION_STRIPE_PAYMENT_LINK;
  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}client_reference_id=${encodeURIComponent(reservationId)}`;
}