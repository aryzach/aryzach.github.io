-- Core identity/rental foundation; existing business rows and operational writers retained.
BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='30s';
LOCK TABLE public.agreement_versions, public.app_config, public.contract_acknowledgments, public.contract_events, public.contract_signature_audit, public.contracts, public.meta_conversion_events, public.pricing_config, public.pricing_tiers, public.reservation_email_events, public.reservation_events, public.reservations, public.sauna_inventory, public.sauna_types, public.stripe_webhook_events, public.waitlist_entries IN SHARE MODE;
SELECT set_config('sf_core.legacy_before',(SELECT jsonb_agg(to_jsonb(f) ORDER BY table_name)::text FROM (
SELECT 'agreement_versions' AS table_name,count(*) AS rows,md5(coalesce(string_agg(to_jsonb(t)::text, E'\n' ORDER BY to_jsonb(t)::text),'')) AS fingerprint FROM public.agreement_versions t
UNION ALL
SELECT 'app_config' AS table_name,count(*) AS rows,md5(coalesce(string_agg(to_jsonb(t)::text, E'\n' ORDER BY to_jsonb(t)::text),'')) AS fingerprint FROM public.app_config t
UNION ALL
SELECT 'contract_acknowledgments' AS table_name,count(*) AS rows,md5(coalesce(string_agg(to_jsonb(t)::text, E'\n' ORDER BY to_jsonb(t)::text),'')) AS fingerprint FROM public.contract_acknowledgments t
UNION ALL
SELECT 'contract_events' AS table_name,count(*) AS rows,md5(coalesce(string_agg(to_jsonb(t)::text, E'\n' ORDER BY to_jsonb(t)::text),'')) AS fingerprint FROM public.contract_events t
UNION ALL
SELECT 'contract_signature_audit' AS table_name,count(*) AS rows,md5(coalesce(string_agg(to_jsonb(t)::text, E'\n' ORDER BY to_jsonb(t)::text),'')) AS fingerprint FROM public.contract_signature_audit t
UNION ALL
SELECT 'contracts' AS table_name,count(*) AS rows,md5(coalesce(string_agg(to_jsonb(t)::text, E'\n' ORDER BY to_jsonb(t)::text),'')) AS fingerprint FROM public.contracts t
UNION ALL
SELECT 'meta_conversion_events' AS table_name,count(*) AS rows,md5(coalesce(string_agg(to_jsonb(t)::text, E'\n' ORDER BY to_jsonb(t)::text),'')) AS fingerprint FROM public.meta_conversion_events t
UNION ALL
SELECT 'pricing_config' AS table_name,count(*) AS rows,md5(coalesce(string_agg(to_jsonb(t)::text, E'\n' ORDER BY to_jsonb(t)::text),'')) AS fingerprint FROM public.pricing_config t
UNION ALL
SELECT 'pricing_tiers' AS table_name,count(*) AS rows,md5(coalesce(string_agg(to_jsonb(t)::text, E'\n' ORDER BY to_jsonb(t)::text),'')) AS fingerprint FROM public.pricing_tiers t
UNION ALL
SELECT 'reservation_email_events' AS table_name,count(*) AS rows,md5(coalesce(string_agg(to_jsonb(t)::text, E'\n' ORDER BY to_jsonb(t)::text),'')) AS fingerprint FROM public.reservation_email_events t
UNION ALL
SELECT 'reservation_events' AS table_name,count(*) AS rows,md5(coalesce(string_agg(to_jsonb(t)::text, E'\n' ORDER BY to_jsonb(t)::text),'')) AS fingerprint FROM public.reservation_events t
UNION ALL
SELECT 'reservations' AS table_name,count(*) AS rows,md5(coalesce(string_agg(to_jsonb(t)::text, E'\n' ORDER BY to_jsonb(t)::text),'')) AS fingerprint FROM public.reservations t
UNION ALL
SELECT 'sauna_inventory' AS table_name,count(*) AS rows,md5(coalesce(string_agg(to_jsonb(t)::text, E'\n' ORDER BY to_jsonb(t)::text),'')) AS fingerprint FROM public.sauna_inventory t
UNION ALL
SELECT 'sauna_types' AS table_name,count(*) AS rows,md5(coalesce(string_agg(to_jsonb(t)::text, E'\n' ORDER BY to_jsonb(t)::text),'')) AS fingerprint FROM public.sauna_types t
UNION ALL
SELECT 'stripe_webhook_events' AS table_name,count(*) AS rows,md5(coalesce(string_agg(to_jsonb(t)::text, E'\n' ORDER BY to_jsonb(t)::text),'')) AS fingerprint FROM public.stripe_webhook_events t
UNION ALL
SELECT 'waitlist_entries' AS table_name,count(*) AS rows,md5(coalesce(string_agg(to_jsonb(t)::text, E'\n' ORDER BY to_jsonb(t)::text),'')) AS fingerprint FROM public.waitlist_entries t
) f),true);
-- Additive core identity/rental foundation. Does not replace inventory assignment writers.
-- Keep existing reservations, agreements, inventory and provider fields unchanged.

CREATE TABLE public.customer_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL DEFAULT 'unknown' CHECK (kind IN ('person', 'business', 'unknown')),
  display_name text,
  email text,
  phone text,
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
-- Emails are deliberately not unique. Separate reservation identities need review.
CREATE TABLE public.reservation_customer_links (
  reservation_id uuid PRIMARY KEY REFERENCES public.reservations(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES public.customer_profiles(id) ON DELETE RESTRICT,
  provenance text NOT NULL CHECK (provenance IN ('legacy_separate_profile', 'owner_reviewed')),
  linked_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (reservation_id, customer_id)
);
CREATE INDEX reservation_customer_links_customer ON public.reservation_customer_links(customer_id);

CREATE TABLE public.rentals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.customer_profiles(id) ON DELETE RESTRICT,
  originating_reservation_id uuid UNIQUE REFERENCES public.reservations(id) ON DELETE SET NULL,
  origin text NOT NULL DEFAULT 'admin' CHECK (origin IN ('admin', 'legacy_inventory_link')),
  service_address text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX rentals_customer ON public.rentals(customer_id);

-- Dated placement operations remain in the existing inventory workflow in this phase.
-- No assignment table or new inventory writer is activated by this foundation.

-- No public profiles, addresses or history. Future API reads/writes must verify admin password.
ALTER TABLE public.customer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservation_customer_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rentals ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.customer_profiles, public.reservation_customer_links, public.rentals FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.customer_profiles, public.reservation_customer_links, public.rentals TO service_role;
-- No DELETE grant: profiles and rentals are archived/preserved independently of bookings.

CREATE FUNCTION public.ensure_reservation_customer_profile() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE profile_id uuid;
BEGIN
  INSERT INTO public.customer_profiles(kind,display_name,email,phone)
  VALUES ('unknown',nullif(btrim(concat_ws(' ',NEW.first_name,NEW.last_name)),''),NEW.email,NEW.phone)
  RETURNING id INTO profile_id;
  INSERT INTO public.reservation_customer_links(reservation_id,customer_id,provenance)
  VALUES (NEW.id,profile_id,'legacy_separate_profile');
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.ensure_reservation_customer_profile() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER reservation_customer_profile_after_insert AFTER INSERT ON public.reservations
FOR EACH ROW EXECUTE FUNCTION public.ensure_reservation_customer_profile();

CREATE FUNCTION public.ensure_inventory_rental_links() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
  INSERT INTO public.rentals(customer_id,originating_reservation_id,service_address,origin)
  SELECT l.customer_id,r.id,r.install_address,'legacy_inventory_link'
  FROM public.reservations r JOIN public.reservation_customer_links l ON l.reservation_id=r.id
  WHERE r.id IN (NEW.current_customer_id,NEW.future_customer_id)
  ON CONFLICT(originating_reservation_id) DO NOTHING;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.ensure_inventory_rental_links() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER inventory_rental_links_after_write
AFTER INSERT OR UPDATE OF current_customer_id,future_customer_id ON public.sauna_inventory
FOR EACH ROW EXECUTE FUNCTION public.ensure_inventory_rental_links();
-- LOCAL REVIEW ONLY. Apply only after schema and source snapshots are verified.
-- One profile per existing reservation. No email matching, identity merges or invented rentals.
LOCK TABLE public.reservations IN SHARE MODE;
LOCK TABLE public.customer_profiles, public.reservation_customer_links IN SHARE ROW EXCLUSIVE MODE;
DO $$
DECLARE original record; profile_id uuid;
BEGIN
  FOR original IN SELECT r.id, r.first_name, r.last_name, r.email, r.phone
    FROM public.reservations r
    WHERE NOT EXISTS (SELECT 1 FROM public.reservation_customer_links l WHERE l.reservation_id = r.id)
  LOOP
    INSERT INTO public.customer_profiles(kind, display_name, email, phone)
    VALUES ('unknown', nullif(btrim(concat_ws(' ', original.first_name, original.last_name)), ''), original.email, original.phone)
    RETURNING id INTO profile_id;
    INSERT INTO public.reservation_customer_links(reservation_id, customer_id, provenance)
    VALUES (original.id, profile_id, 'legacy_separate_profile');
  END LOOP;
END;
$$;
INSERT INTO public.rentals(customer_id,originating_reservation_id,service_address,origin)
SELECT l.customer_id,r.id,r.install_address,'legacy_inventory_link'
FROM public.reservations r JOIN public.reservation_customer_links l ON l.reservation_id=r.id
WHERE EXISTS (SELECT 1 FROM public.sauna_inventory i WHERE r.id IN(i.current_customer_id,i.future_customer_id))
ON CONFLICT(originating_reservation_id) DO NOTHING;
ALTER TABLE public.customer_profiles ADD COLUMN version integer NOT NULL DEFAULT 1 CHECK(version>0);
CREATE FUNCTION public.core_record_command(command text, payload jsonb) RETURNS uuid
LANGUAGE plpgsql SET search_path=public,pg_temp AS $$
DECLARE record_id uuid := (payload->>'id')::uuid; customer_id_value uuid; expected_version integer; reservation_id_value uuid;
BEGIN
  IF record_id IS NULL THEN RAISE EXCEPTION 'Record ID required' USING ERRCODE='22023'; END IF;
  IF command='save_customer' THEN
    IF coalesce(payload->>'kind','') NOT IN('person','business','unknown') THEN RAISE EXCEPTION 'Invalid customer type' USING ERRCODE='22023'; END IF;
    IF length(coalesce(payload->>'name',''))>500 OR length(coalesce(payload->>'email',''))>500 OR length(coalesce(payload->>'phone',''))>100 THEN RAISE EXCEPTION 'Contact value too long' USING ERRCODE='22023'; END IF;
    IF btrim(coalesce(payload->>'name',''))='' AND btrim(coalesce(payload->>'email',''))='' THEN RAISE EXCEPTION 'Customer name or email required' USING ERRCODE='22023'; END IF;
    expected_version := (payload->>'version')::integer;
    IF expected_version IS NULL THEN
      INSERT INTO public.customer_profiles(id,kind,display_name,email,phone)
      VALUES(record_id,payload->>'kind',nullif(btrim(payload->>'name'),''),nullif(btrim(payload->>'email'),''),nullif(btrim(payload->>'phone'),''));
    ELSE
      UPDATE public.customer_profiles SET kind=payload->>'kind',display_name=nullif(btrim(payload->>'name'),''),email=nullif(btrim(payload->>'email'),''),phone=nullif(btrim(payload->>'phone'),''),version=version+1
      WHERE id=record_id AND version=expected_version;
      IF NOT FOUND THEN RAISE EXCEPTION 'Customer changed; refresh before saving' USING ERRCODE='40001'; END IF;
    END IF;
  ELSIF command='archive_customer' THEN
    IF jsonb_typeof(payload->'archived') IS DISTINCT FROM 'boolean' THEN RAISE EXCEPTION 'Archive choice required' USING ERRCODE='22023'; END IF;
    expected_version := (payload->>'version')::integer;
    IF coalesce((payload->>'archived')::boolean,false) AND EXISTS(
      SELECT 1 FROM public.sauna_inventory i JOIN public.reservation_customer_links l
      ON l.reservation_id IN(i.current_customer_id,i.future_customer_id) WHERE l.customer_id=record_id
    ) THEN RAISE EXCEPTION 'Resolve current and future inventory links before archiving this customer' USING ERRCODE='22023'; END IF;
    UPDATE public.customer_profiles SET archived_at=CASE WHEN (payload->>'archived')::boolean THEN now() ELSE NULL END,version=version+1
    WHERE id=record_id AND version=expected_version;
    IF NOT FOUND THEN RAISE EXCEPTION 'Customer changed; refresh before saving' USING ERRCODE='40001'; END IF;
  ELSIF command='add_rental' THEN
    customer_id_value := (payload->>'customerId')::uuid;
    PERFORM 1 FROM public.customer_profiles WHERE id=customer_id_value AND archived_at IS NULL FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Choose an active customer' USING ERRCODE='22023'; END IF;
    IF btrim(coalesce(payload->>'address',''))='' OR length(payload->>'address')>2000 OR length(coalesce(payload->>'notes',''))>10000 THEN RAISE EXCEPTION 'Valid service address and notes required' USING ERRCODE='22023'; END IF;
    reservation_id_value := nullif(payload->>'reservationId','')::uuid;
    IF reservation_id_value IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.reservation_customer_links WHERE reservation_id=reservation_id_value AND customer_id=customer_id_value) THEN RAISE EXCEPTION 'Reservation belongs to another customer' USING ERRCODE='22023'; END IF;
    INSERT INTO public.rentals(id,customer_id,originating_reservation_id,service_address,notes,origin)
    VALUES(record_id,customer_id_value,reservation_id_value,btrim(payload->>'address'),nullif(btrim(payload->>'notes'),''),'admin');
  ELSE
    RAISE EXCEPTION 'Unsupported core operation' USING ERRCODE='22023';
  END IF;
  RETURN record_id;
END;
$$;
REVOKE ALL ON FUNCTION public.core_record_command(text,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.core_record_command(text,jsonb) TO service_role;
DO $$ BEGIN
 IF current_setting('sf_core.legacy_before')::jsonb IS DISTINCT FROM
 (SELECT jsonb_agg(to_jsonb(f) ORDER BY table_name) FROM (
SELECT 'agreement_versions' AS table_name,count(*) AS rows,md5(coalesce(string_agg(to_jsonb(t)::text, E'\n' ORDER BY to_jsonb(t)::text),'')) AS fingerprint FROM public.agreement_versions t
UNION ALL
SELECT 'app_config' AS table_name,count(*) AS rows,md5(coalesce(string_agg(to_jsonb(t)::text, E'\n' ORDER BY to_jsonb(t)::text),'')) AS fingerprint FROM public.app_config t
UNION ALL
SELECT 'contract_acknowledgments' AS table_name,count(*) AS rows,md5(coalesce(string_agg(to_jsonb(t)::text, E'\n' ORDER BY to_jsonb(t)::text),'')) AS fingerprint FROM public.contract_acknowledgments t
UNION ALL
SELECT 'contract_events' AS table_name,count(*) AS rows,md5(coalesce(string_agg(to_jsonb(t)::text, E'\n' ORDER BY to_jsonb(t)::text),'')) AS fingerprint FROM public.contract_events t
UNION ALL
SELECT 'contract_signature_audit' AS table_name,count(*) AS rows,md5(coalesce(string_agg(to_jsonb(t)::text, E'\n' ORDER BY to_jsonb(t)::text),'')) AS fingerprint FROM public.contract_signature_audit t
UNION ALL
SELECT 'contracts' AS table_name,count(*) AS rows,md5(coalesce(string_agg(to_jsonb(t)::text, E'\n' ORDER BY to_jsonb(t)::text),'')) AS fingerprint FROM public.contracts t
UNION ALL
SELECT 'meta_conversion_events' AS table_name,count(*) AS rows,md5(coalesce(string_agg(to_jsonb(t)::text, E'\n' ORDER BY to_jsonb(t)::text),'')) AS fingerprint FROM public.meta_conversion_events t
UNION ALL
SELECT 'pricing_config' AS table_name,count(*) AS rows,md5(coalesce(string_agg(to_jsonb(t)::text, E'\n' ORDER BY to_jsonb(t)::text),'')) AS fingerprint FROM public.pricing_config t
UNION ALL
SELECT 'pricing_tiers' AS table_name,count(*) AS rows,md5(coalesce(string_agg(to_jsonb(t)::text, E'\n' ORDER BY to_jsonb(t)::text),'')) AS fingerprint FROM public.pricing_tiers t
UNION ALL
SELECT 'reservation_email_events' AS table_name,count(*) AS rows,md5(coalesce(string_agg(to_jsonb(t)::text, E'\n' ORDER BY to_jsonb(t)::text),'')) AS fingerprint FROM public.reservation_email_events t
UNION ALL
SELECT 'reservation_events' AS table_name,count(*) AS rows,md5(coalesce(string_agg(to_jsonb(t)::text, E'\n' ORDER BY to_jsonb(t)::text),'')) AS fingerprint FROM public.reservation_events t
UNION ALL
SELECT 'reservations' AS table_name,count(*) AS rows,md5(coalesce(string_agg(to_jsonb(t)::text, E'\n' ORDER BY to_jsonb(t)::text),'')) AS fingerprint FROM public.reservations t
UNION ALL
SELECT 'sauna_inventory' AS table_name,count(*) AS rows,md5(coalesce(string_agg(to_jsonb(t)::text, E'\n' ORDER BY to_jsonb(t)::text),'')) AS fingerprint FROM public.sauna_inventory t
UNION ALL
SELECT 'sauna_types' AS table_name,count(*) AS rows,md5(coalesce(string_agg(to_jsonb(t)::text, E'\n' ORDER BY to_jsonb(t)::text),'')) AS fingerprint FROM public.sauna_types t
UNION ALL
SELECT 'stripe_webhook_events' AS table_name,count(*) AS rows,md5(coalesce(string_agg(to_jsonb(t)::text, E'\n' ORDER BY to_jsonb(t)::text),'')) AS fingerprint FROM public.stripe_webhook_events t
UNION ALL
SELECT 'waitlist_entries' AS table_name,count(*) AS rows,md5(coalesce(string_agg(to_jsonb(t)::text, E'\n' ORDER BY to_jsonb(t)::text),'')) AS fingerprint FROM public.waitlist_entries t
 ) f)
 THEN RAISE EXCEPTION 'Original business records changed; core foundation rolled back'; END IF;
 IF (SELECT count(*) FROM public.reservation_customer_links)<>(SELECT count(*) FROM public.reservations)
 THEN RAISE EXCEPTION 'Not all original reservations have a separate customer profile'; END IF;
END; $$;
NOTIFY pgrst,'reload schema';
COMMIT;
