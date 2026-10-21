import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

test('accounting displays the agreed installation fee for new and historical agreements',async()=>{
 for(const installation of [500,0]) {
  let handler:any;
  const rows:any={reservations:[{id:'r',first_name:'Test',custom_install_fee:75}],contracts:[{reservation_id:'r',monthly_price:600,commitment_months:6,rental_summary_snapshot:{installation_fee:installation}}],sauna_inventory:[{current_customer_id:'r',unit_code:'Test'}]};
  const client={from(table:string){const q:any={select(){return q},eq(){return q},is(){return q},order(){return q},then(resolve:any){return Promise.resolve({data:rows[table],error:null}).then(resolve)}};return q}};
  const source=readFileSync(new URL('../supabase/functions/accounting-api/index.ts',import.meta.url),'utf8');
  const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  vm.runInNewContext(js,{exports:{},Request,Response,Map,Set,console,Deno:{env:{get:()=> 'test'}},require:(path:string)=>{
   if(path.includes('migrationPolicy'))return {serveWithMigrationPolicy:(h:any)=>{handler=h}};
   if(path.includes('supabase-js'))return {createClient:()=>client};
   if(path.includes('generatedPricing'))return {PRICING_TIERS:{}};
   throw Error(path);
  }});
  const response=await handler(new Request('https://test.invalid',{method:'POST',headers:{'Content-Type':'application/json','x-accounting-password':'test'},body:JSON.stringify({action:'list_accounting'})}));
  assert.equal(response.status,200);assert.equal((await response.json()).rows[0].install_fee,installation);
 }
});
