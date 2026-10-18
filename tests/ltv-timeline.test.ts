import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { ltvTimeline,latestInstalledType,normalizeSaunaType,pacificToday,type LtvSources } from '../src/lib/ltvTimeline.ts';
import {emptyLifecycle,type LifecycleAllocation,type LifecycleTerm}from'../src/lib/lifecycleModel.ts';
import {emptyRentalWorkspace,type RentalWorkspace}from'../src/lib/rentalModel.ts';
const term=(x:Partial<LifecycleTerm>={}):LifecycleTerm=>({id:'term',rental_id:'r',agreement_id:'a',state:'planned',effective_from:'2026-01-01',effective_until:null,minimum_months:3,commitment_start:null,base_monthly_cents:30000,extras:[],currency:'USD',sauna_type:'Indoor Infrared',source:'Contract',note:null,...x});
const allocation=(x:Partial<LifecycleAllocation>={}):LifecycleAllocation=>({id:'allocation',source_id:'p',tenant_id:'t',customer_id:'c',rental_id:'r',sale_id:null,placement_id:null,category:'rental',amount_cents:30000,source_kind:'receipt',currency:'USD',service_from:null,service_until:null,voided_at:null,void_reason:null,...x});
function fixture():{state:RentalWorkspace;sources:LtvSources}{return {state:{...emptyRentalWorkspace(),customers:[{id:'c',name:'Customer',email:'',phone:'',kind:'person',archived:false,legacyReservationIds:[]}],xeroLinks:[{tenantId:'t',contactId:'x',customerId:'c',name:'Customer'}],lifecycle:{...emptyLifecycle(),rentals:[{id:'r',customer_id:'c',originating_reservation_id:null,purpose:'rental',lifecycle_state:'active',actual_start:'2026-01-01',actual_end:null,actual_start_source:'owner',version:1,history_gaps:[],service_address:null}],agreements:[{id:'a',rental_id:'r',contract_id:null,document_id:null,label:'Agreement',agreement_date:null,signed_on:'2026-01-01',signing_state:'signed',source_terms:{},owner_corrections:{}}],terms:[term()],allocations:[allocation()]}},sources:{contacts:[{tenantId:'t',contactId:'x',complete:true,snapshotAt:'2026-04-01T00:00:00Z'}],payments:[{tenantId:'t',contactId:'x',id:'p',date:'2026-01-15',status:'AUTHORISED',type:'RECEIVE',currency:'USD',amountCents:30000,hasRentalLines:true}]}};}
const options={from:'2026-01-01',to:'2026-03-31',today:'2026-04-15'};
test('month-end lifetime cash uses source dates, nets refunds, excludes duplicates and preserves lifetime cash outside displayed range',()=>{
 const {state,sources}=fixture();state.lifecycle!.allocations.push(allocation({id:'refund',source_id:'refund',source_kind:'payment_out',amount_cents:5000}),allocation({id:'dup',source_id:'dup',amount_cents:30000}));
 sources.payments.push({...sources.payments[0],id:'refund',date:'2026-02-02',type:'SPEND',amountCents:5000},{...sources.payments[0],id:'dup',date:'2026-03-01'});
 state.lifecycle!.paymentReviews=[{customer_id:'c',tenant_id:'t',source_id:'dup',disposition:'duplicate',retained_source_id:'p',reason:'Owner confirmed'}];
 const chart=ltvTimeline(state,sources,options);assert.deepEqual(chart.points.map(p=>p.actual),[300,250,250]);assert.deepEqual(chart.points.map(p=>p.committed),[900,900,900]);
 assert.equal(ltvTimeline(state,sources,{...options,from:'2026-03-01'}).points[0].actual,250);
 sources.payments[0].date='2026-02-01';assert.equal(ltvTimeline(state,sources,options).points[0].actual,0);
});
test('future renewal cannot leak into earlier points; each customer counts once across rentals and renewals',()=>{
 const {state,sources}=fixture();state.lifecycle!.agreements.push({...state.lifecycle!.agreements[0],id:'renewal',signed_on:'2026-03-05'});state.lifecycle!.terms.push(term({id:'renewal-term',agreement_id:'renewal',effective_from:'2026-04-01',minimum_months:6,base_monthly_cents:20000}));
 const chart=ltvTimeline(state,sources,options);assert.deepEqual(chart.points.map(p=>p.committed),[900,900,2100]);assert.deepEqual(chart.points.map(p=>p.customers),[1,1,1]);
 state.lifecycle!.rentals.push({...state.lifecycle!.rentals[0],id:'r2',actual_start:'2026-03-01'});state.lifecycle!.terms.push(term({id:'second',rental_id:'r2',agreement_id:null,effective_from:'2026-03-01'}));assert.equal(ltvTimeline(state,sources,options).points.at(-1)!.customers,1);
});
test('past renters and archived profiles count; waiting, canceled, never-installed and purchase bookings do not',()=>{
 const {state,sources}=fixture();state.customers[0].archived=true;state.lifecycle!.rentals[0].lifecycle_state='ended';state.lifecycle!.rentals[0].actual_end='2026-02-01';assert.equal(ltvTimeline(state,sources,options).points.at(-1)!.eligible,1);
 for(const patch of [{actual_start:null},{purpose:'purchase' as const},{lifecycle_state:'canceled' as const},{owner_review:{neverInstalled:true}}]){
 const s=structuredClone(state);Object.assign(s.lifecycle!.rentals[0],patch);assert.equal(ltvTimeline(s,sources,options).points.at(-1)!.eligible,0);}
});
test('unknown commitment or incomplete cash excludes from both averages; full imported zero cash is zero',()=>{
 const {state,sources}=fixture();state.lifecycle!.terms[0].minimum_months=null;let chart=ltvTimeline(state,sources,options);assert.equal(chart.points[0].committed,null);assert.equal(chart.points[0].actual,null);assert.equal(chart.gaps.length,1);
 state.lifecycle!.terms[0].minimum_months=3;sources.contacts[0].complete=false;chart=ltvTimeline(state,sources,options);assert.equal(chart.points[0].customers,0);
 sources.contacts[0].complete=true;state.lifecycle!.allocations=[];sources.payments=[];chart=ltvTimeline(state,sources,options);assert.equal(chart.points[0].actual,0);assert.equal(chart.points[0].committed,900);
});
test('unclassified rental money, wrong contact, unsupported currency or direction never creates a complete average',()=>{
 for(const change of ['partial','link','currency','direction','date']){
 const {state,sources}=fixture();if(change==='partial')sources.payments[0].amountCents=40000;if(change==='link')sources.payments[0].contactId='other';if(change==='currency')sources.payments[0].currency='CAD';if(change==='direction')sources.payments[0].type='INVALID';if(change==='date')sources.payments[0].date='2026-02-30';
 assert.equal(ltvTimeline(state,sources,options).points.at(-1)!.customers,0,change);}
});
test('future cash excluded; voided/deleted source and voided allocations do not count',()=>{
 const {state,sources}=fixture();sources.payments[0].date='2026-04-01';assert.equal(ltvTimeline(state,sources,options).points.at(-1)!.actual,0);
 sources.payments[0].date='2026-01-15';sources.payments[0].status='DELETED';assert.equal(ltvTimeline(state,sources,options).points[0].actual,0);
 sources.payments[0].status='AUTHORISED';state.lifecycle!.allocations[0].voided_at='2026-01-16';sources.payments[0].hasRentalLines=false;assert.equal(ltvTimeline(state,sources,options).points[0].actual,0);
});
test('sauna type follows latest recorded installation, including swaps, rather than current inventory',()=>{
 const {state,sources}=fixture();state.assets=[{id:'unit',code:'001',model:'',typeName:'Outdoor Traditional'}];state.lifecycle!.terms.push(term({id:'later',effective_from:'2026-03-01',agreement_id:null,sauna_type:'Outdoor Traditional'}));assert.equal(latestInstalledType(state,'c'),'Outdoor Traditional');assert.equal(ltvTimeline(state,sources,{...options,types:['Outdoor Traditional']}).points[0].eligible,1);
 state.lifecycle!.placements.push({id:'placement',rental_id:'r',asset_id:'unit',installed_on:'2026-01-01',removed_on:null,type_at_install:'Indoor Traditional (Original Collection)',address:null,evidence:'owner'});assert.equal(latestInstalledType(state,'c'),'Indoor Traditional');
 assert.equal(normalizeSaunaType('Indoor steam → Outdoor Traditional'),'Outdoor Traditional');
});
test('an early-exit waiver preserves the original commitment before and after return',()=>{
 const {state,sources}=fixture();Object.assign(state.lifecycle!.rentals[0],{actual_end:'2026-02-10',lifecycle_state:'ended',owner_review:{additionalRentWaived:true}});const chart=ltvTimeline(state,sources,options);assert.equal(chart.points[0].committed,900);assert.equal(chart.points[1].committed,900);
});
test('undated agreements use installation visibly; partial endpoint and invalid ranges are explicit',()=>{
 const {state,sources}=fixture();state.lifecycle!.agreements[0].signed_on=null;state.lifecycle!.agreements[0].signing_state='unconfirmed';state.lifecycle!.terms[0].effective_from=null;
 const chart=ltvTimeline(state,sources,{...options,to:'2026-03-15'});assert.equal(chart.points[0].estimatedDates,1);assert.equal(chart.points[0].unverifiedTerms,1);assert.equal(chart.points.at(-1)!.partial,true);assert.equal(chart.points.at(-1)!.date,'2026-03-15');
 assert.throws(()=>ltvTimeline(state,sources,{...options,to:'2026-05-01'}),/valid date/);assert.throws(()=>ltvTimeline(state,sources,{...options,from:'2026-02-30'}),/valid date/);
 assert.equal(pacificToday(new Date('2026-10-18T01:00:00Z')),'2026-10-17');
});
test('source metadata endpoint remains behind existing admin password check and returns no documents or tokens',()=>{
 const api=readFileSync(new URL('../supabase/functions/admin-api/index.ts',import.meta.url),'utf8');assert.ok(api.indexOf('provided !== adminPassword')<api.indexOf('case "ltv_sources"'));
 const helper=readFileSync(new URL('../supabase/functions/_shared/ltvSources.ts',import.meta.url),'utf8');assert.match(helper,/eq\('tenant_id',SYNC_TENANT\)/);assert.doesNotMatch(helper,/\.insert\(|\.update\(|fetch\(/);
});
