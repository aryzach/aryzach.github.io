-- Additive core identity/rental foundation. Does not replace inventory assignment writers.
-- Keep existing reservations, agreements, inventory and provider fields unchanged.
BEGIN;

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
COMMIT;
