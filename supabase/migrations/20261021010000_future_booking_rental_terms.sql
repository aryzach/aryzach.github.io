-- Future bookings only. No contract, signature, existing agreed price or billing is updated.
BEGIN;
LOCK TABLE public.reservations IN ACCESS EXCLUSIVE MODE;
ALTER TABLE public.reservations ADD COLUMN rental_pricing_version integer NOT NULL DEFAULT 1
  CHECK (rental_pricing_version IN (1,2));
-- A constant column default freezes existing rows without UPDATEs, timestamps,
-- notification triggers or lifecycle side effects. Future rows have no snapshot.
DO $$
DECLARE catalog jsonb;
BEGIN
 SELECT jsonb_object_agg(sauna_type_id, tiers) INTO catalog FROM (
   SELECT sauna_type_id, jsonb_object_agg(commitment_months::text,
     jsonb_build_object('monthly',monthly_price,'installFee',install_fee)) AS tiers
   FROM public.pricing_tiers GROUP BY sauna_type_id
 ) t;
 IF catalog IS NULL THEN RAISE EXCEPTION 'Cannot freeze an empty pricing catalog'; END IF;
 EXECUTE format('ALTER TABLE public.reservations ADD COLUMN rental_pricing_snapshot jsonb DEFAULT %L::jsonb', catalog::text);
END $$;
ALTER TABLE public.reservations ALTER COLUMN rental_pricing_snapshot DROP DEFAULT;
-- The default changes only INSERTs after this transaction commits.
ALTER TABLE public.reservations ALTER COLUMN rental_pricing_version SET DEFAULT 2;
CREATE FUNCTION public.preserve_booking_pricing_policy() RETURNS trigger
LANGUAGE plpgsql SET search_path=public,pg_temp AS $$ BEGIN
 IF NEW.rental_pricing_version IS DISTINCT FROM OLD.rental_pricing_version OR
    NEW.rental_pricing_snapshot IS DISTINCT FROM OLD.rental_pricing_snapshot
 THEN RAISE EXCEPTION 'Booking pricing policy is fixed at booking creation'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER preserve_booking_pricing_policy BEFORE UPDATE ON public.reservations
FOR EACH ROW EXECUTE FUNCTION public.preserve_booking_pricing_policy();
-- New public catalog rates; custom reservation quotes and existing snapshots remain unchanged.
UPDATE public.pricing_tiers t SET monthly_price=v.monthly,install_fee=v.install
FROM (VALUES (1,1200,500),(3,800,500),(6,600,500),(12,500,0),(24,300,0)) v(months,monthly,install)
WHERE t.sauna_type_id IN ('indoor_traditional_standard','outdoor_traditional_standard')
 AND t.commitment_months=v.months;
COMMIT;
