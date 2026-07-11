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

  const { id, token } = body ?? {};
  if (!id || !token || typeof id !== "string" || typeof token !== "string") {
    return json({ error: "Missing id or token" }, 400);
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: reservation, error } = await supabase
    .from("reservations")
    .select(
      "id, first_name, last_name, email, phone, install_address, city, sauna_type_id, preferred_install_at, reservation_status, payment_status, consult_status, contract_status, id_status, hold_created_at, hold_deadline, created_at, sauna_inventory_id, video_consult_booking_id, video_consult_scheduled_at, installation_booking_id, installation_scheduled_at, installation_status, stripe_customer_id, stripe_customer_linkage_missing, ach_status, ach_connected_at, ach_bank_name, ach_bank_last4, ach_last_error, default_payment_method_status, default_payment_method_updated_at",
    )
    .eq("id", id)
    .eq("secure_token", token)
    .maybeSingle();

  if (error) {
    console.error("reservation-get error:", error);
    return json({ error: "Server error" }, 500);
  }
  if (!reservation) return json({ error: "Not found" }, 404);

  // Look up sauna inventory hold state
  let sauna_hold: { status: string; is_reserved: boolean } | null = null;
  if (reservation.sauna_inventory_id) {
    const { data: inv } = await supabase
      .from("sauna_inventory")
      .select("status, reservation_id")
      .eq("id", reservation.sauna_inventory_id)
      .maybeSingle();
    if (inv) {
      const isReserved =
        inv.reservation_id === reservation.id &&
        ["Reservation Hold", "Reserved", "Reservation Confirmed", "Installed"].includes(inv.status);
      sauna_hold = { status: inv.status, is_reserved: isReserved };
    }
  }

  // Return the most recent uploaded photo ID (if any) as a short-lived signed URL.
  let id_photo: { url: string; name: string } | null = null;
  try {
    const { data: files } = await supabase.storage
      .from("reservation-ids")
      .list(id, { limit: 100, sortBy: { column: "created_at", order: "desc" } });
    const latest = files?.[0];
    if (latest) {
      const { data: signed } = await supabase.storage
        .from("reservation-ids")
        .createSignedUrl(`${id}/${latest.name}`, 60 * 10);
      if (signed?.signedUrl) {
        id_photo = { url: signed.signedUrl, name: latest.name };
      }
    }
  } catch (e) {
    console.error("id_photo lookup failed:", e);
  }

  return json({ reservation, id_photo, sauna_hold });
});