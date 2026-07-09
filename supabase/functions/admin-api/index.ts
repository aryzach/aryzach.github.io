import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-password",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const adminPassword = Deno.env.get("ADMIN_PASSWORD");
  const provided = req.headers.get("x-admin-password");
  if (!adminPassword || provided !== adminPassword) {
    return json({ error: "Unauthorized" }, 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  let payload: any = {};
  try {
    payload = await req.json();
  } catch {
    payload = {};
  }
  const action = payload.action as string;

  try {
    switch (action) {
      case "login":
        return json({ ok: true });

      case "list_reservations": {
        const { data, error } = await supabase
          .from("reservations")
          .select("*")
          .order("created_at", { ascending: false });
        if (error) throw error;
        return json({ reservations: data });
      }

      case "update_reservation": {
        const { id, patch } = payload;
        const allowed = [
          "reservation_status",
          "payment_status",
          "contract_status",
          "id_status",
          "consult_status",
          "admin_notes",
        ];
        const clean: Record<string, unknown> = {};
        for (const k of allowed) if (k in patch) clean[k] = patch[k];
        const { data, error } = await supabase
          .from("reservations")
          .update(clean)
          .eq("id", id)
          .select()
          .single();
        if (error) throw error;
        return json({ reservation: data });
      }

      case "list_events": {
        const { data, error } = await supabase
          .from("availability_events")
          .select("*")
          .order("available_starting_date", { ascending: true });
        if (error) throw error;
        return json({ events: data });
      }

      case "create_event": {
        const { sauna_type_id, quantity, available_starting_date, reason, notes } = payload;
        const { data, error } = await supabase
          .from("availability_events")
          .insert({ sauna_type_id, quantity, available_starting_date, reason, notes })
          .select()
          .single();
        if (error) throw error;
        return json({ event: data });
      }

      case "update_event": {
        const { id, patch } = payload;
        const allowed = ["quantity", "available_starting_date", "reason", "notes"];
        const clean: Record<string, unknown> = {};
        for (const k of allowed) if (k in patch) clean[k] = patch[k];
        const { data, error } = await supabase
          .from("availability_events")
          .update(clean)
          .eq("id", id)
          .select()
          .single();
        if (error) throw error;
        return json({ event: data });
      }

      case "delete_event": {
        const { id } = payload;
        const { error } = await supabase.from("availability_events").delete().eq("id", id);
        if (error) throw error;
        return json({ ok: true });
      }

      default:
        return json({ error: "Unknown action" }, 400);
    }
  } catch (e) {
    console.error("admin-api error:", e);
    return json({ error: (e as Error).message ?? "Server error" }, 500);
  }
});