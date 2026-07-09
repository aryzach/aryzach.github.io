CREATE OR REPLACE VIEW public.paid_reservation_consumption
WITH (security_invoker = true)
AS
SELECT sauna_type_id, (preferred_install_at AT TIME ZONE 'UTC')::date AS preferred_install_date
FROM public.reservations
WHERE reservation_status NOT IN ('Cancelled','Refunded');
GRANT SELECT ON public.paid_reservation_consumption TO anon, authenticated;