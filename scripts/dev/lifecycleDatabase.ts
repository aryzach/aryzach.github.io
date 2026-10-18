import {spawnSync} from 'node:child_process';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import type {RentalWorkspace} from '../../src/lib/rentalModel';

interface Config {database:string;records:string;documentMap:string;uploads:string;}
export async function localConfig():Promise<Config>{
 const filename=process.env.SF_LOCAL_LIFECYCLE_CONFIG;if(!filename)throw new Error('The isolated local history database is not configured.');
 const config=JSON.parse(await readFile(filename,'utf8')) as Config;
 if(!/^sf_sauna_lifecycle_[a-f0-9]+$/.test(config.database))throw new Error('Refusing a non-test database.');return config;
}
export function localQuery(config:Config,sql:string):unknown{
 const result=spawnSync('/opt/homebrew/opt/libpq@17/bin/psql',['-X','-qAt','-v','ON_ERROR_STOP=1','-h','/private/tmp/sf-sauna-email-test-socket','-p','55439','-d',config.database],{input:sql,encoding:'utf8',timeout:15000,maxBuffer:20*1024*1024});
 if(result.status!==0)throw new Error((result.stderr||'Local database operation failed').split('CONTEXT:')[0].replace(/^ERROR:\s*/,''));
 return result.stdout.trim()?JSON.parse(result.stdout.trim()):null;
}
const literal=(v:unknown)=>`'${JSON.stringify(v).replace(/'/g,"''")}'::jsonb`;
const uuid=(s:unknown)=>{if(typeof s!=='string'||!/^[a-f0-9-]{36}$/i.test(s))throw new Error('Valid request ID required.');return `'${s}'::uuid`;};
export async function localWorkspace(config:Config):Promise<RentalWorkspace>{
 const base=JSON.parse(await readFile(config.records,'utf8')) as RentalWorkspace;
 const documentMap=JSON.parse(await readFile(config.documentMap,'utf8')) as Record<string,string>;
 const result=localQuery(config,`SELECT jsonb_build_object(
 'bookings',booking_workspace(),
 'lifecycle',jsonb_build_object(${['rentals','rental_agreements','rental_terms','rental_placements','sauna_sales','rental_settlements','rental_history_events','rental_documents','rental_payment_allocations','customer_payment_reviews'].map((table,i)=>`'${['rentals','agreements','terms','placements','sales','settlements','events','documents','allocations','paymentReviews'][i]}',coalesce((SELECT jsonb_agg(to_jsonb(t)${table==='rental_documents'?"-'storage_path'":''}) FROM ${table} t),'[]'::jsonb)`).join(',')}),
 'reservations',coalesce((SELECT jsonb_agg(jsonb_build_object('id',r.id,'createdAt',r.created_at,'status',r.reservation_status,'address',coalesce(r.install_address,(SELECT n.service_address FROM rentals n WHERE n.originating_reservation_id=r.id),''),'saunaType',coalesce(st.name,''),'stripeCustomerId',r.stripe_customer_id,'bookingKind',r.booking_kind,'bookedOn',r.booked_on)) FROM reservations r LEFT JOIN sauna_types st ON st.id=r.sauna_type_id),'[]'::jsonb),
 'inventory',coalesce((SELECT jsonb_agg(to_jsonb(i)||jsonb_build_object('monthly_price',coalesce((SELECT c.monthly_price FROM contracts c WHERE c.reservation_id=coalesce(i.current_customer_id,i.future_customer_id) AND c.voided_at IS NULL ORDER BY (c.signed_at IS NOT NULL) DESC,c.created_at DESC LIMIT 1),(SELECT r.crm_monthly_price FROM reservations r WHERE r.id=coalesce(i.current_customer_id,i.future_customer_id))))) FROM sauna_inventory i),'[]'::jsonb),
 'profiles',coalesce((SELECT jsonb_agg(jsonb_build_object('id',id,'primaryContact',primary_contact_name,'archived',archived_at IS NOT NULL,'version',version)) FROM customer_profiles),'[]'::jsonb),
 'links',coalesce((SELECT jsonb_agg(to_jsonb(l)) FROM reservation_customer_links l),'[]'::jsonb));`) as {profiles:{id:string;primaryContact:string;archived:boolean;version:number}[];lifecycle:NonNullable<RentalWorkspace['lifecycle']>;reservations:RentalWorkspace['reservations'];inventory:Record<string,unknown>[];links:{reservation_id:string;customer_id:string}[]};
 base.bookings=(result as typeof result & {bookings:RentalWorkspace['bookings']}).bookings;base.lifecycle=result.lifecycle;base.reservations=result.reservations;base.legacyInventory=result.inventory;
 base.customers=base.customers.map(c=>({...c,...result.profiles.find(p=>p.id===c.id),legacyReservationIds:result.links.filter(l=>l.customer_id===c.id).map(l=>l.reservation_id)}));
 base.rentals=result.lifecycle.rentals.map(r=>({id:r.id,customerId:r.customer_id,reservationId:r.originating_reservation_id,address:r.service_address||'',notes:''}));
 base.assignments=result.lifecycle.placements.map(p=>({id:p.id,rentalId:p.rental_id,assetId:p.asset_id,installedOn:p.installed_on,removedOn:p.removed_on,address:p.address||''}));
 base.assets=result.inventory.map(i=>({id:String(i.id),code:String(i.unit_code||''),model:String(i.model||''),sourceStatus:i.retired_on?'Retired':String(i.status),retired:!!i.retired_on,conditionState:String(i.condition_state||'unknown'),custody:i.current_customer_id&&['Installed','Returning','Maintenance','Transfer Planned'].includes(String(i.status))?'With customer':undefined,typeName:base.legacyTypes?.find(t=>t.id===i.sauna_type_id)?.name||''}));
 base.legacyLinks=result.inventory.flatMap(i=>['current','future'].flatMap(kind=>{const r=base.rentals.find(r=>r.reservationId===i[`${kind}_customer_id`]);return r?[{assetId:String(i.id),rentalId:r.id,kind:kind as 'current'|'future',recordedInstallDate:kind==='current'?i.install_date as string:null}]:[];}));
 base.lifecycle.documents=base.lifecycle.documents.map(d=>({...d,local_url:documentMap[d.id]?`/__local-documents/${d.id}`:undefined}));
 base.lifecycle.agreements=base.lifecycle.agreements.map(a=>{if(a.contract_id&&documentMap[a.contract_id])documentMap[a.id]=documentMap[a.contract_id];return {...a,local_url:documentMap[a.id]?`/__local-documents/${a.id}`:undefined};});
 await writeFile(config.documentMap,JSON.stringify(documentMap),{mode:0o600});
 await writeFile(config.records,JSON.stringify(base),{mode:0o600});return base;
}
export async function localLifecycleRequest(body:Record<string,unknown>){
 const config=await localConfig();
 if(body.action==='lifecycle_document_upload'){
  if(typeof body.base64!=='string'||body.base64.length>28*1024*1024||typeof body.filename!=='string'||!body.filename.toLowerCase().endsWith('.pdf'))throw new Error('Choose a PDF up to 20 MB.');
  const bytes=Buffer.from(body.base64,'base64');if(bytes.length>20*1024*1024)throw new Error('Choose a PDF up to 20 MB.');if(bytes.subarray(0,5).toString()!=='%PDF-')throw new Error('Not a PDF.');
  const hash=createHash('sha256').update(bytes).digest('hex');await mkdir(config.uploads,{recursive:true,mode:0o700});
  const filename=path.join(config.uploads,hash+'.pdf');await writeFile(filename,bytes,{mode:0o600});
  const result=localQuery(config,`SELECT rental_lifecycle_command(${uuid(body.commandId)},'document',${literal({sha256:hash,filename:body.filename,storagePath:`historical-contracts/${hash}.pdf`,byteSize:bytes.length,incomplete:body.incomplete===true})});`) as {recordId:string};
  const map=JSON.parse(await readFile(config.documentMap,'utf8'));map[result.recordId]=filename;await writeFile(config.documentMap,JSON.stringify(map),{mode:0o600});return {documentId:result.recordId};
 }
 const allowed=['manual_reservation','install','return','swap','legacy_return','legacy_swap','terms','settlement','end_rental','cancel_rental','sale','asset_status','link_agreement','backfill_history','allocate_payment','void_allocation','confirm_agreement'];
 if(body.action==='booking_command'){
  if(!['allocate','confirm','cancel','condition','complete_purchase','accept_purchase'].includes(String(body.operation)))throw new Error('Unsupported booking operation.');
  localQuery(config,`SELECT booking_command(${uuid(body.commandId)},'${body.operation}',${literal(body.record||{})});`);
  return {workspace:await localWorkspace(config)};
 }
 if(body.action!=='lifecycle_command'||!allowed.includes(String(body.operation)))throw new Error('Unsupported local history operation.');
 localQuery(config,`SELECT rental_lifecycle_command(${uuid(body.commandId)},'${body.operation}',${literal(body.record||{})});`);
 return {workspace:await localWorkspace(config)};
}
