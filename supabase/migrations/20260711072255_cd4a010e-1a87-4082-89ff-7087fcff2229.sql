
ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS stripe_customer_id text,
  ADD COLUMN IF NOT EXISTS stripe_customer_linkage_missing boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ach_status text NOT NULL DEFAULT 'Not Connected',
  ADD COLUMN IF NOT EXISTS ach_connected_at timestamptz,
  ADD COLUMN IF NOT EXISTS stripe_ach_setup_intent_id text,
  ADD COLUMN IF NOT EXISTS stripe_ach_payment_method_id text,
  ADD COLUMN IF NOT EXISTS ach_bank_name text,
  ADD COLUMN IF NOT EXISTS ach_bank_last4 text,
  ADD COLUMN IF NOT EXISTS ach_last_error text;

ALTER TABLE public.reservations
  DROP CONSTRAINT IF EXISTS reservations_ach_status_check;
ALTER TABLE public.reservations
  ADD CONSTRAINT reservations_ach_status_check
  CHECK (ach_status IN ('Not Connected','In Progress','Connected','Failed'));

CREATE INDEX IF NOT EXISTS reservations_stripe_customer_id_idx
  ON public.reservations (stripe_customer_id);
CREATE INDEX IF NOT EXISTS reservations_ach_setup_intent_idx
  ON public.reservations (stripe_ach_setup_intent_id);
