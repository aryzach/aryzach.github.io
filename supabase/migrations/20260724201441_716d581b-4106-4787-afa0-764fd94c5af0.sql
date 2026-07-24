ALTER TABLE public.sauna_inventory ADD COLUMN IF NOT EXISTS future_customer text;

ALTER TABLE public.sauna_inventory DROP CONSTRAINT IF EXISTS sauna_inventory_status_check;
ALTER TABLE public.sauna_inventory ADD CONSTRAINT sauna_inventory_status_check
  CHECK (status = ANY (ARRAY[
    'Available'::text,
    'Reservation Hold'::text,
    'Reservation Confirmed'::text,
    'Installed'::text,
    'Returning'::text,
    'Maintenance'::text,
    'Incoming'::text,
    'Transfer Planned'::text,
    'Sold'::text
  ]));