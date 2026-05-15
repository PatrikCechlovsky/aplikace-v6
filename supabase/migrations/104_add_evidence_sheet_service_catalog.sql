-- FILE: supabase/migrations/104_add_evidence_sheet_service_catalog.sql
-- PURPOSE: Přidat vazbu služeb evidenčního listu na katalog služeb
-- NOTES: Přidává service_id pro join na service_catalog

ALTER TABLE public.contract_evidence_sheet_services
  ADD COLUMN IF NOT EXISTS service_id UUID REFERENCES public.service_catalog(id);

CREATE INDEX IF NOT EXISTS idx_contract_evidence_sheet_services_service
  ON public.contract_evidence_sheet_services(service_id);

COMMENT ON COLUMN public.contract_evidence_sheet_services.service_id IS 'FK → service_catalog (volitelné)';
