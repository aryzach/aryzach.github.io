
GRANT SELECT ON public.pricing_tiers TO anon;
GRANT SELECT ON public.pricing_config TO anon;

CREATE POLICY "Anyone can read pricing tiers"
  ON public.pricing_tiers FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anyone can read pricing config"
  ON public.pricing_config FOR SELECT
  TO anon
  USING (true);
