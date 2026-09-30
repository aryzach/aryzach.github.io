CREATE OR REPLACE FUNCTION public.sauna_inventory_fill_committed_until()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE m integer;
BEGIN
  IF NEW.status = 'Installed' AND NEW.install_date IS NOT NULL
     AND NEW.minimum_term_ends IS NULL AND NEW.current_customer_id IS NOT NULL THEN
    SELECT c.commitment_months INTO m FROM public.contracts c
      WHERE c.reservation_id = NEW.current_customer_id AND c.voided_at IS NULL
      ORDER BY (c.signed_at IS NOT NULL) DESC, c.created_at DESC LIMIT 1;
    IF m IS NULL THEN
      SELECT COALESCE(r.custom_commitment_months, r.min_commitment_months) INTO m
        FROM public.reservations r WHERE r.id = NEW.current_customer_id;
    END IF;
    IF m IS NOT NULL AND m > 0 THEN
      NEW.minimum_term_ends := (NEW.install_date + make_interval(months => m))::date;
    END IF;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_sauna_inventory_fill_committed_until ON public.sauna_inventory;
CREATE TRIGGER trg_sauna_inventory_fill_committed_until
BEFORE INSERT OR UPDATE ON public.sauna_inventory
FOR EACH ROW EXECUTE FUNCTION public.sauna_inventory_fill_committed_until();

UPDATE public.sauna_inventory SET minimum_term_ends = NULL
WHERE status = 'Installed' AND install_date IS NOT NULL AND minimum_term_ends IS NULL AND current_customer_id IS NOT NULL;