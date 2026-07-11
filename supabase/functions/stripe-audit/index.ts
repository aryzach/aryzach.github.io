import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b, null, 2), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  const key = Deno.env.get("STRIPE_SECRET_KEY");
  if (!key) return json({ error: "STRIPE_SECRET_KEY not set" }, 500);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Grab up to 5 most recent successful checkout.session.completed events.
  const { data: events } = await supabase
    .from("stripe_webhook_events")
    .select("stripe_event_id, checkout_session_id, client_reference_id, livemode, received_at")
    .eq("event_type", "checkout.session.completed")
    .eq("processing_status", "success")
    .order("received_at", { ascending: false })
    .limit(5);

  const out: any[] = [];
  for (const ev of events ?? []) {
    if (!ev.checkout_session_id) continue;
    const r = await fetch(`https://api.stripe.com/v1/checkout/sessions/${ev.checkout_session_id}`, {
      headers: { Authorization: `Bearer ${key}` },
    });
    const body = await r.json();
    out.push({
      event_id: ev.stripe_event_id,
      livemode_event: ev.livemode,
      checkout_session_id: ev.checkout_session_id,
      reservation_id: ev.client_reference_id,
      session_livemode: body.livemode,
      customer: body.customer ?? null,
      customer_email: body.customer_details?.email ?? body.customer_email ?? null,
      payment_status: body.payment_status,
      payment_intent: body.payment_intent,
      mode: body.mode,
      status: body.status,
      error: body.error?.message ?? null,
    });
  }
  return json({ count: out.length, sessions: out });
});