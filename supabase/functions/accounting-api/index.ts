import { serveWithMigrationPolicy } from "../_shared/migrationPolicy.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { buildBillingHistory } from "../_shared/accountingHistory.ts";
import { readAccountingHistory } from "../_shared/accountingHistoryRecords.ts";

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

serveWithMigrationPolicy(async (req) => {
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
        const data = await readAccountingHistory(supabase);
        const today = new Intl.DateTimeFormat('en-CA', {timeZone:'America/Los_Angeles',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
        return json({ rows: buildBillingHistory(data, today), as_of: today });
      }

      case "history_agreement_url": {
        const { data: agreement, error } = await supabase.from('rental_agreements')
          .select('document_id,contract_id').eq('id', payload.agreement_id).single();
        if (error) throw error;
        let path: string | null = null;
        if (agreement.document_id) {
          const result = await supabase.from('rental_documents').select('storage_path').eq('id', agreement.document_id).single();
          if (result.error) throw result.error;
          path = result.data.storage_path;
        } else if (agreement.contract_id) {
          const result = await supabase.from('contracts').select('signed_pdf_storage_path').eq('id', agreement.contract_id).single();
          if (result.error) throw result.error;
          path = result.data.signed_pdf_storage_path;
        }
        if (!path) return json({ error: 'No contract PDF is available' }, 404);
        const result = await supabase.storage.from('signed-contracts').createSignedUrl(path, 300);
        if (result.error) throw result.error;
        return json({ url: result.data.signedUrl });
      }

      case "list_current_customers": {
        const [invRes, resRes, conRes] = await Promise.all([
          supabase
            .from("sauna_inventory")
            .select("unit_code, status, style, model, install_date, admin_notes, current_customer_id")
            .order("unit_code", { ascending: true }),
          supabase
            .from("reservations")
            .select("id, first_name, last_name, crm_monthly_price"),
          supabase
            .from("contracts")
            .select("reservation_id, monthly_price")
            .eq("status", "Signed")
            .is("voided_at", null),
        ]);
        if (invRes.error) throw invRes.error;
        if (resRes.error) throw resRes.error;
        if (conRes.error) throw conRes.error;

        // Contract rate wins; CRM fallback only.
        const contractRate = new Map<string, number>();
        for (const c of conRes.data ?? []) {
          if (!contractRate.has(c.reservation_id)) {
            contractRate.set(c.reservation_id, c.monthly_price);
          }
        }
        const crmRate = new Map<string, number | null>();
        for (const r of resRes.data ?? []) {
          crmRate.set(r.id, r.crm_monthly_price ?? null);
        }
        const names = new Map<string, string>();
        for (const r of resRes.data ?? []) {
          names.set(
            r.id,
            `${(r.first_name ?? "").trim()} ${(r.last_name ?? "").trim()}`.trim() || "—",
          );
        }

        const current = (invRes.data ?? []).map((u: any) => {
          const rid = u.current_customer_id as string | null;
          return {
            reservation_id: rid,
            name: rid ? names.get(rid) ?? "—" : null,
            unit_code: u.unit_code ?? null,
            status: u.status ?? null,
            style: u.style ?? null,
            model: u.model ?? null,
            install_date: u.install_date ?? null,
            monthly_price: rid ? contractRate.get(rid) ?? crmRate.get(rid) ?? null : null,
            admin_notes: u.admin_notes ?? null,
          };
        });

        return json({ rows: current });
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
