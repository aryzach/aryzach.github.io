import { customerLtv } from './customerLtv.ts';
import type { LifecycleRental, LifecycleTerm } from './lifecycleModel.ts';
import type { RentalWorkspace } from './rentalModel.ts';

export interface LtvSourceContact { tenantId:string;contactId:string;complete:boolean;snapshotAt:string }
export interface LtvSourcePayment { tenantId:string;contactId:string;id:string;date:string;status:string;type:string;currency:string;amountCents:number;hasRentalLines:boolean }
export interface LtvSources { contacts:LtvSourceContact[];payments:LtvSourcePayment[] }
export interface LtvPoint { date:string;committed:number|null;actual:number|null;customers:number;eligible:number;excluded:number;partial:boolean;estimatedDates:number;unverifiedTerms:number;newInstalledCommitted:number|null;newInstalledCustomers:number;newInstalledEligible:number }
export interface LtvGap {customerId:string;name:string;reasons:string[]}
export interface LtvTimeline {points:LtvPoint[];gaps:LtvGap[];types:string[];earliest:string|null;snapshotAt:string|null}
export type LtvCompletion='all'|'ended'|'ended_or_minimum';
export interface LtvOptions {from:string;to:string;today:string;types?:string[];endedOnly?:boolean;completion?:LtvCompletion}
const day=(value:unknown):value is string=>typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(Date.parse(value))&&new Date(value).toISOString().slice(0,10)===value;
const monthEnd=(year:number,month:number)=>new Date(Date.UTC(year,month+1,0)).toISOString().slice(0,10);
export function pacificToday(now=new Date()) {
 const parts=new Intl.DateTimeFormat('en-US',{timeZone:'America/Los_Angeles',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);
 const part=(name:string)=>parts.find(p=>p.type===name)!.value;return `${part('year')}-${part('month')}-${part('day')}`;
}
export function sourcesFromLocalWorkspace(state:RentalWorkspace):LtvSources {
 const links=state.xeroLinks||[];
 return {contacts:(state.xeroHistory?.contacts||[]).flatMap(c=>{const link=links.find(l=>l.contactId===c.contactId);return link?[{tenantId:link.tenantId,contactId:c.contactId,complete:state.xeroHistory?.coverage?.terminalPageReached===true,snapshotAt:c.snapshotAt}]:[];}),payments:(state.xeroHistory?.transactions||[]).flatMap(p=>{const link=links.find(l=>l.contactId===p.contactId);return link?[{tenantId:link.tenantId,contactId:p.contactId,id:p.id,date:p.date,status:p.status,type:p.type,currency:p.currency,amountCents:Math.round(Number(p.amount)*100),hasRentalLines:!!p.lines?.some(l=>['102','542'].includes(l.accountCode)&&Number(l.amount)!==0)}]:[];})};
}
const termDate=(state:RentalWorkspace,term:LifecycleTerm,rental:LifecycleRental)=>{
 const agreement=state.lifecycle?.agreements.find(a=>a.id===term.agreement_id);
 return agreement?.signed_on||term.effective_from||agreement?.agreement_date||rental.actual_start;
};
const rentalEligible=(r:LifecycleRental)=>r.purpose!=='purchase'&&r.lifecycle_state!=='canceled'&&r.owner_review?.neverInstalled!==true&&day(r.actual_start);
export function normalizeSaunaType(raw:string|null|undefined):string {
 const text=(raw||'').split(/→|->/).at(-1)!.toLowerCase();
 const location=text.includes('outdoor')?'Outdoor':text.includes('indoor')?'Indoor':null;
 const heat=text.includes('infrared')?'Infrared':/traditional|steam|dry/.test(text)?'Traditional':null;
 return location&&heat?`${location} ${heat}`:'Unknown type';
}
export function latestInstalledType(state:RentalWorkspace,customerId:string):string {
 const rentals=(state.lifecycle?.rentals||[]).filter(r=>r.customer_id===customerId&&rentalEligible(r)).sort((a,b)=>b.actual_start!.localeCompare(a.actual_start!)||a.id.localeCompare(b.id));
 if(!rentals.length)return 'Unknown type';
 const types=rentals.filter(r=>r.actual_start===rentals[0].actual_start).map(r=>{
  const placement=state.lifecycle!.placements.filter(p=>p.rental_id===r.id).sort((a,b)=>b.installed_on.localeCompare(a.installed_on))[0];
  const terms=state.lifecycle!.terms.filter(t=>t.rental_id===r.id&&!['superseded','voided','canceled'].includes(t.state)&&(!t.effective_from||t.effective_from<=pacificToday())).sort((a,b)=>(termDate(state,b,r)||'0000').localeCompare(termDate(state,a,r)||'0000')||a.id.localeCompare(b.id));
  // Latest historical installed type; current inventory may have been converted after return.
  return normalizeSaunaType(placement?.type_at_install||terms[0]?.sauna_type||String(r.owner_review?.saunaType||''));
 });
 return new Set(types).size===1?types[0]:'Multiple latest types';
}

function commitmentAsOf(state:RentalWorkspace,customerId:string,cutoff:string) {
 const data=state.lifecycle!;
 const rentals=data.rentals.filter(r=>r.customer_id===customerId&&rentalEligible(r)&&r.actual_start!<=cutoff);
 let estimatedDates=0;
 const terms=data.terms.filter(t=>{
  const rental=rentals.find(r=>r.id===t.rental_id);if(!rental)return false;
  const starts=termDate(state,t,rental);if(!day(starts)||starts>cutoff)return false;
  if(!t.effective_from&&!data.agreements.find(a=>a.id===t.agreement_id)?.signed_on&&!data.agreements.find(a=>a.id===t.agreement_id)?.agreement_date)estimatedDates++;
  return true;
 });
 const result=customerLtv({...state,lifecycle:{...data,rentals,terms}},customerId);
 return {value:result.committed,reasons:result.commitmentNotes.filter(n=>!n.includes('signature confirmation')),unverified:result.commitmentNotes.some(n=>n.includes('signature confirmation')),estimated:estimatedDates>0};
}
function actualAsOf(state:RentalWorkspace,sources:LtvSources,customerId:string,cutoff:string) {
 const data=state.lifecycle!;const links=(state.xeroLinks||[]).filter(l=>l.customerId===customerId);
 if(!links.length||links.some(l=>!sources.contacts.some(c=>c.tenantId===l.tenantId&&c.contactId===l.contactId&&c.complete)))return {value:null,reason:'Complete Xero payment coverage is missing.'};
 const duplicate=(tenant:string,id:string)=>data.paymentReviews?.some(r=>r.customer_id===customerId&&r.tenant_id===tenant&&r.source_id===id&&r.disposition==='duplicate');
 const allocations=data.allocations.filter(a=>a.customer_id===customerId&&!a.voided_at&&!duplicate(a.tenant_id,a.source_id));
 let value=0;
 for(const a of allocations.filter(a=>['rental','addon'].includes(a.category))) {
  const source=sources.payments.find(p=>p.tenantId===a.tenant_id&&p.id===a.source_id&&links.some(l=>l.tenantId===p.tenantId&&l.contactId===p.contactId));
  if(!source||!day(source.date))return {value:null,reason:'A classified rental payment has no usable source date or customer link.'};
  if(source.date>cutoff||source.status!=='AUTHORISED')continue;
  if(a.currency!=='USD'||source.currency!=='USD'||!Number.isSafeInteger(a.amount_cents)||!['RECEIVE','SPEND'].includes(source.type)||!['receipt','payment_out'].includes(a.source_kind)||a.source_kind!==(source.type==='SPEND'?'payment_out':'receipt'))return {value:null,reason:'A rental payment requires currency or direction review.'};
  value+=(a.source_kind==='payment_out'?-1:1)*a.amount_cents;
 }
 for(const p of sources.payments.filter(p=>links.some(l=>l.tenantId===p.tenantId&&l.contactId===p.contactId)&&p.status==='AUTHORISED'&&p.hasRentalLines&&p.date<=cutoff&&!duplicate(p.tenantId,p.id))) {
  const allocated=allocations.filter(a=>a.tenant_id===p.tenantId&&a.source_id===p.id).reduce((sum,a)=>sum+a.amount_cents,0);
  if(!day(p.date)||p.currency!=='USD'||!Number.isSafeInteger(p.amountCents)||allocated!==p.amountCents)return {value:null,reason:'A rental receipt or refund is not fully classified.'};
 }
 return {value,reason:''};
}

function minimumReachedBy(state:RentalWorkspace,rental:LifecycleRental,cutoff:string):boolean {
 if(rental.lifecycle_state!=='active'||!day(rental.actual_start)||rental.actual_start>cutoff)return false;
 const terms=(state.lifecycle?.terms||[]).filter(t=>t.rental_id===rental.id&&!['superseded','voided','canceled'].includes(t.state)&&!state.lifecycle?.agreements.some(a=>a.id===t.agreement_id&&['voided','superseded'].includes(a.signing_state)));
 // Explicit commitment starts survive rate changes; otherwise use the recorded
 // term start, falling back to installation. Calendar months clamp at month-end.
 return terms.length>0&&terms.every(t=>{
  const start=t.commitment_start||t.effective_from||rental.actual_start;
  if(!day(start)||!Number.isSafeInteger(t.minimum_months)||t.minimum_months!<1)return false;
  const [year,month,date]=start.split('-').map(Number);const target=new Date(Date.UTC(year,month-1+t.minimum_months!,1));
  if(!Number.isFinite(target.getTime()))return false;
  const last=new Date(Date.UTC(target.getUTCFullYear(),target.getUTCMonth()+1,0)).getUTCDate();
  target.setUTCDate(Math.min(date,last));
  return target.toISOString().slice(0,10)<=cutoff;
 });
}

/** Restated from current records. Date bounds select chart points, never truncate lifetime cash. */
export function ltvTimeline(state:RentalWorkspace,sources:LtvSources,options:LtvOptions):LtvTimeline {
 const {from,to,today}=options;if(!day(from)||!day(to)||!day(today)||from>to||to>today)throw Error('Choose a valid date range ending today or earlier.');
 if(Number(to.slice(0,4))-Number(from.slice(0,4))>30)throw Error('Choose a date range of 30 years or less.');
 const all=(state.lifecycle?.rentals||[]).filter(rentalEligible);
 const earliest=all.map(r=>r.actual_start!).sort()[0]||null;
 const customerIds=[...new Set(all.map(r=>r.customer_id))];
 const typeByCustomer=new Map(customerIds.map(id=>[id,latestInstalledType(state,id)]));
 const types=[...new Set(typeByCustomer.values())].sort();
 // The ended filter selects a fixed customer group at the chosen endpoint. Past
 // points still show that group's cash as of each date, not future final receipts.
 const completed=(r:LifecycleRental)=>r.lifecycle_state==='ended'&&day(r.actual_start)&&day(r.actual_end)&&r.actual_end>=r.actual_start&&r.actual_end<=to;
 const completion=options.completion||(options.endedOnly?'ended':'all');
 const includedByCompletion=(id:string)=>{
  if(completion==='all')return true;
  const rentals=(state.lifecycle?.rentals||[]).filter(r=>r.customer_id===id&&r.purpose!=='purchase'&&r.lifecycle_state!=='canceled'&&r.owner_review?.neverInstalled!==true);
  return rentals.length>0&&rentals.every(r=>completed(r)||(completion==='ended_or_minimum'&&minimumReachedBy(state,r,to)));
 };
 const chosen=customerIds.filter(id=>(options.types===undefined||options.types.includes(typeByCustomer.get(id)!))&&includedByCompletion(id));
 const firstInstall=new Map(chosen.map(id=>[id,all.filter(r=>r.customer_id===id).map(r=>r.actual_start!).sort()[0]]));
 const dates:string[]=[];let year=Number(from.slice(0,4)),month=Number(from.slice(5,7))-1;
 while(`${year}-${String(month+1).padStart(2,'0')}-01`<=to){const end=monthEnd(year,month);const date=end>to?to:end;if(date>=from)dates.push(date);month++;if(month===12){month=0;year++;}}
 const gaps:LtvGap[]=[];
 const points=dates.map((date,index)=>{
  const eligible=chosen.filter(id=>all.some(r=>r.customer_id===id&&r.actual_start!<=date));
  let committed=0,actual=0,customers=0,estimatedDates=0,unverifiedTerms=0;
  for(const id of eligible) {
   const commitment=commitmentAsOf(state,id,date),cash=actualAsOf(state,sources,id,date);
   if(commitment.value===null||cash.value===null){if(index===dates.length-1)gaps.push({customerId:id,name:state.customers.find(c=>c.id===id)?.name||'Customer',reasons:[...(commitment.value===null?commitment.reasons:[]),...(cash.value===null?[cash.reason]:[])]});continue;}
   committed+=commitment.value;actual+=cash.value;customers++;if(commitment.estimated)estimatedDates++;if(commitment.unverified)unverifiedTerms++;
  }
  const newInstalls=eligible.filter(id=>firstInstall.get(id)!.slice(0,7)===date.slice(0,7));
  let newCommitted=0,newInstalledCustomers=0;
  for(const id of newInstalls){
   const commitment=commitmentAsOf(state,id,date);
   if(commitment.value!==null){newCommitted+=commitment.value;newInstalledCustomers++;}
  }
  return {newInstalledCommitted:newInstalledCustomers?newCommitted/newInstalledCustomers/100:null,newInstalledCustomers,newInstalledEligible:newInstalls.length,date,committed:customers?committed/customers/100:null,actual:customers?actual/customers/100:null,customers,eligible:eligible.length,excluded:eligible.length-customers,partial:date!==monthEnd(Number(date.slice(0,4)),Number(date.slice(5,7))-1),estimatedDates,unverifiedTerms};
 });
 return {points,gaps,types,earliest,snapshotAt:sources.contacts.map(c=>c.snapshotAt).filter(Boolean).sort()[0]||null};
}
