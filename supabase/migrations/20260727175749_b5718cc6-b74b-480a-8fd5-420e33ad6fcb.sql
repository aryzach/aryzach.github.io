
-- 1) Migrate legacy Lead status
UPDATE public.reservations SET reservation_status = 'Pending Payment' WHERE reservation_status = 'Lead';

-- 2) Trigger to enforce compatible statuses when inventory row is tied to a reservation
CREATE OR REPLACE FUNCTION public.sauna_inventory_status_reservation_compat()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  allowed text[] := ARRAY[
    'Installed','Returning','Reservation Hold','Reservation Confirmed',
    'Pending Payment','Needs Manual Review','Cancelled','Refunded',
    'Transfer Planned','Sold'
  ];
BEGIN
  IF (NEW.current_customer_id IS NOT NULL OR NEW.future_customer_id IS NOT NULL)
     AND NOT (NEW.status = ANY(allowed)) THEN
    RAISE EXCEPTION 'Sauna tied to a reservation must have a reservation-compatible status (got %)', NEW.status;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sauna_inventory_status_reservation_compat ON public.sauna_inventory;
CREATE TRIGGER trg_sauna_inventory_status_reservation_compat
BEFORE INSERT OR UPDATE ON public.sauna_inventory
FOR EACH ROW EXECUTE FUNCTION public.sauna_inventory_status_reservation_compat();
