
CREATE TABLE IF NOT EXISTS public.reservation_email_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID NOT NULL REFERENCES public.reservations(id) ON DELETE CASCADE,
  email_type TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  resend_email_id TEXT,
  delivery_status TEXT NOT NULL DEFAULT 'sent',
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS reservation_email_events_res_idx
  ON public.reservation_email_events (reservation_id, email_type, delivery_status);

GRANT SELECT ON public.reservation_email_events TO authenticated;
GRANT ALL ON public.reservation_email_events TO service_role;
ALTER TABLE public.reservation_email_events ENABLE ROW LEVEL SECURITY;

-- No client access; edge functions use service role.
CREATE POLICY "no client access" ON public.reservation_email_events
  FOR SELECT TO authenticated USING (false);
