DROP POLICY IF EXISTS "reservations anon insert" ON public.reservations;
DROP POLICY IF EXISTS "Anyone can submit reservations" ON public.reservations;
DROP POLICY IF EXISTS "Public can submit reservation requests" ON public.reservations;

CREATE POLICY "Public can submit reservation requests"
ON public.reservations
FOR INSERT
TO anon, authenticated
WITH CHECK (
  length(btrim(first_name)) > 0
  AND length(btrim(last_name)) > 0
  AND email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'
  AND length(btrim(phone)) >= 7
  AND length(btrim(install_address)) > 0
  AND placement_choice IN ('indoor', 'outdoor', 'either')
  AND min_commitment_months IN (6, 12)
  AND sauna_type_id IN (
    'indoor_infrared',
    'outdoor_infrared',
    'indoor_traditional',
    'indoor_outdoor_traditional_latest',
    'outdoor_traditional_latest'
  )
  AND preferred_install_at >= now()
  AND reservation_status = 'Pending Payment'
  AND payment_status = 'Pending'
  AND contract_status = 'Not Sent'
  AND id_status = 'Not Uploaded'
  AND consult_status = 'Not Scheduled'
);