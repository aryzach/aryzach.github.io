
-- Pricing tiers per sauna type + commitment length
CREATE TABLE public.pricing_tiers (
  sauna_type_id text NOT NULL REFERENCES public.sauna_types(id) ON DELETE CASCADE,
  commitment_months integer NOT NULL CHECK (commitment_months IN (1, 3, 6, 12)),
  monthly_price integer NOT NULL CHECK (monthly_price >= 0),
  install_fee integer NOT NULL DEFAULT 0 CHECK (install_fee >= 0),
  badge text CHECK (badge IN ('Most Popular', 'Best Value')),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (sauna_type_id, commitment_months)
);

GRANT SELECT ON public.pricing_tiers TO authenticated;
GRANT ALL ON public.pricing_tiers TO service_role;

ALTER TABLE public.pricing_tiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read pricing tiers"
  ON public.pricing_tiers FOR SELECT
  TO authenticated
  USING (true);

CREATE TRIGGER pricing_tiers_updated_at
  BEFORE UPDATE ON public.pricing_tiers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Flat pricing config (add-ons, deposits, delivery)
CREATE TABLE public.pricing_config (
  key text PRIMARY KEY,
  value_int integer NOT NULL,
  description text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.pricing_config TO authenticated;
GRANT ALL ON public.pricing_config TO service_role;

ALTER TABLE public.pricing_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read pricing config"
  ON public.pricing_config FOR SELECT
  TO authenticated
  USING (true);

CREATE TRIGGER pricing_config_updated_at
  BEFORE UPDATE ON public.pricing_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed pricing_tiers with current values
INSERT INTO public.pricing_tiers (sauna_type_id, commitment_months, monthly_price, install_fee, badge) VALUES
  -- Traditional latest indoor
  ('indoor_outdoor_traditional_latest', 1, 1300, 500, NULL),
  ('indoor_outdoor_traditional_latest', 3, 700, 500, NULL),
  ('indoor_outdoor_traditional_latest', 6, 600, 0, 'Most Popular'),
  ('indoor_outdoor_traditional_latest', 12, 400, 0, 'Best Value'),
  -- Traditional latest outdoor
  ('outdoor_traditional_latest', 1, 1300, 500, NULL),
  ('outdoor_traditional_latest', 3, 700, 500, NULL),
  ('outdoor_traditional_latest', 6, 600, 0, 'Most Popular'),
  ('outdoor_traditional_latest', 12, 400, 0, 'Best Value'),
  -- Infrared indoor
  ('indoor_infrared', 1, 500, 200, NULL),
  ('indoor_infrared', 3, 400, 200, NULL),
  ('indoor_infrared', 6, 300, 0, 'Most Popular'),
  ('indoor_infrared', 12, 200, 0, 'Best Value'),
  -- Infrared outdoor
  ('outdoor_infrared', 1, 600, 200, NULL),
  ('outdoor_infrared', 3, 500, 200, NULL),
  ('outdoor_infrared', 6, 400, 0, 'Most Popular'),
  ('outdoor_infrared', 12, 300, 0, 'Best Value'),
  -- Original Collection indoor
  ('indoor_traditional', 1, 900, 500, NULL),
  ('indoor_traditional', 3, 500, 500, NULL),
  ('indoor_traditional', 6, 400, 0, 'Most Popular'),
  ('indoor_traditional', 12, 300, 0, 'Best Value'),
  -- Original Collection outdoor
  ('outdoor_traditional_original', 1, 900, 500, NULL),
  ('outdoor_traditional_original', 3, 500, 500, NULL),
  ('outdoor_traditional_original', 6, 400, 0, 'Most Popular'),
  ('outdoor_traditional_original', 12, 300, 0, 'Best Value');

INSERT INTO public.pricing_config (key, value_int, description) VALUES
  ('insurance_monthly', 19, 'Monthly insurance add-on price (USD)'),
  ('second_heater_monthly', 209, 'Monthly second-heater add-on price, traditional saunas only (USD)'),
  ('delivery_fee_outside_sf', 150, 'Delivery fee outside San Francisco (USD)'),
  ('reservation_deposit_infrared', 200, 'Reservation deposit for infrared saunas (USD)'),
  ('reservation_deposit_traditional', 500, 'Reservation deposit for traditional saunas (USD)'),
  ('security_deposit_infrared', 500, 'Security deposit for infrared saunas (USD)'),
  ('security_deposit_traditional', 900, 'Security deposit for traditional saunas (USD)');
