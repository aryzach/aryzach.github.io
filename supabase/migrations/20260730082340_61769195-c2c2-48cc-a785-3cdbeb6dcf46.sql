-- 1) Canonical taxonomy columns
ALTER TABLE public.sauna_types
  ADD COLUMN IF NOT EXISTS location text,
  ADD COLUMN IF NOT EXISTS style text,
  ADD COLUMN IF NOT EXISTS model_key text;

ALTER TABLE public.sauna_inventory
  ADD COLUMN IF NOT EXISTS locations text[],
  ADD COLUMN IF NOT EXISTS style text,
  ADD COLUMN IF NOT EXISTS model_key text;

UPDATE public.sauna_inventory SET
  locations = CASE WHEN indoor_outdoor_eligibility = 'either'
                   THEN ARRAY['indoor','outdoor']
                   ELSE ARRAY[indoor_outdoor_eligibility] END,
  style = CASE WHEN sauna_type_id ILIKE '%infrared%' THEN 'infrared' ELSE 'traditional' END,
  model_key = CASE WHEN model = 'Original Collection' THEN 'original' ELSE 'standard' END;

-- 2) New canonical sauna types
INSERT INTO public.sauna_types (id, name, description, placement, reservation_fee_cents, stripe_payment_link, sort_order, location, style, model_key)
SELECT v.id, v.name, v.description, v.location, 20000, 'STRIPE_RESERVATION_PAYMENT_LINK', v.sort_order, v.location, v.style, v.model_key
FROM (VALUES
  ('indoor_infrared_standard','Indoor Infrared','2-person indoor infrared sauna, approx. 4'' W x 4'' D x 6'' H','indoor','infrared','standard',1),
  ('outdoor_infrared_standard','Outdoor Infrared','2-person outdoor infrared sauna, approx. 5'' W x 4'' D x 7'' H','outdoor','infrared','standard',2),
  ('indoor_traditional_standard','Indoor Traditional','2-person indoor traditional sauna with stones','indoor','traditional','standard',3),
  ('outdoor_traditional_standard','Outdoor Traditional','2-person outdoor traditional sauna with stones','outdoor','traditional','standard',4),
  ('indoor_traditional_original','Indoor Traditional (Original Collection)','Earlier-generation indoor traditional sauna, converted from an infrared model.','indoor','traditional','original',5)
) AS v(id,name,description,location,style,model_key,sort_order)
ON CONFLICT (id) DO NOTHING;

UPDATE public.sauna_types
SET name = 'Outdoor Traditional (Original Collection)',
    location = 'outdoor', style = 'traditional', model_key = 'original', sort_order = 6
WHERE id = 'outdoor_traditional_original';

-- 3) Repoint pricing tiers
INSERT INTO public.pricing_tiers (sauna_type_id, commitment_months, monthly_price, install_fee, badge)
SELECT m.new_id, t.commitment_months, t.monthly_price, t.install_fee, t.badge
FROM public.pricing_tiers t
JOIN (VALUES
  ('indoor_infrared','indoor_infrared_standard'),
  ('outdoor_infrared','outdoor_infrared_standard'),
  ('indoor_outdoor_traditional_latest','indoor_traditional_standard'),
  ('outdoor_traditional_latest','outdoor_traditional_standard'),
  ('indoor_traditional','indoor_traditional_original')
) AS m(old_id,new_id) ON m.old_id = t.sauna_type_id
ON CONFLICT (sauna_type_id, commitment_months) DO NOTHING;

-- 4) Repoint inventory
UPDATE public.sauna_inventory
SET sauna_type_id = CASE
  WHEN style = 'infrared' AND 'indoor' = ANY(locations) THEN 'indoor_infrared_standard'
  WHEN style = 'infrared' THEN 'outdoor_infrared_standard'
  WHEN model_key = 'original' AND 'indoor' = ANY(locations) THEN 'indoor_traditional_original'
  WHEN model_key = 'original' THEN 'outdoor_traditional_original'
  WHEN 'indoor' = ANY(locations) THEN 'indoor_traditional_standard'
  ELSE 'outdoor_traditional_standard'
END;

-- 5) Repoint reservations (use the linked unit's model when known)
UPDATE public.reservations r
SET sauna_type_id = CASE r.sauna_type_id
  WHEN 'indoor_infrared' THEN 'indoor_infrared_standard'
  WHEN 'outdoor_infrared' THEN 'outdoor_infrared_standard'
  WHEN 'outdoor_traditional_latest' THEN 'outdoor_traditional_standard'
  WHEN 'indoor_outdoor_traditional_latest' THEN 'indoor_traditional_standard'
  WHEN 'indoor_traditional' THEN COALESCE((
      SELECT CASE WHEN i.model_key = 'original' THEN 'indoor_traditional_original'
                  ELSE 'indoor_traditional_standard' END
      FROM public.sauna_inventory i
      WHERE i.current_customer_id = r.id OR i.future_customer_id = r.id OR i.id = r.sauna_inventory_id
      LIMIT 1), 'indoor_traditional_original')
  ELSE r.sauna_type_id
END
WHERE r.sauna_type_id IN ('indoor_infrared','outdoor_infrared','outdoor_traditional_latest','indoor_outdoor_traditional_latest','indoor_traditional');

-- 6) Drop legacy types + their pricing rows
DELETE FROM public.pricing_tiers WHERE sauna_type_id IN
  ('indoor_infrared','outdoor_infrared','indoor_outdoor_traditional_latest','outdoor_traditional_latest','indoor_traditional');
DELETE FROM public.sauna_types WHERE id IN
  ('indoor_infrared','outdoor_infrared','indoor_outdoor_traditional_latest','outdoor_traditional_latest','indoor_traditional');

-- 7) Constraints
ALTER TABLE public.sauna_types
  ALTER COLUMN location SET NOT NULL,
  ALTER COLUMN style SET NOT NULL,
  ALTER COLUMN model_key SET NOT NULL,
  ADD CONSTRAINT sauna_types_location_check CHECK (location IN ('indoor','outdoor')),
  ADD CONSTRAINT sauna_types_style_check CHECK (style IN ('traditional','infrared')),
  ADD CONSTRAINT sauna_types_model_key_check CHECK (model_key IN ('standard','original')),
  ADD CONSTRAINT sauna_types_taxonomy_unique UNIQUE (location, style, model_key);

ALTER TABLE public.sauna_inventory
  ALTER COLUMN locations SET NOT NULL,
  ALTER COLUMN style SET NOT NULL,
  ALTER COLUMN model_key SET NOT NULL,
  ADD CONSTRAINT sauna_inventory_locations_check
    CHECK (array_length(locations,1) >= 1 AND locations <@ ARRAY['indoor','outdoor']),
  ADD CONSTRAINT sauna_inventory_style_check CHECK (style IN ('traditional','infrared')),
  ADD CONSTRAINT sauna_inventory_model_key_check CHECK (model_key IN ('standard','original'));

-- 8) Keep legacy display columns in sync with the canonical taxonomy
CREATE OR REPLACE FUNCTION public.sauna_inventory_sync_taxonomy()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.locations IS NULL OR array_length(NEW.locations,1) IS NULL THEN
    NEW.locations := CASE WHEN NEW.indoor_outdoor_eligibility = 'either'
                          THEN ARRAY['indoor','outdoor']
                          ELSE ARRAY[COALESCE(NEW.indoor_outdoor_eligibility,'indoor')] END;
  END IF;
  NEW.indoor_outdoor_eligibility := CASE
    WHEN 'indoor' = ANY(NEW.locations) AND 'outdoor' = ANY(NEW.locations) THEN 'either'
    WHEN 'outdoor' = ANY(NEW.locations) THEN 'outdoor'
    ELSE 'indoor' END;
  IF NEW.model_key IS NULL THEN
    NEW.model_key := CASE WHEN NEW.model = 'Original Collection' THEN 'original' ELSE 'standard' END;
  END IF;
  NEW.model := CASE WHEN NEW.model_key = 'original' THEN 'Original Collection' ELSE 'Standard' END;
  IF NEW.style IS NULL THEN
    NEW.style := CASE WHEN NEW.sauna_type_id ILIKE '%infrared%' THEN 'infrared' ELSE 'traditional' END;
  END IF;
  -- Derive the primary sauna type from the taxonomy
  NEW.sauna_type_id := (
    SELECT st.id FROM public.sauna_types st
    WHERE st.style = NEW.style AND st.model_key = NEW.model_key
      AND st.location = ANY(NEW.locations)
    ORDER BY CASE WHEN st.location = 'indoor' THEN 0 ELSE 1 END
    LIMIT 1
  );
  IF NEW.sauna_type_id IS NULL THEN
    RAISE EXCEPTION 'No sauna type for style=% model=% locations=%', NEW.style, NEW.model_key, NEW.locations;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sauna_inventory_sync_taxonomy_trg ON public.sauna_inventory;
CREATE TRIGGER sauna_inventory_sync_taxonomy_trg
BEFORE INSERT OR UPDATE ON public.sauna_inventory
FOR EACH ROW EXECUTE FUNCTION public.sauna_inventory_sync_taxonomy();

-- 9) Availability now matches on style + model + location membership
CREATE OR REPLACE VIEW public.public_sauna_availability AS
SELECT st.id AS sauna_type_id,
  COALESCE(SUM(CASE WHEN si.status = 'Available' THEN 1 ELSE 0 END), 0)::integer AS available_now,
  MIN(CASE WHEN si.status = ANY (ARRAY['Incoming','Returning','Maintenance'])
             AND si.available_date IS NOT NULL THEN si.available_date END) AS next_available_date
FROM public.sauna_types st
LEFT JOIN public.sauna_inventory si
  ON si.style = st.style AND si.model_key = st.model_key AND st.location = ANY(si.locations)
GROUP BY st.id;

-- 10) Reservation hold picks any unit matching the requested taxonomy
CREATE OR REPLACE FUNCTION public.create_reservation_with_hold(p_sauna_type_id text, p_first_name text, p_last_name text, p_email text, p_phone text, p_install_address text, p_placement_choice text, p_access_notes text, p_min_commitment_months integer, p_preferred_install_at timestamp with time zone)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  v_type public.sauna_types%ROWTYPE;
  v_sauna public.sauna_inventory%ROWTYPE;
  v_reservation_id uuid;
  v_customer_name text;
BEGIN
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

  SELECT * INTO v_type FROM public.sauna_types WHERE id = p_sauna_type_id;
  IF v_type.id IS NULL THEN
    RAISE EXCEPTION 'Unknown sauna type';
  END IF;

  v_customer_name := btrim(p_first_name) || ' ' || btrim(p_last_name);

  SELECT * INTO v_sauna
  FROM public.sauna_inventory
  WHERE style = v_type.style
    AND model_key = v_type.model_key
    AND v_type.location = ANY(locations)
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

  INSERT INTO public.reservations (
    sauna_type_id, first_name, last_name, email, phone,
    install_address, placement_choice, access_notes,
    min_commitment_months, preferred_install_at, sauna_inventory_id
  ) VALUES (
    p_sauna_type_id, btrim(p_first_name), btrim(p_last_name), p_email, p_phone,
    p_install_address, p_placement_choice, NULLIF(btrim(p_access_notes), ''),
    p_min_commitment_months, p_preferred_install_at, v_sauna.id
  )
  RETURNING id INTO v_reservation_id;

  UPDATE public.sauna_inventory
  SET status = 'Reservation Hold',
      current_customer = v_customer_name,
      reservation_id = v_reservation_id
  WHERE id = v_sauna.id;

  RETURN v_reservation_id;
END;
$$;