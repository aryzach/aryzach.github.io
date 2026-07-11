ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS default_payment_method_status text,
  ADD COLUMN IF NOT EXISTS default_payment_method_updated_at timestamptz;