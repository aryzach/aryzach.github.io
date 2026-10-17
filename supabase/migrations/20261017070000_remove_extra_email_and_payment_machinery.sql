-- Restore the pre-migration email/payment schema after restoring the handlers.
-- Refuse to discard any tracking data or email-history linkage.
BEGIN;
SET LOCAL lock_timeout = '5s';
LOCK TABLE public.reservations, public.reservation_email_events,
  public.reservation_email_dispatches, public.reservation_notification_intents
  IN ACCESS EXCLUSIVE MODE;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM public.reservation_email_dispatches)
    OR EXISTS (SELECT 1 FROM public.reservation_notification_intents)
    OR EXISTS (SELECT 1 FROM public.reservation_email_events WHERE dispatch_id IS NOT NULL) THEN
    RAISE EXCEPTION 'Tracking records require preservation before removing this machinery';
  END IF;
END $$;

DROP TRIGGER reservation_notification_intent_insert ON public.reservations;
DROP TRIGGER reservation_notification_intent_paid ON public.reservations;
DROP FUNCTION public.queue_reservation_notification();
DROP FUNCTION public.apply_reservation_payment(uuid,text,text,text);
DROP FUNCTION public.claim_reservation_email(uuid,text,text,boolean,uuid);
DROP FUNCTION public.finish_reservation_email(uuid,uuid,text,text,text);
ALTER TABLE public.reservation_email_events DROP COLUMN dispatch_id;
DROP TABLE public.reservation_notification_intents;
DROP TABLE public.reservation_email_dispatches;
COMMIT;
