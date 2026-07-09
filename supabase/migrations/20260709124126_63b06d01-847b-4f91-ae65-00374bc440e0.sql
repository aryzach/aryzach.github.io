UPDATE public.sauna_inventory SET status = 'Sold' WHERE status = 'Sold / Retired';
ALTER TABLE public.sauna_inventory DROP CONSTRAINT IF EXISTS sauna_inventory_status_check;
ALTER TABLE public.sauna_inventory ADD CONSTRAINT sauna_inventory_status_check CHECK (status IN ('Available','Reservation Hold','Reservation Confirmed','Installed','Returning','Maintenance','Incoming','Sold'));