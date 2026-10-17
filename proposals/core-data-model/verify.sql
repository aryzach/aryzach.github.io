-- Fresh disposable database ONLY. Minimal legacy fixtures, never an app database.
\set ON_ERROR_STOP on
CREATE TABLE public.reservations(id uuid PRIMARY KEY, first_name text, last_name text, email text, phone text, install_address text, preserved_payload jsonb);
CREATE TABLE public.sauna_inventory(id uuid PRIMARY KEY, unit_code text, current_customer_id uuid REFERENCES reservations(id) ON DELETE SET NULL, future_customer_id uuid REFERENCES reservations(id) ON DELETE SET NULL, status text);
INSERT INTO public.reservations VALUES
 ('00000000-0000-0000-0000-000000000001','Local','One','shared@example.invalid',null,'One local address','{"agreement":"unchanged"}'),
 ('00000000-0000-0000-0000-000000000002','Local','Two','shared@example.invalid',null,'Two local address','{"agreement":"unchanged"}');
INSERT INTO public.sauna_inventory VALUES ('10000000-0000-0000-0000-000000000001','001','00000000-0000-0000-0000-000000000001',null,'Installed');
CREATE TEMP TABLE legacy_before AS SELECT 'reservations' AS name, jsonb_agg(to_jsonb(r) ORDER BY id) AS rows FROM reservations r UNION ALL SELECT 'inventory', jsonb_agg(to_jsonb(i) ORDER BY id) FROM sauna_inventory i;
\ir schema.sql
\ir backfill-profiles.sql
\ir backfill-profiles.sql
\ir commands.sql
DO $$
DECLARE profile_one uuid; profile_two uuid; rental_one uuid; result_id uuid; legacy_id uuid := '00000000-0000-0000-0000-000000000003';
BEGIN
 IF (SELECT count(*) FROM customer_profiles)<>2 OR (SELECT count(DISTINCT customer_id) FROM reservation_customer_links)<>2 THEN RAISE EXCEPTION 'Merged shared emails or duplicated backfill'; END IF;
 IF (SELECT rows FROM legacy_before WHERE name='reservations') IS DISTINCT FROM (SELECT jsonb_agg(to_jsonb(r) ORDER BY id) FROM reservations r) THEN RAISE EXCEPTION 'Changed original reservation data'; END IF;
 IF (SELECT rows FROM legacy_before WHERE name='inventory') IS DISTINCT FROM (SELECT jsonb_agg(to_jsonb(i) ORDER BY id) FROM sauna_inventory i) THEN RAISE EXCEPTION 'Changed original inventory data'; END IF;
 IF (SELECT count(*) FROM rentals)<>1 OR EXISTS(SELECT 1 FROM rentals WHERE origin<>'legacy_inventory_link') THEN RAISE EXCEPTION 'Incorrect inventory grouping'; END IF;
 IF (SELECT count(*) FROM pg_class WHERE relname IN('customer_profiles','reservation_customer_links','rentals') AND relrowsecurity)<>3 THEN RAISE EXCEPTION 'Missing RLS'; END IF;
 IF has_table_privilege('anon','customer_profiles','SELECT') OR has_table_privilege('authenticated','rentals','SELECT') OR has_function_privilege('anon','core_record_command(text,jsonb)','EXECUTE') THEN RAISE EXCEPTION 'Public access'; END IF;
 SELECT customer_id INTO profile_one FROM reservation_customer_links WHERE reservation_id='00000000-0000-0000-0000-000000000001';
 SELECT customer_id INTO profile_two FROM reservation_customer_links WHERE reservation_id='00000000-0000-0000-0000-000000000002';
 PERFORM core_record_command('save_customer',jsonb_build_object('id',profile_two,'version',1,'kind','person','name','Updated local','email','shared@example.invalid','phone',''));
 BEGIN
  PERFORM core_record_command('save_customer',jsonb_build_object('id',profile_two,'version',1,'kind','person','name','Stale update','email','','phone',''));
  RAISE EXCEPTION 'Accepted stale edit';
 EXCEPTION WHEN serialization_failure THEN NULL;
 END;
 BEGIN
  PERFORM core_record_command('archive_customer',jsonb_build_object('id',profile_one,'version',1,'archived',true));
  RAISE EXCEPTION 'Archived current inventory identity';
 EXCEPTION WHEN invalid_parameter_value THEN NULL;
 END;
 PERFORM core_record_command('archive_customer',jsonb_build_object('id',profile_two,'version',2,'archived',true));
 BEGIN
  PERFORM core_record_command('add_rental',jsonb_build_object('id',gen_random_uuid(),'customerId',profile_two,'address','Test'));
  RAISE EXCEPTION 'Rental for archived customer';
 EXCEPTION WHEN invalid_parameter_value THEN NULL;
 END;
 PERFORM core_record_command('archive_customer',jsonb_build_object('id',profile_two,'version',3,'archived',false));
 BEGIN
  PERFORM core_record_command('add_rental',jsonb_build_object('id',gen_random_uuid(),'customerId',profile_two,'reservationId','00000000-0000-0000-0000-000000000001','address','Test'));
  RAISE EXCEPTION 'Wrong reservation owner';
 EXCEPTION WHEN invalid_parameter_value THEN NULL;
 END;
 result_id:=gen_random_uuid();
 PERFORM core_record_command('save_customer',jsonb_build_object('id',result_id,'kind','business','name','Standalone local customer','email','','phone',''));
 PERFORM core_record_command('add_rental',jsonb_build_object('id',gen_random_uuid(),'customerId',result_id,'address','Standalone local address'));
 IF EXISTS(SELECT 1 FROM reservations WHERE first_name='Standalone local customer') THEN RAISE EXCEPTION 'Fabricated reservation'; END IF;
 INSERT INTO reservations(id,first_name,last_name,email) VALUES(legacy_id,'Future','Local','future@example.invalid');
 IF NOT EXISTS(SELECT 1 FROM reservation_customer_links WHERE reservation_id=legacy_id) THEN RAISE EXCEPTION 'New booking missing profile'; END IF;
 UPDATE sauna_inventory SET future_customer_id=legacy_id;
 UPDATE sauna_inventory SET future_customer_id=legacy_id;
 IF (SELECT count(*) FROM rentals WHERE originating_reservation_id=legacy_id)<>1 THEN RAISE EXCEPTION 'New inventory link missing/duplicated'; END IF;
 SELECT id INTO rental_one FROM rentals WHERE originating_reservation_id=legacy_id;
 SELECT customer_id INTO result_id FROM reservation_customer_links WHERE reservation_id=legacy_id;
 -- Existing reservation removal can complete; customer/rental survives independently.
 UPDATE sauna_inventory SET future_customer_id=null WHERE future_customer_id=legacy_id;
 DELETE FROM reservations WHERE id=legacy_id;
 IF NOT EXISTS(SELECT 1 FROM customer_profiles WHERE id=result_id) OR NOT EXISTS(SELECT 1 FROM rentals WHERE id=rental_one AND originating_reservation_id IS NULL) THEN RAISE EXCEPTION 'Deleted customer/rental with booking'; END IF;
 DELETE FROM sauna_inventory WHERE id='10000000-0000-0000-0000-000000000001';
 IF NOT EXISTS(SELECT 1 FROM rentals WHERE customer_id=profile_one) THEN RAISE EXCEPTION 'Deleted rental with inventory'; END IF;
END;
$$;
SELECT 'PASS: unchanged legacy rows, separate identities, repeatable backfill, private access, stale edits, archive/restore, new bookings, no phantom reservations, no new delete blockers' AS result;
