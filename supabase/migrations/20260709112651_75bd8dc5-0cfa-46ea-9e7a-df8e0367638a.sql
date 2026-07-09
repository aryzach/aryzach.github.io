
-- 1. Drop old model
DROP VIEW IF EXISTS public.paid_reservation_consumption;
DROP TABLE IF EXISTS public.availability_events;

-- 2. Create inventory table
CREATE TABLE public.sauna_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sauna_type_id text NOT NULL REFERENCES public.sauna_types(id),
  model text,
  indoor_outdoor_eligibility text NOT NULL DEFAULT 'either'
    CHECK (indoor_outdoor_eligibility IN ('indoor','outdoor','either')),
  status text NOT NULL DEFAULT 'Available'
    CHECK (status IN ('Available','Reservation Hold','Reservation Confirmed','Installed','Returning','Maintenance','Incoming','Sold / Retired')),
  current_customer text,
  install_date date,
  minimum_term_ends date,
  notice_received_date date,
  available_date date,
  incoming_eta date,
  location text,
  condition text,
  admin_notes text,
  reservation_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.sauna_inventory TO service_role;
ALTER TABLE public.sauna_inventory ENABLE ROW LEVEL SECURITY;
-- No anon/authenticated policies: locked down, admin-only via edge function.

-- 3. Link reservations to a specific inventory sauna (nullable, back-compat)
ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS sauna_inventory_id uuid REFERENCES public.sauna_inventory(id);

-- 4. Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS update_sauna_inventory_updated_at ON public.sauna_inventory;
CREATE TRIGGER update_sauna_inventory_updated_at
BEFORE UPDATE ON public.sauna_inventory
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Public availability view (no PII, aggregated per sauna type)
CREATE OR REPLACE VIEW public.public_sauna_availability
WITH (security_invoker = false) AS
SELECT
  st.id AS sauna_type_id,
  COALESCE(SUM(CASE WHEN si.status = 'Available' THEN 1 ELSE 0 END), 0)::int AS available_now,
  MIN(
    CASE
      WHEN si.status IN ('Incoming','Returning','Maintenance')
        AND si.available_date IS NOT NULL
      THEN si.available_date
    END
  ) AS next_available_date
FROM public.sauna_types st
LEFT JOIN public.sauna_inventory si ON si.sauna_type_id = st.id
GROUP BY st.id;

GRANT SELECT ON public.public_sauna_availability TO anon, authenticated;

-- 6. Secure reserve function: atomically pick an eligible sauna, hold it, create reservation
CREATE OR REPLACE FUNCTION public.create_reservation_with_hold(
  p_sauna_type_id text,
  p_first_name text,
  p_last_name text,
  p_email text,
  p_phone text,
  p_install_address text,
  p_placement_choice text,
  p_access_notes text,
  p_min_commitment_months int,
  p_preferred_install_at timestamptz
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sauna public.sauna_inventory%ROWTYPE;
  v_reservation_id uuid;
  v_customer_name text;
BEGIN
  -- Basic validation
  IF length(btrim(p_first_name)) = 0 OR length(btrim(p_last_name)) = 0 THEN
    RAISE EXCEPTION 'Name required';
  END IF;
  IF p_email !~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$' THEN
    RAISE EXCEPTION 'Invalid email';
  END IF;
  IF length(btrim(p_phone)) < 7 THEN
    RAISE EXCEPTION 'Invalid phone';
  END IF;
  IF p_placement_choice NOT IN ('indoor','outdoor','either') THEN
    RAISE EXCEPTION 'Invalid placement';
  END IF;
  IF p_preferred_install_at < now() THEN
    RAISE EXCEPTION 'Install date must be in the future';
  END IF;

  v_customer_name := btrim(p_first_name) || ' ' || btrim(p_last_name);

  -- Pick eligible sauna: Available first (earliest created), else earliest upcoming Available Date
  -- among Incoming/Returning/Maintenance. Lock to avoid double-booking.
  SELECT * INTO v_sauna
  FROM public.sauna_inventory
  WHERE sauna_type_id = p_sauna_type_id
    AND (
      status = 'Available'
      OR (status IN ('Incoming','Returning','Maintenance') AND available_date IS NOT NULL)
    )
  ORDER BY
    CASE WHEN status = 'Available' THEN 0 ELSE 1 END,
    available_date NULLS LAST,
    created_at
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  IF v_sauna.id IS NULL THEN
    RAISE EXCEPTION 'No eligible sauna available for this type';
  END IF;

  -- Create reservation
  INSERT INTO public.reservations (
    sauna_type_id, first_name, last_name, email, phone,
    install_address, placement_choice, access_notes,
    min_commitment_months, preferred_install_at,
    sauna_inventory_id
  ) VALUES (
    p_sauna_type_id, btrim(p_first_name), btrim(p_last_name), p_email, p_phone,
    p_install_address, p_placement_choice, NULLIF(btrim(p_access_notes), ''),
    p_min_commitment_months, p_preferred_install_at,
    v_sauna.id
  )
  RETURNING id INTO v_reservation_id;

  -- Hold the sauna. Preserve available_date exactly as-is.
  UPDATE public.sauna_inventory
  SET status = 'Reservation Hold',
      current_customer = v_customer_name,
      reservation_id = v_reservation_id
  WHERE id = v_sauna.id;

  RETURN v_reservation_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_reservation_with_hold(
  text, text, text, text, text, text, text, text, int, timestamptz
) TO anon, authenticated;

-- 7. Remove the strict reservations INSERT policy (customers now insert via the SECURITY DEFINER function).
DROP POLICY IF EXISTS "Public can submit reservation requests" ON public.reservations;
