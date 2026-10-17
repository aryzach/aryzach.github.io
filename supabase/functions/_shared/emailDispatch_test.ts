import { dispatchReservationEmail, type EmailDispatchStore, type EmailTransport } from './emailDispatch.ts';
const assert = (value: unknown, message = 'Assertion failed') => { if (!value) throw new Error(message); };
const input = { reservationId: 'fixture-reservation', emailType: 'payment_received',
  payload: { to: ['changed@example.invalid'], subject: 'new rendering' }, apiKey: 'fixture-only' };
const storedPayload = '{"to":["fixture@example.invalid"],"subject":"original rendering"}';
function storeFor(decision: string, finishResult: unknown = true, retryBefore = new Date(Date.now() + 3600000).toISOString()) {
  const calls: { name: string; args: Record<string, unknown> }[] = [];
  const store: EmailDispatchStore = { rpc(name, args) {
    calls.push({ name, args });
    return Promise.resolve({ error: null, data: name === 'claim_reservation_email'
      ? { decision, dispatch_id: 'fixture-dispatch', lease_token: 'fixture-lease',
        retry_before: retryBefore,
        payload_json: storedPayload, idempotency_key: 'fixture-stable-key', provider_email_id: 'historical-receipt' }
      : finishResult });
  } };
  return { store, calls };
}
const neverSend = (() => { throw new Error('Unexpected provider call'); }) as EmailTransport;

Deno.test('Email claim delayed past its provider retry deadline never calls provider', async () => {
  const { store, calls } = storeFor('send', true, new Date(Date.now() - 1).toISOString());
  const result = await dispatchReservationEmail(store, input, neverSend);
  assert(!result.ok && calls[1].args.p_outcome === 'review');
});

Deno.test('Email sends the durable original payload and key, then commits provider receipt', async () => {
  const { store, calls } = storeFor('send');
  let requests = 0;
  const send = ((url, options) => {
    requests++;
    assert(url === 'https://api.resend.com/emails');
    assert(options?.body === storedPayload);
    assert(new Headers(options?.headers).get('Idempotency-Key') === 'fixture-stable-key');
    assert(options?.redirect === 'error');
    return Promise.resolve(new Response('{"id":"provider-receipt"}', { status: 200 }));
  }) as EmailTransport;
  const result = await dispatchReservationEmail(store, input, send);
  assert(result.ok && result.resend_id === 'provider-receipt' && requests === 1);
  assert(calls[1].args.p_outcome === 'sent' && calls[1].args.p_provider_email_id === 'provider-receipt');
});

Deno.test('Email historical success, active lease, review and failed claim never call provider', async () => {
  for (const decision of ['sent', 'busy', 'review', 'unexpected']) {
    const { store } = storeFor(decision);
    const result = await dispatchReservationEmail(store, input, neverSend);
    assert(result.ok === ['sent', 'busy'].includes(decision));
    if (decision === 'busy') assert(result.pending);
  }
  const store: EmailDispatchStore = { rpc() { return Promise.resolve({ data: null, error: { message: 'database unavailable' } }); } };
  assert(!(await dispatchReservationEmail(store, input, neverSend)).ok);
});

Deno.test('Email timeout retains a retryable operation and does not claim delivery', async () => {
  const { store, calls } = storeFor('send');
  const send = (() => Promise.reject(new Error('fixture timeout containing private data'))) as EmailTransport;
  const result = await dispatchReservationEmail(store, input, send);
  assert(!result.ok);
  assert(calls[1].args.p_outcome === 'retryable');
  assert(!String(calls[1].args.p_error).includes('private data'));
});

Deno.test('Email provider failures distinguish retryable concurrency from review and omit error bodies', async () => {
  for (const [status, name, outcome] of [
    [429, 'rate_limit_exceeded', 'retryable'], [503, 'application_error', 'retryable'],
    [409, 'concurrent_idempotent_requests', 'retryable'],
    [409, 'invalid_idempotent_request', 'review'], [403, 'validation_error', 'review'],
  ] as const) {
    const { store, calls } = storeFor('send');
    const send = (() => Promise.resolve(new Response(JSON.stringify({ name, message: 'private submitted recipient' }), { status }))) as EmailTransport;
    assert(!(await dispatchReservationEmail(store, input, send)).ok);
    assert(calls[1].args.p_outcome === outcome);
    assert(!String(calls[1].args.p_error).includes('private submitted recipient'));
  }
});

Deno.test('Email missing provider receipt or failed database commit remains unresolved', async () => {
  const missing = storeFor('send');
  const badReceipt = (() => Promise.resolve(new Response('{}', { status: 200 }))) as EmailTransport;
  assert(!(await dispatchReservationEmail(missing.store, input, badReceipt)).ok);
  assert(missing.calls[1].args.p_outcome === 'retryable');
  for (const result of [false, null]) {
    const { store } = storeFor('send', result);
    const accepted = (() => Promise.resolve(new Response('{"id":"accepted"}', { status: 200 }))) as EmailTransport;
    assert(!(await dispatchReservationEmail(store, input, accepted)).ok);
  }
});
