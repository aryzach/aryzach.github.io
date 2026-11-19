import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PGlite} from '@electric-sql/pglite';
import {installationOffer,installationOfferError,FEBRUARY_INSTALLATION} from '../supabase/functions/_shared/installationOffers.ts';
import {getMonthlyPrice,getInstallFee} from '../supabase/functions/_shared/pricing.ts';
test('36 month normal and February tiers cover standard traditional families without adding infrared offers',()=>{
 for(const id of ['indoor_traditional_standard','outdoor_traditional_standard']) {
 assert.deepEqual(installationOffer(id,36,null),{monthly:300,installFee:0});
 assert.equal(getMonthlyPrice(id,36),300);assert.equal(getInstallFee(id,36),0);
 assert.deepEqual(installationOffer(id,12,FEBRUARY_INSTALLATION),{monthly:400,installFee:0});
 assert.deepEqual(installationOffer(id,24,FEBRUARY_INSTALLATION),{monthly:300,installFee:0});
 assert.equal(installationOfferError(id,24,FEBRUARY_INSTALLATION,'2027-02-28'),null);
 }
 assert.equal(getMonthlyPrice('indoor_infrared_standard',36),null);
 assert.equal(installationOffer('outdoor_infrared_standard',12,FEBRUARY_INSTALLATION),null);
});
test('pricing migration adds four 36-month tiers without replacing normal or infrared pricing',async()=>{
 const db=new PGlite();try{
 await db.exec(`CREATE TABLE sauna_types(id text primary key,style text);CREATE TABLE pricing_tiers(sauna_type_id text,commitment_months int,monthly_price int,install_fee int,updated_at timestamptz,primary key(sauna_type_id,commitment_months),constraint pricing_tiers_commitment_months_check CHECK(commitment_months IN(1,3,6,12,24)));INSERT INTO sauna_types VALUES ('indoor_traditional_standard','traditional'),('outdoor_traditional_standard','traditional'),('indoor_traditional_original','traditional'),('outdoor_traditional_original','traditional'),('indoor_infrared_standard','infrared');INSERT INTO pricing_tiers VALUES('indoor_traditional_standard',12,500,0,now()),('indoor_infrared_standard',12,500,0,now());`);
 await db.exec(readFileSync('supabase/migrations/20261119023728_traditional_installation_offers.sql','utf8'));
 assert.equal((await db.query('select * from pricing_tiers where commitment_months=36')).rows.length,4);
 assert.deepEqual((await db.query('select monthly_price from pricing_tiers where commitment_months=12')).rows,[{monthly_price:500},{monthly_price:500}]);
 }finally{await db.close();}
});

test('family migration leaves only requested terms and prices while preserving standard traditional rows',async()=>{
 const db=new PGlite();try{
 await db.exec(`CREATE TABLE pricing_tiers(sauna_type_id text,commitment_months int,monthly_price int,install_fee int,badge text,updated_at timestamptz,primary key(sauna_type_id,commitment_months));
 INSERT INTO pricing_tiers SELECT id,months,999,500,'old',now() FROM (VALUES('indoor_infrared_standard'),('outdoor_infrared_standard'),('indoor_traditional_original'),('outdoor_traditional_original'),('indoor_traditional_standard')) x(id) CROSS JOIN(VALUES(1),(3),(6),(12),(24),(36))m(months);`);
 await db.exec(readFileSync('supabase/migrations/20261119030248_family_rental_rates.sql','utf8'));
 const rows=(await db.query('select * from pricing_tiers')).rows as {sauna_type_id:string;commitment_months:number;monthly_price:number;install_fee:number}[];
 assert.equal(rows.filter(r=>r.sauna_type_id==='indoor_traditional_standard').length,6);
 for(const id of ['indoor_infrared_standard','outdoor_infrared_standard','indoor_traditional_original','outdoor_traditional_original']){
 const family=rows.filter(r=>r.sauna_type_id===id).sort((a,b)=>a.commitment_months-b.commitment_months);
 assert.deepEqual(family.map(r=>r.commitment_months),[6,12,24]);
 assert.deepEqual(family.map(r=>r.monthly_price),id==='indoor_infrared_standard'?[300,200,150]:[400,300,200]);
 assert.ok(family.every(r=>r.install_fee===0));
 }
 }finally{await db.close();}
});
