/** Private, password-verified admin reads. Never imported into public reservation handlers. */
// deno-lint-ignore no-explicit-any
export async function readLifecycleRecords(client:any) {
 const tables={rentals:'rentals',agreements:'rental_agreements',terms:'rental_terms',placements:'rental_placements',sales:'sauna_sales',settlements:'rental_settlements',events:'rental_history_events',documents:'rental_documents',allocations:'rental_payment_allocations',paymentReviews:'customer_payment_reviews'};
 const columns={rentals:'id,customer_id,originating_reservation_id,purpose,owner_review,planned_end,lifecycle_state,actual_start,actual_end,removal_window_start,removal_window_end,removal_evidence,actual_start_source,actual_start_evidence,version,history_gaps,service_address',documents:'id,filename,sha256,incomplete,byte_size'};
 const rows=await Promise.all(Object.entries(tables).map(async([key,table])=>{
  const all=[];
  for(let offset=0;;offset+=1000){
   let query=client.from(table).select(columns[key as keyof typeof columns]||'*');
   query=key==='paymentReviews'?query.order('tenant_id').order('source_id'):query.order('id');
   const result=await query.range(offset,offset+999);
   if(result.error)throw result.error;all.push(...(result.data||[]));
   if((result.data||[]).length<1000)break;
  }
  return [key,all];
 }));return Object.fromEntries(rows);
}
