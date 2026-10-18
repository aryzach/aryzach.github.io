import test from 'node:test';
import assert from 'node:assert/strict';
import {readLifecycleRecords} from '../supabase/functions/_shared/lifecycleRecords.ts';

function client(failSecondPage=false){
 const pages:{table:string;offset:number;columns:string;order:string[]}[]=[];
 return {pages,from(table:string){let columns='';const order:string[]=[];return {
  select(value:string){columns=value;return this;},order(value:string){order.push(value);return this;},
  async range(offset:number,end:number){pages.push({table,offset,columns,order:[...order]});
   if(table==='rental_history_events'&&offset&&failSecondPage)return {error:new Error('Source unavailable')};
   const rows=table==='rental_history_events'?Array.from({length:1002},(_,i)=>({id:String(i)})):[];
   return {data:rows.slice(offset,end+1)};
  }
 };}};
}
test('private history reader retains events beyond the API page limit',async()=>{
 const source=client();const result=await readLifecycleRecords(source);
 assert.equal(result.events.length,1002);
 assert.deepEqual(source.pages.filter(p=>p.table==='rental_history_events').map(p=>p.offset),[0,1000]);
 assert.deepEqual(source.pages.find(p=>p.table==='customer_payment_reviews')?.order,['tenant_id','source_id']);
 assert.ok(!source.pages.find(p=>p.table==='rental_documents')?.columns.includes('storage_path'));
});
test('private history reader rejects a failed later page instead of showing partial history',async()=>{
 await assert.rejects(readLifecycleRecords(client(true)),/Source unavailable/);
});
