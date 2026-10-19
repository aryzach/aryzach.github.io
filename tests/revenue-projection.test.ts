import test from 'node:test';
import assert from 'node:assert/strict';
import { revenueProjection,type RevenueUnit } from '../src/lib/revenueProjection.ts';
import {emptyRentalWorkspace,type RentalWorkspace} from '../src/lib/rentalModel.ts';
import {emptyLifecycle} from '../src/lib/lifecycleModel.ts';
import type {Booking} from '../src/lib/bookingModel.ts';
const contract={monthly_price:300,commitment_months:3,signed_at:'2026-10-01'};
const unit:RevenueUnit={id:'u',status:'Incoming',style:'traditional',model_key:'cedar',current_customer_id:null,future_customer_id:'b',install_date:'2026-10-01',available_date:'2026-11-04',minimum_term_ends:null,current_contract:null,future_contract:contract};
const booking:Booking={id:'b',saunaId:'u',purpose:'rental',state:'requested',installOn:'2026-12-10',source:'website'} as Booking;
const workspace=():RentalWorkspace=>({...emptyRentalWorkspace(),bookings:[{...booking}]});
const options=(state=workspace())=>({months:6,type:'all',today:'2026-10-19',includeFuture:true,state});
test('future toggle uses booking installation and signed minimum, never arrival, inventory install or availability',()=>{
 assert.deepEqual(revenueProjection([unit],{...options(),includeFuture:false}).series.map(p=>p.revenue),[0,0,0,0,0,0]);
 assert.deepEqual(revenueProjection([unit],options()).series.map(p=>p.revenue),[0,0,300,300,300,300]);
 assert.equal(revenueProjection([unit],options()).futureIncluded,1);
 assert.deepEqual(revenueProjection([unit],{...options(),type:'infrared'}).series.map(p=>p.revenue),[0,0,0,0,0,0]);
});
test('future purchases, canceled bookings, unsigned contracts and stale unit pointers do not contribute',()=>{
 for(const change of [{purpose:'purchase'},{state:'cancelled'},{state:'fulfilled'},{saunaId:'other'},{source:'manual_historical'}]){
  const s=workspace();Object.assign(s.bookings![0],change);assert.equal(revenueProjection([unit],options(s)).futureIncluded,0);
 }
 assert.equal(revenueProjection([{...unit,future_contract:{...contract,signed_at:null}}],options()).futureIncluded,0);
 const s=workspace();s.bookings![0].installOn=null;const result=revenueProjection([unit],options(s));assert.equal(result.futureIncluded,0);assert.equal(result.futureMissingDate,1);
 s.bookings![0].installOn='2026-02-30';assert.equal(revenueProjection([unit],options(s)).futureIncluded,0);
});
test('current commitments keep their rate and override end date when future option changes',()=>{
 const current={...unit,current_customer_id:'current',install_date:'2026-09-01',minimum_term_ends:'2026-11-01',current_contract:{...contract,monthly_price:400}};
 assert.deepEqual(revenueProjection([current],{...options(),includeFuture:false}).series.map(p=>p.revenue),[400,0,0,0,0,0]);
 assert.deepEqual(revenueProjection([current],options()).series.map(p=>p.revenue),[400,0,300,300,300,300]);
 const crm={...current,current_contract:null,monthly_price:250};assert.equal(revenueProjection([crm],{...options(),includeFuture:false}).series[0].revenue,250);
});
test('copied workspace resolves the signed agreement without inventing unsigned contract evidence',()=>{
 const s=workspace();s.lifecycle=emptyLifecycle();
 s.lifecycle.rentals.push({id:'r',originating_reservation_id:'b',lifecycle_state:'planned',purpose:'rental'} as never);
 s.lifecycle.agreements.push({id:'a',rental_id:'r',signing_state:'signed',signed_on:'2026-10-01'} as never);
 s.lifecycle.terms.push({id:'t',rental_id:'r',agreement_id:'a',state:'planned',base_monthly_cents:50000,minimum_months:6,currency:'USD'} as never);
 const without={...unit,future_contract:null};assert.equal(revenueProjection([without],options(s)).series[2].revenue,500);
 s.lifecycle.agreements[0].signing_state='unconfirmed';assert.equal(revenueProjection([without],options(s)).futureIncluded,0);
});

test('signed bookings with date conflicts stay in the optional projection with a review warning',()=>{
 const s=workspace();s.bookings![0].readiness={agreement:true,deposit:true,photoId:true,numberedUnit:true,date:false};
 const before=JSON.stringify(s);const result=revenueProjection([unit],options(s));
 assert.equal(result.futureDateReview,1);assert.equal(result.futureIncluded,1);assert.equal(result.series[2].revenue,300);
 assert.equal(JSON.stringify(s),before);
});
