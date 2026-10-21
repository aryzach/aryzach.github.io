import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { rentalCommercialTerms, unansweredOptions, standardTraditionalTier, PREMIUM_BENEFITS, upfrontEligible, type RentalChoices } from '../supabase/functions/_shared/rentalTerms.ts';
import { getMonthlyPrice, getInstallFee } from '../supabase/functions/_shared/pricing.ts';
import { customerLtv } from '../src/lib/customerLtv.ts';
import { emptyRentalWorkspace } from '../src/lib/rentalModel.ts';
import { emptyLifecycle } from '../src/lib/lifecycleModel.ts';

const no: RentalChoices = { insurance_selected: false, second_heater_selected: false, pay_upfront_selected: false, premium_selected: false };
const rows = [[1,1200,500],[3,800,500],[6,600,500],[12,500,0],[24,300,0]];
test('every Traditional term and every option combination uses the same cent-exact policy', () => {
  for (const id of ['indoor_traditional_standard','outdoor_traditional_standard']) for (const [months,monthly,installation] of rows) {
    assert.deepEqual(standardTraditionalTier(id, months), {monthly,installFee:installation});
    assert.equal(getMonthlyPrice(id,months), monthly); assert.equal(getInstallFee(id,months),installation);
    for (let mask=0;mask<16;mask++) {
      const choices={insurance_selected:!!(mask&1),second_heater_selected:!!(mask&2),pay_upfront_selected:!!(mask&4),premium_selected:!!(mask&8)};
      if (choices.pay_upfront_selected && !upfrontEligible(months)) {
        assert.throws(()=>rentalCommercialTerms({monthly,months,choices}),/12- or 24-month/); continue;
      }
      const t=rentalCommercialTerms({monthly,months,choices,installation,delivery:150,securityDeposit:1500,stairs:50});
      const extras=(choices.insurance_selected?2000:0)+(choices.second_heater_selected?20000:0)+(choices.premium_selected?10000:0);
      const baseSavings=choices.pay_upfront_selected?monthly*months*10:0;
      const addonSavings=choices.pay_upfront_selected?extras*months/10:0;
      const savings=baseSavings+addonSavings+(choices.pay_upfront_selected?2000:0);
      assert.equal(t.upfront_savings_cents,savings); assert.equal(t.initial_rental_cents,monthly*months*100-baseSavings);
      assert.equal(t.initial_commitment_cents,monthly*months*100-baseSavings+extras*months-addonSavings);
      assert.equal(t.monthly_addons_cents,extras);assert.equal(t.renewal_monthly_cents,monthly*100+extras);
      assert.equal(t.initial_recurring_cents,choices.pay_upfront_selected?0:monthly*100+extras);
      assert.equal(t.base_rent_due_on_delivery_cents,choices.pay_upfront_selected?t.initial_rental_cents:Math.min(2,months)*monthly*100);
      assert.equal(t.installation_cents,installation*100);assert.equal(t.delivery_cents,15000);assert.equal(t.security_deposit_cents,150000);assert.equal(t.stair_charge_cents,5000);
      assert.deepEqual(t.premium_benefits,choices.premium_selected?PREMIUM_BENEFITS:[]);
    }
  }
});
test('all four choices require explicit booleans including No; invalid input cannot bypass API validation',()=>{
  assert.deepEqual(unansweredOptions(no),[]);
  for(const key of Object.keys(no)) for(const value of [null,undefined,'false',0]){
    const choices={...no,[key]:value} as RentalChoices;
    assert.equal(unansweredOptions(choices).length,1);
    assert.throws(()=>rentalCommercialTerms({monthly:500,months:12,choices}),/Choose Yes or No/);
  }
  assert.throws(()=>rentalCommercialTerms({monthly:-1,months:12,choices:no}));
  assert.throws(()=>rentalCommercialTerms({monthly:500,months:0,choices:no}));
});
test('existing bookings retain legacy or frozen catalog prices, while other sauna models remain unchanged',()=>{
  for(const id of ['indoor_traditional_standard','outdoor_traditional_standard']){
    assert.equal(getMonthlyPrice(id,12,1),400);assert.equal(getInstallFee(id,6,1),0);
    const frozen={[id]:{12:{monthly:425,installFee:75}}};
    assert.equal(getMonthlyPrice(id,12,1,frozen),425);assert.equal(getInstallFee(id,12,1,frozen),75);
  }
  assert.equal(getMonthlyPrice('indoor_infrared_standard',12),200);
  assert.equal(getMonthlyPrice('outdoor_infrared_standard',12),300);
  assert.equal(getMonthlyPrice('indoor_traditional_original',12),300);
});
test('upfront discount includes recurring add-ons, delivery, access and tax but excludes install and security',()=>{
  const t=rentalCommercialTerms({monthly:333.33,months:12,choices:{...no,pay_upfront_selected:true,premium_selected:true},installation:500,securityDeposit:1500,delivery:150,stairs:50,taxes:123.45});
  assert.equal(t.base_initial_cents,399996);assert.equal(t.upfront_base_savings_cents,40000);assert.equal(t.upfront_addon_savings_cents,12000);
  assert.equal(t.initial_rental_cents,359996);assert.equal(t.initial_prepaid_recurring_cents,467996);
  assert.equal(t.initial_recurring_cents,0);assert.equal(t.renewal_monthly_cents,43333);
  assert.equal(t.initial_commitment_cents,467996);assert.equal(t.upfront_savings_cents,55235);
  assert.equal(t.installation_cents,50000);assert.equal(t.security_deposit_cents,150000);
  assert.equal(t.discounted_delivery_cents,13500);assert.equal(t.discounted_stair_charge_cents,4500);assert.equal(t.discounted_tax_cents,11110);
  assert.equal(t.known_upfront_total_cents,697106);
});
test('signed initial contract value includes discount and Premium without altering existing legacy LTV',()=>{
  const state=emptyRentalWorkspace();state.lifecycle=emptyLifecycle();
  state.lifecycle.rentals.push({id:'r',customer_id:'c',lifecycle_state:'planned',purpose:'rental'} as never);
  const commercial=rentalCommercialTerms({monthly:500,months:12,choices:{...no,pay_upfront_selected:true,premium_selected:true}});
  state.lifecycle.agreements.push({id:'a',rental_id:'r',signing_state:'signed',source_terms:{commercialTerms:commercial}} as never);
  state.lifecycle.terms.push({id:'t',rental_id:'r',agreement_id:'a',source:'Signed in-app agreement',state:'planned',minimum_months:12,base_monthly_cents:50000,extras:[{name:'SF Sauna Premium',amountCents:10000}],currency:'USD'} as never);
  assert.equal(customerLtv(state,'c').committed,648000);
  state.lifecycle.agreements[0].source_terms={};assert.equal(customerLtv(state,'c').committed,720000);
});
test('rollout snapshots every existing booking before changing defaults and never rewrites contracts',()=>{
  const migration=readFileSync(new URL('../supabase/migrations/20261021010000_future_booking_rental_terms.sql',import.meta.url),'utf8');
  assert.ok(migration.indexOf('ADD COLUMN rental_pricing_snapshot')<migration.indexOf('SET DEFAULT 2'));
  assert.match(migration,/DEFAULT 1/);assert.match(migration,/LOCK TABLE public.reservations IN ACCESS EXCLUSIVE MODE/);
  assert.doesNotMatch(migration,/UPDATE\s+(?:public\.)?contracts/i);
  assert.doesNotMatch(migration,/UPDATE\s+(?:public\.)?reservations\s+SET/i);
  const lifecycle=readFileSync(new URL('../supabase/migrations/20261021011000_capture_future_rental_commercial_terms.sql',import.meta.url),'utf8');
  assert.doesNotMatch(lifecycle,/FOR c IN SELECT|DO \$\$/);assert.match(lifecycle,/IF NOT EXISTS\(SELECT 1 FROM rental_terms WHERE agreement_id=aid\)/);
});

test('unknown access charges and tax remain unknown instead of being treated as confirmed zero',()=>{
 const t=rentalCommercialTerms({monthly:500,months:12,choices:{...no,pay_upfront_selected:true}});
 assert.equal(t.discounted_tax_cents,null);assert.equal(t.discounted_stair_charge_cents,null);
 assert.equal(t.upfront_discount_scope,'all_except_installation_and_security_deposit');
});
