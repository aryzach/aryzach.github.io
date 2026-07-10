
ALTER TABLE public.contract_signature_audit DROP CONSTRAINT IF EXISTS contract_signature_audit_contract_id_fkey;
ALTER TABLE public.contract_signature_audit ADD CONSTRAINT contract_signature_audit_contract_id_fkey FOREIGN KEY (contract_id) REFERENCES public.contracts(id) ON DELETE CASCADE;

ALTER TABLE public.contract_acknowledgments DROP CONSTRAINT IF EXISTS contract_acknowledgments_contract_id_fkey;
ALTER TABLE public.contract_acknowledgments ADD CONSTRAINT contract_acknowledgments_contract_id_fkey FOREIGN KEY (contract_id) REFERENCES public.contracts(id) ON DELETE CASCADE;

ALTER TABLE public.contract_events DROP CONSTRAINT IF EXISTS contract_events_contract_id_fkey;
ALTER TABLE public.contract_events ADD CONSTRAINT contract_events_contract_id_fkey FOREIGN KEY (contract_id) REFERENCES public.contracts(id) ON DELETE CASCADE;

ALTER TABLE public.contracts DROP CONSTRAINT IF EXISTS contracts_reservation_id_fkey;
ALTER TABLE public.contracts ADD CONSTRAINT contracts_reservation_id_fkey FOREIGN KEY (reservation_id) REFERENCES public.reservations(id) ON DELETE CASCADE;
