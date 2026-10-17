import { installStagingEgressGuard, migrationHandler, readMigrationPolicy,
  stagingEgressAllowed, type MigrationPolicy } from './migrationPolicy.ts';

const assert = (value: unknown) => { if (!value) throw new Error('Assertion failed'); };
const destination = 'https://vtmzagwocvgezbniewnu.supabase.co';
const fixtureKey = 'fixture-only-migration-test-key';
const bytes = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(fixtureKey)));
const fixtureHash = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
const staged: MigrationPolicy = { state: 'staged', backendUrl: destination, testKeySha256: fixtureHash };
const req = (headers: Record<string, string> = {}, method = 'POST') =>
  new Request(destination + '/functions/v1/fixture', { method, headers });

Deno.test('Migration destination defaults staged; invalid state fences; source compatibility is explicit', () => {
  const policy = (values: Record<string, string>) => readMigrationPolicy(name => values[name]);
  assert(policy({ SUPABASE_URL: destination }).state === 'staged');
  assert(policy({ SUPABASE_URL: destination, SF_MIGRATION_STATE: '' }).state === 'fenced');
  assert(policy({ SUPABASE_URL: destination, SF_MIGRATION_STATE: 'typo' }).state === 'fenced');
  assert(policy({ SUPABASE_URL: destination, SF_MIGRATION_STATE: 'fenced' }).state === 'fenced');
  assert(policy({ SUPABASE_URL: destination, SF_MIGRATION_STATE: 'active' }).state === 'active');
  assert(policy({ SUPABASE_URL: 'https://source.example.invalid' }).state === 'active');
});

Deno.test('Migration staging admits only the exact isolated test key and never admits it when fenced', async () => {
  let called = 0;
  const handler = () => { called++; return new Response('fixture'); };
  const guarded = migrationHandler(handler, () => staged);
  for (const headers of [{}, { 'x-sf-migration-test-key': 'wrong' },
    { 'x-sf-migration-test-key': 'a'.repeat(1025) }] as Record<string, string>[]) {
    const response = await guarded(req(headers));
    assert(response.status === 503 && response.headers.get('Cache-Control') === 'no-store');
  }
  assert(called === 0);
  assert((await guarded(req({ 'x-sf-migration-test-key': fixtureKey }))).status === 200);
  assert(called === 1);
  const fenced = migrationHandler(handler, () => ({ ...staged, state: 'fenced' }));
  assert((await fenced(req({ 'x-sf-migration-test-key': fixtureKey }))).status === 503);
  assert(called === 1);
  const invalidHash = migrationHandler(handler, () => ({ ...staged, testKeySha256: 'invalid' }));
  assert((await invalidHash(req({ 'x-sf-migration-test-key': fixtureKey }))).status === 503);
});

Deno.test('Migration health and preflight exceptions cannot invoke a business handler', async () => {
  let calls = 0;
  const handler = () => { calls++; return new Response('fixture'); };
  const health = migrationHandler(handler, () => staged, true);
  assert((await health(req({}, 'GET'))).status === 200);
  assert((await health(req({}, 'HEAD'))).status === 200);
  assert((await health(req())).status === 503);
  assert(calls === 2);
  const business = migrationHandler(handler, () => staged);
  const preflight = await business(req({}, 'OPTIONS'));
  assert(preflight.status === 200 && calls === 2);
  assert((await business(req({}, 'GET'))).status === 503 && calls === 2);
});

Deno.test('Migration staged egress permits only exact HTTPS destination origin', () => {
  assert(stagingEgressAllowed(destination + '/rest/v1/fixture', staged));
  assert(stagingEgressAllowed(new Request(destination + '/storage/v1/fixture'), staged));
  for (const url of ['http://vtmzagwocvgezbniewnu.supabase.co/rest/v1/fixture',
    destination + ':8443/fixture', 'https://user:password@vtmzagwocvgezbniewnu.supabase.co/fixture',
    'https://vtmzagwocvgezbniewnu.supabase.co.example.invalid/fixture',
    'https://api.stripe.com/v1/fixture', 'https://api.resend.com/emails',
    'https://api.xero.com/fixture', 'https://source.example.invalid/fixture', 'invalid']) {
    assert(!stagingEgressAllowed(url, staged));
  }
  assert(!stagingEgressAllowed(destination, { ...staged, backendUrl: 'invalid' }));
});

Deno.test('Migration fetch guard blocks provider calls and destination redirects without network access', async () => {
  const original = globalThis.fetch;
  const requests: { input: string | URL | Request; init?: RequestInit }[] = [];
  globalThis.fetch = ((input: string | URL | Request, init?: RequestInit) => {
    requests.push({ input, init });
    return Promise.resolve(new Response('fixture'));
  }) as typeof fetch;
  let policy = { ...staged };
  try {
    installStagingEgressGuard(() => policy);
    let denied = false;
    try { await fetch('https://api.resend.com/emails'); } catch { denied = true; }
    assert(denied && requests.length === 0);
    await fetch(destination + '/rest/v1/fixture', { redirect: 'follow' });
    assert(requests.length === 1 && requests[0].init?.redirect === 'error');
    policy = { ...staged, state: 'fenced' };
    denied = false;
    try { await fetch('https://api.xero.com/fixture'); } catch { denied = true; }
    assert(denied && requests.length === 1);
    policy = { ...staged, state: 'active' };
    await fetch('https://api.resend.com/emails', { redirect: 'manual' });
    assert(requests.length === 2 && requests[1].init?.redirect === 'manual');
  } finally {
    globalThis.fetch = original;
  }
});
