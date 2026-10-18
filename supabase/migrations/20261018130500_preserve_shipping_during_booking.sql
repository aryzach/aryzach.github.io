BEGIN;
-- Retain shipment facts when legacy booking code changes reservation labels.
CREATE OR REPLACE FUNCTION public.sauna_inventory_status_reservation_compat() RETURNS trigger
LANGUAGE plpgsql SET search_path=public,pg_temp AS $$
DECLARE shipping_changed boolean; allowed text[]:=ARRAY['Installed','Returning','Reservation Hold','Reservation Confirmed','Pending Payment','Needs Manual Review','Cancelled','Refunded','Transfer Planned','Sold','Pre-sold','Incoming'];
BEGIN
 shipping_changed:=TG_OP='INSERT';
 IF TG_OP='UPDATE' THEN shipping_changed:=NEW.incoming_eta IS DISTINCT FROM OLD.incoming_eta OR (OLD.status IS DISTINCT FROM 'Incoming' AND NEW.status='Incoming');END IF;
 IF TG_OP='UPDATE' AND OLD.status='Incoming' AND NEW.current_customer_id IS NULL AND NEW.retired_on IS NULL AND current_setting('sf_lifecycle.receiving',true) IS DISTINCT FROM 'on' AND
  (NEW.status IN('Reservation Hold','Reservation Confirmed','Pre-sold') OR (NEW.future_customer_id IS DISTINCT FROM OLD.future_customer_id AND NEW.status IN('Available','Maintenance'))) THEN
  NEW.status:='Incoming';
 END IF;
 -- Available is a legacy readiness label; a retained allocation still reserves the unit.
 IF NEW.status='Available' AND NEW.current_customer_id IS NULL AND NEW.future_customer_id IS NOT NULL THEN
  NEW.status:=CASE WHEN EXISTS(SELECT 1 FROM rentals r WHERE r.originating_reservation_id=NEW.future_customer_id AND r.purpose='purchase') THEN 'Pre-sold' ELSE 'Reservation Hold' END;
 END IF;
 IF NEW.status='Incoming' THEN
  IF NEW.current_customer_id IS NOT NULL THEN RAISE EXCEPTION 'A sauna with a current customer cannot be Incoming';END IF;
  IF shipping_changed AND EXISTS(SELECT 1 FROM reservations b WHERE (b.id=NEW.future_customer_id OR b.sauna_inventory_id=NEW.id) AND b.booking_state='confirmed' AND (NEW.incoming_eta IS NULL OR b.booking_install_on IS NULL OR NEW.incoming_eta>b.booking_install_on)) THEN RAISE EXCEPTION 'Expected arrival must be on or before each confirmed installation date';END IF;
 END IF;
 IF (NEW.current_customer_id IS NOT NULL OR NEW.future_customer_id IS NOT NULL) AND NOT(NEW.status=ANY(allowed)) THEN RAISE EXCEPTION 'Sauna tied to a reservation must have a reservation-compatible status (got %)',NEW.status;END IF;
 RETURN NEW;
END; $$;
CREATE OR REPLACE FUNCTION public.rental_lifecycle_command(command_id uuid,operation text,payload jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE a sauna_inventory; prior rental_lifecycle_commands; day date; eta date; destination text; result jsonb;
BEGIN
 IF operation IS DISTINCT FROM 'asset_status' OR payload->>'status' IS NULL OR payload->>'status' NOT IN('Incoming','Available') THEN
  RETURN rental_lifecycle_before_incoming_fleet(command_id,operation,payload);
 END IF;
 PERFORM pg_advisory_xact_lock(73417722);
 SELECT * INTO prior FROM rental_lifecycle_commands WHERE id=command_id;
 IF FOUND THEN
  IF prior.command<>operation OR prior.request<>payload THEN RAISE EXCEPTION 'Request ID already used for another operation';END IF;
  RETURN prior.result;
 END IF;
 SELECT * INTO a FROM sauna_inventory WHERE id=(payload->>'assetId')::uuid FOR UPDATE;
 IF payload->>'status'='Available' AND a.status IS DISTINCT FROM 'Incoming' THEN RETURN rental_lifecycle_before_incoming_fleet(command_id,operation,payload);END IF;
 IF command_id IS NULL OR a.id IS NULL THEN RAISE EXCEPTION 'Choose a sauna and request ID';END IF;
 day:=nullif(payload->>'date','')::date;
 IF day IS NULL OR day>(now() AT TIME ZONE 'America/Los_Angeles')::date OR nullif(btrim(payload->>'reason'),'') IS NULL THEN RAISE EXCEPTION 'Status effective date and reason required';END IF;
 IF a.current_customer_id IS NOT NULL OR a.status IN('Installed','Returning','Sold') OR a.retired_on IS NOT NULL OR EXISTS(SELECT 1 FROM sauna_sales WHERE asset_id=a.id) OR EXISTS(SELECT 1 FROM rental_placements WHERE asset_id=a.id AND removed_on IS NULL) THEN RAISE EXCEPTION 'Record the current rental return first; installed, sold or retired saunas cannot be marked as incoming or received';END IF;
 IF EXISTS(SELECT 1 FROM rental_placements WHERE asset_id=a.id AND removed_on>day) THEN RAISE EXCEPTION 'Status date cannot precede the last confirmed return';END IF;
 eta:=CASE WHEN nullif(payload->>'incomingEta','') IS NOT NULL THEN (payload->>'incomingEta')::date ELSE a.incoming_eta END;
 IF payload->>'status'='Incoming' AND EXISTS(SELECT 1 FROM reservations b WHERE b.sauna_inventory_id=a.id AND b.booking_state='confirmed' AND (eta IS NULL OR b.booking_install_on IS NULL OR eta>b.booking_install_on)) THEN RAISE EXCEPTION 'Expected arrival must be on or before each confirmed installation date; resolve the booking before changing that promise';END IF;
 PERFORM set_config('sf_lifecycle.command','on',true);
 destination:=CASE WHEN payload->>'status'='Incoming' THEN 'Incoming' WHEN EXISTS(SELECT 1 FROM rentals r WHERE r.originating_reservation_id=a.future_customer_id AND r.purpose='purchase') THEN 'Pre-sold' ELSE 'Available' END;
 PERFORM set_config('sf_lifecycle.receiving',CASE WHEN payload->>'status'='Available' THEN 'on' ELSE 'off' END,true);
 UPDATE sauna_inventory SET status=destination,
  incoming_eta=CASE WHEN destination='Incoming' THEN eta ELSE incoming_eta END,
  condition_state=CASE WHEN destination='Incoming' THEN condition_state ELSE 'ready' END WHERE id=a.id;
 PERFORM set_config('sf_lifecycle.receiving','off',true);
 SELECT status INTO destination FROM sauna_inventory WHERE id=a.id;
 result:=jsonb_build_object('assetId',a.id,'status',destination);
 INSERT INTO rental_history_events(asset_id,event_type,occurred_on,detail) VALUES(a.id,'asset_status',day,jsonb_build_object('before',jsonb_build_object('status',a.status,'incomingEta',a.incoming_eta,'condition',a.condition_state),'after',jsonb_build_object('status',destination,'incomingEta',eta),'note',payload->>'reason','futureReservationPreserved',a.future_customer_id));
 INSERT INTO rental_lifecycle_commands(id,command,request,result) VALUES(command_id,operation,payload,result);
 RETURN result;
END; $$;
REVOKE ALL ON FUNCTION public.rental_lifecycle_command(uuid,text,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.rental_lifecycle_command(uuid,text,jsonb) TO service_role;
NOTIFY pgrst,'reload schema';
COMMIT;
