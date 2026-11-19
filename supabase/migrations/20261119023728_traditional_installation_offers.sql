BEGIN;
ALTER TABLE public.pricing_tiers DROP CONSTRAINT pricing_tiers_commitment_months_check;
ALTER TABLE public.pricing_tiers ADD CONSTRAINT pricing_tiers_commitment_months_check CHECK (commitment_months IN (1,3,6,12,24,36));
INSERT INTO public.pricing_tiers(sauna_type_id,commitment_months,monthly_price,install_fee)
SELECT id,36,300,0 FROM public.sauna_types WHERE style='traditional'
ON CONFLICT(sauna_type_id,commitment_months) DO UPDATE SET monthly_price=300,install_fee=0,updated_at=now();
-- February offers are distinct, server-validated contract variants; never overwrite
-- the ordinary 12/24-month tiers or any existing signed contract/booking records.
COMMIT;
