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
          "first_name",
          "last_name",
          "email",
          "phone",
          "sauna_type_id",
          "install_address",
          "placement_choice",
          "access_notes",
          "min_commitment_months",
          "preferred_install_at",
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

      case "list_inventory": {
        const { data, error } = await supabase
          .from("sauna_inventory")
          .select("*")
          .order("sauna_type_id", { ascending: true })
          .order("created_at", { ascending: true });
        if (error) throw error;
        return json({ inventory: data });
      }

      case "create_inventory": {
        const allowed = [
          "sauna_type_id", "unit_code", "model", "indoor_outdoor_eligibility", "status",
          "current_customer", "install_date",
          "available_date",
          "admin_notes",
        ];
        const clean: Record<string, unknown> = {};
        for (const k of allowed) {
          if (k in payload) {
            const v = (payload as any)[k];
            clean[k] = v === "" ? null : v;
          }
        }
        const { data, error } = await supabase
          .from("sauna_inventory")
          .insert(clean)
          .select()
          .single();
        if (error) throw error;
        return json({ sauna: data });
      }

      case "update_inventory": {
        const { id, patch } = payload;
        const allowed = [
          "sauna_type_id", "unit_code", "model", "indoor_outdoor_eligibility", "status",
          "current_customer", "install_date",
          "available_date",
          "admin_notes",
        ];
        const clean: Record<string, unknown> = {};
        for (const k of allowed) if (k in patch) clean[k] = patch[k] === "" ? null : patch[k];
        const { data, error } = await supabase
          .from("sauna_inventory")
          .update(clean)
          .eq("id", id)
          .select()
          .single();
        if (error) throw error;
        return json({ sauna: data });
      }

      case "delete_inventory": {
        const { id } = payload;
        const { error } = await supabase.from("sauna_inventory").delete().eq("id", id);
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