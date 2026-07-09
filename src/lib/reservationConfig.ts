// Placeholder external URLs for reservation flow.
// Replace with real Stripe Payment Links and Cal.com scheduling URLs when live.
export const INFRARED_STRIPE_PAYMENT_LINK = "INFRARED_STRIPE_PAYMENT_LINK";
export const TRADITIONAL_STRIPE_PAYMENT_LINK = "TRADITIONAL_STRIPE_PAYMENT_LINK";
export const CALCOM_VIDEO_CONSULT_LINK = "CALCOM_VIDEO_CONSULT_LINK";
export const CALCOM_INSTALLATION_LINK = "CALCOM_INSTALLATION_LINK";

export function resolveStripeLink(url: string): string {
  if (url === "INFRARED_STRIPE_PAYMENT_LINK") return INFRARED_STRIPE_PAYMENT_LINK;
  if (url === "TRADITIONAL_STRIPE_PAYMENT_LINK") return TRADITIONAL_STRIPE_PAYMENT_LINK;
  return url;
}