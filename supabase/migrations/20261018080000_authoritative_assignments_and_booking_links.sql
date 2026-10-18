BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL sf_migration.restoring='on';
SET LOCAL sf_lifecycle.command='on';
-- Inventory assignment is the authority; legacy reservation pointers are a cache.
CREATE UNIQUE INDEX sauna_one_future_unit_per_booking ON sauna_inventory(future_customer_id) WHERE future_customer_id IS NOT NULL;
CREATE FUNCTION public.sync_booking_assignment_pointer(p_id uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE target uuid; prior uuid;
BEGIN
 SELECT sauna_inventory_id INTO prior FROM reservations WHERE id=p_id FOR UPDATE;
 IF NOT FOUND THEN RETURN;END IF;
 SELECT id INTO target FROM sauna_inventory WHERE current_customer_id=p_id OR future_customer_id=p_id ORDER BY (current_customer_id=p_id) DESC,unit_code LIMIT 1;
 IF prior IS DISTINCT FROM target THEN
  UPDATE reservations SET sauna_inventory_id=target,booking_version=booking_version+1 WHERE id=p_id;
  INSERT INTO reservation_events(reservation_id,event_type,message,metadata) VALUES(p_id,'Assignment link synchronized','Booking follows the authoritative inventory assignment.',jsonb_build_object('previousUnit',prior,'unit',target));
 END IF;
END; $$;
REVOKE ALL ON FUNCTION sync_booking_assignment_pointer(uuid) FROM PUBLIC,anon,authenticated,service_role;
CREATE FUNCTION public.inventory_booking_pointer_changed() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE rid uuid;
BEGIN
 FOR rid IN SELECT DISTINCT x FROM unnest(ARRAY[OLD.current_customer_id,OLD.future_customer_id,NEW.current_customer_id,NEW.future_customer_id]) x WHERE x IS NOT NULL LOOP PERFORM sync_booking_assignment_pointer(rid);END LOOP;
 RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION inventory_booking_pointer_changed() FROM PUBLIC,anon,authenticated,service_role;
CREATE TRIGGER inventory_booking_pointer_changed AFTER UPDATE OF current_customer_id,future_customer_id ON sauna_inventory FOR EACH ROW EXECUTE FUNCTION inventory_booking_pointer_changed();
-- Correct stale pointers only where inventory already has an explicit association.
DO $$ DECLARE rid uuid; BEGIN FOR rid IN SELECT current_customer_id FROM sauna_inventory WHERE current_customer_id IS NOT NULL UNION SELECT future_customer_id FROM sauna_inventory WHERE future_customer_id IS NOT NULL LOOP PERFORM sync_booking_assignment_pointer(rid);END LOOP;END; $$;
CREATE OR REPLACE FUNCTION public.booking_workspace() RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT coalesce(jsonb_agg(jsonb_build_object(
  'magicLink',CASE WHEN r.booking_kind<>'manual_historical' AND r.secure_token ~ '^[A-Za-z0-9_-]+$' THEN 'https://www.sfsaunarental.com/reservation/'||r.id::text||'?token='||r.secure_token END,'id',r.id,'customerId',l.customer_id,'customerName',coalesce(c.display_name,concat_ws(' ',r.first_name,r.last_name)),
  'state',r.booking_state,'version',r.booking_version,'installOn',r.booking_install_on,'saunaId',r.sauna_inventory_id,
  'saunaCode',i.unit_code,'saunaTypeId',r.sauna_type_id,'saunaType',st.name,'source',r.booking_kind,'legacyStatus',r.booking_legacy_status,
  'confirmationMode',r.booking_confirmation_mode,'confirmationNote',r.booking_confirmation_note,
  'readiness',booking_readiness(r.id),'rentalId',n.id,'rentalState',n.lifecycle_state,'purpose',coalesce(n.purpose,'rental'),
  'createdAt',r.created_at,'holdDeadline',r.hold_deadline,'installAddress',r.install_address
 ) ORDER BY r.created_at DESC),'[]'::jsonb)
 FROM reservations r LEFT JOIN reservation_customer_links l ON l.reservation_id=r.id LEFT JOIN customer_profiles c ON c.id=l.customer_id
 LEFT JOIN sauna_inventory i ON i.id=r.sauna_inventory_id LEFT JOIN sauna_types st ON st.id=r.sauna_type_id LEFT JOIN rentals n ON n.originating_reservation_id=r.id;
$$;

-- Owner acceptance can be recorded for a purchase before its handover is promised.
ALTER FUNCTION booking_command(uuid,text,jsonb) RENAME TO booking_command_before_oct18;
REVOKE ALL ON FUNCTION booking_command_before_oct18(uuid,text,jsonb) FROM PUBLIC,anon,authenticated,service_role;
CREATE FUNCTION public.booking_command(command_id uuid,operation text,payload jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE b reservations; a sauna_inventory; old booking_commands; result jsonb; t sauna_types;
BEGIN
 IF operation<>'accept_purchase' THEN RETURN booking_command_before_oct18(command_id,operation,payload);END IF;
 PERFORM pg_advisory_xact_lock(73417722);
 IF command_id IS NULL OR nullif(btrim(payload->>'reason'),'') IS NULL THEN RAISE EXCEPTION 'Acceptance note and request ID required';END IF;
 SELECT * INTO old FROM booking_commands WHERE id=command_id;
 IF FOUND THEN IF old.operation<>operation OR old.request<>payload THEN RAISE EXCEPTION 'Request ID already used';END IF;RETURN old.result;END IF;
 SELECT * INTO b FROM reservations WHERE id=(payload->>'id')::uuid FOR UPDATE;
 IF NOT FOUND OR b.booking_version IS DISTINCT FROM (payload->>'version')::integer THEN RAISE EXCEPTION 'Booking changed; refresh before saving' USING ERRCODE='40001';END IF;
 IF b.booking_kind='manual_historical' OR b.booking_state IN('fulfilled','cancelled') OR NOT EXISTS(SELECT 1 FROM rentals WHERE originating_reservation_id=b.id AND purpose='purchase') THEN RAISE EXCEPTION 'Choose an open purchase booking';END IF;
 SELECT * INTO a FROM sauna_inventory WHERE id=(payload->>'assetId')::uuid FOR UPDATE;
 SELECT * INTO t FROM sauna_types WHERE id=b.sauna_type_id;
 IF a.id IS NULL OR nullif(btrim(a.unit_code),'') IS NULL OR a.retired_on IS NOT NULL OR a.status='Sold' OR a.future_customer_id IS NOT NULL AND a.future_customer_id<>b.id THEN RAISE EXCEPTION 'Choose a numbered unit that is not sold or reserved for another booking';END IF;
 IF NOT coalesce(a.sauna_type_id=b.sauna_type_id OR (a.style=t.style AND (CASE WHEN a.model_key IN('v1_fir_cedar','v2_cedar') THEN 'standard' ELSE a.model_key END)=t.model_key AND t.location=ANY(a.locations)),false) THEN RAISE EXCEPTION 'The unit must match the purchase type';END IF;
 PERFORM set_config('sf_lifecycle.command','on',true);
 UPDATE sauna_inventory SET future_customer_id=NULL,future_customer=NULL,status=CASE WHEN current_customer_id IS NOT NULL THEN status WHEN condition_state='ready' THEN 'Available' ELSE 'Maintenance' END WHERE future_customer_id=b.id AND id<>a.id;
 UPDATE sauna_inventory SET future_customer_id=b.id,future_customer=(SELECT c.display_name FROM customer_profiles c JOIN reservation_customer_links l ON l.customer_id=c.id WHERE l.reservation_id=b.id) WHERE id=a.id;
 UPDATE reservations SET sauna_inventory_id=a.id,booking_install_on=NULL,booking_state='requested',booking_confirmation_mode='manual',booking_confirmation_note=payload->>'reason',booking_version=booking_version+1 WHERE id=b.id;
 INSERT INTO reservation_events(reservation_id,event_type,message,metadata) VALUES(b.id,'Purchase accepted; handover pending',payload->>'reason',jsonb_build_object('unit',a.id,'previousDate',b.booking_install_on));
 result:=jsonb_build_object('id',b.id,'state','requested');
 INSERT INTO booking_commands(id,booking_id,operation,request,result) VALUES(command_id,b.id,operation,payload,result);
 RETURN result;
END; $$;
REVOKE ALL ON FUNCTION booking_command(uuid,text,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION booking_command(uuid,text,jsonb) TO service_role;
-- Extend the existing reviewed batch to date terms and correct existing sale notes.
ALTER FUNCTION rental_lifecycle_command(uuid,text,jsonb) RENAME TO rental_lifecycle_before_oct18;
REVOKE ALL ON FUNCTION rental_lifecycle_before_oct18(uuid,text,jsonb) FROM PUBLIC,anon,authenticated,service_role;
CREATE FUNCTION public.rental_lifecycle_command(command_id uuid,operation text,payload jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE result jsonb; x jsonb; previous jsonb;
BEGIN
 IF operation<>'owner_review_batch' THEN RETURN rental_lifecycle_before_oct18(command_id,operation,payload);END IF;
 PERFORM pg_advisory_xact_lock(73417722);
 IF EXISTS(SELECT 1 FROM rental_lifecycle_commands WHERE id=command_id) THEN RETURN rental_lifecycle_before_oct18(command_id,operation,payload);END IF;
 result:=rental_lifecycle_before_oct18(command_id,operation,payload);
 FOR x IN SELECT value FROM jsonb_array_elements(coalesce(payload->'reclassifyAllocations','[]')) LOOP
  SELECT to_jsonb(a) INTO STRICT previous FROM rental_payment_allocations a WHERE source_id=x->>'sourceId' AND customer_id=(x->>'customerId')::uuid AND category=x->>'previousCategory' AND amount_cents=(x->>'expectedAmountCents')::bigint AND voided_at IS NULL FOR UPDATE;
  IF previous IS NULL OR NOT EXISTS(SELECT 1 FROM jsonb_array_elements(payload->'rentals') j WHERE j->>'id'=previous->>'rental_id') THEN RAISE EXCEPTION 'Classification correction requires an active allocation and version-checked service record';END IF;
  PERFORM rental_lifecycle_before_oct18(gen_random_uuid(),'void_allocation',jsonb_build_object('allocationId',previous->>'id','reason',payload->>'reason'));
  PERFORM rental_lifecycle_before_oct18(gen_random_uuid(),'allocate_payment',jsonb_build_object('tenantId',previous->>'tenant_id','sourceId',previous->>'source_id','customerId',previous->>'customer_id','saleId',x->>'saleId','category',x->>'category','amountCents',previous->'amount_cents','notes',payload->>'reason'));
 END LOOP;
 FOR x IN SELECT value FROM jsonb_array_elements(coalesce(payload->'termDates','[]')) LOOP
  IF NOT EXISTS(SELECT 1 FROM jsonb_array_elements(payload->'rentals') j WHERE j->>'id'=x->>'rentalId') OR NOT EXISTS(SELECT 1 FROM rental_terms WHERE id=(x->>'id')::uuid AND rental_id=(x->>'rentalId')::uuid) THEN RAISE EXCEPTION 'Term dates require a version-checked rental';END IF;
  SELECT to_jsonb(t) INTO previous FROM rental_terms t WHERE id=(x->>'id')::uuid;
  UPDATE rental_terms SET effective_from=CASE WHEN x ? 'from' THEN (x->>'from')::date ELSE effective_from END,effective_until=CASE WHEN x ? 'until' THEN (x->>'until')::date ELSE effective_until END,note=concat_ws(E'\n',note,x->>'note') WHERE id=(x->>'id')::uuid;
  INSERT INTO rental_history_events(rental_id,event_type,detail) VALUES((x->>'rentalId')::uuid,'Term dates reviewed',jsonb_build_object('before',previous,'correction',x,'note',payload->>'reason'));
 END LOOP;
 FOR x IN SELECT value FROM jsonb_array_elements(coalesce(payload->'saleCorrections','[]')) LOOP
  IF NOT EXISTS(SELECT 1 FROM jsonb_array_elements(payload->'rentals') j WHERE j->>'id'=x->>'rentalId') THEN RAISE EXCEPTION 'Sale correction requires a version-checked service record';END IF;
  SELECT to_jsonb(s) INTO previous FROM sauna_sales s WHERE id=(x->>'id')::uuid AND rental_id=(x->>'rentalId')::uuid;
  IF previous IS NULL THEN RAISE EXCEPTION 'Sale not found';END IF;
  UPDATE sauna_sales SET note=coalesce(x->>'note',note),agreed_cents=CASE WHEN x ? 'agreedCents' THEN (x->>'agreedCents')::bigint ELSE agreed_cents END WHERE id=(x->>'id')::uuid;
  INSERT INTO rental_history_events(rental_id,event_type,detail) VALUES((x->>'rentalId')::uuid,'Sale details reviewed',jsonb_build_object('before',previous,'correction',x,'note',payload->>'reason'));
 END LOOP;
 RETURN result;
END; $$;
REVOKE ALL ON FUNCTION rental_lifecycle_command(uuid,text,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION rental_lifecycle_command(uuid,text,jsonb) TO service_role;
NOTIFY pgrst,'reload schema';
COMMIT;
