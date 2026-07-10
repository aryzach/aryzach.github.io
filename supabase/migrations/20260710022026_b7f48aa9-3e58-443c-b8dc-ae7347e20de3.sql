
ALTER TABLE public.sauna_inventory DROP CONSTRAINT IF EXISTS sauna_inventory_model_check;

UPDATE public.sauna_inventory
SET sauna_type_id = 'outdoor_traditional_original'
WHERE model = 'Prototype'
  AND sauna_type_id = 'outdoor_traditional_latest';

UPDATE public.sauna_inventory
SET model = 'Original Collection'
WHERE model = 'Prototype';

ALTER TABLE public.sauna_inventory
  ADD CONSTRAINT sauna_inventory_model_check
  CHECK (model IS NULL OR model IN ('Standard', 'Original Collection'));
