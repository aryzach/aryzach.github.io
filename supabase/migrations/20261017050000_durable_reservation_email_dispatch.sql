-- Store the exact provider request before sending. Client roles cannot read
-- these payloads, which contain customer details and private reservation links.
CREATE TABLE public.reservation_email_dispatches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operation_key text NOT NULL UNIQUE,
  operation_aliases text[] NOT NULL DEFAULT '{}',
  reservation_id uuid NOT NULL REFERENCES public.reservations(id),
  email_type text NOT NULL CHECK (email_type IN ('reservation_created', 'payment_received')),
  payload_json text NOT NULL CHECK (jsonb_typeof(payload_json::jsonb) = 'object'),
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'sending', 'retryable', 'sent', 'review')),
  first_attempt_at timestamptz,
  lease_token uuid,
  lease_expires_at timestamptz,
  attempt_count integer NOT NULL DEFAULT 0,
  provider_email_id text,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.reservation_email_dispatches ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.reservation_email_dispatches FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.reservation_email_dispatches TO service_role;
CREATE INDEX reservation_email_dispatches_pending_idx
  ON public.reservation_email_dispatches (reservation_id, email_type, created_at)
  WHERE status <> 'sent';
ALTER TABLE public.reservation_email_events ADD COLUMN dispatch_id uuid
  REFERENCES public.reservation_email_dispatches(id);
CREATE UNIQUE INDEX reservation_email_events_dispatch_sent_idx
  ON public.reservation_email_events (dispatch_id)
  WHERE dispatch_id IS NOT NULL AND delivery_status = 'sent';

CREATE FUNCTION public.claim_reservation_email(
  p_reservation_id uuid, p_email_type text, p_payload_json text,
  p_force boolean DEFAULT false, p_operation_id uuid DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  dispatch public.reservation_email_dispatches%ROWTYPE;
  operation text;
  prior_provider_id text;
  request_body jsonb;
  claimed_at timestamptz;
BEGIN
  IF p_email_type NOT IN ('reservation_created', 'payment_received') OR p_email_type IS NULL THEN
    RAISE EXCEPTION 'Invalid email type';
  END IF;
  request_body := p_payload_json::jsonb;
  IF jsonb_typeof(request_body) <> 'object'
    OR jsonb_typeof(request_body->'to') IS DISTINCT FROM 'array'
    OR jsonb_array_length(request_body->'to') <> 1
    OR coalesce(request_body->>'from', '') = ''
    OR coalesce(request_body->>'subject', '') = ''
    OR coalesce(request_body->'to'->>0, '') = '' THEN
    RAISE EXCEPTION 'Invalid email payload';
  END IF;
  -- Serialize preparation for one reservation, including explicit admin resends.
  PERFORM 1 FROM public.reservations WHERE id = p_reservation_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Reservation not found'; END IF;
  claimed_at := clock_timestamp();

  IF NOT coalesce(p_force, false) THEN
    SELECT resend_email_id INTO prior_provider_id FROM public.reservation_email_events
      WHERE reservation_id = p_reservation_id AND email_type = p_email_type
        AND delivery_status = 'sent' ORDER BY created_at DESC LIMIT 1;
    IF FOUND THEN
      RETURN jsonb_build_object('decision', 'sent', 'provider_email_id', prior_provider_id);
    END IF;
  END IF;
  operation := CASE WHEN coalesce(p_force, false)
    THEN 'forced/' || coalesce(p_operation_id, gen_random_uuid())::text
    ELSE 'automatic' END;
  operation := p_reservation_id::text || '/' || p_email_type || '/' || operation;
  SELECT * INTO dispatch FROM public.reservation_email_dispatches
    WHERE reservation_id = p_reservation_id AND email_type = p_email_type
      AND (operation_key = operation OR operation = ANY(operation_aliases))
    FOR UPDATE;
  IF dispatch.id IS NULL THEN
    -- Recover an unresolved send before creating another provider operation.
    SELECT * INTO dispatch FROM public.reservation_email_dispatches
      WHERE reservation_id = p_reservation_id AND email_type = p_email_type
        AND status <> 'sent' ORDER BY created_at LIMIT 1 FOR UPDATE;
  END IF;
  IF dispatch.id IS NULL THEN
    INSERT INTO public.reservation_email_dispatches
      (operation_key, reservation_id, email_type, payload_json)
      VALUES (operation, p_reservation_id, p_email_type, p_payload_json)
      ON CONFLICT (operation_key) DO NOTHING;
    SELECT * INTO STRICT dispatch FROM public.reservation_email_dispatches
      WHERE operation_key = operation FOR UPDATE;
  ELSIF dispatch.operation_key <> operation AND NOT operation = ANY(dispatch.operation_aliases) THEN
    -- Remember which existing send fulfilled an explicit resend request. A retry
    -- of that request must not create a fresh send after the receipt commits.
    UPDATE public.reservation_email_dispatches
      SET operation_aliases = array_append(operation_aliases, operation)
      WHERE id = dispatch.id;
  END IF;

  IF dispatch.status = 'sent' THEN
    RETURN jsonb_build_object('decision', 'sent', 'provider_email_id', dispatch.provider_email_id);
  END IF;
  IF dispatch.status = 'review' THEN
    RETURN jsonb_build_object('decision', 'review', 'dispatch_id', dispatch.id);
  END IF;
  IF dispatch.status = 'sending' AND dispatch.lease_expires_at > claimed_at THEN
    RETURN jsonb_build_object('decision', 'busy', 'dispatch_id', dispatch.id);
  END IF;
  -- Resend retains idempotency keys for 24h. Never automatically replay an
  -- uncertain send outside that window; retain it for provider reconciliation.
  IF dispatch.first_attempt_at IS NOT NULL
    AND dispatch.first_attempt_at <= claimed_at - interval '23 hours' THEN
    UPDATE public.reservation_email_dispatches SET status = 'review',
      last_error = 'Provider idempotency window requires reconciliation',
      lease_token = NULL, lease_expires_at = NULL, updated_at = claimed_at
      WHERE id = dispatch.id;
    RETURN jsonb_build_object('decision', 'review', 'dispatch_id', dispatch.id);
  END IF;
  UPDATE public.reservation_email_dispatches SET status = 'sending',
    first_attempt_at = coalesce(first_attempt_at, claimed_at),
    lease_token = gen_random_uuid(), lease_expires_at = claimed_at + interval '2 minutes',
    attempt_count = attempt_count + 1, updated_at = claimed_at
    WHERE id = dispatch.id RETURNING * INTO dispatch;
  RETURN jsonb_build_object('decision', 'send', 'dispatch_id', dispatch.id,
    'lease_token', dispatch.lease_token, 'payload_json', dispatch.payload_json,
    'retry_before', dispatch.first_attempt_at + interval '23 hours',
    'idempotency_key', 'sf-sauna/reservation-email/' || dispatch.id::text);
END;
$$;

CREATE FUNCTION public.finish_reservation_email(
  p_dispatch_id uuid, p_lease_token uuid, p_outcome text,
  p_provider_email_id text DEFAULT NULL, p_error text DEFAULT NULL
) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE dispatch public.reservation_email_dispatches%ROWTYPE;
BEGIN
  IF p_outcome NOT IN ('sent', 'retryable', 'review') OR p_outcome IS NULL THEN
    RAISE EXCEPTION 'Invalid email outcome';
  END IF;
  IF p_outcome = 'sent' AND coalesce(p_provider_email_id, '') = '' THEN
    RAISE EXCEPTION 'Provider receipt required';
  END IF;
  UPDATE public.reservation_email_dispatches SET status = p_outcome,
    provider_email_id = p_provider_email_id, last_error = left(p_error, 500),
    lease_token = NULL, lease_expires_at = NULL, updated_at = clock_timestamp()
    WHERE id = p_dispatch_id AND lease_token = p_lease_token AND status = 'sending'
    RETURNING * INTO dispatch;
  IF NOT FOUND THEN RETURN false; END IF;
  -- The durable receipt and existing dashboard history commit together.
  INSERT INTO public.reservation_email_events
    (reservation_id, email_type, recipient_email, resend_email_id,
     delivery_status, error_message, sent_at, dispatch_id)
    VALUES (dispatch.reservation_id, dispatch.email_type,
      dispatch.payload_json::jsonb->'to'->>0, p_provider_email_id,
      CASE WHEN p_outcome = 'sent' THEN 'sent' ELSE 'failed' END,
      left(p_error, 500), CASE WHEN p_outcome = 'sent' THEN clock_timestamp() END, dispatch.id);
  RETURN true;
END;
$$;
REVOKE ALL ON FUNCTION public.claim_reservation_email(uuid,text,text,boolean,uuid)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.finish_reservation_email(uuid,uuid,text,text,text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_reservation_email(uuid,text,text,boolean,uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.finish_reservation_email(uuid,uuid,text,text,text) TO service_role;
