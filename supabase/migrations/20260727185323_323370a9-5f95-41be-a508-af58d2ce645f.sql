-- 1) Backfill: reconcile reservations with non-standard statuses using inventory
WITH allowed AS (
  SELECT unnest(ARRAY[
    'Installed','Returning','Reservation Hold','Reservation Confirmed',
    'Pending Payment','Needs Manual Review','Cancelled','Refunded',
    'Transfer Planned','Sold'
  ]) AS s
),
bad AS (
  SELECT r.id AS reservation_id, si.status AS inv_status
  FROM public.reservations r
  LEFT JOIN public.sauna_inventory si
    ON si.current_customer_id = r.id OR si.future_customer_id = r.id
  WHERE r.reservation_status NOT IN (SELECT s FROM allowed)
)
UPDATE public.reservations r
SET reservation_status = CASE
  WHEN b.inv_status IN (
    'Installed','Returning','Reservation Hold','Reservation Confirmed',
    'Transfer Planned','Sold'
  ) THEN b.inv_status
  ELSE 'Needs Manual Review'
END
FROM bad b
WHERE r.id = b.reservation_id;

-- 2) Extend sync trigger to cover more inventory statuses
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
  RETURN NEW;
END;
$function$;