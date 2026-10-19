import test from 'node:test';
import assert from 'node:assert/strict';
import { makeSyncProjection, mergeSource, normalizeBank, SYNC_RESOURCES, type SyncInput } from '../supabase/functions/_shared/xeroSyncModel.ts';
import { readXeroPages } from '../supabase/functions/_shared/xeroSyncFetch.ts';
const contact='00000000-0000-4000-8000-000000000001',customer='00000000-0000-4000-8000-000000000002',payment='00000000-0000-4000-8000-000000000003';
const bank=(extra={})=>({BankTransactionID:payment,Contact:{ContactID:contact},DateString:'2025-01-01',Type:'RECEIVE',Status:'AUTHORISED',Total:109,CurrencyCode:'USD',LineItems:[{AccountCode:'102',LineAmount:100,TaxAmount:9}],...extra});
const input=(extra:Partial<SyncInput>={}):SyncInput=>({cache:{Contacts:[{ContactID:contact,Name:'Test Customer',IsCustomer:true}],BankTransactions:[bank()],Invoices:[],Payments:[],CreditNotes:[]},oldHistory:[{contact_id:contact,contact_name:'Test Customer',contact_source:{ContactID:contact,Name:'Test Customer'},transactions:[normalizeBank(bank())]}],links:[{contact_id:contact,customer_id:customer}],allocations:[{source_id:payment,category:'rental',amount_cents:10000,customer_id:customer}],paymentReviews:[],previousReviews:[],cursor:'2026-10-18T12:00:00Z',full:true,initial:false,...extra});
test('old Xero amount and classification corrections replace the current projection, without operational writes or old source versions',async()=>{
 const i=input();i.cache.BankTransactions=[bank({Total:218,LineItems:[{AccountCode:'372',LineAmount:200,TaxAmount:18}]})];
 const p=await makeSyncProjection(i);assert.equal(p.replacements.length,1);assert.equal(p.replacements[0].allocations.find(a=>a.category==='sale').amount_cents,20000);assert.equal(p.reviews[0].kind,'classification');
 assert.deepEqual(Object.keys(p).sort(),['cache','complete','counts','coverage','cursor','full','histories','links','replacements','reviews','sourceResources'].sort());assert.equal(p.histories[0].transactions.length,1);assert.equal(p.histories[0].transactions[0].amount,'218');
});
test('a date correction preserves existing classifications and requests review without changing installation, pickup or terms',async()=>{
 const i=input();i.cache.BankTransactions=[bank({DateString:'2025-02-01'})];const p=await makeSyncProjection(i);assert.equal(p.replacements.length,0);assert.equal(p.reviews[0].kind,'conflict');assert.match(p.reviews[0].message,/preserved/);
});
test('deleted and missing Xero receipts stop contributing to actual LTV',async()=>{
 for(const rows of [[bank({Status:'DELETED'})],[]]){const i=input();i.cache.BankTransactions=rows;const p=await makeSyncProjection(i);assert.deepEqual(p.replacements,[{sourceId:payment,allocations:[],expectedActiveIds:[]}]);}
});
test('unmatched contacts are staged without creating profiles, bookings or allocations',async()=>{
 const p=await makeSyncProjection(input({links:[],allocations:[],oldHistory:[]}));assert.equal(p.histories.length,1);assert.equal(p.histories[0].linked,false);assert.equal(p.reviews.filter(r=>r.kind==='unmatched').length,1);assert.deepEqual(p.replacements[0].allocations,[]);
});
test('mixed or unsupported account splits are excluded until reviewed',async()=>{
 const i=input({allocations:[]});i.cache.BankTransactions=[bank({LineItems:[{AccountCode:'new-account',LineAmount:100,TaxAmount:9}]})];const p=await makeSyncProjection(i);assert.deepEqual(p.replacements[0].allocations,[]);assert.ok(p.reviews.some(r=>r.kind==='conflict'));
});
test('Vicky’s initial refresh replaces the app-only sale override with Xero rent, tax and deposit facts',async()=>{
 const i=input({initial:true,links:[{contact_id:contact,customer_id:'130072af-c8b1-4093-b9b1-50c1ea10f084'}]});const p=await makeSyncProjection(i);assert.equal(p.replacements[0].allocations[0].category,'rental');assert.equal(p.replacements[0].allocations[0].amount_cents,10000);
});
test('source IDs prevent duplicate imports, and full refresh removes absent source records',()=>{
 const row=bank();assert.equal(mergeSource('BankTransactions',[row],[row],false).length,1);assert.deepEqual(mergeSource('BankTransactions',[row],[],true),[]);assert.throws(()=>mergeSource('BankTransactions',[],[row,row],true),/repeated/);
});
test('invoice payments count cash once, exclude invoices themselves, and split net rent from tax',async()=>{
 const i=input({oldHistory:[],allocations:[]});i.cache.BankTransactions=[];i.cache.Invoices=[{InvoiceID:'invoice',Type:'ACCREC',Contact:{ContactID:contact},Total:109,CurrencyCode:'USD',LineItems:[{AccountCode:'102',LineAmount:100,TaxAmount:9}]}];i.cache.Payments=[{PaymentID:payment,Invoice:{InvoiceID:'invoice'},Amount:109,Date:'2025-01-01',Status:'AUTHORISED'}];
 const p=await makeSyncProjection(i);assert.equal(p.counts.payments,1);assert.equal(p.replacements[0].allocations.find(a=>a.category==='rental').amount_cents,10000);
});
test('paged retrieval uses modified-since, reads to terminal empty page and respects Retry-After',async()=>{
 const calls:{url:string;headers:Headers}[]=[];const delays:number[]=[];let attempt=0;
 const fake=async(url:URL,options:RequestInit)=>{calls.push({url:String(url),headers:new Headers(options.headers)});attempt++;if(attempt===1)return new Response('{}',{status:429,headers:{'Retry-After':'2'}});return Response.json({BankTransactions:attempt===2?[bank()]:[]});};
 const result=await readXeroPages('BankTransactions','private-token','2026-01-01T00:00:00Z',Date.now()+120000,fake as typeof fetch,async ms=>{delays.push(ms);});
 assert.equal(result.length,1);assert.equal(new URL(calls.at(-1)!.url).searchParams.get('page'),'2');assert.equal(calls[0].headers.get('If-Modified-Since'),'2026-01-01T00:00:00Z');assert.equal(delays[0],2000);assert.equal(SYNC_RESOURCES.length,5);
});
test('failed or malformed Xero pages reject the entire read instead of returning partial data',async()=>{
 for(const reply of [()=>Response.json({BankTransactions:null}),()=>new Response('{}',{status:403})])await assert.rejects(readXeroPages('BankTransactions','private',null,Date.now()+120000,reply as typeof fetch,async()=>{}));
});
test('tax-inclusive Xero cash uses net rent and retains the tax separately',async()=>{
 const i=input({allocations:[],oldHistory:[]});i.cache.BankTransactions=[bank({Total:167.66,LineAmountTypes:'Inclusive',LineItems:[{AccountCode:'102',LineAmount:167.66,TaxAmount:13.31}]})];const p=await makeSyncProjection(i);assert.equal(p.replacements[0].allocations.find(a=>a.category==='rental').amount_cents,15435);assert.equal(p.replacements[0].allocations.find(a=>a.category==='tax').amount_cents,1331);
});
test('documented Xero pagination metadata ends the full read without an extra request',async()=>{
 let calls=0;const fake=async()=>{calls++;return Response.json({pagination:{page:1,pageCount:1,itemCount:1,pageSize:1000},BankTransactions:[bank()]});};
 assert.equal((await readXeroPages('BankTransactions','private',null,Date.now()+120000,fake as typeof fetch,async()=>{})).length,1);assert.equal(calls,1);
});
test('a cash credit-note refund subtracts net rent and does not count the credit document as another payment',async()=>{
 const i=input({oldHistory:[],allocations:[]});i.cache.BankTransactions=[];i.cache.CreditNotes=[{CreditNoteID:'credit',Type:'ACCRECCREDIT',Contact:{ContactID:contact},Total:109,CurrencyCode:'USD',LineItems:[{AccountCode:'102',LineAmount:100,TaxAmount:9}]}];i.cache.Payments=[{PaymentID:payment,CreditNote:{CreditNoteID:'credit'},Amount:109,Date:'2025-01-01',Status:'AUTHORISED'}];
 const p=await makeSyncProjection(i);assert.equal(p.counts.payments,1);const r=p.replacements[0].allocations.find(a=>a.category==='rental');assert.equal(r.source_kind,'payment_out');assert.equal(r.amount_cents,10000);
});
test('the stored cache excludes supplier ledger entries while preserving all customer receipts',async()=>{
 const i=input();i.cache.BankTransactions.push(bank({BankTransactionID:'00000000-0000-4000-8000-000000000099',Contact:{ContactID:'vendor'},Type:'SPEND',LineItems:[{AccountCode:'5000',LineAmount:109,TaxAmount:0}]}));const p=await makeSyncProjection(i);assert.equal(p.cache.find(c=>c.resource==='BankTransactions')!.records.length,1);assert.deepEqual(p.sourceResources,[...SYNC_RESOURCES]);assert.equal(p.histories[0].transactions.length,1);
});
test('sauna capital and heater evidence stays in private cache without creating supplier customers',async()=>{
 const i=input();i.cache.BankTransactions.push(bank({BankTransactionID:'00000000-0000-4000-8000-000000000098',Contact:{ContactID:'vendor'},Type:'SPEND',LineItems:[{AccountCode:'540',LineAmount:1000,TaxAmount:0}]}));
 const p=await makeSyncProjection(i);assert.equal(p.cache.find(c=>c.resource==='BankTransactions')!.records.length,2);assert.equal(p.histories.some(h=>h.contact_id==='vendor'),false);
});
test('CAC expense evidence stays cached without treating ad vendors as customers',async()=>{
 const i=input();i.cache.BankTransactions.push(bank({BankTransactionID:'00000000-0000-4000-8000-000000000088',Contact:{ContactID:'vendor',Name:'HIGHLEVEL'},Type:'SPEND',LineItems:[{AccountCode:'6155',LineAmount:100,TaxAmount:0}]}));
 const p=await makeSyncProjection(i);assert.equal(p.cache.find(c=>c.resource==='BankTransactions')!.records.length,2);assert.equal(p.histories.some(h=>h.contact_id==='vendor'),false);
});
