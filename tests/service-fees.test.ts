import test from 'node:test';
import assert from 'node:assert/strict';
import { DELIVERY_FEE_OUTSIDE_SF as clientFee } from '../src/lib/generatedPricing.ts';
import { getDeliveryFee as serverDelivery } from '../supabase/functions/_shared/pricing.ts';
import { DELIVERY_FEE_TERMS, STAIR_ELEVATOR_TERMS } from '../supabase/functions/_shared/serviceFeePolicy.ts';

test('client and server quote the new outside-SF base delivery fee for existing and new pricing policies', () => {
  assert.equal(clientFee, 200);
  for (const fee of [serverDelivery]) {
    assert.equal(fee('San Francisco'), 0);
    assert.equal(fee('SF'), 0);
    assert.equal(fee('Alameda'), 200);
    assert.equal(fee('San Mateo'), 200);
    assert.equal(fee('South San Francisco'), 200);
    assert.equal(fee('South SF'), 200);
    assert.equal(fee('San Francisco, CA'), 0);
  }
});

test('contract fee terms disclose distance surcharge and partial stair increments', () => {
  assert.ok(DELIVERY_FEE_TERMS.includes('beyond 50 miles ($400 total)'));
  assert.ok(STAIR_ELEVATOR_TERMS.includes('$150 for 1-15 stairs or elevator access'));
  assert.ok(STAIR_ELEVATOR_TERMS.includes('16-30 stairs: $250; 31-45 stairs: $350'));
});
