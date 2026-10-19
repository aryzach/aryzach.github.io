import type { Booking } from './bookingModel.ts';
import type { RentalWorkspace } from './rentalModel.ts';

export interface RevenueContract { monthly_price:number; commitment_months:number; signed_at:string|null }
export interface RevenueUnit {
 id:string;status:string;style:string;model_key:string;install_date:string|null;available_date:string|null;minimum_term_ends:string|null;
 current_customer_id?:string|null;future_customer_id?:string|null;monthly_price?:number|null;
 current_contract:RevenueContract|null;future_contract:RevenueContract|null;
}
const parseDay=(value:string|null|undefined)=>{
 if(!value||!/^\d{4}-\d{2}-\d{2}$/.test(value)||!Number.isFinite(Date.parse(value))||new Date(value).toISOString().slice(0,10)!==value)return null;
 const [y,m,d]=value.split('-').map(Number);return new Date(y,m-1,d);
};
const addMonths=(date:Date,count:number)=>{
 const target=new Date(date.getFullYear(),date.getMonth()+count,1);
 target.setDate(Math.min(date.getDate(),new Date(target.getFullYear(),target.getMonth()+1,0).getDate()));return target;
};
// The copied workspace contains the same signed agreement facts as the live
// inventory endpoint. Never substitute an unsigned historical contract.
function signedContract(state:RentalWorkspace|undefined,reservationId:string|null|undefined):RevenueContract|null {
 const rental=state?.lifecycle?.rentals.find(r=>r.originating_reservation_id===reservationId&&r.lifecycle_state!=='canceled'&&r.purpose!=='purchase');
 if(!rental)return null;
 const agreements=state!.lifecycle!.agreements.filter(a=>a.rental_id===rental.id&&a.signing_state==='signed'&&a.signed_on).sort((a,b)=>b.signed_on!.localeCompare(a.signed_on!));
 for(const a of agreements){
  const terms=state!.lifecycle!.terms.filter(t=>t.agreement_id===a.id&&!['voided','superseded','canceled'].includes(t.state)).sort((a,b)=>(b.effective_from||'').localeCompare(a.effective_from||''));
  const term=terms[0];if(term?.currency==='USD'&&term.base_monthly_cents!=null&&term.minimum_months!=null)return {monthly_price:term.base_monthly_cents/100,commitment_months:term.minimum_months,signed_at:a.signed_on};
 }return null;
}
export function revenueProjection(inventory:RevenueUnit[],options:{months:number;type:string;today:string;includeFuture:boolean;state?:RentalWorkspace}){
 const today=parseDay(options.today);if(!today)throw Error('A valid projection date is required.');
 const start=new Date(today.getFullYear(),today.getMonth(),1);
 const periods:{rate:number;beginning:Date;end:Date}[]=[];
 let futureIncluded=0,futureMissingDate=0,futureDateReview=0;
 const seenFuture=new Set<string>();
 for(const unit of inventory){
  if(['Sold','Pre-sold','Cancelled','Refunded'].includes(unit.status))continue;
  const category=unit.model_key==='original'?'original':unit.style==='infrared'?'infrared':'traditional';
  if(options.type!=='all'&&options.type!==category)continue;
  const add=(rate:number|null|undefined,begins:string|null,term:number,until:string|null)=>{
   const beginning=parseDay(begins),override=parseDay(until);
   if(rate==null||!Number.isFinite(rate)||rate<0||!beginning)return false;
   const end=override||(Number.isSafeInteger(term)&&term>0?addMonths(beginning,term):null);
   if(!end||end<=beginning)return false;
   periods.push({rate,beginning,end});return true;
  };
  const current=unit.current_contract?.signed_at?unit.current_contract:signedContract(options.state,unit.current_customer_id);
  const rate=current?.monthly_price??(unit.minimum_term_ends?unit.monthly_price:null);
  // An install date on an incoming unit is a planned date, not a current renter.
  if(unit.current_customer_id||unit.current_contract)add(rate,unit.install_date,current?.commitment_months||0,unit.minimum_term_ends);
  if(!options.includeFuture||!unit.future_customer_id||unit.future_customer_id===unit.current_customer_id||seenFuture.has(unit.future_customer_id))continue;
  const booking:Booking|undefined=options.state?.bookings?.find(b=>b.id===unit.future_customer_id&&b.saunaId===unit.id&&b.purpose==='rental'&&['requested','confirmed'].includes(b.state)&&b.source!=='manual_historical');
  if(!booking)continue;
  const future=unit.future_contract?.signed_at?unit.future_contract:signedContract(options.state,unit.future_customer_id);
  if(!future)continue;
  seenFuture.add(unit.future_customer_id);
  if(!parseDay(booking.installOn)){futureMissingDate++;continue;}
  if(booking.readiness?.date===false)futureDateReview++;
  if(add(future.monthly_price,booking.installOn,future.commitment_months,null))futureIncluded++;
 }
 const series=Array.from({length:options.months},(_,i)=>{
  const first=addMonths(start,i),next=addMonths(first,1);
  return {month:first.toLocaleDateString('en-US',{month:'short',year:'2-digit'}),revenue:periods.filter(p=>p.beginning<next&&p.end>first).reduce((sum,p)=>sum+p.rate,0)};
 });
 return {series,futureIncluded,futureMissingDate,futureDateReview};
}
