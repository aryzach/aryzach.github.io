
CREATE OR REPLACE FUNCTION public.sync_reservation_status_from_inventory()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.current_customer_id IS NOT NULL
     AND NEW.status IN ('Reservation Hold', 'Reservation Confirmed') THEN
    UPDATE public.reservations
    SET reservation_status = NEW.status
    WHERE id = NEW.current_customer_id
      AND reservation_status IS DISTINCT FROM NEW.status;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_reservation_status ON public.sauna_inventory;
CREATE TRIGGER trg_sync_reservation_status
AFTER INSERT OR UPDATE OF status, current_customer_id
ON public.sauna_inventory
FOR EACH ROW
EXECUTE FUNCTION public.sync_reservation_status_from_inventory();

-- Backfill
UPDATE public.reservations r
SET reservation_status = s.status
FROM public.sauna_inventory s
WHERE s.current_customer_id = r.id
  AND s.status IN ('Reservation Hold', 'Reservation Confirmed')
  AND r.reservation_status IS DISTINCT FROM s.status;
