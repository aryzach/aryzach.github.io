BEGIN;
SET LOCAL lock_timeout='5s';
ALTER TABLE public.reservations
 ADD COLUMN requested_model_key text CHECK(requested_model_key IN('v1_fir_cedar','v2_cedar')),
 ADD COLUMN waitlisted_at timestamptz;

-- Preferences are operational booking facts; legacy handlers cannot clear them.
CREATE FUNCTION public.protect_booking_model_waitlist() RETURNS trigger LANGUAGE plpgsql SET search_path=public,pg_temp AS $$
BEGIN
 IF (TG_OP='INSERT' AND (NEW.requested_model_key IS NOT NULL OR NEW.waitlisted_at IS NOT NULL)) OR
    (TG_OP='UPDATE' AND (NEW.requested_model_key IS DISTINCT FROM OLD.requested_model_key OR NEW.waitlisted_at IS DISTINCT FROM OLD.waitlisted_at)) THEN
  IF current_setting('sf_lifecycle.waitlist_command',true) IS DISTINCT FROM 'on' THEN RAISE EXCEPTION 'Use Bookings to change model preferences or waitlist membership';END IF;
 END IF;
 IF NEW.requested_model_key IS NOT NULL AND NOT EXISTS(SELECT 1 FROM sauna_types WHERE id=NEW.sauna_type_id AND style='traditional' AND model_key='standard') THEN RAISE EXCEPTION 'v1/v2 preferences require a standard traditional sauna type';END IF;
 RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.protect_booking_model_waitlist() FROM PUBLIC,anon,authenticated,service_role;
CREATE TRIGGER protect_booking_model_waitlist BEFORE INSERT OR UPDATE ON public.reservations FOR EACH ROW EXECUTE FUNCTION public.protect_booking_model_waitlist();

-- This also covers older payment/signing handlers during and after rollout.
CREATE FUNCTION public.guard_waitlisted_sauna_assignment() RETURNS trigger LANGUAGE plpgsql SET search_path=public,pg_temp AS $$
DECLARE b reservations;
BEGIN
 IF NEW.future_customer_id IS NOT NULL THEN
  SELECT * INTO b FROM reservations WHERE id=NEW.future_customer_id FOR UPDATE;
  IF b.waitlisted_at IS NOT NULL THEN RAISE EXCEPTION 'This booking is waitlisted; assign a numbered sauna explicitly in Bookings';END IF;
  IF b.requested_model_key IS NOT NULL AND NEW.model_key IS DISTINCT FROM b.requested_model_key THEN RAISE EXCEPTION 'The sauna does not match the requested model';END IF;
 END IF;
 RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.guard_waitlisted_sauna_assignment() FROM PUBLIC,anon,authenticated,service_role;
CREATE TRIGGER guard_waitlisted_sauna_assignment BEFORE INSERT OR UPDATE OF future_customer_id,model_key ON public.sauna_inventory FOR EACH ROW EXECUTE FUNCTION public.guard_waitlisted_sauna_assignment();

ALTER FUNCTION public.booking_command(uuid,text,jsonb) RENAME TO booking_command_before_model_waitlist;
REVOKE ALL ON FUNCTION public.booking_command_before_model_waitlist(uuid,text,jsonb) FROM PUBLIC,anon,authenticated,service_role;
CREATE FUNCTION public.booking_command(command_id uuid,operation text,payload jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE b reservations; prior booking_commands; result jsonb; typ sauna_types; model text; released jsonb;
BEGIN
 IF operation NOT IN('waitlist','allocate','confirm','accept_purchase','cancel') THEN RETURN booking_command_before_model_waitlist(command_id,operation,payload);END IF;
 PERFORM pg_advisory_xact_lock(73417722);
 IF command_id IS NULL THEN RAISE EXCEPTION 'Request ID required';END IF;
 SELECT * INTO prior FROM booking_commands WHERE id=command_id;
 IF FOUND THEN IF prior.operation<>operation OR prior.request<>payload THEN RAISE EXCEPTION 'Request ID already used for another operation';END IF;RETURN prior.result;END IF;
 SELECT * INTO b FROM reservations WHERE id=(payload->>'id')::uuid FOR UPDATE;
 IF NOT FOUND OR b.booking_version IS DISTINCT FROM (payload->>'version')::integer THEN RAISE EXCEPTION 'Booking changed; refresh before saving' USING ERRCODE='40001';END IF;
 PERFORM set_config('sf_lifecycle.waitlist_command','on',true);
 IF operation='waitlist' THEN
  IF b.booking_kind='manual_historical' OR b.booking_state IN('fulfilled','cancelled') OR EXISTS(SELECT 1 FROM sauna_inventory WHERE current_customer_id=b.id) OR EXISTS(SELECT 1 FROM rentals n WHERE n.originating_reservation_id=b.id AND (n.purpose='purchase' OR n.actual_start IS NOT NULL OR n.lifecycle_state IN('active','ended'))) OR EXISTS(SELECT 1 FROM rental_placements p JOIN rentals n ON n.id=p.rental_id WHERE n.originating_reservation_id=b.id) THEN RAISE EXCEPTION 'Only uninstalled, open rental bookings can move to the waitlist';END IF;
  IF nullif(btrim(payload->>'reason'),'') IS NULL THEN RAISE EXCEPTION 'Waitlist reason required';END IF;
  SELECT * INTO typ FROM sauna_types WHERE id=payload->>'saunaTypeId';
  model:=nullif(payload->>'modelKey','');
  IF typ.id IS NULL OR (model IS NOT NULL AND (model NOT IN('v1_fir_cedar','v2_cedar') OR typ.style<>'traditional' OR typ.model_key<>'standard')) THEN RAISE EXCEPTION 'Choose a valid sauna type and model preference';END IF;
  SELECT coalesce(jsonb_agg(id),'[]'::jsonb) INTO released FROM sauna_inventory WHERE future_customer_id=b.id;
  PERFORM set_config('sf_lifecycle.command','on',true);
  UPDATE reservations SET sauna_type_id=typ.id,requested_model_key=model,waitlisted_at=coalesce(waitlisted_at,now()),booking_state='requested',booking_confirmation_mode=NULL,booking_confirmation_note=NULL,booking_install_on=NULL,booking_confirmed_at=NULL,booking_version=booking_version+1 WHERE id=b.id;
  UPDATE sauna_inventory SET future_customer_id=NULL,future_customer=NULL,
   status=CASE WHEN status IN('Incoming','Sold') OR retired_on IS NOT NULL THEN status WHEN current_customer_id IS NOT NULL THEN CASE WHEN status='Transfer Planned' THEN 'Installed' ELSE status END WHEN condition_state IN('inspection','maintenance') THEN 'Maintenance' ELSE 'Available' END WHERE future_customer_id=b.id;
  PERFORM sync_booking_assignment_pointer(b.id);
  INSERT INTO waitlist_entries(reservation_id,first_name,last_name,email,phone,city,sauna_type_id,preferred_install_date,reservation_source,status,reason)
  VALUES(b.id,coalesce(b.first_name,''),coalesce(b.last_name,''),coalesce(b.email,''),b.phone,b.city,typ.id,CASE WHEN (b.preferred_install_at AT TIME ZONE 'America/Los_Angeles')::date>=(now() AT TIME ZONE 'America/Los_Angeles')::date THEN (b.preferred_install_at AT TIME ZONE 'America/Los_Angeles')::date END,coalesce(b.reservation_source,'Unknown'),'Open',payload->>'reason')
  ON CONFLICT(reservation_id) DO UPDATE SET sauna_type_id=excluded.sauna_type_id,status='Open',reason=excluded.reason,preferred_install_date=excluded.preferred_install_date;
  INSERT INTO reservation_events(reservation_id,event_type,message,metadata) VALUES(b.id,'Moved to waitlist',payload->>'reason',jsonb_build_object('previousType',b.sauna_type_id,'saunaTypeId',typ.id,'modelKey',model,'releasedUnits',released,'previousInstallOn',b.booking_install_on));
  SELECT jsonb_build_object('id',id,'state',booking_state,'version',booking_version,'waitlistedAt',waitlisted_at,'modelKey',requested_model_key) INTO result FROM reservations WHERE id=b.id;
  INSERT INTO booking_commands(id,booking_id,operation,request,result) VALUES(command_id,b.id,operation,payload,result);
 ELSE
  -- Explicit allocation is the only way to leave an intentional waitlist hold.
  UPDATE reservations SET waitlisted_at=NULL WHERE id=b.id AND waitlisted_at IS NOT NULL;
  result:=booking_command_before_model_waitlist(command_id,operation,payload);
  UPDATE waitlist_entries SET status=CASE WHEN operation='cancel' THEN 'Closed' ELSE 'Converted' END WHERE reservation_id=b.id AND status IN('Open','Contacted');
 END IF;
 PERFORM set_config('sf_lifecycle.waitlist_command','off',true);
 RETURN result;
END; $$;
REVOKE ALL ON FUNCTION public.booking_command(uuid,text,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.booking_command(uuid,text,jsonb) TO service_role;

ALTER FUNCTION public.booking_readiness(uuid) RENAME TO booking_readiness_before_model_waitlist;
REVOKE ALL ON FUNCTION public.booking_readiness_before_model_waitlist(uuid) FROM PUBLIC,anon,authenticated,service_role;
CREATE FUNCTION public.booking_readiness(p_id uuid) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE result jsonb; b reservations;
BEGIN
 result:=booking_readiness_before_model_waitlist(p_id);
 SELECT * INTO b FROM reservations WHERE id=p_id;
 IF b.waitlisted_at IS NOT NULL OR (b.requested_model_key IS NOT NULL AND NOT EXISTS(SELECT 1 FROM sauna_inventory WHERE id=b.sauna_inventory_id AND model_key=b.requested_model_key)) THEN RETURN result||jsonb_build_object('numberedUnit',false,'date',false);END IF;
 RETURN result;
END; $$;
REVOKE ALL ON FUNCTION public.booking_readiness(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.booking_readiness(uuid) TO service_role;

ALTER FUNCTION public.booking_workspace() RENAME TO booking_workspace_before_model_waitlist;
REVOKE ALL ON FUNCTION public.booking_workspace_before_model_waitlist() FROM PUBLIC,anon,authenticated,service_role;
CREATE FUNCTION public.booking_workspace() RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT coalesce(jsonb_agg(item||jsonb_build_object('requestedModelKey',r.requested_model_key,'waitlistedAt',r.waitlisted_at) ORDER BY ordinal),'[]'::jsonb)
 FROM jsonb_array_elements(booking_workspace_before_model_waitlist()) WITH ORDINALITY x(item,ordinal) JOIN reservations r ON r.id=(item->>'id')::uuid;
$$;
REVOKE ALL ON FUNCTION public.booking_workspace() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.booking_workspace() TO service_role;
NOTIFY pgrst,'reload schema';
COMMIT;
