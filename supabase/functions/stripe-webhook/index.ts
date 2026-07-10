// Handles Stripe checkout.session.completed for reservation payments.
// Supports separate test and live signing secrets and de-duplicates events
// via the stripe_webhook_events table.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, stripe-signature",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const text = (body: string, status = 200) =>
  new Response(body, { status, headers: { ...corsHeaders, "Content-Type": "text/plain" } });

async function verifySignature(payload: string, signatureHeader: string, secret: string): Promise<boolean> {
  const parts = Object.fromEntries(
    signatureHeader.split(",").map((p) => p.trim().split("=") as [string, string]),
  );
  const t = parts["t"];
  const v1 = parts["v1"];
  if (!t || !v1) return false;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(`${t}.${payload}`));
  const hex = Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
  return hex === v1;
}

// Try test first, then live. Return the mode of the matching secret, or null.
async function verifyAny(
  payload: string,
  signatureHeader: string,
): Promise<"test" | "live" | null> {
  const testSecret = Deno.env.get("STRIPE_TEST_WEBHOOK_SECRET");
  const liveSecret = Deno.env.get("STRIPE_LIVE_WEBHOOK_SECRET");
  // Legacy fallback so an already-configured STRIPE_WEBHOOK_SECRET keeps working.
  const legacy = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (testSecret && (await verifySignature(payload, signatureHeader, testSecret))) return "test";
  if (liveSecret && (await verifySignature(payload, signatureHeader, liveSecret))) return "live";
  if (legacy && legacy !== "STRIPE_WEBHOOK_SECRET" &&
      (await verifySignature(payload, signatureHeader, legacy))) return "test";
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return text("Method not allowed", 405);

  const rawBody = await req.text();
  const signature = req.headers.get("stripe-signature");

  const hasAnySecret =
    !!Deno.env.get("STRIPE_TEST_WEBHOOK_SECRET") ||
    !!Deno.env.get("STRIPE_LIVE_WEBHOOK_SECRET") ||
    !!Deno.env.get("STRIPE_WEBHOOK_SECRET");

  if (hasAnySecret) {
    if (!signature) return text("Missing signature", 400);
    const mode = await verifyAny(rawBody, signature);
    if (!mode) return text("Invalid signature", 400);
  } else {
    console.warn("No STRIPE_*_WEBHOOK_SECRET configured — accepting without verification (dev only).");
  }

  let event: any;
  try { event = JSON.parse(rawBody); } catch { return text("Invalid JSON", 400); }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const session = event.data?.object ?? {};
  const reservationId: string | undefined = session.client_reference_id;
  const checkoutSessionId: string | undefined = session.id;
  const paymentIntentId: string | undefined =
    typeof session.payment_intent === "string" ? session.payment_intent : undefined;

  // Record every event (idempotency table). Duplicate stripe_event_id short-circuits.
  const { data: existing } = await supabase
    .from("stripe_webhook_events")
    .select("id, processing_status")
    .eq("stripe_event_id", event.id)
    .maybeSingle();

  if (existing?.processing_status === "success") {
    return text("duplicate", 200);
  }

  if (!existing) {
    await supabase.from("stripe_webhook_events").insert({
      stripe_event_id: event.id,
      event_type: event.type,
      livemode: !!event.livemode,
      client_reference_id: reservationId ?? null,
      checkout_session_id: checkoutSessionId ?? null,
      processing_status: "received",
    });
  }

  const markProcessed = async (status: "success" | "ignored" | "error", err?: string) => {
    await supabase
      .from("stripe_webhook_events")
      .update({ processing_status: status, error_message: err ?? null, processed_at: new Date().toISOString() })
      .eq("stripe_event_id", event.id);
  };

  if (event.type !== "checkout.session.completed") {
    await markProcessed("ignored");
    return text("ok", 200);
  }
  if (!reservationId) {
    console.warn("checkout.session.completed missing client_reference_id");
    await markProcessed("error", "missing client_reference_id");
    return text("ok", 200);
  }
  if (session.payment_status && session.payment_status !== "paid") {
    await markProcessed("ignored", `payment_status=${session.payment_status}`);
    return text("ok", 200);
  }

  // Load reservation
  const { data: reservation, error: rErr } = await supabase
    .from("reservations")
    .select("*")
    .eq("id", reservationId)
    .maybeSingle();
  if (rErr || !reservation) {
    console.error("Reservation not found:", reservationId, rErr);
    await markProcessed("error", "reservation not found");
    return text("ok", 200);
  }

  // Idempotency
  if (reservation.payment_status === "Paid") {
    await markProcessed("success");
    return text("already paid", 200);
  }

  const nowIso = new Date().toISOString();
  const holdDeadlineIso = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString();
  const preferredDate = String(reservation.preferred_install_at).slice(0, 10);

  // Find eligible sauna: Available first, else earliest Incoming/Returning/Maintenance
  // whose available_date <= preferred install date.
  const { data: candidates } = await supabase
    .from("sauna_inventory")
    .select("*")
    .eq("sauna_type_id", reservation.sauna_type_id)
    .in("status", ["Available", "Incoming", "Returning", "Maintenance"]);

  const available = (candidates ?? []).filter((c) => c.status === "Available");
  const upcoming = (candidates ?? [])
    .filter((c) => c.status !== "Available")
    .filter((c) => c.available_date && c.available_date <= preferredDate)
    .sort((a, b) => (a.available_date! < b.available_date! ? -1 : 1));

  const chosen = available[0] ?? upcoming[0] ?? null;

  const customerName = `${reservation.first_name} ${reservation.last_name}`.trim();

  if (!chosen) {
    // Mark for manual review, still mark paid.
    await supabase
      .from("reservations")
      .update({
        payment_status: "Paid",
        reservation_status: "Needs Manual Review",
        stripe_payment_id: paymentIntentId ?? checkoutSessionId ?? null,
        stripe_checkout_session_id: checkoutSessionId ?? null,
        stripe_payment_intent_id: paymentIntentId ?? null,
        payment_completed_at: nowIso,
        hold_created_at: nowIso,
      })
      .eq("id", reservationId);

    await supabase.from("reservation_events").insert([
      { reservation_id: reservationId, event_type: "Payment Received", message: "Reservation payment received." },
      { reservation_id: reservationId, event_type: "Needs Manual Review", message: "No eligible sauna available for auto-assignment." },
    ]);
    await markProcessed("success");
    return text("ok", 200);
  }

  // Assign sauna. Preserve available_date exactly as-is.
  await supabase
    .from("sauna_inventory")
    .update({
      status: "Reservation Hold",
      current_customer: customerName,
      reservation_id: reservationId,
    })
    .eq("id", chosen.id);

  await supabase
    .from("reservations")
    .update({
      payment_status: "Paid",
      reservation_status: "Reservation Hold",
      sauna_inventory_id: chosen.id,
      stripe_payment_id: paymentIntentId ?? checkoutSessionId ?? null,
      stripe_checkout_session_id: checkoutSessionId ?? null,
      stripe_payment_intent_id: paymentIntentId ?? null,
      payment_completed_at: nowIso,
      hold_created_at: nowIso,
      hold_deadline: holdDeadlineIso,
    })
    .eq("id", reservationId);

  await supabase.from("reservation_events").insert([
    { reservation_id: reservationId, event_type: "Payment Received", message: "Reservation payment received." },
    {
      reservation_id: reservationId,
      event_type: "Reservation Hold Created",
      message: "Sauna held (5-day informational deadline).",
      metadata: { sauna_inventory_id: chosen.id, hold_deadline: holdDeadlineIso },
    },
  ]);

  await markProcessed("success");
  return text("ok", 200);
});