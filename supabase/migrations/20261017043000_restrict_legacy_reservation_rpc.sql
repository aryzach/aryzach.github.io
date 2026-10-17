-- Current reservation writes use the token/validation-protected Edge Functions.
-- This legacy SECURITY DEFINER RPC must not bypass their migration gate.
REVOKE EXECUTE ON FUNCTION public.create_reservation_with_hold(
  text, text, text, text, text, text, text, text, integer, timestamptz
) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.create_reservation_with_hold(
  text, text, text, text, text, text, text, text, integer, timestamptz
) TO service_role;
