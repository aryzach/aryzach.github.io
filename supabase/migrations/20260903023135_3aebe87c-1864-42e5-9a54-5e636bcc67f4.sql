ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS default_sauna_type text,
  ADD COLUMN IF NOT EXISTS custom_security_deposit integer;