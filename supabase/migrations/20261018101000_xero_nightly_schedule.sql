-- Hosted scheduling only. A short-lived, single-use dispatch value grants only a sync trigger,
-- never access to accounting records. No admin password or long-lived provider credential in cron.
BEGIN;
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
CREATE FUNCTION public.dispatch_xero_nightly(p_verify boolean DEFAULT false) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,extensions,pg_temp AS $$
DECLARE nonce text; last_run timestamptz; result bigint;
BEGIN
 IF NOT p_verify AND extract(hour FROM now() AT TIME ZONE 'America/Los_Angeles')<>3 THEN RETURN; END IF;
 SELECT nightly_at INTO last_run FROM xero_sync_state WHERE tenant_id='8ea25f91-2a7f-4ba4-9eb1-7abe8582cfd4' FOR UPDATE;
 IF NOT p_verify AND (last_run AT TIME ZONE 'America/Los_Angeles')::date=(now() AT TIME ZONE 'America/Los_Angeles')::date THEN RETURN; END IF;
 IF EXISTS(SELECT 1 FROM xero_sync_state WHERE status='running' AND lease_until>now()) THEN RETURN; END IF;
 nonce=gen_random_uuid()::text||gen_random_uuid()::text;
 UPDATE xero_sync_state SET dispatch_hash=encode(digest(nonce,'sha256'),'hex'),dispatch_until=now()+interval '2 minutes',nightly_at=CASE WHEN p_verify THEN nightly_at ELSE now() END
 WHERE tenant_id='8ea25f91-2a7f-4ba4-9eb1-7abe8582cfd4';
 SELECT net.http_post(url:='https://vtmzagwocvgezbniewnu.supabase.co/functions/v1/xero-admin',
 headers:=jsonb_build_object('Content-Type','application/json','x-xero-dispatch',nonce),
 body:='{"action":"sync_now"}'::jsonb,timeout_milliseconds:=15000) INTO result;
END $$;
REVOKE ALL ON FUNCTION public.dispatch_xero_nightly(boolean) FROM PUBLIC,anon,authenticated,service_role;
-- Hourly clock check keeps 3 AM Pacific stable across daylight-saving changes.
SELECT cron.schedule('sf-sauna-xero-nightly','0 * * * *','SELECT public.dispatch_xero_nightly();');
COMMIT;
