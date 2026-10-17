// Reads only private, already-imported snapshots after admin-api verifies its password.
type HistorySelection = {customerId?:string;contactId?:string};
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// deno-lint-ignore no-explicit-any
export async function readXeroCustomerHistory(client:any,selection:HistorySelection) { // eslint-disable-line @typescript-eslint/no-explicit-any
 const valid = (value:unknown) => value === undefined || typeof value === 'string' && uuid.test(value);
 if (!valid(selection.customerId) || !valid(selection.contactId) || selection.customerId && selection.contactId) throw new Error('Choose one valid customer or Xero contact');
 const connection=await client.from('xero_oauth_connection').select('selected_tenant_id').eq('id','primary').maybeSingle();
 if(connection.error || !connection.data?.selected_tenant_id)throw new Error('Select an authorized Xero organization');
 const tenant=connection.data.selected_tenant_id;
 const linked=await client.from('xero_customer_links').select('contact_id,customer_id').eq('tenant_id',tenant);
 if(linked.error)throw linked.error;
 const links=linked.data||[];
 // No source payments or credentials are fetched from Xero during a customer-page read.
 let query=client.from('xero_customer_history').select('contact_id,contact_name,pending_matches,review_state,snapshot_at,coverage'+(selection.customerId||selection.contactId?',transactions':'')).eq('tenant_id',tenant);
 if(selection.customerId){const ids=links.filter((l:{customer_id:string})=>l.customer_id===selection.customerId).map((l:{contact_id:string})=>l.contact_id);if(!ids.length)return {contacts:[],transactions:[]};query=query.in('contact_id',ids);}
 if(selection.contactId)query=query.eq('contact_id',selection.contactId);
 const result=await query.order('contact_name');if(result.error)throw result.error;
 const rows=result.data||[];
 return {
  // deno-lint-ignore no-explicit-any
  contacts:rows.map((r:any)=>({contactId:r.contact_id,name:r.contact_name,customerId:links.find((l:{contact_id:string})=>l.contact_id===r.contact_id)?.customer_id||null,pendingMatches:r.pending_matches||[],reviewState:r.review_state,snapshotAt:r.snapshot_at})), // eslint-disable-line @typescript-eslint/no-explicit-any
  ...(selection.customerId||selection.contactId?{transactions:rows.flatMap((r:{transactions:unknown[]})=>r.transactions||[])}:{}),
  ...(rows.length?{coverage:{terminalPageReached:rows.every((r:{coverage:{terminalPageReached:boolean}})=>r.coverage?.terminalPageReached===true),note:rows[0].coverage?.note||'',snapshotAt:rows[0].snapshot_at}}:{}),
 };
}
