-- Browsers read the public catalog and aggregate availability only. Customer,
-- contract, financial, integration and send-history access goes through the
-- authenticated/password-verified Edge Functions, using service_role.
REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM PUBLIC, anon, authenticated;
REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM PUBLIC, anon, authenticated;
REVOKE ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.sauna_types, public.public_sauna_availability,
  public.pricing_tiers, public.pricing_config, public.app_config
  TO anon, authenticated;
-- service_role and owner grants are preserved. The availability view keeps its
-- reviewed aggregate definition; making it security_invoker would hide stock
-- because clients cannot read the underlying customer-bearing inventory table.
