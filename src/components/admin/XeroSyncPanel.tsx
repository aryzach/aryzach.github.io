import { useCallback, useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { previewEnabled, services } from '@/lib/runtime';
interface Review {review_key:string;kind:string;contact_id:string;customer_id:string|null;source_id:string|null;name:string;message:string;fingerprint:string}
interface SyncStatus {state:{status:string;started_at:string|null;last_success_at:string|null;error:string|null;counts:Record<string,number>};reviews:Review[];stale:boolean;schedule:string}
export default function XeroSyncPanel({password,onSynced,onReview}:{password:string;onSynced:()=>Promise<void>;onReview:(selection:{customerId?:string;contactId?:string})=>void}) {
 const lastState=useRef<string|null>(null);
 const [data,setData]=useState<SyncStatus|null>(null);const [error,setError]=useState('');const [busy,setBusy]=useState(false);const [expanded,setExpanded]=useState(false);const [showAll,setShowAll]=useState(false);
 const call=useCallback(async(action:string,extra:object={})=>{
  if(previewEnabled) {const r=await fetch('/__local-xero-sync',{method:'POST',headers:{'content-type':'application/json','x-sf-local-records':'1'},body:JSON.stringify({action,...extra})});if(!r.ok)throw Error('Local sync status is unavailable. Live Xero is not contacted by the preview.');return r.json();}
  const r=await fetch(`${services.supabaseUrl}/functions/v1/xero-admin`,{method:'POST',headers:{'content-type':'application/json',apikey:import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,'x-admin-password':password},body:JSON.stringify({action,...extra})});
  const b=await r.json();if(!r.ok)throw Error(b.error||'Could not check Xero sync.');return b;
 },[password]);
 const refresh=useCallback(async()=>{const next:SyncStatus=await call('sync_status');const completed=lastState.current==='running'&&next.state.status==='success';lastState.current=next.state.status;setData(next);if(completed)await onSynced();return next;},[call,onSynced]);
 useEffect(()=>{void refresh().catch(e=>setError(e.message));},[refresh]);
 useEffect(()=>{if(data?.state.status!=='running')return;const id=setInterval(()=>void refresh().catch(e=>setError(e.message)),3000);return()=>clearInterval(id);},[data?.state.status,refresh]);
 const sync=async()=>{setBusy(true);setError('');try{await call('sync_now');await refresh();if(previewEnabled)await onSynced();}catch(e){setError((e as Error).message);}finally{setBusy(false);}};
 const acknowledge=async(rows:Review[])=>{setBusy(true);try{for(const r of rows)setData(await call('sync_acknowledge',{key:r.review_key,fingerprint:r.fingerprint}));}catch(e){setError((e as Error).message);}finally{setBusy(false);}};
 const groups=[...((data?.reviews||[]).reduce((all,r)=>{const key=[r.contact_id,r.kind,r.message].join(':');all.set(key,[...(all.get(key)||[]),r]);return all;},new Map<string,Review[]>())).values()];
 const running=data?.state.status==='running';const failed=!!error||data?.state.status==='error';
 return <section aria-label="Xero sync" className="mb-5 rounded-lg border bg-card p-4">
  <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-semibold">Xero payments <span className={`ml-2 text-xs font-normal ${failed?'text-red-700':data?.stale?'text-amber-700':'text-muted-foreground'}`}>{running?'Syncing…':failed?'Sync failed':data?.stale?'Out of date':data?'Up to date':'Checking…'}</span></h2>
  <p className="mt-1 text-sm text-muted-foreground">Last successful sync: {data?.state.last_success_at?new Date(data.state.last_success_at).toLocaleString():'Not synced yet'} · {previewEnabled?'Local copy · live Xero stays untouched':data?.schedule||'Nightly at 3:00 AM Pacific'}</p></div>
  <Button variant="outline" onClick={sync} disabled={busy||running}>{running?'Syncing…':previewEnabled?'Refresh local copy':'Sync now'}</Button></div>
  {(error||data?.state.error)&&<p role="alert" className="mt-2 text-sm text-red-700">{error||data?.state.error}</p>}
  {!!data?.reviews.length&&<details className="mt-3" open={expanded} onToggle={e=>setExpanded(e.currentTarget.open)}><summary className="cursor-pointer text-sm font-medium">Needs review ({groups.length})</summary><div className="mt-3 max-h-80 divide-y overflow-auto">{(showAll?groups:groups.slice(0,6)).map(rows=>{const r=rows[0];return <div key={r.review_key} className="flex flex-wrap items-start justify-between gap-3 py-3 text-sm"><div className="min-w-0 flex-1"><p className="font-medium">{r.name} <span className="ml-2 text-xs font-normal text-muted-foreground">{r.kind==='unmatched'?'Unmatched customer':r.kind==='classification'?'Updated classification':'Conflict'}</span></p><p className="mt-1 text-muted-foreground">{r.message}</p>{r.source_id&&<p className="mt-1 text-xs text-muted-foreground">{rows.length>1?`${rows.length} payments`:`Payment ${r.source_id.slice(0,8)}`}</p>}</div><div className="flex gap-2"><Button size="sm" variant="outline" onClick={()=>onReview(r.customer_id?{customerId:r.customer_id}:{contactId:r.contact_id})}>Review</Button>{(r.kind==='classification'||r.review_key.startsWith('date:'))&&<Button size="sm" variant="ghost" disabled={busy} onClick={()=>acknowledge(rows)}>Reviewed</Button>}</div></div>;})}{groups.length>6&&<Button size="sm" variant="ghost" onClick={()=>setShowAll(v=>!v)}>{showAll?'Show fewer':`Show all ${groups.length}`}</Button>}</div></details>}
 </section>;
}
