// External URLs for the reservation flow.
import { supabase } from "@/integrations/supabase/client";

export const CALCOM_VIDEO_CONSULT_LINK =
  "https://cal.com/sfsaunarental/sf-sauna-video-consultation?overlayCalendar=true";
export const CALCOM_INSTALLATION_LINK =
  "https://cal.com/sfsaunarental/sf-sauna-delivery-installation?overlayCalendar=true";

// The reservation deposit is standardized at $200 for every sauna type.
export const RESERVATION_DEPOSIT_USD = 200;

// Fallback link used only if the app_config lookup fails.
const FALLBACK_TEST_LINK = "https://buy.stripe.com/4gMeVd5XNfZQ3Oc2Tp6Vq1G";

let cachedLink: string | null = null;
let cachedMode: "test" | "live" | null = null;

export interface StripeReservationConfig {
  mode: "test" | "live";
  baseLink: string;
}

/** Load the active Stripe reservation payment link + mode from app_config. */
export async function getStripeReservationConfig(): Promise<StripeReservationConfig> {
  if (cachedLink && cachedMode) return { mode: cachedMode, baseLink: cachedLink };
  const { data } = await supabase
    .from("app_config" as any)
    .select("key,value")
    .in("key", [
      "stripe_mode",
      "stripe_test_reservation_payment_link",
      "stripe_live_reservation_payment_link",
    ]);
  const map = new Map<string, string>(
    ((data as any[]) ?? []).map((r) => [r.key as string, r.value as string]),
  );
  const mode = (map.get("stripe_mode") === "live" ? "live" : "test") as "test" | "live";
  const link =
    (mode === "live"
      ? map.get("stripe_live_reservation_payment_link")
      : map.get("stripe_test_reservation_payment_link")) || FALLBACK_TEST_LINK;
  cachedLink = link;
  cachedMode = mode;
  return { mode, baseLink: link };
}

/** Append client_reference_id + optional prefilled_email to a Stripe Payment Link. */
export function buildStripeCheckoutUrl(
  baseLink: string,
  reservationId: string,
  email?: string | null,
): string {
  const params = new URLSearchParams();
  params.set("client_reference_id", reservationId);
  if (email) params.set("prefilled_email", email);
  const sep = baseLink.includes("?") ? "&" : "?";
  return `${baseLink}${sep}${params.toString()}`;
}

/** Legacy call-site convenience — always returns the standardized $200 deposit. */
export function reservationDepositForSaunaType(_id: string | null | undefined): {
  amount: number;
} {
  return { amount: RESERVATION_DEPOSIT_USD };
}

// Legacy exports kept so any stray imports resolve.
export const RESERVATION_STRIPE_PAYMENT_LINK = FALLBACK_TEST_LINK;
export function resolveStripeLink(_url: string): string {
  return FALLBACK_TEST_LINK;
}