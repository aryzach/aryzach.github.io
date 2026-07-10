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

      case "list_reservations_with_events": {
        const { data: reservations, error } = await supabase
          .from("reservations")
          .select("*")
          .order("created_at", { ascending: false });
        if (error) throw error;
        const ids = (reservations ?? []).map((r: any) => r.id);
        let events: any[] = [];
        if (ids.length) {
          const { data: evs, error: eErr } = await supabase
            .from("reservation_events")
            .select("*")
            .in("reservation_id", ids)
            .order("created_at", { ascending: true });
          if (eErr) throw eErr;
          events = evs ?? [];
        }
        return json({ reservations, events });
      }

      case "reservation_action": {
        const { id, kind, extend_days, notes } = payload;
        const { data: reservation, error: rErr } = await supabase
          .from("reservations").select("*").eq("id", id).maybeSingle();
        if (rErr) throw rErr;
        if (!reservation) return json({ error: "Not found" }, 404);

        const evtInserts: any[] = [];
        const push = (event_type: string, message: string, metadata: any = {}) =>
          evtInserts.push({ reservation_id: id, event_type, message, metadata });

        let update: Record<string, unknown> = {};

        switch (kind) {
          case "confirm": {
            update = { reservation_status: "Reservation Confirmed" };
            if (reservation.sauna_inventory_id) {
              await supabase.from("sauna_inventory")
                .update({ status: "Reservation Confirmed" })
                .eq("id", reservation.sauna_inventory_id);
            }
            push("Reservation Confirmed", "Admin confirmed reservation.");
            break;
          }
          case "release": {
            update = { reservation_status: "Cancelled", sauna_inventory_id: null, hold_deadline: null };
            if (reservation.sauna_inventory_id) {
              await supabase.from("sauna_inventory")
                .update({ status: "Available", current_customer: null, reservation_id: null })
                .eq("id", reservation.sauna_inventory_id);
            }
            push("Hold Released", "Admin released the reservation hold.");
            break;
          }
          case "extend": {
            const days = Number(extend_days) || 5;
            const base = reservation.hold_deadline
              ? new Date(reservation.hold_deadline)
              : new Date();
            const next = new Date(base.getTime() + days * 24 * 60 * 60 * 1000);
            update = { hold_deadline: next.toISOString() };
            push("Hold Deadline Extended", `Deadline extended by ${days} day(s).`);
            break;
          }
          case "mark_consult":
            update = { consult_status: "Complete" };
            push("Video Consultation Complete", "Admin marked consultation complete.");
            break;
          case "mark_contract":
            update = { contract_status: "Complete" };
            push("Contract Completed", "Admin marked rental agreement complete.");
            break;
          case "mark_id":
            update = { id_status: "Complete" };
            push("ID Uploaded", "Admin marked ID verification complete.");
            break;
          case "set_notes":
            update = { admin_notes: notes ?? null };
            break;
          default:
            return json({ error: "Unknown action kind" }, 400);
        }

        const { data: updated, error: uErr } = await supabase
          .from("reservations").update(update).eq("id", id).select().single();
        if (uErr) throw uErr;
        if (evtInserts.length) {
          await supabase.from("reservation_events").insert(evtInserts);
        }
        return json({ reservation: updated });
      }

      case "manual_mark_paid": {
        // Simulate the webhook for testing when Stripe isn't wired up.
        const { id } = payload;
        const { data: reservation } = await supabase
          .from("reservations").select("*").eq("id", id).maybeSingle();
        if (!reservation) return json({ error: "Not found" }, 404);
        if (reservation.payment_status === "Paid") return json({ ok: true, already: true });

        const nowIso = new Date().toISOString();
        const holdDeadlineIso = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString();
        const preferredDate = String(reservation.preferred_install_at).slice(0, 10);

        const { data: candidates } = await supabase
          .from("sauna_inventory").select("*")
          .eq("sauna_type_id", reservation.sauna_type_id)
          .in("status", ["Available", "Incoming", "Returning", "Maintenance"]);
        const available = (candidates ?? []).filter((c: any) => c.status === "Available");
        const upcoming = (candidates ?? [])
          .filter((c: any) => c.status !== "Available" && c.available_date && c.available_date <= preferredDate)
          .sort((a: any, b: any) => (a.available_date < b.available_date ? -1 : 1));
        const chosen = available[0] ?? upcoming[0] ?? null;
        const customerName = `${reservation.first_name} ${reservation.last_name}`.trim();

        if (!chosen) {
          await supabase.from("reservations").update({
            payment_status: "Paid", reservation_status: "Needs Manual Review",
            hold_created_at: nowIso, hold_deadline: holdDeadlineIso,
          }).eq("id", id);
          await supabase.from("reservation_events").insert([
            { reservation_id: id, event_type: "Payment Received", message: "Payment marked complete (manual)." },
            { reservation_id: id, event_type: "Needs Manual Review", message: "No eligible sauna auto-assigned." },
          ]);
          return json({ ok: true, needs_review: true });
        }

        await supabase.from("sauna_inventory").update({
          status: "Reservation Hold", current_customer: customerName, reservation_id: id,
        }).eq("id", chosen.id);
        await supabase.from("reservations").update({
          payment_status: "Paid", reservation_status: "Reservation Hold",
          sauna_inventory_id: chosen.id, hold_created_at: nowIso, hold_deadline: holdDeadlineIso,
        }).eq("id", id);
        await supabase.from("reservation_events").insert([
          { reservation_id: id, event_type: "Payment Received", message: "Payment marked complete (manual)." },
          { reservation_id: id, event_type: "Reservation Hold Created", message: `Sauna held until ${holdDeadlineIso}.`, metadata: { sauna_inventory_id: chosen.id } },
        ]);
        return json({ ok: true });
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

      case "delete_reservation": {
        const { id } = payload;
        const { data: r } = await supabase
          .from("reservations").select("sauna_inventory_id").eq("id", id).maybeSingle();
        if (r?.sauna_inventory_id) {
          await supabase.from("sauna_inventory").update({
            status: "Available", current_customer: null, reservation_id: null,
          }).eq("id", r.sauna_inventory_id);
        }
        await supabase.from("reservation_events").delete().eq("reservation_id", id);
        const { error } = await supabase.from("reservations").delete().eq("id", id);
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