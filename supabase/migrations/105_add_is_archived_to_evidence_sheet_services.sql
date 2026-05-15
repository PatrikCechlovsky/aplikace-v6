-- FILE: supabase/migrations/105_add_is_archived_to_evidence_sheet_services.sql
-- PURPOSE: Přidat is_archived sloupec do contract_evidence_sheet_services pro konzistenci s unit_services
-- NOTES: Umožňuje archivaci jednotlivých služeb v evidenčním listu

ALTER TABLE public.contract_evidence_sheet_services
  ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_contract_evidence_sheet_services_archived
  ON public.contract_evidence_sheet_services(sheet_id) WHERE is_archived = FALSE;

COMMENT ON COLUMN public.contract_evidence_sheet_services.is_archived IS 'Archivace vazby služby v evidenčním listu';
