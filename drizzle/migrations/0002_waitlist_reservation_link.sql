ALTER TABLE public.waitlist_entries ADD COLUMN IF NOT EXISTS reservation_id uuid REFERENCES public.reservations(id) ON DELETE CASCADE;
CREATE UNIQUE INDEX IF NOT EXISTS waitlist_entries_reservation_id_key ON public.waitlist_entries(reservation_id);
ALTER TABLE public.waitlist_entries ADD COLUMN IF NOT EXISTS reason text;
DROP POLICY IF EXISTS "Anyone can join waitlist" ON public.waitlist_entries;