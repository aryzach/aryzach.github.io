-- Private read-only source snapshots; no payment, reservation or inventory writers.
BEGIN;
SET LOCAL lock_timeout='5s';
ALTER TABLE public.xero_customer_links ADD COLUMN organisation_short_code text CHECK(organisation_short_code IS NULL OR organisation_short_code ~ '^![A-Za-z0-9_-]+$');
CREATE TABLE public.xero_customer_history (
 tenant_id uuid NOT NULL,contact_id uuid NOT NULL,contact_name text NOT NULL,
 contact_source jsonb NOT NULL CHECK(jsonb_typeof(contact_source)='object'),
 transactions jsonb NOT NULL CHECK(jsonb_typeof(transactions)='array'),
 pending_matches jsonb NOT NULL DEFAULT '[]'::jsonb CHECK(jsonb_typeof(pending_matches)='array'),
 review_state text NOT NULL CHECK(review_state IN('customer','needs_classification')),
 source_version text NOT NULL CHECK(source_version ~ '^[0-9a-f]{64}$'),
 snapshot_at timestamptz NOT NULL,
 coverage jsonb NOT NULL CHECK(jsonb_typeof(coverage)='object'),
 PRIMARY KEY(tenant_id,contact_id)
);
ALTER TABLE public.xero_customer_history ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.xero_customer_history FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE ON public.xero_customer_history TO service_role;
NOTIFY pgrst,'reload schema';
COMMIT;
