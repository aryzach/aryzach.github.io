import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import * as signatureNames from '../supabase/functions/_shared/signatureName.ts';
import * as pricing from '../supabase/functions/_shared/pricing.ts';
import * as terms from '../supabase/functions/_shared/rentalTerms.ts';
import * as serviceFees from '../supabase/functions/_shared/serviceFeePolicy.ts';
import * as installationOffers from '../supabase/functions/_shared/installationOffers.ts';
import * as currentRates from '../supabase/functions/_shared/currentRentalRates.ts';

// Execute the actual Edge Function handler against an isolated in-memory client.
// No Supabase, Stripe, storage or network calls leave this process.
function harness(version = 2, previous: any = null, reservationOverrides: Record<string, any> = {}) {
  let handler: (request: Request) => Promise<Response>;
  let contract = previous;
  let pdfSummary: any;
  let signatureAudit: any;
  const writes: string[] = [];
  const reservation = {id:'r',first_name:'Test',last_name:'Customer',email:'test@example.invalid',sauna_type_id:'indoor_traditional_standard',rental_pricing_version:version,...reservationOverrides};
  const client = {
    from(table: string) {
      let operation='read', value:any, single=false, filters:Record<string,any>={};
      const result=()=>{
        if(operation==='insert') {
          writes.push(table);
          if(table==='contract_signature_audit') signatureAudit=value;
          if(table==='contracts') contract={...value,id:'c'};
          return {data:table==='contracts'?contract:null,error:null};
        }
        if(operation==='update') { writes.push(table);if(table==='contracts')contract={...contract,...value};return {data:contract,error:null}; }
        if(table==='reservations')return {data:reservation,error:null};
        if(table==='agreement_versions')return {data:{id:'v',version_name:'Test master',master_pdf_storage_path:'test.pdf'},error:null};
        if(table==='contracts') {
          const matches=contract && (filters.status===undefined || (Array.isArray(filters.status)?filters.status.includes(contract.status):filters.status===contract.status));
          return {data:single?(matches?contract:null):(matches?[contract]:[]),error:null};
        }
        return {data:null,error:null};
      };
      const query:any={select(){return query},eq(k:string,v:any){filters[k]=v;return query},neq(){return query},in(k:string,v:any){filters[k]=v;return query},is(){return query},order(){return query},limit(){return query},
        maybeSingle:async()=>{single=true;return result()},single:async()=>{single=true;return result()},
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
    if(path.endsWith('/installationOffers.ts'))return installationOffers;
    if(path.endsWith('/currentRentalRates.ts'))return currentRates;
    if(path.endsWith('/serviceFeePolicy.ts'))return serviceFees;
    if(path.endsWith('/signatureName.ts'))return signatureNames;
    if(path.endsWith('/pricing.ts'))return pricing;
    if(path.endsWith('/rentalTerms.ts'))return terms;
    if(path.endsWith('/pdfBuilder.ts'))return {buildSignedContractPdf:async({summary}:any)=>{pdfSummary=summary;return new Uint8Array([1,2,3])},sha256Hex:async()=> 'test-hash'};
    if(path.endsWith('/assignSauna.ts'))return {syncSaunaAfterContract:async()=>{}};
    throw Error('Unexpected dependency '+path);
  }});
  return {writes,get signatureAudit(){return signatureAudit},get contract(){return contract},get pdfSummary(){return pdfSummary},async call(body:any){
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
    const expected=terms.rentalCommercialTerms({monthly:pricing.getMonthlyPrice('indoor_traditional_standard',months)!,months,choices:{...choices,pay_upfront_selected:upfront},installation:pricing.getInstallFee('indoor_traditional_standard',months),securityDeposit:2500,delivery:0});
    assert.deepEqual(JSON.parse(JSON.stringify(h.contract.rental_summary_snapshot.commercial_terms)),expected);
    assert.deepEqual(JSON.parse(JSON.stringify(h.contract.pricing_snapshot.commercial_terms)),expected);
    const snapshot=JSON.stringify(h.contract.rental_summary_snapshot);
    const signed=await h.call({action:'sign',contract_id:'c',typed_legal_name:'Test Customer',acknowledgments:{reviewed_agreement:true,commitment_binding:true,cancellation_terms:true,safety_terms:true,electronic_signature_consent:true}});
    assert.equal(signed.status,200,JSON.stringify(signed.body));
    assert.equal(h.contract.status,'Signed');assert.equal(JSON.stringify(h.pdfSummary),snapshot);assert.equal(JSON.stringify(h.contract.rental_summary_snapshot),snapshot);
  }
});
test('actual API rejects unanswered options and cannot add new options and applies the revised prices to existing unsigned bookings',async()=>{
  for(const key of Object.keys(choices)){
    const h=harness();const response=await h.call({...draft,[key]:null});assert.equal(response.status,400);assert.deepEqual(h.writes,[]);
  }
  const legacy=harness(1);assert.equal((await legacy.call(draft)).status,400);assert.deepEqual(legacy.writes,[]);
  const result=await legacy.call({...draft,pay_upfront_selected:false,premium_selected:false});assert.equal(result.status,200);
  assert.equal(legacy.contract.monthly_price,500);assert.equal(legacy.contract.rental_summary_snapshot.installation_fee,0);
  assert.equal(legacy.contract.rental_summary_snapshot.commercial_terms,undefined);
  const agreed=harness(1,{id:'c',status:'Draft Created',commitment_months:12,monthly_price:375,rental_summary_snapshot:{sauna_type_id:'indoor_traditional_standard',installation_fee:75}});
  assert.equal((await agreed.call({...draft,pay_upfront_selected:false,premium_selected:false})).status,200);
  assert.equal(agreed.contract.monthly_price,500);assert.equal(agreed.contract.rental_summary_snapshot.installation_fee,0);
});
test('signed agreements reject regeneration without writing any new record',async()=>{
  const h=harness(2,{id:'c',status:'Signed'});assert.equal((await h.call(draft)).status,409);assert.deepEqual(h.writes,[]);
});

test('old unsigned terms cannot be signed until the revised charges have been regenerated and reviewed', async () => {
  for (const status of ['Draft Created', 'Replacement Required']) {
    const h=harness(1,{id:'c',status,customer_legal_name:'Test Customer',rental_summary_snapshot:{}});
    const rejected=await h.call({action:'sign',contract_id:'c',typed_legal_name:'Test Customer'});
    assert.equal(rejected.status,400);assert.match(rejected.body.error,/terms have changed/);assert.deepEqual(h.writes,[]);
    const generated=await h.call({...draft,installation_city:'Alameda',pay_upfront_selected:false,premium_selected:false});
    assert.equal(generated.status,200);assert.equal(h.contract.delivery_fee,200);
    assert.equal(h.contract.rental_summary_snapshot.service_fee_policy_version,1);
    assert.equal(h.contract.status,'Draft Created');
  }
});

test('legacy magic-link reads expose revised prices and regenerate old custom quotes at the new rates',async()=>{
  const oldOptions=[{months:6,monthly_price:300,install_fee:0},{months:12,monthly_price:400,install_fee:500},{months:24,monthly_price:250,install_fee:100}];
  for(const custom_pricing_options of [null,oldOptions]) {
    const h=harness(1,null,{custom_pricing_options});
    const loaded=await h.call({action:'get'});assert.equal(loaded.status,200);
    for(const [months,monthly,install] of [[6,600,500],[12,500,0],[24,350,0]]) {
      const option=loaded.body.reservation.custom_pricing_options.find((o:any)=>o.months===months);
      assert.equal(option.monthly_price,monthly);assert.equal(option.install_fee,install);
      const saved=await h.call({...draft,commitment_months:months,pay_upfront_selected:false,premium_selected:false});
      assert.equal(saved.status,200);assert.equal(h.contract.monthly_price,monthly);
      assert.equal(h.contract.rental_summary_snapshot.installation_fee,install);
      assert.equal(h.contract.rental_summary_snapshot.rental_rate_revision,currentRates.RENTAL_RATE_REVISION);
    }
  }
});

test('traditional unsigned drafts use $2500 despite custom overrides; infrared quotes are preserved', async()=>{
  for(const sauna_type of ['indoor_traditional_standard','outdoor_traditional_standard','indoor_traditional_original','outdoor_traditional_original','indoor_infrared_standard']) {
    const h=harness(1,null,{custom_security_deposit:750});
    const saved=await h.call({...draft,sauna_type,pay_upfront_selected:false,premium_selected:false,second_heater_selected:false});
    assert.equal(saved.status,200);assert.equal(h.contract.security_deposit,sauna_type.includes('traditional')?2500:750);
    assert.equal(h.contract.rental_summary_snapshot.security_deposit,h.contract.security_deposit);
  }
});
test('a stale traditional deposit is rejected before any signature or PDF write',async()=>{
  const h=harness(1);await h.call({...draft,pay_upfront_selected:false,premium_selected:false});
  h.contract.security_deposit=1500;h.contract.rental_summary_snapshot.security_deposit=1500;
  const priorWrites=h.writes.length;const signed=await h.call({action:'sign',contract_id:'c',typed_legal_name:'Test Customer'});
  assert.equal(signed.status,400);assert.match(signed.body.error,/security deposit is now/);assert.equal(h.writes.length,priorWrites);
});


test('signature comparison ignores only keyboard formatting and canonical Unicode equivalents', () => {
  for (const typed of ['  TEST   CUSTOMER  ', 'Test\u00a0Customer', 'Test\u202fCustomer', 'Test\u200b Customer\u200e', 'Test\tCustomer']) {
    assert.equal(signatureNames.signatureNamesMatch(typed, 'Test Customer'), true, JSON.stringify(typed));
  }
  assert.equal(signatureNames.signatureNamesMatch('Jose\u0301 Customer', 'José Customer'), true);
  for (const typed of ['', '  ', '\u200b', null, undefined, 'Test Other', 'TestCustomer', 'Test Customer Jr', 'Test-Customer', 'Test Custоmer']) {
    assert.equal(signatureNames.signatureNamesMatch(typed, 'Test Customer'), false, JSON.stringify(typed));
  }
  assert.equal(signatureNames.signatureNamesMatch('Jose Customer', 'José Customer'), false);
  assert.equal(signatureNames.signatureNamesMatch('', ''), false);
});

test('actual signature handler accepts keyboard spacing while retaining the entered signature and all consent guards', async () => {
  const acknowledgments={reviewed_agreement:true,commitment_binding:true,cancellation_terms:true,safety_terms:true,electronic_signature_consent:true};
  for (const typed of ['Test  Customer', 'Test\u00a0Customer', 'Test\u200b Customer\u200e']) {
    const h=harness();
    assert.equal((await h.call(draft)).status, 200);
    const before=h.writes.length;
    const rejected=await h.call({action:'sign',contract_id:'c',typed_legal_name:typed,acknowledgments:{}});
    assert.equal(rejected.status,400);assert.match(rejected.body.error,/acknowledgments/);
    assert.equal(h.writes.length,before);
    const signed=await h.call({action:'sign',contract_id:'c',typed_legal_name:typed,acknowledgments});
    assert.equal(signed.status,200,JSON.stringify(signed.body));
    assert.equal(h.signatureAudit.typed_legal_name,typed);
    assert.equal(h.contract.customer_legal_name,'Test Customer');
  }
  const h=harness();await h.call(draft);const before=h.writes.length;
  const rejected=await h.call({action:'sign',contract_id:'c',typed_legal_name:'Test Other',acknowledgments});
  assert.equal(rejected.status,400);assert.match(rejected.body.error,/full legal name/);assert.equal(h.writes.length,before);
});


test('traditional installation offers save exact prices, windows and totals without trusting client amounts', async()=>{
 for(const [months,variant,monthly,date] of [[36,null,300,'2026-11-24'],[12,installationOffers.FEBRUARY_INSTALLATION,400,'2027-02-15'],[24,installationOffers.FEBRUARY_INSTALLATION,300,'2027-02-28']] as const){
  const h=harness(2,null,{allowed_commitment_months:[6],custom_pricing_options:[{months:6,monthly_price:600,install_fee:500}]});
  const res=await h.call({...draft,commitment_months:months,pricing_variant:variant,preferred_installation_date:date,pay_upfront_selected:false,monthly_price:1});
  assert.equal(res.status,200,JSON.stringify(res.body));
  const c=h.contract;
  assert.equal(c.monthly_price,monthly);
  assert.equal(c.rental_summary_snapshot.installation_fee,0);
  assert.equal(c.rental_summary_snapshot.pricing_variant,variant);
  assert.equal(c.rental_summary_snapshot.commercial_terms.base_initial_cents,monthly*months*100);
  assert.match(c.rental_summary_snapshot.installation_timing,variant?/February installation 2027/:/within 1 week/);
 }
});
test('invalid February windows, terms and sauna families are rejected before any writes',async()=>{
 for(const override of [{preferred_installation_date:'2027-01-31'},{preferred_installation_date:'2027-03-01'},{preferred_installation_date:'2027-02-30'},{commitment_months:36},{sauna_type:'indoor_infrared_standard'}]){
 const h=harness();const res=await h.call({...draft,pricing_variant:installationOffers.FEBRUARY_INSTALLATION,preferred_installation_date:'2027-02-15',...override});
 assert.equal(res.status,400); assert.deepEqual(h.writes,[]);
 }
});

test('infrared quote reads do not advertise a null-priced 36-month offer',async()=>{
 const h=harness(2,null,{sauna_type_id:'indoor_infrared_standard'});const res=await h.call({action:'get'});
 assert.equal(res.status,200);assert.ok(!res.body.reservation.custom_pricing_options.some((o:any)=>o.months===36));
});


test('infrared and Original only offer the three new terms, with server prices and free install',async()=>{
 for(const id of ['indoor_infrared_standard','outdoor_infrared_standard','indoor_traditional_original','outdoor_traditional_original']) {
 const h=harness(2,null,{sauna_type_id:id,allowed_commitment_months:[6],custom_pricing_options:[{months:1,monthly_price:1,install_fee:500}]});
 const loaded=await h.call({action:'get'});
 assert.deepEqual(loaded.body.reservation.custom_pricing_options.map((o:any)=>o.months),[6,12,24]);
 for(const [index,months] of [6,12,24].entries()){
 const infrared=id.includes('infrared');
 const saved=await h.call({...draft,sauna_type:id,commitment_months:months,pay_upfront_selected:false,premium_selected:infrared?null:false,second_heater_selected:infrared?null:false});
 assert.equal(saved.status,200,JSON.stringify(saved.body));
 assert.equal(h.contract.monthly_price,(id==='indoor_infrared_standard'?[300,200,150]:[400,300,200])[index]);
 assert.equal(h.contract.rental_summary_snapshot.installation_fee,0);
 assert.equal(h.contract.rental_summary_snapshot.commercial_terms.choices.premium_selected,false);
 }
 for(const months of [1,3,36]){const fresh=harness(2,null,{sauna_type_id:id,custom_pricing_options:[{months,monthly_price:1}]});const res=await fresh.call({...draft,sauna_type:id,commitment_months:months,...{premium_selected:false,second_heater_selected:false,pay_upfront_selected:false}});assert.equal(res.status,400);assert.deepEqual(fresh.writes,[]);}
 }
});
test('infrared rejects attempts to add Premium or a second heater',async()=>{
 for(const key of ['premium_selected','second_heater_selected']){const h=harness();const res=await h.call({...draft,sauna_type:'indoor_infrared_standard',premium_selected:false,second_heater_selected:false,[key]:true});assert.equal(res.status,400);assert.deepEqual(h.writes,[]);}
});
