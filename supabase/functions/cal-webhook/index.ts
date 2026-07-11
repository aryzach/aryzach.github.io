// Cal.com webhook receiver for SF Sauna reservations.
//
// Subscribes to BOOKING_CREATED, BOOKING_RESCHEDULED, and BOOKING_CANCELLED
// events and syncs the corresponding reservation's checklist state.
//
// Reservation lookup priority:
//   1. payload.metadata.reservation_id (authoritative — passed via booking URL)
//   2. payload.responses / payload.userFieldsResponses containing reservation_id
//   3. attendee email fallback (last resort)
//
// Event type routing uses the Cal.com event slug:
//   - CAL_VIDEO_CONSULT_SLUG (default: "sf-sauna-video-consultation")
//   - CAL_INSTALLATION_SLUG  (default: "sf-sauna-delivery-installation")

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cal-signature-256",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const VIDEO_SLUG = (Deno.env.get("CAL_VIDEO_CONSULT_SLUG") || "sf-sauna-video-consultation").toLowerCase();
const INSTALL_SLUG = (Deno.env.get("CAL_INSTALLATION_SLUG") || "sf-sauna-delivery-installation").toLowerCase();

async function verifySignature(rawBody: string, header: string | null): Promise<boolean> {
  const secret = Deno.env.get("CAL_WEBHOOK_SECRET");
  if (!secret) return true; // If no secret is configured yet, accept (dev/setup mode).
  if (!header) return false;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(rawBody));
  const hex = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  // Header may be raw hex or "sha256=<hex>"
  const provided = header.trim().replace(/^sha256=/i, "").toLowerCase();
  return provided === hex;
}

function extractReservationId(payload: any): string | null {
  // 1. metadata.reservation_id (preferred — passed via ?metadata[reservation_id]=)
  const m = payload?.metadata?.reservation_id ?? payload?.booking?.metadata?.reservation_id;
  if (typeof m === "string" && m.length >= 10) return m;

  // 2. custom question responses
  const resps = payload?.responses ?? payload?.userFieldsResponses ?? {};
  for (const k of Object.keys(resps ?? {})) {
    if (k.toLowerCase().includes("reservation")) {
      const v = resps[k];
      const val = typeof v === "string" ? v : v?.value;
      if (typeof val === "string" && val.length >= 10) return val;
    }
  }
  return null;
}

function extractEventSlug(payload: any): string | null {
  const slug =
    payload?.eventType?.slug ??
    payload?.eventTypeSlug ??
    payload?.eventTypeId ??
    payload?.type ??
    null;
  return slug ? String(slug).toLowerCase() : null;
}

function extractBookingKind(payload: any): "video" | "install" | null {
  const slug = extractEventSlug(payload) ?? "";
  if (slug.includes(VIDEO_SLUG) || slug.includes("consultation")) return "video";
  if (slug.includes(INSTALL_SLUG) || slug.includes("install") || slug.includes("delivery")) return "install";
  // Fallback: check title
  const title = String(payload?.title ?? "").toLowerCase();
  if (title.includes("consult")) return "video";
  if (title.includes("install") || title.includes("delivery")) return "install";
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const raw = await req.text();
  const sigHeader = req.headers.get("x-cal-signature-256");
  if (!(await verifySignature(raw, sigHeader))) {
    console.error("cal-webhook: bad signature");
    return json({ error: "Invalid signature" }, 401);
  }

  let body: any = {};
  try { body = JSON.parse(raw); } catch { return json({ error: "Invalid JSON" }, 400); }

  const trigger = String(body?.triggerEvent ?? body?.type ?? "").toUpperCase();
  const payload = body?.payload ?? body;

  const reservationId = extractReservationId(payload);
  const kind = extractBookingKind(payload);
  const bookingId = String(
    payload?.uid ?? payload?.bookingId ?? payload?.id ?? "",
  ) || null;
  const startTime = payload?.startTime ?? payload?.start_time ?? payload?.start ?? null;
  const startIso = startTime ? new Date(startTime).toISOString() : null;

  console.log("cal-webhook:", { trigger, kind, reservationId, bookingId, startIso });

  if (!kind) {
    return json({ ok: true, ignored: "unknown_event_type" });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Resolve reservation
  let reservation: any = null;
  if (reservationId) {
    const { data } = await supabase
      .from("reservations")
      .select("id, email, consult_status, installation_status")
      .eq("id", reservationId)
      .maybeSingle();
    reservation = data;
  }
  if (!reservation) {
    // Fallback: booking id match (for reschedule/cancel of a known booking)
    if (bookingId) {
      const col = kind === "video" ? "video_consult_booking_id" : "installation_booking_id";
      const { data } = await supabase
        .from("reservations")
        .select("id, email, consult_status, installation_status")
        .eq(col, bookingId)
        .maybeSingle();
      reservation = data;
    }
  }
  if (!reservation) {
    // Last-resort email match
    const email = payload?.attendees?.[0]?.email ?? payload?.responses?.email?.value ?? null;
    if (email) {
      const { data } = await supabase
        .from("reservations")
        .select("id, email, consult_status, installation_status")
        .eq("email", String(email).toLowerCase())
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      reservation = data;
    }
  }

  if (!reservation) {
    console.error("cal-webhook: no matching reservation for booking", bookingId);
    return json({ ok: false, error: "no matching reservation" }, 200);
  }

  const isVideo = kind === "video";
  const bookingCol = isVideo ? "video_consult_booking_id" : "installation_booking_id";
  const timeCol = isVideo ? "video_consult_scheduled_at" : "installation_scheduled_at";
  const statusCol = isVideo ? "consult_status" : "installation_status";

  let update: Record<string, unknown> = {};
  let eventType = "";
  let message = "";

  if (trigger === "BOOKING_CREATED" || trigger === "BOOKING_RESCHEDULED") {
    update = {
      [bookingCol]: bookingId,
      [timeCol]: startIso,
      [statusCol]: "Scheduled",
    };
    if (trigger === "BOOKING_RESCHEDULED") {
      eventType = "Appointment Rescheduled";
      message = `${isVideo ? "Video consultation" : "Installation"} rescheduled${startIso ? ` to ${startIso}` : ""}.`;
    } else {
      eventType = isVideo ? "Video Consultation Scheduled" : "Installation Scheduled";
      message = `${isVideo ? "Video consultation" : "Installation"} booked via Cal.com${startIso ? ` for ${startIso}` : ""}.`;
    }
  } else if (trigger === "BOOKING_CANCELLED" || trigger === "BOOKING_CANCELED") {
    update = {
      [bookingCol]: null,
      [timeCol]: null,
      [statusCol]: "Not Scheduled",
    };
    eventType = "Appointment Cancelled";
    message = `${isVideo ? "Video consultation" : "Installation"} booking cancelled.`;
  } else {
    return json({ ok: true, ignored: `trigger:${trigger}` });
  }

  const { error: uErr } = await supabase
    .from("reservations")
    .update(update)
    .eq("id", reservation.id);
  if (uErr) {
    console.error("cal-webhook update failed:", uErr);
    return json({ error: "Update failed" }, 500);
  }

  await supabase.from("reservation_events").insert({
    reservation_id: reservation.id,
    event_type: eventType,
    message,
    metadata: {
      cal_booking_id: bookingId,
      scheduled_at: startIso,
      kind: isVideo ? "video_consultation" : "installation",
      trigger,
    },
  });

  return json({ ok: true });
});