BEGIN;
SET LOCAL lock_timeout = '5s';

-- Match the standard Traditional family already used by the live booking
-- allocator. Keep physical model keys and separate Original Collection intact.
CREATE OR REPLACE VIEW public.public_sauna_availability AS
SELECT st.id AS sauna_type_id,
    COALESCE(sum(
        CASE
            WHEN si.status = 'Available'::text AND si.current_customer_id IS NULL AND si.future_customer_id IS NULL AND si.retired_on IS NULL AND si.condition_state = 'ready'::text THEN 1
            ELSE 0
        END), 0::bigint)::integer AS available_now,
    min(
        CASE
            WHEN si.future_customer_id IS NULL AND si.retired_on IS NULL AND si.condition_state = 'ready'::text AND (si.status = 'Incoming'::text AND si.current_customer_id IS NULL AND si.incoming_eta IS NOT NULL AND si.available_date > si.incoming_eta OR si.current_customer_id IS NOT NULL AND si.status <> 'Sold'::text AND si.planned_pickup_on >= (now() AT TIME ZONE 'America/Los_Angeles'::text)::date AND si.available_date >= si.planned_pickup_on) THEN si.available_date
            ELSE NULL::date
        END) AS next_available_date
   FROM sauna_types st
     LEFT JOIN sauna_inventory si ON si.style = st.style AND (si.model_key = st.model_key OR (
        st.style = 'traditional' AND st.model_key = 'standard'
        AND si.model_key IN ('v1_fir_cedar', 'v2_cedar')
     )) AND (st.location = ANY (si.locations))
  GROUP BY st.id;

NOTIFY pgrst, 'reload schema';
COMMIT;
