-- 1. customers table
CREATE TABLE public.customers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  first_name text,
  last_name text,
  email text,
  phone text,
  install_address text,
  city text,
  notes text,
  reservation_id uuid REFERENCES public.reservations(id) ON DELETE SET NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT ALL ON public.customers TO service_role;
-- No anon or authenticated grants: customers are only touched through
-- service-role edge functions (admin-api, reservation-create, etc.).

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
-- Intentionally no policies: table is fully locked down to client roles.

CREATE INDEX customers_name_idx ON public.customers (lower(name));
CREATE INDEX customers_email_idx ON public.customers (lower(email)) WHERE email IS NOT NULL;

CREATE TRIGGER customers_set_updated_at
BEFORE UPDATE ON public.customers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. inventory FK columns
ALTER TABLE public.sauna_inventory
  ADD COLUMN current_customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  ADD COLUMN future_customer_id  uuid REFERENCES public.customers(id) ON DELETE SET NULL;

-- Only one sauna per customer (per column).
CREATE UNIQUE INDEX sauna_inventory_current_customer_unique
  ON public.sauna_inventory (current_customer_id)
  WHERE current_customer_id IS NOT NULL;
CREATE UNIQUE INDEX sauna_inventory_future_customer_unique
  ON public.sauna_inventory (future_customer_id)
  WHERE future_customer_id IS NOT NULL;

-- Prevent the same customer from being current on one row and future on another.
CREATE OR REPLACE FUNCTION public.sauna_inventory_customer_single_assignment()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.current_customer_id IS NOT NULL
     AND NEW.current_customer_id = NEW.future_customer_id THEN
    RAISE EXCEPTION 'Same customer cannot be both current and future on the same sauna';
  END IF;

  IF NEW.current_customer_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.sauna_inventory
    WHERE id <> NEW.id
      AND (current_customer_id = NEW.current_customer_id
           OR future_customer_id = NEW.current_customer_id)
  ) THEN
    RAISE EXCEPTION 'Customer is already assigned to another sauna';
  END IF;

  IF NEW.future_customer_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.sauna_inventory
    WHERE id <> NEW.id
      AND (current_customer_id = NEW.future_customer_id
           OR future_customer_id = NEW.future_customer_id)
  ) THEN
    RAISE EXCEPTION 'Customer is already assigned to another sauna';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER sauna_inventory_customer_single_assignment_trg
BEFORE INSERT OR UPDATE OF current_customer_id, future_customer_id
ON public.sauna_inventory
FOR EACH ROW EXECUTE FUNCTION public.sauna_inventory_customer_single_assignment();

-- 3. Backfill: create a customer row for every existing current/future text name.
WITH current_names AS (
  SELECT id AS inv_id, btrim(current_customer) AS name
  FROM public.sauna_inventory
  WHERE current_customer IS NOT NULL AND btrim(current_customer) <> ''
),
inserted AS (
  INSERT INTO public.customers (name)
  SELECT name FROM current_names
  RETURNING id, name
)
UPDATE public.sauna_inventory si
SET current_customer_id = ins.id
FROM inserted ins, current_names cn
WHERE si.id = cn.inv_id AND ins.name = cn.name;

WITH future_names AS (
  SELECT id AS inv_id, btrim(future_customer) AS name
  FROM public.sauna_inventory
  WHERE future_customer IS NOT NULL AND btrim(future_customer) <> ''
),
inserted AS (
  INSERT INTO public.customers (name)
  SELECT name FROM future_names
  RETURNING id, name
)
UPDATE public.sauna_inventory si
SET future_customer_id = ins.id
FROM inserted ins, future_names fn
WHERE si.id = fn.inv_id AND ins.name = fn.name;