// Handles Stripe checkout.session.completed for reservation payments.
// Uses a raw signature verification when STRIPE_WEBHOOK_SECRET is configured.

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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return text("Method not allowed", 405);

  const rawBody = await req.text();
  const secret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  const signature = req.headers.get("stripe-signature");

  if (secret && secret !== "STRIPE_WEBHOOK_SECRET") {
    if (!signature) return text("Missing signature", 400);
    const ok = await verifySignature(rawBody, signature, secret);
    if (!ok) return text("Invalid signature", 400);
  } else {
    console.warn("STRIPE_WEBHOOK_SECRET is unset — accepting webhook without signature verification (dev only).");
  }

  let event: any;
  try { event = JSON.parse(rawBody); } catch { return text("Invalid JSON", 400); }

  if (event.type !== "checkout.session.completed") {
    // Ignore other event types silently.
    return text("ok", 200);
  }

  const session = event.data?.object ?? {};
  const reservationId: string | undefined = session.client_reference_id;
  const paymentId: string | undefined = session.payment_intent || session.id;
  if (!reservationId) {
    console.warn("checkout.session.completed missing client_reference_id");
    return text("ok", 200);
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Load reservation
  const { data: reservation, error: rErr } = await supabase
    .from("reservations")
    .select("*")
    .eq("id", reservationId)
    .maybeSingle();
  if (rErr || !reservation) {
    console.error("Reservation not found:", reservationId, rErr);
    return text("ok", 200);
  }

  // Idempotency
  if (reservation.payment_status === "Paid") {
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
        stripe_payment_id: paymentId ?? null,
        hold_created_at: nowIso,
        hold_deadline: holdDeadlineIso,
      })
      .eq("id", reservationId);

    await supabase.from("reservation_events").insert([
      { reservation_id: reservationId, event_type: "Payment Received", message: "Reservation fee paid." },
      { reservation_id: reservationId, event_type: "Needs Manual Review", message: "No eligible sauna available for auto-assignment." },
    ]);
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
      stripe_payment_id: paymentId ?? null,
      hold_created_at: nowIso,
      hold_deadline: holdDeadlineIso,
    })
    .eq("id", reservationId);

  await supabase.from("reservation_events").insert([
    { reservation_id: reservationId, event_type: "Payment Received", message: "Reservation fee paid." },
    {
      reservation_id: reservationId,
      event_type: "Reservation Hold Created",
      message: `Sauna held until ${holdDeadlineIso}.`,
      metadata: { sauna_inventory_id: chosen.id },
    },
  ]);

  return text("ok", 200);
});