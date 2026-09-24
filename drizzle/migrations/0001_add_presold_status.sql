ALTER TABLE public.sauna_inventory DROP CONSTRAINT IF EXISTS sauna_inventory_status_check;
ALTER TABLE public.sauna_inventory ADD CONSTRAINT sauna_inventory_status_check CHECK (status = ANY (ARRAY['Available','Reservation Hold','Reservation Confirmed','Installed','Returning','Maintenance','Incoming','Transfer Planned','Sold','Pre-sold']));

CREATE OR REPLACE FUNCTION public.sauna_inventory_status_reservation_compat()
 RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public'
AS $function$
DECLARE
  allowed text[] := ARRAY['Installed','Returning','Reservation Hold','Reservation Confirmed','Pending Payment','Needs Manual Review','Cancelled','Refunded','Transfer Planned','Sold','Pre-sold'];
BEGIN
  IF (NEW.current_customer_id IS NOT NULL OR NEW.future_customer_id IS NOT NULL)
     AND NOT (NEW.status = ANY(allowed)) THEN
    RAISE EXCEPTION 'Sauna tied to a reservation must have a reservation-compatible status (got %)', NEW.status;
  END IF;
  RETURN NEW;
END;
$function$;