-- Current cache only. No source revision/audit table. Operational dates and terms are never written here.
BEGIN;
ALTER TABLE public.xero_customer_history ADD COLUMN sync_ignored boolean NOT NULL DEFAULT false;
-- Owner excluded Colin Stewart from customer reconciliation. Source facts remain readable.
UPDATE public.xero_customer_history SET sync_ignored=true WHERE contact_id='1c934987-d1f9-4d62-a15f-e5d5e390bf9a' AND tenant_id='8ea25f91-2a7f-4ba4-9eb1-7abe8582cfd4';
CREATE TABLE public.xero_sync_state (
 tenant_id uuid PRIMARY KEY, status text NOT NULL DEFAULT 'idle' CHECK(status IN('idle','running','success','error')),
 lease_id uuid, lease_until timestamptz, started_at timestamptz, last_success_at timestamptz,
 last_full_at timestamptz, cursor_at timestamptz, error text, counts jsonb NOT NULL DEFAULT '{}',
 nightly_at timestamptz, dispatch_hash text, dispatch_until timestamptz
);
CREATE TABLE public.xero_sync_cache (
 tenant_id uuid NOT NULL, resource text NOT NULL CHECK(resource IN('Contacts','BankTransactions','Invoices','Payments','CreditNotes')),
 records jsonb NOT NULL CHECK(jsonb_typeof(records)='array'), PRIMARY KEY(tenant_id,resource)
);
CREATE TABLE public.xero_sync_reviews (
 tenant_id uuid NOT NULL, review_key text NOT NULL, kind text NOT NULL CHECK(kind IN('classification','unmatched','conflict')),
 contact_id uuid, customer_id uuid REFERENCES public.customer_profiles(id), source_id text,
 name text NOT NULL, message text NOT NULL, fingerprint text NOT NULL, acknowledged boolean NOT NULL DEFAULT false,
 PRIMARY KEY(tenant_id,review_key)
);
ALTER TABLE public.xero_sync_state ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.xero_sync_state FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.xero_sync_state TO service_role;
ALTER TABLE public.xero_sync_cache ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.xero_sync_cache FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.xero_sync_cache TO service_role;
ALTER TABLE public.xero_sync_reviews ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.xero_sync_reviews FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.xero_sync_reviews TO service_role;
INSERT INTO public.xero_sync_state(tenant_id) VALUES('8ea25f91-2a7f-4ba4-9eb1-7abe8582cfd4');

CREATE FUNCTION public.xero_sync_begin(p_tenant uuid,p_lease uuid,p_dispatch text DEFAULT NULL) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,extensions,pg_temp AS $$
DECLARE s xero_sync_state;
BEGIN
 IF p_tenant<>'8ea25f91-2a7f-4ba4-9eb1-7abe8582cfd4'::uuid OR NOT EXISTS(SELECT 1 FROM xero_oauth_connection WHERE id='primary' AND selected_tenant_id=p_tenant) THEN RAISE EXCEPTION 'Wrong organization'; END IF;
 SELECT * INTO s FROM xero_sync_state WHERE tenant_id=p_tenant FOR UPDATE;
 IF p_dispatch IS NOT NULL AND (s.dispatch_until IS NULL OR s.dispatch_until<now() OR s.dispatch_hash IS DISTINCT FROM encode(digest(p_dispatch,'sha256'),'hex')) THEN RAISE EXCEPTION 'Expired scheduler request'; END IF;
 IF s.status='running' AND s.lease_until>now() THEN RETURN jsonb_build_object('started',false); END IF;
 UPDATE xero_sync_state SET status='running',lease_id=p_lease,lease_until=now()+interval '5 minutes',started_at=now(),error=NULL,
 dispatch_hash=NULL,dispatch_until=NULL WHERE tenant_id=p_tenant;
 RETURN jsonb_build_object('started',true,'cursor',s.cursor_at,'full',p_dispatch IS NOT NULL OR s.last_full_at IS NULL OR s.last_full_at<now()-interval '20 hours');
END $$;

CREATE FUNCTION public.xero_sync_fail(p_tenant uuid,p_lease uuid,p_error text) RETURNS void
LANGUAGE sql SECURITY DEFINER SET search_path=public,pg_temp AS $$
 UPDATE xero_sync_state SET status='error',error=left(p_error,250),lease_until=NULL,lease_id=NULL
 WHERE tenant_id=p_tenant AND lease_id=p_lease;
$$;

CREATE FUNCTION public.xero_sync_publish(p_tenant uuid,p_lease uuid,p_payload jsonb) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE item jsonb; old_ack boolean; old_fingerprint text;
BEGIN
 PERFORM 1 FROM xero_sync_state WHERE tenant_id=p_tenant AND lease_id=p_lease AND status='running' AND lease_until>now() FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Sync lease expired'; END IF;
 IF p_payload->>'complete' IS DISTINCT FROM 'true' OR jsonb_array_length(p_payload->'cache')<>5 THEN RAISE EXCEPTION 'Incomplete source read'; END IF;
 LOCK TABLE xero_customer_links IN SHARE MODE;
 IF p_payload->'links' IS DISTINCT FROM (SELECT coalesce(jsonb_agg(jsonb_build_object('contact_id',contact_id,'customer_id',customer_id) ORDER BY contact_id),'[]') FROM xero_customer_links WHERE tenant_id=p_tenant) THEN RAISE EXCEPTION 'Customer mappings changed; retry sync'; END IF;
 FOR item IN SELECT value FROM jsonb_array_elements(p_payload->'cache') LOOP
 INSERT INTO xero_sync_cache(tenant_id,resource,records) VALUES(p_tenant,item->>'resource',item->'records')
 ON CONFLICT(tenant_id,resource) DO UPDATE SET records=excluded.records;
 END LOOP;
 FOR item IN SELECT value FROM jsonb_array_elements(p_payload->'histories') LOOP
 INSERT INTO xero_customer_history(tenant_id,contact_id,contact_name,contact_source,transactions,pending_matches,review_state,source_version,snapshot_at,coverage)
 VALUES(p_tenant,(item->>'contactId')::uuid,item->>'name',item->'contact',item->'transactions','[]',CASE WHEN (item->>'linked')::boolean THEN 'customer' ELSE 'needs_classification' END,item->>'hash',(p_payload->>'cursor')::timestamptz,p_payload->'coverage')
 ON CONFLICT(tenant_id,contact_id) DO UPDATE SET contact_name=excluded.contact_name,contact_source=excluded.contact_source,transactions=excluded.transactions,review_state=excluded.review_state,source_version=excluded.source_version,snapshot_at=excluded.snapshot_at,coverage=excluded.coverage;
 END LOOP;
 LOCK TABLE rental_payment_allocations IN SHARE ROW EXCLUSIVE MODE;
 FOR item IN SELECT value FROM jsonb_array_elements(p_payload->'replacements') LOOP
 IF item->'expectedActiveIds' IS DISTINCT FROM (SELECT coalesce(jsonb_agg(id ORDER BY id),'[]') FROM rental_payment_allocations WHERE tenant_id=p_tenant AND source_id=item->>'sourceId' AND voided_at IS NULL) THEN RAISE EXCEPTION 'Payment classifications changed; retry sync'; END IF;
 END LOOP;
 -- Replace only the affected payment projections. No old source version or voided copy is created.
 FOR item IN SELECT value FROM jsonb_array_elements(p_payload->'replacements') LOOP
 DELETE FROM rental_payment_allocations WHERE tenant_id=p_tenant AND source_id=item->>'sourceId';
 INSERT INTO rental_payment_allocations(tenant_id,source_id,customer_id,rental_id,sale_id,category,amount_cents,source_amount_cents,source_kind,currency,note)
 SELECT p_tenant,item->>'sourceId',x.customer_id,x.rental_id,x.sale_id,x.category,x.amount_cents,x.source_amount_cents,x.source_kind,x.currency,'Current Xero classification'
 FROM jsonb_to_recordset(item->'allocations') x(customer_id uuid,rental_id uuid,sale_id uuid,category text,amount_cents bigint,source_amount_cents bigint,source_kind text,currency text);
 END LOOP;
 -- Keep only the current review queue; acknowledgements survive an unchanged fingerprint.
 DELETE FROM xero_sync_reviews r WHERE tenant_id=p_tenant AND NOT EXISTS(SELECT 1 FROM jsonb_array_elements(p_payload->'reviews') j WHERE j->>'key'=r.review_key);
 FOR item IN SELECT value FROM jsonb_array_elements(p_payload->'reviews') LOOP
 INSERT INTO xero_sync_reviews(tenant_id,review_key,kind,contact_id,customer_id,source_id,name,message,fingerprint)
 VALUES(p_tenant,item->>'key',item->>'kind',(item->>'contactId')::uuid,(item->>'customerId')::uuid,item->>'sourceId',item->>'name',item->>'message',item->>'fingerprint')
 ON CONFLICT(tenant_id,review_key) DO UPDATE SET kind=excluded.kind,contact_id=excluded.contact_id,customer_id=excluded.customer_id,source_id=excluded.source_id,name=excluded.name,message=excluded.message,
 acknowledged=CASE WHEN xero_sync_reviews.fingerprint=excluded.fingerprint THEN xero_sync_reviews.acknowledged ELSE false END,fingerprint=excluded.fingerprint;
 END LOOP;
 UPDATE xero_sync_state SET status='success',last_success_at=now(),cursor_at=(p_payload->>'cursor')::timestamptz,
 last_full_at=CASE WHEN (p_payload->>'full')::boolean THEN now() ELSE last_full_at END,
 counts=p_payload->'counts',lease_until=NULL,lease_id=NULL,error=NULL WHERE tenant_id=p_tenant;
END $$;

CREATE FUNCTION public.xero_sync_acknowledge(p_tenant uuid,p_key text,p_fingerprint text) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 UPDATE xero_sync_reviews SET acknowledged=true WHERE tenant_id=p_tenant AND review_key=p_key AND fingerprint=p_fingerprint AND (kind='classification' OR review_key LIKE 'date:%');
 RETURN FOUND;
END $$;
REVOKE ALL ON FUNCTION public.xero_sync_begin(uuid,uuid,text),public.xero_sync_fail(uuid,uuid,text),public.xero_sync_publish(uuid,uuid,jsonb),public.xero_sync_acknowledge(uuid,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.xero_sync_begin(uuid,uuid,text),public.xero_sync_fail(uuid,uuid,text),public.xero_sync_publish(uuid,uuid,jsonb),public.xero_sync_acknowledge(uuid,text,text) TO service_role;
NOTIFY pgrst,'reload schema';
COMMIT;
