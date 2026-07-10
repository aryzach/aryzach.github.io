
-- 1. Add missing sauna type (Original Collection outdoor)
INSERT INTO public.sauna_types (id, name, description, placement, reservation_fee_cents, stripe_payment_link, sort_order)
VALUES (
  'outdoor_traditional_original',
  'Outdoor Traditional (Original Collection)',
  'Earlier-generation outdoor traditional sauna, converted from an infrared model.',
  'outdoor',
  10000,
  'RESERVATION_STRIPE_PAYMENT_LINK',
  60
)
ON CONFLICT (id) DO NOTHING;

-- Also normalize existing rows to use one reservation payment link and $100 fee (MVP)
UPDATE public.sauna_types
SET stripe_payment_link = 'RESERVATION_STRIPE_PAYMENT_LINK',
    reservation_fee_cents = 10000;

-- 2. Extend reservations table
ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS secure_token text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS reservation_source text NOT NULL DEFAULT 'Unknown',
  ADD COLUMN IF NOT EXISTS hold_created_at timestamptz,
  ADD COLUMN IF NOT EXISTS hold_deadline timestamptz,
  ADD COLUMN IF NOT EXISTS stripe_payment_id text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Make legacy fields optional so simpler modal can create rows.
ALTER TABLE public.reservations
  ALTER COLUMN install_address DROP NOT NULL,
  ALTER COLUMN placement_choice DROP NOT NULL,
  ALTER COLUMN min_commitment_months DROP NOT NULL,
  ALTER COLUMN phone DROP NOT NULL;

-- Backfill secure_token for existing rows.
UPDATE public.reservations
SET secure_token = encode(gen_random_bytes(32), 'hex')
WHERE secure_token IS NULL;

ALTER TABLE public.reservations
  ALTER COLUMN secure_token SET NOT NULL,
  ALTER COLUMN secure_token SET DEFAULT encode(gen_random_bytes(32), 'hex');

CREATE UNIQUE INDEX IF NOT EXISTS reservations_secure_token_key
  ON public.reservations(secure_token);

-- updated_at trigger
DROP TRIGGER IF EXISTS update_reservations_updated_at ON public.reservations;
CREATE TRIGGER update_reservations_updated_at
  BEFORE UPDATE ON public.reservations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Timeline events table
CREATE TABLE IF NOT EXISTS public.reservation_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id uuid NOT NULL REFERENCES public.reservations(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  message text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.reservation_events TO service_role;

ALTER TABLE public.reservation_events ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS reservation_events_reservation_id_idx
  ON public.reservation_events(reservation_id, created_at);
