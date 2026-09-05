import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { PRICING_TIERS } from "../_shared/generatedPricing.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-accounting-password",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

function standardInstallFee(saunaTypeId: string | null, months: number | null): number | null {
  if (!saunaTypeId || !months) return null;
  // deno-lint-ignore no-explicit-any
  const table = (PRICING_TIERS as any)[saunaTypeId];
  if (!table) return null;
  const row = table[months];
  return row ? row.installFee : null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const expected = Deno.env.get("ACCOUNTING_PASSWORD");
  const provided = req.headers.get("x-accounting-password");
  if (!expected || provided !== expected) {
    return json({ error: "Unauthorized" }, 401);
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // deno-lint-ignore no-explicit-any
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

      case "list_accounting": {
        const [resRes, conRes] = await Promise.all([
          supabase
            .from("reservations")
            .select(
              "id, first_name, last_name, email, phone, city, install_address, sauna_type_id, reservation_status, payment_status, contract_status, custom_install_fee, custom_pricing_options, created_at",
            )
            .order("created_at", { ascending: false }),
          supabase
            .from("contracts")
            .select("*")
            .eq("status", "Signed")
            .order("created_at", { ascending: false }),
        ]);
        if (resRes.error) throw resRes.error;
        if (conRes.error) throw conRes.error;

        const contractsByReservation = new Map<string, any>();
        for (const c of conRes.data ?? []) {
          if (!contractsByReservation.has(c.reservation_id)) {
            contractsByReservation.set(c.reservation_id, c);
          }
        }

        const rows = (resRes.data ?? [])
          .filter((r: any) => contractsByReservation.has(r.id))
          .map((r: any) => {
          const c = contractsByReservation.get(r.id) ?? null;
          const months = c?.commitment_months ?? null;
          let installFee: number | null = null;
          if (c) {
            const opts = Array.isArray(r.custom_pricing_options) ? r.custom_pricing_options : null;
            const opt = opts?.find((o: any) => Number(o?.months) === months);
            if (opt) installFee = Number(opt.install_fee ?? 0);
            else if (r.custom_install_fee != null) installFee = Number(r.custom_install_fee);
            else installFee = standardInstallFee(c.sauna_type_id ?? r.sauna_type_id, months);
          }

          const name =
            c?.customer_legal_name ||
            `${(r.first_name ?? "").trim()} ${(r.last_name ?? "").trim()}`.trim() ||
            r.email;

          return {
            reservation_id: r.id,
            name,
            email: r.email,
            phone: r.phone,
            sauna_type: c?.sauna_type ?? r.sauna_type_id,
            city: r.city,
            reservation_status: r.reservation_status,
            payment_status: r.payment_status,
            contract_status: c?.status ?? r.contract_status,
            contract_id: c?.id ?? null,
            contract_downloadable: !!c?.signed_pdf_storage_path,
            signed_at: c?.signed_at ?? null,
            commitment_months: months,
            monthly_price: c?.monthly_price ?? null,
            security_deposit: c?.security_deposit ?? null,
            delivery_fee: c?.delivery_fee ?? null,
            install_fee: installFee,
            insurance_selected: !!c?.insurance_selected,
            insurance_monthly_price: c?.insurance_monthly_price ?? 0,
            second_heater_selected: !!c?.second_heater_selected,
            second_heater_monthly_price: c?.second_heater_monthly_price ?? 0,
            stair_elevator_charge: c?.stair_elevator_charge ?? null,
            reservation_deposit: 200,
          };
        });

        return json({ rows });
      }

      case "contract_download_url": {
        const { contract_id } = payload;
        if (!contract_id) return json({ error: "contract_id is required" }, 400);
        const { data: c, error } = await supabase
          .from("contracts")
          .select("signed_pdf_storage_path")
          .eq("id", contract_id)
          .maybeSingle();
        if (error) throw error;
        if (!c?.signed_pdf_storage_path) return json({ error: "No signed contract available" }, 404);
        const { data: signed, error: sErr } = await supabase.storage
          .from("signed-contracts")
          .createSignedUrl(c.signed_pdf_storage_path, 60 * 10);
        if (sErr) throw sErr;
        return json({ url: signed.signedUrl });
      }

      default:
        return json({ error: "Unknown action" }, 400);
    }
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
