import test from 'node:test';import assert from 'node:assert/strict';
import {assignSoonestSauna,syncSaunaAfterContract} from '../supabase/functions/_shared/assignSauna.ts';
test('automatic assignment honors an existing owner-selected unit without considering alternatives',async()=>{
 const assigned={id:'owner-unit',future_customer_id:'booking',current_customer_id:null};let queries=0;
 const db={from(table:string){assert.equal(table,'sauna_inventory');queries++;return {select(){return {or(){return Promise.resolve({data:[assigned],error:null});}};}}}};
 assert.equal((await assignSoonestSauna(db,{id:'booking',sauna_type_id:'outdoor'})).sauna,assigned);assert.equal(queries,1);
});
test('assignment lookup failure cannot fall through to picking another sauna',async()=>{
 const db={from(){return {select(){return {or(){return Promise.resolve({data:null,error:new Error('unavailable')});}};}}}};
 assert.equal((await assignSoonestSauna(db,{id:'booking',sauna_type_id:'outdoor'})).reason,'assignment_lookup_failed');
});
test('contract signing preserves an allocated dual-location unit rather than releasing it by type ID',async()=>{
 const changes:{table:string;patch:Record<string,unknown>}[]=[];
 const db={from(table:string){let patch:Record<string,unknown>|undefined;let field='';const query={select(){return query;},update(value:Record<string,unknown>){patch=value;changes.push({table,patch:value});return query;},eq(key:string){if(key==='current_customer_id'||key==='future_customer_id')field=key;return query;},maybeSingle(){return Promise.resolve({data:table==='reservations'?{id:'booking',sauna_type_id:'outdoor'}:field==='current_customer_id'?null:{id:'owner-unit',sauna_type_id:'indoor',locations:['indoor','outdoor']}});},then(resolve:(v:unknown)=>unknown){return Promise.resolve({data:patch,error:null}).then(resolve);}};return query;}};
 await syncSaunaAfterContract(db,'booking','outdoor');assert.deepEqual(changes.filter(x=>x.table==='sauna_inventory'),[]);assert.ok(changes.some(x=>x.table==='reservations'&&x.patch.sauna_inventory_id==='owner-unit'));
});
