BEGIN;
-- Keep a confirmed promise and its decision history intact during later admin edits.
CREATE OR REPLACE FUNCTION public.sauna_condition_compatibility() RETURNS trigger LANGUAGE plpgsql SET search_path=public,pg_temp AS $$ BEGIN
 IF TG_OP='INSERT' THEN
  IF NEW.condition_state='unknown' AND NEW.status IN('Available','Maintenance') THEN NEW.condition_state:=CASE WHEN NEW.status='Available' THEN 'ready' ELSE 'maintenance' END;END IF;
 ELSIF NEW.condition_state IS NOT DISTINCT FROM OLD.condition_state AND NEW.status IS DISTINCT FROM OLD.status THEN
  IF NEW.status='Maintenance' THEN NEW.condition_state:=CASE WHEN OLD.current_customer_id IS NOT NULL AND NEW.current_customer_id IS NULL THEN 'inspection' ELSE 'maintenance' END;
  ELSIF NEW.status='Available' THEN NEW.condition_state:='ready';END IF;
 END IF;
 IF TG_OP='UPDATE' AND ROW(NEW.unit_code,NEW.style,NEW.model_key,NEW.locations,NEW.sauna_type_id) IS DISTINCT FROM ROW(OLD.unit_code,OLD.style,OLD.model_key,OLD.locations,OLD.sauna_type_id) AND EXISTS(SELECT 1 FROM reservations b WHERE b.sauna_inventory_id=NEW.id AND b.booking_state='confirmed') THEN RAISE EXCEPTION 'Resolve the confirmed booking before changing its numbered sauna or type';END IF;
 IF TG_OP='UPDATE' AND NEW.incoming_eta IS DISTINCT FROM OLD.incoming_eta AND NEW.status='Incoming' AND EXISTS(SELECT 1 FROM reservations b WHERE b.sauna_inventory_id=NEW.id AND b.booking_state='confirmed' AND (NEW.incoming_eta IS NULL OR NEW.incoming_eta>b.booking_install_on)) THEN RAISE EXCEPTION 'Resolve the confirmed booking before moving the incoming date past its promised date';END IF;
 IF TG_OP='UPDATE' AND NEW.available_date IS DISTINCT FROM OLD.available_date AND EXISTS(SELECT 1 FROM reservations b WHERE b.sauna_inventory_id=NEW.id AND b.booking_state='confirmed' AND b.booking_install_on IS NOT NULL AND NEW.current_customer_id IS DISTINCT FROM b.id AND NEW.current_customer_id IS NOT NULL AND (NEW.available_date IS NULL OR NEW.available_date>b.booking_install_on)) THEN RAISE EXCEPTION 'Resolve the confirmed booking before moving sauna availability past its promised date';END IF;
 RETURN NEW;
END; $$;
CREATE OR REPLACE FUNCTION public.delete_unstarted_reservation(p_id uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 PERFORM pg_advisory_xact_lock(73417722);
 PERFORM 1 FROM reservations WHERE id=p_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Reservation not found'; END IF;
 IF EXISTS(SELECT 1 FROM rentals r WHERE r.originating_reservation_id=p_id AND
   (r.lifecycle_state NOT IN('unconfirmed','planned','canceled') OR EXISTS(SELECT 1 FROM rental_agreements WHERE rental_id=r.id) OR EXISTS(SELECT 1 FROM rental_placements WHERE rental_id=r.id) OR EXISTS(SELECT 1 FROM rental_terms WHERE rental_id=r.id) OR EXISTS(SELECT 1 FROM rental_settlements WHERE rental_id=r.id) OR EXISTS(SELECT 1 FROM rental_history_events WHERE rental_id=r.id) OR EXISTS(SELECT 1 FROM rental_payment_allocations WHERE rental_id=r.id) OR EXISTS(SELECT 1 FROM sauna_sales WHERE rental_id=r.id)))
 OR EXISTS(SELECT 1 FROM reservations WHERE id=p_id AND booking_state IN('confirmed','fulfilled'))
 OR EXISTS(SELECT 1 FROM booking_commands WHERE booking_id=p_id)
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
NOTIFY pgrst,'reload schema';
COMMIT;
