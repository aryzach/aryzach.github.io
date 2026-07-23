UPDATE public.pricing_tiers
SET monthly_price = 1400, install_fee = 1000
WHERE sauna_type_id IN ('indoor_outdoor_traditional_latest', 'outdoor_traditional_latest')
  AND commitment_months = 1;

UPDATE public.pricing_tiers
SET monthly_price = 900, install_fee = 1000
WHERE sauna_type_id IN ('indoor_outdoor_traditional_latest', 'outdoor_traditional_latest')
  AND commitment_months = 3;

UPDATE public.pricing_tiers
SET monthly_price = 800, install_fee = 0
WHERE sauna_type_id IN ('indoor_outdoor_traditional_latest', 'outdoor_traditional_latest')
  AND commitment_months = 6;

UPDATE public.pricing_tiers
SET monthly_price = 600, install_fee = 0
WHERE sauna_type_id IN ('indoor_outdoor_traditional_latest', 'outdoor_traditional_latest')
  AND commitment_months = 12;
