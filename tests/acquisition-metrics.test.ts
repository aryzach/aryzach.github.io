import test from 'node:test';
import assert from 'node:assert/strict';
import {acquisitionMetrics,acquisitionRatioSummary,acquisitionSources,addCalendarMonths,type AcquisitionSources} from '../src/lib/acquisitionMetrics.ts';
import {emptyRentalWorkspace} from '../src/lib/rentalModel.ts';
import {emptyLifecycle} from '../src/lib/lifecycleModel.ts';
function fixture(){
 const state={...emptyRentalWorkspace(),lifecycle:emptyLifecycle(),xeroLinks:[{customerId:'a',tenantId:'t',contactId:'x',name:'A'},{customerId:'b',tenantId:'t',contactId:'y',name:'B'}]};
 state.customers=['a','b'].map(id=>({id,name:id,email:'',phone:'',kind:'person' as const,archived:false,legacyReservationIds:[]}));
 state.lifecycle.rentals=['a','b'].map((id,i)=>({id:'r'+id,customer_id:id,purpose:'rental',lifecycle_state:'active',actual_start:i?'2026-03-15':'2026-01-01',actual_start_source:'owner',actual_end:null,originating_reservation_id:null,version:1,history_gaps:[],service_address:null}));
 for(const id of ['a','b']){
  state.lifecycle.agreements.push({id:'g'+id,rental_id:'r'+id,contract_id:null,document_id:null,label:'original',agreement_date:null,signed_on:id==='a'?'2026-01-01':'2026-03-15',signing_state:'signed',source_terms:{},owner_corrections:{}});
  state.lifecycle.terms.push({id:'term'+id,rental_id:'r'+id,agreement_id:'g'+id,state:'active',effective_from:id==='a'?'2026-01-01':'2026-03-15',effective_until:null,minimum_months:3,commitment_start:null,base_monthly_cents:30000,extras:[],currency:'USD',sauna_type:id==='a'?'Indoor Infrared':'Outdoor Traditional',source:'contract',note:null});
 }
 const sources:AcquisitionSources={snapshotAt:'2026-07-01',expenses:[['2026-01-01',10000],['2026-02-01',50000],['2026-03-01',30000]].map(([date,amount],i)=>({id:String(i),sourceId:String(i),date:String(date),amount:Number(amount),description:'',payee:'Ad provider',category:'Advertising'})),payments:{contacts:[{tenantId:'t',contactId:'x',complete:true,snapshotAt:'2026-07-01'},{tenantId:'t',contactId:'y',complete:true,snapshotAt:'2026-07-01'}],payments:[]},issues:[]};
 return {state,sources};
}
const options={from:'2026-01',to:'2026-03',asOf:'2026-07-01'};
test('CAC uses first rental installation once, excludes purchases/cancellations and nets refund expenses',()=>{
 const {state,sources}=fixture();state.lifecycle.rentals.push({...state.lifecycle.rentals[0],id:'repeat',actual_start:'2026-03-01'});
 sources.expenses.push({...sources.expenses[0],id:'refund',amount:-2000});
 const before=JSON.stringify(state);const r=acquisitionMetrics(state,sources,options);
 assert.equal(r.points[0].cac,8000);assert.equal(r.points[1].cac,null);assert.equal(r.points[2].customers,1);assert.equal(r.customers.length,2);assert.equal(JSON.stringify(state),before);
 state.lifecycle.rentals[1].purpose='purchase';assert.equal(acquisitionMetrics(state,sources,options).customers.length,1);
});
test('rolling CAC divides total spend by total new customers, includes zero-install months and full lookback outside selected range',()=>{
 const {state,sources}=fixture();const p=acquisitionMetrics(state,sources,{...options,from:'2026-03'}).points[0];
 assert.equal(p.rollingSpend,90000);assert.equal(p.rollingCustomers,2);assert.equal(p.rollingCac,45000);
 assert.equal(acquisitionMetrics(state,sources,options).points[0].rollingCac,null);
});
test('fixed-age ratios wait for every customer; cash counts pre-install rent but excludes next anniversary',()=>{
 const {state,sources}=fixture();state.lifecycle.rentals[1].actual_start='2026-01-31';state.lifecycle.agreements[1].signed_on='2026-01-31';state.lifecycle.terms[1].effective_from='2026-01-31';
 for(const [customerId,contactId,id,date] of [['a','x','p1','2025-12-30'],['b','y','p2','2026-01-30'],['a','x','next','2026-04-01']]){
  sources.payments.payments.push({tenantId:'t',contactId,id,date,status:'AUTHORISED',type:'RECEIVE',currency:'USD',amountCents:30000,hasRentalLines:true});
  state.lifecycle.allocations.push({id,source_id:id,tenant_id:'t',customer_id:customerId,rental_id:'r'+customerId,sale_id:null,placement_id:null,category:'rental',amount_cents:30000,source_kind:'receipt',currency:'USD',service_from:null,service_until:null,voided_at:null,void_reason:null});
 }
 let p=acquisitionMetrics(state,sources,{from:'2026-01',to:'2026-01',asOf:'2026-04-15'}).points[0];assert.equal(p.mature[3],1);assert.equal(p.ageRatios[3],null);
 p=acquisitionMetrics(state,sources,{from:'2026-01',to:'2026-01',asOf:'2026-05-01'}).points[0];assert.equal(p.ageRatios[3],6);assert.equal(p.actualRatio,9);assert.equal(p.committedRatio,18);
});
test('missing installation and incomplete coverage stay flagged, without optimistic ratio exclusions',()=>{
 const {state,sources}=fixture();state.lifecycle.rentals[0].actual_start=null;
 let r=acquisitionMetrics(state,sources,options);assert.equal(r.unknown.length,1);assert.equal(r.points[0].spend,10000);assert.equal(r.points[0].cac,null);
 state.lifecycle.rentals[0].actual_start='2026-01-01';sources.payments.contacts[0].complete=false;r=acquisitionMetrics(state,sources,options);assert.equal(r.points[0].actualRatio,null);assert.equal(r.points[0].committedRatio,9);
});
test('type filter allocates shared expenses and never changes shared per-customer acquisition cost',()=>{
 const {state,sources}=fixture();state.lifecycle.rentals[1].actual_start='2026-01-02';
 const all=acquisitionMetrics(state,sources,options).points[0],filtered=acquisitionMetrics(state,sources,{...options,type:'Indoor Infrared'}).points[0];
 assert.equal(filtered.customers,1);assert.equal(filtered.spend,5000);assert.equal(filtered.cac,all.cac);
});
test('approved expense rules include ad spend and four tools, ignore contractor/general software, reverse refunds and reject foreign cash',()=>{
 const record=(id:string,payee:string,account:string,amount:number,type='SPEND',currency='USD')=>({BankTransactionID:id,Contact:{Name:payee},DateString:'2026-01-01',Type:type,CurrencyCode:currency,Status:'AUTHORISED',LineAmountTypes:'Inclusive',LineItems:[{AccountCode:account,LineAmount:amount,TaxAmount:0}]});
 const s=acquisitionSources([record('1','Facebook','6000',100),record('2','HIGHLEVEL','6155',20),record('3','BrightLocal','6155',10),record('4','Elfsight','6000',30),record('5','Web3Forms','6155',40),record('6','Contractor','5300',500),record('7','OpenAI','6155',200),record('contract-ad','Fiverr','6000',50),record('8','Facebook','6000',10,'RECEIVE'),record('9','Google','6000',5,'SPEND','CAD')],null,{contacts:[],payments:[]});
 assert.equal(s.expenses.length,6);assert.equal(s.expenses.reduce((n,e)=>n+e.amount,0),19000);assert.equal(s.issues.length,1);
});
test('month arithmetic clamps anniversaries and rejects bad date ranges',()=>{
 assert.equal(addCalendarMonths('2026-01-31',1),'2026-02-28');const {state,sources}=fixture();
 assert.throws(()=>acquisitionMetrics(state,sources,{...options,from:'2026-13'}));assert.throws(()=>acquisitionMetrics(state,sources,{...options,to:'2027-01'}));
});

test('overall ratios pool value and spending, include zero-install spending and avoid monthly averages',()=>{
 const {state,sources}=fixture();const points=acquisitionMetrics(state,sources,options).points;
 const s=acquisitionRatioSummary(points,'today',options.asOf);
 assert.equal(s.customers,2);assert.equal(s.spend,90000);assert.equal(s.cac,45000);
 assert.equal(s.committed,180000);assert.equal(s.committedRatio,2);assert.equal(s.actual,0);assert.equal(s.actualRatio,0);
 assert.notEqual(s.committedRatio,(points[0].committedRatio!+points[2].committedRatio!)/2);
});
test('fixed-age summary uses matching mature groups for both lines and includes zero-spend cash',()=>{
 const {state,sources}=fixture();sources.expenses[0].amount=0;
 const points=acquisitionMetrics(state,sources,options).points;
 const s=acquisitionRatioSummary(points,6,options.asOf);
 assert.equal(s.customers,1);assert.equal(s.waitingCustomers,1);assert.equal(s.spend,0);assert.equal(s.committed,90000);
 assert.equal(s.actual,0);assert.equal(s.actualRatio,null);assert.equal(s.committedRatio,null);
});
test('overall summary preserves unknown cash and commitments instead of dropping affected groups',()=>{
 const {state,sources}=fixture();sources.payments.contacts[1].complete=false;
 let s=acquisitionRatioSummary(acquisitionMetrics(state,sources,options).points,'today',options.asOf);
 assert.equal(s.actual,null);assert.equal(s.missingCashGroups,1);assert.equal(s.spend,90000);assert.equal(s.committedRatio,2);
 state.lifecycle.terms=[];s=acquisitionRatioSummary(acquisitionMetrics(state,sources,options).points,'today',options.asOf);
 assert.equal(s.committed,null);assert.equal(s.committedRatio,null);
});
