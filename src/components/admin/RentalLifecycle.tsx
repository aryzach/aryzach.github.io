import {useState,type FormEvent} from 'react';
import {historyDate} from './historyDisplay';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Dialog,DialogContent,DialogHeader,DialogTitle} from '@/components/ui/dialog';
import {centsInput,displayMoney,type LifecycleCommand,type LifecycleRental} from '@/lib/lifecycleModel';
import {customerName,type RentalWorkspace} from '@/lib/rentalModel';

export type OpenAgreement=(id:string)=>Promise<void>;
const selectClass='h-9 rounded-md border border-input bg-background px-2 text-sm w-full';
const td='px-2 py-1.5 border-r align-top';
function Field({name,label,type='text',required=false,defaultValue}:{name:string;label:string;type?:string;required?:boolean;defaultValue?:string}){return <Label className="grid gap-1 font-normal">{label}<Input name={name} type={type} required={required} defaultValue={defaultValue}/></Label>;}
export function RentalCustomerHistory({state,customerId,onOpenAgreement}:{state:RentalWorkspace;customerId:string;onOpenAgreement?:OpenAgreement}) {
 const data=state.lifecycle;
 const rentals=data?.rentals.filter(r=>r.customer_id===customerId)||[];
 const [error,setError]=useState('');
 if(!data)return <p className="text-sm text-muted-foreground">Rental history is not available in this workspace.</p>;
 const sales=data.sales.filter(s=>s.customer_id===customerId);
 return <section aria-label="Customer rental history" className="customer-history-view min-w-0 space-y-5">
  <div className="flex items-center justify-between gap-3">
   <h3 className="font-semibold">Reservations & rentals</h3>
   <span className="text-xs text-muted-foreground">{rentals.length} {rentals.length===1?'record':'records'}</span>
  </div>
  {error&&<p role="alert" className="text-destructive">{error}</p>}
  {!rentals.length&&<p className="rounded-lg border border-dashed p-4 text-muted-foreground">No rental history recorded. This does not mean the customer never rented.</p>}
  {rentals.map(r=>{
   const terms=data.terms.filter(t=>t.rental_id===r.id);
   const reviewNote=typeof r.owner_review?.summary==='string'?r.owner_review.summary:null;
   const noteRepeatedInSale=sales.some(s=>s.rental_id===r.id&&s.note===reviewNote);
   return <article key={r.id} className="min-w-0 overflow-hidden rounded-lg border bg-card">
    <div className="space-y-4 p-4 sm:p-5">
     <div className="flex flex-wrap items-start justify-between gap-2">
      <div className="min-w-0">
       <div className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{r.purpose==='purchase'?'Purchase booking':'Rental'}</div>
       <div className="text-sm font-semibold break-words">{r.service_address||'Address not recorded'}</div>
      </div>
      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${r.lifecycle_state==='active'?'bg-emerald-50 text-emerald-800':'bg-muted/40 text-muted-foreground'}`}>
       {r.purpose==='purchase'?'Purchase pending':r.lifecycle_state.charAt(0).toUpperCase()+r.lifecycle_state.slice(1)}
      </span>
     </div>
     {r.purpose!=='purchase'&&r.lifecycle_state!=='canceled'&&<dl className="grid grid-cols-2 gap-4 border-t pt-3 sm:grid-cols-3">
      <div><dt className="text-xs text-muted-foreground">Installed</dt><dd className="mt-1 font-medium tabular-nums">{historyDate(r.actual_start)}</dd></div>
      <div><dt className="text-xs text-muted-foreground">{r.actual_end?'Rental ended':r.removal_window_start?'Estimated removal':r.lifecycle_state==='ended'?'Removal date':'Return'}</dt><dd className="mt-1 font-medium tabular-nums">{r.actual_end?historyDate(r.actual_end):r.removal_window_start?`${historyDate(r.removal_window_start)} – ${historyDate(r.removal_window_end)}`:r.lifecycle_state==='ended'?'Unknown':'Not recorded'}</dd></div>
      {r.planned_end&&<div><dt className="text-xs text-muted-foreground">Planned final service day</dt><dd className="mt-1 font-medium tabular-nums">{historyDate(r.planned_end)}</dd></div>}
     </dl>}
     {r.lifecycle_state==='canceled'&&<p className="text-xs text-muted-foreground">Canceled before installation.</p>}
     {!!terms.length&&<div className="overflow-x-auto rounded-md border">
      <table aria-label="Rental agreement terms" className="w-full border-collapse text-left text-xs sm:min-w-[560px]">
       <thead className="hidden bg-muted/30 text-muted-foreground sm:table-header-group"><tr>{['Sauna / agreement','Minimum term','Monthly rate','Effective dates'].map(h=><th key={h} className="px-3 py-2 font-medium">{h}</th>)}</tr></thead>
       <tbody>{terms.map(t=>{
        const agreement=data.agreements.find(a=>a.id===t.agreement_id);
        const doc=data.documents.find(d=>d.id===agreement?.document_id);
        return <tr key={t.id} className="grid grid-cols-2 border-t align-top sm:table-row">
         <td className="col-span-2 px-3 py-3 sm:max-w-[280px]">
          <div className="font-medium">{t.sauna_type||'Type unknown'}</div>
          <div className="mt-1 text-muted-foreground">{agreement?agreement.signing_state==='signed'?'Signed agreement':agreement.signing_state==='voided'?'Voided agreement':'Signature unconfirmed':t.source}</div>
          {agreement&&onOpenAgreement&&<button className="mt-1 text-primary underline-offset-2 hover:underline" onClick={()=>{setError('');onOpenAgreement(agreement.id).catch(e=>setError(e instanceof Error?e.message:'Could not open document'));}}>View contract{doc?.incomplete?' · incomplete source':''}</button>}
          {t.extras?.map((x,i)=><div className="mt-1 text-muted-foreground" key={i}>{x.name} · {displayMoney(x.amountCents,t.currency)}/mo</div>)}
          {agreement&&<details className="history-disclosure mt-1"><summary>Agreement source & corrections</summary><div className="mb-2 break-words text-muted-foreground">{agreement.label}</div><pre className="max-h-56 overflow-auto whitespace-pre-wrap break-words rounded bg-muted/30 p-2 text-[11px]">{JSON.stringify({original:agreement.source_terms,confirmed:agreement.owner_corrections},null,2)}</pre></details>}
         </td>
         <td className="border-t px-3 py-3 sm:whitespace-nowrap sm:border-0"><div className="mb-1 text-[11px] text-muted-foreground sm:hidden">Minimum term</div>{t.minimum_months===null?'Unknown':`${t.minimum_months} months`}</td>
         <td className="border-t px-3 py-3 font-medium tabular-nums sm:whitespace-nowrap sm:border-0"><div className="mb-1 text-[11px] font-normal text-muted-foreground sm:hidden">Monthly rate</div>{displayMoney(t.base_monthly_cents,t.currency)}<span className="mt-1 block text-[11px] font-normal text-muted-foreground">{agreement?'Agreed rate':'Source-recorded rate'}</span></td>
         <td className="col-span-2 border-t px-3 py-3 text-muted-foreground sm:border-0"><span className="mr-2 text-[11px] sm:hidden">Effective dates:</span>{t.effective_from?historyDate(t.effective_from):'Not confirmed'}{t.effective_until&&<span className="block">to {historyDate(t.effective_until)}</span>}</td>
        </tr>;
       })}</tbody>
      </table>
     </div>}
    </div>
    <div className="space-y-1 border-t bg-muted/10 px-4 py-3 sm:px-5">
     {r.history_gaps?.length>0&&<details className="history-disclosure"><summary><span className="text-amber-800">{r.history_gaps.length} {r.history_gaps.length===1?'detail':'details'} to confirm</span></summary><ul className="list-disc space-y-1 pl-4 text-xs text-muted-foreground">{r.history_gaps.map(g=><li key={g}>{g}</li>)}</ul></details>}
     <details className="history-disclosure"><summary>Notes & date sources</summary><div className="space-y-2 text-xs text-muted-foreground">
      {reviewNote&&!noteRepeatedInSale&&<p>{reviewNote}</p>}
      {r.actual_start_source&&<p><span className="font-medium text-foreground">Installation source: </span>{r.actual_start_source}</p>}
      {typeof r.actual_start_evidence?.sourcePaymentId==='string'&&<p className="break-all">Xero transaction: {r.actual_start_evidence.sourcePaymentId}</p>}
      {r.removal_window_start&&<p>Removal estimated from the last subscription receipt. The exact day is unconfirmed.</p>}
      {r.planned_end&&<p>The planned final service day does not confirm a completed return.</p>}
      {!reviewNote&&!r.actual_start_source&&!r.removal_window_start&&!r.planned_end&&<p>No additional source notes recorded.</p>}
     </div></details>
     <details className="history-disclosure"><summary>Sauna history & changes</summary><div className="space-y-3 border-l-2 pl-3 text-xs">
      {data.placements.filter(p=>p.rental_id===r.id).map(p=><div key={p.id}><div className="font-medium">Sauna #{state.assets.find(a=>a.id===p.asset_id)?.code||'Unknown'} · {p.type_at_install}</div><div className="text-muted-foreground">{historyDate(p.installed_on)} – {p.removed_on?historyDate(p.removed_on):'Still installed'}</div><p className="text-muted-foreground">{p.evidence}</p></div>)}
      {data.events.filter(e=>e.rental_id===r.id).sort((a,b)=>(a.occurred_on||'').localeCompare(b.occurred_on||'')).map(e=><div key={e.id}><div className="font-medium">{e.event_type.replace(/_/g,' ')}{e.asset_id&&` · #${state.assets.find(a=>a.id===e.asset_id)?.code||'Unknown'}`}</div><div className="text-muted-foreground">{e.occurred_on?historyDate(e.occurred_on):'Date not recorded'}</div>{typeof e.detail.note==='string'&&<p className="text-muted-foreground">{e.detail.note}</p>}</div>)}
      {(state.legacyLinks||[]).filter(l=>l.rentalId===r.id&&!data.placements.some(p=>p.rental_id===r.id&&p.asset_id===l.assetId)).map(l=><p key={l.assetId}>Sauna #{state.assets.find(a=>a.id===l.assetId)?.code} · {l.kind==='current'?'Current assignment':'Future assignment'}; exact placement dates unconfirmed.</p>)}
     </div></details>
     {data.settlements.some(s=>s.rental_id===r.id)&&<details className="history-disclosure"><summary>Early departure settlements</summary><div className="space-y-2 text-xs">{data.settlements.filter(s=>s.rental_id===r.id).map(s=><p key={s.id}>{historyDate(s.settled_on)} · {s.kind.replace(/_/g,' ')} · {displayMoney(s.amount_cents)} · {s.reason}{data.settlements.some(n=>n.supersedes_id===s.id)&&' (replaced; retained for history)'}</p>)}</div></details>}
    </div>
   </article>;
  })}
  {!!sales.length&&<section className="space-y-3" aria-label="Sauna purchases"><h3 className="font-semibold">Purchases</h3>{sales.map(s=><div key={s.id} className="rounded-lg border bg-card p-4 sm:p-5">
   <div className="flex flex-wrap items-center justify-between gap-3"><div><div className="font-semibold">Sauna #{state.assets.find(a=>a.id===s.asset_id)?.code}</div><div className="mt-1 text-xs text-muted-foreground">Purchased {historyDate(s.sold_on)}</div></div><div className="text-right"><div className="font-semibold tabular-nums">{s.agreed_cents===null?'Price unconfirmed':displayMoney(s.agreed_cents,s.currency)}</div><div className="mt-1 text-xs text-muted-foreground">Agreed sale price</div></div></div>
   {s.note&&<details className="history-disclosure mt-3 border-t pt-2"><summary>Sale notes</summary><p className="text-xs text-muted-foreground">{s.note}</p></details>}
  </div>)}</section>}
 </section>;
}

export default function RentalLifecycle({state,onCommand,onOpenAgreement,onUpload,onRefresh}:{state:RentalWorkspace;onCommand?:LifecycleCommand;onOpenAgreement?:OpenAgreement;onUpload?:(file:File,commandId:string,incomplete:boolean)=>Promise<string>;onRefresh?:()=>Promise<void>}) {
 const data=state.lifecycle;const [search,setSearch]=useState('');const [filter,setFilter]=useState('');
 const [editor,setEditor]=useState<{operation:string;rentalId?:string;commandId:string}|null>(null);
 const [error,setError]=useState('');const [saving,setSaving]=useState(false);const [assetHistory,setAssetHistory]=useState('');
 const [historyCustomer,setHistoryCustomer]=useState('');
 if(!data)return <p className="text-sm text-muted-foreground">Rental lifecycle data is not loaded.</p>;
 const selected=data.rentals.find(r=>r.id===editor?.rentalId);
 const open=(operation:string,r?:LifecycleRental)=>{setError('');setEditor({operation,rentalId:r?.id,commandId:crypto.randomUUID()});};
 const command=async(event:FormEvent<HTMLFormElement>)=>{
  event.preventDefault();if(!editor||!onCommand)return;setSaving(true);setError('');
  const form=new FormData(event.currentTarget);const value=(k:string)=>String(form.get(k)||'').trim();
  try{
   let payload:Record<string,unknown>={commandId:editor.commandId,rentalId:selected?.id,version:selected?.version,date:value('date')};
   if(editor.operation==='manual_reservation')payload={commandId:editor.commandId,customerId:value('customerId'),sourceKey:`manual:${editor.commandId}`,address:value('address'),bookedOn:value('bookedOn'),minimumMonths:value('months'),notes:value('notes'),historical:form.get('historical')==='on'};
   if(['install','swap'].includes(editor.operation))Object.assign(payload,{assetId:value('assetId'),placementId:value('placementId'),evidence:value('evidence')});
   if(editor.operation==='return')payload.placementId=value('placementId');
   if(editor.operation==='cancel_rental')payload.reason=value('reason');
   if(editor.operation==='terms')Object.assign(payload,{minimumMonths:Number(value('months')),monthlyCents:centsInput(value('amount')),effectiveFrom:value('effectiveFrom'),commitmentStart:value('commitmentStart'),saunaType:value('saunaType'),source:value('source'),notes:value('notes')});
   if(editor.operation==='settlement')Object.assign(payload,{kind:value('kind'),amountCents:centsInput(value('amount')),reason:value('reason'),supersedesId:data.settlements.find(s=>s.rental_id===selected?.id&&!data.settlements.some(n=>n.supersedes_id===s.id))?.id});
   if(editor.operation==='sale') {const placement=data.placements.find(p=>p.asset_id===value('assetId')&&!p.removed_on);const r=data.rentals.find(r=>r.id===placement?.rental_id);Object.assign(payload,{assetId:value('assetId'),customerId:value('customerId'),version:r?.version,amountCents:value('amount')?centsInput(value('amount')):null,reference:value('reference'),notes:value('notes')});}
   if(editor.operation==='asset_status')Object.assign(payload,{assetId:value('assetId'),status:value('status'),reason:value('reason')});
   if(editor.operation==='backfill_history')Object.assign(payload,{start:value('start'),end:value('end'),dateSource:value('dateSource'),state:value('state'),removalWindowStart:selected?.removal_window_start,removalWindowEnd:selected?.removal_window_end,removalEvidence:selected?.removal_evidence,address:value('address'),reason:value('reason'),replaceStart:form.get('replaceStart')==='on',gaps:value('gaps').split('\n').map(v=>v.trim()).filter(Boolean)});
   if(editor.operation==='confirm_agreement')Object.assign(payload,{agreementId:value('agreementId'),signingState:value('signingState'),reason:value('reason')});
   let operation=editor.operation;
   if(operation==='upload_agreement'){
    const file=form.get('file');if(!(file instanceof File)||!file.size||!onUpload)throw new Error('Choose a PDF.');
    const documentId=await onUpload(file,editor.commandId,form.get('incomplete')==='on');
    operation='link_agreement';payload={commandId:`${editor.commandId.slice(0,35)}${editor.commandId.endsWith('0')?'1':'0'}`,rentalId:selected?.id,version:selected?.version,documentId,sourceKey:`upload:${editor.commandId}`,label:file.name,minimumMonths:value('months'),monthlyCents:value('amount')?centsInput(value('amount')):null,saunaType:value('saunaType'),signingState:value('signingState'),notes:value('notes')};
   }
   await onCommand(operation,payload);setEditor(null);
  }catch(e){setError(e instanceof Error?e.message:'Could not save history');}finally{setSaving(false);}
 };
 const rows=data.rentals.filter(r=>{const c=state.customers.find(c=>c.id===r.customer_id);return(!filter||r.lifecycle_state===filter)&&`${c?.name} ${r.service_address||''} ${data.terms.filter(t=>t.rental_id===r.id).map(t=>t.sauna_type).join(' ')}`.toLowerCase().includes(search.toLowerCase());}).sort((a,b)=>(state.customers.find(c=>c.id===a.customer_id)?.name||'').localeCompare(state.customers.find(c=>c.id===b.customer_id)?.name||''));
 const customerSelect=<Label className="grid gap-1 font-normal">Customer<select className={selectClass} name="customerId" required defaultValue={selected?.customer_id||''}><option value="" disabled>Choose a customer</option>{state.customers.filter(c=>!c.archived).map(c=><option key={c.id} value={c.id}>{customerName(c)}</option>)}</select></Label>;
 const assetSelect=<Label className="grid gap-1 font-normal">Sauna<select className={selectClass} name="assetId" required defaultValue=""><option value="" disabled>Choose a sauna</option>{state.assets.map(a=><option key={a.id} value={a.id}>#{a.code} · {a.typeName} · {a.sourceStatus}</option>)}</select></Label>;
 const placementSelect=<Label className="grid gap-1 font-normal">Current placement<select name="placementId" className={selectClass} required defaultValue=""><option value="" disabled>Choose the sauna being removed</option>{data.placements.filter(p=>p.rental_id===selected?.id&&!p.removed_on).map(p=><option key={p.id} value={p.id}>#{state.assets.find(a=>a.id===p.asset_id)?.code} · installed {p.installed_on}</option>)}</select></Label>;
 return <section className="space-y-3" aria-label="Rental lifecycle">
 <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-lg font-semibold">Rentals & history</h2><div className="flex flex-wrap gap-2">{onRefresh&&<Button variant="outline" onClick={()=>onRefresh().catch(e=>setError(e.message))}>Refresh history</Button>}<Button variant="outline" disabled={!onCommand} onClick={()=>open('manual_reservation')}>Add manual reservation</Button><Button variant="outline" disabled={!onCommand} onClick={()=>open('sale')}>Record sale</Button><Button variant="outline" disabled={!onCommand} onClick={()=>open('asset_status')}>Sauna status</Button></div></div>
 {error&&!editor&&<p role="alert" className="text-sm text-destructive">{error}</p>}
 {!onCommand&&<p className="text-xs text-muted-foreground">Private business copy · read only. History changes are saved through the live admin workflow.</p>}
 <div className="flex flex-wrap gap-2"><Input aria-label="Search rental history" className="max-w-sm" placeholder="Search customer, address or sauna type…" value={search} onChange={e=>setSearch(e.target.value)}/><select aria-label="Filter rental state" className={selectClass+' !w-auto'} value={filter} onChange={e=>setFilter(e.target.value)}><option value="">All rental states</option>{['unconfirmed','planned','active','ended','canceled'].map(s=><option key={s}>{s}</option>)}</select><select aria-label="Sauna history" className={selectClass+' !w-auto'} value={assetHistory} onChange={e=>setAssetHistory(e.target.value)}><option value="">View a sauna’s history…</option>{state.assets.map(a=><option value={a.id} key={a.id}>#{a.code} · {a.typeName}</option>)}</select></div>
 <div className="overflow-auto rounded border bg-card"><table aria-label="Rental history" className="w-full min-w-[720px] text-xs text-left border-collapse"><thead className="bg-muted text-[10px] uppercase text-muted-foreground"><tr>{['Customer','Reservation / source','Rental dates','State','Agreements','Actions'].map(h=><th className={td} key={h}>{h}</th>)}</tr></thead><tbody>{rows.map(r=><tr key={r.id} className="border-t"><td className={td}><button className="font-semibold text-primary hover:underline" onClick={()=>setHistoryCustomer(r.customer_id)}>{state.customers.find(c=>c.id===r.customer_id)?.name||'Unknown customer'}</button><span className="block">{r.service_address||'Address unknown'}</span></td><td className={td}>{r.originating_reservation_id?.slice(0,8)||'Reservation not linked'}<span className="block text-muted-foreground">{state.reservations?.find(a=>a.id===r.originating_reservation_id)?.bookingKind==='manual_historical'?'Manual — historical':'Existing booking'}</span></td><td className={td}>{r.actual_start||'Installation unknown'} → {r.actual_end||(r.removal_window_start?`Estimated removal ${r.removal_window_start}–${r.removal_window_end}`:'Return unknown')}<span className="block text-muted-foreground">{r.actual_start_source}</span></td><td className={td}>{r.purpose==='purchase'?'Purchase pending':r.lifecycle_state}{r.history_gaps?.length>0&&<span className="block text-muted-foreground">{r.history_gaps.length} missing details</span>}</td><td className={td}>{data.terms.filter(t=>t.rental_id===r.id).map(t=><div key={t.id}>{t.sauna_type} · {t.minimum_months??'?'} months · {displayMoney(t.base_monthly_cents,t.currency)}/mo</div>)}</td><td className={td}><Button size="sm" variant="outline" disabled={!onCommand} onClick={()=>open('install',r)}>Manage</Button></td></tr>)}{!rows.length&&<tr><td colSpan={6} className="p-3 text-muted-foreground">No rentals match this filter.</td></tr>}</tbody></table></div>
 <Dialog open={!!historyCustomer} onOpenChange={v=>{if(!v)setHistoryCustomer('');}}><DialogContent className="max-w-5xl min-w-0 max-h-[90vh] overflow-auto [&>*]:min-w-0"><DialogHeader><DialogTitle>{state.customers.find(c=>c.id===historyCustomer)?.name} · rental history</DialogTitle></DialogHeader><RentalCustomerHistory state={state} customerId={historyCustomer} onOpenAgreement={onOpenAgreement}/></DialogContent></Dialog>
 <Dialog open={!!assetHistory} onOpenChange={v=>{if(!v)setAssetHistory('');}}><DialogContent className="max-w-3xl min-w-0 max-h-[90vh] overflow-auto [&>*]:min-w-0"><DialogHeader><DialogTitle>Sauna #{state.assets.find(a=>a.id===assetHistory)?.code} · history</DialogTitle></DialogHeader><div className="space-y-3 text-sm">{data.placements.filter(p=>p.asset_id===assetHistory).sort((a,b)=>a.installed_on.localeCompare(b.installed_on)).map(p=><p key={p.id}>{p.installed_on} → {p.removed_on||'Still installed'} · {state.customers.find(c=>c.id===data.rentals.find(r=>r.id===p.rental_id)?.customer_id)?.name} · {p.type_at_install}<span className="block text-xs text-muted-foreground">{p.address} · {p.evidence}</span></p>)}{data.sales.filter(s=>s.asset_id===assetHistory).map(s=><p key={s.id}>Sold {s.sold_on} to {state.customers.find(c=>c.id===s.customer_id)?.name} · {displayMoney(s.agreed_cents,s.currency)}</p>)}{data.events.filter(e=>e.asset_id===assetHistory).map(e=><p key={e.id}>{e.occurred_on||'Date unknown'} · {e.event_type} · {state.customers.find(c=>c.id===data.rentals.find(r=>r.id===e.rental_id)?.customer_id)?.name}<span className="block text-xs text-muted-foreground">{typeof e.detail.note==='string'?e.detail.note:''}</span></p>)}{(state.legacyLinks||[]).filter(l=>l.assetId===assetHistory).map(l=><p key={l.kind}>Existing {l.kind} link: {state.customers.find(c=>c.id===state.rentals.find(r=>r.id===l.rentalId)?.customerId)?.name}. Exact placement history not confirmed.</p>)}<p className="text-xs text-muted-foreground">A gap means unknown history; it is not assumed to be idle time.</p></div></DialogContent></Dialog>
 <Dialog open={!!editor} onOpenChange={v=>{if(!v&&!saving)setEditor(null);}}><DialogContent className="max-h-[90vh] overflow-auto"><DialogHeader><DialogTitle>{selected?'Manage rental':'Record history'}</DialogTitle></DialogHeader><form key={editor?.commandId} onSubmit={command} className="space-y-3">
 {selected&&<Label className="grid gap-1 font-normal">Action<select className={selectClass} value={editor?.operation} onChange={e=>{setError('');setEditor({...editor!,operation:e.target.value,commandId:crypto.randomUUID()});}}>{[['install','Confirm installation'],['return','Record sauna return'],['swap','Swap sauna'],['terms','Add dated terms / renewal'],['settlement','Early departure settlement'],['end_rental','End rental'],['cancel_rental','Cancel before installation'],['backfill_history','Complete / correct historical details'],['confirm_agreement','Review uploaded signing evidence'],['upload_agreement','Attach agreement PDF']].map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></Label>}
 {editor?.operation==='manual_reservation'&&<>{customerSelect}<label className="flex items-center gap-2 text-sm"><input name="historical" type="checkbox" defaultChecked/>Historical booking</label><Field name="bookedOn" label="Original booking date (if known)" type="date"/><Field name="address" label="Service address (if known)"/><Field name="months" label="Minimum months (if known)" type="number"/><Field name="notes" label="Source / notes"/><p className="text-xs text-muted-foreground">Creates a reservation and rental under this customer. No emails, payments or inventory holds are created.</p></>}
 {['install','return','swap','sale','asset_status','settlement','end_rental','cancel_rental'].includes(editor?.operation||'')&&<Field name="date" label="Actual event date" type="date" required/>}
 {['install','swap','sale','asset_status'].includes(editor?.operation||'')&&assetSelect}
 {['return','swap'].includes(editor?.operation||'')&&placementSelect}
 {['install','swap'].includes(editor?.operation||'')&&<Field name="evidence" label="Date source / confirmation note" required/>}
 {editor?.operation==='terms'&&<><Field name="months" label="Minimum commitment (months)" type="number" required/><Field name="amount" label="Agreed base monthly rent ($)" required/><Field name="effectiveFrom" label="Rate effective from (leave blank if not yet known)" type="date"/><Field name="commitmentStart" label="Commitment starts (if confirmed)" type="date"/><Field name="saunaType" label="Sauna type"/><Field name="source" label="Source / reason for change" required/><Field name="notes" label="Notes"/><p className="text-xs text-muted-foreground">This records agreed terms, not a payment. Prior dated terms and original agreements remain unchanged.</p></>}
 {editor?.operation==='settlement'&&<><Label className="grid gap-1 font-normal">Decision<select name="kind" className={selectClass}><option value="collect_remaining">Collect remaining rent</option><option value="exit_fee">Exit fee</option><option value="partial_waiver">Partial waiver</option><option value="full_waiver">Full waiver</option></select></Label><Field name="amount" label="Amount covered by this decision ($)" required/><Field name="reason" label="Reason / agreement with customer" required/><p className="text-xs text-muted-foreground">Records the decision only. It does not charge or refund the customer.</p></>}
 {editor?.operation==='sale'&&<>{customerSelect}<Field name="amount" label="Agreed sale price ($, if known)"/><Field name="reference" label="Xero invoice / reference"/><Field name="notes" label="Sale notes"/><p className="text-xs text-muted-foreground">An installed sale closes that placement. Sale price is not proof of payment.</p></>}
 {editor?.operation==='cancel_rental'&&<Field name="reason" label="Cancellation reason" required/>}
 {editor?.operation==='asset_status'&&<><Label className="grid gap-1 font-normal">Status<select name="status" className={selectClass}><option>Available</option><option>Maintenance</option><option>Retired</option></select></Label><Field name="reason" label="Reason / inspection result" required/></>}
 {editor?.operation==='backfill_history'&&<><Field name="start" label="Installation date (blank if unknown)" type="date" defaultValue={selected?.actual_start||''}/><Field name="end" label="Return date (blank if unknown)" type="date" defaultValue={selected?.actual_end||''}/><Field name="dateSource" label="Installation date source" defaultValue={selected?.actual_start_source||''}/><Field name="address" label="Service address" defaultValue={selected?.service_address||''}/><Label className="grid gap-1 font-normal">Rental state<select name="state" className={selectClass} defaultValue={selected?.lifecycle_state}>{['unconfirmed','planned','active','ended'].map(s=><option key={s}>{s}</option>)}</select></Label><label className="flex items-center gap-2 text-sm"><input name="replaceStart" type="checkbox"/>I am correcting a previously recorded installation date</label><Field name="reason" label="Source / correction reason" required/><Label className="grid gap-1 font-normal">Information still missing (one item per line)<textarea className="rounded-md border border-input bg-background p-2 text-sm" name="gaps" rows={4} defaultValue={selected?.history_gaps.join('\n')}/></Label></>}
 {editor?.operation==='confirm_agreement'&&<><Label className="grid gap-1 font-normal">Uploaded agreement<select name="agreementId" className={selectClass} required defaultValue=""><option value="" disabled>Choose an agreement</option>{data.agreements.filter(a=>a.rental_id===selected?.id&&!a.contract_id).map(a=><option key={a.id} value={a.id}>{a.label}</option>)}</select></Label><Label className="grid gap-1 font-normal">Signing evidence<select name="signingState" className={selectClass}><option value="signed">Signed</option><option value="unconfirmed">Not confirmed</option><option value="voided">Voided</option></select></Label><Field name="reason" label="What you verified / reason" required/></>}
 {editor?.operation==='upload_agreement'&&<><Field name="file" label="Original PDF" type="file" required/><label className="flex items-center gap-2 text-sm"><input name="incomplete" type="checkbox"/>Source has missing pages</label><Label className="grid gap-1 font-normal">Signing evidence<select name="signingState" className={selectClass}><option value="unconfirmed">Not confirmed</option><option value="signed">Signed</option></select></Label><Field name="months" label="Confirmed minimum months (if known)" type="number"/><Field name="amount" label="Confirmed base monthly rent ($, if known)"/><Field name="saunaType" label="Confirmed sauna type"/><Field name="notes" label="Source / corrections"/></>}
 {error&&<p role="alert" className="text-sm text-destructive">{error}</p>}<div className="flex justify-end gap-2"><Button type="button" variant="outline" disabled={saving} onClick={()=>setEditor(null)}>Cancel</Button><Button disabled={saving||!onCommand} type="submit">{saving?'Saving…':'Save history'}</Button></div>
 </form></DialogContent></Dialog>
 </section>;
}
