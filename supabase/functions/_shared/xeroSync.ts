import {readXeroPages} from './xeroSyncFetch.ts';
import { activeToken, type database } from './server.ts';
import { makeSyncProjection, mergeSource, SYNC_RESOURCES, SYNC_TENANT, type XeroRecord } from './xeroSyncModel.ts';
type DB=ReturnType<typeof database>;
export async function syncStatus(db:DB) {
 const state=await db.from('xero_sync_state').select('status,started_at,lease_until,last_success_at,last_full_at,error,counts,nightly_at,dispatch_until').eq('tenant_id',SYNC_TENANT).single();
 const reviews=await db.from('xero_sync_reviews').select('review_key,kind,contact_id,customer_id,source_id,name,message,fingerprint').eq('tenant_id',SYNC_TENANT).eq('acknowledged',false).order('name').limit(100);
 if(state.error||reviews.error)throw new Error('Sync storage unavailable');
 const s=state.data;
 if(s.dispatch_until&&new Date(s.dispatch_until).getTime()<Date.now()){s.status='error';s.error='The nightly sync did not start. Retry Sync now.';}
 delete s.dispatch_until;
 if(s.status==='running'&&new Date(s.lease_until).getTime()<Date.now()){s.status='error';s.error='The last sync did not finish. Retry Sync now.';}
 return {state:s,reviews:reviews.data,stale:!s.last_success_at||Date.now()-new Date(s.last_success_at).getTime()>36*3600000,schedule:'Nightly at 3:00 AM Pacific'};
}
async function readAll(db:DB,table:string,tenant=true) {
 const all:XeroRecord[]=[];
 for(let offset=0;;offset+=1000) {
  let q=db.from(table).select('*');if(tenant)q=q.eq('tenant_id',SYNC_TENANT);
  const order=table==='rental_payment_allocations'?'id':table==='xero_sync_reviews'?'review_key':table==='customer_payment_reviews'?'source_id':'contact_id';
  const result=await q.order(order).range(offset,offset+999);if(result.error)throw Error('Private sync data unavailable');all.push(...result.data);if(result.data.length<1000)break;
 }
 return all;
}
export async function runXeroSync(db:DB,lease:string,begin:XeroRecord) {
 try {
  const started=new Date().toISOString(); const deadline=Date.now()+125000;
  const [auth,cacheResult,oldHistory,links,allocations,paymentReviews,previousReviews]=await Promise.all([
   activeToken(db),db.from('xero_sync_cache').select('resource,records').eq('tenant_id',SYNC_TENANT),
   readAll(db,'xero_customer_history'),readAll(db,'xero_customer_links'),readAll(db,'rental_payment_allocations'),readAll(db,'customer_payment_reviews'),readAll(db,'xero_sync_reviews')
  ]);
  if(auth.row.selected_tenant_id!==SYNC_TENANT||cacheResult.error)throw Error('Xero organization does not match SF Sauna.');
  const full=begin.full||cacheResult.data.length!==5;
  // One-minute overlap avoids second precision and requests racing the prior retrieval time.
  const since=!full&&begin.cursor?new Date(new Date(begin.cursor).getTime()-60000).toISOString():null;
  const cache:Record<string,XeroRecord[]>={};
  for(const resource of SYNC_RESOURCES) {
   const rows=await readXeroPages(resource,auth.token.access_token,since,deadline);
   cache[resource]=mergeSource(resource,cacheResult.data.find(r=>r.resource===resource)?.records||[],rows,full);
  }
  const payload=await makeSyncProjection({cache,oldHistory,links,allocations,paymentReviews,previousReviews,cursor:started,full,initial:!begin.cursor});
  const published=await db.rpc('xero_sync_publish',{p_tenant:SYNC_TENANT,p_lease:lease,p_payload:payload});
  if(published.error)throw Error('Could not publish the complete Xero refresh. Previous import is unchanged; retry Sync now.');
 } catch(error) {
  const message=error instanceof Error&&/^(Xero |Could not publish)/.test(error.message)?error.message:'Xero sync failed. Previous import is unchanged. Retry or reconnect Xero.';
  await db.rpc('xero_sync_fail',{p_tenant:SYNC_TENANT,p_lease:lease,p_error:message});
 }
}
