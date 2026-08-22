CREATE OR REPLACE FUNCTION public.sync_reservation_status_from_inventory()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  compatible text[] := ARRAY[
    'Installed','Returning','Reservation Hold','Reservation Confirmed',
    'Transfer Planned','Sold'
  ];
BEGIN
  IF NEW.current_customer_id IS NOT NULL
     AND NEW.status = ANY(compatible) THEN
    UPDATE public.reservations
    SET reservation_status = NEW.status
    WHERE id = NEW.current_customer_id
      AND reservation_status IS DISTINCT FROM NEW.status;
  END IF;

  -- Future customer: an assigned unit means the reservation is confirmed,
  -- even if the unit is still occupied by the current customer.
  IF NEW.future_customer_id IS NOT NULL THEN
    UPDATE public.reservations
    SET reservation_status = 'Reservation Confirmed'
    WHERE id = NEW.future_customer_id
      AND reservation_status IN ('Needs Manual Review','Pending Payment','Reservation Hold');
  END IF;

  RETURN NEW;
END;
$function$;