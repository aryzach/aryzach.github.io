BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='120s';
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE public.reservations ADD COLUMN booking_kind text NOT NULL DEFAULT 'website'
 CHECK(booking_kind IN ('website','manual','manual_historical'));
ALTER TABLE public.reservations ADD COLUMN booked_on date;
ALTER TABLE public.reservations ADD COLUMN historical_key text UNIQUE;
ALTER TABLE public.reservations ALTER COLUMN email DROP NOT NULL;
ALTER TABLE public.reservations ALTER COLUMN preferred_install_at DROP NOT NULL;
ALTER TABLE public.reservations ALTER COLUMN sauna_type_id DROP NOT NULL;
ALTER TABLE public.reservations DROP CONSTRAINT IF EXISTS reservations_min_commitment_months_check;
ALTER TABLE public.reservations ADD CONSTRAINT reservations_known_commitment CHECK(min_commitment_months BETWEEN 1 AND 120);
ALTER TABLE public.reservations ADD CONSTRAINT website_booking_required_fields CHECK(
 booking_kind <> 'website' OR (email IS NOT NULL AND preferred_install_at IS NOT NULL AND sauna_type_id IS NOT NULL));
ALTER TABLE public.reservations ADD CONSTRAINT historical_booking_has_no_hold CHECK(
 booking_kind <> 'manual_historical' OR historical_key IS NULL OR (hold_created_at IS NULL AND hold_deadline IS NULL));
-- Preserve the original source label and all existing IDs; mark CRM-imported
-- manual bookings explicitly without pretending their import date was booking day.
UPDATE public.reservations SET booking_kind='manual_historical' WHERE reservation_source='Backfill';

ALTER TABLE public.rentals ADD COLUMN lifecycle_state text NOT NULL DEFAULT 'unconfirmed'
 CHECK(lifecycle_state IN ('unconfirmed','planned','active','ended','canceled'));
ALTER TABLE public.rentals ADD COLUMN actual_start date;
ALTER TABLE public.rentals ADD COLUMN actual_end date;
ALTER TABLE public.rentals ADD COLUMN removal_window_start date;
ALTER TABLE public.rentals ADD COLUMN removal_window_end date;
ALTER TABLE public.rentals ADD COLUMN removal_evidence jsonb NOT NULL DEFAULT '{}';
ALTER TABLE public.rentals ADD CONSTRAINT rental_removal_window CHECK((removal_window_start IS NULL AND removal_window_end IS NULL) OR (removal_window_start IS NOT NULL AND removal_window_end IS NOT NULL AND removal_window_end>=removal_window_start AND lifecycle_state='ended'));
ALTER TABLE public.rentals ADD COLUMN actual_start_source text;
ALTER TABLE public.rentals ADD COLUMN actual_start_evidence jsonb NOT NULL DEFAULT '{}';
ALTER TABLE public.rentals ADD COLUMN history_gaps jsonb NOT NULL DEFAULT '[]' CHECK(jsonb_typeof(history_gaps)='array');
ALTER TABLE public.rentals ADD COLUMN version integer NOT NULL DEFAULT 1 CHECK(version>0);
ALTER TABLE public.rentals ADD COLUMN history_key text UNIQUE;
ALTER TABLE public.rentals ADD CONSTRAINT rental_order CHECK(actual_end IS NULL OR actual_start IS NULL OR actual_end>=actual_start);
ALTER TABLE public.rentals ADD CONSTRAINT rental_end_state CHECK(actual_end IS NULL OR lifecycle_state='ended');
ALTER TABLE public.sauna_inventory ADD COLUMN retired_on date;

CREATE TABLE public.rental_documents (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), sha256 text NOT NULL UNIQUE CHECK(sha256 ~ '^[a-f0-9]{64}$'),
 filename text NOT NULL, storage_path text NOT NULL UNIQUE, media_type text NOT NULL DEFAULT 'application/pdf',
 byte_size bigint NOT NULL CHECK(byte_size>0), source_paths jsonb NOT NULL DEFAULT '[]',
 incomplete boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.rental_agreements (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), rental_id uuid NOT NULL REFERENCES public.rentals(id) ON DELETE RESTRICT,
 contract_id uuid UNIQUE REFERENCES public.contracts(id) ON DELETE RESTRICT,
 document_id uuid REFERENCES public.rental_documents(id) ON DELETE RESTRICT,
 source_key text UNIQUE, label text NOT NULL,
 agreement_date date, signed_on date, signing_state text NOT NULL DEFAULT 'unconfirmed'
 CHECK(signing_state IN('unconfirmed','signed','voided')),
 source_terms jsonb NOT NULL DEFAULT '{}', owner_corrections jsonb NOT NULL DEFAULT '{}',
 created_at timestamptz NOT NULL DEFAULT now(),
 CHECK(contract_id IS NOT NULL OR document_id IS NOT NULL), UNIQUE(rental_id,id)
);
CREATE TABLE public.rental_terms (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), rental_id uuid NOT NULL REFERENCES public.rentals(id) ON DELETE RESTRICT,
 agreement_id uuid, state text NOT NULL DEFAULT 'unconfirmed' CHECK(state IN('unconfirmed','planned','effective','superseded')),
 effective_from date, effective_until date, minimum_months integer CHECK(minimum_months BETWEEN 1 AND 120),
 commitment_start date, base_monthly_cents bigint CHECK(base_monthly_cents>=0),
 extras jsonb NOT NULL DEFAULT '[]' CHECK(jsonb_typeof(extras)='array'), currency text NOT NULL DEFAULT 'USD' CHECK(currency ~ '^[A-Z]{3}$'),
 sauna_type text, source text NOT NULL, note text, created_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY(rental_id,agreement_id) REFERENCES public.rental_agreements(rental_id,id) ON DELETE RESTRICT,
 CHECK(effective_until IS NULL OR (effective_from IS NOT NULL AND effective_until>effective_from)),
 CHECK(state<>'effective' OR effective_from IS NOT NULL),
 EXCLUDE USING gist(rental_id WITH =,daterange(effective_from,effective_until,'[)') WITH &&)
 WHERE(state='effective')
);
CREATE FUNCTION public.validate_rental_extras() RETURNS trigger LANGUAGE plpgsql SET search_path=public,pg_temp AS $$ BEGIN
 IF EXISTS(SELECT 1 FROM jsonb_array_elements(NEW.extras) x WHERE jsonb_typeof(x)<>'object' OR nullif(btrim(x->>'name'),'') IS NULL OR coalesce(x->>'amountCents','') !~ '^[0-9]+$') THEN RAISE EXCEPTION 'Every extra needs a name and a non-negative amount in cents'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER validate_rental_extras BEFORE INSERT OR UPDATE ON public.rental_terms FOR EACH ROW EXECUTE FUNCTION public.validate_rental_extras();
CREATE TABLE public.rental_placements (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), rental_id uuid NOT NULL REFERENCES public.rentals(id) ON DELETE RESTRICT,
 asset_id uuid NOT NULL REFERENCES public.sauna_inventory(id) ON DELETE RESTRICT,
 installed_on date NOT NULL, removed_on date, address text, type_at_install text NOT NULL,
 evidence text NOT NULL CHECK(length(btrim(evidence))>0), created_at timestamptz NOT NULL DEFAULT now(),
 CHECK(removed_on IS NULL OR removed_on>=installed_on),
 EXCLUDE USING gist(asset_id WITH =,daterange(installed_on,removed_on,'[)') WITH &&),
 UNIQUE(rental_id,id)
);
CREATE TABLE public.sauna_sales (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), asset_id uuid NOT NULL UNIQUE REFERENCES public.sauna_inventory(id) ON DELETE RESTRICT,
 customer_id uuid NOT NULL REFERENCES public.customer_profiles(id) ON DELETE RESTRICT,
 rental_id uuid REFERENCES public.rentals(id) ON DELETE RESTRICT, sold_on date NOT NULL,
 agreed_cents bigint CHECK(agreed_cents>=0), currency text NOT NULL DEFAULT 'USD' CHECK(currency ~ '^[A-Z]{3}$'),
 source_reference text, note text, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.rental_settlements (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), rental_id uuid NOT NULL REFERENCES public.rentals(id) ON DELETE RESTRICT,
 settled_on date NOT NULL, kind text NOT NULL CHECK(kind IN('collect_remaining','exit_fee','partial_waiver','full_waiver')),
 amount_cents bigint NOT NULL CHECK(amount_cents>=0), reason text NOT NULL CHECK(length(btrim(reason))>0),
 supersedes_id uuid UNIQUE REFERENCES public.rental_settlements(id) ON DELETE RESTRICT,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.rental_history_events (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), rental_id uuid REFERENCES public.rentals(id) ON DELETE RESTRICT,
 asset_id uuid REFERENCES public.sauna_inventory(id) ON DELETE RESTRICT,
 event_type text NOT NULL, occurred_on date, detail jsonb NOT NULL DEFAULT '{}',
 created_at timestamptz NOT NULL DEFAULT now(), CHECK(rental_id IS NOT NULL OR asset_id IS NOT NULL)
);
-- Source cash remains in the existing Xero cache. An allocation references the exact
-- imported record, never a second copy of the cash. Unknown allocations stay absent.
CREATE TABLE public.rental_payment_allocations (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL, source_id text NOT NULL,
 customer_id uuid NOT NULL REFERENCES public.customer_profiles(id) ON DELETE RESTRICT,
 rental_id uuid REFERENCES public.rentals(id) ON DELETE RESTRICT,
 sale_id uuid REFERENCES public.sauna_sales(id) ON DELETE RESTRICT,
 placement_id uuid, category text NOT NULL CHECK(category IN('rental','addon','delivery','sale','deposit','tax','other')),
 amount_cents bigint NOT NULL CHECK(amount_cents>0), service_from date, service_until date,
 source_amount_cents bigint NOT NULL CHECK(source_amount_cents>0), source_kind text NOT NULL CHECK(source_kind IN('receipt','payment_out')),
 currency text NOT NULL CHECK(currency ~ '^[A-Z]{3}$'), note text,
 voided_at timestamptz, void_reason text,
 created_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY(rental_id,placement_id) REFERENCES public.rental_placements(rental_id,id) ON DELETE RESTRICT,
 CHECK(placement_id IS NULL OR rental_id IS NOT NULL),
 CHECK(num_nonnulls(rental_id,sale_id)<=1),
 CHECK(service_until IS NULL OR (service_from IS NOT NULL AND service_until>service_from))
);
CREATE TABLE public.rental_lifecycle_commands (
 id uuid PRIMARY KEY, command text NOT NULL, request jsonb NOT NULL, result jsonb NOT NULL,
 recorded_at timestamptz NOT NULL DEFAULT now()
);
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['rental_documents','rental_agreements','rental_terms','rental_placements','sauna_sales','rental_settlements','rental_history_events','rental_payment_allocations','rental_lifecycle_commands'] LOOP
  EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t);
  EXECUTE format('REVOKE ALL ON public.%I FROM PUBLIC,anon,authenticated,service_role',t);
  EXECUTE format('GRANT SELECT ON public.%I TO service_role',t);
 END LOOP;
END $$;

-- Historical/manual creation links directly to the selected customer. It must not
-- manufacture a second profile and merge it later.
CREATE OR REPLACE FUNCTION public.ensure_reservation_customer_profile() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE profile_id uuid;
BEGIN
 IF NEW.booking_kind IN('manual','manual_historical') THEN
  profile_id:=nullif(current_setting('sf_lifecycle.customer_id',true),'')::uuid;
  IF profile_id IS NULL OR NOT EXISTS(SELECT 1 FROM customer_profiles WHERE id=profile_id AND archived_at IS NULL) THEN
   RAISE EXCEPTION 'Manual reservations require a selected active customer';
  END IF;
 ELSE
  INSERT INTO customer_profiles(kind,display_name,email,phone)
  VALUES('unknown',nullif(btrim(concat_ws(' ',NEW.first_name,NEW.last_name)),''),NEW.email,NEW.phone) RETURNING id INTO profile_id;
 END IF;
 INSERT INTO reservation_customer_links(reservation_id,customer_id,provenance)
 VALUES(NEW.id,profile_id,CASE WHEN NEW.booking_kind='website' THEN 'legacy_separate_profile' ELSE 'owner_reviewed' END);
 RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.sauna_inventory_fill_committed_until()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE m integer;
BEGIN
  IF current_setting('sf_lifecycle.command',true)='on' THEN RETURN NEW; END IF;
  IF NEW.status = 'Installed' AND NEW.install_date IS NOT NULL
     AND NEW.minimum_term_ends IS NULL AND NEW.current_customer_id IS NOT NULL THEN
    SELECT c.commitment_months INTO m FROM public.contracts c
      WHERE c.reservation_id = NEW.current_customer_id AND c.voided_at IS NULL
      ORDER BY (c.signed_at IS NOT NULL) DESC, c.created_at DESC LIMIT 1;
    IF m IS NULL THEN
      SELECT COALESCE(r.custom_commitment_months, r.min_commitment_months) INTO m
        FROM public.reservations r WHERE r.id = NEW.current_customer_id;
    END IF;
    IF m IS NOT NULL AND m > 0 THEN
      NEW.minimum_term_ends := (NEW.install_date + make_interval(months => m))::date;
    END IF;
  END IF;
  RETURN NEW;
END $$;


-- This gate prevents stale inventory screens from bypassing dated operations.
-- Future reservation holds keep their existing writer and behavior.
CREATE FUNCTION public.protect_rental_inventory_history() RETURNS trigger
LANGUAGE plpgsql SET search_path=public,pg_temp AS $$
BEGIN
 IF TG_OP='DELETE' THEN
  IF OLD.current_customer_id IS NOT NULL OR EXISTS(SELECT 1 FROM rental_placements WHERE asset_id=OLD.id)
   OR EXISTS(SELECT 1 FROM sauna_sales WHERE asset_id=OLD.id) THEN RAISE EXCEPTION 'This sauna has history. Record a sale or retirement instead of deleting it.'; END IF;
  RETURN OLD;
 END IF;
 IF current_setting('sf_lifecycle.command',true) IS DISTINCT FROM 'on' THEN
  IF NEW.current_customer_id IS DISTINCT FROM OLD.current_customer_id OR
   NEW.install_date IS DISTINCT FROM OLD.install_date OR
   NEW.retired_on IS DISTINCT FROM OLD.retired_on OR
   (OLD.retired_on IS NOT NULL AND NEW.status IS DISTINCT FROM OLD.status) OR
   (NEW.status IS DISTINCT FROM OLD.status AND (NEW.status IN('Installed','Sold') OR OLD.status='Sold')) THEN
   RAISE EXCEPTION 'Use the rental history installation, return, swap or sale action.';
  END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER protect_rental_inventory_history BEFORE UPDATE OR DELETE ON public.sauna_inventory
FOR EACH ROW EXECUTE FUNCTION public.protect_rental_inventory_history();

CREATE FUNCTION public.validate_payment_allocation() RETURNS trigger
LANGUAGE plpgsql SET search_path=public,pg_temp AS $$
DECLARE allocated bigint;
BEGIN
 PERFORM pg_advisory_xact_lock(hashtextextended(NEW.tenant_id::text||':'||NEW.source_id,0));
 IF NEW.rental_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM rentals WHERE id=NEW.rental_id AND customer_id=NEW.customer_id) THEN RAISE EXCEPTION 'Payment rental belongs to another customer'; END IF;
 IF NEW.sale_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM sauna_sales WHERE id=NEW.sale_id AND customer_id=NEW.customer_id) THEN RAISE EXCEPTION 'Payment sale belongs to another customer'; END IF;
 IF EXISTS(SELECT 1 FROM rental_payment_allocations WHERE tenant_id=NEW.tenant_id AND source_id=NEW.source_id AND (source_amount_cents<>NEW.source_amount_cents OR currency<>NEW.currency OR source_kind<>NEW.source_kind OR customer_id<>NEW.customer_id)) THEN RAISE EXCEPTION 'Source payment identity or amount changed. Refresh Xero history.'; END IF;
 SELECT coalesce(sum(amount_cents),0) INTO allocated FROM rental_payment_allocations WHERE tenant_id=NEW.tenant_id AND source_id=NEW.source_id AND voided_at IS NULL;
 IF allocated+NEW.amount_cents>NEW.source_amount_cents THEN RAISE EXCEPTION 'Allocations exceed the original payment amount'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER validate_payment_allocation BEFORE INSERT ON public.rental_payment_allocations FOR EACH ROW EXECUTE FUNCTION public.validate_payment_allocation();

CREATE FUNCTION public.rental_lifecycle_command(command_id uuid, operation text, payload jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE prior rental_lifecycle_commands%ROWTYPE; r rentals%ROWTYPE; p rental_placements%ROWTYPE;
 a sauna_inventory%ROWTYPE; c customer_profiles%ROWTYPE; result jsonb; rid uuid; res_id uuid; id_value uuid;
 day date; target uuid; commitment_end date; agreed rental_terms%ROWTYPE; end_state text; tx jsonb; doc uuid; ag uuid;
BEGIN
 IF command_id IS NULL THEN RAISE EXCEPTION 'Command ID required'; END IF;
 PERFORM pg_advisory_xact_lock(73417722);
 PERFORM pg_advisory_xact_lock(hashtextextended(command_id::text,0));
 SELECT * INTO prior FROM rental_lifecycle_commands WHERE id=command_id;
 IF FOUND THEN
  IF prior.command<>operation OR prior.request<>payload THEN RAISE EXCEPTION 'Command ID already used for a different request'; END IF;
  RETURN prior.result;
 END IF;
 PERFORM set_config('sf_lifecycle.command','on',true);
 IF operation='document' THEN
  INSERT INTO rental_documents(sha256,filename,storage_path,byte_size,source_paths,incomplete)
  VALUES(payload->>'sha256',payload->>'filename',payload->>'storagePath',(payload->>'byteSize')::bigint,coalesce(payload->'sourcePaths','[]'),coalesce((payload->>'incomplete')::boolean,false))
  ON CONFLICT(sha256) DO NOTHING;
  SELECT id INTO id_value FROM rental_documents WHERE sha256=payload->>'sha256';
 ELSIF operation='link_agreement' THEN
  SELECT * INTO r FROM rentals WHERE id=(payload->>'rentalId')::uuid FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Rental not found'; END IF;
  rid:=r.id;
  IF (payload->>'version')::integer IS DISTINCT FROM r.version THEN RAISE EXCEPTION 'Rental changed. Refresh before saving.' USING ERRCODE='40001'; END IF;
  INSERT INTO rental_agreements(rental_id,document_id,source_key,label,agreement_date,signed_on,signing_state,source_terms,owner_corrections)
  VALUES(r.id,(payload->>'documentId')::uuid,payload->>'sourceKey',payload->>'label',nullif(payload->>'agreementDate','')::date,
    nullif(payload->>'signedOn','')::date,coalesce(payload->>'signingState','unconfirmed'),coalesce(payload->'sourceTerms','{}'),coalesce(payload->'ownerCorrections','{}')) RETURNING id INTO ag;
  INSERT INTO rental_terms(rental_id,agreement_id,state,minimum_months,base_monthly_cents,extras,sauna_type,source,note)
  VALUES(r.id,ag,'unconfirmed',nullif(payload->>'minimumMonths','')::integer,nullif(payload->>'monthlyCents','')::bigint,
    coalesce(payload->'extras','[]'),payload->>'saunaType','Uploaded contract and owner review',payload->>'notes');
  UPDATE rentals SET version=version+1 WHERE id=r.id;id_value:=ag;
 ELSIF operation='backfill_history' THEN
  SELECT * INTO r FROM rentals WHERE id=(payload->>'rentalId')::uuid FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Rental not found'; END IF;
  IF (payload->>'version')::integer IS DISTINCT FROM r.version THEN RAISE EXCEPTION 'Rental changed. Refresh before saving.' USING ERRCODE='40001'; END IF;
  rid:=r.id;
  IF r.actual_start IS NOT NULL AND r.actual_start IS DISTINCT FROM nullif(payload->>'start','')::date AND
   (coalesce((payload->>'replaceStart')::boolean,false)=false OR nullif(btrim(payload->>'reason'),'') IS NULL)
  THEN RAISE EXCEPTION 'Existing installation date differs. Confirm the correction and give a reason.'; END IF;
  IF coalesce(payload->>'state','unconfirmed') NOT IN('unconfirmed','planned','active','ended') THEN RAISE EXCEPTION 'Invalid historical state'; END IF;
  IF nullif(payload->>'start','') IS NOT NULL AND nullif(payload->>'dateSource','') IS NULL THEN RAISE EXCEPTION 'Date source is required'; END IF;
  IF r.lifecycle_state='canceled' THEN RAISE EXCEPTION 'Canceled rental history cannot be reopened'; END IF;
  IF r.actual_end IS DISTINCT FROM nullif(payload->>'end','')::date AND r.actual_end IS NOT NULL AND nullif(btrim(payload->>'reason'),'') IS NULL THEN RAISE EXCEPTION 'Return-date corrections require a reason'; END IF;
  IF EXISTS(SELECT 1 FROM rental_placements WHERE rental_id=r.id AND (nullif(payload->>'start','')::date>installed_on OR nullif(payload->>'end','')::date<coalesce(removed_on,'infinity'::date))) THEN RAISE EXCEPTION 'Rental dates must contain every sauna placement'; END IF;
  IF EXISTS(SELECT 1 FROM rental_placements WHERE rental_id=r.id) AND nullif(payload->>'start','') IS NULL THEN RAISE EXCEPTION 'A rental with confirmed placements must retain its installation date'; END IF;
  IF payload->>'state'='ended' AND (EXISTS(SELECT 1 FROM rental_placements WHERE rental_id=r.id AND removed_on IS NULL) OR EXISTS(SELECT 1 FROM sauna_inventory WHERE current_customer_id=r.originating_reservation_id)) THEN RAISE EXCEPTION 'Record all returns or sales before marking the rental ended'; END IF;
  IF nullif(payload->>'start','')::date>(now() AT TIME ZONE 'America/Los_Angeles')::date OR nullif(payload->>'end','')::date>(now() AT TIME ZONE 'America/Los_Angeles')::date THEN RAISE EXCEPTION 'Historical actual dates cannot be future dates'; END IF;
  IF nullif(payload->>'removalWindowEnd','')::date>(now() AT TIME ZONE 'America/Los_Angeles')::date THEN RAISE EXCEPTION 'Estimated removal cannot be later than today for an ended rental'; END IF;
  IF nullif(payload->>'removalWindowStart','')::date<nullif(payload->>'start','')::date THEN RAISE EXCEPTION 'Removal estimate cannot precede installation'; END IF;
  UPDATE rentals SET removal_window_start=nullif(payload->>'removalWindowStart','')::date,removal_window_end=nullif(payload->>'removalWindowEnd','')::date,removal_evidence=coalesce(payload->'removalEvidence',removal_evidence),actual_start=nullif(payload->>'start','')::date,actual_end=nullif(payload->>'end','')::date,
    actual_start_source=payload->>'dateSource',actual_start_evidence=CASE WHEN payload ? 'dateEvidence' THEN payload->'dateEvidence' WHEN r.actual_start IS NOT DISTINCT FROM nullif(payload->>'start','')::date THEN r.actual_start_evidence ELSE jsonb_build_object('reason',payload->>'reason') END,lifecycle_state=coalesce(payload->>'state','unconfirmed'),history_gaps=coalesce(payload->'gaps','[]'),
    service_address=coalesce(nullif(payload->>'address',''),service_address),version=version+1 WHERE id=r.id;
  day:=nullif(payload->>'start','')::date;
 ELSIF operation='confirm_agreement' THEN
  SELECT * INTO r FROM rentals WHERE id=(payload->>'rentalId')::uuid FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Rental not found'; END IF;rid:=r.id;
  IF (payload->>'version')::integer IS DISTINCT FROM r.version THEN RAISE EXCEPTION 'Rental changed. Refresh before saving.' USING ERRCODE='40001'; END IF;
  IF payload->>'signingState' NOT IN('signed','unconfirmed','voided') OR nullif(btrim(payload->>'reason'),'') IS NULL THEN RAISE EXCEPTION 'Signing review and reason required'; END IF;
  UPDATE rental_agreements SET signing_state=payload->>'signingState',owner_corrections=owner_corrections||jsonb_build_object('signingReview',jsonb_build_object('state',payload->>'signingState','reason',payload->>'reason','recordedAt',now()))
   WHERE id=(payload->>'agreementId')::uuid AND rental_id=r.id AND contract_id IS NULL RETURNING id INTO id_value;
  IF id_value IS NULL THEN RAISE EXCEPTION 'Choose an uploaded agreement; in-app signatures retain their original status'; END IF;
  UPDATE rentals SET version=version+1 WHERE id=r.id;
 ELSIF operation='allocate_payment' THEN
  SELECT x INTO tx FROM xero_customer_history h JOIN xero_customer_links l USING(tenant_id,contact_id),LATERAL jsonb_array_elements(h.transactions) x
   WHERE h.tenant_id=(payload->>'tenantId')::uuid AND l.customer_id=(payload->>'customerId')::uuid
    AND x->>'id'=payload->>'sourceId' AND x->>'status'='AUTHORISED' LIMIT 1;
  IF tx IS NULL OR tx->>'type' NOT IN('RECEIVE','SPEND') THEN RAISE EXCEPTION 'Authorized source payment not found for this customer'; END IF;
  rid:=nullif(payload->>'rentalId','')::uuid;
  INSERT INTO rental_payment_allocations(tenant_id,source_id,customer_id,rental_id,sale_id,placement_id,category,amount_cents,
    service_from,service_until,source_amount_cents,source_kind,currency,note)
  VALUES((payload->>'tenantId')::uuid,payload->>'sourceId',(payload->>'customerId')::uuid,rid,
    nullif(payload->>'saleId','')::uuid,nullif(payload->>'placementId','')::uuid,payload->>'category',(payload->>'amountCents')::bigint,
    nullif(payload->>'serviceFrom','')::date,nullif(payload->>'serviceUntil','')::date,abs(round((tx->>'amount')::numeric*100))::bigint,
    CASE WHEN tx->>'type'='RECEIVE' THEN 'receipt' ELSE 'payment_out' END,tx->>'currency',payload->>'notes') RETURNING id INTO id_value;
 ELSIF operation='void_allocation' THEN
  IF nullif(btrim(payload->>'reason'),'') IS NULL THEN RAISE EXCEPTION 'Correction reason required'; END IF;
  UPDATE rental_payment_allocations SET voided_at=now(),void_reason=payload->>'reason'
  WHERE id=(payload->>'allocationId')::uuid AND voided_at IS NULL RETURNING id,rental_id INTO id_value,rid;
  IF id_value IS NULL THEN RAISE EXCEPTION 'Active allocation not found'; END IF;
 ELSIF operation='asset_status' THEN
  target:=(payload->>'assetId')::uuid;day:=(payload->>'date')::date;
  SELECT * INTO a FROM sauna_inventory WHERE id=target FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Sauna not found'; END IF;
  IF day IS NULL OR day>(now() AT TIME ZONE 'America/Los_Angeles')::date OR nullif(btrim(payload->>'reason'),'') IS NULL THEN RAISE EXCEPTION 'Confirmed date and reason required'; END IF;
  IF a.current_customer_id IS NOT NULL OR a.future_customer_id IS NOT NULL OR a.status='Sold' OR a.retired_on IS NOT NULL THEN RAISE EXCEPTION 'Resolve customer assignments first; sold or retired units cannot return to availability'; END IF;
  IF EXISTS(SELECT 1 FROM rental_placements WHERE asset_id=a.id AND removed_on>day) THEN RAISE EXCEPTION 'Status date cannot precede the last confirmed return'; END IF;
  IF payload->>'status' NOT IN('Available','Maintenance','Retired') THEN RAISE EXCEPTION 'Choose Available, Maintenance or Retired'; END IF;
  UPDATE sauna_inventory SET status=CASE WHEN payload->>'status'='Retired' THEN 'Maintenance' ELSE payload->>'status' END,
    retired_on=CASE WHEN payload->>'status'='Retired' THEN day ELSE NULL END,available_date=NULL WHERE id=target;
 ELSIF operation='manual_reservation' THEN
  SELECT * INTO c FROM customer_profiles WHERE id=(payload->>'customerId')::uuid AND archived_at IS NULL FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Choose an active customer'; END IF;
  IF nullif(payload->>'sourceKey','') IS NULL THEN RAISE EXCEPTION 'A unique source key is required'; END IF;
  IF nullif(payload->>'existingReservationId','') IS NOT NULL THEN
   SELECT r0.id INTO res_id FROM reservations r0 JOIN reservation_customer_links l ON l.reservation_id=r0.id WHERE r0.id=(payload->>'existingReservationId')::uuid AND l.customer_id=c.id FOR UPDATE OF r0;
   IF res_id IS NULL THEN RAISE EXCEPTION 'Existing reservation is not linked to this customer'; END IF;
  ELSE
  PERFORM set_config('sf_lifecycle.customer_id',c.id::text,true);
  PERFORM set_config('sf_migration.restoring','on',true);
  INSERT INTO reservations(id,first_name,last_name,email,phone,install_address,sauna_type_id,preferred_install_at,
    reservation_status,payment_status,reservation_source,booking_kind,booked_on,historical_key,min_commitment_months,admin_notes)
  VALUES(coalesce(nullif(payload->>'reservationId','')::uuid,gen_random_uuid()),coalesce(nullif(payload->>'renterName',''),c.display_name,'Customer'),'',coalesce(nullif(payload->>'email',''),c.email),coalesce(nullif(payload->>'phone',''),c.phone),nullif(payload->>'address',''),nullif(payload->>'saunaTypeId',''),
    nullif(payload->>'scheduledInstall','')::timestamptz,CASE WHEN coalesce((payload->>'historical')::boolean,true) THEN 'Historical' ELSE 'Manual' END,'Unknown',
    CASE WHEN coalesce((payload->>'historical')::boolean,true) THEN 'Manual — historical' ELSE 'Manual' END,
    CASE WHEN coalesce((payload->>'historical')::boolean,true) THEN 'manual_historical' ELSE 'manual' END,
    nullif(payload->>'bookedOn','')::date,payload->>'sourceKey',nullif(payload->>'minimumMonths','')::integer,payload->>'notes') RETURNING id INTO res_id;
  END IF;
  INSERT INTO rentals(id,customer_id,originating_reservation_id,service_address,notes,history_key)
  VALUES(coalesce(nullif(payload->>'rentalId','')::uuid,gen_random_uuid()),c.id,res_id,nullif(payload->>'address',''),payload->>'notes',payload->>'sourceKey') RETURNING id INTO rid;
 ELSIF operation IN('install','return','swap','terms','settlement','end_rental','cancel_rental') THEN
  SELECT * INTO r FROM rentals WHERE id=(payload->>'rentalId')::uuid FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Rental not found'; END IF;
  IF (payload->>'version')::integer IS DISTINCT FROM r.version THEN RAISE EXCEPTION 'Rental changed. Refresh before saving.' USING ERRCODE='40001'; END IF;
  rid:=r.id; day:=nullif(payload->>'date','')::date;
  IF operation IN('install','return','swap','end_rental','settlement','cancel_rental') AND day IS NULL THEN RAISE EXCEPTION 'Confirmed date required'; END IF;
  IF day>(now() AT TIME ZONE 'America/Los_Angeles')::date THEN RAISE EXCEPTION 'Actual events cannot be in the future'; END IF;
  IF operation IN('install','swap') AND r.lifecycle_state IN('ended','canceled') THEN RAISE EXCEPTION 'Start a new rental after an ended rental'; END IF;
  IF operation IN('install','swap') THEN
   target:=(payload->>'assetId')::uuid;
   -- Serialize all placement changes, including opposing swaps, before asset locks.
   PERFORM pg_advisory_xact_lock(73417722);
   SELECT * INTO a FROM sauna_inventory WHERE id=target FOR UPDATE;
   IF NOT FOUND OR a.retired_on IS NOT NULL OR a.status IN('Sold','Pre-sold','Maintenance','Incoming') OR EXISTS(SELECT 1 FROM sauna_sales WHERE asset_id=target) THEN RAISE EXCEPTION 'Choose an available, serviceable sauna'; END IF;
   IF a.current_customer_id IS NOT NULL AND a.current_customer_id IS DISTINCT FROM r.originating_reservation_id THEN RAISE EXCEPTION 'Sauna already has a customer. Confirm its return first.'; END IF;
   IF a.future_customer_id IS NOT NULL AND a.future_customer_id IS DISTINCT FROM r.originating_reservation_id THEN RAISE EXCEPTION 'Sauna is reserved for another booking'; END IF;
   IF r.originating_reservation_id IS NULL THEN RAISE EXCEPTION 'Link a reservation before confirming installation'; END IF;
   IF nullif(payload->>'evidence','') IS NULL THEN RAISE EXCEPTION 'Installation evidence or confirmation note required'; END IF;
  END IF;
  IF operation IN('return','swap') THEN
   PERFORM pg_advisory_xact_lock(73417722);
   SELECT * INTO p FROM rental_placements WHERE id=(payload->>'placementId')::uuid AND rental_id=r.id AND removed_on IS NULL FOR UPDATE;
   IF NOT FOUND THEN RAISE EXCEPTION 'Open placement not found'; END IF;
   IF operation='swap' AND p.asset_id=target THEN RAISE EXCEPTION 'Choose a different sauna for the swap'; END IF;
   SELECT minimum_term_ends INTO commitment_end FROM sauna_inventory WHERE id=p.asset_id;
   UPDATE rental_placements SET removed_on=day WHERE id=p.id;
   UPDATE sauna_inventory SET current_customer_id=NULL,current_customer=NULL,install_date=NULL,minimum_term_ends=NULL,
     status=CASE WHEN future_customer_id IS NULL THEN 'Maintenance' ELSE 'Transfer Planned' END WHERE id=p.asset_id;
  END IF;
  IF operation IN('install','swap') THEN
   -- Activate one unambiguous planned agreement only on the first actual install.
   IF r.actual_start IS NULL AND (SELECT count(*) FROM rental_terms WHERE rental_id=r.id AND state IN('effective','planned'))=1 THEN
    UPDATE rental_terms SET state='effective',effective_from=day,commitment_start=coalesce(commitment_start,day) WHERE rental_id=r.id AND state='planned';
   END IF;
   IF operation='install' THEN
    SELECT (commitment_start+make_interval(months=>minimum_months))::date INTO commitment_end FROM rental_terms WHERE rental_id=r.id AND state='effective' AND effective_from<=day AND (effective_until IS NULL OR effective_until>day) ORDER BY effective_from DESC LIMIT 1;
    IF a.current_customer_id=r.originating_reservation_id THEN commitment_end:=coalesce(commitment_end,a.minimum_term_ends); END IF;
   END IF;
   INSERT INTO rental_placements(rental_id,asset_id,installed_on,address,type_at_install,evidence)
   SELECT r.id,a.id,day,coalesce(nullif(payload->>'address',''),r.service_address),st.name,payload->>'evidence' FROM sauna_types st WHERE st.id=a.sauna_type_id RETURNING id INTO id_value;
   IF id_value IS NULL THEN RAISE EXCEPTION 'Sauna type missing'; END IF;
   UPDATE sauna_inventory SET current_customer_id=r.originating_reservation_id,current_customer=(SELECT display_name FROM customer_profiles WHERE id=r.customer_id),
     future_customer_id=CASE WHEN future_customer_id=r.originating_reservation_id THEN NULL ELSE future_customer_id END,
     future_customer=CASE WHEN future_customer_id=r.originating_reservation_id THEN NULL ELSE future_customer END,
     status='Installed',install_date=day,minimum_term_ends=commitment_end WHERE id=a.id;
   UPDATE reservations SET installation_status='Complete',reservation_status=CASE WHEN booking_kind='manual_historical' THEN reservation_status ELSE 'Reservation Confirmed' END WHERE id=r.originating_reservation_id;
   UPDATE rentals SET lifecycle_state='active',actual_start_source=CASE WHEN actual_start IS NULL OR day<actual_start THEN payload->>'evidence' ELSE actual_start_source END,actual_start_evidence=CASE WHEN actual_start IS NULL OR day<actual_start THEN jsonb_build_object('operation',operation,'placementId',id_value) ELSE actual_start_evidence END,actual_start=CASE WHEN actual_start IS NULL OR day<actual_start THEN day ELSE actual_start END WHERE id=r.id;
  ELSIF operation='terms' THEN
   IF r.lifecycle_state IN('ended','canceled') THEN RAISE EXCEPTION 'Cannot add new terms to a closed rental'; END IF;
   IF nullif(payload->>'source','') IS NULL THEN RAISE EXCEPTION 'Terms source required'; END IF;
   IF nullif(payload->>'minimumMonths','') IS NULL OR nullif(payload->>'monthlyCents','') IS NULL THEN RAISE EXCEPTION 'Minimum months and monthly rent required'; END IF;
   IF nullif(payload->>'effectiveFrom','') IS NOT NULL THEN
    UPDATE rental_terms SET effective_until=(payload->>'effectiveFrom')::date WHERE rental_id=r.id AND state='effective' AND effective_until IS NULL;
   END IF;
   INSERT INTO rental_terms(rental_id,agreement_id,state,effective_from,minimum_months,commitment_start,base_monthly_cents,extras,currency,sauna_type,source,note)
   VALUES(r.id,nullif(payload->>'agreementId','')::uuid,CASE WHEN nullif(payload->>'effectiveFrom','') IS NULL THEN 'planned' ELSE 'effective' END,
    nullif(payload->>'effectiveFrom','')::date,(payload->>'minimumMonths')::integer,nullif(payload->>'commitmentStart','')::date,
    (payload->>'monthlyCents')::bigint,coalesce(payload->'extras','[]'),coalesce(payload->>'currency','USD'),payload->>'saunaType',payload->>'source',payload->>'notes') RETURNING id INTO id_value;
  ELSIF operation='settlement' THEN
   IF EXISTS(SELECT 1 FROM rental_settlements s WHERE s.rental_id=r.id AND NOT EXISTS(SELECT 1 FROM rental_settlements n WHERE n.supersedes_id=s.id)
    AND s.id IS DISTINCT FROM nullif(payload->>'supersedesId','')::uuid) THEN RAISE EXCEPTION 'Choose the current settlement to replace; previous settlements remain in history'; END IF;
   INSERT INTO rental_settlements(rental_id,settled_on,kind,amount_cents,reason,supersedes_id)
   VALUES(r.id,day,payload->>'kind',(payload->>'amountCents')::bigint,payload->>'reason',nullif(payload->>'supersedesId','')::uuid) RETURNING id INTO id_value;
   IF nullif(payload->>'supersedesId','') IS NOT NULL AND NOT EXISTS(SELECT 1 FROM rental_settlements WHERE id=(payload->>'supersedesId')::uuid AND rental_id=r.id) THEN RAISE EXCEPTION 'Previous settlement belongs to another rental'; END IF;
  ELSIF operation='end_rental' THEN
   IF EXISTS(SELECT 1 FROM rental_placements WHERE rental_id=r.id AND removed_on IS NULL) OR EXISTS(SELECT 1 FROM sauna_inventory WHERE current_customer_id=r.originating_reservation_id) THEN RAISE EXCEPTION 'Record all sauna returns or sales before ending this rental'; END IF;
   IF r.lifecycle_state='canceled' THEN RAISE EXCEPTION 'Canceled rental cannot be ended'; END IF;
   IF EXISTS(SELECT 1 FROM rental_placements WHERE rental_id=r.id AND removed_on>day) THEN RAISE EXCEPTION 'Rental end cannot precede a sauna return'; END IF;
   UPDATE rentals SET lifecycle_state='ended',actual_end=day WHERE id=r.id;
  ELSIF operation='cancel_rental' THEN
   IF r.lifecycle_state NOT IN('planned','unconfirmed') OR r.actual_start IS NOT NULL OR EXISTS(SELECT 1 FROM rental_placements WHERE rental_id=r.id) OR EXISTS(SELECT 1 FROM sauna_inventory WHERE current_customer_id=r.originating_reservation_id) THEN RAISE EXCEPTION 'Installed rentals require return and settlement, not pre-install cancellation'; END IF;
   IF nullif(btrim(payload->>'reason'),'') IS NULL THEN RAISE EXCEPTION 'Cancellation reason required'; END IF;
   IF EXISTS(SELECT 1 FROM rental_agreements WHERE rental_id=r.id AND signing_state='signed') AND NOT EXISTS(SELECT 1 FROM rental_settlements WHERE rental_id=r.id) THEN RAISE EXCEPTION 'Record the agreed settlement or waiver before canceling a signed rental'; END IF;
   UPDATE sauna_inventory SET future_customer_id=NULL,future_customer=NULL,status=CASE WHEN current_customer_id IS NULL THEN 'Available' ELSE status END WHERE future_customer_id=r.originating_reservation_id;
   UPDATE rentals SET lifecycle_state='canceled' WHERE id=r.id;
  END IF;
  UPDATE rentals SET version=version+1 WHERE id=r.id;
 ELSIF operation='sale' THEN
  day:=(payload->>'date')::date; target:=(payload->>'assetId')::uuid;
  IF day IS NULL OR day>(now() AT TIME ZONE 'America/Los_Angeles')::date THEN RAISE EXCEPTION 'Confirmed sale date required'; END IF;
  PERFORM pg_advisory_xact_lock(73417722);
  SELECT * INTO a FROM sauna_inventory WHERE id=target FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Sauna not found'; END IF;
  IF a.status='Sold' OR a.retired_on IS NOT NULL OR EXISTS(SELECT 1 FROM sauna_sales WHERE asset_id=target) THEN RAISE EXCEPTION 'Sauna already sold or retired'; END IF;
  SELECT * INTO c FROM customer_profiles WHERE id=(payload->>'customerId')::uuid AND archived_at IS NULL FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Choose an active customer'; END IF;
  IF a.future_customer_id IS NOT NULL THEN RAISE EXCEPTION 'Resolve the future reservation before selling this sauna'; END IF;
  SELECT * INTO p FROM rental_placements WHERE asset_id=a.id AND removed_on IS NULL FOR UPDATE;
  IF FOUND THEN
   SELECT * INTO r FROM rentals WHERE id=p.rental_id FOR UPDATE;
   IF r.customer_id<>c.id THEN RAISE EXCEPTION 'Return the sauna before selling it to another customer'; END IF;
   IF (payload->>'version')::integer IS DISTINCT FROM r.version THEN RAISE EXCEPTION 'Rental changed. Refresh before saving.' USING ERRCODE='40001'; END IF;
   UPDATE rental_placements SET removed_on=day WHERE id=p.id;rid:=r.id;
  ELSIF a.current_customer_id IS NOT NULL THEN RAISE EXCEPTION 'Confirm current placement history before selling an installed sauna';
  END IF;
  IF EXISTS(SELECT 1 FROM rental_placements WHERE asset_id=a.id AND removed_on>day) THEN RAISE EXCEPTION 'Sale date cannot precede an earlier placement return'; END IF;
  INSERT INTO sauna_sales(asset_id,customer_id,rental_id,sold_on,agreed_cents,currency,source_reference,note)
   VALUES(a.id,c.id,rid,day,nullif(payload->>'amountCents','')::bigint,coalesce(payload->>'currency','USD'),payload->>'reference',payload->>'notes') RETURNING id INTO id_value;
  UPDATE sauna_inventory SET status='Sold',current_customer_id=NULL,current_customer=NULL,install_date=NULL,minimum_term_ends=NULL WHERE id=a.id;
  IF rid IS NOT NULL THEN
   IF EXISTS(SELECT 1 FROM rental_placements WHERE rental_id=rid AND removed_on>day) THEN RAISE EXCEPTION 'Sale cannot end the rental before another recorded return'; END IF;
   IF NOT EXISTS(SELECT 1 FROM rental_placements WHERE rental_id=rid AND removed_on IS NULL) THEN UPDATE rentals SET lifecycle_state='ended',actual_end=day WHERE id=rid; END IF;
   UPDATE rentals SET version=version+1 WHERE id=rid;
  END IF;
 ELSE RAISE EXCEPTION 'Unsupported lifecycle operation';
 END IF;
 result:=jsonb_build_object('rentalId',rid,'reservationId',res_id,'recordId',id_value);
 INSERT INTO rental_history_events(rental_id,asset_id,event_type,occurred_on,detail)
 SELECT rid,CASE WHEN operation IN('install','swap','sale','asset_status') THEN target ELSE NULL END,operation,day,payload
 WHERE rid IS NOT NULL OR target IS NOT NULL;
 INSERT INTO rental_lifecycle_commands(id,command,request,result) VALUES(command_id,operation,payload,result);
 RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.rental_lifecycle_command(uuid,text,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.rental_lifecycle_command(uuid,text,jsonb) TO service_role;

CREATE FUNCTION public.protect_signed_rental_terms() RETURNS trigger
LANGUAGE plpgsql SET search_path=public,pg_temp AS $$ BEGIN
 IF OLD.signed_at IS NOT NULL AND
  (to_jsonb(NEW)-ARRAY['status','voided_at','void_reason','updated_at']) IS DISTINCT FROM
  (to_jsonb(OLD)-ARRAY['status','voided_at','void_reason','updated_at'])
 THEN RAISE EXCEPTION 'Signed agreement contents are preserved. Create a new agreement or dated term adjustment.'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER protect_signed_rental_terms BEFORE UPDATE ON public.contracts FOR EACH ROW EXECUTE FUNCTION public.protect_signed_rental_terms();

CREATE FUNCTION public.sync_signed_rental_agreement(p_contract uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE c contracts%ROWTYPE; rid uuid; aid uuid;
BEGIN
 SELECT * INTO c FROM contracts WHERE id=p_contract;
 IF c.signed_at IS NULL THEN RETURN; END IF;
 INSERT INTO rentals(customer_id,originating_reservation_id,service_address,origin,lifecycle_state)
 SELECT l.customer_id,r.id,r.install_address,'admin','planned' FROM reservations r JOIN reservation_customer_links l ON l.reservation_id=r.id WHERE r.id=c.reservation_id
 ON CONFLICT(originating_reservation_id) DO NOTHING;
 SELECT id INTO rid FROM rentals WHERE originating_reservation_id=c.reservation_id;
 IF rid IS NULL THEN RAISE EXCEPTION 'Signed contract reservation has no customer link'; END IF;
 INSERT INTO rental_agreements(rental_id,contract_id,label,agreement_date,signed_on,signing_state,source_terms)
 VALUES(rid,c.id,'In-app signed agreement',(c.created_at AT TIME ZONE 'America/Los_Angeles')::date,
 (c.signed_at AT TIME ZONE 'America/Los_Angeles')::date,CASE WHEN c.voided_at IS NULL THEN 'signed' ELSE 'voided' END,
 jsonb_build_object('monthlyPrice',c.monthly_price,'minimumMonths',c.commitment_months,'saunaType',c.sauna_type,'placement',c.placement,'replacesContractId',c.replaces_contract_id))
 ON CONFLICT(contract_id) DO UPDATE SET signing_state=EXCLUDED.signing_state RETURNING id INTO aid;
 IF NOT EXISTS(SELECT 1 FROM rental_terms WHERE agreement_id=aid) THEN
  INSERT INTO rental_terms(rental_id,agreement_id,state,minimum_months,base_monthly_cents,extras,sauna_type,source)
  VALUES(rid,aid,CASE WHEN c.voided_at IS NULL THEN 'planned' ELSE 'superseded' END,c.commitment_months,c.monthly_price::bigint*100,
   (CASE WHEN c.insurance_selected THEN jsonb_build_array(jsonb_build_object('name','Insurance','amountCents',c.insurance_monthly_price::bigint*100)) ELSE '[]'::jsonb END)||
   (CASE WHEN c.second_heater_selected THEN jsonb_build_array(jsonb_build_object('name','Second heater','amountCents',c.second_heater_monthly_price::bigint*100)) ELSE '[]'::jsonb END),
   coalesce((SELECT name FROM sauna_types WHERE id=c.rental_summary_snapshot->>'sauna_type_id'),
    initcap(c.placement)||' '||CASE WHEN c.sauna_type ILIKE '%infrared%' THEN 'Infrared' WHEN c.sauna_type ILIKE '%original%' THEN 'Traditional (Original Collection)' ELSE 'Traditional' END),'Signed in-app agreement');
 END IF;
 IF c.voided_at IS NOT NULL THEN UPDATE rental_terms SET state='superseded' WHERE agreement_id=aid; END IF;
END $$;
CREATE FUNCTION public.capture_signed_rental_agreement() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN PERFORM public.sync_signed_rental_agreement(NEW.id); RETURN NEW; END $$;
CREATE TRIGGER capture_signed_rental_agreement AFTER INSERT OR UPDATE OF signed_at,voided_at ON public.contracts
FOR EACH ROW EXECUTE FUNCTION public.capture_signed_rental_agreement();
REVOKE ALL ON FUNCTION public.sync_signed_rental_agreement(uuid),public.capture_signed_rental_agreement() FROM PUBLIC,anon,authenticated,service_role;
DO $$ DECLARE c record; BEGIN FOR c IN SELECT id FROM contracts WHERE signed_at IS NOT NULL LOOP PERFORM public.sync_signed_rental_agreement(c.id); END LOOP; END $$;

-- Restrict deletion before touching inventory: a rejected delete cannot clear assignments.
CREATE FUNCTION public.delete_unstarted_reservation(p_id uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 PERFORM pg_advisory_xact_lock(73417722);
 PERFORM 1 FROM reservations WHERE id=p_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Reservation not found'; END IF;
 IF EXISTS(SELECT 1 FROM rentals r WHERE r.originating_reservation_id=p_id AND
   (r.lifecycle_state NOT IN('unconfirmed','planned','canceled') OR EXISTS(SELECT 1 FROM rental_agreements WHERE rental_id=r.id) OR EXISTS(SELECT 1 FROM rental_placements WHERE rental_id=r.id) OR EXISTS(SELECT 1 FROM rental_terms WHERE rental_id=r.id) OR EXISTS(SELECT 1 FROM rental_settlements WHERE rental_id=r.id) OR EXISTS(SELECT 1 FROM rental_history_events WHERE rental_id=r.id) OR EXISTS(SELECT 1 FROM rental_payment_allocations WHERE rental_id=r.id) OR EXISTS(SELECT 1 FROM sauna_sales WHERE rental_id=r.id)))
 OR EXISTS(SELECT 1 FROM contracts WHERE reservation_id=p_id)
 OR EXISTS(SELECT 1 FROM reservations WHERE id=p_id AND (payment_status='Paid' OR booking_kind='manual_historical'))
 OR EXISTS(SELECT 1 FROM sauna_inventory WHERE current_customer_id=p_id)
 THEN RAISE EXCEPTION 'This reservation has business history. Preserve it and record cancellation or settlement instead.'; END IF;
 PERFORM set_config('sf_lifecycle.command','on',true);
 UPDATE sauna_inventory SET future_customer_id=NULL,future_customer=NULL WHERE future_customer_id=p_id;
 DELETE FROM rentals WHERE originating_reservation_id=p_id;
 DELETE FROM reservation_events WHERE reservation_id=p_id;
 DELETE FROM reservations WHERE id=p_id;
END $$;
REVOKE ALL ON FUNCTION public.delete_unstarted_reservation(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.delete_unstarted_reservation(uuid) TO service_role;

CREATE FUNCTION public.guard_historical_booking_workflows() RETURNS trigger
LANGUAGE plpgsql SET search_path=public,pg_temp AS $$ BEGIN
 IF OLD.booking_kind='manual_historical' AND current_setting('sf_lifecycle.command',true) IS DISTINCT FROM 'on' AND
  (to_jsonb(NEW)-ARRAY['updated_at','admin_notes']) IS DISTINCT FROM (to_jsonb(OLD)-ARRAY['updated_at','admin_notes'])
 THEN RAISE EXCEPTION 'Historical reservations use the rental history workflow; booking automation is disabled'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER guard_historical_booking_workflows BEFORE UPDATE ON public.reservations FOR EACH ROW EXECUTE FUNCTION public.guard_historical_booking_workflows();

CREATE FUNCTION public.record_inventory_metadata_history() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$ BEGIN
 IF ROW(NEW.unit_code,NEW.model,NEW.sauna_type_id) IS DISTINCT FROM ROW(OLD.unit_code,OLD.model,OLD.sauna_type_id) THEN
 INSERT INTO rental_history_events(asset_id,event_type,detail) VALUES(NEW.id,'inventory_metadata_changed',jsonb_build_object('before',jsonb_build_object('code',OLD.unit_code,'model',OLD.model,'type',OLD.sauna_type_id),'after',jsonb_build_object('code',NEW.unit_code,'model',NEW.model,'type',NEW.sauna_type_id),'note','Recorded change; historical effective date not asserted'));
 END IF; RETURN NEW;
END $$;
CREATE TRIGGER record_inventory_metadata_history AFTER UPDATE OF unit_code,model,sauna_type_id ON public.sauna_inventory FOR EACH ROW EXECUTE FUNCTION public.record_inventory_metadata_history();
NOTIFY pgrst,'reload schema';
COMMIT;
