-- Stable, owner-reviewed Xero identities. No reservation or inventory mutation.
BEGIN;
SET LOCAL lock_timeout='5s';
CREATE TABLE public.xero_customer_links (
 tenant_id uuid NOT NULL,
 contact_id uuid NOT NULL,
 customer_id uuid NOT NULL REFERENCES public.customer_profiles(id) ON DELETE RESTRICT,
 contact_name text NOT NULL,
 source_version text NOT NULL CHECK(source_version ~ '^[0-9a-f]{64}$'),
 origin text NOT NULL CHECK(origin IN('approved_review','historical_customer_import')),
 notes text,
 reviewed_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(tenant_id,contact_id)
);
CREATE INDEX xero_customer_links_customer ON public.xero_customer_links(customer_id);
ALTER TABLE public.xero_customer_links ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.xero_customer_links FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE ON public.xero_customer_links TO service_role;
NOTIFY pgrst,'reload schema';
COMMIT;
