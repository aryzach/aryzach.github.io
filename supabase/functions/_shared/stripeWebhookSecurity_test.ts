import { verifyStripeSignature } from './stripeWebhookSecurity.ts';
const assert = (value: boolean) => { if (!value) throw new Error('Assertion failed'); };
const payload = '{"id":"evt_test"}';
const signature = '55a2a2f30c7415c6cfb09bd0320d76224e8e8885b2693a3b3e8d5a4f32dc78a8';
const header = `t=1700000000,v1=${signature}`;

Deno.test('Stripe verification accepts a known HMAC and key-rotation signatures', async () => {
  assert(await verifyStripeSignature(payload, header, 'whsec_test-only', 1700000000));
  assert(await verifyStripeSignature(payload, `t=1700000000,v1=${'0'.repeat(64)},v1=${signature}`, 'whsec_test-only', 1700000001));
  assert(await verifyStripeSignature(payload, `t=1700000000,v1=${signature},v1=${'0'.repeat(64)}`, 'whsec_test-only', 1700000001));
});

Deno.test('Stripe verification rejects stale or future deliveries and malformed timestamps', async () => {
  assert(!await verifyStripeSignature(payload, header, 'whsec_test-only', 1700000301));
  assert(!await verifyStripeSignature(payload, header, 'whsec_test-only', 1699999699));
  for (const invalid of [`t=no,v1=${signature}`, `t=1700000000,t=1700000000,v1=${signature}`, `v1=${signature}`, 't=1700000000,v1=bad']) {
    assert(!await verifyStripeSignature(payload, invalid, 'whsec_test-only', 1700000000));
  }
});

Deno.test('Stripe verification rejects missing credentials, changed bodies and wrong secrets', async () => {
  assert(!await verifyStripeSignature(payload, header, undefined, 1700000000));
  assert(!await verifyStripeSignature(payload, null, 'whsec_test-only', 1700000000));
  assert(!await verifyStripeSignature(payload + ' ', header, 'whsec_test-only', 1700000000));
  assert(!await verifyStripeSignature(payload, header, 'wrong', 1700000000));
});
