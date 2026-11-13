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

test('supplier bill allocations count their cost once, including paid bills, and retain the bill source',()=>{
 const bills=[{InvoiceID:'bill',Type:'ACCPAY',Status:'AUTHORISED',CurrencyCode:'USD',DateString:'2026-08-18',LineAmountTypes:'NoTax',Total:1200,AmountPaid:1000,LineItems:[line('1400',500),line('1400',500,'002'),line('1400',200,null)],Payments:[{Amount:1000}]}];
 const sources=recoverySources([],null,true,bills);const r=saunaRecovery(state(),sources);
 assert.equal(r.rows[0].cost,50000);assert.equal(r.rows[1].cost,50000);assert.equal(r.issues[0].amount,20000);assert.match(r.rows[0].entries[0].sourceUrl!,/AccountsPayable\/View/);
 assert.equal(saunaRecovery(state(),recoverySources([],null,true,[{...bills[0],Status:'PAID'}])).rows[0].cost,50000);
 assert.equal(recoverySources([],null,true,[{...bills[0],Status:'VOIDED'},{...bills[0],Type:'ACCREC'}]).transactions.length,0);
});

test('entries retain original Xero contacts and cash direction, newest first, without using current customer',()=>{
 const s=state();
 const sources=recoverySources([
  tx('old','RECEIVE',[line('102',100)],{Contact:{Name:'Former Renter'},DateString:'2025-01-03'}),
  tx('unknown','RECEIVE',[line('102',200)],{DateString:''}),
  tx('refund','SPEND',[line('102',50)],{Contact:{Name:'Refund Recipient'},DateString:'2026-09-02'}),
  tx('new','RECEIVE',[line('102',300)],{Contact:{Name:' New Renter '},DateString:'2026-11-02'})
 ],null,true,[{InvoiceID:'bill',Type:'ACCPAY',Status:'AUTHORISED',CurrencyCode:'USD',DateString:'2024-01-01',Contact:{Name:'Supplier'},LineItems:[line('1400',1000)]}]);
 const entries=saunaRecovery(s,sources).rows[0].entries;
 assert.deepEqual(entries.map(e=>e.sourceId),['new','refund','old','bill','unknown']);
 assert.equal(entries[0].contactName,'New Renter');assert.equal(entries[0].direction,'RECEIVE');
 assert.equal(entries[1].contactName,'Refund Recipient');assert.equal(entries[1].direction,'SPEND');
 assert.equal(entries[3].contactName,'Supplier');assert.equal(entries[3].sourceType,'bill');
 assert.equal(entries[4].contactName,undefined);
});

test('every recovery column sorts in both directions; missing numeric values remain last',async()=>{
 const {compareRecoveryRows}=await import('../src/lib/saunaRecovery.ts');
 const rows=saunaRecovery(state(),recoverySources([tx('c','SPEND',[line('540',1000)]),tx('r','RECEIVE',[line('102',100)]),tx('s','RECEIVE',[line('372',50,'002')])],null)).rows;
 for(const key of ['code','type','cost','rent','sale','recovered','remaining','percentage','status'] as const){
  const up=[...rows].sort((a,b)=>compareRecoveryRows(a,b,key,false));
  const down=[...rows].sort((a,b)=>compareRecoveryRows(a,b,key,true));
  if(['cost','remaining','percentage'].includes(key))assert.equal(down.at(-1)!.code,'002');
  else assert.deepEqual(up.map(r=>r.code),down.map(r=>r.code).reverse());
 }
});

test('customer search includes historical payers and explicit current/future/history links, excluding suppliers and ambiguous tags',async()=>{
 const {recoverySearchIndex}=await import('../src/lib/saunaRecovery.ts');
 const s=state();
 s.assets[0].currentCustomerName='Current Renter';
 s.customers=[{id:'future',name:'Future Renter',primaryContact:'Booking Contact',kind:'person',email:'',phone:'',archived:false,legacyReservationIds:[]},{id:'past',name:'Past Renter',kind:'person',email:'',phone:'',archived:false,legacyReservationIds:[]}];
 s.rentals=[{id:'future-rental',customerId:'future',reservationId:null,address:'',notes:''},{id:'past-rental',customerId:'past',reservationId:null,address:'',notes:''}];
 s.legacyLinks=[{assetId:'unit2',rentalId:'future-rental',kind:'future',recordedInstallDate:null}];
 s.assignments=[{id:'history',assetId:'unit1',rentalId:'past-rental',installedOn:'2025-01-01',removedOn:'2025-02-01',address:''}];
 const source=recoverySources([tx('payer','RECEIVE',[line('102',100)],{Contact:{Name:'Historical Payer'}}),tx('supplier','SPEND',[line('540',100)],{Contact:{Name:'Sauna Supplier'}}),tx('buyer','RECEIVE',[line('372',200,'002')],{Contact:{Name:'Past Buyer'}}),tx('untagged','RECEIVE',[line('102',100,null)],{Contact:{Name:'Unassigned Payer'}})],null);
 source.transactions.push({...source.transactions[0],id:'ambiguous',contactName:'Ambiguous Payer',lines:[{...source.transactions[0].lines[0],saunaCodes:['001','002']}]});
 const index=recoverySearchIndex(s,source);
 assert.match(index.get('unit1')!,/current renter/);assert.match(index.get('unit1')!,/past renter/);assert.match(index.get('unit1')!,/historical payer/);
 assert.match(index.get('unit2')!,/future renter/);assert.match(index.get('unit2')!,/booking contact/);assert.match(index.get('unit2')!,/past buyer/);
 assert.doesNotMatch([...index.values()].join(' '),/sauna supplier|unassigned payer|ambiguous payer/);
});

test('owner attribution corrects only the specified contact, start date and original sauna, without altering source money or placements',async()=>{
 const {correctedRecoverySources,recoverySearchIndex}=await import('../src/lib/saunaRecovery.ts');
 const s=state();s.assets[0].code='009';s.assets[1].code='026';
 s.lifecycle={rentals:[],agreements:[],terms:[],placements:[],sales:[],settlements:[],documents:[],allocations:[],events:[{id:'rule',rental_id:null,asset_id:'unit2',event_type:'payment_sauna_attribution_corrected',occurred_on:'2026-04-24',created_at:'2026-11-13T00:00:00Z',detail:{version:1,fromAssetId:'unit1',contactId:'payer-a'}}]};
 const make=(id:string,date:string,code='009',contact='payer-a',direction='RECEIVE',account='102')=>tx(id,direction,[line(account,110,code,10)],{DateString:date,Contact:{ContactID:contact,Name:contact==='payer-a'?'Corrected Payer':'Other Payer'}});
 const sources=recoverySources([make('before','2026-04-23'),make('same-day','2026-04-24'),make('after','2026-05-24'),make('already-correct','2026-06-24','026'),make('other','2026-05-24','009','payer-b'),make('refund','2026-05-24','009','payer-a','SPEND'),make('cost','2026-05-24','009','payer-a','RECEIVE','540')],null);
 const original=JSON.stringify(sources),stateOriginal=JSON.stringify(s);
 const corrected=correctedRecoverySources(s,sources);
 assert.deepEqual(corrected.transactions.map(t=>t.lines[0].saunaCodes[0]),['009','026','026','026','009','009','009']);
 assert.match(corrected.transactions[1].lines[0].attributionNote!,/#009 → #026/);
 assert.equal(JSON.stringify(sources),original);assert.equal(JSON.stringify(s),stateOriginal);
 const uncorrected=saunaRecovery({...s,lifecycle:{...s.lifecycle,events:[]}},sources),result=saunaRecovery(s,sources);
 assert.equal(result.rows[0].rent,uncorrected.rows[0].rent-20000);assert.equal(result.rows[1].rent,uncorrected.rows[1].rent+20000);
 assert.equal(result.rows.reduce((n,r)=>n+r.recovered,0),uncorrected.rows.reduce((n,r)=>n+r.recovered,0));
 assert.match(result.rows[1].entries.find(e=>e.sourceId==='same-day')!.attributionNote!,/Original Xero entry preserved/);
 assert.match(recoverySearchIndex(s,sources).get('unit2')!,/corrected payer/);
 // Re-imported source facts keep the same correction without being edited in place.
 assert.deepEqual(correctedRecoverySources(s,JSON.parse(original)),corrected);
});
