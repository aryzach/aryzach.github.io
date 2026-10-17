-- A business commit must also commit the work needed after that commit.
-- Existing/imported rows are deliberately not backfilled: historical provider
-- outcomes must be reconciled rather than generating new customer messages.
CREATE TABLE public.reservation_notification_intents (
  reservation_id uuid NOT NULL REFERENCES public.reservations(id) ON DELETE CASCADE,
  email_type text NOT NULL CHECK (email_type IN ('reservation_created','payment_received')),
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  requires_review boolean NOT NULL DEFAULT false,
  last_error text,
  PRIMARY KEY (reservation_id, email_type)
);
ALTER TABLE public.reservation_notification_intents ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.reservation_notification_intents FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.reservation_notification_intents TO service_role;

CREATE FUNCTION public.queue_reservation_notification() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  -- Final source import sets this transaction-local flag, preserving history
  -- without treating an imported row as a newly created reservation/payment.
  IF current_setting('sf_migration.restoring', true) = 'on' THEN RETURN NEW; END IF;
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.reservation_notification_intents(reservation_id,email_type)
    VALUES(NEW.id,'reservation_created') ON CONFLICT DO NOTHING;
  ELSIF NEW.payment_status = 'Paid' AND OLD.payment_status IS DISTINCT FROM 'Paid' THEN
    INSERT INTO public.reservation_notification_intents(reservation_id,email_type)
    VALUES(NEW.id,'payment_received') ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.queue_reservation_notification() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER reservation_notification_intent_insert AFTER INSERT ON public.reservations
FOR EACH ROW EXECUTE FUNCTION public.queue_reservation_notification();
CREATE TRIGGER reservation_notification_intent_paid AFTER UPDATE OF payment_status ON public.reservations
FOR EACH ROW EXECUTE FUNCTION public.queue_reservation_notification();

-- Lock the reservation and chosen inventory row, then commit assignment,
-- payment, waitlist/history and notification intent in one transaction.
CREATE FUNCTION public.apply_reservation_payment(
  p_reservation_id uuid, p_session_id text, p_payment_intent_id text, p_customer_id text
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  r public.reservations%ROWTYPE;
  st public.sauna_types%ROWTYPE;
  chosen public.sauna_inventory%ROWTYPE;
  v_now timestamptz := now();
  v_hold_deadline timestamptz := now() + interval '5 days';
  v_customer_id text;
  v_linkage_missing boolean;
BEGIN
  IF p_session_id IS NULL OR length(p_session_id) = 0 THEN
    RAISE EXCEPTION 'checkout session required';
  END IF;
  SELECT * INTO r FROM public.reservations WHERE id=p_reservation_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'reservation not found'; END IF;
  IF r.payment_status = 'Paid' THEN
    RETURN jsonb_build_object('changed',false,'reservation_id',r.id);
  END IF;

  v_customer_id := r.stripe_customer_id;
  v_linkage_missing := r.stripe_customer_linkage_missing;
  IF nullif(p_customer_id,'') IS NULL THEN
    v_linkage_missing := true;
    INSERT INTO public.reservation_events(reservation_id,event_type,message,metadata)
    VALUES(r.id,'Stripe Customer Missing',
      'Checkout Session had no Customer. ACH connection is blocked until admin links a Customer.',
      jsonb_build_object('checkout_session_id',p_session_id));
  ELSIF r.stripe_customer_id IS NOT NULL AND r.stripe_customer_id <> p_customer_id THEN
    INSERT INTO public.reservation_events(reservation_id,event_type,message,metadata)
    VALUES(r.id,'Stripe Customer Mismatch',
      'Checkout Session Customer differs from existing reservation Customer. Not overwritten.',
      jsonb_build_object('existing',r.stripe_customer_id,'incoming',p_customer_id,'checkout_session_id',p_session_id));
  ELSE
    v_customer_id := p_customer_id;
    v_linkage_missing := false;
  END IF;

  -- Reuse an assignment made by another legitimate reservation workflow.
  -- The reservation lock serializes repeated payment events for this customer.
  SELECT * INTO chosen FROM public.sauna_inventory
    WHERE future_customer_id=r.id ORDER BY created_at,id LIMIT 1 FOR UPDATE;
  IF NOT FOUND THEN
    SELECT * INTO st FROM public.sauna_types WHERE id=r.sauna_type_id;
    IF FOUND THEN
      SELECT si.* INTO chosen FROM public.sauna_inventory si
      WHERE si.style=st.style
        AND (si.model_key=st.model_key OR (st.model_key='standard' AND si.model_key IN ('v1_fir_cedar','v2_cedar')))
        AND si.locations @> ARRAY[st.location]
        AND si.future_customer_id IS NULL
        AND si.current_customer_id IS DISTINCT FROM r.id
        AND si.status NOT IN ('Sold','Cancelled','Refunded')
        AND (si.status='Available' OR si.available_date IS NOT NULL)
      ORDER BY CASE WHEN si.status='Available' THEN '-infinity'::date ELSE si.available_date END,
        si.created_at,si.id
      LIMIT 1 FOR UPDATE SKIP LOCKED;
      IF FOUND THEN
        UPDATE public.sauna_inventory SET
          status=CASE WHEN current_customer_id IS NOT NULL THEN 'Transfer Planned' ELSE 'Reservation Hold' END,
          future_customer_id=r.id,
          future_customer=coalesce(nullif(trim(r.first_name || ' ' || r.last_name),''),r.email)
        WHERE id=chosen.id;
      END IF;
    END IF;
  END IF;

  UPDATE public.reservations SET
    payment_status='Paid',
    reservation_status=CASE WHEN chosen.id IS NULL THEN 'Needs Manual Review' ELSE 'Reservation Hold' END,
    sauna_inventory_id=chosen.id,
    stripe_payment_id=coalesce(p_payment_intent_id,p_session_id),
    stripe_checkout_session_id=p_session_id, stripe_payment_intent_id=p_payment_intent_id,
    payment_completed_at=v_now, hold_created_at=v_now,
    hold_deadline=CASE WHEN chosen.id IS NOT NULL THEN v_hold_deadline ELSE hold_deadline END,
    stripe_customer_id=v_customer_id, stripe_customer_linkage_missing=v_linkage_missing
  WHERE id=r.id;
  INSERT INTO public.reservation_events(reservation_id,event_type,message)
    VALUES(r.id,'Payment Received','Reservation payment received.');
  IF chosen.id IS NULL THEN
    INSERT INTO public.reservation_events(reservation_id,event_type,message)
      VALUES(r.id,'Needs Manual Review','No eligible sauna available for auto-assignment.');
    INSERT INTO public.waitlist_entries(reservation_id,first_name,last_name,email,phone,city,
      sauna_type_id,preferred_install_date,reservation_source,status,reason)
    VALUES(r.id,r.first_name,r.last_name,r.email,r.phone,r.city,r.sauna_type_id,
      r.preferred_install_at::date,r.reservation_source,'Open','Deposit paid, no matching sauna')
    ON CONFLICT(reservation_id) DO UPDATE SET
      first_name=excluded.first_name,last_name=excluded.last_name,email=excluded.email,
      phone=excluded.phone,city=excluded.city,sauna_type_id=excluded.sauna_type_id,
      preferred_install_date=excluded.preferred_install_date,reservation_source=excluded.reservation_source,
      status=excluded.status,reason=excluded.reason;
  ELSE
    INSERT INTO public.reservation_events(reservation_id,event_type,message,metadata)
    VALUES(r.id,'Reservation Hold Created','Sauna held (5-day informational deadline).',
      jsonb_build_object('sauna_inventory_id',chosen.id,'hold_deadline',v_hold_deadline));
  END IF;
  RETURN jsonb_build_object('changed',true,'reservation_id',r.id,'sauna_inventory_id',chosen.id);
END;
$$;
REVOKE ALL ON FUNCTION public.apply_reservation_payment(uuid,text,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.apply_reservation_payment(uuid,text,text,text) TO service_role;
