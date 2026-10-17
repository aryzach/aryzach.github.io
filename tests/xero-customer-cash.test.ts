import test from 'node:test';
import assert from 'node:assert/strict';
import { xeroDate,displayCashAmount } from '../src/lib/xeroCustomerHistory.ts';
import { xeroContactUrl } from '../src/lib/customerDirectory.ts';
import { readXeroCustomerHistory } from '../supabase/functions/_shared/xeroCustomerHistory.ts';
const customer='00000000-0000-4000-8000-000000000001';
const contact='00000000-0000-4000-8000-000000000002';
const second='00000000-0000-4000-8000-000000000003';
const other='00000000-0000-4000-8000-000000000004';
const tenant='00000000-0000-4000-8000-000000000005';
const payment={id:'source-payment',contactId:contact,date:'2026-01-01',amount:'50.12',currency:'USD',type:'RECEIVE',status:'AUTHORISED'};
function mock(fail='') {
 const calls:{table:string;fields:string;filters:[string,unknown][]}[]=[];
 const rows:Record<string,Record<string,unknown>[]>={
  xero_oauth_connection:[{id:'primary',selected_tenant_id:tenant,token_ciphertext:'must never project'}],
  xero_customer_links:[{tenant_id:tenant,contact_id:contact,customer_id:customer},{tenant_id:tenant,contact_id:second,customer_id:customer},{tenant_id:other,contact_id:other,customer_id:customer}],
  xero_customer_history:[contact,second,other].map(id=>({tenant_id:id===other?other:tenant,contact_id:id,contact_name:'Synthetic contact',transactions:[{...payment,contactId:id,id:id+'-payment'}],pending_matches:['Possible synthetic customer'],review_state:'customer',snapshot_at:'2026-01-01T12:00:00Z',coverage:{terminalPageReached:true,note:'Cash records only'},contact_source:{private:'omitted'}})),
 };
 return {calls,from(table:string) {
  const call={table,fields:'',filters:[] as [string,unknown][]};calls.push(call);let one=false;
  const chain={select(fields:string){call.fields=fields;return chain;},eq(field:string,value:unknown){call.filters.push([field,value]);return chain;},in(field:string,value:unknown){call.filters.push([field,value]);return chain;},order(){return chain;},maybeSingle(){one=true;return chain;},then(resolve:(value:unknown)=>unknown,reject:(error:unknown)=>unknown){
   const filtered=rows[table].filter(row=>call.filters.every(([key,value])=>Array.isArray(value)?value.includes(row[key]):value===row[key]));
   return Promise.resolve({data:one?filtered[0]:filtered,error:table===fail?new Error('source failed'):null}).then(resolve,reject);
  }};return chain;
 }};
}
test('Xero dates preserve the source calendar day regardless of local timezone',()=>{
 assert.equal(xeroDate('/Date(1767225600000+0000)/'),'2026-01-01');
 assert.equal(xeroDate('2026-01-01T00:00:00'),'2026-01-01');
 for(const invalid of [null,'not-a-date','2026-02-30','/Date(99999999999999999)/'])assert.throws(()=>xeroDate(invalid));
 assert.equal(displayCashAmount('50.12','USD'),'$50.12');
 assert.equal(displayCashAmount('12.5','EUR'),'€12.50');
});
test('Xero links retain organisation context and reject unsafe identifiers',()=>{
 assert.equal(xeroContactUrl('javascript:alert(1)'),null);
 const link=new URL(xeroContactUrl(contact,'!example')!);
 assert.equal(link.origin,'https://go.xero.com');
 assert.equal(link.searchParams.get('shortcode'),'!example');
 assert.equal(link.searchParams.get('redirecturl'),'/Contacts/View/'+contact);
});
test('history directory reads only the selected tenant and excludes transaction payloads and secrets',async()=>{
 const client=mock();const result=await readXeroCustomerHistory(client,{});
 assert.equal(result.contacts.length,2);assert.equal(Object.hasOwn(result,'transactions'),false);
 const query=client.calls.find(c=>c.table==='xero_customer_history')!;
 assert.equal(query.fields.includes('transactions'),false);assert.deepEqual(query.filters,[['tenant_id',tenant]]);
 assert.equal(JSON.stringify(result).includes('token_ciphertext'),false);assert.equal(JSON.stringify(result).includes('private'),false);
});
test('approved customer identity can combine several source contacts without crossing tenants',async()=>{
 const client=mock();const result=await readXeroCustomerHistory(client,{customerId:customer});
 assert.equal(result.contacts.length,2);assert.equal(result.transactions?.length,2);
 assert.deepEqual(client.calls.find(c=>c.table==='xero_customer_history')!.filters,[['tenant_id',tenant],['contact_id',[contact,second]]]);
 assert.equal(result.contacts[0].customerId,customer);
});
test('unlinked or foreign source contacts never inherit another customer identity',async()=>{
 const result=await readXeroCustomerHistory(mock(),{contactId:other});assert.deepEqual(result.contacts,[]);assert.deepEqual(result.transactions,[]);
 const missing=await readXeroCustomerHistory(mock(),{customerId:other});assert.deepEqual(missing,{contacts:[],transactions:[]});
});
test('invalid selections and failed reads fail visibly rather than showing zero payments',async()=>{
 for(const selection of [{contactId:'bad'},{customerId:customer,contactId:contact},{customerId:null},{customerId:{toString:()=>customer}}]) await assert.rejects(readXeroCustomerHistory(mock(),selection as never),/Choose one/);
 await assert.rejects(readXeroCustomerHistory(mock('xero_customer_history'),{}),/source failed/);
 await assert.rejects(readXeroCustomerHistory(mock('xero_oauth_connection'),{}),/authorized Xero/);
});
