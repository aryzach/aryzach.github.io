BEGIN;
-- Only unsigned/future quote catalog values change. Signed contract snapshots,
-- customer records, physical assignments and payment records are untouched.
DELETE FROM public.pricing_tiers WHERE sauna_type_id IN ('indoor_infrared_standard','outdoor_infrared_standard','indoor_traditional_original','outdoor_traditional_original') AND commitment_months NOT IN(6,12,24);
INSERT INTO public.pricing_tiers(sauna_type_id,commitment_months,monthly_price,install_fee)
SELECT x.id,m.months,
 CASE WHEN x.id='indoor_infrared_standard' THEN CASE m.months WHEN 6 THEN 300 WHEN 12 THEN 200 ELSE 150 END
 ELSE CASE m.months WHEN 6 THEN 400 WHEN 12 THEN 300 ELSE 200 END END,0
FROM (VALUES('indoor_infrared_standard'),('outdoor_infrared_standard'),('indoor_traditional_original'),('outdoor_traditional_original')) x(id)
CROSS JOIN (VALUES(6),(12),(24)) m(months)
ON CONFLICT(sauna_type_id,commitment_months) DO UPDATE SET monthly_price=excluded.monthly_price,install_fee=0,badge=NULL,updated_at=now();
COMMIT;
