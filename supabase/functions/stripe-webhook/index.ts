// Handles Stripe checkout.session.completed for reservation payments.
// Supports separate test and live signing secrets and de-duplicates events
// via the stripe_webhook_events table.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { sendReservationEmail } from "../_shared/reservationEmails.ts";

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
    // Handle SetupIntent lifecycle (ACH bank connection) below.
    if (
      event.type === "setup_intent.succeeded" ||
      event.type === "setup_intent.setup_failed" ||
      event.type === "setup_intent.canceled"
    ) {
      const si = event.data?.object ?? {};
      const siReservationId: string | undefined = si.metadata?.reservation_id;
      if (!siReservationId) {
        await markProcessed("ignored", "setup_intent missing reservation_id metadata");
        return text("ok", 200);
      }

      const { data: res } = await supabase
        .from("reservations")
        .select("id, stripe_customer_id, ach_status")
        .eq("id", siReservationId)
        .maybeSingle();
      if (!res) {
        await markProcessed("error", "reservation not found for setup_intent");
        return text("ok", 200);
      }

      // Ensure the SetupIntent Customer matches this reservation's Customer.
      const siCustomer: string | null =
        typeof si.customer === "string" ? si.customer : si.customer?.id ?? null;
      if (res.stripe_customer_id && siCustomer && siCustomer !== res.stripe_customer_id) {
        console.error(
          `SetupIntent customer mismatch: reservation ${res.id} has ${res.stripe_customer_id}, SetupIntent ${si.id} has ${siCustomer}`,
        );
        await supabase.from("reservation_events").insert({
          reservation_id: res.id,
          event_type: "ACH Customer Mismatch",
          message: "SetupIntent customer did not match reservation Stripe customer. Not applied.",
          metadata: { setup_intent_id: si.id, expected: res.stripe_customer_id, got: siCustomer },
        });
        await markProcessed("error", "customer mismatch");
        return text("ok", 200);
      }

      if (event.type === "setup_intent.succeeded") {
        const pmId: string | null =
          typeof si.payment_method === "string" ? si.payment_method : si.payment_method?.id ?? null;

        // Fetch PaymentMethod for safe display fields (bank name, last4).
        let bankName: string | null = null;
        let bankLast4: string | null = null;
        if (pmId) {
          try {
            const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
            if (stripeKey) {
              const pmRes = await fetch(`https://api.stripe.com/v1/payment_methods/${pmId}`, {
                headers: { Authorization: `Bearer ${stripeKey}` },
              });
              const pm = await pmRes.json();
              bankName = pm?.us_bank_account?.bank_name ?? null;
              bankLast4 = pm?.us_bank_account?.last4 ?? null;
            }
          } catch (e) {
            console.error("PaymentMethod lookup failed:", e);
          }
        }

        // Idempotent: if already Connected with the same setup intent, short-circuit.
        if (res.ach_status === "Connected") {
          await markProcessed("success");
          return text("already connected", 200);
        }

        await supabase
          .from("reservations")
          .update({
            ach_status: "Connected",
            ach_connected_at: new Date().toISOString(),
            stripe_ach_setup_intent_id: si.id,
            stripe_ach_payment_method_id: pmId,
            ach_bank_name: bankName,
            ach_bank_last4: bankLast4,
            ach_last_error: null,
          })
          .eq("id", res.id);
        await supabase.from("reservation_events").insert({
          reservation_id: res.id,
          event_type: "Bank Account Connected",
          message: bankName && bankLast4
            ? `Bank account connected (${bankName} ••${bankLast4}).`
            : "Bank account connected for future rent payments.",
          metadata: { setup_intent_id: si.id, payment_method_id: pmId },
        });
      } else if (event.type === "setup_intent.setup_failed") {
        const errMsg: string = si.last_setup_error?.message ?? "Bank connection failed.";
        await supabase
          .from("reservations")
          .update({
            ach_status: "Failed",
            ach_last_error: errMsg.slice(0, 500),
          })
          .eq("id", res.id);
        await supabase.from("reservation_events").insert({
          reservation_id: res.id,
          event_type: "Bank Connection Failed",
          message: errMsg.slice(0, 500),
          metadata: { setup_intent_id: si.id },
        });
      } else if (event.type === "setup_intent.canceled") {
        await supabase
          .from("reservations")
          .update({
            ach_status: "Not Connected",
          })
          .eq("id", res.id);
        await supabase.from("reservation_events").insert({
          reservation_id: res.id,
          event_type: "Bank Connection Canceled",
          message: "Customer canceled the bank-account connection.",
          metadata: { setup_intent_id: si.id },
        });
      }

      await markProcessed("success");
      return text("ok", 200);
    }

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

  // Extract Stripe Customer ID (may be null if Payment Link doesn't create one).
  const sessionCustomerId: string | null =
    typeof session.customer === "string"
      ? session.customer
      : session.customer?.id ?? null;

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

  // Determine stripe_customer_id handling:
  //  - if reservation already has one and it differs, don't overwrite; flag mismatch.
  //  - if session.customer is missing, mark linkage_missing for admin review.
  const customerFlag: {
    stripe_customer_id?: string | null;
    stripe_customer_linkage_missing?: boolean;
  } = {};
  if (sessionCustomerId) {
    if (reservation.stripe_customer_id && reservation.stripe_customer_id !== sessionCustomerId) {
      // Do not overwrite; flag for admin review.
      await supabase.from("reservation_events").insert({
        reservation_id: reservation.id,
        event_type: "Stripe Customer Mismatch",
        message: "Checkout Session Customer differs from existing reservation Customer. Not overwritten.",
        metadata: {
          existing: reservation.stripe_customer_id,
          incoming: sessionCustomerId,
          checkout_session_id: checkoutSessionId,
        },
      });
    } else {
      customerFlag.stripe_customer_id = sessionCustomerId;
      customerFlag.stripe_customer_linkage_missing = false;
    }
  } else {
    // No customer on the session — flag it. Admin can backfill or link manually.
    customerFlag.stripe_customer_linkage_missing = true;
    await supabase.from("reservation_events").insert({
      reservation_id: reservation.id,
      event_type: "Stripe Customer Missing",
      message: "Checkout Session had no Customer. ACH connection is blocked until admin links a Customer.",
      metadata: { checkout_session_id: checkoutSessionId },
    });
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
        ...customerFlag,
      })
      .eq("id", reservationId);

    await supabase.from("reservation_events").insert([
      { reservation_id: reservationId, event_type: "Payment Received", message: "Reservation payment received." },
      { reservation_id: reservationId, event_type: "Needs Manual Review", message: "No eligible sauna available for auto-assignment." },
    ]);
    try {
      await sendReservationEmail(supabase, reservationId, "payment_received");
    } catch (e) { console.error("payment_received email threw:", e); }
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
      ...customerFlag,
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

  try {
    await sendReservationEmail(supabase, reservationId, "payment_received");
  } catch (e) { console.error("payment_received email threw:", e); }

  await markProcessed("success");
  return text("ok", 200);
});