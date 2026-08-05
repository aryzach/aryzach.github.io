CREATE TABLE public.meta_conversion_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id text UNIQUE NOT NULL,
  event_name text NOT NULL,
  stripe_event_id text,
  stripe_session_id text,
  status text NOT NULL DEFAULT 'pending',
  response_code integer,
  error_message text,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.meta_conversion_events TO service_role;

ALTER TABLE public.meta_conversion_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "no client access" ON public.meta_conversion_events
  FOR SELECT TO authenticated USING (false);

CREATE TRIGGER meta_conversion_events_updated_at
  BEFORE UPDATE ON public.meta_conversion_events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();