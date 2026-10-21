import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import * as pricing from '../supabase/functions/_shared/pricing.ts';
import * as terms from '../supabase/functions/_shared/rentalTerms.ts';

// Execute the actual Edge Function handler against an isolated in-memory client.
// No Supabase, Stripe, storage or network calls leave this process.
function harness(version = 2, previous: any = null) {
  let handler: (request: Request) => Promise<Response>;
  let contract = previous;
  let pdfSummary: any;
  const writes: string[] = [];
  const reservation = {id:'r',first_name:'Test',last_name:'Customer',email:'test@example.invalid',sauna_type_id:'indoor_traditional_standard',rental_pricing_version:version};
  const client = {
    from(table: string) {
      let operation='read', value:any, filters:Record<string,any>={};
      const result=()=>{
        if(operation==='insert') {
          writes.push(table);
          if(table==='contracts') contract={...value,id:'c'};
          return {data:table==='contracts'?contract:null,error:null};
        }
        if(operation==='update') { writes.push(table);if(table==='contracts')contract={...contract,...value};return {data:contract,error:null}; }
        if(table==='reservations')return {data:reservation,error:null};
        if(table==='agreement_versions')return {data:{id:'v',version_name:'Test master',master_pdf_storage_path:'test.pdf'},error:null};
        if(table==='contracts') {
          const matches=contract && (filters.status===undefined || (Array.isArray(filters.status)?filters.status.includes(contract.status):filters.status===contract.status));
          return {data:matches?contract:null,error:null};
        }
        return {data:null,error:null};
      };
      const query:any={select(){return query},eq(k:string,v:any){filters[k]=v;return query},neq(){return query},in(k:string,v:any){filters[k]=v;return query},is(){return query},order(){return query},limit(){return query},
        maybeSingle:async()=>result(),single:async()=>result(),
        insert(v:any){operation='insert';value=v;return query},update(v:any){operation='update';value=v;return query},
        then(resolve:any,reject:any){return Promise.resolve(result()).then(resolve,reject)}};
      return query;
    },
    storage:{from(){return {download:async()=>({data:new Blob(['synthetic master']),error:null}),upload:async()=>({error:null}),createSignedUrl:async()=>({data:{signedUrl:'https://example.invalid/test.pdf'},error:null})}}},
  };
  const source=readFileSync(new URL('../supabase/functions/contract-api/index.ts',import.meta.url),'utf8');
  const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  vm.runInNewContext(js, {exports:{},Request,Response,Blob,Date,console, Deno:{env:{get:()=> 'test-only'}},require:(path:string)=>{
    if(path.includes('migrationPolicy'))return {serveWithMigrationPolicy:(h:any)=>{handler=h}};
    if(path.includes('esm.sh/@supabase'))return {createClient:()=>client};
    if(path.endsWith('/pricing.ts'))return pricing;
    if(path.endsWith('/rentalTerms.ts'))return terms;
    if(path.endsWith('/pdfBuilder.ts'))return {buildSignedContractPdf:async({summary}:any)=>{pdfSummary=summary;return new Uint8Array([1,2,3])},sha256Hex:async()=> 'test-hash'};
    if(path.endsWith('/assignSauna.ts'))return {syncSaunaAfterContract:async()=>{}};
    throw Error('Unexpected dependency '+path);
  }});
  return {writes,get contract(){return contract},get pdfSummary(){return pdfSummary},async call(body:any){
    const response=await handler!(new Request('https://test.invalid',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:'r',token:'test-token',...body})}));
    return {status:response.status,body:await response.json()};
  }};
}
const choices={insurance_selected:true,second_heater_selected:true,pay_upfront_selected:true,premium_selected:true};
const draft={action:'save_draft',customer_legal_name:'Test Customer',email:'test@example.invalid',phone:'',installation_address:'Example address',installation_city:'San Francisco',sauna_type:'indoor_traditional_standard',commitment_months:12,preferred_installation_date:'2027-01-15',...choices};

test('actual draft and signature handlers preserve the same server-calculated snapshot for every term',async()=>{
  for(const months of [1,3,6,12,24])for(const upfront of [false,true]) {
    const h=harness();const saved=await h.call({...draft,commitment_months:months,pay_upfront_selected:upfront,monthly_price:1,premium_monthly_price:1,discount_percent:99});
    if(upfront && !terms.upfrontEligible(months)){assert.equal(saved.status,400);assert.deepEqual(h.writes,[]);continue;}
    assert.equal(saved.status,200,JSON.stringify(saved.body));
    const expected=terms.rentalCommercialTerms({monthly:pricing.getMonthlyPrice('indoor_traditional_standard',months)!,months,choices:{...choices,pay_upfront_selected:upfront},installation:pricing.getInstallFee('indoor_traditional_standard',months),securityDeposit:1500,delivery:0});
    assert.deepEqual(JSON.parse(JSON.stringify(h.contract.rental_summary_snapshot.commercial_terms)),expected);
    assert.deepEqual(JSON.parse(JSON.stringify(h.contract.pricing_snapshot.commercial_terms)),expected);
    const snapshot=JSON.stringify(h.contract.rental_summary_snapshot);
    const signed=await h.call({action:'sign',contract_id:'c',typed_legal_name:'Test Customer',acknowledgments:{reviewed_agreement:true,commitment_binding:true,cancellation_terms:true,safety_terms:true,electronic_signature_consent:true}});
    assert.equal(signed.status,200,JSON.stringify(signed.body));
    assert.equal(h.contract.status,'Signed');assert.equal(JSON.stringify(h.pdfSummary),snapshot);assert.equal(JSON.stringify(h.contract.rental_summary_snapshot),snapshot);
  }
});
test('actual API rejects unanswered options and cannot add new options or reprice existing unsigned bookings',async()=>{
  for(const key of Object.keys(choices)){
    const h=harness();const response=await h.call({...draft,[key]:null});assert.equal(response.status,400);assert.deepEqual(h.writes,[]);
  }
  const legacy=harness(1);assert.equal((await legacy.call(draft)).status,400);assert.deepEqual(legacy.writes,[]);
  const result=await legacy.call({...draft,pay_upfront_selected:false,premium_selected:false});assert.equal(result.status,200);
  assert.equal(legacy.contract.monthly_price,400);assert.equal(legacy.contract.rental_summary_snapshot.installation_fee,0);
  assert.equal(legacy.contract.rental_summary_snapshot.commercial_terms,undefined);
  const agreed=harness(1,{id:'c',status:'Draft Created',commitment_months:12,monthly_price:375,rental_summary_snapshot:{sauna_type_id:'indoor_traditional_standard',installation_fee:75}});
  assert.equal((await agreed.call({...draft,pay_upfront_selected:false,premium_selected:false})).status,200);
  assert.equal(agreed.contract.monthly_price,375);assert.equal(agreed.contract.rental_summary_snapshot.installation_fee,75);
});
test('signed agreements reject regeneration without writing any new record',async()=>{
  const h=harness(2,{id:'c',status:'Signed'});assert.equal((await h.call(draft)).status,409);assert.deepEqual(h.writes,[]);
});
