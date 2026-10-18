BEGIN;
SET LOCAL lock_timeout='5s';
ALTER TABLE public.customer_profiles ADD COLUMN primary_contact_name text;
ALTER TABLE public.rentals ADD COLUMN planned_end date;
ALTER TABLE public.rentals ADD COLUMN purpose text NOT NULL DEFAULT 'rental' CHECK(purpose IN('rental','purchase'));
ALTER TABLE public.rentals ADD COLUMN owner_review jsonb NOT NULL DEFAULT '{}' CHECK(jsonb_typeof(owner_review)='object');
CREATE TABLE public.customer_payment_reviews (
 tenant_id uuid NOT NULL, source_id text NOT NULL, customer_id uuid NOT NULL REFERENCES public.customer_profiles(id) ON DELETE RESTRICT,
 disposition text NOT NULL CHECK(disposition='duplicate'), retained_source_id text NOT NULL,
 reason text NOT NULL CHECK(length(btrim(reason))>0), reviewed_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(tenant_id,source_id), CHECK(source_id<>retained_source_id)
);
ALTER TABLE public.customer_payment_reviews ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.customer_payment_reviews FROM PUBLIC,anon,authenticated,service_role;
GRANT SELECT ON public.customer_payment_reviews TO service_role;

-- Keep the existing live operational workflow; the additional maintenance command
-- records an owner-reviewed batch atomically, including uncertain historical facts.
ALTER FUNCTION public.rental_lifecycle_command(uuid,text,jsonb) RENAME TO rental_lifecycle_command_before_owner_review;
REVOKE ALL ON FUNCTION public.rental_lifecycle_command_before_owner_review(uuid,text,jsonb) FROM PUBLIC,anon,authenticated,service_role;
CREATE FUNCTION public.rental_lifecycle_command(command_id uuid,operation text,payload jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE prior rental_lifecycle_commands%ROWTYPE; x jsonb; r rentals%ROWTYPE; a sauna_inventory%ROWTYPE; c customer_profiles%ROWTYPE;
 tx jsonb; kept jsonb; result jsonb; old_value jsonb; new_customer uuid; today date:=(now() AT TIME ZONE 'America/Los_Angeles')::date;
BEGIN
 PERFORM pg_advisory_xact_lock(73417722);
 IF operation='allocate_payment' AND EXISTS(SELECT 1 FROM customer_payment_reviews WHERE tenant_id=(payload->>'tenantId')::uuid AND source_id=payload->>'sourceId') THEN RAISE EXCEPTION 'This source receipt is an owner-reviewed duplicate; use the retained receipt'; END IF;
 IF operation IN('install','swap','terms') AND EXISTS(SELECT 1 FROM rentals WHERE id=(payload->>'rentalId')::uuid AND purpose='purchase') THEN RAISE EXCEPTION 'This booking is a purchase, not a rental'; END IF;
 IF operation<>'owner_review_batch' THEN RETURN rental_lifecycle_command_before_owner_review(command_id,operation,payload); END IF;
 IF command_id IS NULL OR nullif(btrim(payload->>'reason'),'') IS NULL THEN RAISE EXCEPTION 'Review ID and owner decision source required'; END IF;
 SELECT * INTO prior FROM rental_lifecycle_commands WHERE id=command_id;
 IF FOUND THEN
  IF prior.command<>operation OR prior.request<>payload THEN RAISE EXCEPTION 'Command ID already used for a different request'; END IF;
  RETURN prior.result;
 END IF;
 PERFORM set_config('sf_lifecycle.command','on',true);
 -- Validate every expected version before changing anything.
 FOR x IN SELECT value FROM jsonb_array_elements(coalesce(payload->'rentals','[]')) LOOP
  SELECT * INTO r FROM rentals WHERE id=(x->>'id')::uuid FOR UPDATE;
  IF NOT FOUND OR r.version IS DISTINCT FROM (x->>'version')::integer THEN RAISE EXCEPTION 'Rental changed. Refresh owner review. ID %, expected %, actual %',x->>'id',x->>'version',r.version USING ERRCODE='40001'; END IF;
  IF EXISTS(SELECT 1 FROM rental_placements WHERE rental_id=r.id) THEN RAISE EXCEPTION 'Review existing dated placements before using historical corrections'; END IF;
  IF x ? 'start' AND nullif(x->>'start','')::date>today OR x ? 'end' AND nullif(x->>'end','')::date>today THEN RAISE EXCEPTION 'Historical actual dates cannot be future dates'; END IF;
 END LOOP;
 FOR x IN SELECT value FROM jsonb_array_elements(coalesce(payload->'customers','[]')) LOOP
  SELECT * INTO c FROM customer_profiles WHERE id=(x->>'id')::uuid FOR UPDATE;
  IF NOT FOUND OR c.version IS DISTINCT FROM (x->>'version')::integer THEN RAISE EXCEPTION 'Customer changed. Refresh owner review.' USING ERRCODE='40001'; END IF;
  IF coalesce((x->>'archive')::boolean,false) AND (EXISTS(SELECT 1 FROM rentals WHERE customer_id=c.id) OR EXISTS(SELECT 1 FROM reservation_customer_links WHERE customer_id=c.id)) THEN RAISE EXCEPTION 'Service-only exclusion requires a customer without bookings or rentals'; END IF;
  UPDATE customer_profiles SET primary_contact_name=CASE WHEN x ? 'primaryContact' THEN nullif(x->>'primaryContact','') ELSE primary_contact_name END,
   archived_at=CASE WHEN coalesce((x->>'archive')::boolean,false) THEN coalesce(archived_at,now()) ELSE archived_at END,version=version+1 WHERE id=c.id;
 END LOOP;
 FOR x IN SELECT value FROM jsonb_array_elements(coalesce(payload->'inventory','[]')) LOOP
  SELECT * INTO a FROM sauna_inventory WHERE id=(x->>'id')::uuid FOR UPDATE;
  IF NOT FOUND OR a.current_customer_id IS DISTINCT FROM nullif(x->>'expectedCurrent','')::uuid OR a.future_customer_id IS DISTINCT FROM nullif(x->>'expectedFuture','')::uuid
   OR a.install_date IS DISTINCT FROM nullif(x->>'expectedInstall','')::date OR a.status IS DISTINCT FROM x->>'expectedStatus' THEN RAISE EXCEPTION 'Sauna assignment changed. Refresh owner review.' USING ERRCODE='40001'; END IF;
  IF EXISTS(SELECT 1 FROM rental_placements WHERE asset_id=a.id) THEN RAISE EXCEPTION 'Review existing dated placements before changing a historical assignment'; END IF;
  IF x->>'status' NOT IN('Installed','Sold','Pre-sold','Available','Maintenance','Transfer Planned','Returning') THEN RAISE EXCEPTION 'Unsupported reviewed sauna status'; END IF;
  IF (a.status='Sold' AND x->>'status'<>'Sold') OR (a.retired_on IS NOT NULL) THEN RAISE EXCEPTION 'Sold or retired sauna cannot be reassigned'; END IF;
  new_customer:=nullif(x->>'currentReservationId','')::uuid;
  IF new_customer IS NOT NULL AND NOT EXISTS(SELECT 1 FROM rentals WHERE originating_reservation_id=new_customer AND lifecycle_state NOT IN('ended','canceled') AND purpose='rental') THEN RAISE EXCEPTION 'Current assignment needs an open rental'; END IF;
  IF x->>'status'='Sold' AND new_customer IS NOT NULL THEN RAISE EXCEPTION 'Sold sauna cannot remain rented'; END IF;
  UPDATE sauna_inventory SET current_customer_id=new_customer,current_customer=(SELECT p.display_name FROM reservation_customer_links l JOIN customer_profiles p ON p.id=l.customer_id WHERE l.reservation_id=new_customer),
   future_customer_id=nullif(x->>'futureReservationId','')::uuid,future_customer=(SELECT p.display_name FROM reservation_customer_links l JOIN customer_profiles p ON p.id=l.customer_id WHERE l.reservation_id=nullif(x->>'futureReservationId','')::uuid),
   status=x->>'status',install_date=CASE WHEN x ? 'installDate' THEN nullif(x->>'installDate','')::date ELSE install_date END,
   minimum_term_ends=CASE WHEN x ? 'minimumTermEnds' THEN nullif(x->>'minimumTermEnds','')::date ELSE minimum_term_ends END WHERE id=a.id;
 END LOOP;
 FOR x IN SELECT value FROM jsonb_array_elements(coalesce(payload->'rentals','[]')) LOOP
  SELECT * INTO r FROM rentals WHERE id=(x->>'id')::uuid;
  IF x->>'state' IN('ended','canceled') AND EXISTS(SELECT 1 FROM sauna_inventory WHERE current_customer_id=r.originating_reservation_id) THEN RAISE EXCEPTION 'Resolve the current sauna assignment before ending this rental'; END IF;
  IF x->>'state'='canceled' AND (r.actual_start IS NOT NULL OR EXISTS(SELECT 1 FROM rental_placements WHERE rental_id=r.id)) THEN RAISE EXCEPTION 'Installed rental cannot be canceled before installation'; END IF;
  IF coalesce((x->>'voidAgreements')::boolean,false) THEN
   UPDATE contracts SET status='Voided',voided_at=coalesce(voided_at,now()),void_reason=payload->>'reason' WHERE id IN(SELECT contract_id FROM rental_agreements WHERE rental_id=r.id) AND voided_at IS NULL;
   UPDATE rental_agreements SET signing_state='voided',owner_corrections=owner_corrections||jsonb_build_object('cancellation',payload->>'reason') WHERE rental_id=r.id;
   UPDATE rental_terms SET state='superseded' WHERE rental_id=r.id;
  END IF;
  IF x->>'state'='canceled' AND EXISTS(SELECT 1 FROM rental_agreements WHERE rental_id=r.id AND signing_state='signed') THEN RAISE EXCEPTION 'Cancel or settle signed agreements first'; END IF;
  UPDATE rentals SET planned_end=CASE WHEN x ? 'plannedEnd' THEN nullif(x->>'plannedEnd','')::date ELSE planned_end END,lifecycle_state=coalesce(x->>'state',lifecycle_state),purpose=coalesce(x->>'purpose',purpose),
   actual_start=CASE WHEN x ? 'start' THEN nullif(x->>'start','')::date ELSE actual_start END,
   actual_end=CASE WHEN x ? 'end' THEN nullif(x->>'end','')::date ELSE actual_end END,
   actual_start_source=CASE WHEN x ? 'start' THEN x->>'startSource' ELSE actual_start_source END,
   actual_start_evidence=CASE WHEN x ? 'start' THEN coalesce(x->'startEvidence','{}') ELSE actual_start_evidence END,
   removal_window_start=CASE WHEN x ? 'removalWindowStart' THEN nullif(x->>'removalWindowStart','')::date ELSE removal_window_start END,
   removal_window_end=CASE WHEN x ? 'removalWindowEnd' THEN nullif(x->>'removalWindowEnd','')::date ELSE removal_window_end END,
   removal_evidence=CASE WHEN x ? 'removalEvidence' THEN x->'removalEvidence' ELSE removal_evidence END,
   owner_review=owner_review||coalesce(x->'review','{}'),history_gaps=coalesce(x->'gaps',history_gaps),service_address=coalesce(x->>'address',service_address),version=version+1 WHERE id=r.id;
  INSERT INTO rental_history_events(rental_id,event_type,detail) VALUES(r.id,'Owner-reviewed correction',jsonb_build_object('note',payload->>'reason','before',to_jsonb(r),'correction',x));
 END LOOP;
 FOR x IN SELECT value FROM jsonb_array_elements(coalesce(payload->'terms','[]')) LOOP
  SELECT to_jsonb(t) INTO old_value FROM rental_terms t WHERE id=(x->>'id')::uuid AND rental_id=(x->>'rentalId')::uuid;
  IF old_value IS NULL OR NOT EXISTS(SELECT 1 FROM jsonb_array_elements(payload->'rentals') j WHERE j->>'id'=x->>'rentalId') THEN RAISE EXCEPTION 'Term correction must belong to a version-checked rental'; END IF;
  UPDATE rental_terms SET minimum_months=coalesce((x->>'minimumMonths')::integer,minimum_months),base_monthly_cents=coalesce((x->>'monthlyCents')::bigint,base_monthly_cents),extras=coalesce(x->'extras',extras),sauna_type=coalesce(x->>'saunaType',sauna_type),note=concat_ws(E'\n',note,payload->>'reason') WHERE id=(x->>'id')::uuid;
  UPDATE rental_agreements SET owner_corrections=owner_corrections||jsonb_build_object('historicalReview',x) WHERE id=(old_value->>'agreement_id')::uuid;
  INSERT INTO rental_history_events(rental_id,event_type,detail) VALUES((x->>'rentalId')::uuid,'Agreement terms reviewed',jsonb_build_object('before',old_value,'correction',x,'note',payload->>'reason'));
 END LOOP;
 FOR x IN SELECT value FROM jsonb_array_elements(coalesce(payload->'sales','[]')) LOOP
  SELECT * INTO r FROM rentals WHERE id=(x->>'rentalId')::uuid;
  SELECT * INTO a FROM sauna_inventory WHERE id=(x->>'assetId')::uuid;
  IF r.id IS NULL OR a.id IS NULL OR r.customer_id IS DISTINCT FROM (x->>'customerId')::uuid OR r.lifecycle_state<>'ended' OR a.status<>'Sold' OR a.current_customer_id IS NOT NULL OR r.actual_end IS DISTINCT FROM (x->>'date')::date OR (x->>'date')::date>today THEN RAISE EXCEPTION 'Historical sale must match ended rental, owner-confirmed date and sold sauna'; END IF;
  INSERT INTO sauna_sales(id,asset_id,customer_id,rental_id,sold_on,agreed_cents,source_reference,note) VALUES((x->>'id')::uuid,a.id,r.customer_id,r.id,(x->>'date')::date,(x->>'agreedCents')::bigint,payload->>'reason',x->>'note');
 END LOOP;
 FOR x IN SELECT value FROM jsonb_array_elements(coalesce(payload->'events','[]')) LOOP
  IF nullif(x->>'date','')::date>today THEN RAISE EXCEPTION 'Historical event cannot be in the future'; END IF;
  INSERT INTO rental_history_events(id,rental_id,asset_id,event_type,occurred_on,detail) VALUES((x->>'id')::uuid,nullif(x->>'rentalId','')::uuid,nullif(x->>'assetId','')::uuid,x->>'type',nullif(x->>'date','')::date,coalesce(x->'detail','{}'));
 END LOOP;
 FOR x IN SELECT value FROM jsonb_array_elements(coalesce(payload->'paymentReviews','[]')) LOOP
  tx:=NULL;kept:=NULL;
  SELECT z INTO tx FROM xero_customer_history h JOIN xero_customer_links l USING(tenant_id,contact_id),LATERAL jsonb_array_elements(h.transactions) z WHERE h.tenant_id=(x->>'tenantId')::uuid AND l.customer_id=(x->>'customerId')::uuid AND z->>'id'=x->>'sourceId' AND z->>'status'='AUTHORISED' LIMIT 1;
  SELECT z INTO kept FROM xero_customer_history h JOIN xero_customer_links l USING(tenant_id,contact_id),LATERAL jsonb_array_elements(h.transactions) z WHERE h.tenant_id=(x->>'tenantId')::uuid AND l.customer_id=(x->>'customerId')::uuid AND z->>'id'=x->>'retainedSourceId' AND z->>'status'='AUTHORISED' LIMIT 1;
  IF tx IS NULL OR kept IS NULL OR tx->>'type'<>'RECEIVE' OR kept->>'type'<>'RECEIVE' OR (tx->>'amount')::numeric<>(kept->>'amount')::numeric OR tx->>'currency' IS DISTINCT FROM kept->>'currency' THEN RAISE EXCEPTION 'Duplicate review needs matching original receipts for the same customer'; END IF;
  IF EXISTS(SELECT 1 FROM rental_payment_allocations WHERE tenant_id=(x->>'tenantId')::uuid AND source_id=x->>'sourceId' AND voided_at IS NULL) OR EXISTS(SELECT 1 FROM customer_payment_reviews WHERE tenant_id=(x->>'tenantId')::uuid AND (source_id=x->>'retainedSourceId' OR retained_source_id=x->>'sourceId')) THEN RAISE EXCEPTION 'Resolve existing allocations or duplicate reviews first'; END IF;
  INSERT INTO customer_payment_reviews(tenant_id,source_id,customer_id,disposition,retained_source_id,reason) VALUES((x->>'tenantId')::uuid,x->>'sourceId',(x->>'customerId')::uuid,'duplicate',x->>'retainedSourceId',x->>'reason');
 END LOOP;
 result:=jsonb_build_object('reviewed',true,'commandId',command_id);
 INSERT INTO rental_lifecycle_commands(id,command,request,result) VALUES(command_id,operation,payload,result);
 RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.rental_lifecycle_command(uuid,text,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.rental_lifecycle_command(uuid,text,jsonb) TO service_role;
COMMIT;
