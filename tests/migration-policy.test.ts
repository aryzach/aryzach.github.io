import test from 'node:test';
import assert from 'node:assert/strict';
import { readMigrationPolicy, migrationHandler, stagingEgressAllowed, type MigrationPolicy } from '../supabase/functions/_shared/migrationPolicy.ts';
const destination = 'https://vtmzagwocvgezbniewnu.supabase.co';
const policy = (state: MigrationPolicy['state'], hash = ''): MigrationPolicy => ({ state, backendUrl: destination, testKeySha256: hash });
const binding = (values: Record<string, string>) => (name: string) => values[name];

test('owned destination defaults to staged; invalid explicit states fail closed', () => {
  assert.equal(readMigrationPolicy(binding({ SUPABASE_URL: destination })).state, 'staged');
  assert.equal(readMigrationPolicy(binding({ SUPABASE_URL: destination, SF_MIGRATION_STATE: 'activate' })).state, 'fenced');
  assert.equal(readMigrationPolicy(binding({ SUPABASE_URL: 'https://vwpeuejdgyjcwcymzjxt.supabase.co' })).state, 'active');
});

test('staged requests cannot reach a writer without the separate test credential', async () => {
  let writes = 0;
  const handler = migrationHandler(() => { writes++; return new Response('unexpected'); }, () => policy('staged'));
  const response = await handler(new Request(destination + '/functions/v1/reservation-create', { method: 'POST', body: '{}' }));
  assert.equal(response.status, 503); assert.equal(writes, 0);
  assert.equal(response.headers.get('Retry-After'), '60');
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
});

test('test access uses a hashed credential and a fence cannot be bypassed with it', async () => {
  const token = 'local-unit-test-only';
  const hash = Buffer.from(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token))).toString('hex');
  let calls = 0;
  const request = () => new Request(destination, { headers: { 'x-sf-migration-test-key': token } });
  const staged = migrationHandler(() => { calls++; return new Response('ok'); }, () => policy('staged', hash));
  assert.equal((await staged(request())).status, 200); assert.equal(calls, 1);
  const fenced = migrationHandler(() => { calls++; return new Response('unexpected'); }, () => policy('fenced', hash));
  assert.equal((await fenced(request())).status, 503); assert.equal(calls, 1);
  const wrong = migrationHandler(() => { calls++; return new Response('unexpected'); }, () => policy('staged', '0'.repeat(64)));
  assert.equal((await wrong(request())).status, 503); assert.equal(calls, 1);
});

test('staging permits only HTTPS calls to its own backend and rejects paid/provider effects', () => {
  for (const url of ['https://api.stripe.com/v1/payment_intents', 'https://api.resend.com/emails', 'https://graph.facebook.com/events', 'https://identity.xero.com/connect/token', 'https://api.xero.com/api.xro/2.0/Invoices', 'https://cal.com/book', 'https://vwpeuejdgyjcwcymzjxt.supabase.co/rest/v1/reservations', 'http://vtmzagwocvgezbniewnu.supabase.co/rest/v1/reservations', 'https://vtmzagwocvgezbniewnu.supabase.co.attacker.invalid/rest/v1/reservations']) {
    assert.equal(stagingEgressAllowed(url, policy('staged')), false);
  }
  assert.equal(stagingEgressAllowed(destination + '/rest/v1/reservations', policy('staged')), true);
  assert.equal(stagingEgressAllowed(destination + '/storage/v1/object/test', policy('staged')), true);
  assert.equal(stagingEgressAllowed('https://api.stripe.com/v1/payment_intents', policy('active')), true);
});

test('active mode preserves original authorization and CORS, including preflight', async () => {
  const handler = migrationHandler(() => new Response('denied', { status: 403 }), () => policy('active'));
  assert.equal((await handler(new Request(destination, { method: 'OPTIONS' }))).status, 403);
});

test('health remains readable in staging while business routes stay closed', async () => {
  const health = migrationHandler(() => new Response('ok'), () => policy('staged'), true);
  assert.equal((await health(new Request(destination + '/functions/v1/health'))).status, 200);
  assert.equal((await health(new Request(destination + '/functions/v1/health', { method: 'POST' }))).status, 503);
});
