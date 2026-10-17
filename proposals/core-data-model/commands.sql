BEGIN;
ALTER TABLE public.customer_profiles ADD COLUMN version integer NOT NULL DEFAULT 1 CHECK(version>0);
CREATE FUNCTION public.core_record_command(command text, payload jsonb) RETURNS uuid
LANGUAGE plpgsql SET search_path=public,pg_temp AS $$
DECLARE record_id uuid := (payload->>'id')::uuid; customer_id_value uuid; expected_version integer; reservation_id_value uuid;
BEGIN
  IF record_id IS NULL THEN RAISE EXCEPTION 'Record ID required' USING ERRCODE='22023'; END IF;
  IF command='save_customer' THEN
    IF coalesce(payload->>'kind','') NOT IN('person','business','unknown') THEN RAISE EXCEPTION 'Invalid customer type' USING ERRCODE='22023'; END IF;
    IF length(coalesce(payload->>'name',''))>500 OR length(coalesce(payload->>'email',''))>500 OR length(coalesce(payload->>'phone',''))>100 THEN RAISE EXCEPTION 'Contact value too long' USING ERRCODE='22023'; END IF;
    IF btrim(coalesce(payload->>'name',''))='' AND btrim(coalesce(payload->>'email',''))='' THEN RAISE EXCEPTION 'Customer name or email required' USING ERRCODE='22023'; END IF;
    expected_version := (payload->>'version')::integer;
    IF expected_version IS NULL THEN
      INSERT INTO public.customer_profiles(id,kind,display_name,email,phone)
      VALUES(record_id,payload->>'kind',nullif(btrim(payload->>'name'),''),nullif(btrim(payload->>'email'),''),nullif(btrim(payload->>'phone'),''));
    ELSE
      UPDATE public.customer_profiles SET kind=payload->>'kind',display_name=nullif(btrim(payload->>'name'),''),email=nullif(btrim(payload->>'email'),''),phone=nullif(btrim(payload->>'phone'),''),version=version+1
      WHERE id=record_id AND version=expected_version;
      IF NOT FOUND THEN RAISE EXCEPTION 'Customer changed; refresh before saving' USING ERRCODE='40001'; END IF;
    END IF;
  ELSIF command='archive_customer' THEN
    IF jsonb_typeof(payload->'archived') IS DISTINCT FROM 'boolean' THEN RAISE EXCEPTION 'Archive choice required' USING ERRCODE='22023'; END IF;
    expected_version := (payload->>'version')::integer;
    IF coalesce((payload->>'archived')::boolean,false) AND EXISTS(
      SELECT 1 FROM public.sauna_inventory i JOIN public.reservation_customer_links l
      ON l.reservation_id IN(i.current_customer_id,i.future_customer_id) WHERE l.customer_id=record_id
    ) THEN RAISE EXCEPTION 'Resolve current and future inventory links before archiving this customer' USING ERRCODE='22023'; END IF;
    UPDATE public.customer_profiles SET archived_at=CASE WHEN (payload->>'archived')::boolean THEN now() ELSE NULL END,version=version+1
    WHERE id=record_id AND version=expected_version;
    IF NOT FOUND THEN RAISE EXCEPTION 'Customer changed; refresh before saving' USING ERRCODE='40001'; END IF;
  ELSIF command='add_rental' THEN
    customer_id_value := (payload->>'customerId')::uuid;
    PERFORM 1 FROM public.customer_profiles WHERE id=customer_id_value AND archived_at IS NULL FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Choose an active customer' USING ERRCODE='22023'; END IF;
    IF btrim(coalesce(payload->>'address',''))='' OR length(payload->>'address')>2000 OR length(coalesce(payload->>'notes',''))>10000 THEN RAISE EXCEPTION 'Valid service address and notes required' USING ERRCODE='22023'; END IF;
    reservation_id_value := nullif(payload->>'reservationId','')::uuid;
    IF reservation_id_value IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.reservation_customer_links WHERE reservation_id=reservation_id_value AND customer_id=customer_id_value) THEN RAISE EXCEPTION 'Reservation belongs to another customer' USING ERRCODE='22023'; END IF;
    INSERT INTO public.rentals(id,customer_id,originating_reservation_id,service_address,notes,origin)
    VALUES(record_id,customer_id_value,reservation_id_value,btrim(payload->>'address'),nullif(btrim(payload->>'notes'),''),'admin');
  ELSE
    RAISE EXCEPTION 'Unsupported core operation' USING ERRCODE='22023';
  END IF;
  RETURN record_id;
END;
$$;
REVOKE ALL ON FUNCTION public.core_record_command(text,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.core_record_command(text,jsonb) TO service_role;
COMMIT;
