import assert from 'node:assert/strict';
import test from 'node:test';
import { customerLtv } from '../src/lib/customerLtv.ts';
import { customerDirectory,filterDirectory } from '../src/lib/customerDirectory.ts';
import {emptyLifecycle,type LifecycleTerm,type LifecycleAllocation} from '../src/lib/lifecycleModel.ts';
import {emptyRentalWorkspace,type RentalWorkspace} from '../src/lib/rentalModel.ts';
const term=(overrides:Partial<LifecycleTerm>={}):LifecycleTerm=>({id:'term',rental_id:'r',agreement_id:'agreement',state:'planned',effective_from:null,effective_until:null,minimum_months:3,commitment_start:null,base_monthly_cents:30000,extras:[{name:'Heater',amountCents:4900}],currency:'USD',sauna_type:'Indoor Infrared',source:'Contract',note:null,...overrides});
const allocation=(overrides:Partial<LifecycleAllocation>={}):LifecycleAllocation=>({id:'cash',source_id:'source',tenant_id:'tenant',customer_id:'c',rental_id:'r',sale_id:null,placement_id:null,category:'rental',amount_cents:30000,source_kind:'receipt',currency:'USD',service_from:null,service_until:null,voided_at:null,void_reason:null,...overrides});
function workspace():RentalWorkspace{return {...emptyRentalWorkspace(),customers:[{id:'c',kind:'person',name:'Customer',email:'',phone:'',archived:false,legacyReservationIds:[]}],lifecycle:{...emptyLifecycle(),rentals:[{id:'r',customer_id:'c',originating_reservation_id:null,lifecycle_state:'active',actual_start:null,actual_end:null,actual_start_source:null,version:1,history_gaps:[],service_address:null}],agreements:[{id:'agreement',rental_id:'r',contract_id:null,document_id:null,label:'Agreement',agreement_date:null,signed_on:null,signing_state:'signed',source_terms:{},owner_corrections:{}}],terms:[term()],allocations:[allocation()]}};}
test('contract minimum includes monthly add-ons, with no hypothetical renewal',()=>{
 const state=workspace();assert.equal(customerLtv(state,'c').committed,104700);
 state.lifecycle!.terms.push(term({id:'old',state:'superseded',base_monthly_cents:99999}));
 assert.equal(customerLtv(state,'c').committed,104700);
 state.lifecycle!.terms.push(term({id:'renewal',minimum_months:6,base_monthly_cents:39900,extras:[]}));
 assert.equal(customerLtv(state,'c').committed,344100);
});
test('missing amounts and unquantified early-exit agreements stay unknown; cancellations have no rental minimum',()=>{
 const state=workspace();state.lifecycle!.terms[0].base_monthly_cents=null;assert.equal(customerLtv(state,'c').committed,null);
 state.lifecycle!.terms[0]=term();state.lifecycle!.rentals[0].owner_review={additionalRentWaived:true};assert.equal(customerLtv(state,'c').committed,null);
 state.lifecycle!.rentals[0].lifecycle_state='canceled';assert.equal(customerLtv(state,'c').committed,0);
 assert.equal(customerLtv(emptyRentalWorkspace(),'c').actual,null);
});
test('actual LTV nets classified rental cash and add-ons, excludes tax, deposits, sales, duplicates and voids',()=>{
 const state=workspace();state.lifecycle!.allocations.push(
  allocation({id:'addon',category:'addon',amount_cents:4900}),
  allocation({id:'refund',source_id:'refund',source_kind:'payment_out',amount_cents:5000}),
  ...['tax','deposit','sale','delivery','other'].map(category=>allocation({id:category,category,amount_cents:100000})),
  allocation({id:'void',voided_at:'2026-01-01',amount_cents:100000}),
  allocation({id:'duplicate',source_id:'duplicate',amount_cents:100000}));
 state.lifecycle!.paymentReviews=[{customer_id:'c',tenant_id:'tenant',source_id:'duplicate',disposition:'duplicate',retained_source_id:'source',reason:'Duplicate'}];
 assert.equal(customerLtv(state,'c').actual,29900);
 state.lifecycle!.allocations.push(allocation({currency:'CAD'}));assert.equal(customerLtv(state,'c').actual,null);
});
test('signature uncertainty is visible and customer sorting uses cents, with unknowns last both ways',()=>{
 const state=workspace();state.lifecycle!.agreements[0].signing_state='unconfirmed';assert.ok(customerLtv(state,'c').commitmentNotes.length);
 for(const [id,amount] of [['low',2000],['high',10000],['unknown',null]] as const){
  state.customers.push({...state.customers[0],id,name:id});
  if(amount!==null)state.lifecycle!.allocations.push(allocation({id,customer_id:id,amount_cents:amount}));
 }
 const rows=customerDirectory(state).filter(r=>r.customer.id!=='c');
 assert.deepEqual(filterDirectory(rows,'',{},false,'actual',false).map(r=>r.customer.id),['low','high','unknown']);
 assert.deepEqual(filterDirectory(rows,'',{},false,'actual',true).map(r=>r.customer.id),['high','low','unknown']);
 assert.deepEqual(filterDirectory(rows,'',{actual:'100.00'},false,'name',false).map(r=>r.customer.id),['high']);
});
