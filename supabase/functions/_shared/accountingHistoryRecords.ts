import type {
  AccountingHistoryData,
  AccountingRecord,
} from "./accountingHistory.ts";

export const ACCOUNTING_TABLES = {
  saunaTypes: ["sauna_types", "id,name"],
  customers: ["customer_profiles", "id,display_name,email,phone,archived_at"],
  links: ["reservation_customer_links", "reservation_id,customer_id"],
  reservations: [
    "reservations",
    "id,first_name,last_name,email,phone,install_address,sauna_type_id,booking_kind,payment_status,default_payment_method_status,reservation_status,created_at",
  ],
  rentals: [
    "rentals",
    "id,customer_id,originating_reservation_id,purpose,lifecycle_state,actual_start,actual_end,actual_start_source,actual_start_evidence,owner_review,history_gaps,service_address,notes",
  ],
  agreements: [
    "rental_agreements",
    "id,rental_id,contract_id,document_id,label,agreement_date,signed_on,signing_state,source_terms,owner_corrections",
  ],
  terms: [
    "rental_terms",
    "id,rental_id,agreement_id,state,effective_from,effective_until,minimum_months,base_monthly_cents,extras,sauna_type,source,note",
  ],
  placements: [
    "rental_placements",
    "id,rental_id,asset_id,installed_on,removed_on,address",
  ],
  sales: [
    "sauna_sales",
    "id,asset_id,customer_id,rental_id,sold_on,agreed_cents",
  ],
  inventory: [
    "sauna_inventory",
    "id,unit_code,current_customer_id,future_customer_id",
  ],
  contracts: [
    "contracts",
    "id,reservation_id,status,voided_at,customer_legal_name,email,phone,installation_address,sauna_type,commitment_months,monthly_price,security_deposit,delivery_fee,insurance_selected,insurance_monthly_price,second_heater_selected,second_heater_monthly_price,stair_elevator_charge,rental_summary_snapshot,signed_at,created_at",
  ],
  xeroLinks: [
    "xero_customer_links",
    "tenant_id,contact_id,customer_id,contact_name,organisation_short_code",
  ],
  xeroHistory: [
    "xero_customer_history",
    "tenant_id,contact_id,contact_name,sync_ignored,transactions",
  ],
} as const;

// Called only after the existing accounting password has been verified.
export async function readAccountingHistory(client: {
  from(table: string): AccountingRecord;
}): Promise<AccountingHistoryData> {
  const entries = await Promise.all(
    Object.entries(ACCOUNTING_TABLES).map(async ([key, [table, columns]]) => {
      const rows: AccountingRecord[] = [];
      for (let offset = 0; ; offset += 1000) {
        let query = client.from(table).select(columns);
        query = ["xeroLinks", "xeroHistory"].includes(key)
          ? query.order("tenant_id").order("contact_id")
          : query.order(key === "links" ? "reservation_id" : "id");
        const result = await query.range(offset, offset + 999);
        if (result.error) throw result.error;
        rows.push(...(result.data || []));
        if ((result.data || []).length < 1000) break;
      }
      return [key, rows];
    }),
  );
  return Object.fromEntries(entries) as unknown as AccountingHistoryData;
}
