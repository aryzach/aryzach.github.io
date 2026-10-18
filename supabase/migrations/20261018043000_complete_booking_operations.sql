BEGIN;
-- Close the remaining operational paths without inventing historical install dates.
ALTER FUNCTION public.booking_command(uuid,text,jsonb) RENAME TO booking_command_before_completion;
REVOKE ALL ON FUNCTION booking_command_before_completion(uuid,text,jsonb) FROM PUBLIC,anon,authenticated,service_role;
CREATE FUNCTION public.booking_command(command_id uuid,operation text,payload jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE b reservations; a sauna_inventory; n rentals; prior booking_commands; result jsonb;
BEGIN
 IF operation<>'complete_purchase' THEN RETURN booking_command_before_completion(command_id,operation,payload);END IF;
 PERFORM pg_advisory_xact_lock(73417722);
 SELECT * INTO prior FROM booking_commands WHERE id=command_id;
 IF FOUND THEN IF prior.operation<>operation OR prior.request<>payload THEN RAISE EXCEPTION 'Request ID already used';END IF;RETURN prior.result;END IF;
 SELECT * INTO b FROM reservations WHERE id=(payload->>'id')::uuid FOR UPDATE;
 IF b.booking_version IS DISTINCT FROM (payload->>'version')::integer THEN RAISE EXCEPTION 'Booking changed; refresh before saving' USING ERRCODE='40001';END IF;
 SELECT * INTO n FROM rentals WHERE originating_reservation_id=b.id FOR UPDATE;
 IF n.purpose IS DISTINCT FROM 'purchase' OR b.booking_state<>'confirmed' OR b.booking_confirmation_mode IS DISTINCT FROM 'manual' THEN RAISE EXCEPTION 'Manually confirm this purchase booking before completing handover';END IF;
 IF nullif(payload->>'date','')::date IS NULL OR (payload->>'date')::date>(now() AT TIME ZONE 'America/Los_Angeles')::date OR nullif(btrim(payload->>'reason'),'') IS NULL THEN RAISE EXCEPTION 'Actual handover date and confirmation note required';END IF;
 SELECT * INTO a FROM sauna_inventory WHERE id=b.sauna_inventory_id FOR UPDATE;
 IF a.id IS NULL OR a.future_customer_id IS DISTINCT FROM b.id OR a.current_customer_id IS NOT NULL THEN RAISE EXCEPTION 'The purchased unit must be allocated to this booking and returned from any previous renter';END IF;
 PERFORM set_config('sf_lifecycle.command','on',true);
 -- Release only this purchase's planned link, then record its sale in the same transaction.
 UPDATE sauna_inventory SET future_customer_id=NULL,future_customer=NULL WHERE id=a.id;
 result:=rental_lifecycle_command(command_id,'sale',jsonb_build_object('assetId',a.id,'customerId',n.customer_id,'date',payload->>'date','amountCents',payload->'amountCents','notes',payload->>'reason'));
 UPDATE sauna_sales SET rental_id=n.id WHERE id=(result->>'recordId')::uuid;
 UPDATE rentals SET lifecycle_state='ended',actual_end=(payload->>'date')::date,version=version+1 WHERE id=n.id;
 UPDATE reservations SET booking_state='fulfilled',booking_version=booking_version+1 WHERE id=b.id;
 INSERT INTO reservation_events(reservation_id,event_type,message,metadata) VALUES(b.id,'Purchase fulfilled',payload->>'reason',result);
 INSERT INTO booking_commands(id,booking_id,operation,request,result) VALUES(command_id,b.id,operation,payload,result);
 RETURN result;
END; $$;
REVOKE ALL ON FUNCTION booking_command(uuid,text,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION booking_command(uuid,text,jsonb) TO service_role;

ALTER FUNCTION public.rental_lifecycle_command(uuid,text,jsonb) RENAME TO rental_lifecycle_before_legacy_returns;
REVOKE ALL ON FUNCTION rental_lifecycle_before_legacy_returns(uuid,text,jsonb) FROM PUBLIC,anon,authenticated,service_role;
CREATE FUNCTION public.rental_lifecycle_command(command_id uuid,operation text,payload jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE r rentals; a sauna_inventory; prior rental_lifecycle_commands; result jsonb; replacement uuid; commitment date;
BEGIN
 IF operation NOT IN('legacy_return','legacy_swap') THEN RETURN rental_lifecycle_before_legacy_returns(command_id,operation,payload);END IF;
 PERFORM pg_advisory_xact_lock(73417722);
 SELECT * INTO prior FROM rental_lifecycle_commands WHERE id=command_id;
 IF FOUND THEN IF prior.command<>operation OR prior.request<>payload THEN RAISE EXCEPTION 'Request ID already used';END IF;RETURN prior.result;END IF;
 SELECT * INTO r FROM rentals WHERE id=(payload->>'rentalId')::uuid FOR UPDATE;
 IF r.version IS DISTINCT FROM (payload->>'version')::integer THEN RAISE EXCEPTION 'Rental changed; refresh before saving' USING ERRCODE='40001';END IF;
 SELECT * INTO a FROM sauna_inventory WHERE id=(payload->>'legacyAssetId')::uuid FOR UPDATE;
 IF a.id IS NULL OR a.current_customer_id IS DISTINCT FROM r.originating_reservation_id OR r.lifecycle_state IN('canceled','ended') OR a.status='Sold' OR EXISTS(SELECT 1 FROM rental_placements WHERE asset_id=a.id AND removed_on IS NULL) THEN RAISE EXCEPTION 'Choose this rental’s existing current sauna with unconfirmed placement history';END IF;
 IF nullif(payload->>'date','')::date IS NULL OR (payload->>'date')::date>(now() AT TIME ZONE 'America/Los_Angeles')::date OR (payload->>'date')::date<r.actual_start OR nullif(btrim(payload->>'evidence'),'') IS NULL THEN RAISE EXCEPTION 'Confirmed actual return date and evidence required';END IF;
 PERFORM set_config('sf_lifecycle.command','on',true);
 commitment:=a.minimum_term_ends;
 UPDATE sauna_inventory SET current_customer_id=NULL,current_customer=NULL,install_date=NULL,minimum_term_ends=NULL,condition_state='inspection',status=CASE WHEN future_customer_id IS NULL THEN 'Maintenance' ELSE 'Transfer Planned' END WHERE id=a.id;
 INSERT INTO rental_history_events(rental_id,asset_id,event_type,occurred_on,detail) VALUES(r.id,a.id,'legacy_current_return',(payload->>'date')::date,jsonb_build_object('note',payload->>'evidence','priorInstallDate',a.install_date,'placementStartUnknown',true,'source','Existing current inventory association; no placement start manufactured'));
 IF operation='legacy_swap' THEN
  replacement:=(payload->>'assetId')::uuid;
  IF replacement=a.id THEN RAISE EXCEPTION 'Choose a different replacement sauna';END IF;
  result:=rental_lifecycle_before_bookings(gen_random_uuid(),'install',payload-'legacyAssetId');
  UPDATE sauna_inventory SET minimum_term_ends=commitment WHERE id=replacement;
 ELSE
  UPDATE rentals SET version=version+1 WHERE id=r.id;
  result:=jsonb_build_object('rentalId',r.id,'assetId',a.id);
 END IF;
 INSERT INTO rental_lifecycle_commands(id,command,request,result) VALUES(command_id,operation,payload,result);
 RETURN result;
END; $$;
REVOKE ALL ON FUNCTION rental_lifecycle_command(uuid,text,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION rental_lifecycle_command(uuid,text,jsonb) TO service_role;
CREATE OR REPLACE FUNCTION public.sauna_condition_compatibility() RETURNS trigger LANGUAGE plpgsql SET search_path=public,pg_temp AS $$ BEGIN
 IF TG_OP='INSERT' THEN
  IF NEW.condition_state='unknown' AND NEW.status IN('Available','Maintenance') THEN NEW.condition_state:=CASE WHEN NEW.status='Available' THEN 'ready' ELSE 'maintenance' END;END IF;
 ELSIF NEW.condition_state IS NOT DISTINCT FROM OLD.condition_state AND NEW.status IS DISTINCT FROM OLD.status THEN
  IF NEW.status='Maintenance' THEN NEW.condition_state:=CASE WHEN OLD.current_customer_id IS NOT NULL AND NEW.current_customer_id IS NULL THEN 'inspection' ELSE 'maintenance' END;
  ELSIF NEW.status='Available' THEN NEW.condition_state:='ready';END IF;
 END IF;
 IF TG_OP='UPDATE' AND NEW.available_date IS DISTINCT FROM OLD.available_date AND EXISTS(SELECT 1 FROM reservations b WHERE b.sauna_inventory_id=NEW.id AND b.booking_state='confirmed' AND b.booking_install_on IS NOT NULL AND NEW.current_customer_id IS DISTINCT FROM b.id AND NEW.current_customer_id IS NOT NULL AND (NEW.available_date IS NULL OR NEW.available_date>b.booking_install_on)) THEN RAISE EXCEPTION 'Resolve the confirmed booking before moving sauna availability past its promised date';END IF;
 RETURN NEW;
END; $$;
NOTIFY pgrst,'reload schema';
COMMIT;
