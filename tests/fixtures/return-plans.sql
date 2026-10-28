BEGIN;
SET LOCAL sf_lifecycle.command='on';
DO $$
DECLARE c uuid:=gen_random_uuid(); b jsonb; rid uuid; aid uuid:=gen_random_uuid(); pid uuid; typ text:='test-return-plan'; day date:=(now() AT TIME ZONE 'America/Los_Angeles')::date; p jsonb; cmd uuid:=gen_random_uuid(); out1 jsonb; rejected boolean; old_rental jsonb; old_placement jsonb; old_inventory jsonb; notices integer; future_b jsonb;
BEGIN
 INSERT INTO sauna_types(id,name,description,placement,reservation_fee_cents,stripe_payment_link,location,style,model_key) VALUES(typ,'Test return plan','Test only','indoor',0,'https://example.invalid','indoor','infrared','standard');
 INSERT INTO customer_profiles(id,display_name) VALUES(c,'Test return plan');
 b:=rental_lifecycle_command(gen_random_uuid(),'manual_reservation',jsonb_build_object('customerId',c,'sourceKey','return-plan-'||c));rid:=(b->>'rentalId')::uuid;
 INSERT INTO sauna_inventory(id,unit_code,sauna_type_id,status,condition_state,locations,style,model_key) VALUES(aid,'TEST-RETURN',typ,'Available','ready',ARRAY['indoor'],'infrared','standard');
 PERFORM rental_lifecycle_command(gen_random_uuid(),'install',jsonb_build_object('rentalId',rid,'version',(SELECT version FROM rentals WHERE id=rid),'assetId',aid,'date',day-30,'evidence','Test installation'));
 SELECT id INTO pid FROM rental_placements WHERE asset_id=aid AND removed_on IS NULL;
 SELECT to_jsonb(r) INTO old_rental FROM rentals r WHERE id=rid;
 SELECT to_jsonb(placement) INTO old_placement FROM rental_placements placement WHERE id=pid;
 SELECT to_jsonb(i)-'planned_pickup_on'-'available_date'-'return_plan_version'-'updated_at' INTO old_inventory FROM sauna_inventory i WHERE id=aid;
 SELECT count(*) INTO notices FROM reservation_notification_intents;
 p:=jsonb_build_object('assetId',aid,'planReturn',true,'currentCustomerId',b->>'reservationId','returnPlanVersion',(SELECT return_plan_version FROM sauna_inventory WHERE id=aid),'plannedPickupOn',day+14,'availableOn',day+15,'reason','Customer confirmed planned pickup');
 out1:=rental_lifecycle_command(cmd,'asset_status',p);
 IF rental_lifecycle_command(cmd,'asset_status',p)<>out1 THEN RAISE EXCEPTION 'Retry is not idempotent';END IF;
 IF (SELECT to_jsonb(r) FROM rentals r WHERE id=rid)<>old_rental OR (SELECT to_jsonb(x) FROM rental_placements x WHERE id=pid)<>old_placement OR (SELECT to_jsonb(i)-'planned_pickup_on'-'available_date'-'return_plan_version'-'updated_at' FROM sauna_inventory i WHERE id=aid)<>old_inventory THEN RAISE EXCEPTION 'Plan changed rental, commitment or custody facts';END IF;
 IF (SELECT available_now FROM public_sauna_availability WHERE sauna_type_id=typ)<>0 OR (SELECT next_available_date FROM public_sauna_availability WHERE sauna_type_id=typ)<>day+15 THEN RAISE EXCEPTION 'Planned return is not represented as future-only availability';END IF;
 p:=p||jsonb_build_object('returnPlanVersion',(out1->>'returnPlanVersion')::int);
 -- Invalid and stale saves leave the successful plan untouched.
 FOR p IN SELECT value FROM jsonb_array_elements(jsonb_build_array(
 p||jsonb_build_object('plannedPickupOn',day-1),p||jsonb_build_object('availableOn',day+13),p||jsonb_build_object('currentCustomerId',gen_random_uuid()),p||jsonb_build_object('returnPlanVersion',NULL),p||jsonb_build_object('returnPlanVersion',(out1->>'returnPlanVersion')::int,'availableOn',NULL),p||jsonb_build_object('returnPlanVersion',(out1->>'returnPlanVersion')::int,'plannedPickupOn',NULL))) LOOP
  rejected:=false;BEGIN PERFORM rental_lifecycle_command(gen_random_uuid(),'asset_status',p);EXCEPTION WHEN OTHERS THEN rejected:=true;END;
  IF NOT rejected OR (SELECT available_date FROM sauna_inventory WHERE id=aid)<>day+15 THEN RAISE EXCEPTION 'Invalid plan accepted or partial update persisted';END IF;
 END LOOP;
 p:=jsonb_build_object('assetId',aid,'planReturn',true,'currentCustomerId',b->>'reservationId','returnPlanVersion',(out1->>'returnPlanVersion')::int,'plannedPickupOn',day+14,'availableOn',day+15,'reason','Test revised plan');
 rejected:=false;BEGIN PERFORM rental_lifecycle_command(gen_random_uuid(),'asset_status',p||jsonb_build_object('returnPlanVersion',0));EXCEPTION WHEN serialization_failure THEN rejected:=true;END;
 IF NOT rejected THEN RAISE EXCEPTION 'Stale return plan accepted';END IF;
 rejected:=false;BEGIN UPDATE sauna_inventory SET planned_pickup_on=day+12 WHERE id=aid;EXCEPTION WHEN OTHERS THEN rejected:=true;END;
 IF NOT rejected THEN RAISE EXCEPTION 'Direct plan update bypassed command';END IF;
 -- A future allocation is retained and removes the unit from public availability.
 future_b:=rental_lifecycle_command(gen_random_uuid(),'manual_reservation',jsonb_build_object('customerId',c,'sourceKey','future-plan-'||c));
 UPDATE sauna_inventory SET future_customer_id=(future_b->>'reservationId')::uuid WHERE id=aid;
 UPDATE reservations SET booking_state='confirmed',booking_install_on=day+16,sauna_inventory_id=aid WHERE id=(future_b->>'reservationId')::uuid;
 IF (SELECT next_available_date FROM public_sauna_availability WHERE sauna_type_id=typ) IS NOT NULL THEN RAISE EXCEPTION 'Reserved sauna advertised';END IF;
 FOR p IN SELECT value FROM jsonb_array_elements(jsonb_build_array(p||jsonb_build_object('availableOn',day+17),p||jsonb_build_object('plannedPickupOn',NULL,'availableOn',NULL))) LOOP
  rejected:=false;BEGIN PERFORM rental_lifecycle_command(gen_random_uuid(),'asset_status',p);EXCEPTION WHEN OTHERS THEN IF SQLERRM NOT LIKE 'Resolve the future booking date conflict%' THEN RAISE;END IF;rejected:=true;END;
  IF NOT rejected THEN RAISE EXCEPTION 'Future booking invalidated';END IF;
 END LOOP;
 IF NOT EXISTS(SELECT 1 FROM reservations WHERE id=(future_b->>'reservationId')::uuid AND booking_state='confirmed' AND booking_install_on=day+16) OR NOT EXISTS(SELECT 1 FROM sauna_inventory WHERE id=aid AND future_customer_id=(future_b->>'reservationId')::uuid) THEN RAISE EXCEPTION 'Booking promise changed';END IF;
 UPDATE reservations SET booking_state='cancelled' WHERE id=(future_b->>'reservationId')::uuid;
 UPDATE sauna_inventory SET future_customer_id=NULL WHERE id=aid;
 p:=jsonb_build_object('assetId',aid,'planReturn',true,'currentCustomerId',b->>'reservationId','returnPlanVersion',(out1->>'returnPlanVersion')::int,'plannedPickupOn',NULL,'availableOn',NULL,'reason','Pickup postponed without a new date');
 out1:=rental_lifecycle_command(gen_random_uuid(),'asset_status',p);
 IF NOT EXISTS(SELECT 1 FROM sauna_inventory WHERE id=aid AND planned_pickup_on IS NULL AND available_date IS NULL AND current_customer_id=(b->>'reservationId')::uuid AND status='Installed') THEN RAISE EXCEPTION 'Cancel plan changed actual custody';END IF;
 p:=p||jsonb_build_object('returnPlanVersion',(out1->>'returnPlanVersion')::int,'plannedPickupOn',day,'availableOn',day);
 PERFORM rental_lifecycle_command(gen_random_uuid(),'asset_status',p);
 IF (SELECT available_date FROM sauna_inventory WHERE id=aid)<>day OR (SELECT next_available_date FROM public_sauna_availability WHERE sauna_type_id=typ)<>day OR (SELECT available_now FROM public_sauna_availability WHERE sauna_type_id=typ)<>0 THEN RAISE EXCEPTION 'Same-day return plan not accepted as planned availability';END IF;
 PERFORM rental_lifecycle_command(gen_random_uuid(),'return',jsonb_build_object('rentalId',rid,'version',(SELECT version FROM rentals WHERE id=rid),'placementId',pid,'date',day,'evidence','Actual pickup confirmed'));
 IF NOT EXISTS(SELECT 1 FROM sauna_inventory WHERE id=aid AND planned_pickup_on IS NULL AND available_date IS NULL AND current_customer_id IS NULL AND status='Maintenance') OR NOT EXISTS(SELECT 1 FROM rental_placements WHERE id=pid AND removed_on=day) THEN RAISE EXCEPTION 'Actual return did not clear plan';END IF;
 rejected:=false;BEGIN PERFORM rental_lifecycle_command(gen_random_uuid(),'asset_status',p);EXCEPTION WHEN OTHERS THEN rejected:=true;END;
 IF NOT rejected THEN RAISE EXCEPTION 'Warehouse unit accepted return plan';END IF;
 -- After inspection, actual pickup and a different rental installation may share a day.
 PERFORM rental_lifecycle_command(gen_random_uuid(),'asset_status',jsonb_build_object('assetId',aid,'status','Available','date',day,'reason','Test inspection complete'));
 PERFORM rental_lifecycle_command(gen_random_uuid(),'install',jsonb_build_object('rentalId',future_b->>'rentalId','version',(SELECT version FROM rentals WHERE id=(future_b->>'rentalId')::uuid),'assetId',aid,'date',day,'evidence','Test same-day redeployment'));
 IF NOT EXISTS(SELECT 1 FROM rental_placements WHERE asset_id=aid AND rental_id=(future_b->>'rentalId')::uuid AND installed_on=day AND removed_on IS NULL) OR NOT EXISTS(SELECT 1 FROM rental_placements WHERE id=pid AND removed_on=day) THEN RAISE EXCEPTION 'Same-day actual redeployment failed';END IF;
 IF (SELECT count(*) FROM reservation_notification_intents)<>notices THEN RAISE EXCEPTION 'Planning sent a notification';END IF;
 IF has_function_privilege('anon','public.rental_lifecycle_command(uuid,text,jsonb)','EXECUTE') OR has_function_privilege('authenticated','public.rental_lifecycle_command(uuid,text,jsonb)','EXECUTE') OR has_function_privilege('service_role','public.rental_lifecycle_before_return_plans(uuid,text,jsonb)','EXECUTE') THEN RAISE EXCEPTION 'Private command exposed';END IF;
END $$;
ROLLBACK;
