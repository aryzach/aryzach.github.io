/** Private, password-verified admin reads. Never imported into public reservation handlers. */
// deno-lint-ignore no-explicit-any
export async function readLifecycleRecords(client:any) {
 const tables={rentals:'rentals',agreements:'rental_agreements',terms:'rental_terms',placements:'rental_placements',sales:'sauna_sales',settlements:'rental_settlements',events:'rental_history_events',documents:'rental_documents',allocations:'rental_payment_allocations'};
 const columns={rentals:'id,customer_id,originating_reservation_id,lifecycle_state,actual_start,actual_end,actual_start_source,actual_start_evidence,version,history_gaps,service_address',documents:'id,filename,sha256,incomplete,byte_size'};
 const rows=await Promise.all(Object.entries(tables).map(async([key,table])=>{
  const result=await client.from(table).select(columns[key as keyof typeof columns]||'*');
  if(result.error)throw result.error;return [key,result.data||[]];
 }));return Object.fromEntries(rows);
}
