-- REVIEW ONLY. Not a migration. Do not apply until live schema and migration ledger are verified.
-- Names are intentionally distinct from the historical, dropped public.customers table.
BEGIN;
CREATE TABLE public.customer_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name text NOT NULL CHECK (length(trim(display_name)) > 0),
  email text, phone text,
  origin text NOT NULL CHECK (origin IN ('app_review', 'xero_review')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.customer_profile_reservations (
  reservation_id uuid PRIMARY KEY REFERENCES public.reservations(id) ON DELETE RESTRICT,
  customer_id uuid NOT NULL REFERENCES public.customer_profiles(id) ON DELETE RESTRICT
);
CREATE TABLE public.xero_history_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL,
  status text NOT NULL CHECK (status IN ('pending', 'running', 'failed', 'source_complete', 'reconciled')),
  started_at timestamptz NOT NULL DEFAULT now(), completed_at timestamptz,
  coverage jsonb NOT NULL DEFAULT '{}'::jsonb,
  -- Per-resource page/checkpoint, observed min/max dates, counts, errors and reconciliation state.
  -- source_complete means pages were exhausted; it never means financial reconciliation passed.
  UNIQUE (id, tenant_id)
);
CREATE TABLE public.xero_history_records (
  tenant_id uuid NOT NULL, resource text NOT NULL CHECK (resource IN ('Contacts','Invoices','CreditNotes','Payments')),
  source_id uuid NOT NULL, source_version text NOT NULL,
  payload jsonb NOT NULL, imported_at timestamptz NOT NULL DEFAULT now(),
  run_id uuid NOT NULL,
  PRIMARY KEY (tenant_id, resource, source_id),
  FOREIGN KEY (run_id, tenant_id) REFERENCES public.xero_history_runs(id, tenant_id) ON DELETE RESTRICT
);
CREATE TABLE public.xero_customer_reviews (
  tenant_id uuid NOT NULL, contact_id uuid NOT NULL,
  source_resource text NOT NULL DEFAULT 'Contacts' CHECK (source_resource = 'Contacts'),
  source_version text NOT NULL, revision integer NOT NULL DEFAULT 0 CHECK (revision >= 0),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','linked','created','excluded','deferred')),
  customer_id uuid REFERENCES public.customer_profiles(id) ON DELETE RESTRICT,
  reason text, reviewed_at timestamptz,
  PRIMARY KEY (tenant_id, contact_id),
  FOREIGN KEY (tenant_id, source_resource, contact_id)
    REFERENCES public.xero_history_records(tenant_id, resource, source_id) ON DELETE RESTRICT,
  CHECK ((status IN ('linked','created')) = (customer_id IS NOT NULL)),
  CHECK (status NOT IN ('excluded','deferred') OR coalesce(length(trim(reason)), 0) > 0)
);
-- Several Xero contacts can belong to one reviewed app customer. Each tenant/contact has one decision.
CREATE TABLE public.xero_customer_review_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL, contact_id uuid NOT NULL,
  revision integer NOT NULL, action text NOT NULL, decision jsonb NOT NULL,
  actor text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, contact_id, revision),
  FOREIGN KEY (tenant_id, contact_id) REFERENCES public.xero_customer_reviews(tenant_id, contact_id) ON DELETE RESTRICT
);
DO $$ DECLARE table_name text; BEGIN
  FOREACH table_name IN ARRAY ARRAY['customer_profiles','customer_profile_reservations','xero_history_runs',
    'xero_history_records','xero_customer_reviews','xero_customer_review_events'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
    EXECUTE format('REVOKE ALL ON public.%I FROM PUBLIC, anon, authenticated', table_name);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO service_role', table_name);
  END LOOP;
END $$;
COMMIT;
