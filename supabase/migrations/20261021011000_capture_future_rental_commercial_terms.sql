-- Only future signatures capture new payment and Premium terms. Existing records are not backfilled.
CREATE OR REPLACE FUNCTION public.sync_signed_rental_agreement(p_contract uuid) RETURNS void
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
 jsonb_build_object('monthlyPrice',c.monthly_price,'minimumMonths',c.commitment_months,'saunaType',c.sauna_type,'placement',c.placement,'replacesContractId',c.replaces_contract_id)||CASE WHEN c.rental_summary_snapshot ? 'commercial_terms' THEN jsonb_build_object('commercialTerms',c.rental_summary_snapshot->'commercial_terms') ELSE '{}'::jsonb END)
 ON CONFLICT(contract_id) DO UPDATE SET signing_state=EXCLUDED.signing_state RETURNING id INTO aid;
 IF NOT EXISTS(SELECT 1 FROM rental_terms WHERE agreement_id=aid) THEN
  INSERT INTO rental_terms(rental_id,agreement_id,state,minimum_months,base_monthly_cents,extras,sauna_type,source)
  VALUES(rid,aid,CASE WHEN c.voided_at IS NULL THEN 'planned' ELSE 'superseded' END,c.commitment_months,round(c.monthly_price*100)::bigint,
   (CASE WHEN c.insurance_selected THEN jsonb_build_array(jsonb_build_object('name','Insurance','amountCents',c.insurance_monthly_price::bigint*100)) ELSE '[]'::jsonb END)||
   (CASE WHEN c.second_heater_selected THEN jsonb_build_array(jsonb_build_object('name','Second heater','amountCents',c.second_heater_monthly_price::bigint*100)) ELSE '[]'::jsonb END)||
   (CASE WHEN c.rental_summary_snapshot->'commercial_terms'->'choices'->>'premium_selected'='true' THEN jsonb_build_array(jsonb_build_object('name','SF Sauna Premium','amountCents',(c.rental_summary_snapshot->'commercial_terms'->>'premium_monthly_cents')::bigint)) ELSE '[]'::jsonb END),
   coalesce((SELECT name FROM sauna_types WHERE id=c.rental_summary_snapshot->>'sauna_type_id'),
    initcap(c.placement)||' '||CASE WHEN c.sauna_type ILIKE '%infrared%' THEN 'Infrared' WHEN c.sauna_type ILIKE '%original%' THEN 'Traditional (Original Collection)' ELSE 'Traditional' END),'Signed in-app agreement');
 END IF;
 IF c.voided_at IS NOT NULL THEN UPDATE rental_terms SET state='superseded' WHERE agreement_id=aid; END IF;
END $$;
