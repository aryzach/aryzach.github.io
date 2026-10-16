-- REVIEW ONLY. Not in either migration directory; do not auto-apply.
-- New integration metadata only. No changes to existing business tables.
BEGIN;
CREATE TABLE public.xero_oauth_sessions (
  state_hash text PRIMARY KEY,
  verifier_ciphertext text NOT NULL,
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.xero_oauth_connection (
  id text PRIMARY KEY CHECK (id = 'primary'),
  token_ciphertext text NOT NULL,
  access_expires_at timestamptz NOT NULL,
  granted_scopes text[] NOT NULL,
  tenants jsonb NOT NULL DEFAULT '[]'::jsonb,
  selected_tenant_id uuid,
  refresh_nonce uuid,
  refresh_locked_until timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.xero_oauth_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xero_oauth_connection ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.xero_oauth_sessions, public.xero_oauth_connection FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.xero_oauth_sessions, public.xero_oauth_connection TO service_role;
-- No client policies. Tokens and PKCE verifiers are AES-GCM encrypted by the functions.
-- Atomic session claiming consumes a single-use OAuth state without returning the verifier publicly.
CREATE FUNCTION public.claim_xero_oauth_session(p_hash text)
RETURNS SETOF public.xero_oauth_sessions LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.xero_oauth_sessions SET consumed_at = now()
  WHERE state_hash = p_hash AND consumed_at IS NULL AND expires_at > now()
  RETURNING *;
$$;
CREATE FUNCTION public.lock_xero_refresh(p_nonce uuid)
RETURNS SETOF public.xero_oauth_connection LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.xero_oauth_connection
  SET refresh_nonce = p_nonce, refresh_locked_until = now() + interval '60 seconds'
  WHERE id = 'primary' AND (refresh_locked_until IS NULL OR refresh_locked_until < now())
  RETURNING *;
$$;
REVOKE ALL ON FUNCTION public.claim_xero_oauth_session(text), public.lock_xero_refresh(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_xero_oauth_session(text), public.lock_xero_refresh(uuid) TO service_role;
COMMIT;
