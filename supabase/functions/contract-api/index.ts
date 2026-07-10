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
import { buildSignedContractPdf, sha256Hex } from "../_shared/pdfBuilder.ts";

const ACKNOWLEDGMENTS: { key: string; text: string }[] = [
  { key: "reviewed_agreement", text: "I have reviewed and agree to the Rental Summary and the Master Agreement." },
  { key: "commitment_binding", text: "I understand that the Initial Commitment Period is binding and that I am responsible for the rental fees due for the selected term." },
  { key: "cancellation_terms", text: "I understand the cancellation and pre-delivery cancellation terms." },
  { key: "safety_terms", text: "I have reviewed and agree to the Safe Operation and Fire Prevention Requirements." },
  { key: "electronic_signature_consent", text: "I consent to receive, sign, and retain this Agreement electronically, and I intend my typed legal name to serve as my electronic signature." },
];

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
          .select("id, version_name, master_pdf_storage_path")
          .eq("is_active", true)
          .maybeSingle();

        let masterAgreementUrl: string | null = null;
        if (activeVersion?.master_pdf_storage_path) {
          const { data: signed } = await supabase.storage
            .from("agreement-versions")
            .createSignedUrl(activeVersion.master_pdf_storage_path, 60 * 10);
          masterAgreementUrl = signed?.signedUrl ?? null;
        }

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
          active_agreement_version: activeVersion
            ? { id: activeVersion.id, version_name: activeVersion.version_name }
            : null,
          master_agreement_url: masterAgreementUrl,
        });
      }

      case "save_draft": {
        const {
          customer_legal_name,
          phone,
          email,
          installation_address,
          installation_city,
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
        if (typeof installation_city !== "string" || installation_city.trim().length < 2) {
          return json({ error: "Please enter your installation city." }, 400);
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
        const streetAddress = installation_address.trim();
        const city = installation_city.trim();
        const combinedAddress = `${streetAddress}, ${city}`;
        const deliveryFee = getDeliveryFee(city) === 0 ? 0 : getDeliveryFee(combinedAddress);
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
          installation_address: combinedAddress,
          installation_street: streetAddress,
          installation_city: city,
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
          installation_address: combinedAddress,
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

      case "sign": {
        const { contract_id, typed_legal_name, acknowledgments, time_zone } = body ?? {};
        if (typeof contract_id !== "string" || !contract_id) return json({ error: "Missing contract" }, 400);
        if (typeof typed_legal_name !== "string" || typed_legal_name.trim().length < 2) {
          return json({ error: "Please type your full legal name." }, 400);
        }

        // Load contract and confirm it belongs to this reservation.
        const { data: contract, error: cErr } = await supabase
          .from("contracts")
          .select("*")
          .eq("id", contract_id)
          .eq("reservation_id", reservation.id)
          .maybeSingle();
        if (cErr) throw cErr;
        if (!contract) return json({ error: "Contract not found" }, 404);
        if (contract.status === "Signed") return json({ error: "This agreement has already been signed." }, 400);
        if (contract.status === "Voided") return json({ error: "This agreement has been voided." }, 400);

        // Require exact match of typed legal name (case-insensitive, trimmed) to prevent silent mismatch.
        const typed = typed_legal_name.trim();
        if (typed.toLowerCase() !== String(contract.customer_legal_name).trim().toLowerCase()) {
          return json({
            error: `Please type your full legal name exactly as shown on the agreement: "${contract.customer_legal_name}".`,
          }, 400);
        }

        // Require every acknowledgment to be accepted.
        const acks = (acknowledgments && typeof acknowledgments === "object") ? acknowledgments : {};
        for (const a of ACKNOWLEDGMENTS) {
          if (!acks[a.key]) return json({ error: "Please accept all acknowledgments to continue." }, 400);
        }

        // Load active master agreement PDF bytes.
        const { data: version, error: vErr } = await supabase
          .from("agreement_versions")
          .select("id, version_name, master_pdf_storage_path")
          .eq("id", contract.agreement_version_id)
          .maybeSingle();
        if (vErr) throw vErr;
        if (!version) return json({ error: "Master Agreement version missing." }, 500);

        const { data: masterFile, error: dlErr } = await supabase.storage
          .from("agreement-versions")
          .download(version.master_pdf_storage_path);
        if (dlErr || !masterFile) throw dlErr ?? new Error("Could not read Master Agreement PDF");
        const masterBytes = new Uint8Array(await masterFile.arrayBuffer());

        const signedAt = new Date().toISOString();
        const ipAddress =
          req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
          req.headers.get("cf-connecting-ip") ||
          null;
        const userAgent = req.headers.get("user-agent") || null;
        const tz = typeof time_zone === "string" && time_zone ? time_zone : null;

        const ackRecords = ACKNOWLEDGMENTS.map((a) => ({
          key: a.key,
          text: a.text,
          accepted_at: signedAt,
        }));

        // Build the signed PDF (Rental Summary + Audit + Master Agreement).
        const pdfBytes = await buildSignedContractPdf({
          summary: contract.rental_summary_snapshot,
          audit: {
            typed_legal_name: typed,
            signed_at: signedAt,
            time_zone: tz,
            ip_address: ipAddress,
            user_agent: userAgent,
            agreement_version: version.version_name,
            reservation_id: reservation.id,
            contract_id: contract.id,
            acknowledgments: ackRecords,
            electronic_consent_confirmed: true,
          },
          masterAgreementPdfBytes: masterBytes,
        });

        const hash = await sha256Hex(pdfBytes);
        const storagePath = `${reservation.id}/${contract.id}.pdf`;

        const { error: upErr } = await supabase.storage
          .from("signed-contracts")
          .upload(storagePath, pdfBytes, { contentType: "application/pdf", upsert: true });
        if (upErr) throw upErr;

        // Persist signature audit + acknowledgments + contract status.
        const { error: auditErr } = await supabase.from("contract_signature_audit").insert({
          contract_id: contract.id,
          typed_legal_name: typed,
          signed_at: signedAt,
          time_zone: tz,
          ip_address: ipAddress,
          user_agent: userAgent,
          agreement_version: version.version_name,
          reservation_id: reservation.id,
          signed_pdf_hash: hash,
          electronic_consent_confirmed: true,
        });
        if (auditErr) throw auditErr;

        await supabase.from("contract_acknowledgments").insert(
          ACKNOWLEDGMENTS.map((a) => ({
            contract_id: contract.id,
            acknowledgment_key: a.key,
            acknowledgment_text: a.text,
            accepted: true,
            accepted_at: signedAt,
          })),
        );

        const { data: updated, error: updErr } = await supabase
          .from("contracts")
          .update({
            status: "Signed",
            signed_at: signedAt,
            signed_pdf_storage_path: storagePath,
            signed_pdf_hash: hash,
          })
          .eq("id", contract.id)
          .select()
          .single();
        if (updErr) throw updErr;

        await supabase.from("contract_events").insert({
          contract_id: contract.id,
          event_type: "Contract Signed",
          actor_type: "customer",
          event_details: { ip: ipAddress, user_agent: userAgent, time_zone: tz, hash },
        });

        await supabase
          .from("reservations")
          .update({ contract_status: "Complete" })
          .eq("id", reservation.id);

        // Return a signed URL for immediate download/view.
        const { data: signed } = await supabase.storage
          .from("signed-contracts")
          .createSignedUrl(storagePath, 60 * 10);

        return json({ contract: updated, signed_pdf_url: signed?.signedUrl ?? null, hash });
      }

      case "signed_pdf_url": {
        const { contract_id } = body ?? {};
        if (typeof contract_id !== "string" || !contract_id) return json({ error: "Missing contract" }, 400);
        const { data: contract } = await supabase
          .from("contracts")
          .select("id, signed_pdf_storage_path, reservation_id")
          .eq("id", contract_id)
          .eq("reservation_id", reservation.id)
          .maybeSingle();
        if (!contract?.signed_pdf_storage_path) return json({ error: "Not available" }, 404);
        const { data: signed, error: sErr } = await supabase.storage
          .from("signed-contracts")
          .createSignedUrl(contract.signed_pdf_storage_path, 60 * 10);
        if (sErr) throw sErr;
        return json({ url: signed?.signedUrl ?? null });
      }

      default:
        return json({ error: "Unknown action" }, 400);
    }
  } catch (e) {
    console.error("contract-api error:", e);
    return json({ error: (e as Error).message ?? "Server error" }, 500);
  }
});