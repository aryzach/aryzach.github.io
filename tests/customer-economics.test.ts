import test from 'node:test';
import assert from 'node:assert/strict';
import {acquisitionSources} from '../src/lib/acquisitionMetrics.ts';
import {customerEconomics} from '../src/lib/customerEconomics.ts';
import {emptyRentalWorkspace} from '../src/lib/rentalModel.ts';
import {emptyLifecycle} from '../src/lib/lifecycleModel.ts';
function fixture(){
 const state={...emptyRentalWorkspace(),lifecycle:emptyLifecycle(),xeroLinks:[{customerId:'c',tenantId:'t',contactId:'x',name:'Customer'}]};
 state.customers=[{id:'c',name:'Customer',email:'',phone:'',kind:'person' as const,archived:false,legacyReservationIds:[]}];
 state.lifecycle.rentals=[{id:'r',customer_id:'c',purpose:'rental',lifecycle_state:'active',actual_start:'2026-01-01',actual_start_source:'owner',actual_end:null,originating_reservation_id:null,version:1,history_gaps:[],service_address:null}];
 const bank=(id:string,code:string,amount:number,type='SPEND',tax=0)=>({BankTransactionID:id,Contact:{Name:'Vendor'},DateString:'2026-01-05',Type:type,CurrencyCode:'USD',Status:'AUTHORISED',LineAmountTypes:'Inclusive',LineItems:[{AccountCode:code,LineAmount:amount,TaxAmount:tax}]});
 const sources=acquisitionSources([bank('ad','6000',100),bank('log','876',220,'SPEND',20),bank('refund','876',20,'RECEIVE'),bank('asset','540',1000)],'2026-03-01',{contacts:[{tenantId:'t',contactId:'x',complete:true,snapshotAt:'2026-03-01'}],payments:[]});
 for(const [id,date,amount,kind,category] of [['before','2025-12-31',30000,'receipt','rental'],['cash','2026-01-06',60000,'receipt','rental'],['refund','2026-01-10',5000,'payment_out','rental'],['deposit','2026-01-11',20000,'receipt','deposit']] as const){
  sources.payments.payments.push({id,tenantId:'t',contactId:'x',date,amountCents:amount,status:'AUTHORISED',currency:'USD',type:kind==='receipt'?'RECEIVE':'SPEND',hasRentalLines:category==='rental'});
  state.lifecycle.allocations.push({id,source_id:id,tenant_id:'t',customer_id:'c',rental_id:'r',sale_id:null,placement_id:null,category,amount_cents:amount,source_kind:kind,currency:'USD',service_from:null,service_until:null,voided_at:null,void_reason:null});
 }
 return {state,sources};
}
const options={from:'2026-01',to:'2026-01',asOf:'2026-03-01'};
test('economics keeps acquisition and logistics separate, nets expense refunds and excludes asset purchase costs',()=>{
 const {state,sources}=fixture();const d=customerEconomics(state,sources,options);
 assert.equal(d.spend,10000);assert.equal(d.logistics,20000);assert.equal(d.cac,10000);assert.equal(d.logisticsPerInstall,20000);assert.equal(d.acquisitionAndLogisticsPerInstall,30000);
 assert.equal(d.rentalCash,55000);assert.equal(d.cashLessKnownCosts,25000);assert.equal(d.expenses.length,2);
});
test('cash comparison uses calendar-period collections, not lifetime cash; no installations does not erase costs',()=>{
 const {state,sources}=fixture();state.lifecycle.rentals[0].actual_start='2025-12-01';
 const d=customerEconomics(state,sources,options);assert.equal(d.rentalCash,55000);assert.equal(d.newCustomers,0);assert.equal(d.logisticsPerInstall,null);assert.equal(d.acquisitionAndLogisticsPerInstall,null);assert.equal(d.cashLessKnownCosts,25000);
});
test('missing expense snapshots, incomplete payment coverage and unsupported expense currencies stay unknown',()=>{
 const {state,sources}=fixture();delete sources.logistics;assert.equal(customerEconomics(state,sources,options).logistics,null);assert.equal(customerEconomics(state,sources,options).cashLessKnownCosts,null);
 const next=fixture();next.sources.payments.contacts[0].complete=false;assert.equal(customerEconomics(next.state,next.sources,options).rentalCash,null);
 next.sources.logistics!.issues.push({sourceId:'fx',reason:'Currency review'});assert.equal(customerEconomics(next.state,next.sources,options).logistics,null);
});
test('source costs reject voided and unsupported currency facts without creating optimistic zero totals',()=>{
 const records=[{BankTransactionID:'bad',Contact:{Name:'Vendor'},DateString:'2026-01-05',Type:'SPEND',CurrencyCode:'CAD',Status:'AUTHORISED',LineItems:[{AccountCode:'876',LineAmount:100}]}];
 const s=acquisitionSources(records,null,{contacts:[],payments:[]});assert.equal(s.logistics!.expenses.length,0);assert.equal(s.logistics!.issues.length,1);assert.equal(s.expenses.length,0);
});
