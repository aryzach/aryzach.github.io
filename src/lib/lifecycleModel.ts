export interface LifecycleRental { id:string; customer_id:string; originating_reservation_id:string|null; lifecycle_state:'unconfirmed'|'planned'|'active'|'ended'|'canceled'; actual_start:string|null; actual_end:string|null; actual_start_source:string|null; actual_start_evidence?:Record<string,unknown>; version:number; history_gaps:string[]; service_address:string|null; }
export interface LifecycleAgreement { id:string;rental_id:string;contract_id:string|null;document_id:string|null;label:string;agreement_date:string|null;signed_on:string|null;signing_state:string;source_terms:Record<string,unknown>;owner_corrections:Record<string,unknown>;local_url?:string; }
export interface LifecycleTerm { id:string;rental_id:string;agreement_id:string|null;state:string;effective_from:string|null;effective_until:string|null;minimum_months:number|null;commitment_start:string|null;base_monthly_cents:number|null;extras:{name:string;amountCents:number}[];currency:string;sauna_type:string|null;source:string;note:string|null; }
export interface LifecyclePlacement {id:string;rental_id:string;asset_id:string;installed_on:string;removed_on:string|null;type_at_install:string;address:string|null;evidence:string;}
export interface LifecycleSale {id:string;asset_id:string;customer_id:string;rental_id:string|null;sold_on:string;agreed_cents:number|null;currency:string;note:string|null;}
export interface LifecycleSettlement {id:string;rental_id:string;settled_on:string;kind:string;amount_cents:number;reason:string;supersedes_id:string|null;}
export interface LifecycleEvent {id:string;rental_id:string|null;asset_id:string|null;event_type:string;occurred_on:string|null;detail:Record<string,unknown>;created_at:string;}
export interface LifecycleDocument {id:string;filename:string;sha256:string;incomplete:boolean;byte_size:number;local_url?:string;}
export interface LifecycleAllocation {id:string;source_id:string;tenant_id:string;customer_id:string;rental_id:string|null;sale_id:string|null;placement_id:string|null;category:string;amount_cents:number;source_kind:string;currency:string;service_from:string|null;service_until:string|null;voided_at:string|null;void_reason:string|null;}
export interface LifecycleWorkspace {rentals:LifecycleRental[];agreements:LifecycleAgreement[];terms:LifecycleTerm[];placements:LifecyclePlacement[];sales:LifecycleSale[];settlements:LifecycleSettlement[];events:LifecycleEvent[];documents:LifecycleDocument[];allocations:LifecycleAllocation[];}
export type LifecycleCommand=(operation:string,payload:Record<string,unknown>)=>Promise<void>;
export const emptyLifecycle=():LifecycleWorkspace=>({rentals:[],agreements:[],terms:[],placements:[],sales:[],settlements:[],events:[],documents:[],allocations:[]});
export function centsInput(value:string):number {
 if(!/^\d+(?:\.\d{1,2})?$/.test(value.trim()))throw new Error('Enter an amount with at most two decimal places.');
 const [whole,fraction='']=value.trim().split('.');const result=Number(whole)*100+Number(fraction.padEnd(2,'0'));
 if(!Number.isSafeInteger(result))throw new Error('Amount is too large.');return result;
}
export function displayMoney(cents:number|null,currency='USD'):string {return cents===null?'Unknown':new Intl.NumberFormat('en-US',{style:'currency',currency}).format(cents/100);}
export function earliestSubscriptionReceipt(transactions:{id:string;contactId:string;date:string;type:string;status:string;accountNames:string[];amount:string;lines?:{accountName:string;amount:string}[]}[],contactIds:string[]) {
 const ids=new Set(contactIds);
 return transactions.filter(t=>ids.has(t.contactId)&&t.type==='RECEIVE'&&t.status==='AUTHORISED'&&Number(t.amount)>0&&
  (t.lines?.some(l=>l.accountName.trim().toLowerCase()==='subscription revenue'&&Number(l.amount)>0)||!t.lines?.length&&t.accountNames.some(n=>n.trim().toLowerCase()==='subscription revenue')))
  .sort((a,b)=>a.date.localeCompare(b.date)||a.id.localeCompare(b.id))[0]||null;
}
