import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let body: any = {};
  try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, 400); }

  const { id, token, sauna_type_id, preferred_install_date } = body ?? {};
  if (!id || !token || typeof id !== "string" || typeof token !== "string") {
    return json({ error: "Missing id or token" }, 400);
  }
  if (!sauna_type_id && !preferred_install_date) {
    return json({ error: "Nothing to update" }, 400);
  }
  if (preferred_install_date && !/^\d{4}-\d{2}-\d{2}$/.test(preferred_install_date)) {
    return json({ error: "Invalid date" }, 400);
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Verify token and load reservation
  const { data: reservation, error: rErr } = await supabase
    .from("reservations")
    .select("id, sauna_type_id, preferred_install_at, payment_status, sauna_inventory_id")
    .eq("id", id)
    .eq("secure_token", token)
    .maybeSingle();
  if (rErr || !reservation) return json({ error: "Not found" }, 404);

  // Block edits if a signed contract exists
  const { data: contract } = await supabase
    .from("contracts")
    .select("status")
    .eq("reservation_id", id)
    .maybeSingle();
  if (contract?.status === "Signed") {
    return json({ error: "Your contract is signed. Please contact us to make changes." }, 400);
  }

  const update: Record<string, unknown> = {};

  // Sauna type change — only allowed before payment
  if (sauna_type_id && sauna_type_id !== reservation.sauna_type_id) {
    if (reservation.payment_status === "Paid") {
      return json({
        error: "Sauna type can't be changed after your deposit is paid. Please contact us.",
      }, 400);
    }
    const { data: st } = await supabase
      .from("sauna_types").select("id").eq("id", sauna_type_id).maybeSingle();
    if (!st) return json({ error: "Unknown sauna type" }, 400);
    update.sauna_type_id = sauna_type_id;
  }

  // Date change — allowed pre-signed
  if (preferred_install_date) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const d = new Date(preferred_install_date + "T00:00:00");
    if (d < today) return json({ error: "Installation date can't be before today." }, 400);
    update.preferred_install_at = d.toISOString();
  }

  if (Object.keys(update).length === 0) return json({ ok: true, changed: false });

  const { error: uErr } = await supabase
    .from("reservations").update(update).eq("id", id);
  if (uErr) {
    console.error("reservation-update failed:", uErr);
    return json({ error: "Update failed" }, 500);
  }

  await supabase.from("reservation_events").insert({
    reservation_id: id,
    event_type: "Reservation Updated",
    message: "Customer updated reservation details.",
    metadata: {
      changed: Object.keys(update),
      previous: {
        sauna_type_id: reservation.sauna_type_id,
        preferred_install_at: reservation.preferred_install_at,
      },
    },
  });

  return json({ ok: true, changed: true });
});