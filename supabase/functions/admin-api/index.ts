import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { sendReservationEmail } from "../_shared/reservationEmails.ts";
import {
  setAchAsCustomerDefault,
  listCustomerSubscriptions,
  setSubscriptionDefaultPaymentMethod,
} from "../_shared/stripeAch.ts";

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
          case "mark_consult":
            update = { consult_status: "Complete" };
            push("Video Consultation Complete", "Admin marked consultation complete.");
            break;
          case "mark_consult_scheduled":
            update = { consult_status: "Scheduled" };
            push("Video Consultation Scheduled", "Admin marked consultation scheduled.");
            break;
          case "mark_install_scheduled":
            update = { installation_status: "Scheduled" };
            push("Installation Scheduled", "Admin marked installation scheduled.");
            break;
          case "mark_install_complete":
            update = { installation_status: "Complete", reservation_status: "Reservation Confirmed" };
            push("Installation Completed", "Admin marked installation complete.");
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
        // Simulate the webhook for manual admin overrides.
        const { id, notes } = payload;
        if (!notes || typeof notes !== "string" || !notes.trim()) {
          return json({ error: "An admin note is required to mark payment paid manually." }, 400);
        }
        const { data: reservation } = await supabase
          .from("reservations").select("*").eq("id", id).maybeSingle();
        if (!reservation) return json({ error: "Not found" }, 404);
        if (reservation.payment_status === "Paid") return json({ ok: true, already: true });

        const nowIso = new Date().toISOString();
        const holdDeadlineIso = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString();
        const preferredDate = String(reservation.preferred_install_at).slice(0, 10);

        // If a sauna is already assigned, do not assign a second one.
        if (reservation.sauna_inventory_id) {
          await supabase.from("reservations").update({
            payment_status: "Paid",
            payment_completed_at: nowIso,
            hold_created_at: reservation.hold_created_at ?? nowIso,
            hold_deadline: reservation.hold_deadline ?? holdDeadlineIso,
          }).eq("id", id);
          await supabase.from("reservation_events").insert([
            { reservation_id: id, event_type: "Payment Received", message: `Payment marked paid manually. Note: ${notes.trim()}` },
          ]);
          return json({ ok: true, already_assigned: true });
        }

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
            payment_completed_at: nowIso,
            hold_created_at: nowIso,
          }).eq("id", id);
          await supabase.from("reservation_events").insert([
            { reservation_id: id, event_type: "Payment Received", message: `Payment marked complete (manual). Note: ${notes.trim()}` },
            { reservation_id: id, event_type: "Needs Manual Review", message: "No eligible sauna auto-assigned." },
          ]);
          return json({ ok: true, needs_review: true });
        }

        await supabase.from("sauna_inventory").update({
          status: "Reservation Hold", current_customer: customerName, reservation_id: id,
        }).eq("id", chosen.id);
        await supabase.from("reservations").update({
          payment_status: "Paid", reservation_status: "Reservation Hold",
          sauna_inventory_id: chosen.id,
          payment_completed_at: nowIso,
          hold_created_at: nowIso,
          hold_deadline: holdDeadlineIso,
        }).eq("id", id);
        await supabase.from("reservation_events").insert([
          { reservation_id: id, event_type: "Payment Received", message: `Payment marked complete (manual). Note: ${notes.trim()}` },
          { reservation_id: id, event_type: "Reservation Hold Created", message: "Sauna held (5-day informational deadline).", metadata: { sauna_inventory_id: chosen.id, hold_deadline: holdDeadlineIso } },
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
          "current_customer", "future_customer", "install_date",
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
          "current_customer", "future_customer", "install_date",
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

      case "list_waitlist": {
        const { data, error } = await supabase
          .from("waitlist_entries")
          .select("*")
          .order("created_at", { ascending: false });
        if (error) throw error;
        return json({ waitlist: data });
      }

      case "delete_waitlist": {
        const { id } = payload;
        const { error } = await supabase.from("waitlist_entries").delete().eq("id", id);
        if (error) throw error;
        return json({ ok: true });
      }

      case "update_waitlist": {
        const { id, patch } = payload;
        const allowed = ["status", "admin_notes"];
        const clean: Record<string, unknown> = {};
        for (const k of allowed) if (k in patch) clean[k] = patch[k];
        const { data, error } = await supabase
          .from("waitlist_entries").update(clean).eq("id", id).select().single();
        if (error) throw error;
        return json({ entry: data });
      }

      // ============================================================
      // Agreement Versions
      // ============================================================
      case "list_agreement_versions": {
        const { data, error } = await supabase
          .from("agreement_versions")
          .select("*")
          .order("created_at", { ascending: false });
        if (error) throw error;
        return json({ versions: data });
      }

      case "upload_agreement_version": {
        const { version_name, description, file_name, content_type, file_base64 } = payload;
        if (!version_name || !file_name || !file_base64) {
          return json({ error: "version_name, file_name, and file_base64 are required" }, 400);
        }
        if ((content_type || "application/pdf") !== "application/pdf") {
          return json({ error: "Master Agreement must be a PDF" }, 400);
        }
        // Decode base64 (accept data-URL prefix too)
        const b64 = String(file_base64).includes(",")
          ? String(file_base64).split(",")[1]
          : String(file_base64);
        const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

        const safeName = String(file_name).replace(/[^A-Za-z0-9._-]/g, "_");
        const path = `${crypto.randomUUID()}/${safeName}`;

        const { error: upErr } = await supabase.storage
          .from("agreement-versions")
          .upload(path, bytes, { contentType: "application/pdf", upsert: false });
        if (upErr) throw upErr;

        const { data, error } = await supabase
          .from("agreement_versions")
          .insert({
            version_name: String(version_name).trim(),
            description: description ? String(description).trim() : null,
            master_pdf_storage_path: path,
            is_active: false,
          })
          .select()
          .single();
        if (error) throw error;
        return json({ version: data });
      }

      case "set_active_agreement_version": {
        const { id } = payload;
        if (!id) return json({ error: "id is required" }, 400);
        // Deactivate current active first (unique partial index enforces only one).
        await supabase
          .from("agreement_versions")
          .update({ is_active: false, archived_at: new Date().toISOString() })
          .eq("is_active", true)
          .neq("id", id);
        const { data, error } = await supabase
          .from("agreement_versions")
          .update({ is_active: true, archived_at: null })
          .eq("id", id)
          .select()
          .single();
        if (error) throw error;
        return json({ version: data });
      }

      case "archive_agreement_version": {
        const { id } = payload;
        if (!id) return json({ error: "id is required" }, 400);
        const { data, error } = await supabase
          .from("agreement_versions")
          .update({ is_active: false, archived_at: new Date().toISOString() })
          .eq("id", id)
          .select()
          .single();
        if (error) throw error;
        return json({ version: data });
      }

      case "agreement_version_download_url": {
        const { id } = payload;
        if (!id) return json({ error: "id is required" }, 400);
        const { data: v, error: vErr } = await supabase
          .from("agreement_versions")
          .select("master_pdf_storage_path, version_name")
          .eq("id", id)
          .maybeSingle();
        if (vErr) throw vErr;
        if (!v) return json({ error: "Not found" }, 404);
        const { data: signed, error: sErr } = await supabase.storage
          .from("agreement-versions")
          .createSignedUrl(v.master_pdf_storage_path, 60 * 10);
        if (sErr) throw sErr;
        return json({ url: signed.signedUrl });
      }

      case "stripe_status": {
        const [lastOkRes, lastFailRes, cfgRes] = await Promise.all([
          supabase
            .from("stripe_webhook_events")
            .select("received_at, processed_at, event_type, livemode")
            .eq("processing_status", "processed")
            .order("received_at", { ascending: false })
            .limit(1),
          supabase
            .from("stripe_webhook_events")
            .select("received_at, error_message, event_type, livemode")
            .in("processing_status", ["failed", "error"])
            .order("received_at", { ascending: false })
            .limit(1),
          supabase
            .from("app_config")
            .select("key, value")
            .in("key", [
              "stripe_mode",
              "stripe_live_reservation_payment_link",
              "stripe_test_reservation_payment_link",
            ]),
        ]);
        const cfg: Record<string, string | null> = {};
        for (const row of (cfgRes.data ?? []) as { key: string; value: string | null }[]) {
          cfg[row.key] = row.value;
        }
        const mode = (cfg.stripe_mode || "test").toLowerCase();
        const activeLink =
          mode === "live"
            ? cfg.stripe_live_reservation_payment_link
            : cfg.stripe_test_reservation_payment_link;
        return json({
          mode,
          payment_link_mode: activeLink ? mode : null,
          payment_link_configured: !!activeLink,
          last_success: lastOkRes.data?.[0] ?? null,
          last_failure: lastFailRes.data?.[0] ?? null,
        });
      }

      case "list_reservation_emails": {
        const { reservation_id } = payload;
        const q = supabase
          .from("reservation_email_events")
          .select("*")
          .order("created_at", { ascending: false });
        if (reservation_id) q.eq("reservation_id", reservation_id);
        const { data, error } = await q;
        if (error) throw error;
        return json({ emails: data });
      }

      case "resend_reservation_email": {
        const { reservation_id, email_type } = payload;
        if (!reservation_id || !email_type) return json({ error: "reservation_id and email_type required" }, 400);
        if (email_type !== "reservation_created" && email_type !== "payment_received") {
          return json({ error: "invalid email_type" }, 400);
        }
        const result = await sendReservationEmail(supabase, reservation_id, email_type, { force: true });
        if (!result.ok) return json({ error: result.error || "send failed" }, 500);
        return json({ ok: true, resend_id: result.resend_id });
      }

      case "backfill_stripe_customers": {
        const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
        if (!stripeKey) return json({ error: "STRIPE_SECRET_KEY not configured" }, 500);
        const { data: candidates, error: cErr } = await supabase
          .from("reservations")
          .select("id, stripe_checkout_session_id")
          .eq("payment_status", "Paid")
          .is("stripe_customer_id", null)
          .not("stripe_checkout_session_id", "is", null);
        if (cErr) throw cErr;

        const results: any[] = [];
        for (const r of (candidates ?? []) as { id: string; stripe_checkout_session_id: string }[]) {
          try {
            const resp = await fetch(
              `https://api.stripe.com/v1/checkout/sessions/${r.stripe_checkout_session_id}`,
              { headers: { Authorization: `Bearer ${stripeKey}` } },
            );
            const s = await resp.json();
            if (!resp.ok) {
              results.push({ id: r.id, status: "error", error: s.error?.message });
              continue;
            }
            const customerId: string | null =
              typeof s.customer === "string" ? s.customer : s.customer?.id ?? null;
            if (customerId) {
              await supabase
                .from("reservations")
                .update({
                  stripe_customer_id: customerId,
                  stripe_customer_linkage_missing: false,
                })
                .eq("id", r.id);
              await supabase.from("reservation_events").insert({
                reservation_id: r.id,
                event_type: "Stripe Customer Backfilled",
                message: "Stripe Customer linked from prior Checkout Session.",
                metadata: { customer_id: customerId, checkout_session_id: r.stripe_checkout_session_id },
              });
              results.push({ id: r.id, status: "linked", customer_id: customerId });
            } else {
              await supabase
                .from("reservations")
                .update({ stripe_customer_linkage_missing: true })
                .eq("id", r.id);
              results.push({ id: r.id, status: "no_customer_on_session" });
            }
          } catch (e) {
            results.push({ id: r.id, status: "error", error: (e as Error).message });
          }
        }
        return json({ processed: results.length, results });
      }

      case "admin_reset_ach": {
        const { id, mode } = payload;
        if (!id) return json({ error: "id required" }, 400);
        const patch: any = { ach_last_error: null };
        if (mode === "clear_failed") {
          patch.ach_status = "Not Connected";
        } else if (mode === "skip") {
          patch.ach_status = "Not Connected";
          patch.ach_last_error = "Marked skipped by admin";
        } else if (mode === "retry") {
          patch.ach_status = "Not Connected";
          patch.stripe_ach_setup_intent_id = null;
        } else {
          return json({ error: "invalid mode" }, 400);
        }
        const { data, error } = await supabase
          .from("reservations")
          .update(patch)
          .eq("id", id)
          .select()
          .single();
        if (error) throw error;
        await supabase.from("reservation_events").insert({
          reservation_id: id,
          event_type: "ACH Admin Action",
          message: `ACH admin action: ${mode}`,
          metadata: { mode },
        });
        return json({ reservation: data });
      }

      case "set_ach_as_default": {
        const { id } = payload;
        if (!id) return json({ error: "id required" }, 400);
        const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
        if (!stripeKey) return json({ error: "STRIPE_SECRET_KEY not configured" }, 500);

        const { data: r } = await supabase
          .from("reservations")
          .select("id, stripe_customer_id, stripe_ach_payment_method_id, ach_status")
          .eq("id", id)
          .maybeSingle();
        if (!r) return json({ error: "Not found" }, 404);
        if (!r.stripe_customer_id) return json({ error: "Reservation has no Stripe Customer." }, 400);
        if (!r.stripe_ach_payment_method_id) return json({ error: "Reservation has no saved ACH PaymentMethod." }, 400);

        const result = await setAchAsCustomerDefault(
          stripeKey,
          r.stripe_customer_id,
          r.stripe_ach_payment_method_id,
        );

        if (result.ok) {
          const nowIso = new Date().toISOString();
          const { data: updated } = await supabase
            .from("reservations")
            .update({
              ach_status: "Connected",
              ach_last_error: null,
              default_payment_method_status: "ACH",
              default_payment_method_updated_at: nowIso,
            })
            .eq("id", id)
            .select()
            .single();
          await supabase.from("reservation_events").insert({
            reservation_id: id,
            event_type: "ACH Set As Default (Admin)",
            message: "Admin set ACH as the Stripe Customer default payment method.",
            metadata: {
              payment_method_id: r.stripe_ach_payment_method_id,
              customer_default_after: result.customer_default_after,
            },
          });
          return json({ ok: true, reservation: updated, verified: result.verified });
        }

        await supabase
          .from("reservations")
          .update({
            ach_status: "Connected, Default Update Failed",
            ach_last_error: (result.error ?? "Failed to set default").slice(0, 500),
          })
          .eq("id", id);
        await supabase.from("reservation_events").insert({
          reservation_id: id,
          event_type: "ACH Set As Default Failed (Admin)",
          message: `Admin retry failed: ${result.error ?? "unknown"}`,
          metadata: { payment_method_id: r.stripe_ach_payment_method_id },
        });
        return json({ ok: false, error: result.error ?? "Failed to set default" }, 500);
      }

      case "list_customer_subscriptions": {
        const { id } = payload;
        if (!id) return json({ error: "id required" }, 400);
        const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
        if (!stripeKey) return json({ error: "STRIPE_SECRET_KEY not configured" }, 500);
        const { data: r } = await supabase
          .from("reservations")
          .select("stripe_customer_id, stripe_ach_payment_method_id")
          .eq("id", id)
          .maybeSingle();
        if (!r?.stripe_customer_id) return json({ error: "Reservation has no Stripe Customer." }, 400);
        const result = await listCustomerSubscriptions(stripeKey, r.stripe_customer_id);
        if (!result.ok) return json({ error: result.error }, 500);
        return json({
          subscriptions: result.subscriptions,
          ach_payment_method_id: r.stripe_ach_payment_method_id,
        });
      }

      case "set_subscription_default_pm": {
        const { id, subscription_id } = payload;
        if (!id || !subscription_id) return json({ error: "id and subscription_id required" }, 400);
        const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
        if (!stripeKey) return json({ error: "STRIPE_SECRET_KEY not configured" }, 500);
        const { data: r } = await supabase
          .from("reservations")
          .select("stripe_customer_id, stripe_ach_payment_method_id")
          .eq("id", id)
          .maybeSingle();
        if (!r?.stripe_ach_payment_method_id) return json({ error: "No ACH PaymentMethod on reservation." }, 400);
        const result = await setSubscriptionDefaultPaymentMethod(
          stripeKey,
          subscription_id,
          r.stripe_ach_payment_method_id,
        );
        if (!result.ok) return json({ error: result.error }, 500);
        await supabase.from("reservation_events").insert({
          reservation_id: id,
          event_type: "Subscription Default PM Updated (Admin)",
          message: `Admin set ACH as default_payment_method on subscription ${subscription_id}.`,
          metadata: { subscription_id, payment_method_id: r.stripe_ach_payment_method_id },
        });
        return json({ ok: true, default_payment_method: result.default_payment_method });
      }

      default:
        return json({ error: "Unknown action" }, 400);
    }
  } catch (e) {
    console.error("admin-api error:", e);
    return json({ error: (e as Error).message ?? "Server error" }, 500);
  }
});