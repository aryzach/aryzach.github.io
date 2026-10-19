import type {RentalWorkspace} from './rentalModel.ts';
import {acquisitionMetrics,type AcquisitionSources} from './acquisitionMetrics.ts';
import {actualAsOf} from './ltvTimeline.ts';
/** Calendar-period cash comparison, not cohort lifetime profit or a customer allocation. */
export function customerEconomics(state:RentalWorkspace,sources:AcquisitionSources,options:{from:string;to:string;asOf:string}){
 const acquisition=acquisitionMetrics(state,sources,options);
 const from=options.from+'-01',last=new Date(Date.UTC(Number(options.to.slice(0,4)),Number(options.to.slice(5,7)),0)).toISOString().slice(0,10);
 const to=last<options.asOf?last:options.asOf;
 const before=new Date(Date.parse(from)-86400000).toISOString().slice(0,10);
 const expenses=sources.logistics?.expenses.filter(e=>e.date>=from&&e.date<=to)||[];
 const expenseIssues=sources.logistics?.issues||[];
 const logistics=sources.logistics?.complete&&expenseIssues.length===0?expenses.reduce((n,e)=>n+e.amount,0):null;
 const spend=acquisition.points.reduce((n,p)=>n+p.spend,0),newCustomers=acquisition.points.reduce((n,p)=>n+p.customers,0);
 const customers=acquisition.customers.filter(c=>c.installedOn<=to);
 const coverage=customers.map(c=>{const end=actualAsOf(state,sources.payments,c.id,to),start=actualAsOf(state,sources.payments,c.id,before);return {id:c.id,name:c.name,value:end.value!==null&&start.value!==null?end.value-start.value:null,reason:end.value===null?end.reason:start.reason};});
 const rentalCash=coverage.every(c=>c.value!==null)?coverage.reduce((n,c)=>n+c.value!,0):null;
 return {from,to,expenses,expenseIssues,spend,newCustomers,rentalCash,logistics,
  cac:newCustomers?spend/newCustomers:null,logisticsPerInstall:logistics!==null&&newCustomers?logistics/newCustomers:null,
  acquisitionAndLogisticsPerInstall:logistics!==null&&newCustomers?(spend+logistics)/newCustomers:null,
  cashLessKnownCosts:rentalCash!==null&&logistics!==null&&sources.issues.length===0?rentalCash-spend-logistics:null,
  cashCustomers:customers.length,coverageGaps:coverage.filter(c=>c.value===null),unknownDates:acquisition.unknown,
  acquisitionIssues:acquisition.issues,taggedExpenseLines:expenses.filter(e=>e.saunaCodes.length===1).length};
}
