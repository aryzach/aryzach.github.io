import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import {
  COMMITMENT_MONTHS,
  INSURANCE_MONTHLY,
  SECOND_HEATER_MONTHLY,
  getDeliveryFee,
  getMonthlyPrice,
  getSaunaTypeInfo,
  getSecurityDeposit,
} from "../_shared/pricing.ts";

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

interface AuthedReservation {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  install_address: string | null;
  sauna_type_id: string;
  preferred_install_at: string;
  min_commitment_months: number | null;
  contract_status: string;
}

async function authReservation(
  supabase: ReturnType<typeof createClient>,
  id: unknown,
  token: unknown,
): Promise<AuthedReservation | null> {
  if (typeof id !== "string" || typeof token !== "string" || !id || !token) return null;
  const { data } = await supabase
    .from("reservations")
    .select(
      "id, first_name, last_name, email, phone, install_address, sauna_type_id, preferred_install_at, min_commitment_months, contract_status",
    )
    .eq("id", id)
    .eq("secure_token", token)
    .maybeSingle();
  return (data as AuthedReservation | null) ?? null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let body: any = {};
  try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, 400); }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { action, id, token } = body ?? {};
  const reservation = await authReservation(supabase, id, token);
  if (!reservation) return json({ error: "Not found" }, 404);

  try {
    switch (action) {
      case "get": {
        // Return active (non-voided) contract for this reservation, if any.
        const { data: contracts, error } = await supabase
          .from("contracts")
          .select("*")
          .eq("reservation_id", reservation.id)
          .order("created_at", { ascending: false });
        if (error) throw error;

        const list = contracts ?? [];
        const current = list.find((c: any) => c.status !== "Voided") ?? null;

        // Active master agreement version (for prefill / display)
        const { data: activeVersion } = await supabase
          .from("agreement_versions")
          .select("id, version_name")
          .eq("is_active", true)
          .maybeSingle();

        return json({
          reservation: {
            id: reservation.id,
            first_name: reservation.first_name,
            last_name: reservation.last_name,
            email: reservation.email,
            phone: reservation.phone,
            install_address: reservation.install_address,
            sauna_type_id: reservation.sauna_type_id,
            preferred_install_at: reservation.preferred_install_at,
            min_commitment_months: reservation.min_commitment_months,
          },
          contract: current,
          voided_contracts: list.filter((c: any) => c.status === "Voided"),
          active_agreement_version: activeVersion,
        });
      }

      case "save_draft": {
        const {
          customer_legal_name,
          phone,
          email,
          installation_address,
          sauna_type,
          commitment_months,
          insurance_selected,
          second_heater_selected,
          preferred_installation_date,
        } = body ?? {};

        // ---- Validation ----
        if (typeof customer_legal_name !== "string" || customer_legal_name.trim().length < 2) {
          return json({ error: "Please enter your legal name." }, 400);
        }
        if (typeof email !== "string" || !/^\S+@\S+\.\S+$/.test(email.trim())) {
          return json({ error: "Please enter a valid email." }, 400);
        }
        if (typeof installation_address !== "string" || installation_address.trim().length < 5) {
          return json({ error: "Please enter your installation address." }, 400);
        }
        const saunaInfo = getSaunaTypeInfo(String(sauna_type ?? ""));
        if (!saunaInfo) return json({ error: "Please choose a sauna type." }, 400);
        const months = Number(commitment_months);
        if (!COMMITMENT_MONTHS.includes(months as 1 | 3 | 6 | 12)) {
          return json({ error: "Please choose an initial commitment length." }, 400);
        }
        if (typeof preferred_installation_date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(preferred_installation_date)) {
          return json({ error: "Please choose a preferred installation date." }, 400);
        }

        const monthlyPrice = getMonthlyPrice(saunaInfo.id, months);
        if (monthlyPrice == null) return json({ error: "No pricing available for that selection." }, 400);
        const deliveryFee = getDeliveryFee(installation_address);
        const securityDeposit = getSecurityDeposit(saunaInfo.id);
        const insurance = Boolean(insurance_selected);
        const secondHeater = Boolean(second_heater_selected) && saunaInfo.allowsSecondHeater;

        // ---- Flag sauna-type mismatch with reservation-assigned inventory ----
        const flags: string[] = [];
        if (saunaInfo.id !== reservation.sauna_type_id) {
          flags.push("sauna_type_changed_from_reservation");
        }

        // ---- Active agreement version ----
        const { data: activeVersion, error: vErr } = await supabase
          .from("agreement_versions")
          .select("id, version_name")
          .eq("is_active", true)
          .maybeSingle();
        if (vErr) throw vErr;
        if (!activeVersion) {
          return json({ error: "No active Master Agreement is available. Please contact SF Sauna." }, 400);
        }

        // ---- Find existing editable contract for this reservation ----
        const { data: existing } = await supabase
          .from("contracts")
          .select("*")
          .eq("reservation_id", reservation.id)
          .in("status", ["Not Started", "Draft Created", "Ready to Sign", "Replacement Required"])
          .order("created_at", { ascending: false })
          .maybeSingle();

        const nowIso = new Date().toISOString();
        const rentalSummary = {
          reservation_id: reservation.id,
          agreement_version: activeVersion.version_name,
          customer_legal_name: customer_legal_name.trim(),
          phone: (phone ?? "").toString().trim() || null,
          email: email.trim(),
          installation_address: installation_address.trim(),
          sauna_type: saunaInfo.label,
          sauna_type_id: saunaInfo.id,
          placement: saunaInfo.placement,
          commitment_months: months,
          monthly_price: monthlyPrice,
          delivery_fee: deliveryFee,
          security_deposit: securityDeposit,
          insurance_selected: insurance,
          insurance_monthly_price: insurance ? INSURANCE_MONTHLY : 0,
          second_heater_selected: secondHeater,
          second_heater_monthly_price: secondHeater ? SECOND_HEATER_MONTHLY : 0,
          stair_elevator_charge: existing?.stair_elevator_charge ?? null,
          preferred_installation_date,
          flags,
          snapshotted_at: nowIso,
        };

        const commonFields = {
          customer_legal_name: customer_legal_name.trim(),
          phone: (phone ?? "").toString().trim() || null,
          email: email.trim(),
          installation_address: installation_address.trim(),
          sauna_type: saunaInfo.label,
          placement: saunaInfo.placement,
          commitment_months: months,
          monthly_price: monthlyPrice,
          delivery_fee: deliveryFee,
          security_deposit: securityDeposit,
          insurance_selected: insurance,
          insurance_monthly_price: insurance ? INSURANCE_MONTHLY : 0,
          second_heater_selected: secondHeater,
          second_heater_monthly_price: secondHeater ? SECOND_HEATER_MONTHLY : 0,
          preferred_installation_date,
          rental_summary_snapshot: rentalSummary,
          pricing_snapshot: {
            monthly_price: monthlyPrice,
            delivery_fee: deliveryFee,
            security_deposit: securityDeposit,
            insurance_monthly: INSURANCE_MONTHLY,
            second_heater_monthly: SECOND_HEATER_MONTHLY,
          },
          agreement_version_id: activeVersion.id,
          status: "Draft Created" as const,
          generated_at: nowIso,
        };

        let contract: any;
        let eventType: string;
        if (existing) {
          // Replace unsigned draft in place, preserve admin overrides & stair charge.
          const { data, error } = await supabase
            .from("contracts")
            .update(commonFields)
            .eq("id", existing.id)
            .select()
            .single();
          if (error) throw error;
          contract = data;
          eventType = "Draft Regenerated";
        } else {
          const { data, error } = await supabase
            .from("contracts")
            .insert({ ...commonFields, reservation_id: reservation.id })
            .select()
            .single();
          if (error) throw error;
          contract = data;
          eventType = "Draft Generated";
          await supabase.from("contract_events").insert({
            contract_id: contract.id,
            event_type: "Contract Configuration Started",
            actor_type: "customer",
          });
        }

        await supabase.from("contract_events").insert({
          contract_id: contract.id,
          event_type: eventType,
          actor_type: "customer",
          event_details: { flags },
        });

        // Reflect on the reservation for the dashboard.
        await supabase
          .from("reservations")
          .update({ contract_status: "Draft Created" })
          .eq("id", reservation.id);

        return json({ contract, flags });
      }

      default:
        return json({ error: "Unknown action" }, 400);
    }
  } catch (e) {
    console.error("contract-api error:", e);
    return json({ error: (e as Error).message ?? "Server error" }, 500);
  }
});