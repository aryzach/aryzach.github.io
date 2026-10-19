BEGIN;
-- Arrival and bookable date are distinct. Preserve legacy values until explicitly corrected.
CREATE OR REPLACE FUNCTION public.require_inbound_booking_dates() RETURNS trigger LANGUAGE plpgsql SET search_path=public,pg_temp AS $$
DECLARE changing boolean;
BEGIN
 changing:=TG_OP='INSERT';
 IF TG_OP='UPDATE' THEN changing:=NEW.status IS DISTINCT FROM OLD.status OR NEW.incoming_eta IS DISTINCT FROM OLD.incoming_eta OR NEW.available_date IS DISTINCT FROM OLD.available_date;END IF;
 IF changing AND NEW.status='Incoming' THEN
  IF NEW.incoming_eta IS NULL THEN RAISE EXCEPTION 'Inbound date is required';END IF;
  IF NEW.available_date IS NOT NULL AND NEW.available_date<=NEW.incoming_eta THEN RAISE EXCEPTION 'Booking availability must be after the inbound date';END IF;
  IF current_setting('sf_lifecycle.fleet_correction',true) IS DISTINCT FROM 'on' AND EXISTS(SELECT 1 FROM reservations b WHERE (b.sauna_inventory_id=NEW.id OR b.id=NEW.future_customer_id) AND b.booking_state='confirmed' AND (NEW.available_date IS NULL OR NEW.available_date>b.booking_install_on)) THEN RAISE EXCEPTION 'Use the fleet editor to acknowledge the booking date conflict';END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER zz_require_inbound_booking_dates BEFORE INSERT OR UPDATE ON public.sauna_inventory FOR EACH ROW EXECUTE FUNCTION public.require_inbound_booking_dates();
CREATE OR REPLACE FUNCTION public.booking_readiness(p_id uuid) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE r reservations; a sauna_inventory; t sauna_types; unit_ok boolean:=false; signed_ok boolean; id_ok boolean; date_ok boolean:=false;
BEGIN
 SELECT * INTO r FROM reservations WHERE id=p_id; IF NOT FOUND THEN RETURN NULL; END IF;
 SELECT * INTO a FROM sauna_inventory WHERE id=r.sauna_inventory_id;
 SELECT * INTO t FROM sauna_types WHERE id=r.sauna_type_id;
 IF a.id IS NOT NULL THEN
  unit_ok:=nullif(btrim(a.unit_code),'') IS NOT NULL AND a.retired_on IS NULL AND a.status NOT IN('Sold','Maintenance') AND (a.status<>'Pre-sold' OR (a.future_customer_id=r.id AND EXISTS(SELECT 1 FROM rentals purchase_rental WHERE purchase_rental.originating_reservation_id=r.id AND purchase_rental.purpose='purchase'))) AND a.condition_state NOT IN('inspection','maintenance')
   AND (a.future_customer_id=r.id OR a.current_customer_id=r.id OR a.reservation_id=r.id)
   AND (a.sauna_type_id=r.sauna_type_id OR (a.style=t.style AND (CASE WHEN a.model_key IN('v1_fir_cedar','v2_cedar') THEN 'standard' ELSE a.model_key END)=t.model_key AND t.location=ANY(a.locations)));
  date_ok:=r.booking_install_on IS NOT NULL AND (a.current_customer_id IS NULL OR a.current_customer_id=r.id OR a.available_date<=r.booking_install_on)
   AND (a.status<>'Incoming' OR (a.incoming_eta IS NOT NULL AND a.available_date>a.incoming_eta AND a.available_date<=r.booking_install_on));
 END IF;
 signed_ok:=EXISTS(SELECT 1 FROM contracts c WHERE c.reservation_id=r.id AND c.status='Signed' AND c.voided_at IS NULL);
 id_ok:=r.id_status='Complete' AND EXISTS(SELECT 1 FROM storage.objects o WHERE o.bucket_id='reservation-ids' AND o.name LIKE r.id::text||'/%');
 RETURN jsonb_build_object('agreement',signed_ok,'deposit',r.payment_status='Paid','photoId',id_ok,'numberedUnit',coalesce(unit_ok,false),'date',coalesce(date_ok,false));
END; $$;
CREATE OR REPLACE FUNCTION public.booking_command_before_completion(command_id uuid,operation text,payload jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE r reservations; a sauna_inventory; t sauna_types; old booking_commands; out jsonb; target uuid; install_day date; reason text; n rentals; old_asset uuid;
BEGIN
 IF command_id IS NULL THEN RAISE EXCEPTION 'Request ID required';END IF;
 PERFORM pg_advisory_xact_lock(73417722);
 SELECT * INTO old FROM booking_commands WHERE id=command_id;
 IF FOUND THEN IF old.operation<>operation OR old.request<>payload THEN RAISE EXCEPTION 'Request ID already used for another operation';END IF;RETURN old.result;END IF;
 IF operation='condition' THEN
  SELECT * INTO a FROM sauna_inventory WHERE id=(payload->>'assetId')::uuid FOR UPDATE;
  IF NOT FOUND OR a.status='Sold' OR a.retired_on IS NOT NULL THEN RAISE EXCEPTION 'Choose an in-fleet sauna';END IF;
  IF payload->>'condition' NOT IN('ready','inspection','maintenance') OR nullif(btrim(payload->>'reason'),'') IS NULL THEN RAISE EXCEPTION 'Condition and reason required';END IF;
  IF EXISTS(SELECT 1 FROM reservations b WHERE b.sauna_inventory_id=a.id AND b.booking_state='confirmed') AND payload->>'condition'<>'ready' THEN RAISE EXCEPTION 'Resolve the confirmed booking before making this unit unavailable';END IF;
  UPDATE sauna_inventory SET condition_state=payload->>'condition',status=CASE WHEN current_customer_id IS NULL AND future_customer_id IS NULL AND status<>'Incoming' THEN CASE WHEN payload->>'condition'='ready' THEN 'Available' ELSE 'Maintenance' END ELSE status END WHERE id=a.id;
  INSERT INTO rental_history_events(asset_id,event_type,occurred_on,detail) VALUES(a.id,'condition_changed',(now() AT TIME ZONE 'America/Los_Angeles')::date,jsonb_build_object('before',a.condition_state,'after',payload->>'condition','reason',payload->>'reason'));
  out:=jsonb_build_object('assetId',a.id);
 ELSE
  SELECT * INTO r FROM reservations WHERE id=(payload->>'id')::uuid FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Booking not found';END IF;
  IF (payload->>'version')::integer IS DISTINCT FROM r.booking_version THEN RAISE EXCEPTION 'Booking changed; refresh before saving' USING ERRCODE='40001';END IF;
  IF r.booking_kind='manual_historical' THEN RAISE EXCEPTION 'Manage historical corrections in rental history';END IF;
  IF r.booking_state IN('fulfilled','cancelled') THEN RAISE EXCEPTION 'This booking is closed; use rental history for an existing rental';END IF;
  IF operation IN('allocate','confirm') THEN
   target:=coalesce(nullif(payload->>'assetId','')::uuid,r.sauna_inventory_id);
   install_day:=coalesce(nullif(payload->>'installOn','')::date,r.booking_install_on);
   IF install_day IS NULL OR install_day<(now() AT TIME ZONE 'America/Los_Angeles')::date THEN RAISE EXCEPTION 'Choose a confirmed installation date today or later';END IF;
   SELECT * INTO a FROM sauna_inventory WHERE id=target FOR UPDATE;
   SELECT * INTO t FROM sauna_types WHERE id=r.sauna_type_id;
   IF a.id IS NULL OR nullif(btrim(a.unit_code),'') IS NULL OR a.retired_on IS NOT NULL OR (a.status IN('Sold','Maintenance') OR (a.status='Pre-sold' AND NOT (a.future_customer_id=r.id AND EXISTS(SELECT 1 FROM rentals purchase_rental WHERE purchase_rental.originating_reservation_id=r.id AND purchase_rental.purpose='purchase')))) OR a.condition_state IN('maintenance','inspection') THEN RAISE EXCEPTION 'Choose a numbered, serviceable sauna';END IF;
   IF NOT coalesce(a.sauna_type_id=r.sauna_type_id OR (a.style=t.style AND (CASE WHEN a.model_key IN('v1_fir_cedar','v2_cedar') THEN 'standard' ELSE a.model_key END)=t.model_key AND t.location=ANY(a.locations)),false) THEN RAISE EXCEPTION 'The numbered sauna does not match the booked type';END IF;
   IF a.future_customer_id IS NOT NULL AND a.future_customer_id<>r.id THEN RAISE EXCEPTION 'This sauna is reserved for another booking';END IF;
   IF a.current_customer_id IS NOT NULL AND a.current_customer_id<>r.id AND (a.available_date IS NULL OR a.available_date>install_day) THEN RAISE EXCEPTION 'This sauna will not be available by the installation date';END IF;
   IF a.status='Incoming' AND (a.incoming_eta IS NULL OR a.available_date IS NULL OR a.available_date<=a.incoming_eta OR a.available_date>install_day) THEN RAISE EXCEPTION 'Set booking availability after inbound and on or before installation';END IF;
   reason:=nullif(btrim(payload->>'reason'),'');
   IF operation='confirm' AND reason IS NULL THEN RAISE EXCEPTION 'Manual confirmation requires an exception or acceptance note';END IF;
   old_asset:=r.sauna_inventory_id;
   UPDATE sauna_inventory SET future_customer_id=NULL,future_customer=NULL,status=CASE WHEN current_customer_id IS NOT NULL THEN status WHEN condition_state='ready' THEN 'Available' ELSE 'Maintenance' END WHERE future_customer_id=r.id AND id<>target;
   UPDATE sauna_inventory SET future_customer_id=r.id,future_customer=coalesce((SELECT c.display_name FROM customer_profiles c JOIN reservation_customer_links l ON l.customer_id=c.id WHERE l.reservation_id=r.id),r.first_name||' '||r.last_name),status=CASE WHEN current_customer_id IS NOT NULL OR status='Pre-sold' THEN status ELSE 'Reservation Hold' END WHERE id=target;
   UPDATE reservations SET sauna_inventory_id=target,booking_install_on=install_day,booking_version=booking_version+1,
     booking_confirmation_mode=CASE WHEN operation='confirm' THEN 'manual' WHEN old_asset IS DISTINCT FROM target OR booking_install_on IS DISTINCT FROM install_day THEN NULL ELSE booking_confirmation_mode END,
     booking_confirmation_note=CASE WHEN operation='confirm' THEN reason WHEN old_asset IS DISTINCT FROM target OR booking_install_on IS DISTINCT FROM install_day THEN NULL ELSE booking_confirmation_note END WHERE id=r.id;
   PERFORM booking_reconcile(r.id);
   IF operation='confirm' AND NOT EXISTS(SELECT 1 FROM rentals x WHERE x.originating_reservation_id=r.id) THEN
    INSERT INTO rentals(customer_id,originating_reservation_id,service_address,lifecycle_state) SELECT l.customer_id,r.id,r.install_address,'planned' FROM reservation_customer_links l WHERE l.reservation_id=r.id;
   END IF;
  ELSIF operation='cancel' THEN
   IF nullif(btrim(payload->>'reason'),'') IS NULL THEN RAISE EXCEPTION 'Cancellation reason required';END IF;
   IF EXISTS(SELECT 1 FROM rentals x WHERE x.originating_reservation_id=r.id AND (x.actual_start IS NOT NULL OR x.lifecycle_state IN('active','ended'))) OR EXISTS(SELECT 1 FROM rental_placements p JOIN rentals x ON x.id=p.rental_id WHERE x.originating_reservation_id=r.id) THEN RAISE EXCEPTION 'This rental has started; use return and end rental';END IF;
   IF EXISTS(SELECT 1 FROM contracts c WHERE c.reservation_id=r.id AND c.status='Signed') AND NOT EXISTS(SELECT 1 FROM rental_settlements s JOIN rentals x ON x.id=s.rental_id WHERE x.originating_reservation_id=r.id) THEN RAISE EXCEPTION 'Record the signed agreement cancellation settlement in Rentals first';END IF;
   UPDATE reservations SET booking_state='cancelled',booking_confirmation_note=payload->>'reason',booking_version=booking_version+1 WHERE id=r.id;
   UPDATE sauna_inventory SET future_customer_id=NULL,future_customer=NULL,status=CASE WHEN current_customer_id IS NOT NULL THEN status WHEN condition_state='ready' THEN 'Available' ELSE 'Maintenance' END WHERE future_customer_id=r.id;
   UPDATE rentals SET lifecycle_state='canceled',version=version+1 WHERE originating_reservation_id=r.id AND lifecycle_state IN('unconfirmed','planned');
  ELSE RAISE EXCEPTION 'Unsupported booking operation';END IF;
  INSERT INTO reservation_events(reservation_id,event_type,message,metadata) VALUES(r.id,'Booking '||operation,coalesce(reason,payload->>'reason','Numbered unit and date updated'),jsonb_build_object('previousUnit',r.sauna_inventory_id,'unit',target,'installOn',install_day));
  SELECT jsonb_build_object('id',id,'state',booking_state,'version',booking_version) INTO out FROM reservations WHERE id=r.id;
 END IF;
 INSERT INTO booking_commands(id,booking_id,operation,request,result) VALUES(command_id,r.id,operation,payload,out);
 RETURN out;
END; $$;
CREATE OR REPLACE FUNCTION public.rental_lifecycle_command(command_id uuid,operation text,payload jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE a sauna_inventory; prior rental_lifecycle_commands; day date; eta date; available_day date; destination text; result jsonb; conflicts jsonb;
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
 available_day:=CASE WHEN payload ? 'availableOn' THEN nullif(payload->>'availableOn','')::date ELSE a.available_date END;
 IF payload->>'status'='Incoming' AND eta IS NULL THEN RAISE EXCEPTION 'Inbound date is required';END IF;
 IF payload->>'status'='Incoming' AND available_day IS NOT NULL AND available_day<=eta THEN RAISE EXCEPTION 'Booking availability must be after the inbound date';END IF;
 SELECT coalesce(jsonb_agg(jsonb_build_object('bookingId',b.id,'installOn',b.booking_install_on)),'[]'::jsonb) INTO conflicts FROM reservations b WHERE (b.sauna_inventory_id=a.id OR b.id=a.future_customer_id) AND b.booking_state='confirmed' AND (available_day IS NULL OR b.booking_install_on IS NULL OR available_day>b.booking_install_on);
 IF payload->>'status'='Incoming' AND jsonb_array_length(conflicts)>0 AND payload->>'acknowledgeScheduleConflict' IS DISTINCT FROM 'true' THEN RAISE EXCEPTION 'Availability conflicts with a confirmed booking. Acknowledge that the installation date needs rescheduling; assignments and booking dates will be preserved.';END IF;
 PERFORM set_config('sf_lifecycle.command','on',true);
 destination:=CASE WHEN payload->>'status'='Incoming' THEN 'Incoming' WHEN EXISTS(SELECT 1 FROM rentals r WHERE r.originating_reservation_id=a.future_customer_id AND r.purpose='purchase') THEN 'Pre-sold' ELSE 'Available' END;
 PERFORM set_config('sf_lifecycle.fleet_correction','on',true);
 PERFORM set_config('sf_lifecycle.receiving',CASE WHEN payload->>'status'='Available' THEN 'on' ELSE 'off' END,true);
 UPDATE sauna_inventory SET status=destination,
  available_date=CASE WHEN destination='Incoming' THEN available_day ELSE available_date END,
  incoming_eta=CASE WHEN destination='Incoming' THEN eta ELSE incoming_eta END,
  condition_state=CASE WHEN destination='Incoming' THEN condition_state ELSE 'ready' END WHERE id=a.id;
 PERFORM set_config('sf_lifecycle.receiving','off',true);
 PERFORM set_config('sf_lifecycle.fleet_correction','off',true);
 SELECT status INTO destination FROM sauna_inventory WHERE id=a.id;
 result:=jsonb_build_object('assetId',a.id,'status',destination,'schedulingConflicts',CASE WHEN destination='Incoming' THEN conflicts ELSE '[]'::jsonb END);
 INSERT INTO rental_history_events(asset_id,event_type,occurred_on,detail) VALUES(a.id,'asset_status',day,jsonb_build_object('before',jsonb_build_object('status',a.status,'incomingEta',a.incoming_eta,'availableOn',a.available_date,'condition',a.condition_state),'after',jsonb_build_object('status',destination,'incomingEta',eta,'availableOn',available_day),'note',payload->>'reason','futureReservationPreserved',a.future_customer_id,'schedulingConflicts',CASE WHEN destination='Incoming' THEN conflicts ELSE '[]'::jsonb END));
 INSERT INTO rental_lifecycle_commands(id,command,request,result) VALUES(command_id,operation,payload,result);
 RETURN result;
END; $$;
REVOKE ALL ON FUNCTION public.rental_lifecycle_command(uuid,text,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.rental_lifecycle_command(uuid,text,jsonb) TO service_role;
CREATE OR REPLACE VIEW public.public_sauna_availability AS
SELECT st.id AS sauna_type_id,
 COALESCE(SUM(CASE WHEN si.status='Available' AND si.current_customer_id IS NULL AND si.future_customer_id IS NULL AND si.retired_on IS NULL AND si.condition_state='ready' THEN 1 ELSE 0 END),0)::integer AS available_now,
 MIN(CASE WHEN si.status='Incoming' AND si.current_customer_id IS NULL AND si.future_customer_id IS NULL AND si.retired_on IS NULL AND si.condition_state='ready' AND si.incoming_eta IS NOT NULL AND si.available_date>si.incoming_eta THEN si.available_date END) AS next_available_date
FROM public.sauna_types st LEFT JOIN public.sauna_inventory si ON si.style=st.style AND si.model_key=st.model_key AND st.location=ANY(si.locations) GROUP BY st.id;
NOTIFY pgrst,'reload schema';
COMMIT;
