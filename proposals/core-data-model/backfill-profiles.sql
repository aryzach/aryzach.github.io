-- LOCAL REVIEW ONLY. Apply only after schema and source snapshots are verified.
-- One profile per existing reservation. No email matching, identity merges or invented rentals.
BEGIN;
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
COMMIT;
