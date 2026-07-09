ALTER TABLE public.sauna_inventory ADD COLUMN IF NOT EXISTS unit_code text;
CREATE UNIQUE INDEX IF NOT EXISTS sauna_inventory_unit_code_key ON public.sauna_inventory (unit_code) WHERE unit_code IS NOT NULL;
ALTER TABLE public.sauna_inventory DROP COLUMN IF EXISTS location;
ALTER TABLE public.sauna_inventory DROP COLUMN IF EXISTS condition;