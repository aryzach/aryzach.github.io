// Provider requests use the immutable payload and key returned by the database
// claim. A timeout retains the operation for safe retry and reconciliation.
export interface EmailDispatchStore {
  rpc(name: string, args: Record<string, unknown>): PromiseLike<{
    data: unknown; error: unknown;
  }>;
}
export interface EmailDispatchResult {
  ok: boolean;
  skipped?: boolean;
  pending?: boolean;
  review?: boolean;
  error?: string;
  resend_id?: string;
}
export type EmailTransport = (url: string, options: {
  method: "POST"; redirect: "error"; signal: AbortSignal;
  headers: Record<string, string>; body: string;
}) => Promise<Response>;
interface Claim {
  decision: 'sent' | 'busy' | 'review' | 'send';
  dispatch_id?: string;
  lease_token?: string;
  payload_json?: string;
  idempotency_key?: string;
  provider_email_id?: string;
  retry_before?: string;
}

export async function dispatchReservationEmail(
  store: EmailDispatchStore,
  input: { reservationId: string; emailType: string; payload: Record<string, unknown>;
    apiKey: string; force?: boolean; operationId?: string },
  send: EmailTransport = fetch,
): Promise<EmailDispatchResult> {
  let claim: Claim;
  try {
    const result = await store.rpc('claim_reservation_email', {
      p_reservation_id: input.reservationId, p_email_type: input.emailType,
      p_payload_json: JSON.stringify(input.payload), p_force: !!input.force,
      p_operation_id: input.operationId ?? null,
    });
    if (result.error || !result.data) return { ok: false, error: 'Could not durably prepare email' };
    claim = result.data as Claim;
  } catch {
    return { ok: false, error: 'Could not durably prepare email' };
  }
  if (claim.decision === 'sent') return { ok: true, skipped: true, resend_id: claim.provider_email_id ?? undefined };
  if (claim.decision === 'busy') return { ok: true, pending: true };
  if (claim.decision === 'review') return { ok: false, review: true, error: 'Email delivery requires provider reconciliation before another send' };
  if (claim.decision !== 'send' || !claim.dispatch_id || !claim.lease_token ||
      !claim.payload_json || !claim.idempotency_key || !claim.retry_before ||
      !Number.isFinite(Date.parse(claim.retry_before))) {
    return { ok: false, error: 'Invalid durable email claim' };
  }

  let outcome: 'sent' | 'retryable' | 'review' = 'retryable';
  let providerId: string | null = null;
  let failure: string | null = null;
  try {
    if (Date.now() + 20000 >= Date.parse(claim.retry_before)) {
      outcome = 'review';
      throw new Error('Expired provider retry window');
    }
    const response = await send('https://api.resend.com/emails', {
      method: 'POST', redirect: 'error', signal: AbortSignal.timeout(20000),
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${input.apiKey}`,
        'Idempotency-Key': claim.idempotency_key },
      body: claim.payload_json,
    });
    // Do not persist a provider error body, which may contain submitted PII.
    const body = await response.json().catch(() => null);
    if (response.ok && typeof body?.id === 'string' && body.id.length > 0) {
      outcome = 'sent';
      providerId = body.id;
    } else if (response.ok) {
      failure = 'Provider accepted request without a usable receipt; retry same operation';
    } else {
      const retryable = response.status >= 500 || response.status === 429 ||
        (response.status === 409 && body?.name === 'concurrent_idempotent_requests');
      outcome = retryable ? 'retryable' : 'review';
      failure = `Email provider returned HTTP ${response.status}`;
    }
  } catch {
    failure = outcome === 'review' ? 'Email retry window requires provider reconciliation'
      : 'Email request outcome uncertain; retry same operation';
  }
  try {
    const receipt = await store.rpc('finish_reservation_email', {
      p_dispatch_id: claim.dispatch_id, p_lease_token: claim.lease_token,
      p_outcome: outcome, p_provider_email_id: providerId, p_error: failure,
    });
    if (receipt.error || receipt.data !== true) {
      return { ok: false, error: 'Email receipt not committed; durable operation retained for reconciliation' };
    }
  } catch {
    return { ok: false, error: 'Email receipt not committed; durable operation retained for reconciliation' };
  }
  return outcome === 'sent' ? { ok: true, resend_id: providerId! }
    : { ok: false, review: outcome === 'review', error: failure! };
}
