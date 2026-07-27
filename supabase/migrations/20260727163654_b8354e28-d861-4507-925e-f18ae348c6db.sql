
-- 1. Trigger function: ensure a customers row exists for every reservation
CREATE OR REPLACE FUNCTION public.ensure_customer_for_reservation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_name text;
BEGIN
  IF EXISTS (SELECT 1 FROM public.customers WHERE reservation_id = NEW.id) THEN
    -- keep contact fields in sync on reservation update
    IF TG_OP = 'UPDATE' THEN
      v_name := btrim(coalesce(NEW.first_name,'') || ' ' || coalesce(NEW.last_name,''));
      UPDATE public.customers
      SET
        name = CASE WHEN length(v_name) > 0 THEN v_name ELSE name END,
        first_name = coalesce(NEW.first_name, first_name),
        last_name = coalesce(NEW.last_name, last_name),
        email = coalesce(NEW.email, email),
        phone = coalesce(NEW.phone, phone),
        install_address = coalesce(NEW.install_address, install_address),
        city = coalesce(NEW.city, city)
      WHERE reservation_id = NEW.id;
    END IF;
    RETURN NEW;
  END IF;

  v_name := btrim(coalesce(NEW.first_name,'') || ' ' || coalesce(NEW.last_name,''));
  IF length(v_name) = 0 THEN v_name := coalesce(NEW.email, 'Unknown'); END IF;

  INSERT INTO public.customers (
    name, first_name, last_name, email, phone,
    install_address, city, reservation_id
  ) VALUES (
    v_name,
    NULLIF(btrim(coalesce(NEW.first_name,'')), ''),
    NULLIF(btrim(coalesce(NEW.last_name,'')), ''),
    NEW.email,
    NEW.phone,
    NEW.install_address,
    NEW.city,
    NEW.id
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ensure_customer_for_reservation ON public.reservations;
CREATE TRIGGER trg_ensure_customer_for_reservation
AFTER INSERT OR UPDATE OF first_name, last_name, email, phone, install_address, city
ON public.reservations
FOR EACH ROW
EXECUTE FUNCTION public.ensure_customer_for_reservation();

-- 2. Backfill customers for existing reservations missing one
INSERT INTO public.customers (name, first_name, last_name, email, phone, install_address, city, reservation_id)
SELECT
  NULLIF(btrim(coalesce(r.first_name,'') || ' ' || coalesce(r.last_name,'')), ''),
  NULLIF(btrim(coalesce(r.first_name,'')), ''),
  NULLIF(btrim(coalesce(r.last_name,'')), ''),
  r.email, r.phone, r.install_address, r.city, r.id
FROM public.reservations r
LEFT JOIN public.customers c ON c.reservation_id = r.id
WHERE c.id IS NULL;

-- Ensure the backfilled name field is never null
UPDATE public.customers
SET name = coalesce(email, 'Unknown')
WHERE name IS NULL OR length(btrim(name)) = 0;
