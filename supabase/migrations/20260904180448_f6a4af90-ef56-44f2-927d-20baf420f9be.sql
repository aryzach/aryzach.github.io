ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS allowed_commitment_months integer[],
  ADD COLUMN IF NOT EXISTS custom_install_fee integer;