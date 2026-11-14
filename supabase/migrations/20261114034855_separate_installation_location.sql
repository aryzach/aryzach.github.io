BEGIN;
SET LOCAL lock_timeout='5s';
LOCK TABLE public.contracts,public.reservations,public.rentals,public.sauna_inventory,public.rental_placements,public.rental_terms,public.sauna_sales IN SHARE ROW EXCLUSIVE MODE;
CREATE TEMP TABLE installation_location_before ON COMMIT DROP AS select jsonb_build_object('contracts',(select md5(coalesce(string_agg((to_jsonb(x))::text,'' order by id),'')) from public.contracts x),'reservations',(select md5(coalesce(string_agg((to_jsonb(x))::text,'' order by id),'')) from public.reservations x),'rentals',(select md5(coalesce(string_agg((to_jsonb(x))::text,'' order by id),'')) from public.rentals x),'sauna_inventory',(select md5(coalesce(string_agg((to_jsonb(x))::text,'' order by id),'')) from public.sauna_inventory x),'rental_placements',(select md5(coalesce(string_agg((to_jsonb(x))::text,'' order by id),'')) from public.rental_placements x),'rental_terms',(select md5(coalesce(string_agg((to_jsonb(x)-'agreed_location')::text,'' order by id),'')) from public.rental_terms x),'sauna_sales',(select md5(coalesce(string_agg((to_jsonb(x))::text,'' order by id),'')) from public.sauna_sales x)) as value;
-- Capability stays on inventory.locations. Agreement placement is derived from
-- preserved terms, never from inventory's catalog type.
CREATE FUNCTION public.rental_location_from_type(value text) RETURNS text
LANGUAGE sql IMMUTABLE STRICT SET search_path=public,pg_temp AS $$
 SELECT CASE WHEN lower(value) ~ '(^|[^a-z])indoor([^a-z]|$)' AND lower(value) !~ '(^|[^a-z])outdoor([^a-z]|$)' THEN 'indoor'
 WHEN lower(value) ~ '(^|[^a-z])outdoor([^a-z]|$)' AND lower(value) !~ '(^|[^a-z])indoor([^a-z]|$)' THEN 'outdoor' END;
$$;
REVOKE ALL ON FUNCTION public.rental_location_from_type(text) FROM PUBLIC,anon,authenticated,service_role;
ALTER TABLE public.rental_terms ADD COLUMN agreed_location text
 GENERATED ALWAYS AS (public.rental_location_from_type(sauna_type)) STORED;

CREATE FUNCTION public.rental_agreed_location(rid uuid,day date) RETURNS jsonb
LANGUAGE sql STABLE SET search_path=public,pg_temp AS $$
 WITH candidates AS (
 SELECT t.*,coalesce(t.effective_from,a.signed_on,a.agreement_date,day) AS dated
 FROM rental_terms t LEFT JOIN rental_agreements a ON a.id=t.agreement_id
 WHERE t.rental_id=rid AND t.state NOT IN('superseded','voided','canceled')
 AND coalesce(a.signing_state,'unconfirmed') NOT IN('superseded','voided')
 AND coalesce(t.effective_from,a.signed_on,a.agreement_date,day)<=day
 AND (t.effective_until IS NULL OR t.effective_until>day)
 ), latest AS (SELECT * FROM candidates WHERE dated=(SELECT max(dated) FROM candidates))
 SELECT CASE WHEN count(*)>0 AND count(agreed_location)=count(*) AND count(DISTINCT agreed_location)=1
 THEN jsonb_build_object('location',min(agreed_location),'termIds',jsonb_agg(id ORDER BY id)) ELSE NULL END FROM latest;
$$;
REVOKE ALL ON FUNCTION public.rental_agreed_location(uuid,date) FROM PUBLIC,anon,authenticated,service_role;

-- Also supports older known installation dates with no known numbered unit.
-- This records a location only; it never creates or changes an asset placement.
CREATE TABLE public.rental_installation_locations (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 rental_id uuid NOT NULL REFERENCES public.rentals(id) ON DELETE RESTRICT,
 placement_id uuid UNIQUE,
 installed_on date NOT NULL,
 location text NOT NULL CHECK(location IN('indoor','outdoor')),
 source text NOT NULL CHECK(source IN('explicit_confirmation','owner_confirmed_agreement')),
 reason text NOT NULL CHECK(length(btrim(reason))>0),
 agreed_term_ids jsonb NOT NULL CHECK(jsonb_typeof(agreed_term_ids)='array' AND jsonb_array_length(agreed_term_ids)>0),
 catalog_conflict boolean NOT NULL DEFAULT false,
 created_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY(rental_id,placement_id) REFERENCES public.rental_placements(rental_id,id) ON DELETE RESTRICT
);
CREATE UNIQUE INDEX rental_installation_locations_initial ON public.rental_installation_locations(rental_id,installed_on) WHERE placement_id IS NULL;
CREATE INDEX rental_installation_locations_rental ON public.rental_installation_locations(rental_id,installed_on);
ALTER TABLE public.rental_installation_locations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.rental_installation_locations FROM PUBLIC,anon,authenticated,service_role;
GRANT SELECT ON public.rental_installation_locations TO service_role;

-- Owner's November 13 instruction: agreement placement always matches actual
-- installation. Preserve the old catalog snapshot and explicitly audit conflicts.
WITH candidates AS (
 SELECT p.rental_id,p.id AS placement_id,p.installed_on,p.type_at_install,i.locations,
 public.rental_agreed_location(p.rental_id,p.installed_on) AS agreed
 FROM rental_placements p JOIN rentals r ON r.id=p.rental_id JOIN sauna_inventory i ON i.id=p.asset_id
 WHERE r.purpose<>'purchase' AND r.lifecycle_state<>'canceled' AND coalesce(r.owner_review->>'neverInstalled','false')<>'true'
 UNION ALL
 SELECT r.id,NULL,r.actual_start,NULL,NULL,public.rental_agreed_location(r.id,r.actual_start)
 FROM rentals r WHERE r.actual_start IS NOT NULL AND r.purpose<>'purchase' AND r.lifecycle_state<>'canceled'
 AND coalesce(r.owner_review->>'neverInstalled','false')<>'true'
 AND NOT EXISTS(SELECT 1 FROM rental_placements p WHERE p.rental_id=r.id AND p.installed_on=r.actual_start)
)
INSERT INTO rental_installation_locations(rental_id,placement_id,installed_on,location,source,reason,agreed_term_ids,catalog_conflict)
SELECT rental_id,placement_id,installed_on,agreed->>'location','owner_confirmed_agreement',
 'Owner confirmed on November 13, 2026 that agreement and actual installation placement always match. Original catalog snapshots are preserved.',agreed->'termIds',
 placement_id IS NOT NULL AND public.rental_location_from_type(type_at_install) IS DISTINCT FROM agreed->>'location'
FROM candidates WHERE agreed IS NOT NULL AND (placement_id IS NULL OR (agreed->>'location')=ANY(locations));
INSERT INTO rental_history_events(rental_id,asset_id,event_type,occurred_on,detail)
SELECT l.rental_id,p.asset_id,'installation_location_confirmed_from_agreement',l.installed_on,
 jsonb_build_object('location',l.location,'source',l.source,'termIds',l.agreed_term_ids,'catalogConflict',l.catalog_conflict,'originalCatalogType',p.type_at_install,'note',l.reason)
FROM rental_installation_locations l LEFT JOIN rental_placements p ON p.id=l.placement_id;

CREATE FUNCTION public.guard_installation_location_write() RETURNS trigger
LANGUAGE plpgsql SET search_path=public,pg_temp AS $$ BEGIN
 IF current_setting('sf_lifecycle.location_command',true) IS DISTINCT FROM 'on' THEN RAISE EXCEPTION 'Use the installation location confirmation command';END IF;
 IF TG_OP='DELETE' THEN RAISE EXCEPTION 'Installation location history cannot be deleted';END IF;
 RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.guard_installation_location_write() FROM PUBLIC,anon,authenticated,service_role;
CREATE TRIGGER guard_installation_location_write BEFORE INSERT OR UPDATE OR DELETE ON public.rental_installation_locations FOR EACH ROW EXECUTE FUNCTION public.guard_installation_location_write();

CREATE FUNCTION public.capture_installation_location() RETURNS trigger
LANGUAGE plpgsql SET search_path=public,pg_temp AS $$
DECLARE chosen text:=nullif(current_setting('sf_lifecycle.install_location',true),''); agreed jsonb; allowed text[];
BEGIN
 IF chosen IS NULL OR chosen NOT IN('indoor','outdoor') THEN RAISE EXCEPTION 'Explicitly confirm indoor or outdoor installation';END IF;
 agreed:=public.rental_agreed_location(NEW.rental_id,NEW.installed_on);
 IF agreed IS NULL THEN RAISE EXCEPTION 'Record an unambiguous agreement placement before confirming installation';END IF;
 IF chosen IS DISTINCT FROM agreed->>'location' THEN RAISE EXCEPTION 'Installation must match the agreement placement';END IF;
 SELECT locations INTO allowed FROM sauna_inventory WHERE id=NEW.asset_id;
 IF (chosen=ANY(allowed)) IS NOT TRUE THEN RAISE EXCEPTION 'Sauna capability does not support this installation placement';END IF;
 PERFORM set_config('sf_lifecycle.location_command','on',true);
 INSERT INTO rental_installation_locations(rental_id,placement_id,installed_on,location,source,reason,agreed_term_ids,catalog_conflict)
 VALUES(NEW.rental_id,NEW.id,NEW.installed_on,chosen,'explicit_confirmation',NEW.evidence,agreed->'termIds',public.rental_location_from_type(NEW.type_at_install) IS DISTINCT FROM chosen);
 PERFORM set_config('sf_lifecycle.location_command','off',true);
 RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.capture_installation_location() FROM PUBLIC,anon,authenticated,service_role;
CREATE TRIGGER capture_installation_location AFTER INSERT ON public.rental_placements FOR EACH ROW EXECUTE FUNCTION public.capture_installation_location();

ALTER FUNCTION public.rental_lifecycle_command(uuid,text,jsonb) RENAME TO rental_lifecycle_before_location_tracking;
REVOKE ALL ON FUNCTION public.rental_lifecycle_before_location_tracking(uuid,text,jsonb) FROM PUBLIC,anon,authenticated,service_role;
CREATE FUNCTION public.rental_lifecycle_command(command_id uuid,operation text,payload jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE prior rental_lifecycle_commands; r rentals; p rental_placements; old rental_installation_locations; loc text; day date; agreed jsonb; result jsonb; target uuid;
BEGIN
 IF operation NOT IN('install','swap','legacy_swap','confirm_location') THEN RETURN rental_lifecycle_before_location_tracking(command_id,operation,payload);END IF;
 PERFORM pg_advisory_xact_lock(73417722);
 IF command_id IS NULL THEN RAISE EXCEPTION 'Request ID required';END IF;
 SELECT * INTO prior FROM rental_lifecycle_commands WHERE id=command_id;
 IF FOUND THEN
  IF prior.command<>operation OR prior.request<>payload THEN RAISE EXCEPTION 'Request ID already used for another operation';END IF;
  RETURN prior.result;
 END IF;
 loc:=payload->>'installationLocation';
 IF loc IS NULL OR loc NOT IN('indoor','outdoor') THEN RAISE EXCEPTION 'Explicitly confirm indoor or outdoor installation';END IF;
 IF operation<>'confirm_location' THEN
  PERFORM set_config('sf_lifecycle.install_location',loc,true);
  result:=rental_lifecycle_before_location_tracking(command_id,operation,payload);
  PERFORM set_config('sf_lifecycle.install_location','',true);
  RETURN result;
 END IF;
 SELECT * INTO r FROM rentals WHERE id=(payload->>'rentalId')::uuid FOR UPDATE;
 IF r.id IS NULL OR r.purpose='purchase' OR r.lifecycle_state='canceled' OR r.owner_review->>'neverInstalled'='true' THEN RAISE EXCEPTION 'Choose an installed rental';END IF;
 IF r.version IS DISTINCT FROM (payload->>'version')::integer THEN RAISE EXCEPTION 'Rental changed; refresh before saving' USING ERRCODE='40001';END IF;
 IF nullif(btrim(payload->>'evidence'),'') IS NULL THEN RAISE EXCEPTION 'Confirmation source required';END IF;
 target:=nullif(payload->>'placementId','')::uuid;
 IF target IS NOT NULL THEN
  SELECT * INTO p FROM rental_placements WHERE id=target AND rental_id=r.id FOR UPDATE;
  IF p.id IS NULL THEN RAISE EXCEPTION 'Installation record not found';END IF;day:=p.installed_on;
 ELSE day:=r.actual_start;IF day IS NULL OR EXISTS(SELECT 1 FROM rental_placements WHERE rental_id=r.id AND installed_on=day) THEN RAISE EXCEPTION 'Choose the dated installation record';END IF;
 END IF;
 agreed:=public.rental_agreed_location(r.id,day);
 IF agreed IS NULL OR loc IS DISTINCT FROM agreed->>'location' THEN RAISE EXCEPTION 'Installation must match an unambiguous recorded agreement placement';END IF;
 IF p.id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM sauna_inventory WHERE id=p.asset_id AND loc=ANY(locations)) THEN RAISE EXCEPTION 'Sauna capability does not support this installation placement';END IF;
 SELECT * INTO old FROM rental_installation_locations WHERE rental_id=r.id AND installed_on=day AND placement_id IS NOT DISTINCT FROM target FOR UPDATE;
 PERFORM set_config('sf_lifecycle.command','on',true);PERFORM set_config('sf_lifecycle.location_command','on',true);
 IF old.id IS NULL THEN
  INSERT INTO rental_installation_locations(rental_id,placement_id,installed_on,location,source,reason,agreed_term_ids,catalog_conflict)
  VALUES(r.id,target,day,loc,'explicit_confirmation',payload->>'evidence',agreed->'termIds',target IS NOT NULL AND public.rental_location_from_type(p.type_at_install) IS DISTINCT FROM loc);
 ELSE
  UPDATE rental_installation_locations SET location=loc,source='explicit_confirmation',reason=payload->>'evidence',agreed_term_ids=agreed->'termIds' WHERE id=old.id;
 END IF;
 UPDATE rentals SET version=version+1 WHERE id=r.id;
 INSERT INTO rental_history_events(rental_id,asset_id,event_type,occurred_on,detail) VALUES(r.id,p.asset_id,'installation_location_confirmed',day,jsonb_build_object('before',to_jsonb(old),'location',loc,'termIds',agreed->'termIds','note',payload->>'evidence'));
 result:=jsonb_build_object('rentalId',r.id,'location',loc,'version',r.version+1);
 INSERT INTO rental_lifecycle_commands(id,command,request,result) VALUES(command_id,operation,payload,result);
 PERFORM set_config('sf_lifecycle.location_command','off',true);PERFORM set_config('sf_lifecycle.command','off',true);
 RETURN result;
END; $$;
REVOKE ALL ON FUNCTION public.rental_lifecycle_command(uuid,text,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.rental_lifecycle_command(uuid,text,jsonb) TO service_role;
DO $$ BEGIN IF (select jsonb_build_object('contracts',(select md5(coalesce(string_agg((to_jsonb(x))::text,'' order by id),'')) from public.contracts x),'reservations',(select md5(coalesce(string_agg((to_jsonb(x))::text,'' order by id),'')) from public.reservations x),'rentals',(select md5(coalesce(string_agg((to_jsonb(x))::text,'' order by id),'')) from public.rentals x),'sauna_inventory',(select md5(coalesce(string_agg((to_jsonb(x))::text,'' order by id),'')) from public.sauna_inventory x),'rental_placements',(select md5(coalesce(string_agg((to_jsonb(x))::text,'' order by id),'')) from public.rental_placements x),'rental_terms',(select md5(coalesce(string_agg((to_jsonb(x)-'agreed_location')::text,'' order by id),'')) from public.rental_terms x),'sauna_sales',(select md5(coalesce(string_agg((to_jsonb(x))::text,'' order by id),'')) from public.sauna_sales x))) IS DISTINCT FROM (SELECT value FROM installation_location_before) THEN RAISE EXCEPTION 'Placement migration changed existing business records';END IF;END; $$;
NOTIFY pgrst,'reload schema';
COMMIT;
