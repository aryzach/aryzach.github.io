BEGIN;
SET LOCAL lock_timeout='5s';
-- A plan is separate from physical custody, actual rental dates and commercial terms.
ALTER TABLE public.sauna_inventory
 ADD COLUMN planned_pickup_on date,
 ADD COLUMN return_plan_version integer NOT NULL DEFAULT 0 CHECK(return_plan_version>=0),
 ADD CONSTRAINT sauna_return_plan_dates CHECK(planned_pickup_on IS NULL OR
  (current_customer_id IS NOT NULL AND available_date IS NOT NULL AND available_date>=planned_pickup_on));

CREATE FUNCTION public.protect_sauna_return_plan() RETURNS trigger
LANGUAGE plpgsql SET search_path=public,pg_temp AS $$
BEGIN
 IF TG_OP='INSERT' THEN
  IF NEW.planned_pickup_on IS NOT NULL OR NEW.return_plan_version<>0 THEN RAISE EXCEPTION 'Use Schedule return / future availability';END IF;
  RETURN NEW;
 END IF;
 IF NEW.current_customer_id IS DISTINCT FROM OLD.current_customer_id OR NEW.status='Sold' OR NEW.retired_on IS NOT NULL THEN
  NEW.planned_pickup_on:=NULL;NEW.return_plan_version:=OLD.return_plan_version+1;
  IF OLD.planned_pickup_on IS NOT NULL THEN NEW.available_date:=NULL;END IF;
 ELSIF NEW.planned_pickup_on IS DISTINCT FROM OLD.planned_pickup_on OR NEW.return_plan_version IS DISTINCT FROM OLD.return_plan_version OR
  (OLD.planned_pickup_on IS NOT NULL AND NEW.available_date IS DISTINCT FROM OLD.available_date) THEN
  IF current_setting('sf_lifecycle.return_plan',true) IS DISTINCT FROM 'on' THEN RAISE EXCEPTION 'Use Schedule return / future availability';END IF;
 END IF;
 RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.protect_sauna_return_plan() FROM PUBLIC,anon,authenticated,service_role;
CREATE TRIGGER protect_sauna_return_plan BEFORE INSERT OR UPDATE ON public.sauna_inventory
 FOR EACH ROW EXECUTE FUNCTION public.protect_sauna_return_plan();

ALTER FUNCTION public.rental_lifecycle_command(uuid,text,jsonb) RENAME TO rental_lifecycle_before_return_plans;
REVOKE ALL ON FUNCTION public.rental_lifecycle_before_return_plans(uuid,text,jsonb) FROM PUBLIC,anon,authenticated,service_role;
CREATE FUNCTION public.rental_lifecycle_command(command_id uuid,operation text,payload jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE a sauna_inventory; prior rental_lifecycle_commands; pickup date; available date; result jsonb; rid uuid; local_today date:=(now() AT TIME ZONE 'America/Los_Angeles')::date;
BEGIN
 IF operation IS DISTINCT FROM 'asset_status' OR payload->>'planReturn' IS DISTINCT FROM 'true' THEN
  RETURN rental_lifecycle_before_return_plans(command_id,operation,payload);
 END IF;
 PERFORM pg_advisory_xact_lock(73417722);
 IF command_id IS NULL OR nullif(btrim(payload->>'reason'),'') IS NULL THEN RAISE EXCEPTION 'Request ID and reason required';END IF;
 SELECT * INTO prior FROM rental_lifecycle_commands WHERE id=command_id;
 IF FOUND THEN
  IF prior.command<>operation OR prior.request<>payload THEN RAISE EXCEPTION 'Request ID already used for another operation';END IF;
  RETURN prior.result;
 END IF;
 SELECT * INTO a FROM sauna_inventory WHERE id=(payload->>'assetId')::uuid FOR UPDATE;
 IF a.id IS NULL OR a.current_customer_id IS NULL OR a.retired_on IS NOT NULL OR a.status='Sold' OR EXISTS(SELECT 1 FROM sauna_sales WHERE asset_id=a.id) THEN RAISE EXCEPTION 'Choose a sauna currently with a customer';END IF;
 IF a.current_customer_id IS DISTINCT FROM (payload->>'currentCustomerId')::uuid OR a.return_plan_version IS DISTINCT FROM (payload->>'returnPlanVersion')::integer THEN RAISE EXCEPTION 'Sauna or return plan changed; refresh before saving' USING ERRCODE='40001';END IF;
 IF NOT(payload ? 'plannedPickupOn' AND payload ? 'availableOn') THEN RAISE EXCEPTION 'Provide planned pickup and booking availability dates, or clear both to cancel';END IF;
 pickup:=nullif(payload->>'plannedPickupOn','')::date;available:=nullif(payload->>'availableOn','')::date;
 IF (pickup IS NULL)<>(available IS NULL) THEN RAISE EXCEPTION 'Provide both dates, or clear both to cancel';END IF;
 IF pickup IS NOT NULL AND (pickup<local_today OR available<pickup OR pickup<coalesce(a.install_date,pickup) OR EXISTS(SELECT 1 FROM rental_placements WHERE asset_id=a.id AND removed_on IS NULL AND installed_on>pickup)) THEN RAISE EXCEPTION 'Pickup must be today or later and booking availability must be on or after pickup';END IF;
 -- Plans cannot silently invalidate a customer's existing installation promise.
 IF EXISTS(SELECT 1 FROM reservations b WHERE (b.id=a.future_customer_id OR b.sauna_inventory_id=a.id) AND b.id<>a.current_customer_id AND b.booking_state IN('confirmed','requested') AND (b.booking_state='confirmed' OR b.booking_install_on IS NOT NULL) AND (available IS NULL OR b.booking_install_on IS NULL OR available>b.booking_install_on)) THEN RAISE EXCEPTION 'Resolve the future booking date conflict before changing this return plan';END IF;
 PERFORM set_config('sf_lifecycle.command','on',true);
 PERFORM set_config('sf_lifecycle.return_plan','on',true);
 UPDATE sauna_inventory SET planned_pickup_on=pickup,available_date=available,return_plan_version=return_plan_version+1 WHERE id=a.id;
 PERFORM set_config('sf_lifecycle.return_plan','off',true);
 SELECT id INTO rid FROM rentals WHERE originating_reservation_id=a.current_customer_id;
 INSERT INTO rental_history_events(rental_id,asset_id,event_type,occurred_on,detail)
 VALUES(rid,a.id,CASE WHEN pickup IS NULL THEN 'return_plan_cancelled' ELSE 'return_planned' END,local_today,
  jsonb_build_object('before',jsonb_build_object('plannedPickupOn',a.planned_pickup_on,'availableOn',a.available_date),'after',jsonb_build_object('plannedPickupOn',pickup,'availableOn',available),'currentReservationId',a.current_customer_id,'futureReservationId',a.future_customer_id,'note',payload->>'reason'));
 result:=jsonb_build_object('assetId',a.id,'plannedPickupOn',pickup,'availableOn',available,'returnPlanVersion',a.return_plan_version+1);
 INSERT INTO rental_lifecycle_commands(id,command,request,result) VALUES(command_id,operation,payload,result);
 RETURN result;
END; $$;
REVOKE ALL ON FUNCTION public.rental_lifecycle_command(uuid,text,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.rental_lifecycle_command(uuid,text,jsonb) TO service_role;

-- Publish only aggregate bookable dates. A planned pickup never makes a held unit available now.
CREATE OR REPLACE VIEW public.public_sauna_availability AS
SELECT st.id AS sauna_type_id,
 COALESCE(SUM(CASE WHEN si.status='Available' AND si.current_customer_id IS NULL AND si.future_customer_id IS NULL AND si.retired_on IS NULL AND si.condition_state='ready' THEN 1 ELSE 0 END),0)::integer AS available_now,
 MIN(CASE WHEN si.future_customer_id IS NULL AND si.retired_on IS NULL AND si.condition_state='ready' AND (
  (si.status='Incoming' AND si.current_customer_id IS NULL AND si.incoming_eta IS NOT NULL AND si.available_date>si.incoming_eta)
  OR (si.current_customer_id IS NOT NULL AND si.status<>'Sold' AND si.planned_pickup_on>=(now() AT TIME ZONE 'America/Los_Angeles')::date AND si.available_date>=si.planned_pickup_on)
 ) THEN si.available_date END) AS next_available_date
FROM public.sauna_types st LEFT JOIN public.sauna_inventory si ON si.style=st.style AND si.model_key=st.model_key AND st.location=ANY(si.locations) GROUP BY st.id;
NOTIFY pgrst,'reload schema';
COMMIT;
