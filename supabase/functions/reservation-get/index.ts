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
      "id, first_name, last_name, email, phone, install_address, city, sauna_type_id, preferred_install_at, reservation_status, payment_status, consult_status, contract_status, id_status, hold_created_at, hold_deadline, created_at, sauna_inventory_id, video_consult_booking_id, video_consult_scheduled_at, installation_booking_id, installation_scheduled_at, installation_status, stripe_customer_id, stripe_customer_linkage_missing, ach_status, ach_connected_at, ach_bank_name, ach_bank_last4, ach_last_error, default_payment_method_status, default_payment_method_updated_at, magic_link_opened_at",
    )
    .eq("id", id)
    .eq("secure_token", token)
    .maybeSingle();

  if (error) {
    console.error("reservation-get error:", error);
    return json({ error: "Server error" }, 500);
  }
  if (!reservation) return json({ error: "Not found" }, 404);

  // Record that the magic link was opened.
  await supabase
    .from("reservations")
    .update({ magic_link_opened_at: new Date().toISOString() })
    .eq("id", id);

  // ---- Auto-assign a sauna once the rental agreement is signed and the photo ID is uploaded ----
  let assignedInventoryId: string | null = reservation.sauna_inventory_id ?? null;
  const readyForAssignment =
    reservation.contract_status === "Complete" && reservation.id_status === "Complete";

  if (readyForAssignment && !assignedInventoryId) {
    try {
      const { data: type } = await supabase
        .from("sauna_types")
        .select("style, model_key, location")
        .eq("id", reservation.sauna_type_id)
        .maybeSingle();

      if (type) {
        const { data: candidates } = await supabase
          .from("sauna_inventory")
          .select("id, status, available_date, created_at, locations, current_customer_id, future_customer_id")
          .eq("style", type.style)
          .eq("model_key", type.model_key)
          .contains("locations", [type.location])
          .is("current_customer_id", null)
          .is("future_customer_id", null)
          .in("status", ["Available", "Incoming", "Returning", "Maintenance"]);

        const eligible = (candidates ?? [])
          .filter((c: any) => c.status === "Available" || c.available_date)
          .sort((a: any, b: any) => {
            const rank = (s: string) => (s === "Available" ? 0 : 1);
            if (rank(a.status) !== rank(b.status)) return rank(a.status) - rank(b.status);
            const ad = a.available_date ?? "9999-12-31";
            const bd = b.available_date ?? "9999-12-31";
            if (ad !== bd) return ad < bd ? -1 : 1;
            return String(a.created_at).localeCompare(String(b.created_at));
          });

        const pick = eligible[0];
        if (pick) {
          const customerName = `${reservation.first_name} ${reservation.last_name}`.trim();
          const isNowAvailable = pick.status === "Available" && !pick.available_date;
          const { error: invErr } = await supabase
            .from("sauna_inventory")
            .update({
              status: "Reservation Confirmed",
              reservation_id: reservation.id,
              ...(isNowAvailable
                ? { current_customer_id: reservation.id, current_customer: customerName }
                : { future_customer_id: reservation.id, future_customer: customerName }),
            })
            .eq("id", pick.id)
            .is("current_customer_id", null)
            .is("future_customer_id", null);

          if (!invErr) {
            assignedInventoryId = pick.id;
            await supabase
              .from("reservations")
              .update({ sauna_inventory_id: pick.id })
              .eq("id", reservation.id);
            (reservation as any).sauna_inventory_id = pick.id;
            await supabase.from("reservation_events").insert({
              reservation_id: reservation.id,
              event_type: "Sauna Assigned",
              message: "Sauna assigned after agreement and photo ID completion",
              metadata: { sauna_inventory_id: pick.id },
            });
          }
        }
      }
    } catch (e) {
      console.error("sauna auto-assignment failed:", e);
    }
  }

  // Look up sauna inventory hold state
  let sauna_hold: { status: string; is_reserved: boolean } | null = null;
  let assigned_sauna:
    | { id: string; unit_code: string | null; status: string; available_date: string | null }
    | null = null;
  if (assignedInventoryId) {
    const { data: inv } = await supabase
      .from("sauna_inventory")
      .select("id, unit_code, status, available_date, reservation_id")
      .eq("id", assignedInventoryId)
      .maybeSingle();
    if (inv) {
      const isReserved =
        inv.reservation_id === reservation.id &&
        ["Reservation Hold", "Reserved", "Reservation Confirmed", "Installed"].includes(inv.status);
      sauna_hold = { status: inv.status, is_reserved: isReserved };
      assigned_sauna = {
        id: inv.id as string,
        unit_code: (inv.unit_code as string | null) ?? null,
        status: inv.status as string,
        available_date: (inv.available_date as string | null) ?? null,
      };
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

  return json({ reservation, id_photo, sauna_hold, assigned_sauna });
});