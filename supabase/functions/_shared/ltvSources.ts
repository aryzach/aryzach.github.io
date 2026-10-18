import { SYNC_TENANT } from './xeroSyncModel.ts';
import type {LtvSources}from '../../../src/lib/ltvTimeline.ts';
// Password-verified admin-api only. No Xero/provider calls or writes.
// deno-lint-ignore no-explicit-any
export async function readLtvSources(db:any):Promise<LtvSources> { // eslint-disable-line @typescript-eslint/no-explicit-any
 const result:LtvSources={contacts:[],payments:[]};
 for(let offset=0;;offset+=1000){
  const read=await db.from('xero_customer_history').select('tenant_id,contact_id,snapshot_at,coverage,transactions').eq('tenant_id',SYNC_TENANT).order('contact_id').range(offset,offset+999);
  if(read.error)throw Error('Could not read cached Xero payment dates');
  for(const row of read.data||[]){
   result.contacts.push({tenantId:row.tenant_id,contactId:row.contact_id,snapshotAt:row.snapshot_at,complete:row.coverage?.terminalPageReached===true});
   for(const p of row.transactions||[])result.payments.push({tenantId:row.tenant_id,contactId:row.contact_id,id:p.id,date:p.date,status:p.status,type:p.type,currency:p.currency,amountCents:Math.round(Number(p.amount)*100),hasRentalLines:!!p.lines?.some((l:{accountCode:string;amount:string})=>['102','542'].includes(l.accountCode)&&Number(l.amount)!==0)});
  }
  if((read.data||[]).length<1000)return result;
 }
}
