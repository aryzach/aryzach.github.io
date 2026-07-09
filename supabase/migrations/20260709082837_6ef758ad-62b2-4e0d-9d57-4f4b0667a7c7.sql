
CREATE TABLE public.sauna_types (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL,
  placement text NOT NULL CHECK (placement IN ('indoor','outdoor','either')),
  reservation_fee_cents integer NOT NULL,
  stripe_payment_link text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.sauna_types TO anon, authenticated;
GRANT ALL ON public.sauna_types TO service_role;
ALTER TABLE public.sauna_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sauna_types public read" ON public.sauna_types FOR SELECT USING (true);

CREATE TABLE public.availability_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sauna_type_id text NOT NULL REFERENCES public.sauna_types(id) ON DELETE CASCADE,
  quantity integer NOT NULL,
  available_starting_date date NOT NULL,
  reason text NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.availability_events TO anon, authenticated;
GRANT ALL ON public.availability_events TO service_role;
ALTER TABLE public.availability_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "availability_events public read" ON public.availability_events FOR SELECT USING (true);

CREATE TABLE public.reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sauna_type_id text NOT NULL REFERENCES public.sauna_types(id),
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  install_address text NOT NULL,
  placement_choice text NOT NULL,
  access_notes text,
  min_commitment_months integer NOT NULL CHECK (min_commitment_months IN (1,3,6,12)),
  preferred_install_at timestamptz NOT NULL,
  reservation_status text NOT NULL DEFAULT 'Pending Payment',
  payment_status text NOT NULL DEFAULT 'Pending',
  contract_status text NOT NULL DEFAULT 'Not Sent',
  id_status text NOT NULL DEFAULT 'Not Uploaded',
  consult_status text NOT NULL DEFAULT 'Not Scheduled',
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.reservations TO anon, authenticated;
GRANT ALL ON public.reservations TO service_role;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reservations anon insert" ON public.reservations FOR INSERT WITH CHECK (true);

-- Public view: paid-active reservation consumption (no PII)
CREATE VIEW public.paid_reservation_consumption
WITH (security_invoker = true)
AS
SELECT sauna_type_id, (preferred_install_at AT TIME ZONE 'UTC')::date AS preferred_install_date
FROM public.reservations
WHERE payment_status = 'Paid'
  AND reservation_status NOT IN ('Cancelled','Refunded');
GRANT SELECT ON public.paid_reservation_consumption TO anon, authenticated;

-- Seed sauna types
INSERT INTO public.sauna_types (id, name, description, placement, reservation_fee_cents, stripe_payment_link, sort_order) VALUES
  ('indoor_infrared','Indoor Infrared','2-person indoor infrared sauna, approx. 4'' W x 4'' D x 6'' H','indoor',20000,'INFRARED_STRIPE_PAYMENT_LINK',1),
  ('outdoor_infrared','Outdoor Infrared','2-person outdoor infrared sauna, approx. 5'' W x 4'' D x 7'' H','outdoor',20000,'INFRARED_STRIPE_PAYMENT_LINK',2),
  ('indoor_traditional','Indoor Traditional','2-person indoor traditional sauna with stones, approx. 4'' W x 4'' D x 6'' H','indoor',50000,'TRADITIONAL_STRIPE_PAYMENT_LINK',3),
  ('indoor_outdoor_traditional_latest','Indoor/Outdoor Traditional, Latest Model','2-person traditional sauna with stones, approx. 4'' W x 4'' D x 7'' H','either',50000,'TRADITIONAL_STRIPE_PAYMENT_LINK',4),
  ('outdoor_traditional_latest','Outdoor Traditional, Latest Model','2-person outdoor traditional sauna with stones, approx. 4'' W x 4'' D x 7'' H','outdoor',50000,'TRADITIONAL_STRIPE_PAYMENT_LINK',5);
