import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { sendReservationEmail } from "../_shared/reservationEmails.ts";

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

const ALLOWED_SOURCES = new Set([
  "Pricing Page", "Product Page", "Direct Link", "Admin", "Unknown",
]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let body: any = {};
  try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, 400); }

  const {
    first_name, last_name, email, phone, city,
    sauna_type_id, preferred_install_date,
    reservation_source, intent,
  } = body ?? {};

  const errors: string[] = [];
  if (!first_name || typeof first_name !== "string") errors.push("first_name");
  if (!last_name || typeof last_name !== "string") errors.push("last_name");
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push("email");
  if (!phone || typeof phone !== "string" || phone.trim().length < 7) errors.push("phone");
  if (!city || typeof city !== "string") errors.push("city");
  if (!sauna_type_id || typeof sauna_type_id !== "string") errors.push("sauna_type_id");
  if (!preferred_install_date || !/^\d{4}-\d{2}-\d{2}$/.test(preferred_install_date)) errors.push("preferred_install_date");
  if (intent !== "reserve" && intent !== "consult") errors.push("intent");
  if (errors.length) return json({ error: "Invalid fields", fields: errors }, 400);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const installDate = new Date(preferred_install_date + "T00:00:00");
  if (installDate < today) return json({ error: "Installation date can't be before today." }, 400);

  const source = ALLOWED_SOURCES.has(reservation_source) ? reservation_source : "Unknown";

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Confirm sauna type exists
  const { data: st } = await supabase
    .from("sauna_types")
    .select("id")
    .eq("id", sauna_type_id)
    .maybeSingle();
  if (!st) return json({ error: "Unknown sauna type" }, 400);

  const isConsult = intent === "consult";
  const preferredIso = new Date(preferred_install_date + "T00:00:00").toISOString();

  const { data: reservation, error: insErr } = await supabase
    .from("reservations")
    .insert({
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      city: city.trim(),
      sauna_type_id,
      preferred_install_at: preferredIso,
      reservation_source: source,
      reservation_status: isConsult ? "Lead" : "Pending Payment",
      payment_status: isConsult ? "N/A" : "Pending",
      min_commitment_months: null,
    })
    .select("id, secure_token")
    .single();

  if (insErr || !reservation) {
    console.error("insert reservation failed:", insErr);
    return json({ error: "Could not create reservation" }, 500);
  }

  await supabase.from("reservation_events").insert({
    reservation_id: reservation.id,
    event_type: isConsult ? "Lead Created" : "Reservation Created",
    message: isConsult
      ? "Customer requested a video consultation before reserving."
      : "Reservation created. Awaiting payment.",
    metadata: { source },
  });

  // Fire the initial reservation email. Do not block on failure — the
  // reservation is already saved and the customer can retry via admin.
  try {
    const result = await sendReservationEmail(supabase, reservation.id, "reservation_created");
    if (!result.ok) console.error("reservation_created email failed:", result.error);
  } catch (e) {
    console.error("reservation_created email threw:", e);
  }

  return json({ id: reservation.id, token: reservation.secure_token });
});