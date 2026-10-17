/** Migration controls: a destination deployment stays inert until explicitly activated. */
export type MigrationState = 'active' | 'staged' | 'fenced';
export type MigrationPolicy = {
  state: MigrationState;
  backendUrl: string;
  testKeySha256: string;
};
type Handler = (request: Request) => Response | Promise<Response>;
type Bindings = (name: string) => string | undefined;
const DESTINATION_HOST = 'vtmzagwocvgezbniewnu.supabase.co';

export function readMigrationPolicy(binding: Bindings): MigrationPolicy {
  const backendUrl = binding('SUPABASE_URL') || '';
  const configured = binding('SF_MIGRATION_STATE');
  let destination = false;
  try { destination = new URL(backendUrl).hostname === DESTINATION_HOST; } catch { /* Invalid bindings cannot permit staging egress. */ }
  const state: MigrationState = configured === undefined
    ? (destination ? 'staged' : 'active')
    : configured === 'active' || configured === 'staged' || configured === 'fenced'
    ? configured : 'fenced';
  return { state, backendUrl, testKeySha256: binding('SF_MIGRATION_TEST_KEY_SHA256') || '' };
}

async function validTestKey(request: Request, expected: string): Promise<boolean> {
  const key = request.headers.get('x-sf-migration-test-key');
  if (!key || key.length > 1024 || !/^[a-f0-9]{64}$/.test(expected)) return false;
  const bytes = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(key)));
  const actual = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
  let different = 0;
  for (let i = 0; i < expected.length; i++) different |= actual.charCodeAt(i) ^ expected.charCodeAt(i);
  return different === 0;
}

export function migrationHandler(handler: Handler, policy: () => MigrationPolicy, health = false): Handler {
  return async request => {
    const current = policy();
    if (health && ['GET', 'HEAD', 'OPTIONS'].includes(request.method)) return handler(request);
    if (current.state === 'active') return handler(request);
    if (request.method === 'OPTIONS') return new Response(null, { headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-admin-password, x-accounting-password, x-sf-migration-test-key',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    } });
    if (current.state === 'staged' && await validTestKey(request, current.testKeySha256)) {
      return handler(request);
    }
    return new Response(JSON.stringify({ error: 'Service temporarily unavailable. Reload the website before retrying.' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Retry-After': '60', 'Cache-Control': 'no-store' },
    });
  };
}

export function stagingEgressAllowed(input: string | URL | Request, policy: MigrationPolicy): boolean {
  if (policy.state === 'active') return true;
  try {
    const url = new URL(input instanceof Request ? input.url : input);
    const backend = new URL(policy.backendUrl);
    return url.protocol === 'https:' && !url.username && !url.password &&
      backend.protocol === 'https:' && url.origin === backend.origin;
  } catch { return false; }
}

let egressGuardInstalled = false;
export function installStagingEgressGuard(policy: () => MigrationPolicy): void {
  if (egressGuardInstalled || policy().state === 'active') return;
  const nativeFetch = globalThis.fetch.bind(globalThis);
  globalThis.fetch = (input, init) => {
    const current = policy();
    if (!stagingEgressAllowed(input, current)) return Promise.reject(new Error('Outbound integration disabled during migration staging'));
    return nativeFetch(input, current.state === 'active' ? init : { ...init, redirect: 'error' });
  };
  egressGuardInstalled = true;
}

export function serveWithMigrationPolicy(handler: Handler, options: { health?: boolean } = {}) {
  const policy = () => readMigrationPolicy(name => Deno.env.get(name));
  installStagingEgressGuard(policy);
  return Deno.serve(migrationHandler(handler, policy, options.health));
}
