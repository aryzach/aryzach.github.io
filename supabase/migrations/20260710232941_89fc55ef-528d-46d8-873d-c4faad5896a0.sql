
-- 1. Reservations: new payment-tracking fields
ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS payment_completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS stripe_checkout_session_id text,
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id text;

-- 2. Standardize deposit at $200 and single Stripe link placeholder
UPDATE public.sauna_types
SET reservation_fee_cents = 20000,
    stripe_payment_link = 'STRIPE_RESERVATION_PAYMENT_LINK';

-- 3. Stripe webhook idempotency + audit log
CREATE TABLE IF NOT EXISTS public.stripe_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id text NOT NULL UNIQUE,
  event_type text NOT NULL,
  livemode boolean NOT NULL DEFAULT false,
  client_reference_id text,
  checkout_session_id text,
  processing_status text NOT NULL DEFAULT 'received',
  error_message text,
  received_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz
);

GRANT ALL ON public.stripe_webhook_events TO service_role;
ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;
-- No policies for anon/authenticated: this table is service-role only.

-- 4. App config: Stripe mode + payment links
CREATE TABLE IF NOT EXISTS public.app_config (
  key text PRIMARY KEY,
  value text NOT NULL,
  description text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.app_config TO anon, authenticated;
GRANT ALL ON public.app_config TO service_role;
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read app config"
  ON public.app_config FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE TRIGGER app_config_updated_at
  BEFORE UPDATE ON public.app_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.app_config (key, value, description) VALUES
  ('stripe_mode', 'test', 'Active Stripe mode: test or live'),
  ('stripe_test_reservation_payment_link',
   'https://buy.stripe.com/4gMeVd5XNfZQ3Oc2Tp6Vq1G',
   '$200 test-mode Stripe Payment Link for reservation deposits'),
  ('stripe_live_reservation_payment_link',
   '',
   '$200 live-mode Stripe Payment Link for reservation deposits')
ON CONFLICT (key) DO NOTHING;
