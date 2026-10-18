BEGIN;
SET LOCAL sf_lifecycle.command='on';
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='30s';
-- Additive lifecycle: legacy status and source history are retained verbatim.
ALTER TABLE public.reservations
 ADD COLUMN booking_state text NOT NULL DEFAULT 'requested' CHECK(booking_state IN('draft','requested','confirmed','fulfilled','cancelled')),
 ADD COLUMN booking_version integer NOT NULL DEFAULT 1,
 ADD COLUMN booking_install_on date,
 ADD COLUMN booking_confirmation_mode text CHECK(booking_confirmation_mode IN('automatic','manual','legacy')),
 ADD COLUMN booking_confirmation_note text,
 ADD COLUMN booking_confirmed_at timestamptz,
 ADD COLUMN booking_legacy_status text;
ALTER TABLE public.sauna_inventory ADD COLUMN condition_state text NOT NULL DEFAULT 'unknown' CHECK(condition_state IN('ready','inspection','maintenance','unknown'));
UPDATE sauna_inventory SET condition_state=CASE WHEN status='Maintenance' THEN 'maintenance' WHEN status IN('Available','Installed','Returning','Reservation Hold','Reservation Confirmed','Transfer Planned') THEN 'ready' ELSE 'unknown' END;
UPDATE reservations r SET booking_legacy_status=r.reservation_status,
 booking_install_on=CASE WHEN r.booking_kind<>'manual_historical' THEN (coalesce(r.installation_scheduled_at,r.preferred_install_at) AT TIME ZONE 'America/Los_Angeles')::date ELSE NULL END,
 booking_state=CASE
 WHEN EXISTS(SELECT 1 FROM rentals n WHERE n.originating_reservation_id=r.id AND n.lifecycle_state='canceled') OR r.reservation_status IN('Cancelled','Canceled','Refunded') THEN 'cancelled'
 WHEN EXISTS(SELECT 1 FROM rentals n WHERE n.originating_reservation_id=r.id AND (n.actual_start IS NOT NULL OR n.lifecycle_state IN('active','ended'))) OR r.reservation_status IN('Installed','Returning','Churned','Sold') THEN 'fulfilled'
 WHEN r.reservation_status='Reservation Confirmed' THEN 'confirmed' ELSE 'requested' END,
 booking_confirmation_mode=CASE WHEN r.reservation_status='Reservation Confirmed' THEN 'legacy' END;

CREATE TABLE public.booking_commands(id uuid PRIMARY KEY,booking_id uuid,operation text NOT NULL,request jsonb NOT NULL,result jsonb NOT NULL DEFAULT '{}',created_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE booking_commands ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON booking_commands FROM PUBLIC,anon,authenticated,service_role;

-- Inventory reservation labels are compatibility output, not a booking state authority.
CREATE OR REPLACE FUNCTION public.sync_reservation_status_from_inventory() RETURNS trigger LANGUAGE plpgsql SET search_path=public,pg_temp AS $$ BEGIN RETURN NEW; END; $$;

CREATE FUNCTION public.booking_readiness(p_id uuid) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE r reservations; a sauna_inventory; t sauna_types; unit_ok boolean:=false; signed_ok boolean; id_ok boolean; date_ok boolean:=false;
BEGIN
 SELECT * INTO r FROM reservations WHERE id=p_id; IF NOT FOUND THEN RETURN NULL; END IF;
 SELECT * INTO a FROM sauna_inventory WHERE id=r.sauna_inventory_id;
 SELECT * INTO t FROM sauna_types WHERE id=r.sauna_type_id;
 IF a.id IS NOT NULL THEN
  unit_ok:=nullif(btrim(a.unit_code),'') IS NOT NULL AND a.retired_on IS NULL AND a.status NOT IN('Sold','Pre-sold','Maintenance') AND a.condition_state NOT IN('inspection','maintenance')
   AND (a.future_customer_id=r.id OR a.current_customer_id=r.id OR a.reservation_id=r.id)
   AND (a.sauna_type_id=r.sauna_type_id OR (a.style=t.style AND (CASE WHEN a.model_key IN('v1_fir_cedar','v2_cedar') THEN 'standard' ELSE a.model_key END)=t.model_key AND t.location=ANY(a.locations)));
  date_ok:=r.booking_install_on IS NOT NULL AND (a.current_customer_id IS NULL OR a.current_customer_id=r.id OR a.available_date<=r.booking_install_on)
   AND (a.status<>'Incoming' OR a.incoming_eta<=r.booking_install_on);
 END IF;
 signed_ok:=EXISTS(SELECT 1 FROM contracts c WHERE c.reservation_id=r.id AND c.status='Signed' AND c.voided_at IS NULL);
 id_ok:=r.id_status='Complete' AND EXISTS(SELECT 1 FROM storage.objects o WHERE o.bucket_id='reservation-ids' AND o.name LIKE r.id::text||'/%');
 RETURN jsonb_build_object('agreement',signed_ok,'deposit',r.payment_status='Paid','photoId',id_ok,'numberedUnit',coalesce(unit_ok,false),'date',coalesce(date_ok,false));
END; $$;
REVOKE ALL ON FUNCTION booking_readiness(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION booking_readiness(uuid) TO service_role;

CREATE FUNCTION public.booking_reconcile(p_id uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE r reservations; ready jsonb; fulfilled boolean; next_state text;
BEGIN
 SELECT * INTO r FROM reservations WHERE id=p_id FOR UPDATE; IF NOT FOUND OR r.booking_state IN('cancelled','fulfilled') THEN RETURN; END IF;
 fulfilled:=EXISTS(SELECT 1 FROM rentals n WHERE n.originating_reservation_id=r.id AND (n.actual_start IS NOT NULL OR n.lifecycle_state IN('active','ended')));
 IF fulfilled THEN next_state:='fulfilled';
 ELSIF r.booking_kind='manual_historical' THEN RETURN;
 ELSE
  ready:=booking_readiness(r.id);
  IF (ready->>'numberedUnit')::boolean AND (ready->>'date')::boolean AND
   (r.booking_confirmation_mode='manual' OR (NOT EXISTS(SELECT 1 FROM rentals x WHERE x.originating_reservation_id=r.id AND x.purpose='purchase') AND (ready->>'agreement')::boolean AND (ready->>'deposit')::boolean AND (ready->>'photoId')::boolean)) THEN next_state:='confirmed';
  ELSIF r.booking_confirmation_mode='legacy' AND r.booking_state='confirmed' THEN RETURN;
  ELSE next_state:=CASE WHEN r.booking_state='draft' THEN 'draft' ELSE 'requested' END;
  END IF;
 END IF;
 IF next_state IS DISTINCT FROM r.booking_state THEN
  UPDATE reservations SET booking_state=next_state,booking_version=booking_version+1,
    booking_confirmed_at=CASE WHEN next_state='confirmed' THEN now() ELSE booking_confirmed_at END,
    booking_confirmation_mode=CASE WHEN next_state='confirmed' THEN coalesce(booking_confirmation_mode,'automatic') ELSE booking_confirmation_mode END WHERE id=r.id;
  INSERT INTO reservation_events(reservation_id,event_type,message,metadata) VALUES(r.id,'Booking state changed','Booking '||next_state,jsonb_build_object('previous',r.booking_state,'state',next_state));
 END IF;
END; $$;
REVOKE ALL ON FUNCTION booking_reconcile(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION booking_reconcile(uuid) TO service_role;

CREATE FUNCTION public.booking_created_date() RETURNS trigger LANGUAGE plpgsql SET search_path=public,pg_temp AS $$ BEGIN IF NEW.booking_kind<>'manual_historical' AND NEW.booking_install_on IS NULL THEN NEW.booking_install_on:=(coalesce(NEW.installation_scheduled_at,NEW.preferred_install_at) AT TIME ZONE 'America/Los_Angeles')::date;END IF;RETURN NEW;END; $$;
CREATE TRIGGER booking_created_date BEFORE INSERT ON reservations FOR EACH ROW EXECUTE FUNCTION booking_created_date();

CREATE FUNCTION public.booking_reservation_changed() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$ BEGIN
 IF TG_OP='INSERT' OR ROW(NEW.payment_status,NEW.contract_status,NEW.id_status,NEW.sauna_inventory_id,NEW.sauna_type_id,NEW.booking_install_on) IS DISTINCT FROM ROW(OLD.payment_status,OLD.contract_status,OLD.id_status,OLD.sauna_inventory_id,OLD.sauna_type_id,OLD.booking_install_on) THEN PERFORM booking_reconcile(NEW.id); END IF; RETURN NEW; END; $$;
CREATE TRIGGER booking_reservation_changed AFTER INSERT OR UPDATE ON reservations FOR EACH ROW EXECUTE FUNCTION booking_reservation_changed();
CREATE FUNCTION public.booking_contract_changed() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$ BEGIN PERFORM booking_reconcile(NEW.reservation_id);RETURN NEW;END; $$;
CREATE TRIGGER booking_contract_changed AFTER INSERT OR UPDATE ON contracts FOR EACH ROW EXECUTE FUNCTION booking_contract_changed();
CREATE FUNCTION public.booking_rental_changed() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$ BEGIN
 IF NEW.lifecycle_state='canceled' THEN UPDATE reservations SET booking_state='cancelled',booking_version=booking_version+1 WHERE id=NEW.originating_reservation_id AND booking_state NOT IN('fulfilled','cancelled');
 ELSE PERFORM booking_reconcile(NEW.originating_reservation_id); END IF; RETURN NEW; END; $$;
CREATE TRIGGER booking_rental_changed AFTER INSERT OR UPDATE OF lifecycle_state,actual_start ON rentals FOR EACH ROW EXECUTE FUNCTION booking_rental_changed();
CREATE FUNCTION public.booking_inventory_changed() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE rid uuid;
BEGIN
 FOR rid IN SELECT DISTINCT r.id FROM reservations r WHERE r.id IN(NEW.future_customer_id,NEW.current_customer_id,OLD.future_customer_id,OLD.current_customer_id) OR r.sauna_inventory_id=NEW.id LOOP PERFORM booking_reconcile(rid);END LOOP;
 RETURN NEW;
END; $$;
CREATE TRIGGER booking_inventory_changed AFTER UPDATE OF future_customer_id,current_customer_id,status,condition_state,unit_code,available_date,sauna_type_id ON sauna_inventory FOR EACH ROW EXECUTE FUNCTION booking_inventory_changed();

CREATE FUNCTION public.booking_command(command_id uuid,operation text,payload jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
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
   IF a.id IS NULL OR nullif(btrim(a.unit_code),'') IS NULL OR a.retired_on IS NOT NULL OR a.status IN('Sold','Pre-sold','Maintenance') OR a.condition_state IN('maintenance','inspection') THEN RAISE EXCEPTION 'Choose a numbered, serviceable sauna';END IF;
   IF NOT coalesce(a.sauna_type_id=r.sauna_type_id OR (a.style=t.style AND (CASE WHEN a.model_key IN('v1_fir_cedar','v2_cedar') THEN 'standard' ELSE a.model_key END)=t.model_key AND t.location=ANY(a.locations)),false) THEN RAISE EXCEPTION 'The numbered sauna does not match the booked type';END IF;
   IF a.future_customer_id IS NOT NULL AND a.future_customer_id<>r.id THEN RAISE EXCEPTION 'This sauna is reserved for another booking';END IF;
   IF a.current_customer_id IS NOT NULL AND a.current_customer_id<>r.id AND (a.available_date IS NULL OR a.available_date>install_day) THEN RAISE EXCEPTION 'This sauna will not be available by the installation date';END IF;
   IF a.status='Incoming' AND (a.incoming_eta IS NULL OR a.incoming_eta>install_day) THEN RAISE EXCEPTION 'This sauna is not expected by the installation date';END IF;
   reason:=nullif(btrim(payload->>'reason'),'');
   IF operation='confirm' AND reason IS NULL THEN RAISE EXCEPTION 'Manual confirmation requires an exception or acceptance note';END IF;
   old_asset:=r.sauna_inventory_id;
   UPDATE sauna_inventory SET future_customer_id=NULL,future_customer=NULL,status=CASE WHEN current_customer_id IS NOT NULL THEN status WHEN condition_state='ready' THEN 'Available' ELSE 'Maintenance' END WHERE future_customer_id=r.id AND id<>target;
   UPDATE sauna_inventory SET future_customer_id=r.id,future_customer=coalesce((SELECT c.display_name FROM customer_profiles c JOIN reservation_customer_links l ON l.customer_id=c.id WHERE l.reservation_id=r.id),r.first_name||' '||r.last_name),status=CASE WHEN current_customer_id IS NOT NULL THEN status ELSE 'Reservation Hold' END WHERE id=target;
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
REVOKE ALL ON FUNCTION booking_command(uuid,text,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION booking_command(uuid,text,jsonb) TO service_role;
CREATE FUNCTION public.sauna_condition_compatibility() RETURNS trigger LANGUAGE plpgsql SET search_path=public,pg_temp AS $$ BEGIN
 IF TG_OP='INSERT' THEN
  IF NEW.condition_state='unknown' AND NEW.status IN('Available','Maintenance') THEN NEW.condition_state:=CASE WHEN NEW.status='Available' THEN 'ready' ELSE 'maintenance' END;END IF;
 ELSIF NEW.condition_state IS NOT DISTINCT FROM OLD.condition_state AND NEW.status IS DISTINCT FROM OLD.status THEN
  IF NEW.status='Maintenance' THEN NEW.condition_state:=CASE WHEN OLD.current_customer_id IS NOT NULL AND NEW.current_customer_id IS NULL THEN 'inspection' ELSE 'maintenance' END;
  ELSIF NEW.status='Available' AND OLD.status='Maintenance' THEN NEW.condition_state:='ready';END IF;
 END IF;
 IF TG_OP='UPDATE' AND NEW.available_date IS DISTINCT FROM OLD.available_date AND EXISTS(SELECT 1 FROM reservations b WHERE b.sauna_inventory_id=NEW.id AND b.booking_state='confirmed' AND b.booking_install_on IS NOT NULL AND NEW.current_customer_id IS DISTINCT FROM b.id AND NEW.current_customer_id IS NOT NULL AND (NEW.available_date IS NULL OR NEW.available_date>b.booking_install_on)) THEN RAISE EXCEPTION 'Resolve the confirmed booking before moving sauna availability past its promised date';END IF;
 RETURN NEW;
END; $$;
CREATE TRIGGER sauna_condition_compatibility BEFORE INSERT OR UPDATE ON sauna_inventory FOR EACH ROW EXECUTE FUNCTION sauna_condition_compatibility();
REVOKE ALL ON FUNCTION sauna_condition_compatibility() FROM PUBLIC,anon,authenticated;
-- Internal trigger helpers have no public callable surface.
REVOKE ALL ON FUNCTION booking_reservation_changed(),booking_contract_changed(),booking_rental_changed(),booking_inventory_changed() FROM PUBLIC,anon,authenticated;

CREATE FUNCTION public.booking_workspace() RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT coalesce(jsonb_agg(jsonb_build_object(
  'id',r.id,'customerId',l.customer_id,'customerName',coalesce(c.display_name,concat_ws(' ',r.first_name,r.last_name)),
  'state',r.booking_state,'version',r.booking_version,'installOn',r.booking_install_on,'saunaId',r.sauna_inventory_id,
  'saunaCode',i.unit_code,'saunaTypeId',r.sauna_type_id,'saunaType',st.name,'source',r.booking_kind,'legacyStatus',r.booking_legacy_status,
  'confirmationMode',r.booking_confirmation_mode,'confirmationNote',r.booking_confirmation_note,
  'readiness',booking_readiness(r.id),'rentalId',n.id,'rentalState',n.lifecycle_state,'purpose',coalesce(n.purpose,'rental'),
  'createdAt',r.created_at,'holdDeadline',r.hold_deadline,'installAddress',r.install_address
 ) ORDER BY r.created_at DESC),'[]'::jsonb)
 FROM reservations r LEFT JOIN reservation_customer_links l ON l.reservation_id=r.id LEFT JOIN customer_profiles c ON c.id=l.customer_id
 LEFT JOIN sauna_inventory i ON i.id=r.sauna_inventory_id LEFT JOIN sauna_types st ON st.id=r.sauna_type_id LEFT JOIN rentals n ON n.originating_reservation_id=r.id;
$$;
REVOKE ALL ON FUNCTION booking_workspace() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION booking_workspace() TO service_role;
REVOKE ALL ON FUNCTION booking_created_date() FROM PUBLIC,anon,authenticated;

-- Keep the established transactional rental commands, adding booking prerequisites.
ALTER FUNCTION public.rental_lifecycle_command(uuid,text,jsonb) RENAME TO rental_lifecycle_before_bookings;
REVOKE ALL ON FUNCTION public.rental_lifecycle_before_bookings(uuid,text,jsonb) FROM PUBLIC,anon,authenticated,service_role;
CREATE FUNCTION public.rental_lifecycle_command(command_id uuid,operation text,payload jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE b reservations; out jsonb;
BEGIN
 IF EXISTS(SELECT 1 FROM rental_lifecycle_commands WHERE id=command_id) THEN RETURN rental_lifecycle_before_bookings(command_id,operation,payload);END IF;
 IF operation='install' THEN
  SELECT r.* INTO b FROM reservations r JOIN rentals n ON n.originating_reservation_id=r.id WHERE n.id=(payload->>'rentalId')::uuid FOR UPDATE OF r;
  IF b.id IS NOT NULL AND b.booking_kind<>'manual_historical' AND (b.booking_state<>'confirmed' OR b.sauna_inventory_id IS DISTINCT FROM (payload->>'assetId')::uuid) THEN RAISE EXCEPTION 'Confirm this booking with its numbered sauna in Bookings before installation';END IF;
 END IF;
 out:=rental_lifecycle_before_bookings(command_id,operation,payload);
 IF operation='manual_reservation' AND coalesce((payload->>'historical')::boolean,true)=false THEN
  IF coalesce(payload->>'purpose','rental') NOT IN('rental','purchase') THEN RAISE EXCEPTION 'Choose rental or purchase';END IF;
  UPDATE rentals SET purpose=coalesce(payload->>'purpose','rental'),lifecycle_state='planned' WHERE id=(out->>'rentalId')::uuid AND actual_start IS NULL;
 END IF;
 RETURN out;
END; $$;
REVOKE ALL ON FUNCTION rental_lifecycle_command(uuid,text,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION rental_lifecycle_command(uuid,text,jsonb) TO service_role;
NOTIFY pgrst,'reload schema';
COMMIT;
