import type {RentalWorkspace} from './rentalModel.ts';
import {actualAsOf,commitmentAsOf,latestInstalledType,type LtvSources} from './ltvTimeline.ts';
import {acquisitionCategory} from './acquisitionRules.ts';
import {recoverySources} from './saunaRecovery.ts';
export interface AcquisitionExpense {id:string;sourceId:string;date:string;payee:string;description:string;category:string;amount:number;}
export interface AcquisitionSources {snapshotAt:string|null;expenses:AcquisitionExpense[];payments:LtvSources;issues:{sourceId:string;reason:string}[];}
export function acquisitionSources(records:Record<string,unknown>[],snapshotAt:string|null,payments:LtvSources):AcquisitionSources {
 const result:AcquisitionSources={snapshotAt,expenses:[],payments,issues:[]};
 const byId=new Map(records.map(r=>[String(r.BankTransactionID),r]));const seen=new Set<string>();
 for(const t of recoverySources(records,snapshotAt).transactions){
  if(seen.has(t.id))continue;seen.add(t.id);
  const payee=String((byId.get(t.id)?.Contact as {Name?:string}|undefined)?.Name||'Unknown payee');
  for(const [i,l] of t.lines.entries()){
   const category=acquisitionCategory(l.account,payee);if(!category)continue;
   if(t.currency!=='USD'||!validDay(t.date)){result.issues.push({sourceId:t.id,reason:'Acquisition expense needs currency or date review.'});continue;}
   result.expenses.push({id:`${t.id}:${l.id}:${i}`,sourceId:t.id,date:t.date,payee,description:l.description,category,amount:l.gross*(t.direction==='SPEND'?1:-1)});
  }
 }
 return result;
}
const validDay=(d:unknown):d is string=>typeof d==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(d)&&Number.isFinite(Date.parse(d))&&new Date(d).toISOString().slice(0,10)===d;
const monthEnd=(month:string)=>{const [y,m]=month.split('-').map(Number);return new Date(Date.UTC(y,m,0)).toISOString().slice(0,10);};
export function addCalendarMonths(date:string,count:number){const [y,m,d]=date.split('-').map(Number);const x=new Date(Date.UTC(y,m-1+count,1));x.setUTCDate(Math.min(d,new Date(Date.UTC(x.getUTCFullYear(),x.getUTCMonth()+1,0)).getUTCDate()));return x.toISOString().slice(0,10);}
const priorDay=(d:string)=>new Date(Date.parse(d)-86400000).toISOString().slice(0,10);
export interface AcquiredCustomer {id:string;name:string;installedOn:string;type:string;estimatedDate:boolean;}
export interface AcquisitionPoint {month:string;spend:number;customers:number;allCustomers:number;cac:number|null;rollingCac:number|null;rollingSpend:number;rollingCustomers:number;partial:boolean;estimatedDates:number;committed:number|null;committedKnown:number;committedRatio:number|null;actual:number|null;actualKnown:number;actualRatio:number|null;ageActual:Record<number,number|null>;ageRatios:Record<number,number|null>;mature:Record<number,number>;}
export function acquisitionMetrics(state:RentalWorkspace,sources:AcquisitionSources,options:{from:string;to:string;asOf:string;type?:string}){
 const {from,to,asOf}=options;const monthValid=(v:string)=>/^\d{4}-(0[1-9]|1[0-2])$/.test(v);
 if(!monthValid(from)||!monthValid(to)||from>to||!validDay(asOf)||to>asOf.slice(0,7)||Number(to.slice(0,4))-Number(from.slice(0,4))>30)throw Error('Choose a valid month range ending this month or earlier (up to 30 years).');
 const rentals=(state.lifecycle?.rentals||[]).filter(r=>r.purpose!=='purchase'&&r.lifecycle_state!=='canceled'&&r.owner_review?.neverInstalled!==true);
 const eligible=rentals.filter(r=>['active','ended'].includes(r.lifecycle_state));
 const unknown=state.customers.filter(c=>eligible.some(r=>r.customer_id===c.id)&&!eligible.some(r=>r.customer_id===c.id&&validDay(r.actual_start)&&r.actual_start<=asOf)).map(c=>({id:c.id,name:c.name,reason:'First rental installation date is missing or in the future.'}));
 const customers:AcquiredCustomer[]=state.customers.flatMap(c=>{
  const rows=eligible.filter(r=>r.customer_id===c.id&&validDay(r.actual_start)&&r.actual_start!<=asOf).sort((a,b)=>a.actual_start!.localeCompare(b.actual_start!));
  if(!rows.length)return [];
  // An undated earlier rental could change the true acquisition month. Do not
  // silently count a later return/renewal as this customer's first acquisition.
  if(eligible.some(r=>r.customer_id===c.id&&!validDay(r.actual_start))){unknown.push({id:c.id,name:c.name,reason:'Another historical rental has no installation date; first acquisition needs review.'});return [];}
  const r=rows[0];return [{id:c.id,name:c.name,installedOn:r.actual_start!,type:latestInstalledType(state,c.id),estimatedDate:/xero|proxy|first.*receipt|payment/i.test(r.actual_start_source||'')}];
 });
 const chosen=customers.filter(c=>!options.type||options.type==='all'||c.type===options.type);
 const expenses=sources.expenses.filter(e=>e.date<=asOf);
 const firstEvidence=[...customers.map(c=>c.installedOn.slice(0,7)),...expenses.map(e=>e.date.slice(0,7))].sort()[0]||from;
 const chartStart=from<firstEvidence?from:firstEvidence;const points:AcquisitionPoint[]=[];
 const memo=new Map<string,ReturnType<typeof actualAsOf>>();const cash=(id:string,cutoff:string)=>{const key=id+cutoff;if(!memo.has(key))memo.set(key,actualAsOf(state,sources.payments,id,cutoff));return memo.get(key)!;};
 for(let month=chartStart;month<=to;month=addCalendarMonths(month+'-01',1).slice(0,7)){
  const all=customers.filter(c=>c.installedOn.startsWith(month)),group=chosen.filter(c=>c.installedOn.startsWith(month));
  const totalSpend=expenses.filter(e=>e.date.startsWith(month)).reduce((n,e)=>n+e.amount,0);
  // Shared spend is allocated proportionally, never left entirely in a filtered
  // type's numerator. This estimate intentionally does not claim channel attribution.
  const spend=options.type&&options.type!=='all'?(all.length?totalSpend*group.length/all.length:0):totalSpend;
  const cac=group.length&&spend>=0?spend/group.length:null;
  const start=addCalendarMonths(month+'-01',-2).slice(0,7);
  const rollAll=customers.filter(c=>c.installedOn.slice(0,7)>=start&&c.installedOn.slice(0,7)<=month);
  const rollChosen=chosen.filter(c=>c.installedOn.slice(0,7)>=start&&c.installedOn.slice(0,7)<=month);
  const fullRolling=expenses.filter(e=>e.date.slice(0,7)>=start&&e.date.slice(0,7)<=month).reduce((n,e)=>n+e.amount,0);
  const rollingSpend=options.type&&options.type!=='all'?(rollAll.length?fullRolling*rollChosen.length/rollAll.length:0):fullRolling;
  const commitments=group.map(c=>commitmentAsOf(state,c.id,monthEnd(month)<asOf?monthEnd(month):asOf));
  const actual=group.map(c=>cash(c.id,asOf));
  const sum=(values:(number|null)[])=>values.length&&values.every(v=>v!==null)?values.reduce<number>((n,v)=>n+v!,0):null;
  const committedTotal=sum(commitments.map(v=>v.value)),actualTotal=sum(actual.map(v=>v.value));
  const ageActual:Record<number,number|null>={},ageRatios:Record<number,number|null>={},mature:Record<number,number>={};
  for(const age of [3,6,12]){
   mature[age]=group.filter(c=>addCalendarMonths(c.installedOn,age)<=asOf).length;
   const total=mature[age]===group.length?sum(group.map(c=>cash(c.id,priorDay(addCalendarMonths(c.installedOn,age))).value)):null;
   ageActual[age]=total;
   ageRatios[age]=total!==null&&spend>0?total/spend:null;
  }
  points.push({month,spend,customers:group.length,allCustomers:all.length,cac,rollingCac:start>=firstEvidence&&rollChosen.length&&rollingSpend>=0?rollingSpend/rollChosen.length:null,rollingSpend,rollingCustomers:rollChosen.length,partial:month===asOf.slice(0,7),estimatedDates:group.filter(c=>c.estimatedDate).length,committed:committedTotal===null?null:committedTotal/group.length,committedKnown:commitments.filter(v=>v.value!==null).length,committedRatio:committedTotal!==null&&spend>0?committedTotal/spend:null,actual:actualTotal===null?null:actualTotal/group.length,actualKnown:actual.filter(v=>v.value!==null).length,actualRatio:actualTotal!==null&&spend>0?actualTotal/spend:null,ageActual,ageRatios,mature});
 }
 return {points:points.filter(p=>p.month>=from),customers:chosen,unknown,types:[...new Set(customers.map(c=>c.type))].sort(),expenses:expenses.filter(e=>e.date.slice(0,7)>=from&&e.date.slice(0,7)<=to),issues:sources.issues,firstEvidence};
}

/** Pool matching groups and their spending; never average monthly ratios or drop missing cash. */
export function acquisitionRatioSummary(points:AcquisitionPoint[],age:'today'|3|6|12,asOf:string){
 const included=points.filter(p=>age==='today'||(p.customers>0?p.mature[age]===p.customers:addCalendarMonths(monthEnd(p.month),age)<=asOf));
 const waiting=points.filter(p=>!included.includes(p));
 const customers=included.reduce((n,p)=>n+p.customers,0);
 const spend=included.reduce((n,p)=>n+p.spend,0);
 const committedKnown=included.reduce((n,p)=>n+p.committedKnown,0);
 const committed=customers>0&&committedKnown===customers?included.reduce((n,p)=>n+(p.committed||0)*p.customers,0):null;
 const values=included.filter(p=>p.customers>0).map(p=>age==='today'?p.actual===null?null:p.actual*p.customers:p.ageActual[age]);
 const actual=customers>0&&values.every(v=>v!==null&&v!==undefined)?values.reduce<number>((n,v)=>n+v!,0):null;
 return {customers,spend,committed,actual,committedKnown,cac:customers>0&&spend>=0?spend/customers:null,
  committedRatio:committed!==null&&spend>0?committed/spend:null,actualRatio:actual!==null&&spend>0?actual/spend:null,
  from:included[0]?.month,to:included.at(-1)?.month,waitingCustomers:waiting.reduce((n,p)=>n+p.customers,0),waitingMonths:waiting.length,
  missingCashGroups:included.filter(p=>p.customers>0&&(age==='today'?p.actual===null:p.ageActual[age]==null)).length};
}
