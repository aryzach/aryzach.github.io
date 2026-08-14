ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS custom_commitment_months integer,
  ADD COLUMN IF NOT EXISTS custom_monthly_price integer;