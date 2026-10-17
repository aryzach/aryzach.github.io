import { verifyCalSignature } from './calWebhookSecurity.ts';
const assert = (value: boolean) => { if (!value) throw new Error('Assertion failed'); };
const body = 'The quick brown fox jumps over the lazy dog';
const signature = 'f7bc83f430538424b13298e6aa6fb143ef4d59a14946175997479dbc2d1a3cd8';

Deno.test('booking verification rejects missing credentials and malformed signatures', async () => {
  assert(!await verifyCalSignature(body, signature, undefined));
  assert(!await verifyCalSignature(body, signature, ''));
  assert(!await verifyCalSignature(body, null, 'key'));
  for (const invalid of ['', 'sha256=', signature.slice(1), signature + '0', 'g'.repeat(64)]) {
    assert(!await verifyCalSignature(body, invalid, 'key'));
  }
});

Deno.test('booking verification accepts the known HMAC vector in both supported header formats', async () => {
  assert(await verifyCalSignature(body, signature, 'key'));
  assert(await verifyCalSignature(body, 'sha256=' + signature, 'key'));
  assert(await verifyCalSignature(body, ' SHA256=' + signature.toUpperCase() + ' ', 'key'));
});

Deno.test('booking verification rejects changed payloads and incorrect secrets', async () => {
  assert(!await verifyCalSignature(body + '.', signature, 'key'));
  assert(!await verifyCalSignature(body, signature, 'wrong'));
});
