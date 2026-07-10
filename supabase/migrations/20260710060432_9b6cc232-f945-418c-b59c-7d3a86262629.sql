
-- ============================================================
-- Agreement Versions
-- ============================================================
CREATE TABLE public.agreement_versions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  version_name text NOT NULL,
  description text,
  master_pdf_storage_path text NOT NULL,
  is_active boolean NOT NULL DEFAULT false,
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.agreement_versions TO service_role;
ALTER TABLE public.agreement_versions ENABLE ROW LEVEL SECURITY;
-- No policies: only the service_role (via admin edge function with password gate) can access.

CREATE UNIQUE INDEX agreement_versions_one_active
  ON public.agreement_versions (is_active)
  WHERE is_active = true;

CREATE TRIGGER agreement_versions_updated_at
  BEFORE UPDATE ON public.agreement_versions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- Contracts
-- ============================================================
CREATE TABLE public.contracts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reservation_id uuid NOT NULL REFERENCES public.reservations(id) ON DELETE CASCADE,
  agreement_version_id uuid NOT NULL REFERENCES public.agreement_versions(id) ON DELETE RESTRICT,

  status text NOT NULL DEFAULT 'Not Started',
    -- 'Not Started' | 'Draft Created' | 'Ready to Sign' | 'Signed' | 'Voided' | 'Replacement Required'

  -- Snapshotted customer info
  customer_legal_name text NOT NULL,
  phone text,
  email text NOT NULL,
  installation_address text,

  -- Snapshotted commercial terms
  sauna_type text NOT NULL,
  placement text NOT NULL,  -- 'indoor' | 'outdoor'
  commitment_months integer NOT NULL,
  monthly_price integer NOT NULL,        -- USD dollars
  delivery_fee integer NOT NULL,         -- USD dollars
  security_deposit integer NOT NULL,     -- USD dollars
  insurance_selected boolean NOT NULL DEFAULT false,
  insurance_monthly_price integer NOT NULL DEFAULT 0,
  second_heater_selected boolean NOT NULL DEFAULT false,
  second_heater_monthly_price integer NOT NULL DEFAULT 0,
  stair_elevator_charge integer,         -- NULL = "to be confirmed"
  preferred_installation_date date,

  rental_summary_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  pricing_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  admin_overrides jsonb NOT NULL DEFAULT '{}'::jsonb,

  generated_at timestamptz,
  signed_at timestamptz,
  voided_at timestamptz,
  void_reason text,
  replaces_contract_id uuid REFERENCES public.contracts(id) ON DELETE SET NULL,

  signed_pdf_storage_path text,
  signed_pdf_hash text,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX contracts_reservation_id_idx ON public.contracts (reservation_id);
CREATE INDEX contracts_status_idx ON public.contracts (status);

GRANT ALL ON public.contracts TO service_role;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER contracts_updated_at
  BEFORE UPDATE ON public.contracts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Prevent editing a signed contract's terms
CREATE OR REPLACE FUNCTION public.contracts_freeze_when_signed()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF OLD.status = 'Signed' THEN
    -- Only status transition to 'Voided' and setting voided_at / void_reason are allowed
    IF NEW.status NOT IN ('Signed', 'Voided') THEN
      RAISE EXCEPTION 'Cannot modify a signed contract';
    END IF;
    -- Prevent changing snapshotted fields
    IF NEW.customer_legal_name IS DISTINCT FROM OLD.customer_legal_name
       OR NEW.sauna_type IS DISTINCT FROM OLD.sauna_type
       OR NEW.placement IS DISTINCT FROM OLD.placement
       OR NEW.commitment_months IS DISTINCT FROM OLD.commitment_months
       OR NEW.monthly_price IS DISTINCT FROM OLD.monthly_price
       OR NEW.delivery_fee IS DISTINCT FROM OLD.delivery_fee
       OR NEW.security_deposit IS DISTINCT FROM OLD.security_deposit
       OR NEW.insurance_selected IS DISTINCT FROM OLD.insurance_selected
       OR NEW.insurance_monthly_price IS DISTINCT FROM OLD.insurance_monthly_price
       OR NEW.second_heater_selected IS DISTINCT FROM OLD.second_heater_selected
       OR NEW.second_heater_monthly_price IS DISTINCT FROM OLD.second_heater_monthly_price
       OR NEW.stair_elevator_charge IS DISTINCT FROM OLD.stair_elevator_charge
       OR NEW.preferred_installation_date IS DISTINCT FROM OLD.preferred_installation_date
       OR NEW.agreement_version_id IS DISTINCT FROM OLD.agreement_version_id
       OR NEW.signed_pdf_storage_path IS DISTINCT FROM OLD.signed_pdf_storage_path
       OR NEW.signed_pdf_hash IS DISTINCT FROM OLD.signed_pdf_hash
       OR NEW.signed_at IS DISTINCT FROM OLD.signed_at
    THEN
      RAISE EXCEPTION 'Cannot modify frozen fields on a signed contract';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER contracts_freeze_when_signed
  BEFORE UPDATE ON public.contracts
  FOR EACH ROW EXECUTE FUNCTION public.contracts_freeze_when_signed();

-- ============================================================
-- Contract Acknowledgments
-- ============================================================
CREATE TABLE public.contract_acknowledgments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id uuid NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  acknowledgment_key text NOT NULL,
  acknowledgment_text text NOT NULL,
  accepted boolean NOT NULL DEFAULT false,
  accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (contract_id, acknowledgment_key)
);

GRANT ALL ON public.contract_acknowledgments TO service_role;
ALTER TABLE public.contract_acknowledgments ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Contract Signature Audit
-- ============================================================
CREATE TABLE public.contract_signature_audit (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id uuid NOT NULL REFERENCES public.contracts(id) ON DELETE RESTRICT,
  typed_legal_name text NOT NULL,
  signed_at timestamptz NOT NULL DEFAULT now(),
  time_zone text,
  ip_address text,
  user_agent text,
  agreement_version text NOT NULL,
  reservation_id uuid NOT NULL,
  signed_pdf_hash text NOT NULL,
  electronic_consent_confirmed boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX contract_signature_audit_contract_id_idx
  ON public.contract_signature_audit (contract_id);

GRANT ALL ON public.contract_signature_audit TO service_role;
ALTER TABLE public.contract_signature_audit ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Contract Events (timeline)
-- ============================================================
CREATE TABLE public.contract_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id uuid NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  actor_type text NOT NULL DEFAULT 'system',  -- 'customer' | 'admin' | 'system'
  event_details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX contract_events_contract_id_idx
  ON public.contract_events (contract_id, created_at);

GRANT ALL ON public.contract_events TO service_role;
ALTER TABLE public.contract_events ENABLE ROW LEVEL SECURITY;
