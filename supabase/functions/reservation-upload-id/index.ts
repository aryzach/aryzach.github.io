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

// Accepts a JSON body: { id, token, file_name, content_type, file_base64 }
// Verifies the reservation using its secure_token, uploads to the private
// `reservation-ids` bucket, and marks id_status = 'Complete'.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let body: any = {};
  try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, 400); }

  const { id, token, file_name, content_type, file_base64 } = body ?? {};
  if (!id || !token || !file_base64 || !file_name) {
    return json({ error: "Missing fields" }, 400);
  }
  if (typeof id !== "string" || typeof token !== "string") {
    return json({ error: "Invalid fields" }, 400);
  }

  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/heic", "application/pdf"];
  const ct = typeof content_type === "string" ? content_type : "application/octet-stream";
  if (!allowedTypes.includes(ct)) {
    return json({ error: "Unsupported file type" }, 400);
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: reservation, error: rErr } = await supabase
    .from("reservations")
    .select("id, secure_token")
    .eq("id", id)
    .eq("secure_token", token)
    .maybeSingle();
  if (rErr) return json({ error: "Server error" }, 500);
  if (!reservation) return json({ error: "Not found" }, 404);

  // Decode base64 (may include data URI prefix)
  let base64 = String(file_base64);
  const commaIdx = base64.indexOf(",");
  if (base64.startsWith("data:") && commaIdx >= 0) base64 = base64.slice(commaIdx + 1);

  let bytes: Uint8Array;
  try {
    const bin = atob(base64);
    bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  } catch {
    return json({ error: "Invalid file data" }, 400);
  }
  const MAX = 10 * 1024 * 1024;
  if (bytes.byteLength > MAX) return json({ error: "File too large (max 10MB)" }, 400);

  const safeName = String(file_name).replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80);
  const path = `${id}/${Date.now()}-${safeName}`;

  const { error: upErr } = await supabase.storage
    .from("reservation-ids")
    .upload(path, bytes, { contentType: ct, upsert: false });
  if (upErr) {
    console.error("upload error:", upErr);
    return json({ error: "Upload failed" }, 500);
  }

  await supabase.from("reservations").update({ id_status: "Complete" }).eq("id", id);
  await supabase.from("reservation_events").insert({
    reservation_id: id,
    event_type: "ID Uploaded",
    message: "Customer uploaded a photo ID.",
    metadata: { path, content_type: ct, size: bytes.byteLength },
  });

  return json({ ok: true });
});