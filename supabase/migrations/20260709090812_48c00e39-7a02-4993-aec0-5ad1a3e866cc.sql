GRANT INSERT ON public.reservations TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reservations TO authenticated;
GRANT ALL ON public.reservations TO service_role;
GRANT SELECT ON public.sauna_types TO anon, authenticated;
GRANT ALL ON public.sauna_types TO service_role;
GRANT SELECT ON public.availability_events TO anon, authenticated;
GRANT ALL ON public.availability_events TO service_role;