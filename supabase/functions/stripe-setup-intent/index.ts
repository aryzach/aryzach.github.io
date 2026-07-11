// Creates a Stripe SetupIntent for us_bank_account (ACH) on the reservation's
// existing Stripe Customer. Returns the SetupIntent client_secret and the
// publishable key for Stripe.js to complete the bank-connect flow.
//
// Authenticated via reservation id + secure_token. Never exposes STRIPE_SECRET_KEY.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

function formEncode(obj: Record<string, string>): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(obj)) p.append(k, v);
  return p.toString();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  const publishableKey = Deno.env.get("STRIPE_PUBLISHABLE_KEY");
  if (!stripeKey || !publishableKey) {
    return json({ error: "Stripe keys not configured" }, 500);
  }

  let body: any = {};
  try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, 400); }
  const { id, token } = body ?? {};
  if (!id || !token) return json({ error: "Missing id or token" }, 400);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: reservation, error } = await supabase
    .from("reservations")
    .select("id, email, first_name, last_name, stripe_customer_id, ach_status, ach_bank_name, ach_bank_last4, stripe_customer_linkage_missing, payment_status")
    .eq("id", id)
    .eq("secure_token", token)
    .maybeSingle();
  if (error || !reservation) return json({ error: "Not found" }, 404);

  if (reservation.payment_status !== "Paid") {
    return json({ error: "Deposit must be paid before connecting a bank account." }, 400);
  }

  if (reservation.ach_status === "Connected") {
    return json({
      already_connected: true,
      bank_name: reservation.ach_bank_name,
      bank_last4: reservation.ach_bank_last4,
      publishable_key: publishableKey,
    });
  }

  if (!reservation.stripe_customer_id) {
    return json({
      error: "This reservation is not yet linked to a Stripe Customer. Please contact support.",
      linkage_missing: true,
    }, 409);
  }

  // Create SetupIntent.
  const params: Record<string, string> = {
    customer: reservation.stripe_customer_id,
    "payment_method_types[]": "us_bank_account",
    usage: "off_session",
    "payment_method_options[us_bank_account][verification_method]": "instant",
    "payment_method_options[us_bank_account][financial_connections][permissions][]": "payment_method",
    "metadata[reservation_id]": reservation.id,
    "metadata[customer_email]": reservation.email ?? "",
    "metadata[purpose]": "monthly_sauna_rent",
  };

  const r = await fetch("https://api.stripe.com/v1/setup_intents", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${stripeKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "Idempotency-Key": `setupintent_${reservation.id}_${Date.now()}`,
    },
    body: formEncode(params),
  });
  const si = await r.json();
  if (!r.ok) {
    console.error("SetupIntent create failed:", si);
    return json({ error: si.error?.message ?? "Stripe error" }, 500);
  }

  await supabase
    .from("reservations")
    .update({
      ach_status: "In Progress",
      stripe_ach_setup_intent_id: si.id,
    })
    .eq("id", reservation.id);

  await supabase.from("reservation_events").insert({
    reservation_id: reservation.id,
    event_type: "ACH Setup Started",
    message: "Customer opened the bank-account connection flow.",
    metadata: { setup_intent_id: si.id },
  });

  return json({
    client_secret: si.client_secret,
    setup_intent_id: si.id,
    publishable_key: publishableKey,
    customer_email: reservation.email,
    customer_name: `${reservation.first_name ?? ""} ${reservation.last_name ?? ""}`.trim(),
  });
});