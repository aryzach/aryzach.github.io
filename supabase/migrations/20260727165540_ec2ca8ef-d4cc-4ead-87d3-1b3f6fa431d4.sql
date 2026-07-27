
-- Ensure the constraint trigger doesn't block the backfill/repoint
ALTER TABLE public.sauna_inventory DISABLE TRIGGER USER;

-- Drop the trigger function that auto-creates customer rows (safe if not attached)
DROP FUNCTION IF EXISTS public.ensure_customer_for_reservation() CASCADE;

-- Drop FKs to customers so we can repoint the id columns
ALTER TABLE public.sauna_inventory
  DROP CONSTRAINT IF EXISTS sauna_inventory_current_customer_id_fkey,
  DROP CONSTRAINT IF EXISTS sauna_inventory_future_customer_id_fkey;

-- 1. For every customer without a reservation_id, create one so nothing is orphaned
DO $$
DECLARE
  c RECORD;
  new_res_id uuid;
  fn text; ln text; st text; ins_at timestamptz;
BEGIN
  FOR c IN SELECT * FROM public.customers WHERE reservation_id IS NULL LOOP
    fn := COALESCE(NULLIF(btrim(c.first_name), ''), NULLIF(split_part(c.name, ' ', 1), ''), 'Unknown');
    ln := COALESCE(NULLIF(btrim(c.last_name), ''), NULLIF(btrim(substring(c.name from position(' ' in c.name)+1)), ''), '-');
    SELECT sauna_type_id, COALESCE(install_date::timestamptz, available_date::timestamptz)
      INTO st, ins_at
    FROM public.sauna_inventory
    WHERE current_customer_id = c.id OR future_customer_id = c.id
    LIMIT 1;
    st := COALESCE(st, 'traditional-indoor');
    ins_at := COALESCE(ins_at, now());

    INSERT INTO public.reservations (
      sauna_type_id, first_name, last_name, email, phone,
      install_address, city, preferred_install_at,
      reservation_status, payment_status, reservation_source, admin_notes
    ) VALUES (
      st, fn, ln,
      COALESCE(NULLIF(btrim(c.email), ''), 'backfill+' || c.id::text || '@sfsaunarental.invalid'),
      c.phone, c.install_address, c.city, ins_at,
      'Confirmed', 'Manual', 'Backfill',
      'Backfilled from customer record ' || c.id::text
    )
    RETURNING id INTO new_res_id;

    UPDATE public.customers SET reservation_id = new_res_id WHERE id = c.id;
  END LOOP;
END $$;

-- 2. Repoint inventory columns from customers.id to their reservation_id
UPDATE public.sauna_inventory si
SET current_customer_id = c.reservation_id
FROM public.customers c
WHERE si.current_customer_id = c.id;

UPDATE public.sauna_inventory si
SET future_customer_id = c.reservation_id
FROM public.customers c
WHERE si.future_customer_id = c.id;

-- 3. For any inventory row that still has customer text but no id, create a reservation
DO $$
DECLARE
  s RECORD;
  new_res_id uuid;
  fn text; ln text;
BEGIN
  FOR s IN
    SELECT * FROM public.sauna_inventory
    WHERE current_customer_id IS NULL
      AND current_customer IS NOT NULL
      AND btrim(current_customer) <> ''
  LOOP
    fn := COALESCE(NULLIF(split_part(s.current_customer, ' ', 1), ''), 'Unknown');
    ln := COALESCE(NULLIF(btrim(substring(s.current_customer from position(' ' in s.current_customer)+1)), ''), '-');
    INSERT INTO public.reservations (
      sauna_type_id, first_name, last_name, email, preferred_install_at,
      reservation_status, payment_status, reservation_source, admin_notes
    ) VALUES (
      s.sauna_type_id, fn, ln,
      'backfill+cur+' || s.id::text || '@sfsaunarental.invalid',
      COALESCE(s.install_date::timestamptz, now()),
      'Confirmed', 'Manual', 'Backfill',
      'Backfilled from inventory current_customer'
    ) RETURNING id INTO new_res_id;
    UPDATE public.sauna_inventory SET current_customer_id = new_res_id WHERE id = s.id;
  END LOOP;

  FOR s IN
    SELECT * FROM public.sauna_inventory
    WHERE future_customer_id IS NULL
      AND future_customer IS NOT NULL
      AND btrim(future_customer) <> ''
  LOOP
    fn := COALESCE(NULLIF(split_part(s.future_customer, ' ', 1), ''), 'Unknown');
    ln := COALESCE(NULLIF(btrim(substring(s.future_customer from position(' ' in s.future_customer)+1)), ''), '-');
    INSERT INTO public.reservations (
      sauna_type_id, first_name, last_name, email, preferred_install_at,
      reservation_status, payment_status, reservation_source, admin_notes
    ) VALUES (
      s.sauna_type_id, fn, ln,
      'backfill+fut+' || s.id::text || '@sfsaunarental.invalid',
      COALESCE(s.available_date::timestamptz, now()),
      'Confirmed', 'Manual', 'Backfill',
      'Backfilled from inventory future_customer'
    ) RETURNING id INTO new_res_id;
    UPDATE public.sauna_inventory SET future_customer_id = new_res_id WHERE id = s.id;
  END LOOP;
END $$;

-- 4. Drop the customers table
DROP TABLE public.customers CASCADE;

-- 5. Re-add FKs on inventory customer columns, now referencing reservations
ALTER TABLE public.sauna_inventory
  DROP CONSTRAINT IF EXISTS sauna_inventory_current_customer_id_fkey,
  DROP CONSTRAINT IF EXISTS sauna_inventory_future_customer_id_fkey;

ALTER TABLE public.sauna_inventory
  ADD CONSTRAINT sauna_inventory_current_customer_reservation_fkey
    FOREIGN KEY (current_customer_id) REFERENCES public.reservations(id) ON DELETE SET NULL,
  ADD CONSTRAINT sauna_inventory_future_customer_reservation_fkey
    FOREIGN KEY (future_customer_id) REFERENCES public.reservations(id) ON DELETE SET NULL;

-- Re-enable triggers
ALTER TABLE public.sauna_inventory ENABLE TRIGGER USER;
