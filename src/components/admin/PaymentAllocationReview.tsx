import {useState,type FormEvent} from 'react';
import {Button} from '@/components/ui/button';
import {Dialog,DialogContent,DialogHeader,DialogTitle} from '@/components/ui/dialog';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {centsInput,displayMoney,type LifecycleCommand} from '@/lib/lifecycleModel';
import type {RentalWorkspace} from '@/lib/rentalModel';
import type {XeroCashRecord} from '@/lib/xeroCustomerHistory';

/** Classification only: every save references existing cash; it never calls a provider. */
export default function PaymentAllocationReview({state,customerId,payment,onCommand}:{state:RentalWorkspace;customerId:string;payment:XeroCashRecord;onCommand?:LifecycleCommand}) {
 const [request,setRequest]=useState<{id:string;voidId?:string}|null>(null);
 const [saving,setSaving]=useState(false);const [error,setError]=useState('');
 const link=state.xeroLinks?.find(l=>l.customerId===customerId&&l.contactId===payment.contactId);
 const allocations=(state.lifecycle?.allocations||[]).filter(a=>a.customer_id===customerId&&a.source_id===payment.id&&a.tenant_id===link?.tenantId);
 const review=state.lifecycle?.paymentReviews?.find(r=>r.customer_id===customerId&&r.source_id===payment.id&&r.tenant_id===link?.tenantId);
 const active=allocations.filter(a=>!a.voided_at);
 const remaining=Math.round(Math.abs(Number(payment.amount))*100)-active.reduce((total,a)=>total+a.amount_cents,0);
 const rentals=state.lifecycle?.rentals.filter(r=>r.customer_id===customerId&&r.purpose!=='purchase')||[];
 const sales=state.lifecycle?.sales.filter(s=>s.customer_id===customerId)||[];
 const label=(target:string)=>{const r=rentals.find(r=>r.id===target);return r?`${r.actual_start||'Start unknown'} · ${r.service_address||'Address unknown'} · ${r.lifecycle_state}`:'';};
 async function save(event:FormEvent<HTMLFormElement>){
  event.preventDefault();if(!onCommand||!request||!link)return;setSaving(true);setError('');
  const form=new FormData(event.currentTarget);const v=(k:string)=>String(form.get(k)||'').trim();
  try {
   if(request.voidId)await onCommand('void_allocation',{commandId:request.id,allocationId:request.voidId,reason:v('reason')});
   else {const target=v('target');await onCommand('allocate_payment',{commandId:request.id,tenantId:link.tenantId,sourceId:payment.id,customerId,
    rentalId:target.startsWith('rental:')?target.slice(7):null,saleId:target.startsWith('sale:')?target.slice(5):null,
    category:v('category'),amountCents:centsInput(v('amount')),serviceFrom:v('from'),serviceUntil:v('until'),note:v('note')});}
   setRequest(null);
  }catch(e){setError(e instanceof Error?e.message:'Could not save classification.');}finally{setSaving(false);}
 }
 if(!state.lifecycle||!link)return null;
 return <div className="space-y-1 mt-1 text-xs">
 {review&&<p className="text-muted-foreground">Excluded duplicate receipt · original Xero record preserved. {review.reason}</p>}
 {allocations.map(a=><p key={a.id} className="text-muted-foreground">{displayMoney(a.amount_cents,a.currency)} · {a.category} · {a.rental_id?label(a.rental_id):a.sale_id?'Sauna sale':'Customer-level'}{a.service_from?` · ${a.service_from} → ${a.service_until||'end unspecified'}`:''}{a.voided_at?` · corrected: ${a.void_reason}`:onCommand&&<button className="text-primary underline ml-2" onClick={()=>{setError('');setRequest({id:crypto.randomUUID(),voidId:a.id});}}>Correct</button>}</p>)}
 {!review&&payment.status==='AUTHORISED'&&remaining>0&&onCommand&&<button className="text-primary underline" onClick={()=>{setError('');setRequest({id:crypto.randomUUID()});}}>Classify {displayMoney(remaining,payment.currency)} remaining</button>}
 <Dialog open={!!request} onOpenChange={open=>{if(!open&&!saving)setRequest(null);}}><DialogContent><DialogHeader><DialogTitle>{request?.voidId?'Correct payment classification':'Classify existing Xero payment'}</DialogTitle></DialogHeader><form key={request?.id} onSubmit={save} className="space-y-3">
 <p className="text-xs text-muted-foreground">{payment.date} · {payment.type==='RECEIVE'?'Received':'Paid out'} · {payment.reference||'No reference'}. This records what an existing payment covered; it does not charge, refund or change Xero.</p>
 {request?.voidId?<Label className="grid gap-1">Correction reason<Input name="reason" required/><span className="text-xs font-normal text-muted-foreground">The old classification remains in history. Its amount becomes available to classify again.</span></Label>:<>
 <Label className="grid gap-1">Applies to<select name="target" className="rounded-md border bg-background p-2" required defaultValue=""><option value="" disabled>Choose rental, sale or customer-level</option>{rentals.map(r=><option key={r.id} value={`rental:${r.id}`}>{label(r.id)}</option>)}{sales.map(s=><option key={s.id} value={`sale:${s.id}`}>Sauna sale · {s.sold_on}</option>)}<option value="customer">Customer-level; rental not yet confirmed</option></select></Label>
 <details className="text-xs"><summary className="cursor-pointer text-primary">Original Xero categories and tax</summary>{payment.lines?.map((line,i)=><p key={i}>{line.accountName||line.accountCode}: {line.amount} {payment.currency}; tax: {line.taxAmount||'0'} {payment.currency}</p>)}<p>Split mixed payments into separate classifications. Do not count tax or deposits as rental rent.</p></details>
 <Label className="grid gap-1">Category<select name="category" className="rounded-md border bg-background p-2" required defaultValue=""><option value="" disabled>Choose a category</option>{['rental','addon','delivery','sale','deposit','tax','other'].map(c=><option key={c}>{c}</option>)}</select></Label>
 <Label className="grid gap-1">Amount ($)<Input name="amount" required defaultValue={(remaining/100).toFixed(2)}/></Label>
 <Label className="grid gap-1">Service period starts (if known)<Input name="from" type="date"/></Label><Label className="grid gap-1">Service period ends, excluding this date (if known)<Input name="until" type="date"/></Label>
 <Label className="grid gap-1">Source / notes<Input name="note" required/></Label></>}
 {error&&<p role="alert" className="text-sm text-destructive">{error}</p>}<div className="flex justify-end gap-2"><Button type="button" variant="outline" disabled={saving} onClick={()=>setRequest(null)}>Cancel</Button><Button disabled={saving} type="submit">{saving?'Saving…':'Save classification'}</Button></div>
 </form></DialogContent></Dialog></div>;
}
