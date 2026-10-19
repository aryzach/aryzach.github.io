import {test} from 'node:test';
import assert from 'node:assert/strict';
import {recoverySources,saunaRecovery} from '../src/lib/saunaRecovery.ts';
import {emptyRentalWorkspace} from '../src/lib/rentalModel.ts';
const line=(account:string,amount:number,code:string|null='001',tax=0)=>({AccountCode:account,LineAmount:amount,TaxAmount:tax,Tracking:code?[{Name:'Saunas',Option:`Sauna ${code} (Historical customer)`}]:[]});
const tx=(id:string,type:string,lines:unknown[],extra={})=>({BankTransactionID:id,Type:type,Status:'AUTHORISED',CurrencyCode:'USD',DateString:'2026-10-01',LineAmountTypes:'Inclusive',LineItems:lines,...extra});
const state=()=>({...emptyRentalWorkspace(),assets:[{id:'unit1',code:'001',model:'Infrared'},{id:'unit2',code:'002',model:'Traditional'}]});
test('purchase cost includes tax; rental and sale cash exclude tax/deposits; prepaid rent counts',()=>{
 const source=recoverySources([tx('cost','SPEND',[line('540',1100,'001',100)]),tx('rent','RECEIVE',[line('102',660,'001',60),line('200',500)]),tx('last','RECEIVE',[line('542',300)]),tx('sale','RECEIVE',[line('372',440,'001',40)])],null);
 const [r]=saunaRecovery(state(),source).rows;
 assert.equal(r.cost,110000);assert.equal(r.rent,90000);assert.equal(r.sale,40000);assert.equal(r.remaining,0);assert.equal(r.status,'paid');
});
test('refunds reduce recovery, purchase refunds reduce cost, separate receipts all count',()=>{
 const [r]=saunaRecovery(state(),recoverySources([tx('c','SPEND',[line('540',1000)]),tx('cr','RECEIVE',[line('540',100)]),tx('r1','RECEIVE',[line('102',300)]),tx('r2','RECEIVE',[line('102',300)]),tx('rf','SPEND',[line('102',100)])],null)).rows;
 assert.equal(r.cost,90000);assert.equal(r.rent,50000);assert.equal(r.remaining,40000);assert.equal(r.status,'unpaid');
});
test('unknown cost is not zero or paid off; no tag never follows current customer assignment',()=>{
 const s=state();const result=saunaRecovery(s,recoverySources([tx('r','RECEIVE',[line('102',500,null)]),tx('h','SPEND',[line('SH',200,null)])],null));
 assert.equal(result.rows[0].status,'unknown');assert.equal(result.rows[0].cost,null);assert.equal(result.rows[0].rent,0);assert.equal(result.issues.length,2);
});
test('reviewed rental split follows one explicit sauna tag without counting the deposit',()=>{
 const s=state();s.lifecycle={rentals:[],agreements:[],terms:[],placements:[],sales:[],settlements:[],events:[],documents:[],allocations:[{source_id:'mixed',category:'rental',amount_cents:30000,currency:'USD',voided_at:null} as never]};
 const r=saunaRecovery(s,recoverySources([tx('mixed','RECEIVE',[line('100',800)])],null));assert.equal(r.rows[0].rent,30000);
 const ambiguous=saunaRecovery(s,recoverySources([tx('mixed','RECEIVE',[line('100',400),line('100',400,'002')])],null));assert.equal(ambiguous.rows[0].rent,0);assert.equal(ambiguous.issues.length,1);
});
test('ignores deleted, transfer and non-USD entries; repeated source IDs count once',()=>{
 const source=recoverySources([tx('r','RECEIVE',[line('102',100)]),tx('r','RECEIVE',[line('102',100)]),tx('void','RECEIVE',[line('102',200)],{Status:'DELETED'}),tx('transfer','RECEIVE-TRANSFER',[line('102',500)]),tx('foreign','RECEIVE',[line('102',300)],{CurrencyCode:'CAD'})],null);
 const result=saunaRecovery(state(),source);assert.equal(result.rows[0].rent,10000);assert.equal(result.issues.length,1);
});
test('optional heater total is shared across all traditional units before filtering; missing base cost stays unknown',()=>{
 const s=state();s.assets[0].typeName='Outdoor Traditional';s.assets[1].typeName='Indoor Traditional';
 const sources=recoverySources([tx('cost','SPEND',[line('540',1000)]),tx('heat','SPEND',[line('SH',101.01,null)]),tx('refund','RECEIVE',[line('SH',1,null)])],null);
 const off=saunaRecovery(s,sources);assert.equal(off.rows[0].cost,100000);assert.equal(off.rows[0].heaterShare,0);
 const on=saunaRecovery(s,sources,true);assert.equal(on.heaterTotal,10001);assert.equal(on.rows.reduce((n,r)=>n+r.heaterShare,0),10001);assert.equal(on.rows[0].cost,105001);assert.equal(on.rows[1].cost,null);assert.equal(on.rows[1].status,'unknown');
});

test('sales toggle recalculates recovery, remaining cost and paid-off status independently of heaters',()=>{
 const sources=recoverySources([tx('cost','SPEND',[line('540',1000)]),tx('rent','RECEIVE',[line('102',600)]),tx('sale','RECEIVE',[line('372',550,'001',50)]),tx('refund','SPEND',[line('372',110,'001',10)])],null);
 const on=saunaRecovery(state(),sources,false,true).rows[0],off=saunaRecovery(state(),sources,false,false).rows[0];
 assert.equal(on.sale,40000);assert.equal(on.recovered,100000);assert.equal(on.status,'paid');
 assert.equal(off.sale,0);assert.equal(off.recovered,60000);assert.equal(off.remaining,40000);assert.equal(off.percentage,60);assert.equal(off.status,'unpaid');assert.equal(off.entries.some(e=>e.kind==='sale'),false);assert.equal(off.cost,on.cost);
});
