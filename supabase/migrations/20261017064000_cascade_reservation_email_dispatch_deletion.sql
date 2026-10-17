-- Email dispatch records belong to their reservation, just like email events
-- and notification intents. Do not let them block the existing admin deletion.
ALTER TABLE public.reservation_email_dispatches
  DROP CONSTRAINT reservation_email_dispatches_reservation_id_fkey,
  ADD CONSTRAINT reservation_email_dispatches_reservation_id_fkey
    FOREIGN KEY (reservation_id) REFERENCES public.reservations(id) ON DELETE CASCADE;
